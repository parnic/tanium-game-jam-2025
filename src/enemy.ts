import { Animation, CollisionType, Engine, Vector } from "excalibur";
import { GameLevel } from "./game-level";
import { EnemyData } from "./enemy-data";
import { GameActor } from "./game-actor";

export class Enemy extends GameActor {
  addedInWave = 0;
  def: EnemyData;
  gameScene: GameLevel | undefined;
  static enemyCounter = new Uint32Array([1]);

  constructor(inPos: Vector, def: EnemyData, width?: number, height?: number) {
    const myNum = Atomics.add(Enemy.enemyCounter, 0, 1);
    super({
      name: `${def.name}-${myNum.toString()}`,
      pos: inPos,
      width: width,
      height: height,
      collisionType: CollisionType.Passive,
      collisionDef: def.collisionDef,
    });

    this._speed = 0.15;
    this.def = def;
    this._spriteFacing = def.facing > 0 ? Vector.Right : Vector.Left;
    this.walk = new Animation({ frames: this.def.walkFrames });
  }

  public get health(): number {
    return this.def.health;
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
    this.currMove = this.gameScene?.player?.pos.sub(this.pos) ?? Vector.Zero;
  }
}
