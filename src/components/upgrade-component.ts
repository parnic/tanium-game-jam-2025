import {
  Component,
  EventEmitter,
  GameEvent,
  Logger,
  type Sprite,
} from "excalibur";
import { GameEngine } from "../game-engine";
import type { Player } from "../player";
import { Resources } from "../resources";
import type { GameLevel } from "../scenes/game-level";
import { hideElement, showElement, unhideElement } from "../utilities/html";
import { rand } from "../utilities/math";
import { Weapon, type WeaponData } from "../weapon";

export interface UpgradeUIData {
  name: string;
  label?: string;
  img: Sprite;
  weapon?: WeaponData;
}

export enum UpgradeAttribute {
  Speed, // how quickly the weapon actor moves
  Damage, // how much damage the weapon deals
  Size, // how much space the weapon actor occupies on the screen
  Interval, // how quickly the next weapon actor spawns
  Amount, // how many of the weapon actors are spawned at a time
  Lifetime, // how long the weapon actor stays active before despawning
}

interface UpgradeEvents {
  UpgradeChosen: UpgradeChosenEvent;
}

export class UpgradeChosenEvent extends GameEvent<void> {
  upgrade: UpgradeUIData;

  constructor(upgrade: UpgradeUIData) {
    super();

    this.upgrade = upgrade;
  }
}

export const UpgradeEvents = {
  UpgradeChosen: "UpgradeChosen",
} as const;

export class UpgradeComponent extends Component {
  public events = new EventEmitter<UpgradeEvents>();
  private currentUpgrades: UpgradeUIData[] = [];

  elemUpgrade: HTMLElement;

  constructor() {
    super();

    this.elemUpgrade = document.querySelector("#upgrades")!;

    this.hookEvents();
  }

  private hookEvents() {
    this.elemUpgrade.querySelectorAll(".upgrade").forEach((elem) => {
      elem.addEventListener("click", () => {
        Logger.getInstance().info(`Choosing upgrade ${elem.id}`);
        hideElement(this.elemUpgrade);

        const idx = Number((elem as HTMLElement).dataset.idx);

        this.events.emit(
          UpgradeEvents.UpgradeChosen,
          new UpgradeChosenEvent(this.currentUpgrades[idx]),
        );

        if (this.owner?.scene?.engine instanceof GameEngine) {
          this.owner.scene.engine.togglePause(false);
        }
      });
    });
  }

  rollUpgrades(forPlayer: Player, numToRoll = 3): UpgradeUIData[] {
    const upgrades: UpgradeUIData[] = [];

    for (let i = 0; i < numToRoll; i++) {
      // first, choose if we're getting a weapon or passive (todo: create passives)
      // second, decide if we get an upgrade or a new unlock
      const availableWeapons = Resources.WeaponData.data.filter(
        (wd) => !forPlayer.weapons.find((w) => w.definition === wd),
      );
      const canGetNew =
        availableWeapons.length > 0 &&
        forPlayer.weapons.length < forPlayer.maxWeapons;
      const chooseNew = canGetNew && rand.bool();
      if (chooseNew) {
        const choice = rand.pickOne(availableWeapons);
        upgrades.push({
          name: choice.displayName,
          img: Weapon.getSprite(choice, forPlayer.scene as GameLevel)!,
          weapon: choice,
        });
      } else {
        // third, decide the stat we upgrade
        const attrIdx = rand.integer(
          0,
          Object.values(UpgradeAttribute).length / 2 - 1,
        );
        const attribute = UpgradeAttribute[attrIdx];
        // todo: fourth, decide what rarity of upgrade we get?
        // todo: fifth, decide the upgrade amount (some stats should grant percent, some raw values)
        const choice = rand.pickOne(forPlayer.weapons);
        upgrades.push({
          name: choice.definition.displayName,
          img: Weapon.getSprite(
            choice.definition,
            forPlayer.scene as GameLevel,
          )!,
          label: `x% ${attribute}`,
        });
      }
    }

    return upgrades;
  }

  presentUpgrades(upgrades: UpgradeUIData[]) {
    this.currentUpgrades = upgrades;

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
      elem.querySelector(".label")!.innerHTML = upgrades[i].label ?? "";
      const imgElem = elem.querySelector(".img") as HTMLElement;
      imgElem.style.setProperty(
        "--background-image",
        `url(${upgrades[i].img.image.data.src})`,
      );
      imgElem.style.setProperty(
        "--background-x",
        `-${upgrades[i].img.sourceView.x.toString()}px`,
      );
      imgElem.style.setProperty(
        "--background-y",
        `-${upgrades[i].img.sourceView.y.toString()}px`,
      );
      imgElem.style.setProperty(
        "--width",
        `${upgrades[i].img.sourceView.width.toString()}px`,
      );
      imgElem.style.setProperty(
        "--height",
        `${upgrades[i].img.sourceView.height.toString()}px`,
      );
    }
    unhideElement(this.elemUpgrade);
  }
}
