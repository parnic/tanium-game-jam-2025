import type { Tile } from "@excaliburjs/plugin-tiled";
import {
  Animation,
  CollisionType,
  type Engine,
  type Scene,
  type Shader,
  type Vector,
  vec,
} from "excalibur";
import { GameActor, TiledCollision } from "./game-actor";
import { GameEngine } from "./game-engine";
import { createOutlineMaterial } from "./materials/outline";
import { OffScreenIndicator } from "./off-screen-indicator";

export class Gift extends GameActor {
  offScreen: OffScreenIndicator;

  constructor(inPos: Vector, name: string, tile: Tile) {
    super({
      name: name,
      pos: inPos,
      width: tile.tileset.tileWidth,
      height: tile.tileset.tileHeight,
      collisionType: CollisionType.Passive,
      collisionDef: new TiledCollision(tile),
    });

    // applying this in the constructor causes collision to be offset. do it here instead.
    this.scale = vec(1.5, 1.5);

    // todo: determine if we should be using the on-dark image or not (probably from the level's properties)
    const bgs = tile.tileset.getTilesByClassName("offscreen-indicator");
    const onDark = bgs.filter((bg) => bg.properties.get("on-dark") === true);
    // todo: determine which of the options to choose somehow (random? maybe always grabbing the first one is good for consistency?)
    const bg = onDark.at(0);

    this.alwaysAnimate = true;
    this.walk = new Animation({
      frames: tile.animation.map((anim) => {
        return {
          graphic: tile.tileset.spritesheet.sprites[anim.tileid],
          duration: anim.duration,
        };
      }),
    });

    this.offScreen = new OffScreenIndicator(this, bg);
  }

  override onInitialize(engine: Engine): void {
    super.onInitialize(engine);

    this.graphics.material = createOutlineMaterial(engine);

    this.graphics.material?.update((s: Shader) => {
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

  override onPostKill(scene: Scene): void {
    this.offScreen.kill();
  }

  override onPostUpdate(engine: Engine, elapsedMs: number): void {
    if (engine instanceof GameEngine && (engine.playersOnly || engine.paused)) {
      return;
    }

    super.onPostUpdate(engine, elapsedMs);
  }
}
