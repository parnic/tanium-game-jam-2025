import type { Tile } from "@excaliburjs/plugin-tiled";
import {
  type Collider,
  type CollisionContact,
  CollisionType,
  Color,
  type Engine,
  Logger,
  type Shader,
  type Side,
  Vector,
} from "excalibur";
import { config } from "./config";
import { GameActor } from "./game-actor";
import { GameEngine } from "./game-engine";
import { createGleamMaterial } from "./materials/gleam";
import type { Player } from "./player";
import { GameLevel } from "./scenes/game-level";

export class EnemyCorpse extends GameActor {
  pickedUpBy?: Player;
  private lastGlintTime = 0;
  private glintIntervalMs = 4000;

  constructor(
    inPos: Vector,
    corpseTile: Tile,
    width: number,
    height: number,
    enemyName: string,
    flipHorizontal: boolean,
  ) {
    super({
      name: `${enemyName}-corpse`,
      pos: inPos,
      width,
      height,
      z: config.ZIndexEnemyCorpse,
      collisionType: CollisionType.PreventCollision,
    });

    this.staticImage = corpseTile.tileset.spritesheet.sprites.at(corpseTile.id);
    if (!this.staticImage) {
      Logger.getInstance().error(
        `Unable to find sprite for enemy corpse id ${corpseTile.id}`,
      );
    }
    this.graphics.flipHorizontal = flipHorizontal;
    this._speed = config.SpeedPickup;
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
  }

  override onPostUpdate(engine: Engine, elapsedMs: number): void {
    // todo: it would be cool to have an initial pickup behavior that causes the corpse to
    // move away from the player and eventually curve back toward them to be picked up.
    if (!this.pickedUpBy) {
      return;
    }
    if (engine instanceof GameEngine && engine.paused) {
      this.currMove = Vector.Zero;
      super.onPostUpdate(engine, elapsedMs);
      return;
    }

    const pickupToPlayer = this.pickedUpBy.pos.sub(this.pos);
    const normalized = pickupToPlayer.normalize();
    this.currMove = normalized.scale(config.SpeedPickup * elapsedMs);

    super.onPostUpdate(engine, elapsedMs);

    // pickup when we're close enough to the player. no need to pay for corpse collision when this works just as well
    if (this.pickedUpBy.pos.squareDistance(this.pos) <= 25 * 25) {
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
    this.kill();
    // todo: corpses should have an xp value they give that is scaled by their difficulty or increased when grouping corpses for perf
    this.pickedUpBy!.xpComponent.giveXp(1);
    Logger.getInstance().info(
      `picked up ${this.name}. new xp=${this.pickedUpBy!.xpComponent.currXp.toString()}`,
    );
    if (this.scene instanceof GameLevel) {
      const idx = this.scene.xpPickups.indexOf(this);
      if (idx >= 0) {
        this.scene.xpPickups[idx] = undefined;
      }
    }
  }
}
