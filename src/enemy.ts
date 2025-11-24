import {
  Animation,
  Collider,
  CollisionContact,
  CollisionType,
  Engine,
  Side,
  Vector,
} from "excalibur";
import { GameLevel } from "./game-level";
import { EnemyData } from "./enemy-data";
import { GameActor } from "./game-actor";
import { Player } from "./player";

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
      collisionType: CollisionType.Passive,
      collisionDef: def.collisionDef,
    });

    this._speed = 0.35;
    this.def = def;
    this._spriteFacing = def.facing > 0 ? Vector.Right : Vector.Left;
    this.walk = new Animation({ frames: this.def.walkFrames });
    this._health = def.health;
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
    const playerDead = this.gameScene?.player?.isKilled() === true;
    const from = playerDead
      ? (this.gameScene?.player?.pos ?? Vector.Zero)
      : this.pos;
    const to = playerDead
      ? this.pos
      : (this.gameScene?.player?.pos ?? Vector.Zero);

    this.currMove = to.sub(from);
  }

  override onPostUpdate(engine: Engine, elapsedMs: number): void {
    super.onPostUpdate(engine, elapsedMs);

    if (!engine.screen.getWorldBounds().overlaps(this.graphics.bounds)) {
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

  protected override onHealthReachedZero(): void {
    this.gameScene?.killEnemy(this, false);
  }
}
