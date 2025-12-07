import { DisplayMode, ImageFiltering, SolverStrategy } from "excalibur";
import { GameEngine } from "./game-engine";
import { LevelResources, loader } from "./resources";
import { GameLevel } from "./scenes/game-level";
import * as Audio from "./utilities/audio";
import * as SceneManager from "./utilities/scene-manager";

// const calculateExPixelConversion = (screen: ex.Screen) => {
//   document.documentElement.style.setProperty(
//     "--pixel-conversion",
//     screen.worldToPagePixelRatio.toString(),
//   );
// };

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

// game.screen.events.on("resize", () => {
//   calculateExPixelConversion(game.screen);
// });

await game.start(loader).then(async () => {
  Audio.init();

  const firstScene = SceneManager.getFirstSceneData();
  await SceneManager.goToScene(firstScene, game);

  // calculateExPixelConversion(game.screen);

  Audio.playMusic();
});
