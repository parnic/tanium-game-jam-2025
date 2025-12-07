import type { TiledResource } from "@excaliburjs/plugin-tiled";
import type { Engine } from "excalibur";
import { LevelResources } from "../resources";
import { GameLevel } from "../scenes/game-level";
import { TransitionScene } from "../scenes/transition-scene";
import { TutorialScene } from "../scenes/tutorial-scene";
import * as html from "./html";

enum SceneType {
  Tutorial,
  Game,
}

let _engine: Engine;

const elemGameOver = document.getElementById("you-died")!;
const elemRestart = document.getElementById("restart")!;

const restartClickHandler = () => {
  void reloadCurrentScene(_engine);
  html.hideElement(elemGameOver);
};

elemRestart.addEventListener("click", restartClickHandler);

export class SceneData {
  name = "";
  map: TiledResource;
  nextScene = "";
  type: SceneType = SceneType.Game;

  constructor(
    name: string,
    map: TiledResource,
    nextScene: string,
    type: SceneType,
  ) {
    this.name = name;
    this.map = map;
    this.nextScene = nextScene;
    this.type = type;
  }
}

const sceneList: SceneData[] = [
  {
    name: "level1",
    map: LevelResources[0],
    nextScene: "",
    type: SceneType.Tutorial,
  },
];

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

  let nextScene: GameLevel;

  if (nextSceneData.type === SceneType.Tutorial) {
    nextScene = new TutorialScene(nextSceneData.map, {
      showTutorial: !currentSceneData,
    });
  } else {
    nextScene = new GameLevel(nextSceneData.map);
  }

  engine.addScene(nextSceneData.name, nextScene);

  await engine.goToScene(nextSceneData.name);
  engine.removeScene("transition");

  nextScene.player?.on("postkill", () => {
    html.showElement(elemGameOver);

    nextScene.player?.events.on("ButtonPressed", restartClickHandler);
  });
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
