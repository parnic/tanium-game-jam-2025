import { BoundingBox, DisplayMode, Engine, Resolution, vec } from "excalibur";
import { loader, LevelResources } from "./resources";
import { GameLevel } from "./level";
import { Player } from "./player";

const game = new Engine({
  width: 1920,
  height: 1080,
  displayMode: DisplayMode.FitScreenAndFill,
  pixelArt: true,
  scenes: {
    start: GameLevel,
  },
  resolution: Resolution.Standard,
  suppressHiDPIScaling: false,
  antialiasing: false,
  snapToPixel: false,
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
    loader,
    // inTransition: new FadeInOut({
    //   // Optional in transition
    //   duration: 1000,
    //   direction: "in",
    //   color: Color.ExcaliburBlue,
    // }),
  })
  .then(() => {
    const level = LevelResources[0];
    level.addToScene(game.currentScene);

    const characters = level.getTilesetByName("characters");
    const playerTileset = characters.find(
      (ch) => ch.getTilesByClassName("player").length > 0,
    );
    const playerTile = playerTileset?.getTilesByClassName("player")[0];
    const startLocs = level.getObjectsByClassName("playerStart");

    const player = new Player(
      vec(startLocs[0].x, startLocs[0].y),
      playerTile!,
      startLocs[0].tiledObject.width,
      startLocs[0].tiledObject.height,
    );
    game.currentScene.add(player);

    game.currentScene.camera.strategy.elasticToActor(player, 0.15, 0.75);
    game.currentScene.camera.zoom = 0.3;

    const firstLayer = level.getTileLayers().at(0);
    if (firstLayer) {
      // this is only correct if map render order is right-down and the layer
      // doesn't have any tiles outside of its bounds. check for the thick
      // outline on the Tiled layer view and ensure everything inside the
      // thick line is filled with a texture. additionally, ensure your chunk
      // size divides evenly into the number of tiles on your map.
      // to debug if you got it right, set your Tile Layer Format to CSV and
      // look for any tiles with an id of 0 in the outputted xml.
      const upperLeftTile = firstLayer.tilemap.tiles.at(0);
      const bottomRightTile = firstLayer.tilemap.tiles.at(
        firstLayer.tilemap.tiles.length - 1,
      );

      const bounds = BoundingBox.fromPoints([
        upperLeftTile!.pos,
        bottomRightTile!.pos.add(
          vec(bottomRightTile!.width, bottomRightTile!.height),
        ),
      ]);
      game.currentScene.camera.strategy.limitCameraBounds(bounds);
    }
  });
