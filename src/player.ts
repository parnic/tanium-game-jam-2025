import {
  Animation,
  Axes,
  Buttons,
  Collider,
  CollisionContact,
  CollisionType,
  Color,
  Engine,
  Gamepad,
  Keys,
  PointerButton,
  PointerType,
  Side,
  Vector,
} from "excalibur";
import { Tile } from "@excaliburjs/plugin-tiled";
import { GameLevel } from "./game-level";
import { GameActor, TiledCollision } from "./game-actor";
import { Enemy } from "./enemy";

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
  pointerMoveSource?: Vector;
  lastUsedGamepad?: Gamepad;
  lastGamepadAxis = Vector.Zero;
  lastGamepadDpad = Vector.Zero;
  gamepadDeadzone = 0.2;

  constructor(inPos: Vector, tile: Tile) {
    super({
      // Giving your actor a name is optional, but helps in debugging using the dev tools or debug mode
      // https://github.com/excaliburjs/excalibur-extension/
      // Chrome: https://chromewebstore.google.com/detail/excalibur-dev-tools/dinddaeielhddflijbbcmpefamfffekc
      // Firefox: https://addons.mozilla.org/en-US/firefox/addon/excalibur-dev-tools/
      name: "Player",
      pos: inPos,
      width: tile.tileset.tileWidth,
      height: tile.tileset.tileHeight,
      collisionType: CollisionType.Active,
      collisionDef: new TiledCollision(tile),
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
      // disable gamepad input
      this.lastUsedGamepad = undefined;

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

        case Keys.K:
          if (
            !this.isKilled() &&
            engine.input.keyboard.isHeld(Keys.ShiftLeft)
          ) {
            this.kill();
          }
          break;
      }
    });

    engine.input.gamepads.enabled = true;
    engine.input.gamepads.on("connect", (evt) => {
      this.hookGamepadEvents(evt.gamepad);
    });
    engine.input.gamepads.on("disconnect", (evt) => {
      this.unhookGamepadEvents(evt.gamepad);
    });

    engine.input.pointers.primary.on("down", (evt) => {
      // disable gamepad input
      this.lastUsedGamepad = undefined;
      if (
        evt.button === PointerButton.Left ||
        evt.pointerType !== PointerType.Mouse
      ) {
        this.pointerMoveSource = evt.screenPos;
      }
    });
    engine.input.pointers.primary.on("up", (evt) => {
      if (
        evt.button === PointerButton.Left ||
        evt.pointerType !== PointerType.Mouse
      ) {
        this.pointerMoveSource = undefined;
      }
    });
  }

  hookGamepadEvents(gamepad: Gamepad): void {
    gamepad.on("axis", (evt) => {
      if (evt.axis == Axes.LeftStickX) {
        if (Math.abs(evt.value) < this.gamepadDeadzone) {
          if (gamepad === this.lastUsedGamepad) {
            this.lastGamepadAxis.x = 0;
          }
        } else {
          // claim input from this gamepad
          this.lastUsedGamepad = gamepad;
          this.lastGamepadAxis.x = evt.value;
        }
      }
      if (evt.axis == Axes.LeftStickY) {
        if (Math.abs(evt.value) < this.gamepadDeadzone) {
          if (gamepad === this.lastUsedGamepad) {
            this.lastGamepadAxis.y = 0;
          }
        } else {
          // claim input from this gamepad
          this.lastUsedGamepad = gamepad;
          this.lastGamepadAxis.y = evt.value;
        }
      }
    });

    gamepad.on("button", (evt) => {
      // claim input from this gamepad
      this.lastUsedGamepad = gamepad;

      // we can't actually use this because "release" events aren't passed, only down, so evt.value is never 0.
      // switch (evt.button) {
      //   case Buttons.DpadDown:
      //     this.lastGamepadDpad.y = evt.value;
      //     break;

      //   case Buttons.DpadUp:
      //     this.lastGamepadDpad.y = -evt.value;
      //     break;

      //   case Buttons.DpadLeft:
      //     this.lastGamepadDpad.x = -evt.value;
      //     break;

      //   case Buttons.DpadRight:
      //     this.lastGamepadDpad.x = evt.value;
      //     break;
      // }
    });
  }

  unhookGamepadEvents(gamepad: Gamepad): void {
    gamepad.off("axis");
    gamepad.off("button");
  }

  override onPreUpdate(engine: Engine, elapsedMs: number): void {
    // Put any update logic here runs every frame before Actor builtins
  }

  override onPostUpdate(engine: Engine, elapsedMs: number): void {
    if (this.lastUsedGamepad) {
      this.currMove = this.lastGamepadAxis;

      const gamepad = this.lastUsedGamepad;
      if (gamepad.isButtonHeld(Buttons.DpadDown)) {
        this.currMove = this.currMove.add(Vector.Down);
      }
      if (gamepad.isButtonHeld(Buttons.DpadUp)) {
        this.currMove = this.currMove.add(Vector.Up);
      }
      if (gamepad.isButtonHeld(Buttons.DpadLeft)) {
        this.currMove = this.currMove.add(Vector.Left);
      }
      if (gamepad.isButtonHeld(Buttons.DpadRight)) {
        this.currMove = this.currMove.add(Vector.Right);
      }
    }

    // pointer input overrides all other types of input
    if (this.pointerMoveSource) {
      this.currMove = engine.input.pointers.primary.lastScreenPos.sub(
        this.pointerMoveSource,
      );
    }

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

  onHitByEnemy(enemy: Enemy): void {
    this.actions.flash(Color.White, 150);
  }
}
