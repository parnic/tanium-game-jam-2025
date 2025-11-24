import { Tile } from "@excaliburjs/plugin-tiled";
import {
  Actor,
  ActorArgs,
  Animation,
  Engine,
  Material,
  Shape,
  vec,
  Vector,
} from "excalibur";

export class TiledCollision {
  x = 0;
  y = 0;
  width = 0;
  height = 0;

  constructor(tile: Tile) {
    const collider = tile.objects.find((o) => o.class === "collision");

    this.x = collider?.tiledObject.x ?? 0;
    this.y = collider?.tiledObject.y ?? 0;
    this.width = collider?.tiledObject.width ?? 0;
    this.height = collider?.tiledObject.height ?? 0;
  }
}

export type GameActorArgs = ActorArgs & {
  collisionDef?: TiledCollision;
};

export abstract class GameActor extends Actor {
  currMove = Vector.Zero;
  _speed = 0.4;
  _spriteFacing = Vector.Left;
  walk?: Animation;
  whiteFlashMaterial: Material | null = null;

  public get speed(): number {
    return this._speed;
  }

  public get facing(): Vector {
    return this._spriteFacing;
  }

  constructor(config?: GameActorArgs) {
    super(config);

    if (config?.collisionDef) {
      this.setCollision(config.collisionDef);
    }
  }

  private setCollision(def: TiledCollision) {
    const shape = Shape.Polygon(
      [
        vec(def.x, def.y),
        vec(def.x, def.y + def.height),
        vec(def.x + def.width, def.y + def.height),
        vec(def.x + def.width, def.y),
      ],
      vec(-this.width / 2, -this.height / 2),
    );

    this.collider.set(shape);
  }

  protected moveInDirection(direction: Vector, elapsedMs: number) {
    this.pos.x += direction.x * this.speed * elapsedMs;
    this.pos.y += direction.y * this.speed * elapsedMs;
  }

  override onInitialize(engine: Engine) {
    if (this.walk) {
      this.graphics.use(this.walk);
    }

    this.whiteFlashMaterial = engine.graphicsContext.createMaterial({
      name: "custom-material",
      fragmentSource: `#version 300 es
        precision mediump float;
        uniform sampler2D u_graphic;
        in vec2 v_uv;
        out vec4 color;
        void main() {
          vec4 existingColor = texture(u_graphic, v_uv);
          if (existingColor.a > 0.0) {
              color = vec4(1.0, 1.0, 1.0, 1.0);
          } else {
              color = existingColor;
          }
        }`,
    });
  }

  override onPostUpdate(engine: Engine, elapsedMs: number): void {
    this.currMove.clampMagnitude(1);
    if (this.currMove.magnitude > 0) {
      this.walk?.play();
    } else {
      this.walk?.pause();
    }
    this.moveInDirection(this.currMove, elapsedMs);

    if (this.currMove.x !== 0) {
      this.graphics.flipHorizontal =
        Math.sign(this.currMove.x) != Math.sign(this.facing.x);
    }
    this.currMove = Vector.Zero;
  }
}
