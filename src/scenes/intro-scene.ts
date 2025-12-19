import { type Engine, Scene, type SceneActivationContext } from "excalibur";
import * as html from "../utilities/html";
import { goToNextScene } from "../utilities/scene-manager";

export class IntroScene extends Scene {
  elemIntros: HTMLElement[] = [];
  introIdx = -1;
  totalElapsed = 0;

  override onInitialize(engine: Engine): void {
    this.elemIntros.push(document.getElementById("intro1") as HTMLElement);
    this.elemIntros.push(document.getElementById("intro2") as HTMLElement);
    this.elemIntros.push(document.getElementById("intro3") as HTMLElement);
  }

  override onActivate(
    context: SceneActivationContext<unknown, undefined>,
  ): void {
    this.showNextIntro();
  }

  showNextIntro() {
    if (this.introIdx >= 0) {
      html.hideElement(this.elemIntros[this.introIdx]);
    }

    this.introIdx++;
    if (this.introIdx === this.elemIntros.length) {
      goToNextScene(this.engine);
      return;
    }

    html.unhideElement(this.elemIntros[this.introIdx]);
    this.engine.input.pointers.primary.once("down", () => {
      this.showNextIntro();
    });
  }
}
