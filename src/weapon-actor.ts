import {
  type Actor,
  Animation,
  type Collider,
  type CollisionContact,
  CollisionType,
  type Engine,
  lerp,
  lerpVector,
  type Scene,
  type Side,
  toDegrees,
  toRadians,
  Vector,
  vec,
} from "excalibur";
import { config } from "./config";
import { Enemy } from "./enemy";
import { GameActor, TiledCollision } from "./game-actor";
import { GameEngine } from "./game-engine";
import { Player } from "./player";
import { GameLevel } from "./scenes/game-level";
import { Weapon, type WeaponData } from "./weapon";

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
  size: Vector;
  childWeapon?: Weapon;
  orbitDistanceScale = 1.1;
  spawnRotationOffsetDegrees = 0;
  fadeInOutDurationMs = 300;
  private lastOrbitOffset?: Vector;
  private lastRotation?: number;
  private targetRotation?: number;

  private get direction() {
    return this._direction;
  }

  private set direction(dir: Vector) {
    this._direction = dir;
    if (this.shouldFaceDirection) {
      this.lastRotation = this.rotation;
      this.rotation = dir.toAngle() + Math.PI / 2;
    }
  }

  private get owningPlayerWeapon(): Weapon {
    if (this.weapon.owner instanceof WeaponActor) {
      return this.weapon.owner.weapon;
    }

    return this.weapon;
  }

  constructor(
    weapon: Weapon,
    definition?: WeaponData,
    target?: Actor,
    spawnBehavior?: string,
    startPos?: Vector,
    startSpeed?: number,
  ) {
    const myNum = Atomics.add(WeaponActor.weaponCounter, 0, 1);
    const def = definition ?? weapon.definition;
    super({
      name: `${weapon.name}-${myNum.toString()}`,
      width: weapon.tile?.tileset.tileWidth,
      height: weapon.tile?.tileset.tileHeight,
      pos: startPos ?? weapon.owner.pos,
      z: config.ZIndexWeapon,
      collisionType:
        def.collides === false
          ? CollisionType.PreventCollision
          : CollisionType.Passive,
      collisionDef:
        def.collides === false ? undefined : new TiledCollision(weapon.tile!),
    });

    this.definition = def;
    this.spawnBehavior = spawnBehavior;
    this.weapon = weapon;
    this.target = target;
    this.instigator = weapon.owner;
    if (weapon.owner instanceof WeaponActor) {
      this.instigator = weapon.owner.weapon.owner;
    }
    this._speed = startSpeed ?? weapon.speed;
    this.damage = weapon.damage;
    this.lifetime = weapon.lifetimeMs;
    this.shouldFaceDirection = this.spawnBehavior !== "orbit";
    this.size = vec(weapon.size, weapon.size);

    this.scale = this.size;

    // set a default direction so that if we spawned from a delayed action
    // and we're supposed to track a target but there's no target to track,
    // we at least don't just stop dead.
    if (this.spawnBehavior !== "ownerLocation") {
      this.direction = !this.instigator.moveDir.equals(Vector.Zero)
        ? this.instigator.moveDir.normalize()
        : Vector.Right;
    }

    if (weapon.tile?.animation.length) {
      this.walk = new Animation({
        frames: weapon.tile?.animation.map((anim) => {
          return {
            graphic: weapon.tile?.tileset.spritesheet.sprites[anim.tileid],
            duration: anim.duration,
          };
        }),
      });
      this.alwaysAnimate = true;
    } else {
      this.staticImage = weapon.tile?.tileset.spritesheet.sprites.at(
        weapon.tile?.tiledTile.id,
      );
    }
  }

  private setTargetRotation(rotation: number) {
    this.targetRotation = rotation;
    this.updateRotation();
  }

  private updateRotation() {
    if (!this.targetRotation) {
      return;
    }

    const targetDegrees = toDegrees(this.targetRotation);
    const lastDegrees = toDegrees(this.lastRotation ?? this.targetRotation);
    const adjustedTargetDegrees =
      targetDegrees > 180 ? 360 - targetDegrees : targetDegrees;
    const adjustedLastDegrees =
      lastDegrees > 180 ? 360 - lastDegrees : lastDegrees;
    const diff = Math.abs(adjustedTargetDegrees - adjustedLastDegrees);
    if (diff <= 2) {
      this.rotation = this.targetRotation;
    } else {
      const rotation = lerp(this.lastRotation!, this.targetRotation, 0.18);
      this.rotation = rotation;
    }

    this.lastRotation = this.rotation;
  }

  override onInitialize(engine: Engine): void {
    super.onInitialize(engine);

    this.conditionalUpdateTarget();
    this.conditionalSpawnChildWeapon(engine, "onSpawn");

    if (this.spawnBehavior === "ownerFacing") {
      this.direction = !this.instigator.moveDir.equals(Vector.Zero)
        ? this.instigator.moveDir.normalize()
        : Vector.Right;

      if (this.spawnRotationOffsetDegrees) {
        this.direction = this.direction.rotate(
          toRadians(this.spawnRotationOffsetDegrees),
        );
      }
    } else if (this.spawnBehavior === "orbit") {
      this.scale = Vector.Zero;
    }
  }

  conditionalUpdateTarget() {
    if (this.target?.isKilled()) {
      this.target = this.weapon.getRandomCloseEnemyToPosition(
        this.scene as GameLevel,
        this.pos,
      );
    }

    if (!this.target) {
      return;
    }

    this.direction = this.target.pos.sub(this.pos).normalize();
  }

  conditionalSpawnChildWeapon(engine: Engine, trigger: "onSpawn" | "onDeath") {
    if (
      !this.weapon.childDefinition ||
      this.weapon.definition.spawnsTrigger !== trigger
    ) {
      return;
    }

    this.childWeapon = new Weapon(
      this.weapon.childDefinition,
      this.weapon.level,
      this,
    );
    this.childWeapon.outlivesOwner = trigger === "onDeath";
    this.childWeapon.applyUpgrade(this.weapon);
    this.childWeapon.spawnBehaviorOverride = this.definition.childSpawnBehavior;
    this.scene?.add(this.childWeapon);
  }

  override onPostUpdate(engine: Engine, elapsedMs: number): void {
    if (engine instanceof GameEngine && (engine.playersOnly || engine.paused)) {
      this.vel = Vector.Zero;
      return;
    }

    if (
      (this.aliveTime > 0 &&
        !this.lifetime &&
        !this.scene?.engine.screen
          .getWorldBounds()
          .overlaps(this.graphics.bounds)) ||
      (this.lifetime && this.aliveTime >= this.lifetime) ||
      (this.spawnBehavior === "orbit" && this.weapon.playerOwner.isKilled())
    ) {
      this.kill();
      return;
    }

    this.updateRotation();

    let setCurrMove = true;
    if (this.definition.targetBehavior === "tracking") {
      this.conditionalUpdateTarget();
    } else if (this.spawnBehavior === "orbit") {
      const fadeInOutScale = this.getFadeInOutScale();
      const parameterizedFadeScale = vec(
        fadeInOutScale.x / this.size.x,
        fadeInOutScale.y / this.size.y,
      );
      this.scale = fadeInOutScale;

      const duration = OrbitDurationMs / this.speed;
      const aliveSeconds = (this.aliveTime % duration) / duration || 1;
      // determine where in orbit we should be given the current time
      const degreeScaledSeconds = 360 * aliveSeconds;
      const t = toRadians(degreeScaledSeconds);
      // position us an appropriate distance from the source
      const dist =
        this.instigator.width *
        this.orbitDistanceScale *
        parameterizedFadeScale.x;
      // offset from our owner
      const currOrbitOffset = vec(dist, dist).rotate(t);
      const destination = currOrbitOffset.add(this.instigator.pos);
      this.pos = destination;
      setCurrMove = false;

      const lastOrbitOffset = this.lastOrbitOffset ?? destination;
      this.setTargetRotation(currOrbitOffset.sub(lastOrbitOffset).toAngle());

      this.lastOrbitOffset = currOrbitOffset;
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
  }

  private getFadeInOutScale(): Vector {
    if (this.aliveTime < this.fadeInOutDurationMs) {
      return lerpVector(
        Vector.Zero,
        this.size,
        this.aliveTime / this.fadeInOutDurationMs,
      );
    } else if (
      this.lifetime &&
      this.lifetime - this.aliveTime < this.fadeInOutDurationMs
    ) {
      return lerpVector(
        Vector.Zero,
        this.size,
        (this.lifetime - this.aliveTime) / this.fadeInOutDurationMs,
      );
    }

    return this.size;
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
      const weapon = this.owningPlayerWeapon;

      // these collision events will only fire every Physics.sleepEpsilon time, so we
      // automatically get a "cooldown" period of sorts where a weapon won't hit the
      // same enemy every single frame they overlap.
      other.owner.takeDamage(this.damage, this.instigator instanceof Player);
      weapon.damageDealt += this.damage;

      if (other.owner.isKilled()) {
        weapon.kills++;
      }

      if (this.shouldKillOnCollision()) {
        this.kill();
      }
    }
  }

  override onPostKill(scene: Scene): void {
    if (!(scene instanceof GameLevel)) {
      return;
    }

    this.conditionalSpawnChildWeapon(scene.engine, "onDeath");
    scene.removeWeaponActor(this);
  }
}
