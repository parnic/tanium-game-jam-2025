import { Tile, TiledResource } from "@excaliburjs/plugin-tiled";
import { Engine, Entity, Logger } from "excalibur";
import { WeaponActor } from "./weapon-actor";
import { GameLevel } from "./game-level";
import { Enemy } from "./enemy";
import { GameEngine } from "./game-engine";
import { GameActor } from "./game-actor";

export class Weapon extends Entity {
  weaponName: string;
  level: TiledResource;
  tile?: Tile;
  spawnIntervalMs = 0;
  lastSpawnedTimeMs?: number;
  aliveTime = 0;
  owner: GameActor;

  constructor(name: string, level: TiledResource, owner: GameActor) {
    super({
      name: `weapon-${name}`,
    });

    this.weaponName = name;
    this.level = level;
    this.owner = owner;
  }

  override onInitialize(engine: Engine): void {
    const weaponsTilesets = this.level
      .getTilesetByProperty("has-weapons")
      .filter((t) => t.properties.get("has-weapons") === true);
    const weapons = weaponsTilesets
      .map((t) => t.getTilesByClassName("weapon"))
      .flat();
    const weaponTile = weapons.find(
      (w) => w.properties.get("name") === this.weaponName,
    );
    if (!weaponTile) {
      Logger.getInstance().error(
        `Unable to find weapon by name ${this.weaponName}`,
      );
    }

    this.tile = weaponTile;
    this.spawnIntervalMs = 1000; // todo: get from somewhere
  }

  override onPostUpdate(engine: Engine, elapsedMs: number): void {
    if ((engine as GameEngine).playersOnly) {
      return;
    }

    this.aliveTime += elapsedMs;

    if (this.owner.isKilled()) {
      this.kill();
      return;
    }

    if (
      this.lastSpawnedTimeMs &&
      this.lastSpawnedTimeMs + this.spawnIntervalMs > this.aliveTime
    ) {
      return;
    }

    this.spawnWeapon(engine);
  }

  getNearestLivingEnemy(level: GameLevel): Enemy | undefined {
    let closestEnemy: Enemy | undefined = undefined;
    for (const e of level.enemies) {
      if (e.isKilled()) {
        continue;
      }

      if (
        !closestEnemy ||
        e.pos.squareDistance(this.owner.pos) <
          closestEnemy.pos.squareDistance(this.owner.pos)
      ) {
        closestEnemy = e;
      }
    }

    return closestEnemy;
  }

  spawnWeapon(engine: Engine) {
    if (!this.tile || !(engine.currentScene instanceof GameLevel)) {
      return;
    }

    const closestEnemy = this.getNearestLivingEnemy(engine.currentScene);
    // todo: this behavior should probably be data-driven. some weapons don't need a target enemy,
    // some probably won't want to always target the nearest, etc.
    if (!closestEnemy) {
      return;
    }

    const weapon = new WeaponActor(this.weaponName, this.tile, this.owner);
    weapon.pos = this.owner.pos;
    weapon.direction = closestEnemy.pos.sub(this.owner.pos).normalize();
    weapon.rotation = weapon.direction.toAngle() + Math.PI / 2;

    engine.currentScene.add(weapon);
    this.lastSpawnedTimeMs = this.aliveTime;
  }
}
