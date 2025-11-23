import { Actor, Animation, Engine, Vector } from "excalibur";

export abstract class GameActor extends Actor {
  currMove = Vector.Zero;
  _speed = 0.4;
  _spriteFacing = Vector.Left;
  walk: Animation | undefined;

  public get speed(): number {
    return this._speed;
  }

  public get facing(): Vector {
    return this._spriteFacing;
  }

  protected moveInDirection(direction: Vector, elapsedMs: number) {
    this.pos.x += direction.x * this.speed * elapsedMs;
    this.pos.y += direction.y * this.speed * elapsedMs;
  }

  override onInitialize(engine: Engine) {
    if (this.walk) {
      this.graphics.use(this.walk);
    }
  }

  override onPostUpdate(engine: Engine, elapsedMs: number): void {
    this.currMove.clampMagnitude(1);
    if (this.currMove.magnitude > 0) {
      this.walk?.play();
    } else {
      this.walk?.pause();
    }
    this.moveInDirection(this.currMove, elapsedMs);

    this.graphics.flipHorizontal =
      Math.sign(this.currMove.x) != Math.sign(this.facing.x);
    this.currMove = Vector.Zero;
  }
}
