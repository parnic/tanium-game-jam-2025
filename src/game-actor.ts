import type { Tile } from "@excaliburjs/plugin-tiled";
import {
  Actor,
  type ActorArgs,
  type Animation,
  Color,
  type Engine,
  type Graphic,
  type Material,
  Shape,
  Vector,
  vec,
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
  protected _currMove = Vector.Zero;
  private _lastMove = Vector.Zero;
  protected _speed = 1;
  protected _spriteFacing = Vector.Left;
  protected walk?: Animation;
  protected staticImage?: Graphic;
  protected whiteFlashMaterial: Material | null = null;
  private _health = 10;
  protected _maxHealth = 10;
  protected lastDamaged?: number;
  protected invulnerabilityWindowMs = 0;
  protected alwaysAnimate = false;
  private _isGodMode = false;
  private _isDemigodMode = false;
  protected lastDamagedByPlayer = false;
  protected aliveTime = 0;
  protected shouldFaceMoveDir = true;

  protected get currMove() {
    return this._currMove;
  }

  protected set currMove(dir: Vector) {
    this._currMove = dir;
    if (!dir.equals(Vector.Zero)) {
      this._lastMove = dir;
    }
  }

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

  public get maxHealth(): number {
    return this._maxHealth;
  }

  public get healthPercent(): number {
    return this._health / this._maxHealth;
  }

  public get moveDir(): Vector {
    return this._lastMove;
  }

  protected get isGodMode(): boolean {
    return this._isGodMode;
  }

  protected set isGodMode(enable: boolean) {
    this._isGodMode = enable;
    this.logger.info(
      `${this.name} ${enable ? "enabled" : "disabled"} god mode`,
    );
  }

  protected get isDemigodMode(): boolean {
    return this._isDemigodMode;
  }

  protected set isDemigodMode(enable: boolean) {
    this._isDemigodMode = enable;
    this.logger.info(
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
    this.vel = direction.scale(this.speed * 1000);
  }

  override onInitialize(engine: Engine) {
    this.health = this.maxHealth;

    if (this.walk) {
      this.graphics.use(this.walk);
    } else if (this.staticImage) {
      this.graphics.use(this.staticImage);
    }

    // if we need this later, need to find a place to initialize it once globally instead of once per enemy. this is slow.
    // this.whiteFlashMaterial = engine.graphicsContext.createMaterial({
    //   name: "custom-material",
    //   fragmentSource: `#version 300 es
    //     precision mediump float;
    //     uniform sampler2D u_graphic;
    //     in vec2 v_uv;
    //     out vec4 color;
    //     void main() {
    //       vec4 existingColor = texture(u_graphic, v_uv);
    //       if (existingColor.a > 0.0) {
    //           color = vec4(1.0, 1.0, 1.0, 1.0);
    //       } else {
    //           color = existingColor;
    //       }
    //     }`,
    // });
  }

  override onPreUpdate(engine: Engine, elapsed: number): void {
    this.lastDamagedByPlayer = false;
  }

  onPaused(paused: boolean) {
    if (paused) {
      this.vel = Vector.Zero;
      this.walk?.pause();
    }
  }

  override onPostUpdate(engine: Engine, elapsedMs: number): void {
    this.aliveTime += elapsedMs;
    this.currMove.clampMagnitude(1);
    if (this.currMove.magnitude > 0 || this.alwaysAnimate) {
      this.walk?.play();
    } else {
      this.walk?.pause();
    }
    this.moveInDirection(this.currMove, elapsedMs);

    if (this.currMove.x !== 0 && this.shouldFaceMoveDir) {
      this.graphics.flipHorizontal =
        Math.sign(this.currMove.x) !== Math.sign(this.facing.x);
    }
    this._currMove = Vector.Zero;
  }

  takeDamage(
    damage: number,
    damagedByPlayer?: boolean,
    bypassInvulnWindow?: boolean,
  ): void {
    if (this.isGodMode) {
      this.logger.info(
        `Suppressing damage done to ${this.name} because it was in god mode.`,
      );
      return;
    } else if (this.isDemigodMode && this.health <= damage) {
      const incomingDamage = damage;
      damage = Math.max(0, this.health - 1);
      this.logger.info(
        `Incoming damage of ${incomingDamage.toString()} set to ${damage.toString()} because ${this.name} was in demigod mode.`,
      );
    }

    if (
      this.lastDamaged &&
      !bypassInvulnWindow &&
      this.aliveTime <= this.lastDamaged + this.invulnerabilityWindowMs
    ) {
      this.logger.info(
        `Suppressing damage done to ${this.name} because it was inside the invulnerability window of ${this.invulnerabilityWindowMs.toString()} milliseconds since the last damage.`,
      );
      return;
    }

    this.lastDamagedByPlayer = !!damagedByPlayer;
    this.health -= damage;
    this.logger.info(
      `${this.name} took ${damage.toString()} damage, remaining health: ${this.health.toString()}`,
    );
    this.lastDamaged = this.aliveTime;
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
