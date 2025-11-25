import { Animation, CollisionType, Vector } from "excalibur";
import { GameActor, TiledCollision } from "./game-actor";
import { Tile } from "@excaliburjs/plugin-tiled";

export class Gift extends GameActor {
  constructor(inPos: Vector, name: string, tile: Tile) {
    super({
      name: name,
      pos: inPos,
      width: tile.tileset.tileWidth,
      height: tile.tileset.tileHeight,
      collisionType: CollisionType.Passive,
      collisionDef: new TiledCollision(tile),
    });

    this.alwaysAnimate = true;
    this.walk = new Animation({
      frames: tile.animation.map((anim) => {
        return {
          graphic: tile.tileset.spritesheet.sprites[anim.tileid],
          duration: anim.duration,
        };
      }),
    });
  }
}
