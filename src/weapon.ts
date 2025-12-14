import type { Tile, TiledResource } from "@excaliburjs/plugin-tiled";
import {
  type Actor,
  clamp,
  type Engine,
  Entity,
  Logger,
  lerp,
  type Vector,
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
  spawns?: string;
  childSpawnBehavior?: string;
  targetBehavior: "tracking" | undefined;
  collides?: boolean;
  amountAddsSpread?: boolean; // for something like a shotgun, "amount" means how many projectiles to spawn at once whereas with a rocket we want to spawn them one after another.
}

const minMultiSpawnDelayMs = 30;
const maxMultiSpawnDelayMs = 150;

export class Weapon extends Entity {
  level: TiledResource;
  tile?: Tile;
  lastSpawnedTimeMs?: number;
  aliveTime = 0;
  owner: GameActor;
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
      (w) => w.properties.get("name") === data.name,
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
      (w) => w.properties.get("name") === this.definition.name,
    );
    if (!weaponTile) {
      Logger.getInstance().error(
        `Unable to find weapon by name ${this.definition.name}`,
      );
    }

    this.tile = weaponTile;

    this.childTile = weapons.find(
      (w) => w.properties.get("name") === this.childDefinition?.name,
    );
  }

  override onPostUpdate(engine: Engine, elapsedMs: number): void {
    if (engine instanceof GameEngine && (engine.playersOnly || engine.paused)) {
      return;
    }

    this.aliveTime += elapsedMs;

    if (this.owner.isKilled() || this.playerOwner.isKilled()) {
      this.kill();
      return;
    }

    const lastSpawnedTime = this.lastSpawnedTimeMs;
    if (
      this.pendingDelayedSpawnAmount > 0 &&
      lastSpawnedTime &&
      lastSpawnedTime + this.pendingDelayedSpawnInterval <= this.aliveTime
    ) {
      this.pendingDelayedSpawnAmount--;
      this.spawnWeapon(1, true);
    }
    if (
      !lastSpawnedTime ||
      lastSpawnedTime + this.intervalMs <= this.aliveTime
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
    this.pendingDelayedSpawnInterval =
      spawnBehavior === "orbit"
        ? OrbitDurationMs / this.speed / amount
        : lerp(
            minMultiSpawnDelayMs,
            maxMultiSpawnDelayMs,
            Math.max(0, 1 - this.pendingDelayedSpawnAmount / 10),
          );

    const startPos = this.owner.pos.add(
      vec(rand.integer(-25, 25), rand.integer(-25, 25)),
    );

    const weapon = new WeaponActor(
      this,
      this.definition,
      target,
      spawnBehavior,
      startPos,
    );
    this.scene.addWeaponActor(weapon);

    if (this.definition.amountAddsSpread && amount > 1) {
      // todo: make this into a spread rather than random selection
      weapon.spawnRotationVarianceDegrees = rand.floating(0, 5);
    }

    this.lastSpawnedTimeMs = this.aliveTime;
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
      this.amount = upgrade.amount;
      this.damage = upgrade.damage;
      // this.intervalMs = upgrade.intervalMs;
      // this.lifetimeMs = upgrade.lifetimeMs;
      this.size = upgrade.size;
      // this.speed = upgrade.speed;
    }
  }
}
