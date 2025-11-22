import { DisplayMode, Engine, Resolution } from "excalibur";
import { loader, TiledResources } from "./resources";
import { MyLevel } from "./level";

// Goal is to keep main.ts small and just enough to configure the engine
const game = new Engine({
  width: 1920, // Logical width and height in game pixels
  height: 1080,
  displayMode: DisplayMode.FitScreenAndFill, // Display mode tells excalibur how to fill the window
  // pixelArt: true, // pixelArt will turn on the correct settings to render pixel art without jaggies or shimmering artifacts
  scenes: {
    start: MyLevel,
  },
  resolution: Resolution.Standard,
  suppressHiDPIScaling: false,
  antialiasing: false,
  snapToPixel: true,
  physics: false,
  pixelRatio: 1,
  // physics: {
  //   solver: SolverStrategy.Realistic,
  //   substep: 5 // Sub step the physics simulation for more robust simulations
  // },
  // fixedUpdateTimestep: 16 // Turn on fixed update timestep when consistent physic simulation is important
});

await game
  .start("start", {
    // name of the start scene 'start'
    loader, // Optional loader (but needed for loading images/sounds)
    // inTransition: new FadeInOut({
    //   // Optional in transition
    //   duration: 1000,
    //   direction: "in",
    //   color: Color.ExcaliburBlue,
    // }),
  })
  .then(() => {
    TiledResources[0].addToScene(game.currentScene);
  });
