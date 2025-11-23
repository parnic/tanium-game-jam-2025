import {
  Animation,
  Collider,
  CollisionContact,
  Engine,
  Keys,
  Side,
  Vector,
} from "excalibur";
import { Tile } from "@excaliburjs/plugin-tiled";
import { GameLevel } from "./game-level";
import { GameActor } from "./game-actor";

// Actors are the main unit of composition you'll likely use, anything that you want to draw and move around the screen
// is likely built with an actor

// They contain a bunch of useful components that you might use
// actor.transform
// actor.motion
// actor.graphics
// actor.body
// actor.collider
// actor.actions
// actor.pointer

export class Player extends GameActor {
  movementEnabled = true;
  tile: Tile;

  constructor(inPos: Vector, tile: Tile, width?: number, height?: number) {
    super({
      // Giving your actor a name is optional, but helps in debugging using the dev tools or debug mode
      // https://github.com/excaliburjs/excalibur-extension/
      // Chrome: https://chromewebstore.google.com/detail/excalibur-dev-tools/dinddaeielhddflijbbcmpefamfffekc
      // Firefox: https://addons.mozilla.org/en-US/firefox/addon/excalibur-dev-tools/
      name: "Player",
      pos: inPos,
      width: width,
      height: height,
      // anchor: vec(0, 0), // Actors default center colliders and graphics with anchor (0.5, 0.5)
      // collisionType: CollisionType.Active, // Collision Type Active means this participates in collisions read more https://excaliburjs.com/docs/collisiontypes
    });

    this._speed = 0.4;
    this.tile = tile;
    this._spriteFacing =
      (this.tile.properties.get("facing") as number) < 0
        ? Vector.Left
        : Vector.Right;

    this.walk = new Animation({
      frames: this.tile.animation.map((anim) => {
        return {
          graphic: this.tile.tileset.spritesheet.sprites[anim.tileid],
          duration: anim.duration,
        };
      }),
    });
  }

  override onInitialize(engine: Engine) {
    if (this.scene instanceof GameLevel) {
      this.scene.player = this;
    }
    super.onInitialize(engine);

    engine.input.keyboard.on("hold", (evt) => {
      switch (evt.key) {
        case Keys.W:
        case Keys.Up:
          this.currMove = this.currMove.add(Vector.Up);
          break;

        case Keys.A:
        case Keys.Left:
          this.currMove = this.currMove.add(Vector.Left);
          break;

        case Keys.S:
        case Keys.Down:
          this.currMove = this.currMove.add(Vector.Down);
          break;

        case Keys.D:
        case Keys.Right:
          this.currMove = this.currMove.add(Vector.Right);
          break;
      }
    });
  }

  override onPreUpdate(engine: Engine, elapsedMs: number): void {
    // Put any update logic here runs every frame before Actor builtins
  }

  override onPostUpdate(engine: Engine, elapsedMs: number): void {
    super.onPostUpdate(engine, elapsedMs);
  }

  override onPreCollisionResolve(
    self: Collider,
    other: Collider,
    side: Side,
    contact: CollisionContact,
  ): void {
    // Called before a collision is resolved, if you want to opt out of this specific collision call contact.cancel()
  }

  override onPostCollisionResolve(
    self: Collider,
    other: Collider,
    side: Side,
    contact: CollisionContact,
  ): void {
    // Called every time a collision is resolved and overlap is solved
  }

  override onCollisionStart(
    self: Collider,
    other: Collider,
    side: Side,
    contact: CollisionContact,
  ): void {
    // Called when a pair of objects are in contact
  }

  override onCollisionEnd(
    self: Collider,
    other: Collider,
    side: Side,
    lastContact: CollisionContact,
  ): void {
    // Called when a pair of objects separates
  }
}
