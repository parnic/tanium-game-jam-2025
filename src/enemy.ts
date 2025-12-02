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
import { GameLevel } from "./scenes/game-level";

export class Enemy extends GameActor {
  addedInWave = 0;
  def: EnemyData;
  gameScene: GameLevel | undefined;
  static enemyCounter = new Uint32Array([1]);

  constructor(inPos: Vector, def: EnemyData) {
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

    this._speed = 0.35;
    this.def = def;
    this._spriteFacing = def.facing > 0 ? Vector.Right : Vector.Left;
    this.walk = new Animation({ frames: this.def.walkFrames });
    this._maxHealth = def.health;
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

    const playerDead = this.gameScene?.player?.isKilled() === true;
    const from = playerDead
      ? (this.gameScene?.player?.pos ?? Vector.Zero)
      : this.pos;
    const to = playerDead
      ? this.pos
      : (this.gameScene?.player?.pos ?? Vector.Zero);

    this.currMove = to.sub(from);

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
      this.takeDamage(this.health);
    }
  }

  override onPostKill(scene: Scene): void {
    if (!this.def.corpseTile || !this.lastDamagedByPlayer) {
      return;
    }

    const corpse = new EnemyCorpse(
      this.pos,
      this.def.corpseTile,
      this.width,
      this.height,
      this.name,
      this.graphics.flipHorizontal,
    );
    scene.add(corpse);

    if (!(scene instanceof GameLevel)) {
      return;
    }

    const idx = scene.xpPickups.findIndex((p) => !p);
    if (idx >= 0) {
      scene.xpPickups[idx] = corpse;
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
