import {
  Animation,
  Axes,
  Buttons,
  Collider,
  CollisionContact,
  CollisionType,
  Engine,
  Gamepad,
  Keys,
  Logger,
  PointerButton,
  PointerType,
  Side,
  vec,
  Vector,
} from "excalibur";
import { Tile } from "@excaliburjs/plugin-tiled";
import { GameLevel } from "./game-level";
import { GameActor, TiledCollision } from "./game-actor";
import { Enemy } from "./enemy";
import { config } from "./config";
import { showElement } from "./utilities/html";
import { Gift } from "./gift";
import { Weapon } from "./weapon";
import { GameEngine } from "./game-engine";

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
  // lastGamepadDpad = Vector.Zero;
  gamepadDeadzone = 0.2;
  giftsCollected = 0;
  giftsNeeded = 0;
  kills = 0;
  weapons: Weapon[] = [];

  healthbarContainerElem: HTMLElement;
  healthbarElem: HTMLElement;

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

    this.z = config.ZIndexCharacter;
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

    this.healthbarContainerElem = document.getElementById(
      "player-healthbar-container",
    )!;
    this.healthbarElem = document.getElementById("player-healthbar")!;
    this.health = 10;
  }

  giveWeapon(name: string) {
    if (!(this.scene instanceof GameLevel)) {
      return;
    }

    const weapon = new Weapon(name, this.scene.tiledLevel, this);
    this.scene.add(weapon);
    this.weapons.push(weapon);
  }

  override onInitialize(engine: Engine) {
    if (this.scene instanceof GameLevel) {
      this.giftsNeeded = this.scene.gifts.length;
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
      }
    });

    engine.input.keyboard.on("press", (evt) => {
      switch (evt.key) {
        case Keys.K:
          if (
            !this.isKilled() &&
            engine.input.keyboard.isHeld(Keys.ShiftLeft)
          ) {
            this.kill();
          }
          break;

        case Keys.G:
          if (engine.input.keyboard.isHeld(Keys.ShiftLeft)) {
            this.isGodMode = !this.isGodMode;
          }
          break;

        case Keys.H:
          if (engine.input.keyboard.isHeld(Keys.ShiftLeft)) {
            this.isDemigodMode = !this.isDemigodMode;
          }
          break;

        case Keys.M:
          if (engine.input.keyboard.isHeld(Keys.ShiftLeft)) {
            (engine as GameEngine).togglePlayersOnly();
            break;
          }
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

    this.healthbarElem.setAttribute("max", this.health.toString());
    showElement(this.healthbarContainerElem);

    // todo: temp - determine starting weapon differently
    this.giveWeapon("rocket-small");
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
      this.currMove = this.currMove.add(this.lastGamepadAxis);

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

    if (this.pointerMoveSource) {
      this.currMove = this.currMove.add(
        engine.input.pointers.primary.lastScreenPos.sub(this.pointerMoveSource),
      );
    }

    const healthbarCoords = engine.screen
      .worldToPageCoordinates(this.pos)
      .add(vec(-this.width / 2, this.height / 2));
    this.healthbarContainerElem.style.setProperty(
      "--pointer-x",
      `${healthbarCoords.x.toString()}px`,
    );
    this.healthbarContainerElem.style.setProperty(
      "--pointer-y",
      `${healthbarCoords.y.toString()}px`,
    );

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
    if (other.owner instanceof Gift) {
      // todo: spawn some cool effect, shake screen maybe, celebrate
      other.owner.kill();
      this.giftsCollected++;
      Logger.getInstance().info(
        `Player collected gift ${this.giftsCollected.toString()} out of ${this.giftsNeeded.toString()}.`,
      );

      if (this.giftsCollected === this.giftsNeeded) {
        // todo: hint player to return to ship
        Logger.getInstance().info(
          "All gifts collected! Get outta here, you rascal.",
        );
      }
    }
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
    this.takeDamage(1);
  }

  protected override onHealthReachedZero(): void {
    // todo: spawn corpse/effect? need to show a "you died" ui for sure
    this.kill();
    this.weapons = [];
  }

  protected override onHealthChanged(): void {
    this.healthbarElem.setAttribute("value", this.health.toString());
  }
}
