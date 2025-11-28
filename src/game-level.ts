import {
  Actor,
  BoundingBox,
  Clock,
  DefaultLoader,
  Engine,
  ExcaliburGraphicsContext,
  Logger,
  Scene,
  SceneActivationContext,
  vec,
  Vector,
} from "excalibur";
import { Enemy } from "./enemy";
import { Player } from "./player";
import { EnemyData } from "./enemy-data";
import { rand } from "./utilities/math";
import { Gift } from "./gift";
import { TiledResource } from "@excaliburjs/plugin-tiled";
import { GameEngine } from "./game-engine";

interface Ramp {
  wave: number;
  value: number;
}

export class GameLevel extends Scene {
  secondsBetweenWaves = 30;
  // a map of the wave number to the difficulty level of enemy that is introduced on that wave
  enemyIntroRamp: Ramp[] = [
    { wave: 3, value: 1 },
    { wave: 6, value: 2 },
    { wave: 8, value: 3 },
  ];
  // a map of the wave number to the amount of health assigned to enemies spawned starting on that wave
  enemyHealthRamp: Ramp[] = [
    { wave: 3, value: 2 },
    { wave: 6, value: 3 },
    { wave: 8, value: 4 },
    { wave: 12, value: 5 },
  ];
  currentWave = 0;

  tiledLevel: TiledResource;
  player?: Player;
  enemyData: EnemyData[] = [];
  enemies: Enemy[] = [];
  gifts: Gift[] = [];
  lastTime = 0;
  elemTimer: HTMLElement;
  elemGiftCounter: HTMLElement;
  elemKillCounter: HTMLElement;

  constructor(level: TiledResource) {
    super();

    this.tiledLevel = level;
    this.elemTimer = document.getElementById("round-timer")!;
    this.elemGiftCounter = document.getElementById("gift-counter")!;
    this.elemKillCounter = document.getElementById("kill-counter")!;
  }

  override onInitialize(engine: Engine): void {
    // Scene.onInitialize is where we recommend you perform the composition for your game
    // const pointerSystem = this.world.systemManager.get(PointerSystem);
    // this.world.systemManager.removeSystem(pointerSystem!);

    this.initializePlayer();
    this.initializeEnemies();
    this.initializeObjectives();
  }

  updateUI(clock: Clock) {
    this.updateRoundTimer(clock);
    this.updateGiftCounter();
    this.updateKillCounter();
  }

  updateRoundTimer(clock: Clock) {
    const nowTotalSeconds = Math.floor(clock.now() / 1000);

    const nowSeconds = nowTotalSeconds % 60;
    const nowMinutes = Math.floor(nowTotalSeconds / 60);
    this.elemTimer.innerText = `${nowMinutes.toString()}:${nowSeconds.toString().padStart(2, "0")}`;
  }

  updateGiftCounter() {
    const giftsCollected = this.player?.giftsCollected ?? 0;
    const giftsNeeded = this.player?.giftsNeeded ?? 0;
    this.elemGiftCounter.innerText = `Gifts: ${giftsCollected.toString()}/${giftsNeeded.toString()}`;
  }

  updateKillCounter() {
    this.elemKillCounter.innerText = `Kills: ${(this.player?.kills ?? 0).toLocaleString()}`;
  }

  initializePlayer() {
    const playerStartActor = this.tiledLevel
      .getEntitiesByClassName("playerStart")
      .at(0);
    if (!(playerStartActor instanceof Actor)) {
      Logger.getInstance().error(
        "playerStart not found or not correct type; player will not spawn",
      );
      return;
    }

    const characters = this.tiledLevel.getTilesetByName("characters");
    const playerTileset = characters.find(
      (ch) => ch.getTilesByClassName("player").length > 0,
    );

    const playerTile = playerTileset?.getTilesByClassName("player")[0];
    this.player = new Player(
      vec(playerStartActor.pos.x, playerStartActor.pos.y),
      playerTile!,
    );
    this.add(this.player);
  }

  initializeEnemies() {
    const allowedEnemyNamesProp = this.tiledLevel.map.properties?.find(
      (prop) => prop.name === "enemies",
    );
    const allowedEnemyNames =
      allowedEnemyNamesProp?.type === "string"
        ? allowedEnemyNamesProp.value.split(",")
        : [];
    const enemies = this.tiledLevel.getTilesetByName("enemies");
    const enemyTileset = enemies.find(
      (enemy) => enemy.getTilesByClassName("enemy").length > 0,
    );
    const enemyTiles = enemyTileset?.getTilesByClassName("enemy") ?? [];

    for (const enemy of enemyTiles) {
      const enemyDef = new EnemyData(enemy);

      if (allowedEnemyNames.some((n) => enemyDef.name === n)) {
        this.enemyData.push(enemyDef);
      }
    }
  }

  initializeObjectives() {
    const numGiftsToSpawnProp = this.tiledLevel.map.properties?.find(
      (p) => p.name === "num-gifts-to-spawn",
    );

    const giftSpawnLocs = this.tiledLevel.getObjectsByClassName("gift");
    const numGiftsToSpawn =
      numGiftsToSpawnProp?.type === "int"
        ? numGiftsToSpawnProp.value
        : giftSpawnLocs.length / 2;
    const giftsToSpawn = giftSpawnLocs.length
      ? rand.pickSet(giftSpawnLocs, numGiftsToSpawn)
      : [];

    const holidayItems = this.tiledLevel.getTilesetByName("holiday-pack");
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
      this.gifts.push(giftActor);
      this.add(giftActor);
    });
  }

  override onPreLoad(loader: DefaultLoader): void {
    // Add any scene specific resources to load
  }

  override onActivate(context: SceneActivationContext<unknown>): void {
    // Called when Excalibur transitions to this scene
    // Only 1 scene is active at a time

    // set the camera to the player's position before making it elastic to avoid
    // a big across-the-world ease at the start of a level
    this.camera.pos = this.player!.pos;
    this.activateCameraStrategies();
    this.updateUI(context.engine.clock);
  }

  activateCameraStrategies() {
    this.camera.strategy.elasticToActor(this.player!, 0.15, 0.75);
    this.camera.zoom = 0.4;

    const firstLayer = this.tiledLevel.getTileLayers().at(0);
    if (!firstLayer) {
      return;
    }

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
    this.camera.strategy.limitCameraBounds(bounds);
  }

  override onDeactivate(context: SceneActivationContext): void {
    // Called when Excalibur transitions away from this scene
    // Only 1 scene is active at a time
    this.elemKillCounter.innerText = "";
    this.elemGiftCounter.innerText = "";
    this.elemTimer.innerText = "";
  }

  override onPreUpdate(engine: Engine, elapsedMs: number): void {
    // don't spawn any enemies or adjust the clock/waves after the player dies
    if (this.player?.isKilled() === true) {
      return;
    }
    if ((engine as GameEngine).playersOnly) {
      return;
    }

    // Called before anything updates in the scene
    const now = engine.clock.now();
    const nowSeconds = now / 1000;
    const lastSeconds = this.lastTime / 1000;
    const nextWaveStartSeconds =
      (this.currentWave + 1) * this.secondsBetweenWaves;
    if (
      nowSeconds >= nextWaveStartSeconds &&
      lastSeconds < nextWaveStartSeconds
    ) {
      this.currentWave++;
      Logger.getInstance().info(
        `start of wave ${(this.currentWave + 1).toString()}`,
      );
    }

    if (Math.floor(nowSeconds) % 5 === 0 && Math.floor(lastSeconds) % 5 !== 0) {
      Logger.getInstance().info(
        `spawning enemies, wave ${this.currentWave.toString()}`,
      );
      for (let i = 0; i < 10; i++) {
        this.spawnEnemy();
      }
    }

    this.lastTime = engine.clock.now();
  }

  override onPostUpdate(engine: Engine, elapsedMs: number): void {
    this.updateUI(engine.clock);
  }

  override onPreDraw(ctx: ExcaliburGraphicsContext, elapsedMs: number): void {
    // Called before Excalibur draws to the screen
  }

  override onPostDraw(ctx: ExcaliburGraphicsContext, elapsedMs: number): void {
    // Called after Excalibur draws to the screen
  }

  spawnEnemy() {
    let maxDifficulty = 0;
    for (const ramp of this.enemyIntroRamp) {
      if (this.currentWave >= ramp.wave && ramp.value > maxDifficulty) {
        maxDifficulty = ramp.value;
      }
    }

    const eligibleEnemies = this.enemyData.filter(
      (e) => e.difficulty <= maxDifficulty,
    );
    if (eligibleEnemies.length === 0) {
      Logger.getInstance().error(
        `Requested to spawn an enemy, but no eligible enemies available. Max difficulty: ${maxDifficulty.toString()}, wave: ${this.currentWave.toString()}`,
      );
      return;
    }

    const idx = rand.integer(0, eligibleEnemies.length - 1);
    const enemyDef = eligibleEnemies[idx];
    const spawnLoc = this.getNextEnemySpawnLoc(enemyDef);
    const enemy = new Enemy(spawnLoc, enemyDef);

    const slot = this.enemies.findIndex((e) => e.isKilled());
    if (slot >= 0) {
      Logger.getInstance().info(
        `Placing enemy ${enemy.name} into a previously-occupied slot`,
      );
      this.enemies[slot] = enemy;
    } else {
      Logger.getInstance().info(
        `Adding enemy ${enemy.name} to the list of enemies.`,
      );
      this.enemies.push(enemy);
    }

    this.add(enemy);
  }

  getNextEnemySpawnLoc(enemyDef: EnemyData): Vector {
    const bounds = this.engine.screen.getWorldBounds();
    const spawnSide = rand.d4();
    switch (spawnSide) {
      case 1: // left
        return vec(
          bounds.left - enemyDef.textureWidth,
          rand.floating(bounds.top, bounds.bottom),
        );
      case 2: // top
        return vec(
          rand.floating(bounds.left, bounds.right),
          bounds.top - enemyDef.textureHeight,
        );
      case 3: // right
        return vec(
          bounds.right + enemyDef.textureWidth,
          rand.floating(bounds.top, bounds.bottom),
        );
      case 4: // bottom
        return vec(
          rand.floating(bounds.left, bounds.right),
          bounds.bottom + enemyDef.textureHeight,
        );
    }

    return Vector.Zero;
  }

  killEnemy(enemy: Enemy, fromAttack: boolean) {
    Logger.getInstance().info(
      `Killing enemy ${enemy.name} (killed by player? ${fromAttack.toString()})`,
    );
    // todo: spawn corpse if fromAttack
    enemy.kill();
  }
}
