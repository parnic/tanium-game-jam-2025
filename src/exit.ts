import {
  CollisionType,
  type Engine,
  Sprite,
  type Vector,
  vec,
} from "excalibur";
import { config } from "./config";
import { GameActor } from "./game-actor";
import { OffScreenIndicator } from "./off-screen-indicator";
import { Resources } from "./resources";

export class LevelExit extends GameActor {
  offScreen: OffScreenIndicator;

  constructor(pos: Vector) {
    const sprite = Sprite.from(Resources.ExitImage);

    // todo: this image is huge and its center anchor is causing some problems. see about offsetting or changing the anchor or something.
    super({
      pos: pos,
      width: sprite.width,
      height: sprite.height,
      z: config.ZIndexExit,
      collisionType: CollisionType.Passive,
    });

    this.staticImage = sprite;
    // todo: this needs some work...real ugly right now
    this.offScreen = new OffScreenIndicator(this, undefined, vec(0.2, 0.2));
  }

  override onAdd(engine: Engine): void {
    this.scene?.add(this.offScreen);
  }

  override onRemove(engine: Engine): void {
    this.scene?.remove(this.offScreen);
  }
}
