import { Tile } from "@excaliburjs/plugin-tiled";
import {
  Actor,
  ActorArgs,
  Animation,
  Color,
  Engine,
  Graphic,
  Logger,
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
  protected currMove = Vector.Zero;
  protected _speed = 0.4;
  protected _spriteFacing = Vector.Left;
  protected walk?: Animation;
  protected staticImage?: Graphic;
  protected whiteFlashMaterial: Material | null = null;
  private _health = 10;
  protected lastDamaged?: number;
  protected invulnerabilityWindowMs = 300;
  protected alwaysAnimate = false;
  private _isGodMode = false;
  private _isDemigodMode = false;
  protected lastDamagedByPlayer = false;

  public get activeGraphic(): Graphic | undefined {
    return this.walk ?? this.staticImage;
  }

  public get speed(): number {
    return this._speed;
  }

  public get facing(): Vector {
    return this._spriteFacing;
  }

  public get health(): number {
    return this._health;
  }

  public set health(hp: number) {
    this._health = hp;
    this.onHealthChanged();
  }

  protected get isGodMode(): boolean {
    return this._isGodMode;
  }

  protected set isGodMode(enable: boolean) {
    this._isGodMode = enable;
    Logger.getInstance().info(
      `${this.name} ${enable ? "enabled" : "disabled"} god mode`,
    );
  }

  protected get isDemigodMode(): boolean {
    return this._isDemigodMode;
  }

  protected set isDemigodMode(enable: boolean) {
    this._isDemigodMode = enable;
    Logger.getInstance().info(
      `${this.name} ${enable ? "enabled" : "disabled"} demigod mode`,
    );
  }

  constructor(config?: GameActorArgs) {
    super(config);

    if (config?.collisionDef) {
      this.setCollision(config.collisionDef);
    }
  }

  protected onHealthChanged() {
    /* to be overridden if desired */
  }

  private setCollision(def: TiledCollision) {
    const xOffset = this.width / 2;
    const yOffset = this.height / 2;
    const shape = Shape.Polygon(
      [
        vec(def.x - xOffset, def.y - yOffset),
        vec(def.x - xOffset, def.y + def.height - yOffset),
        vec(def.x + def.width - xOffset, def.y + def.height - yOffset),
        vec(def.x + def.width - xOffset, def.y - yOffset),
      ],
      Vector.Zero,
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
    } else if (this.staticImage) {
      this.graphics.use(this.staticImage);
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

  override onPreUpdate(engine: Engine, elapsed: number): void {
    this.lastDamagedByPlayer = false;
  }

  override onPostUpdate(engine: Engine, elapsedMs: number): void {
    this.currMove.clampMagnitude(1);
    if (this.currMove.magnitude > 0 || this.alwaysAnimate) {
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

  takeDamage(
    damage: number,
    damagedByPlayer?: boolean,
    bypassInvulnWindow?: boolean,
  ): void {
    if (this.isGodMode) {
      Logger.getInstance().info(
        `Suppressing damage done to ${this.name} because it was in god mode.`,
      );
      return;
    } else if (this.isDemigodMode && this.health <= damage) {
      const incomingDamage = damage;
      damage = Math.max(0, this.health - 1);
      Logger.getInstance().info(
        `Incoming damage of ${incomingDamage.toString()} set to ${damage.toString()} because ${this.name} was in demigod mode.`,
      );
    }

    const now = this.scene?.engine.clock.now() ?? 0;
    if (
      this.lastDamaged &&
      !bypassInvulnWindow &&
      now <= this.lastDamaged + this.invulnerabilityWindowMs
    ) {
      Logger.getInstance().info(
        `Suppressing damage done to ${this.name} because it was inside the invulnerability window of ${this.invulnerabilityWindowMs.toString()} milliseconds since the last damage.`,
      );
      return;
    }

    this.lastDamagedByPlayer = !!damagedByPlayer;
    this.health -= damage;
    Logger.getInstance().info(
      `${this.name} took ${damage.toString()} damage, remaining health: ${this.health.toString()}`,
    );
    this.lastDamaged = now;
    if (this.health <= 0) {
      this.onHealthReachedZero();
    } else {
      this.actions.flash(Color.White, 150);
    }
  }

  protected onHealthReachedZero(): void {
    this.kill();
  }
}
