import type { Tile, TiledResource } from "@excaliburjs/plugin-tiled";
import {
  ActionsComponent,
  type Actor,
  type Engine,
  Entity,
  Logger,
  type Vector,
} from "excalibur";
import {
  UpgradeAttribute,
  type UpgradeUIData,
} from "./components/upgrade-component";
import type { Enemy } from "./enemy";
import type { GameActor } from "./game-actor";
import { GameEngine } from "./game-engine";
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
  targetBehavior: "tracking" | undefined;
  collides?: boolean;
}

const multiSpawnDelayMs = 100;

export class Weapon extends Entity {
  level: TiledResource;
  tile?: Tile;
  lastSpawnedTimeMs?: number;
  aliveTime = 0;
  owner: GameActor;
  definition: WeaponData;
  speed: number;
  damage: number;
  size: number;
  intervalMs: number;
  amount: number;
  lifetimeMs?: number;
  actions: ActionsComponent;
  pendingDelayedSpawnAmount = 0;

  constructor(data: WeaponData, level: TiledResource, owner: GameActor) {
    super({
      name: `weapon-${data.name}`,
    });

    this.actions = new ActionsComponent();
    this.addComponent(this.actions);

    this.definition = data;
    this.level = level;
    this.owner = owner;

    this.speed = data.baseSpeed;
    this.damage = data.baseDamage;
    this.size = data.baseScale ?? 1;
    this.intervalMs = data.baseSpawnIntervalMs;
    this.amount = data.baseAmount ?? 1;
    this.lifetimeMs = data.baseLifetime;
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
  }

  override onPostUpdate(engine: Engine, elapsedMs: number): void {
    if (engine instanceof GameEngine && (engine.playersOnly || engine.paused)) {
      return;
    }

    this.aliveTime += elapsedMs;

    if (this.owner.isKilled()) {
      this.kill();
      return;
    }

    if (
      this.lastSpawnedTimeMs &&
      this.lastSpawnedTimeMs + this.intervalMs > this.aliveTime
    ) {
      return;
    }

    this.spawnWeapon(engine);
  }

  getNearestLivingEnemyToPosition(
    level: GameLevel,
    pos: Vector,
  ): Enemy | undefined {
    let closestEnemy: Enemy | undefined;
    for (const e of level.enemies) {
      if (e.isKilled()) {
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

  spawnWeapon(engine: Engine) {
    if (!this.tile || !(this.scene instanceof GameLevel)) {
      return;
    }

    let target: Actor | undefined;
    if (this.definition.spawnBehavior === "targetNearestEnemy") {
      target = this.getNearestLivingEnemy(this.scene);
      if (!target) {
        return;
      }
    }

    const amount = Math.floor(this.amount);
    const delay =
      this.definition.spawnBehavior === "orbit"
        ? OrbitDurationMs / amount
        : multiSpawnDelayMs;
    for (let i = 0; i < amount; i++) {
      if (this.definition.spawnBehavior === "ownerFacing") {
        const weapon = new WeaponActor(this, target);
        this.scene.add(weapon);
        if (amount > 1) {
          weapon.spawnRotationVarianceDegrees = rand.floating(0, 5);
        }
      } else {
        this.actions.delay(i * delay).callMethod(() => {
          const weapon = new WeaponActor(this, target);
          this.scene?.add(weapon);
        });
      }
    }
    this.lastSpawnedTimeMs = this.aliveTime;
  }

  applyUpgrade(upgrade: UpgradeUIData) {
    switch (upgrade.data?.meta?.attribute) {
      case UpgradeAttribute.Amount:
        this.amount += upgrade.data.amount;
        break;

      case UpgradeAttribute.Damage:
        this.damage += this.definition.baseDamage * upgrade.data.amount;
        break;

      case UpgradeAttribute.Interval:
        this.intervalMs += upgrade.data.amount * 1000; // these should always be negative values
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
  }
}
