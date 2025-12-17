import type { TiledResource } from "@excaliburjs/plugin-tiled";
import type { SceneActivationContext } from "excalibur";
import { GameEngine } from "../game-engine";
import * as html from "../utilities/html";
import { GameLevel, type LevelData } from "./game-level";

export type TutorialSceneConfigArgs = {
  showTutorial?: boolean;
};

const minTutorialShownDurationMs = 250;

export class TutorialScene extends GameLevel {
  private _tutorialPhase = -1;

  private readonly _tutorialSteps = [
    "The gifts you're supposed to deliver to Santa were scattered in the crash! Move with W/A/S/D, arrow keys, the left joystick of a gamepad, or tap-/click-and-drag with a virtual joystick.",
    "Collect the gifts scattered around the area while dealing with the native fauna. Get back to your ship once you've collected them all!",
    "If you collect enough enemy remains, you might just be able to use them to improve your weapons...",
  ];

  private static _seenTutorialKey = "seenTutorial";

  private _tutorialElement: HTMLElement;
  private _showTutorial: boolean = true;
  private _lastTutorialShownTime?: number;

  private _onClickHandler = () => this.goNextTutorialPhase();

  static shouldShow() {
    return localStorage.getItem(TutorialScene._seenTutorialKey) !== "true";
  }

  constructor(
    map: TiledResource,
    data: LevelData,
    config?: TutorialSceneConfigArgs,
  ) {
    super(map, data);

    this.showCharacterSelectOnActivate = false;
    this._tutorialElement = document.getElementById("tutorial")!;

    this._showTutorial = config?.showTutorial ?? TutorialScene.shouldShow();
  }

  override onActivate(context: SceneActivationContext<unknown>): void {
    super.onActivate(context);

    if (!this._showTutorial || !(this.engine instanceof GameEngine)) {
      return;
    }

    this.engine.togglePause(true, false);

    document.addEventListener("click", this._onClickHandler);
    this.engine.input.pointers.primary.on("down", this._onClickHandler);
    this.engine.input.keyboard.on("press", this._onClickHandler);
    // need to add gamepad button handling here

    this.goNextTutorialPhase();
  }

  private onTutorialComplete() {
    if (html.elementIsVisible(this._tutorialElement)) {
      html.hideElement(this._tutorialElement);
    }

    if (this.engine instanceof GameEngine) {
      this.engine.togglePause(false);
    }

    document.removeEventListener("click", this._onClickHandler);
    this.engine.input.pointers.primary.off("down", this._onClickHandler);
    this.engine.input.keyboard.off("press", this._onClickHandler);

    localStorage.setItem(TutorialScene._seenTutorialKey, "true");

    this.showCharacterSelect();
  }

  private goNextTutorialPhase() {
    // suppress double-taps so someone doesn't miss a tutorial
    const now = this.engine.clock.now();
    if (
      this._lastTutorialShownTime &&
      now - this._lastTutorialShownTime < minTutorialShownDurationMs
    ) {
      return;
    }

    this._lastTutorialShownTime = now;
    this._tutorialPhase++;

    if (this._tutorialSteps.length > this._tutorialPhase) {
      this._tutorialElement.textContent =
        this._tutorialSteps[this._tutorialPhase];
      html.unhideElement(this._tutorialElement);
    } else {
      this.onTutorialComplete();
    }
  }
}
