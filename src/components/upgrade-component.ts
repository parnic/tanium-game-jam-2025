import { Component, Logger } from "excalibur";
import { GameEngine } from "../game-engine";
import { hideElement, showElement, unhideElement } from "../utilities/html";

export interface UpgradeData {
  name: string;
  label: string;
  img: HTMLImageElement;
}

export class UpgradeComponent extends Component {
  elemUpgrade: HTMLElement;

  constructor() {
    super();

    this.elemUpgrade = document.querySelector("#upgrades")!;
  }

  presentUpgrades(upgrades: UpgradeData[]) {
    if (this.owner?.scene?.engine instanceof GameEngine) {
      this.owner.scene.engine.togglePause(true);
    }

    for (let i = 0; i < 3; i++) {
      const id = `upgrade-${(i + 1).toString()}`;
      const elem = this.elemUpgrade.querySelector(`#${id}`)!;

      if (upgrades.length <= i) {
        hideElement(elem);
        continue;
      }

      showElement(elem);
      elem.querySelector(".name")!.innerHTML = upgrades[i].name;
      elem.querySelector(".label")!.innerHTML = upgrades[i].label;
      const img = upgrades[i].img.cloneNode() as HTMLImageElement;
      img.style.setProperty("width", "100%");
      elem.querySelector(".img")?.replaceChildren(img);
    }
    unhideElement(this.elemUpgrade);

    this.elemUpgrade.querySelectorAll(".upgrade").forEach((elem) => {
      elem.addEventListener("click", () => {
        Logger.getInstance().info(`Choosing upgrade ${elem.id}`);
        hideElement(this.elemUpgrade);

        if (this.owner?.scene?.engine instanceof GameEngine) {
          this.owner.scene.engine.togglePause(false);
        }
      });
    });
  }
}
