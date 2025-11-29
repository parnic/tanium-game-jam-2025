import {
  Collider,
  CollisionContact,
  CollisionType,
  Color,
  Engine,
  Graphic,
  Logger,
  Side,
  Vector,
} from "excalibur";
import { GameActor } from "./game-actor";
import { config } from "./config";
import { Player } from "./player";
import { GameLevel } from "./game-level";

export class EnemyCorpse extends GameActor {
  pickedUpBy?: Player;

  constructor(
    inPos: Vector,
    corpseTile: Graphic,
    width: number,
    height: number,
    enemyName: string,
    flipHorizontal: boolean,
  ) {
    super({
      pos: inPos,
      width,
      height,
      collisionType: CollisionType.Passive,
    });

    this.z = config.ZIndexEnemyCorpse;
    this.graphics.use(corpseTile);
    this.graphics.flipHorizontal = flipHorizontal;
    this.name = `${enemyName}-corpse`;
    this._speed = config.SpeedPickup;
  }

  onInitialize(engine: Engine): void {
    this.actions.flash(Color.White, 150);
  }

  override onPostUpdate(engine: Engine, elapsedMs: number): void {
    if (!this.pickedUpBy) {
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
    this.pickedUpBy!.xp++;
    Logger.getInstance().info(
      `picked up ${this.name}. new xp=${this.pickedUpBy!.xp.toString()}`,
    );
    if (this.scene instanceof GameLevel) {
      const idx = this.scene.xpPickups.findIndex((p) => p == this);
      if (idx >= 0) {
        this.scene.xpPickups[idx] = undefined;
      }
    }
  }
}
