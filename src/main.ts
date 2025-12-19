import { Color, DisplayMode, ImageFiltering, SolverStrategy } from "excalibur";
import * as Confetti from "./effects/confetti";
import { GameEngine } from "./game-engine";
import { loader } from "./resources";
import * as Audio from "./utilities/audio";
import * as SceneManager from "./utilities/scene-manager";

const game = new GameEngine({
  canvasElementId: "game",
  backgroundColor: Color.Black,
  displayMode: DisplayMode.FillScreen,
  antialiasing: {
    filtering: ImageFiltering.Pixel,
    multiSampleAntialiasing: false,
  },
  physics: {
    solver: SolverStrategy.Arcade,
  },
  pixelArt: true,
  uvPadding: 0.5,
});

game.screen.events.on("resize", () => {
  Confetti.updateEffectsCanvasSize();
});

await game.start(loader).then(async () => {
  Audio.init();
  SceneManager.init();

  const firstScene = SceneManager.getFirstSceneData();
  await SceneManager.goToScene(firstScene, game);
});
