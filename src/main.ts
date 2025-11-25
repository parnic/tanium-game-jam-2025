import {
  Actor,
  BoundingBox,
  DisplayMode,
  Engine,
  Logger,
  SolverStrategy,
  vec,
  Vector,
} from "excalibur";
import { loader, LevelResources } from "./resources";
import { GameLevel } from "./game-level";
import { Player } from "./player";
import { EnemyData } from "./enemy-data";
import { rand } from "./utilities/math";
import { Gift } from "./gift";

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
    start: GameLevel,
  },
  suppressHiDPIScaling: false,
  antialiasing: false,
  snapToPixel: false,
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

    // place the player
    const playerStartActor = level.getEntitiesByClassName("playerStart").at(0);
    if (playerStartActor instanceof Actor) {
      const characters = level.getTilesetByName("characters");
      const playerTileset = characters.find(
        (ch) => ch.getTilesByClassName("player").length > 0,
      );

      const playerTile = playerTileset?.getTilesByClassName("player")[0];
      const player = new Player(
        vec(playerStartActor.pos.x, playerStartActor.pos.y),
        playerTile!,
      );
      game.currentScene.add(player);

      // set the camera to the player's position before making it elastic to avoid
      // a big across-the-world ease at the start of a level
      game.currentScene.camera.pos = player.pos;
      game.currentScene.camera.strategy.elasticToActor(player, 0.15, 0.75);
      game.currentScene.camera.zoom = 0.4;
    }

    // find the list of enemies for this level and populate their definitions
    const allowedEnemyNamesProp = level.map.properties?.find(
      (prop) => prop.name === "enemies",
    );
    const allowedEnemyNames =
      allowedEnemyNamesProp?.type === "string"
        ? allowedEnemyNamesProp.value.split(",")
        : [];
    const enemies = level.getTilesetByName("enemies");
    const enemyTileset = enemies.find(
      (enemy) => enemy.getTilesByClassName("enemy").length > 0,
    );
    const enemyTiles = enemyTileset?.getTilesByClassName("enemy") ?? [];
    for (const enemy of enemyTiles) {
      const enemyDef = new EnemyData(enemy);
      if (
        allowedEnemyNames.some((n) => enemyDef.name === n) &&
        game.currentScene instanceof GameLevel
      ) {
        game.currentScene.enemyData.push(enemyDef);
      }
    }

    // set the level camera bounds
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

    // spawn objectives
    const giftSpawnLocs = level.getObjectsByClassName("gift");
    const numGiftsToSpawnProp = level.map.properties?.find(
      (p) => p.name === "num-gifts-to-spawn",
    );
    const numGiftsToSpawn =
      numGiftsToSpawnProp?.type === "int"
        ? numGiftsToSpawnProp.value
        : giftSpawnLocs.length / 2;
    const giftsToSpawn = rand.pickSet(giftSpawnLocs, numGiftsToSpawn);
    const holidayItems = level.getTilesetByName("holiday-pack");
    const giftTileset = holidayItems.find(
      (item) => item.getTilesByClassName("gift").length > 0,
    );
    const giftTiles = giftTileset?.getTilesByClassName("gift") ?? [];
    giftsToSpawn.forEach((gift) => {
      Logger.getInstance().info(
        `Spawning gift ${gift.name!} at ${gift.x.toString()},${gift.y.toString()}`,
      );
      const giftActor = new Gift(
        vec(gift.x, gift.y),
        gift.name ?? "",
        rand.pickOne(giftTiles),
      );
      game.currentScene.add(giftActor);

      if (game.currentScene instanceof GameLevel) {
        game.currentScene.gifts.push(giftActor);
      }
    });
  });
