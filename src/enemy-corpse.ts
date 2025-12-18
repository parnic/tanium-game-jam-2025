import {
  type Collider,
  type CollisionContact,
  CollisionType,
  Color,
  clamp,
  type Engine,
  lerp,
  lerpVector,
  type Shader,
  type Side,
  Vector,
  vec,
} from "excalibur";
import { config } from "./config";
import type { Enemy } from "./enemy";
import { GameActor } from "./game-actor";
import { GameEngine } from "./game-engine";
import { createGleamMaterial } from "./materials/gleam";
import type { Player } from "./player";
import { GameLevel } from "./scenes/game-level";

const shrinkTargetScale = vec(0.75, 0.75);

export class EnemyCorpse extends GameActor {
  private _pickedUpBy?: Player;
  private pickupTime = 0;
  private pickupDir = Vector.Zero;
  xpVal: number;
  private lastGlintTime = 0;
  private glintIntervalMs = 4000;
  private pickupAnimTimeMs = 250;
  private shrinkAnimTimeMs = 200;
  pushbackDirection?: Vector;
  pushbackDurationMs = 100;

  public get pickedUpBy(): Player | undefined {
    return this._pickedUpBy;
  }

  public setPickedUpBy(p: Player, showPickupFlourish?: boolean) {
    this._pickedUpBy = p;
    this.pickupTime = this.aliveTime;
    this.pickupDir = this.pos.sub(p.pos).normalize();
    if (showPickupFlourish === false) {
      this.pickupAnimTimeMs = 0;
    }
  }

  constructor(enemy: Enemy) {
    super({
      name: `${enemy.name}-corpse`,
      pos: enemy.pos,
      width: enemy.def.textureWidth,
      height: enemy.def.textureHeight,
      z: config.ZIndexEnemyCorpse,
      collisionType: CollisionType.PreventCollision,
    });

    this.staticImage = enemy.def.corpseTile?.tileset.spritesheet.sprites.at(
      enemy.def.corpseTile.id,
    );
    if (!this.staticImage) {
      this.logger.error(
        `Unable to find sprite for enemy corpse id ${enemy.def.corpseTile?.id.toString() ?? "-null-"}`,
      );
    }
    this.graphics.flipHorizontal = enemy.graphics.flipHorizontal;
    this._speed = config.SpeedPickup;
    this.xpVal = enemy.difficulty;
    this.shouldFaceMoveDir = false;
    this.pushbackDirection = enemy.pushbackDirection;
    this.pushbackDurationMs = enemy.pushbackDurationMs;
    this._speed = enemy.speed;
  }

  onInitialize(engine: Engine): void {
    super.onInitialize(engine);

    // todo: squish the corpse in the opposite direction of the hit they took, knock them back
    // in the same direction, reset both and render as grayscale after they hit the "ground"
    this.actions.flash(Color.White, 150).callMethod(() => {
      this.graphics.material = createGleamMaterial(engine);
      this.graphics.material?.update((s: Shader) => {
        s.trySetUniformBoolean("u_desaturate", true);
        s.trySetUniformFloat("u_decontrast_factor", 0.7);
        s.trySetUniformFloat("u_glint_speed", 2.0);
        s.trySetUniformFloat("u_glint_trigger", engine.clock.now() / 1000);
      });
    });
  }

  override onPreUpdate(engine: Engine, elapsed: number): void {
    super.onPreUpdate(engine, elapsed);

    if (this.scene instanceof GameLevel && this.scene.player?.isKilled()) {
      return;
    }
    if (this.isOffScreen) {
      return;
    }

    const currentTime = engine.clock.now();

    if (currentTime - this.lastGlintTime > this.glintIntervalMs) {
      this.lastGlintTime = currentTime;

      this.graphics.material?.update((s: Shader) => {
        s.trySetUniformFloat("u_glint_trigger", currentTime / 1000.0);
      });
    }

    this.scale = lerpVector(
      Vector.One,
      shrinkTargetScale,
      clamp(0, 1, this.aliveTime / this.shrinkAnimTimeMs),
    );

    if (
      !this.pickedUpBy &&
      this.pushbackDirection &&
      this.pushbackDurationMs > this.aliveTime
    ) {
      this.currMove = this.pushbackDirection;
    }
  }

  override onPostUpdate(engine: Engine, elapsedMs: number): void {
    if (!this.pickedUpBy) {
      super.onPostUpdate(engine, elapsedMs);
      return;
    }

    this._speed = 1.5;

    if (engine instanceof GameEngine && engine.paused) {
      this.currMove = Vector.Zero;
      super.onPostUpdate(engine, elapsedMs);
      return;
    }

    if (this.pickupTime + this.pickupAnimTimeMs > this.aliveTime) {
      const percentage =
        (this.aliveTime - this.pickupTime) / this.pickupAnimTimeMs;
      const t = lerp(1, 0, percentage ** 0.5);
      this.currMove = this.pickupDir.scale(t);

      super.onPostUpdate(engine, elapsedMs);
      return;
    }

    const pickupToPlayer = this.pickedUpBy.pos.sub(this.pos);
    const sqDist = pickupToPlayer.squareDistance();
    const normalized = pickupToPlayer.normalize();
    const lengthForDefaultSpeed = Math.max(
      engine.screen.viewport.width,
      engine.screen.viewport.height,
    );
    let scaler = 1;
    if (this.scene instanceof GameLevel) {
      scaler = sqDist / (lengthForDefaultSpeed * lengthForDefaultSpeed);
    }

    this.currMove = normalized.scale(
      config.SpeedPickup * elapsedMs * Math.max(1, scaler),
    );
    this._speed = config.SpeedPickup * Math.max(1, scaler);

    super.onPostUpdate(engine, elapsedMs);

    // pickup when we're close enough to the player. no need to pay for corpse collision when this works just as well
    if (sqDist <= 45 * 45) {
      this.onPickedUp();
    }
  }

  override onCollisionStart(
    self: Collider,
    other: Collider,
    side: Side,
    contact: CollisionContact,
  ): void {
    if (other.owner === this.pickedUpBy) {
      this.onPickedUp();
    }
  }

  onPickedUp() {
    this.pickedUpBy!.xpComponent.giveXp(this.xpVal);
    this.logger.info(
      `picked up ${this.name}. new xp=${this.pickedUpBy!.xpComponent.currXp.toString()}`,
    );
    this.kill();
  }

  combineWith(other: EnemyCorpse) {
    this.xpVal += other.xpVal;
    other.kill();
  }
}
