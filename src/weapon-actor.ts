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

export class WeaponActor extends GameActor {
  static weaponCounter = new Uint32Array([1]);
  direction = Vector.Zero;
  damage = 5; // tmp

  constructor(name: string, tile: Tile) {
    const myNum = Atomics.add(WeaponActor.weaponCounter, 0, 1);
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

  override onInitialize(engine: Engine): void {
    super.onInitialize(engine);
  }

  override onPostUpdate(engine: Engine, elapsedMs: number): void {
    if (
      !this.scene?.engine.screen.getWorldBounds().overlaps(this.graphics.bounds)
    ) {
      // or the weapon has lived out its lifetime
      this.kill();
      return;
    }

    // todo: some weapons will probably want to track their target,
    // others won't have a constant direction
    this.moveInDirection(this.direction.clampMagnitude(1), elapsedMs);
    super.onPostUpdate(engine, elapsedMs);
  }

  override onCollisionStart(
    self: Collider,
    other: Collider,
    side: Side,
    contact: CollisionContact,
  ): void {
    // prevent killing multiple enemies when we touched multiple on the same frame
    if (this.isKilled()) {
      return;
    }

    if (other.owner instanceof Enemy) {
      other.owner.takeDamage(this.damage);
      // todo: don't kill depending on what the weapon def wants to happen when it hits something
      this.kill();
    }
  }
}
