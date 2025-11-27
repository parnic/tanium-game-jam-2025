import { DisplayMode, Engine, SolverStrategy, vec, Vector } from "excalibur";
import { loader, LevelResources } from "./resources";
import { GameLevel } from "./game-level";

const calculateExPixelConversion = (screen: ex.Screen) => {
  const origin = screen.worldToPageCoordinates(Vector.Zero);
  const singlePixel = screen.worldToPageCoordinates(vec(1, 0)).sub(origin);
  const pixelConversion = singlePixel.x;
  document.documentElement.style.setProperty(
    "--pixel-conversion",
    pixelConversion.toString(),
  );
};

const game = new Engine({
  width: 1920,
  height: 1080,
  displayMode: DisplayMode.FitScreenAndFill,
  pixelArt: false,
  scenes: {
    start: new GameLevel(LevelResources[0]),
  },
  suppressHiDPIScaling: false,
  antialiasing: false,
  snapToPixel: true,
  pixelRatio: 1,
  physics: {
    solver: SolverStrategy.Arcade,
  },
});

game.screen.events.on("resize", () => {
  calculateExPixelConversion(game.screen);
});

await game
  .start("start", {
    loader,
    // inTransition: new FadeInOut({
    //   // Optional in transition
    //   duration: 1000,
    //   direction: "in",
    //   color: Color.ExcaliburBlue,
    // }),
  })
  .then(() => {
    calculateExPixelConversion(game.screen);

    const level = LevelResources[0];
    level.addToScene(game.currentScene);
    if (game.currentScene instanceof GameLevel) {
      game.currentScene.tiledLevel = level;
    }
  });
