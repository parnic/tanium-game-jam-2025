import type { Tile } from "@excaliburjs/plugin-tiled";
import {
  CollisionType,
  type Engine,
  type Shader,
  type Vector,
} from "excalibur";
import { GameActor, TiledCollision } from "./game-actor";
import { createOutlineMaterial } from "./materials/outline";

export class Pickup extends GameActor {
  static numPickups = 0;

  type: "xp" | "health" | "speed";

  constructor(pos: Vector, type: "xp" | "health" | "speed", tile?: Tile) {
    super({
      name: `pickup-${type}`,
      pos: pos,
      width: tile?.tileset.tileWidth,
      height: tile?.tileset.tileHeight,
      collisionType: CollisionType.Passive,
      collisionDef: tile ? new TiledCollision(tile) : undefined,
    });

    this.type = type;
    this.staticImage = tile?.tileset.spritesheet.sprites.at(tile.id);
  }

  override onInitialize(engine: Engine): void {
    super.onInitialize(engine);

    this.graphics.material = createOutlineMaterial(engine);

    this.graphics.material?.update((s: Shader) => {
      // set color in HSL
      s.trySetUniform("uniform3f", "u_outline_color", 285 / 360, 0.62, 0.86);
    });
  }
}
