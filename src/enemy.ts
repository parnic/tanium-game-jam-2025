import {
  Animation,
  type Collider,
  type CollisionContact,
  CollisionType,
  type Engine,
  type Scene,
  type Side,
  Vector,
} from "excalibur";
import { config } from "./config";
import { EnemyCorpse } from "./enemy-corpse";
import type { EnemyData } from "./enemy-data";
import { GameActor } from "./game-actor";
import { GameEngine } from "./game-engine";
import { Player } from "./player";
import { GameLevel, MaxOnScreenCorpses } from "./scenes/game-level";
import * as Audio from "./utilities/audio";

export class Enemy extends GameActor {
  addedInWave = 0;
  def: EnemyData;
  gameScene?: GameLevel;
  difficulty: number;

  pushbackDirection?: Vector;
  pushbackDurationMs = 100;
  private pushbackStartTimeMs?: number;
  private pushbackRecoveryDurationMs = 100;

  static enemyCounter = new Uint32Array([1]);

  constructor(inPos: Vector, def: EnemyData, difficulty: number) {
    const myNum = Atomics.add(Enemy.enemyCounter, 0, 1);
    super({
      name: `${def.name}-${myNum.toString()}`,
      pos: inPos,
      width: def.textureWidth,
      height: def.textureHeight,
      z: config.ZIndexEnemy,
      collisionType: CollisionType.Passive,
      collisionDef: def.collisionDef,
    });

    this.def = def;
    this._spriteFacing = def.facing > 0 ? Vector.Right : Vector.Left;
    this.walk = new Animation({ frames: this.def.walkFrames });
    this._maxHealth = def.health;
    this.difficulty = difficulty;
  }

  public override get speed(): number {
    return this.def.speed * this._speed;
  }

  override onInitialize(engine: Engine): void {
    this.gameScene = this.scene as GameLevel;
    this.addedInWave = this.gameScene.currentWave;
    super.onInitialize(engine);
  }

  override onPreUpdate(engine: Engine, elapsedMs: number): void {
    if (engine instanceof GameEngine && (engine.playersOnly || engine.paused)) {
      return;
    }

    if (
      this.pushbackStartTimeMs &&
      this.pushbackDirection &&
      this.pushbackStartTimeMs + this.pushbackDurationMs > this.aliveTime
    ) {
      this.currMove = this.pushbackDirection;
    } else if (
      this.pushbackStartTimeMs &&
      this.pushbackStartTimeMs +
        this.pushbackDurationMs +
        this.pushbackRecoveryDurationMs >
        this.aliveTime
    ) {
      this.currMove = Vector.Zero;
    } else {
      const playerDead = this.gameScene?.player?.isKilled() === true;
      const from = playerDead
        ? (this.gameScene?.player?.pos ?? Vector.Zero)
        : this.pos;
      const to = playerDead
        ? this.pos
        : (this.gameScene?.player?.pos ?? Vector.Zero);

      this.currMove = to.sub(from);
    }

    super.onPreUpdate(engine, elapsedMs);
  }

  override onPostUpdate(engine: Engine, elapsedMs: number): void {
    if (engine instanceof GameEngine && (engine.playersOnly || engine.paused)) {
      this.vel = Vector.Zero;
      return;
    }

    super.onPostUpdate(engine, elapsedMs);

    // enemies are spawned off screen, so give them some time to get on screen before killing them off
    if (
      this.aliveTime > 1000 &&
      !engine.screen.getWorldBounds().overlaps(this.graphics.bounds)
    ) {
      this.gameScene?.killEnemy(this, false);
    }
  }

  override onCollisionStart(
    self: Collider,
    other: Collider,
    side: Side,
    contact: CollisionContact,
  ): void {
    if (other.owner instanceof Player) {
      // todo: we probably don't want to kill every enemy type that hits the player, e.g. the minibosses.
      // those should probably stop moving for a second or so.
      other.owner.onHitByEnemy(this);
      this.takeDamage(this.health, Vector.Zero, false, true);
    }
  }

  override takeDamage(
    damage: number,
    damageDirection: Vector,
    damagedByPlayer?: boolean,
    bypassInvulnWindow?: boolean,
  ): void {
    this.pushbackDirection = damageDirection;
    this.pushbackStartTimeMs = this.aliveTime;

    super.takeDamage(
      damage,
      damageDirection,
      damagedByPlayer,
      bypassInvulnWindow,
    );
  }

  override onPostKill(scene: Scene): void {
    if (!this.def.corpseTile || !this.lastDamagedByPlayer) {
      return;
    }

    Audio.playEnemyDeathSfx();

    if (!(scene instanceof GameLevel)) {
      return;
    }

    let numPickups = 0;
    let nextAvailableIdx = -1;
    for (let i = 0; i < scene.xpPickups.length; i++) {
      const pickup = scene.xpPickups.at(i);
      if (pickup?.isKilled()) {
        nextAvailableIdx = i;
        continue;
      }

      if (pickup?.isKilled() === false && !pickup.isOffScreen) {
        numPickups++;
      }
    }

    if (numPickups > MaxOnScreenCorpses) {
      let closest: EnemyCorpse | undefined;
      let closestDist = 0;
      for (let i = 0; i < scene.xpPickups.length; i++) {
        if (scene.xpPickups.at(i)?.isKilled()) {
          continue;
        }
        const dist = scene.xpPickups[i]!.pos.squareDistance(this.pos);
        if (!closest || dist < closestDist) {
          closestDist = dist;
          closest = scene.xpPickups.at(i);
        }
      }

      // todo: check how far away the closest corpse is. if it's too far (more than our width, basically)
      // then we should not combine with them since it looks bad to have an enemy die in the middle of
      // nowhere and not leave a corpse. instead, we should find another corpse somewhere that's on top of
      // 1+ other corpses and combine those, if possible, then leave one of our own. if we exceed the
      // desired max corpses, it still looks better to leave a corpse than invisibly boost the value of some
      // far-away corpse.
      if (closest) {
        closest.xpVal++;
        return;
      }
    }

    const corpse = new EnemyCorpse(this);
    scene.add(corpse);

    if (nextAvailableIdx >= 0) {
      scene.xpPickups[nextAvailableIdx] = corpse;
    } else {
      scene.xpPickups.push(corpse);
    }
  }

  protected override onHealthReachedZero(): void {
    this.gameScene?.killEnemy(this, this.lastDamagedByPlayer);
    if (this.lastDamagedByPlayer && this.gameScene?.player) {
      this.gameScene.player.kills++;
    }
  }
}
