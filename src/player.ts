import type { Tile } from "@excaliburjs/plugin-tiled";
import {
  type ActorEvents,
  Animation,
  Axes,
  Buttons,
  type Collider,
  type CollisionContact,
  CollisionType,
  type Engine,
  EventEmitter,
  GameEvent,
  type Gamepad,
  Keys,
  Logger,
  PointerButton,
  PointerType,
  type Scene,
  type Side,
  Vector,
  vec,
} from "excalibur";
import {
  type UpgradeChosenEvent,
  UpgradeComponent,
} from "./components/upgrade-component";
import {
  type GainedXpEvent,
  type LeveledUpEvent,
  XpComponent,
} from "./components/xp-component";
import * as Confetti from "./confetti";
import { config } from "./config";
import type { Enemy } from "./enemy";
import { LevelExit } from "./exit";
import { GameActor, TiledCollision } from "./game-actor";
import { GameEngine } from "./game-engine";
import { Gift } from "./gift";
import { Resources } from "./resources";
import { GameLevel } from "./scenes/game-level";
import type { PerlinNoiseCameraStrategy } from "./strategy-noise";
import * as Audio from "./utilities/audio";
import { hideElement, showElement } from "./utilities/html";
import { Weapon, type WeaponData } from "./weapon";

export interface CharacterData {
  name: string;
  startingWeapon: string;
}

interface PlayerEvents {
  ButtonPressed: ButtonPressedEvent;
  GiftCollected: GiftCollectedEvent;
}

export class ButtonPressedEvent extends GameEvent<void> {}

export class GiftCollectedEvent extends GameEvent<void> {
  gift: Gift;

  constructor(gift: Gift) {
    super();
    this.gift = gift;
  }
}

export const PlayerEvents = {
  ButtonPressed: "ButtonPressed",
  GiftCollected: "GiftCollected",
} as const;

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
  public events = new EventEmitter<ActorEvents & PlayerEvents>();

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
  xpComponent: XpComponent;
  upgradeComponent: UpgradeComponent;
  weapons: Weapon[] = [];
  maxWeapons = 3;
  pickupDistanceSq = 200 * 200;
  characterData?: CharacterData;
  reachedExit = false;

  healthbarContainerElem: HTMLElement;
  healthbarElem: HTMLElement;
  equipmentBarElem: HTMLElement;

  cameraShake?: PerlinNoiseCameraStrategy;

  constructor(inPos: Vector, tile: Tile, characterName: string) {
    super({
      name: "Player",
      pos: inPos,
      width: tile.tileset.tileWidth,
      height: tile.tileset.tileHeight,
      z: config.ZIndexCharacter,
      collisionType: CollisionType.Active,
      collisionDef: new TiledCollision(tile),
    });

    this.characterData = Resources.CharacterData.data.find(
      (d) => d.name === characterName,
    );
    if (!this.characterData) {
      Logger.getInstance().error(
        `Unable to locate CharacterData for chosen character ${characterName}`,
      );
    }

    this.invulnerabilityWindowMs = 300;
    this._speed = 0.6;
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
    this._maxHealth = 10;

    this.equipmentBarElem = document.getElementById("equipment-bar")!;

    this.xpComponent = new XpComponent();
    this.addComponent(this.xpComponent);
    this.xpComponent.events.on("GainedXp", (evt) => {
      this.onGainedXp(evt);
    });
    this.xpComponent.events.on("LeveledUp", (evt) => {
      this.onLeveledUp(evt);
    });

    this.upgradeComponent = new UpgradeComponent();
    this.upgradeComponent.events.on("UpgradeChosen", (evt) => {
      this.onUpgradeChosen(evt);
    });
    this.addComponent(this.upgradeComponent);
  }

  onGainedXp(evt: GainedXpEvent) {
    if (!(this.scene instanceof GameLevel)) {
      return;
    }

    this.scene.updateXpBar(this.xpComponent);
  }

  onLeveledUp(evt: LeveledUpEvent) {
    if (!(this.scene instanceof GameLevel)) {
      return;
    }

    this.scene.updateXpBar(this.xpComponent);

    this.chooseAndPresentUpgrades();
  }

  onUpgradeChosen(evt: UpgradeChosenEvent) {
    Audio.playSelectUpgradeSfx();

    if (evt.upgrade.data) {
      const weapon = this.weapons.find(
        (w) => w.definition === evt.upgrade.weapon,
      );
      weapon?.applyUpgrade(evt.upgrade);
    } else if (evt.upgrade.weapon) {
      this.giveWeapon(evt.upgrade.weapon);
    }
  }

  chooseAndPresentUpgrades() {
    Audio.playLevelUpSfx();
    const upgrades = this.upgradeComponent.rollUpgrades(this);
    this.upgradeComponent.presentUpgrades(upgrades);
  }

  giveWeapon(weaponData: WeaponData) {
    if (!(this.scene instanceof GameLevel)) {
      return;
    }

    const weapon = new Weapon(weaponData, this.scene.tiledLevel, this);
    this.scene.add(weapon);
    this.weapons.push(weapon);

    const idx = this.weapons.length - 1;
    const slots = this.equipmentBarElem.querySelectorAll(".eq-img");
    if (slots.length <= idx) {
      Logger.getInstance().error(
        "tried to add more weapons than we support showing on the ui; add code to dynamically create a new container",
      );
      return;
    }
    const prom = Weapon.getSprite(weaponData, this.scene);
    prom?.then((v) => {
      const cloned = v.cloneNode() as HTMLImageElement;
      cloned.style.setProperty(
        "width",
        (slots[idx] as HTMLElement).style.getPropertyValue("width"),
      );
      cloned.style.setProperty(
        "height",
        (slots[idx] as HTMLElement).style.getPropertyValue("height"),
      );
      slots[idx].replaceChildren(cloned);
    });
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
      this.events.emit("ButtonPressed", new ButtonPressedEvent());

      switch (evt.key) {
        case Keys.Escape:
          if (engine instanceof GameEngine) {
            engine.togglePause(undefined, true);
          }
          break;

        case Keys.K:
          if (
            !this.isKilled() &&
            engine.input.keyboard.isHeld(Keys.ShiftLeft)
          ) {
            this.kill();
          }
          break;

        case Keys.L:
          if (
            engine.input.keyboard.isHeld(Keys.ShiftLeft) &&
            this.scene instanceof GameLevel
          ) {
            this.scene.enemies.forEach((e) => {
              e.takeDamage(e.health, true);
            });
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
          }
          break;

        case Keys.P:
          if (engine.input.keyboard.isHeld(Keys.ShiftLeft)) {
            (this.scene as GameLevel).xpPickups.forEach((p) => {
              if (p) {
                p.pickedUpBy = this;
              }
            });
          }
          break;

        case Keys.U:
          if (engine.input.keyboard.isHeld(Keys.ShiftLeft)) {
            this.chooseAndPresentUpgrades();
          }
          break;

        case Keys.O:
          if (engine.input.keyboard.isHeld(Keys.ShiftLeft)) {
            this.onPickedUpGift((this.scene as GameLevel).gifts[0]);
          }
          break;

        case Keys.C:
          if (engine.input.keyboard.isHeld(Keys.ShiftLeft)) {
            Confetti.triggerConfetti();
          }
          break;

        case Keys.N:
          if (engine.input.keyboard.isHeld(Keys.ShiftLeft)) {
            this.cameraShake?.induceStress(3);
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
    for (const gamepad of engine.input.gamepads.getValidGamepads()) {
      this.hookGamepadEvents(gamepad);
    }

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

    showElement(this.healthbarContainerElem);
    if (this.scene instanceof GameLevel) {
      this.scene.updateXpBar(this.xpComponent);
    }

    const eqSlots = this.equipmentBarElem.querySelectorAll(".eq-img");
    eqSlots.forEach((eq) => {
      eq.replaceChildren();
    });

    if (this.characterData) {
      const weapon = Resources.WeaponData.data.find(
        (w) => w.name === this.characterData!.startingWeapon,
      );
      if (!weapon) {
        Logger.getInstance().error(
          `Unable to give starting weapon ${this.characterData.startingWeapon} because no matching weapon data could be found.`,
        );
      } else {
        this.giveWeapon(weapon);
      }
    }
  }

  unhookAllEvents(scene: Scene): void {
    scene.engine.input.keyboard.off("hold");
    scene.engine.input.keyboard.off("press");
    scene.engine.input.gamepads.off("connect");
    scene.engine.input.gamepads.off("disconnect");
    for (const gamepad of scene.engine.input.gamepads.getValidGamepads()) {
      this.unhookGamepadEvents(gamepad);
    }
    scene.engine.input.pointers.primary.off("down");
    scene.engine.input.pointers.primary.off("up");
  }

  hookGamepadEvents(gamepad: Gamepad): void {
    gamepad.on("axis", (evt) => {
      if (evt.axis === Axes.LeftStickX) {
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
      if (evt.axis === Axes.LeftStickY) {
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
      this.events.emit("ButtonPressed", new ButtonPressedEvent());

      // claim input from this gamepad
      this.lastUsedGamepad = gamepad;

      // we can't actually use the directional buttons because "release" events aren't passed, only down, so evt.value is never 0.
      switch (evt.button) {
        // case Buttons.DpadDown:
        //   this.lastGamepadDpad.y = evt.value;
        //   break;

        // case Buttons.DpadUp:
        //   this.lastGamepadDpad.y = -evt.value;
        //   break;

        // case Buttons.DpadLeft:
        //   this.lastGamepadDpad.x = -evt.value;
        //   break;

        // case Buttons.DpadRight:
        //   this.lastGamepadDpad.x = evt.value;
        //   break;

        case Buttons.Start:
          if (this.scene?.engine instanceof GameEngine) {
            this.scene.engine.togglePause(undefined, true);
          }
          break;
      }
    });
  }

  unhookGamepadEvents(gamepad: Gamepad): void {
    gamepad.off("axis");
    gamepad.off("button");
  }

  override onPaused(paused: boolean): void {
    super.onPaused(paused);

    this.lastGamepadAxis = Vector.Zero;
    this.pointerMoveSource = undefined;
  }

  override onPreUpdate(engine: Engine, elapsedMs: number): void {
    super.onPreUpdate(engine, elapsedMs);
  }

  override onPostUpdate(engine: Engine, elapsedMs: number): void {
    if (engine instanceof GameEngine && engine.paused) {
      return;
    }

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

    const healthbarCoords = engine.screen.worldToPageCoordinates(
      this.pos.add(vec(-this.width / 2, this.height / 1.4)),
    );
    this.healthbarContainerElem.style.setProperty(
      "--pointer-x",
      `${healthbarCoords.x.toString()}px`,
    );
    this.healthbarContainerElem.style.setProperty(
      "--pointer-y",
      `${healthbarCoords.y.toString()}px`,
    );
    this.healthbarContainerElem.style.setProperty(
      "--width",
      `${(this.width * (this.scene?.camera.zoom ?? 0.4)).toString()}px`,
    );

    this.tryPickup();

    super.onPostUpdate(engine, elapsedMs);
  }

  override onPostKill(scene: Scene): void {
    hideElement(this.healthbarContainerElem);

    super.onPostKill(scene);
  }

  tryPickup() {
    if (!(this.scene instanceof GameLevel)) {
      return;
    }

    for (const pickup of this.scene.xpPickups) {
      if (!pickup || pickup.pickedUpBy) {
        continue;
      }

      if (this.pos.squareDistance(pickup.pos) <= this.pickupDistanceSq) {
        pickup.pickedUpBy = this;
      }
    }
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
      this.onPickedUpGift(other.owner);
    } else if (other.owner instanceof LevelExit) {
      if (this.giftsCollected === this.giftsNeeded) {
        this.reachedExit = true;
        this.kill();
      }
    }
  }

  private onPickedUpGift(gift: Gift) {
    Confetti.triggerConfetti();
    this.cameraShake?.induceStress(10);

    gift.kill();
    this.events.emit("GiftCollected", new GiftCollectedEvent(gift));
    this.giftsCollected++;
    Audio.playPickupGiftSfx();
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

  override onCollisionEnd(
    self: Collider,
    other: Collider,
    side: Side,
    lastContact: CollisionContact,
  ): void {
    // Called when a pair of objects separates
  }

  onHitByEnemy(enemy: Enemy): void {
    Audio.playPlayerTakeDamageSfx();

    this.takeDamage(1);
    this.cameraShake?.induceStress(4);
  }

  protected override onHealthReachedZero(): void {
    // todo: spawn corpse/effect?
    this.kill();
    this.weapons = [];
  }

  protected override onHealthChanged(): void {
    this.healthbarElem.style.setProperty(
      "--healthPercent",
      `${(this.healthPercent * 100).toString()}%`,
    );
  }
}
