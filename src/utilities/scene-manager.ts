import type { TiledResource } from "@excaliburjs/plugin-tiled";
import { Buttons, type Engine, Keys, type Scene } from "excalibur";
import {
  RarityCSSClassMap,
  type RarityCSSClassMapKey,
  UpgradeRarity,
} from "../components/upgrade-component";
import { LevelDataResources, LevelResources } from "../resources";
import { GameLevel, type LevelData } from "../scenes/game-level";
import { IntroScene } from "../scenes/intro-scene";
import { TransitionScene } from "../scenes/transition-scene";
import { TutorialScene } from "../scenes/tutorial-scene";
import * as Audio from "../utilities/audio";
import { Weapon } from "../weapon";
import * as html from "./html";

enum SceneType {
  Intro,
  Tutorial,
  Game,
}

let _engine: Engine;

const elemRoundEnd = document.getElementById("round-end")!;
const elemRestart = document.getElementById("restart")!;

let restartShownTime = 0;
const restartShowDelayMs = 500;

const restartClickHandler = () => {
  if (_engine.clock.now() <= restartShownTime + restartShowDelayMs) {
    return;
  }

  void reloadCurrentScene(_engine);
  html.hideElement(elemRoundEnd);
};

elemRestart.addEventListener("click", restartClickHandler);

export class SceneData {
  name = "";
  map?: TiledResource;
  nextScene = "";
  type: SceneType = SceneType.Game;
  levelData?: LevelData;

  constructor(
    name: string,
    nextScene: string,
    type: SceneType,
    levelData?: LevelData,
    map?: TiledResource,
  ) {
    this.name = name;
    this.map = map;
    this.nextScene = nextScene;
    this.type = type;
    this.levelData = levelData;
  }
}

const sceneList: SceneData[] = [];

export function init() {
  sceneList.push({
    name: "intro",
    nextScene: "level1",
    type: SceneType.Intro,
  });

  sceneList.push({
    name: "level1",
    map: LevelResources.level1,
    nextScene: "",
    type: SceneType.Tutorial,
    levelData: LevelDataResources.level1.data,
  });
}

function getSceneDataByName(name: string): SceneData | undefined {
  const targetSceneData = sceneList.find((s) => s.name === name);
  return targetSceneData;
}

export function getCurrentSceneData(engine: Engine): SceneData | undefined {
  const currentSceneDataIdx = sceneList.findIndex(
    (s) => s.name === engine.currentSceneName,
  );
  if (currentSceneDataIdx === -1) {
    return undefined;
  }

  return sceneList[currentSceneDataIdx];
}

export function isFinalStage(engine: Engine): boolean {
  const currentSceneDataIdx = sceneList.findIndex(
    (s) => s.name === engine.currentSceneName,
  );
  return currentSceneDataIdx === sceneList.length - 1;
}

export function getNextSceneData(engine: Engine): SceneData | undefined {
  const currentSceneDataIdx = sceneList.findIndex(
    (s) => s.name === engine.currentSceneName,
  );
  if (currentSceneDataIdx === -1) {
    throw Error(
      `cannot find scene data for current active scene ${engine.currentSceneName}`,
    );
  }

  if (currentSceneDataIdx === sceneList.length - 1) {
    return undefined;
  }

  return sceneList[currentSceneDataIdx + 1];
}

export function getFirstSceneData(): SceneData {
  return sceneList[0];
}

function populateStats(parentElem: HTMLElement, scene: GameLevel) {
  const template = parentElem.querySelector(".template") as HTMLElement;
  const player = scene.player!;

  for (let i = parentElem.children.length - 1; i >= 0; i--) {
    const child = parentElem.children.item(i);
    if (!child?.classList.contains("template")) {
      child?.remove();
    }
  }

  const damageTiers: number[] = [];
  const dpsTiers: number[] = [];
  const killsTiers: number[] = [];
  for (const weapon of player.weapons) {
    damageTiers.push(Math.round(weapon.damageDealt * 10) / 10);
    dpsTiers.push(
      Math.round((weapon.damageDealt / (weapon.aliveTime / 1000)) * 10) / 10,
    );
    killsTiers.push(weapon.kills);
  }
  damageTiers.sort((a, b) => b - a);
  dpsTiers.sort((a, b) => b - a);
  killsTiers.sort((a, b) => b - a);

  const numRarities = Object.values(UpgradeRarity).length / 2;

  for (const weapon of player.weapons) {
    const statBlock = template.cloneNode(true) as HTMLElement;
    statBlock.classList.remove("template");

    const elemName = statBlock.querySelector(".name") as HTMLElement;
    elemName.innerText = weapon.definition.displayName;

    const elemImg = statBlock.querySelector(".img") as HTMLElement;
    Weapon.getSprite(weapon.definition, scene)?.then((v) =>
      elemImg.appendChild(v),
    );

    const elemDamage = statBlock.querySelector(".damage") as HTMLElement;
    const dmg = Math.round(weapon.damageDealt * 10) / 10;
    const dmgTier = damageTiers.indexOf(dmg);
    elemDamage.classList.remove(...Object.values(RarityCSSClassMap));
    elemDamage.classList.add(
      RarityCSSClassMap[(numRarities - dmgTier - 1) as RarityCSSClassMapKey],
    );
    elemDamage.innerText = dmg.toLocaleString();

    const elemDps = statBlock.querySelector(".dps") as HTMLElement;
    const dps =
      Math.round((weapon.damageDealt / (weapon.aliveTime / 1000)) * 10) / 10;
    const dpsTier = dpsTiers.indexOf(dps);
    elemDps.classList.remove(...Object.values(RarityCSSClassMap));
    elemDps.classList.add(
      RarityCSSClassMap[(numRarities - dpsTier - 1) as RarityCSSClassMapKey],
    );
    elemDps.innerText = dps.toLocaleString();

    const elemKills = statBlock.querySelector(".kills") as HTMLElement;
    const elemKillsPlural = statBlock.querySelector(
      ".kills-plural",
    ) as HTMLElement;
    const killsTier = killsTiers.indexOf(weapon.kills);
    elemKills.classList.remove(...Object.values(RarityCSSClassMap));
    elemKills.classList.add(
      RarityCSSClassMap[(numRarities - killsTier - 1) as RarityCSSClassMapKey],
    );
    elemKills.innerText = weapon.kills.toLocaleString();
    elemKillsPlural.innerText = weapon.kills === 1 ? "" : "s";

    html.unhideElement(statBlock);
    parentElem.appendChild(statBlock);
  }
}

export async function goToScene(
  nextSceneData: SceneData,
  engine: Engine,
  currentSceneData?: SceneData,
) {
  _engine = engine;

  const t = new TransitionScene();
  engine.addScene("transition", t);
  await engine.goToScene("transition");
  if (currentSceneData) {
    engine.removeScene(currentSceneData.name);
  }

  let nextScene: Scene;

  if (!Audio.isMusicStarted()) {
    Audio.playMusic();
  }

  if (nextSceneData.type === SceneType.Intro) {
    if (!TutorialScene.shouldShow()) {
      goToScene(
        getSceneDataByName(nextSceneData.nextScene)!,
        engine,
        nextSceneData,
      );
      return;
    }

    nextScene = new IntroScene();
  } else if (
    nextSceneData.type === SceneType.Tutorial &&
    TutorialScene.shouldShow()
  ) {
    nextScene = new TutorialScene(nextSceneData.map!, nextSceneData.levelData!);
  } else {
    nextScene = new GameLevel(nextSceneData.map!, nextSceneData.levelData!);
  }

  engine.addScene(nextSceneData.name, nextScene);

  await engine.goToScene(nextSceneData.name);
  engine.removeScene("transition");

  if (nextScene instanceof GameLevel) {
    nextScene.events.on("CharacterChosen", () => {
      nextScene.player!.on("postkill", () => {
        const elemText = elemRoundEnd.querySelector(
          "#round-end-text",
        )! as HTMLElement;
        elemText.classList.remove("success", "failure");

        if (nextScene.player?.reachedExit) {
          elemText.classList.add("success");
          elemText.innerText = "CHRISTMAS IS SAVED!";
        } else {
          elemText.classList.add("failure");
          elemText.innerText = "NO PRESENTS FOR CHRISTMAS :(";
        }

        populateStats(
          elemRoundEnd.querySelector(".stats") as HTMLElement,
          nextScene,
        );

        html.showElement(elemRoundEnd);

        restartShownTime = engine.clock.now();
        nextScene.player?.events.on("ButtonPressed", (evt) => {
          if (
            evt.key === Keys.Enter ||
            evt.key === Keys.Space ||
            evt.key === Keys.Esc ||
            evt.key === Keys.NumEnter ||
            evt.button === Buttons.Start ||
            evt.button === Buttons.Face1
          ) {
            restartClickHandler();
          }
        });
      });
    });
  }
}

export async function goToNextScene(engine: Engine) {
  const curr = getCurrentSceneData(engine);
  const next = getNextSceneData(engine);
  if (next) {
    await goToScene(next, engine, curr);
  }
}

export async function reloadCurrentScene(engine: Engine) {
  const curr = getCurrentSceneData(engine);
  await goToScene(curr!, engine, curr);
}
