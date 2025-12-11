import { DisplayMode, ImageFiltering, SolverStrategy } from "excalibur";
import * as Confetti from "./effects/confetti";
import { GameEngine } from "./game-engine";
import { LevelResources, loader } from "./resources";
import { GameLevel } from "./scenes/game-level";
import * as Audio from "./utilities/audio";
import * as SceneManager from "./utilities/scene-manager";

const game = new GameEngine({
  canvasElementId: "game",
  displayMode: DisplayMode.FillScreen,
  scenes: {
    start: new GameLevel(LevelResources[0]),
  },
  antialiasing: {
    filtering: ImageFiltering.Pixel,
    multiSampleAntialiasing: false,
  },
  physics: {
    solver: SolverStrategy.Arcade,
  },
});

game.screen.events.on("resize", () => {
  Confetti.updateEffectsCanvasSize();
});

await game.start(loader).then(async () => {
  Audio.init();

  const firstScene = SceneManager.getFirstSceneData();
  await SceneManager.goToScene(firstScene, game);

  Audio.playMusic();
});
