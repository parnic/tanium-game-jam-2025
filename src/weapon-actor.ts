import {
  Actor,
  Animation,
  Collider,
  CollisionContact,
  CollisionType,
  Engine,
  Side,
  Vector,
} from "excalibur";
import { config } from "./config";
import { Enemy } from "./enemy";
import { GameActor, TiledCollision } from "./game-actor";
import { GameEngine } from "./game-engine";
import { Player } from "./player";
import { Weapon } from "./weapon";

export class WeaponActor extends GameActor {
  static weaponCounter = new Uint32Array([1]);
  direction = Vector.Zero;
  damage: number;
  instigator: GameActor;
  weapon: Weapon;
  target?: Actor;

  constructor(weapon: Weapon, target?: Actor) {
    const myNum = Atomics.add(WeaponActor.weaponCounter, 0, 1);
    const tile = weapon.tile!;
    super({
      name: `${weapon.name}-${myNum.toString()}`,
      width: tile.tileset.tileWidth,
      height: tile.tileset.tileHeight,
      collisionType: CollisionType.Passive,
      collisionDef: new TiledCollision(tile),
    });

    this.weapon = weapon;
    this.target = target;
    this.pos = this.weapon.owner.pos;
    this.instigator = weapon.owner;
    this.z = config.ZIndexWeapon;
    this._speed = weapon.definition.baseSpeed;
    this.damage = weapon.definition.baseDamage;
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

    this.conditionalUpdateTarget();
  }

  conditionalUpdateTarget() {
    if (!this.target) {
      return;
    }

    this.direction = this.target.pos.sub(this.pos).normalize();
    this.rotation = this.direction.toAngle() + Math.PI / 2;
  }

  override onPostUpdate(engine: Engine, elapsedMs: number): void {
    if (engine instanceof GameEngine && (engine.playersOnly || engine.paused)) {
      this.vel = Vector.Zero;
      return;
    }

    if (
      !this.scene?.engine.screen.getWorldBounds().overlaps(this.graphics.bounds)
    ) {
      // or the weapon has lived out its lifetime
      this.kill();
      return;
    }

    if (this.weapon.definition.targetBehavior === "tracking") {
      this.conditionalUpdateTarget();
    }

    this.currMove = this.direction;
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

    if (other.owner instanceof Enemy && !other.owner.isKilled()) {
      other.owner.takeDamage(this.damage, this.instigator instanceof Player);
      // todo: don't kill depending on what the weapon def wants to happen when it hits something
      this.kill();
    }
  }
}
