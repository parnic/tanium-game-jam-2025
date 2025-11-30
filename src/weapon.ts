import { Tile, TiledResource } from "@excaliburjs/plugin-tiled";
import { Actor, Engine, Entity, Logger } from "excalibur";
import { Enemy } from "./enemy";
import { GameActor } from "./game-actor";
import { GameEngine } from "./game-engine";
import { GameLevel } from "./scenes/game-level";
import { WeaponActor } from "./weapon-actor";

export interface WeaponData {
  name: string;
  baseSpeed: number;
  baseDamage: number;
  baseSpawnIntervalMs: number;
  spawnBehavior: "targetNearestEnemy" | undefined;
  targetBehavior: "tracking" | undefined;
}

export class Weapon extends Entity {
  level: TiledResource;
  tile?: Tile;
  lastSpawnedTimeMs?: number;
  aliveTime = 0;
  owner: GameActor;
  definition: WeaponData;

  constructor(data: WeaponData, level: TiledResource, owner: GameActor) {
    super({
      name: `weapon-${data.name}`,
    });

    this.definition = data;
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
      this.lastSpawnedTimeMs + this.definition.baseSpawnIntervalMs >
        this.aliveTime
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

    let target: Actor | undefined = undefined;
    if (this.definition.spawnBehavior === "targetNearestEnemy") {
      target = this.getNearestLivingEnemy(engine.currentScene);
      if (!target) {
        return;
      }
    }

    const weapon = new WeaponActor(this, target);
    engine.currentScene.add(weapon);
    this.lastSpawnedTimeMs = this.aliveTime;
  }
}
