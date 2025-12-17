import { Component, EventEmitter, GameEvent, Logger } from "excalibur";
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
  labelClass?: string;
  img: Promise<HTMLImageElement>;
  weapon?: WeaponData;
  data?: RolledUpgradeData;
}

// biome-ignore lint/suspicious/noExplicitAny: the whole point is to detect anything
export function isUpgradeUIData(x: any): x is UpgradeUIData {
  return typeof x.data === "object" && typeof x.labelClass === "string";
}

export type RolledUpgradeData = {
  amount: number;
  meta?: UpgradeAttributeRarityRange;
};

export enum UpgradeAttribute {
  Speed, // how quickly the weapon actor moves
  Damage, // how much damage the weapon deals
  Size, // how much space the weapon actor occupies on the screen
  Interval, // how quickly the next weapon actor spawns
  Amount, // how many of the weapon actors are spawned at a time
  Lifetime, // how long the weapon actor stays active before despawning
}

export enum UpgradeRarity {
  // Common,
  Uncommon,
  Rare,
  Epic,
  Legendary,
}

const RarityWeights = {
  [UpgradeRarity.Legendary]: 0.05,
  [UpgradeRarity.Epic]: 0.1,
  [UpgradeRarity.Rare]: 0.25,
  [UpgradeRarity.Uncommon]: 0.6,
  // [UpgradeRarity.Common]: 0.5,
};

export const RarityCSSClassMap = {
  [UpgradeRarity.Legendary]: "rarity-legendary",
  [UpgradeRarity.Epic]: "rarity-epic",
  [UpgradeRarity.Rare]: "rarity-rare",
  [UpgradeRarity.Uncommon]: "rarity-uncommon",
  // [UpgradeRarity.Common]: "rarity-common",
};

type UpgradeAttributeRarityValueRange = {
  rarity: UpgradeRarity;
  min: number;
  max: number;
};

type UpgradeAttributeRarityRange = {
  attribute: UpgradeAttribute;
  units?: string;
  values: UpgradeAttributeRarityValueRange[];
};

const UpgradeValues: UpgradeAttributeRarityRange[] = [
  {
    attribute: UpgradeAttribute.Amount,
    values: [
      // {
      //   rarity: UpgradeRarity.Common,
      //   min: 0.4,
      //   max: 0.8,
      // },
      {
        rarity: UpgradeRarity.Uncommon,
        min: 0.7,
        max: 0.9,
      },
      {
        rarity: UpgradeRarity.Rare,
        min: 1.0,
        max: 1.4,
      },
      {
        rarity: UpgradeRarity.Epic,
        min: 1.5,
        max: 1.9,
      },
      {
        rarity: UpgradeRarity.Legendary,
        min: 1.7,
        max: 2.2,
      },
    ],
  },
  {
    attribute: UpgradeAttribute.Damage,
    units: "%",
    values: [
      // {
      //   rarity: UpgradeRarity.Common,
      //   min: 0.02,
      //   max: 0.04,
      // },
      {
        rarity: UpgradeRarity.Uncommon,
        min: 0.04,
        max: 0.07,
      },
      {
        rarity: UpgradeRarity.Rare,
        min: 0.06,
        max: 0.1,
      },
      {
        rarity: UpgradeRarity.Epic,
        min: 0.15,
        max: 0.25,
      },
      {
        rarity: UpgradeRarity.Legendary,
        min: 0.2,
        max: 0.35,
      },
    ],
  },
  {
    attribute: UpgradeAttribute.Interval,
    units: "s", // todo: reconsider. this scale leads to some weapons dropping to a 0 interval really quickly and becoming massively overpowered.
    values: [
      // {
      //   rarity: UpgradeRarity.Common,
      //   min: -0.05,
      //   max: -0.1,
      // },
      {
        rarity: UpgradeRarity.Uncommon,
        min: -0.1,
        max: -0.15,
      },
      {
        rarity: UpgradeRarity.Rare,
        min: -0.15,
        max: -0.2,
      },
      {
        rarity: UpgradeRarity.Epic,
        min: -0.2,
        max: -0.27,
      },
      {
        rarity: UpgradeRarity.Legendary,
        min: -0.25,
        max: -0.32,
      },
    ],
  },
  {
    attribute: UpgradeAttribute.Lifetime,
    units: "s",
    values: [
      // {
      //   rarity: UpgradeRarity.Common,
      //   min: 0.1,
      //   max: 0.3,
      // },
      {
        rarity: UpgradeRarity.Uncommon,
        min: 0.25,
        max: 0.35,
      },
      {
        rarity: UpgradeRarity.Rare,
        min: 0.35,
        max: 0.45,
      },
      {
        rarity: UpgradeRarity.Epic,
        min: 0.4,
        max: 0.6,
      },
      {
        rarity: UpgradeRarity.Legendary,
        min: 0.7,
        max: 1.0,
      },
    ],
  },
  {
    attribute: UpgradeAttribute.Size,
    units: "%",
    values: [
      // {
      //   rarity: UpgradeRarity.Common,
      //   min: 0.05,
      //   max: 0.1,
      // },
      {
        rarity: UpgradeRarity.Uncommon,
        min: 0.1,
        max: 0.15,
      },
      {
        rarity: UpgradeRarity.Rare,
        min: 0.15,
        max: 0.2,
      },
      {
        rarity: UpgradeRarity.Epic,
        min: 0.2,
        max: 0.25,
      },
      {
        rarity: UpgradeRarity.Legendary,
        min: 0.25,
        max: 0.3,
      },
    ],
  },
  {
    attribute: UpgradeAttribute.Speed,
    values: [
      // {
      //   rarity: UpgradeRarity.Common,
      //   min: 0.1,
      //   max: 0.15,
      // },
      {
        rarity: UpgradeRarity.Uncommon,
        min: 0.15,
        max: 0.2,
      },
      {
        rarity: UpgradeRarity.Rare,
        min: 0.2,
        max: 0.25,
      },
      {
        rarity: UpgradeRarity.Epic,
        min: 0.25,
        max: 0.3,
      },
      {
        rarity: UpgradeRarity.Legendary,
        min: 0.35,
        max: 0.4,
      },
    ],
  },
];

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

  private getRandomRarity(): UpgradeRarity {
    const roll = rand.next();
    let sum = 0;
    for (let i = 0; i < Object.values(UpgradeRarity).length / 2; i++) {
      const rarity = i as UpgradeRarity;
      sum += RarityWeights[rarity];
      if (roll <= sum) {
        return rarity;
      }
    }

    return UpgradeRarity.Uncommon;
  }

  private getUpgradeAmount(
    rarity: UpgradeRarity,
    attribute: UpgradeAttribute,
  ): RolledUpgradeData {
    const values = UpgradeValues.find((v) => v.attribute === attribute);
    const range = values?.values.find((v) => v.rarity === rarity);
    if (!range) {
      return { amount: 0 };
    }
    const roll = rand.floating(range.min, range.max);
    return { amount: roll, meta: values };
  }

  rollUpgrades(forPlayer: Player, numToRoll = 3): UpgradeUIData[] {
    const upgrades: UpgradeUIData[] = [];
    const chosenWeapons: WeaponData[] = [];

    // choose the attributes we'll draw from randomly
    const attributeIndices: UpgradeAttribute[] = [];
    for (let i = 0; i < Object.values(UpgradeAttribute).length / 2; i++) {
      attributeIndices.push(i);
    }
    const attributes = rand.shuffle(attributeIndices);

    for (let i = 0; i < numToRoll; i++) {
      // first, choose if we're getting a weapon or passive (todo: create passives)
      // second, decide if we get an upgrade or a new unlock
      const availableWeapons = Resources.WeaponData.data.filter(
        (wd) =>
          wd.selectable !== false &&
          !forPlayer.weapons.find((w) => w.definition === wd) &&
          !chosenWeapons.find((w) => w === wd),
      );
      const canGetNew =
        availableWeapons.length > 0 &&
        forPlayer.weapons.length < forPlayer.maxWeapons;
      const chooseNew = canGetNew && rand.bool();
      if (chooseNew) {
        const choice = rand.pickOne(availableWeapons);
        chosenWeapons.push(choice);
        upgrades.push({
          name: choice.displayName,
          img: Weapon.getSprite(choice, forPlayer.scene as GameLevel)!,
          label: choice.description,
          weapon: choice,
        });
      } else {
        const choice = rand.pickOne(forPlayer.weapons);
        let attribute = attributes.pop()!;
        // if the weapon doesn't have a lifetime, don't choose the Lifetime upgrade attribute
        if (!choice.lifetimeMs && attribute === UpgradeAttribute.Lifetime) {
          attribute = attributes.pop()!;
          // put it back into the pool in case we somehow run through them all
          attributes.push(UpgradeAttribute.Lifetime);
        }

        // if the weapon doesn't move, don't choose the Speed upgrade attribute
        if (
          choice.definition.spawnBehavior === "ownerLocation" &&
          attribute === UpgradeAttribute.Speed
        ) {
          attribute = attributes.pop()!;
          // put it back into the pool in case we somehow run through them all
          attributes.push(UpgradeAttribute.Speed);
        }

        const rarity = this.getRandomRarity();
        const rarityClass = RarityCSSClassMap[rarity];
        const upgradeData = this.getUpgradeAmount(rarity, attribute);
        // todo: can/should we support special upgrade types like allowing a weapon to bounce to another enemy
        // or go through X number of enemies? won't apply to everything...

        let labelAmount =
          upgradeData.amount > 1
            ? upgradeData.amount.toPrecision(2)
            : upgradeData.amount.toPrecision(1);
        if (upgradeData.meta?.units === "%") {
          labelAmount = Math.round(upgradeData.amount * 100).toString();
        }
        upgrades.push({
          name: choice.definition.displayName,
          img: Weapon.getSprite(
            choice.definition,
            forPlayer.scene as GameLevel,
          )!,
          label: `${labelAmount}${upgradeData.meta?.units ?? ""} ${
            UpgradeAttribute[upgradeData.meta?.attribute ?? 0]
          }`,
          labelClass: rarityClass,
          weapon: choice.definition,
          data: upgradeData,
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

      const elemLabel = elem.querySelector(".label")!;
      elemLabel.innerHTML = upgrades[i].label ?? "";
      elemLabel.classList.remove(...Object.values(RarityCSSClassMap));
      if (upgrades[i].labelClass) {
        elemLabel.classList.add(upgrades[i].labelClass!);
      }

      const imgElem = elem.querySelector(".img") as HTMLElement;
      imgElem.replaceChildren(); // todo: should be a loading image, maybe? but the callback hits almost immediately so maybe not.
      upgrades[i].img.then((v) => {
        imgElem.replaceChildren(v);
      });
    }
    unhideElement(this.elemUpgrade);
  }
}
