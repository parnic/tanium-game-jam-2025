import type { Tile } from "@excaliburjs/plugin-tiled";
import {
  CollisionType,
  type Engine,
  type Shader,
  Vector,
  vec,
} from "excalibur";
import { GameActor, TiledCollision } from "./game-actor";
import { createOutlineMaterial } from "./materials/outline";

export class Pickup extends GameActor {
  static numPickups = 0;

  type: "xp" | "health" | "speed";

  constructor(pos: Vector, type: "xp" | "health" | "speed", tile?: Tile) {
    const scale =
      type === "health"
        ? Vector.One
        : type === "xp"
          ? vec(1.2, 1.2)
          : vec(2, 2);
    super({
      name: `pickup-${type}`,
      pos: pos,
      scale: scale,
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
