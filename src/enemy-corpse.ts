import type { Tile } from "@excaliburjs/plugin-tiled";
import {
  type Collider,
  type CollisionContact,
  CollisionType,
  Color,
  type Engine,
  Logger,
  type Side,
  Vector,
} from "excalibur";
import { config } from "./config";
import { GameActor, TiledCollision } from "./game-actor";
import { GameEngine } from "./game-engine";
import type { Player } from "./player";
import { GameLevel } from "./scenes/game-level";

export class EnemyCorpse extends GameActor {
  pickedUpBy?: Player;

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
      collisionType: CollisionType.Passive,
      collisionDef: new TiledCollision(corpseTile),
    });

    const corpseGraphic = corpseTile.tileset.spritesheet.sprites.at(
      corpseTile.id,
    );
    if (corpseGraphic) {
      this.graphics.use(corpseGraphic);
    } else {
      Logger.getInstance().error(
        `Unable to find sprite for enemy corpse id ${corpseTile.id}`,
      );
    }
    this.graphics.flipHorizontal = flipHorizontal;
    this._speed = config.SpeedPickup;
  }

  onInitialize(engine: Engine): void {
    // todo: squish the corpse in the opposite direction of the hit they took, knock them back
    // in the same direction, reset both and render as grayscale after they hit the "ground"
    this.actions.flash(Color.White, 150);
  }

  override onPostUpdate(engine: Engine, elapsedMs: number): void {
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

    // sometimes the collisionStart event isn't firing. not sure why. have a fallback.
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
