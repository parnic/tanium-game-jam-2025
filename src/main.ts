import { DisplayMode, SolverStrategy } from "excalibur";
import { loader, LevelResources } from "./resources";
import { GameLevel } from "./game-level";
import { GameEngine } from "./game-engine";

// const calculateExPixelConversion = (screen: ex.Screen) => {
//   document.documentElement.style.setProperty(
//     "--pixel-conversion",
//     screen.worldToPagePixelRatio.toString(),
//   );
// };

const game = new GameEngine({
  displayMode: DisplayMode.FillScreen,
  scenes: {
    start: new GameLevel(LevelResources[0]),
  },
  antialiasing: false,
  physics: {
    solver: SolverStrategy.Arcade,
  },
});

// game.screen.events.on("resize", () => {
//   calculateExPixelConversion(game.screen);
// });

await game
  .start("start", {
    loader,
  })
  .then(() => {
    const level = LevelResources[0];
    level.addToScene(game.currentScene);
    if (game.currentScene instanceof GameLevel) {
      game.currentScene.tiledLevel = level;
    }

    // calculateExPixelConversion(game.screen);
  });
