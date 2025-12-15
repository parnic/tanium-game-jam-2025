import type { Tile, TiledResource } from "@excaliburjs/plugin-tiled";
import {
  type Actor,
  clamp,
  type Engine,
  Entity,
  Logger,
  lerp,
  toDegrees,
  Vector,
  vec,
} from "excalibur";
import {
  isUpgradeUIData,
  UpgradeAttribute,
  type UpgradeUIData,
} from "./components/upgrade-component";
import type { Enemy } from "./enemy";
import type { GameActor } from "./game-actor";
import { GameEngine } from "./game-engine";
import type { Player } from "./player";
import { Resources } from "./resources";
import { GameLevel } from "./scenes/game-level";
import { rand } from "./utilities/math";
import { OrbitDurationMs, WeaponActor } from "./weapon-actor";

export interface WeaponData {
  name: string;
  tileName?: string; // if set, uses this instead of "name" when grabbing the tile to use for this weapon's graphic
  displayName: string;
  baseSpeed: number;
  baseDamage: number;
  baseScale?: number;
  baseSpawnIntervalMs: number;
  baseAmount?: number;
  baseLifetime?: number;
  spawnBehavior:
    | "targetNearestEnemy"
    | "ownerFacing"
    | "orbit"
    | "ownerLocation"
    | undefined;
  spawns?: string; // indicates that this weapon spawns a sub-weapon of its own
  spawnsTrigger: "onSpawn" | "onDeath" | undefined; // when "spawns" is set, this indicates when to spawn the "spawns" sub-weapon
  childSpawnBehavior?: string;
  targetBehavior: "tracking" | undefined;
  collides?: boolean;
  amountAddsSpread?: boolean; // for something like a shotgun, "amount" means how many projectiles to spawn at once whereas with a rocket we want to spawn them one after another.
  spreadPattern: "evenRotation" | "distributePosition" | undefined;
  spreadVariance?: number;
  spreadVarianceUnits: "degrees" | "radians" | "pixels" | undefined;
  selectable?: boolean;
  acceleration?: number; // a multiplier applied to speed, scaled per second, to slow it down (values <0) or speed it up (values>0). speed += speed * acceleration * elapsedSeconds
}

const minMultiSpawnDelayMs = 30;
const maxMultiSpawnDelayMs = 150;

const phi = (Math.sqrt(5) + 1) / 2;
const goldenSpiralAngleStep = (2 * Math.PI) / phi ** 2;

export class Weapon extends Entity {
  level: TiledResource;
  tile?: Tile;
  lastSpawnedTimeMs?: number;
  lastDelayedSpawnTimeMs?: number;
  aliveTime = 0;
  owner: GameActor;
  outlivesOwner = false; // implies that the only way this weapon dies is when its spawned actors have all expired
  playerOwner: Player;
  definition: WeaponData;
  spawnBehaviorOverride?: string;
  childDefinition?: WeaponData;
  childTile?: Tile;
  speed: number;
  damage: number;
  size: number;
  intervalMs: number;
  amount: number;
  lifetimeMs?: number;
  pendingDelayedSpawnAmount = 0;
  pendingDelayedSpawnInterval = maxMultiSpawnDelayMs;
  damageDealt = 0;
  kills = 0;
  private spawnedWeaponActors: WeaponActor[] = [];

  constructor(data: WeaponData, level: TiledResource, owner: GameActor) {
    super({
      name: `weapon-${data.name}`,
    });

    this.definition = data;
    this.level = level;
    this.owner = owner;
    this.playerOwner =
      this.owner instanceof WeaponActor
        ? (this.owner.weapon.owner as Player)
        : (this.owner as Player);

    this.speed = data.baseSpeed;
    this.damage = data.baseDamage;
    this.size = data.baseScale ?? 1;
    this.intervalMs = data.baseSpawnIntervalMs;
    this.amount = data.baseAmount ?? 1;
    this.lifetimeMs = data.baseLifetime;

    if (this.definition.spawns) {
      const childWeapon = Resources.WeaponData.data.find(
        (w) => w.name === this.definition.spawns,
      );
      if (!childWeapon) {
        Logger.getInstance().error(
          `${this.name} unable to find child weapon definition by name ${this.definition.spawns}`,
        );
      } else {
        this.childDefinition = childWeapon;
      }
    }
  }

  static getSprite(
    data: WeaponData,
    level: GameLevel,
  ): Promise<HTMLImageElement> | undefined {
    const weaponsTilesets = level.tiledLevel
      .getTilesetByProperty("has-weapons")
      .filter((t) => t.properties.get("has-weapons") === true);
    const weapons = weaponsTilesets.flatMap((t) =>
      t.getTilesByClassName("weapon"),
    );
    const weaponTile = weapons.find(
      (w) => w.properties.get("name") === (data.tileName ?? data.name),
    );

    if (!weaponTile) {
      return undefined;
    }

    const sprite = weaponTile.tileset.spritesheet.sprites.at(weaponTile.id);
    if (!sprite) {
      return undefined;
    }

    const prom = weaponTile.tileset.spritesheet.getSpriteAsImage(
      sprite.sourceView.x / sprite.sourceView.width,
      sprite.sourceView.y / sprite.sourceView.height,
    );
    return prom;
  }

  override onInitialize(engine: Engine): void {
    const weaponsTilesets = this.level
      .getTilesetByProperty("has-weapons")
      .filter((t) => t.properties.get("has-weapons") === true);
    const weapons = weaponsTilesets.flatMap((t) =>
      t.getTilesByClassName("weapon"),
    );
    const weaponTile = weapons.find(
      (w) =>
        w.properties.get("name") ===
        (this.definition.tileName ?? this.definition.name),
    );
    if (!weaponTile) {
      Logger.getInstance().error(
        `Unable to find tile for weapon by name ${this.definition.name}`,
      );
    }

    this.tile = weaponTile;

    this.childTile = weapons.find(
      (w) =>
        w.properties.get("name") ===
        (this.childDefinition?.tileName ?? this.childDefinition?.name),
    );
  }

  override onPostUpdate(engine: Engine, elapsedMs: number): void {
    if (engine instanceof GameEngine && (engine.playersOnly || engine.paused)) {
      return;
    }

    if (
      this.outlivesOwner &&
      this.aliveTime > 0 &&
      this.spawnedWeaponActors.every((wa) => wa.isKilled())
    ) {
      this.kill();
      return;
    }

    this.aliveTime += elapsedMs;

    if (
      !this.outlivesOwner &&
      (this.owner.isKilled() || this.playerOwner.isKilled())
    ) {
      this.kill();
      return;
    }

    // interval 0 means this weapon only ever spawns its actors once; it is expected to self-destruct
    // when all of its spawned WeaponActors have expired.
    if (this.intervalMs === 0 && this.lastSpawnedTimeMs) {
      return;
    }

    if (
      this.pendingDelayedSpawnAmount > 0 &&
      this.lastDelayedSpawnTimeMs &&
      this.lastDelayedSpawnTimeMs + this.pendingDelayedSpawnInterval <=
        this.aliveTime
    ) {
      this.pendingDelayedSpawnAmount--;
      this.spawnWeapon(1, true);
    }
    if (
      !this.lastSpawnedTimeMs ||
      this.lastSpawnedTimeMs + this.intervalMs <= this.aliveTime
    ) {
      this.spawnWeapon(Math.floor(this.amount));
    }
  }

  getNearestLivingEnemyToPosition(
    level: GameLevel,
    pos: Vector,
  ): Enemy | undefined {
    let closestEnemy: Enemy | undefined;
    for (let i = 0; i < level.enemies.length; i++) {
      const e = level.enemies.at(i);
      if (!e || e.isKilled()) {
        continue;
      }

      if (
        !closestEnemy ||
        e.pos.squareDistance(pos) < closestEnemy.pos.squareDistance(pos)
      ) {
        closestEnemy = e;
      }
    }

    return closestEnemy;
  }

  getNearestLivingEnemy(level: GameLevel): Enemy | undefined {
    return this.getNearestLivingEnemyToPosition(level, this.owner.pos);
  }

  getRandomCloseEnemyToPosition(
    level: GameLevel,
    pos: Vector,
  ): Enemy | undefined {
    const candidates = level.enemies.filter((e) => !e.isKilled());
    const sorted = candidates.sort(
      (a, b) => a.pos.squareDistance(pos) - b.pos.squareDistance(pos),
    );
    const reduced = sorted.slice(0, 5);
    if (reduced.length === 0) {
      return;
    }

    const chosen = rand.pickOne(reduced);
    return chosen;
  }

  getRandomCloseEnemy(level: GameLevel): Enemy | undefined {
    return this.getRandomCloseEnemyToPosition(level, this.owner.pos);
  }

  spawnWeapon(amount: number, fromDelayed?: boolean) {
    if (!this.tile || !(this.scene instanceof GameLevel)) {
      return;
    }

    const spawnBehavior =
      this.spawnBehaviorOverride ?? this.definition.spawnBehavior;

    let target: Actor | undefined;
    if (spawnBehavior === "targetNearestEnemy") {
      // if we are spawning a delayed multi-amount weapon, give us a good chance to target something else
      // but the first shot should always go for the nearest enemy.
      target = fromDelayed
        ? this.getRandomCloseEnemy(this.scene)
        : this.getNearestLivingEnemy(this.scene);

      if (!target) {
        return;
      }
    }

    const numToSpawnDelayed = this.definition.amountAddsSpread ? 0 : amount - 1;
    const maxPossibleAmount = Math.floor(
      this.intervalMs / minMultiSpawnDelayMs,
    );
    this.pendingDelayedSpawnAmount = clamp(
      this.pendingDelayedSpawnAmount + numToSpawnDelayed,
      0,
      maxPossibleAmount,
    );
    if (!fromDelayed) {
      this.pendingDelayedSpawnInterval =
        spawnBehavior === "orbit"
          ? OrbitDurationMs / this.speed / amount
          : lerp(
              minMultiSpawnDelayMs,
              maxMultiSpawnDelayMs,
              Math.max(0, 1 - this.pendingDelayedSpawnAmount / 10),
            );
    }

    const startPos = this.owner.pos.add(
      vec(rand.integer(-25, 25), rand.integer(-25, 25)),
    );

    const numToSpawn = amount - numToSpawnDelayed;
    for (let i = 0; i < numToSpawn; i++) {
      let startPosOverride: Vector | undefined;
      let startDirection: Vector | undefined;
      let startSpeed: number | undefined;

      if (this.definition.amountAddsSpread && amount > 1) {
        if (this.definition.spreadPattern === "distributePosition") {
          const maxRadius = this.definition.spreadVariance! * this.size;
          const angle = (i + 1) * goldenSpiralAngleStep;
          const dist = maxRadius * Math.sqrt(i / numToSpawn);
          const feather = maxRadius * 0.2;
          const x = this.owner.pos.x + dist * Math.cos(angle);
          const y = this.owner.pos.y + dist * Math.sin(angle);
          startPosOverride = vec(
            x + rand.floating(-feather, feather),
            y + rand.floating(-feather, feather),
          );
          startDirection = Vector.One.rotate(angle);
          startSpeed = 0.01;
        }
      }

      const weapon = new WeaponActor(
        this,
        this.definition,
        target,
        spawnBehavior,
        startPosOverride ?? startPos,
        startSpeed,
      );
      if (this.outlivesOwner) {
        this.spawnedWeaponActors.push(weapon);
      }
      if (startDirection) {
        weapon._direction = startDirection;
      }
      this.scene.addWeaponActor(weapon);

      if (this.definition.amountAddsSpread && amount > 1) {
        if (this.definition.spreadPattern === "evenRotation") {
          const rangeBounds = this.definition.spreadVariance!;
          const desiredRotation = lerp(
            -rangeBounds,
            rangeBounds,
            i / (numToSpawn - 1),
          );
          const feather = rangeBounds * 0.1;
          const rotationOffsetDegrees =
            desiredRotation + rand.floating(-feather, feather);

          weapon.spawnRotationOffsetDegrees =
            this.definition.spreadVarianceUnits === "degrees"
              ? rotationOffsetDegrees
              : toDegrees(rotationOffsetDegrees);
        }
      }
    }

    this.lastDelayedSpawnTimeMs = this.aliveTime;
    if (!fromDelayed) {
      this.lastSpawnedTimeMs = this.aliveTime;
    }
  }

  applyUpgrade(upgrade: UpgradeUIData | Weapon) {
    if (isUpgradeUIData(upgrade)) {
      switch (upgrade.data?.meta?.attribute) {
        case UpgradeAttribute.Amount:
          this.amount += upgrade.data.amount;
          break;

        case UpgradeAttribute.Damage:
          this.damage += this.definition.baseDamage * upgrade.data.amount;
          break;

        case UpgradeAttribute.Interval:
          this.intervalMs = Math.max(
            30,
            this.intervalMs + upgrade.data.amount * 1000, // these should always be negative values
          );
          break;

        case UpgradeAttribute.Lifetime:
          if (this.lifetimeMs) {
            this.lifetimeMs = this.lifetimeMs + upgrade.data.amount * 1000;
          } else {
            Logger.getInstance().error(
              `${this.name} told to apply Lifetime upgrade, but no lifetime is set.`,
            );
          }
          break;

        case UpgradeAttribute.Size:
          this.size += (this.definition.baseScale ?? 1) * upgrade.data.amount;
          break;

        case UpgradeAttribute.Speed:
          this.speed += upgrade.data.amount;
          break;
      }
    } else if (upgrade instanceof Weapon) {
      // not all attributes should carry over to a copied weapon (which is intended to be used for child weapons only)
      // this.amount = upgrade.amount;
      this.damage = upgrade.damage;
      // this.intervalMs = upgrade.intervalMs;
      // this.lifetimeMs = upgrade.lifetimeMs;
      this.size = (this.definition.baseScale ?? 1) * upgrade.size;
      // this.speed = upgrade.speed;
    }
  }
}
