import { Tile, TiledResource } from "@excaliburjs/plugin-tiled";
import { Actor, Engine, Entity, Logger } from "excalibur";
import { WeaponActor } from "./weapon-actor";
import { GameLevel } from "./game-level";
import { Enemy } from "./enemy";
import { GameEngine } from "./game-engine";

export class Weapon extends Entity {
  weaponName: string;
  level: TiledResource;
  tile?: Tile;
  spawnIntervalMs = 0;
  lastSpawnedTimeMs?: number;
  owner: Actor;

  constructor(name: string, level: TiledResource, owner: Actor) {
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
    this.lastSpawnedTimeMs = engine.clock.now();
    this.spawnIntervalMs = 1000; // todo: get from somewhere
  }

  override onPostUpdate(engine: Engine, elapsed: number): void {
    if ((engine as GameEngine).playersOnly) {
      return;
    }

    if (this.owner.isKilled()) {
      this.kill();
      return;
    }

    if (
      this.lastSpawnedTimeMs &&
      this.lastSpawnedTimeMs + this.spawnIntervalMs > engine.clock.now()
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

    const weapon = new WeaponActor(this.weaponName, this.tile);
    weapon.pos = this.owner.pos;
    weapon.direction = closestEnemy.pos.sub(this.owner.pos);
    // weapon.rotation = weapon.direction.toAngle() + Math.PI / 2; // todo: setting rotation is causing the collision rotation to not match the graphic. why? not rotating about origin?

    engine.currentScene.add(weapon);
    this.lastSpawnedTimeMs = engine.clock.now();
  }
}
