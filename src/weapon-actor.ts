import {
  type Actor,
  Animation,
  type Collider,
  type CollisionContact,
  CollisionType,
  type Engine,
  type Side,
  toRadians,
  Vector,
  vec,
} from "excalibur";
import { config } from "./config";
import { Enemy } from "./enemy";
import { GameActor, TiledCollision } from "./game-actor";
import { GameEngine } from "./game-engine";
import { Player } from "./player";
import type { Weapon } from "./weapon";

export class WeaponActor extends GameActor {
  static weaponCounter = new Uint32Array([1]);
  _direction = Vector.Zero;
  damage: number;
  lifetime?: number;
  instigator: GameActor;
  weapon: Weapon;
  shouldFaceDirection: boolean;
  target?: Actor;
  orbitDurationMs = 2000;
  orbitDistanceScale = 1.1;

  private set direction(dir: Vector) {
    this._direction = dir;
    if (this.shouldFaceDirection) {
      this.rotation = dir.toAngle() + Math.PI / 2;
    }
  }

  constructor(weapon: Weapon, target?: Actor) {
    const myNum = Atomics.add(WeaponActor.weaponCounter, 0, 1);
    const tile = weapon.tile!;
    super({
      name: `${weapon.name}-${myNum.toString()}`,
      width: tile.tileset.tileWidth,
      height: tile.tileset.tileHeight,
      pos: weapon.owner.pos,
      z: config.ZIndexWeapon,
      collisionType: CollisionType.Passive,
      collisionDef: new TiledCollision(tile),
    });

    this.weapon = weapon;
    this.target = target;
    this.instigator = weapon.owner;
    this._speed = weapon.speed;
    this.damage = weapon.damage;
    this.lifetime = weapon.lifetimeMs;
    this.shouldFaceDirection = weapon.definition.spawnBehavior !== "orbit";
    if (weapon.definition.baseScale) {
      this.scale = vec(weapon.size, weapon.size);
    }

    if (tile.animation.length) {
      this.walk = new Animation({
        frames: tile.animation.map((anim) => {
          return {
            graphic: tile.tileset.spritesheet.sprites[anim.tileid],
            duration: anim.duration,
          };
        }),
      });
      this.alwaysAnimate = true;
    } else {
      this.staticImage = tile.tileset.spritesheet.sprites.at(tile.tiledTile.id);
    }
  }

  override onInitialize(engine: Engine): void {
    super.onInitialize(engine);

    this.conditionalUpdateTarget();

    if (this.weapon.definition.spawnBehavior === "ownerFacing") {
      this.direction = !this.instigator.moveDir.equals(Vector.Zero)
        ? this.instigator.moveDir.normalize()
        : Vector.Right;
    }
  }

  conditionalUpdateTarget() {
    if (!this.target) {
      return;
    }

    this.direction = this.target.pos.sub(this.pos).normalize();
  }

  override onPostUpdate(engine: Engine, elapsedMs: number): void {
    if (engine instanceof GameEngine && (engine.playersOnly || engine.paused)) {
      this.vel = Vector.Zero;
      return;
    }

    if (
      !this.scene?.engine.screen
        .getWorldBounds()
        .overlaps(this.graphics.bounds) ||
      (this.aliveTime && this.lifetime && this.aliveTime >= this.lifetime)
    ) {
      this.kill();
      return;
    }

    if (this.weapon.definition.targetBehavior === "tracking") {
      this.conditionalUpdateTarget();
    } else if (this.weapon.definition.spawnBehavior === "orbit") {
      const aliveSeconds =
        (this.aliveTime % this.orbitDurationMs) / this.orbitDurationMs || 1;
      // determine where in orbit we should be given the current time
      const degreeScaledSeconds = 360 * aliveSeconds * this.speed;
      const t = toRadians(degreeScaledSeconds);
      // position us an appropriate distance from the source
      const dist = this.instigator.width * this.orbitDistanceScale;
      // offset from our owner
      const destination = vec(dist, dist).rotate(t).add(this.instigator.pos);
      this.pos = destination;
      super.onPostUpdate(engine, elapsedMs);
      // i'm not good enough at math to use the vel to get the same result as directly setting pos.
      // todo: should probably make this work eventually.
      this.vel = Vector.Zero;
      return;
    }

    this.currMove = this._direction;
    super.onPostUpdate(engine, elapsedMs);
  }

  shouldKillOnCollision() {
    return (
      this.weapon.definition.spawnBehavior !== "orbit" &&
      this.weapon.definition.spawnBehavior !== "ownerLocation"
    );
  }

  override onPreCollisionResolve(
    self: Collider,
    other: Collider,
    side: Side,
    contact: CollisionContact,
  ): void {
    if (this.isKilled()) {
      return;
    }

    if (other.owner instanceof Enemy && !other.owner.isKilled()) {
      // these collision events will only fire every Physics.sleepEpsilon time, so we
      // automatically get a "cooldown" period of sorts where a weapon won't hit the
      // same enemy every single frame they overlap.
      other.owner.takeDamage(this.damage, this.instigator instanceof Player);
      if (this.shouldKillOnCollision()) {
        this.kill();
      }
    }
  }
}
