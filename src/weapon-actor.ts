import {
  type Actor,
  Animation,
  type Collider,
  type CollisionContact,
  CollisionType,
  type Engine,
  lerp,
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
import type { GameLevel } from "./scenes/game-level";
import { rand } from "./utilities/math";
import type { Weapon, WeaponData } from "./weapon";

export const OrbitDurationMs = 2000;

export class WeaponActor extends GameActor {
  static weaponCounter = new Uint32Array([1]);
  _direction = Vector.Zero;
  damage: number;
  lifetime?: number;
  instigator: GameActor;
  weapon: Weapon;
  shouldFaceDirection: boolean;
  target?: Actor;
  definition: WeaponData;
  spawnBehavior?: string;
  orbitDistanceScale = 1.1;
  spawnRotationVarianceDegrees = 0;
  lastChildSpawn = 0;
  fadeInOutDurationMs = 300;

  private get direction() {
    return this._direction;
  }

  private set direction(dir: Vector) {
    this._direction = dir;
    if (this.shouldFaceDirection) {
      this.rotation = dir.toAngle() + Math.PI / 2;
    }
  }

  constructor(
    weapon: Weapon,
    definition?: WeaponData,
    target?: Actor,
    spawnBehavior?: string,
    startPos?: Vector,
  ) {
    const myNum = Atomics.add(WeaponActor.weaponCounter, 0, 1);
    const tile =
      definition === weapon.definition ? weapon.tile! : weapon.childTile!;
    const def = definition ?? weapon.definition;
    super({
      name: `${weapon.name}-${myNum.toString()}`,
      width: tile.tileset.tileWidth,
      height: tile.tileset.tileHeight,
      pos: startPos ?? weapon.owner.pos,
      z: config.ZIndexWeapon,
      collisionType:
        def.collides === false
          ? CollisionType.PreventCollision
          : CollisionType.Passive,
      collisionDef:
        def.collides === false ? undefined : new TiledCollision(tile),
    });

    this.definition = def;
    this.spawnBehavior = spawnBehavior ?? this.definition.spawnBehavior;
    this.weapon = weapon;
    this.target = target;
    this.instigator = weapon.owner;
    this._speed = weapon.getSpeed(this.definition);
    this.damage = weapon.damage;
    this.lifetime = weapon.lifetimeMs;
    this.shouldFaceDirection = this.spawnBehavior !== "orbit";
    this.scale = vec(weapon.size, weapon.size);

    // set a default direction so that if we spawned from a delayed action
    // and we're supposed to track a target but there's no target to track,
    // we at least don't just stop dead.
    if (this.spawnBehavior !== "ownerLocation") {
      this.direction = !this.instigator.moveDir.equals(Vector.Zero)
        ? this.instigator.moveDir.normalize()
        : Vector.Right;
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

    if (this.spawnBehavior === "ownerFacing") {
      this.direction = !this.instigator.moveDir.equals(Vector.Zero)
        ? this.instigator.moveDir.normalize()
        : Vector.Right;

      if (this.spawnRotationVarianceDegrees) {
        this.direction = this.direction.rotate(
          toRadians(
            rand.floating(
              -this.spawnRotationVarianceDegrees,
              this.spawnRotationVarianceDegrees,
            ),
          ),
        );
      }
    } else if (this.spawnBehavior === "orbit") {
      this.scale = Vector.Zero;
    }
  }

  conditionalUpdateTarget() {
    if (this.target?.isKilled()) {
      this.target = this.weapon.getNearestLivingEnemyToPosition(
        this.scene as GameLevel,
        this.pos,
      );
    }

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

    let setCurrMove = true;
    if (this.definition.targetBehavior === "tracking") {
      this.conditionalUpdateTarget();
    } else if (this.spawnBehavior === "orbit") {
      const fadeInOutScale = this.getFadeInOutScale();
      this.scale = vec(fadeInOutScale, fadeInOutScale);

      const duration = OrbitDurationMs / this.speed;
      const aliveSeconds = (this.aliveTime % duration) / duration || 1;
      // determine where in orbit we should be given the current time
      const degreeScaledSeconds = 360 * aliveSeconds;
      const t = toRadians(degreeScaledSeconds);
      // position us an appropriate distance from the source
      const dist =
        this.instigator.width * this.orbitDistanceScale * fadeInOutScale;
      // offset from our owner
      const destination = vec(dist, dist).rotate(t).add(this.instigator.pos);
      this.pos = destination;
      setCurrMove = false;

      this.rotation = Vector.One.rotate(
        toRadians(degreeScaledSeconds + 90),
      ).toAngle();
    }

    if (setCurrMove) {
      this.currMove = this._direction;
    }
    super.onPostUpdate(engine, elapsedMs);

    if (this.spawnBehavior === "orbit") {
      // i'm not good enough at math to use the vel to get the same result as directly setting pos.
      // todo: should probably make this work eventually.
      this.vel = Vector.Zero;
    }

    if (
      this.weapon.childDefinition &&
      this.weapon.childDefinition !== this.definition &&
      this.lastChildSpawn + this.weapon.childDefinition.baseSpawnIntervalMs <=
        this.aliveTime
    ) {
      this.weapon.spawnWeapon(engine, this.weapon.childDefinition, this);
      this.lastChildSpawn = this.aliveTime;
    }
  }

  private getFadeInOutScale(): number {
    if (this.aliveTime < this.fadeInOutDurationMs) {
      return lerp(0, 1, this.aliveTime / this.fadeInOutDurationMs);
    } else if (
      this.lifetime &&
      this.lifetime - this.aliveTime < this.fadeInOutDurationMs
    ) {
      return lerp(
        0,
        1,
        (this.lifetime - this.aliveTime) / this.fadeInOutDurationMs,
      );
    }

    return 1;
  }

  shouldKillOnCollision() {
    return (
      this.spawnBehavior !== "orbit" && this.spawnBehavior !== "ownerLocation"
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
