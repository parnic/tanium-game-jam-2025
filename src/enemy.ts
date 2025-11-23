import { Actor, Animation, Engine, Vector } from "excalibur";
import { GameLevel } from "./game-level";
import { EnemyData } from "./enemy-data";

export class Enemy extends Actor {
  addedInWave = 0;
  def: EnemyData;
  gameScene: GameLevel | undefined;
  walk: Animation;
  static enemyCounter = new Uint32Array([1]);

  constructor(inPos: Vector, def: EnemyData, width?: number, height?: number) {
    const myNum = Atomics.add(Enemy.enemyCounter, 0, 1);
    super({
      name: `${def.name}-${myNum.toString()}`,
      pos: inPos,
      width: width,
      height: height,
    });

    this.def = def;
    this.walk = new Animation({ frames: this.def.walkFrames });
  }

  public get health(): number {
    return this.def.health;
  }

  public get speed(): number {
    return this.def.speed * 0.35;
  }

  override onInitialize(engine: Engine): void {
    this.gameScene = this.scene as GameLevel;
    this.addedInWave = this.gameScene.currentWave;
    this.graphics.use(this.walk);
  }

  moveInDirection(direction: Vector, elapsedMs: number) {
    this.pos.x += direction.x * this.speed * elapsedMs;
    this.pos.y += direction.y * this.speed * elapsedMs;
  }

  override onPostUpdate(engine: Engine, elapsedMs: number): void {
    const moveDir =
      this.gameScene?.player?.pos.sub(this.pos).normal() ?? Vector.Zero;
    this.moveInDirection(moveDir, elapsedMs);

    this.graphics.flipHorizontal =
      Math.sign(moveDir.x) != Math.sign(this.def.facing);
  }
}
