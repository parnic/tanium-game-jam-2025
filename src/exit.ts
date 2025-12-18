import {
  CollisionType,
  type Engine,
  lerp,
  type Material,
  remap,
  type Shader,
  Sprite,
  Vector,
  vec,
} from "excalibur";
import { config } from "./config";
import { GameActor } from "./game-actor";
import { createOutlineMaterial } from "./materials/outline";
import { OffScreenIndicator } from "./off-screen-indicator";
import { Resources } from "./resources";
import { GameLevel } from "./scenes/game-level";
import type { PerlinNoiseCameraStrategy } from "./strategy-noise";

export class LevelExit extends GameActor {
  offScreen: OffScreenIndicator;
  outlineMat?: Material;
  cameraShake?: PerlinNoiseCameraStrategy;
  startPos: Vector;
  exited = false;

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
    this.startPos = pos;
  }

  override onInitialize(engine: Engine): void {
    super.onInitialize(engine);

    this.outlineMat = createOutlineMaterial(engine);
    this.outlineMat.update((s: Shader) => {
      // set color in HSL
      s.trySetUniform("uniform3f", "u_outline_color", 285 / 360, 0.62, 0.86);
    });
  }

  override onAdd(engine: Engine): void {
    this.scene?.add(this.offScreen);
  }

  override onRemove(engine: Engine): void {
    this.scene?.remove(this.offScreen);
  }

  override onPreUpdate(engine: Engine, elapsed: number): void {
    super.onPreUpdate(engine, elapsed);

    if (!(this.scene instanceof GameLevel)) {
      return;
    }

    const player = this.scene.player;
    if (!player || !player.isInitialized) {
      return;
    }

    if (player.giftsCollected >= player.giftsNeeded) {
      this.graphics.material = this.outlineMat!;
    }
  }

  onPlayerExited() {
    this.exited = true;
  }

  override onPostUpdate(engine: Engine, elapsedMs: number): void {
    if (!this.exited) {
      super.onPostUpdate(engine, elapsedMs);
      return;
    }

    this.acc = this.acc.add(Vector.Up.scale(3));

    if (this.cameraShake) {
      const distSq = this.pos.squareDistance(this.startPos);
      const zoomScaled = distSq * (this.scene?.camera.zoom ?? 1);
      const stress = lerp(
        10,
        0,
        remap(0, engine.screen.viewport.height ** 2, 0, 1, zoomScaled),
      );
      this.cameraShake.induceStress(stress);
    }
  }
}
