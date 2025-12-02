import { Component } from "excalibur";
import { hideElement, unhideElement } from "../utilities/html";

export class UpgradeComponent extends Component {
  elemUpgrade: HTMLElement;

  constructor() {
    super();

    this.elemUpgrade = document.getElementById("upgrades")!;
  }

  chooseUpgrade() {
    unhideElement(this.elemUpgrade);
    this.elemUpgrade
      .querySelector("#upgrade-1")
      ?.addEventListener("click", () => {
        hideElement(this.elemUpgrade);
      });
  }
}
