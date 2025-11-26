import { Tile } from "@excaliburjs/plugin-tiled";
import { GameActor, TiledCollision } from "./game-actor";
import {
  Animation,
  Collider,
  CollisionContact,
  CollisionType,
  Engine,
  Side,
  Vector,
} from "excalibur";
import { Enemy } from "./enemy";
import { config } from "./config";

export class Weapon extends GameActor {
  static weaponCounter = new Uint32Array([1]);
  direction = Vector.Zero; // tmp. need to store this info in a weapon def of some kind so that each weapon can have its own movement scheme
  damage = 5; // tmp

  constructor(name: string, tile: Tile) {
    const myNum = Atomics.add(Weapon.weaponCounter, 0, 1);
    super({
      name: `${name}-${myNum.toString()}`,
      width: tile.tileset.tileWidth,
      height: tile.tileset.tileHeight,
      collisionType: CollisionType.Passive,
      collisionDef: new TiledCollision(tile),
    });

    this.z = config.ZIndexWeapon;
    this._speed = 1;
    if (tile.animation.length) {
      this.walk = new Animation({
        frames: tile.animation.map((anim) => {
          return {
            graphic: tile.tileset.spritesheet.sprites[anim.tileid],
            duration: anim.duration,
          };
        }),
      });
    } else {
      this.staticImage = tile.tileset.spritesheet.sprites.at(tile.tiledTile.id);
    }
  }

  override onPostUpdate(engine: Engine, elapsedMs: number): void {
    if (
      !this.scene?.engine.screen.getWorldBounds().overlaps(this.graphics.bounds)
    ) {
      // or the weapon has lived out its lifetime
      this.kill();
      return;
    }

    this.moveInDirection(this.direction.clampMagnitude(1), elapsedMs);
    super.onPostUpdate(engine, elapsedMs);
  }

  override onCollisionStart(
    self: Collider,
    other: Collider,
    side: Side,
    contact: CollisionContact,
  ): void {
    if (other.owner instanceof Enemy) {
      other.owner.takeDamage(this.damage);
      // todo: don't kill depending on what the weapon def wants to happen when it hits something
      this.kill();
    }
  }
}
