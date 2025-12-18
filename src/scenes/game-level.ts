import type { TiledResource } from "@excaliburjs/plugin-tiled";
import {
  Actor,
  BoundingBox,
  clamp,
  type Engine,
  EventEmitter,
  GameEvent,
  Logger,
  lerp,
  Scene,
  type SceneActivationContext,
  type SceneEvents,
  Vector,
  vec,
} from "excalibur";
import {
  RarityCSSClassMap,
  UpgradeRarity,
} from "../components/upgrade-component";
import type { XpComponent } from "../components/xp-component";
import { Enemy } from "../enemy";
import type { EnemyCorpse } from "../enemy-corpse";
import { EnemyData } from "../enemy-data";
import { LevelExit } from "../exit";
import { GameEngine } from "../game-engine";
import { Gift } from "../gift";
import { Player } from "../player";
import { Resources } from "../resources";
import { PerlinNoiseCameraStrategy } from "../strategy-noise";
import {
  hideElement,
  showOrHideElement,
  unhideElement,
} from "../utilities/html";
import { rand } from "../utilities/math";
import type { WeaponActor } from "../weapon-actor";

export interface WaveData {
  timeSeconds: number;
  difficulty: number;
}

export interface WaveTimingsData {
  wave: number;
  allowedEnemies: string[];
  minEnemies: number;
  maxEnemies: number;
}

export interface LevelData {
  waveData: WaveData[];
  spawnTimings: WaveTimingsData[];
}

interface GameLevelEvents {
  CharacterChosen: CharacterChosenEvent;
}

export class CharacterChosenEvent extends GameEvent<void> {}

export const GameLevelEvents = {
  CharacterChosen: "CharacterChosen",
} as const;

export const MaxOnScreenCorpses = 350;
const MaxLivingWeaponActors = 75;

export class GameLevel extends Scene {
  public events = new EventEmitter<SceneEvents & GameLevelEvents>();

  checkEnemySpawnIntervalMs = 1000;
  lastEnemySpawnTime?: number;
  currentWave = 0;

  tiledLevel: TiledResource;
  player?: Player;
  exit?: LevelExit;
  levelData: LevelData;
  enemyData: EnemyData[] = [];
  enemies: Enemy[] = [];
  gifts: Gift[] = [];
  projectiles = new Map<string, WeaponActor[]>();
  xpPickups: (EnemyCorpse | undefined)[] = [];
  elemUIRoot: HTMLElement;
  elemTimer: HTMLElement;
  elemGiftCounter: HTMLElement;
  elemKillCounter: HTMLElement;
  elemXpBar: HTMLElement;
  elemXpLabel: HTMLElement;
  elemPause: HTMLElement;
  elemCharacterSelect: HTMLElement;
  totalElapsed = 0;
  showCharacterSelectOnActivate = true;
  chosenCharacter = "purple";

  constructor(level: TiledResource, data: LevelData) {
    super();

    this.tiledLevel = level;
    this.levelData = data;
    this.elemUIRoot = document.getElementById("ui-root")!;
    this.elemTimer = document.getElementById("round-timer")!;
    this.elemGiftCounter = document.getElementById("gift-counter")!;
    this.elemKillCounter = document.getElementById("kill-counter")!;
    this.elemXpBar = document.getElementById("xp-bar")!;
    this.elemXpLabel = document.getElementById("xp-label")!;
    this.elemPause = document.getElementById("pause-text")!;
    this.elemCharacterSelect = document.getElementById("character-select")!;
  }

  private _screenResizeHandler = () => this.activateCameraStrategies();

  override onInitialize(engine: Engine): void {
    this.tiledLevel.addToScene(this);

    this.initializeExit();
    this.initializeEnemies();
    this.initializeObjectives();
    this.initializeCamera();

    engine.screen.events.on("resize", this._screenResizeHandler);
  }

  updateXpBar(xpComp: XpComponent) {
    let percent = xpComp.xpPercentToNextLevel;
    if (percent <= 0) {
      percent = 0;
    } else if (percent >= 1) {
      percent = 100;
    } else {
      percent = clamp(Math.floor(percent * 100), 1, 99);
    }

    this.elemXpBar.style.setProperty("--percent", `${percent.toString()}%`);

    this.elemXpLabel.innerText = xpComp.level.toString();
  }

  updateUI() {
    this.updateRoundTimer();
    this.updateGiftCounter();
    this.updateKillCounter();
  }

  updateRoundTimer() {
    const nowTotalSeconds = Math.floor(this.totalElapsed / 1000);

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

  protected initializePlayer() {
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

    const playerTiles = playerTileset?.getTilesByClassName("player");
    const playerTile = playerTiles?.find(
      (t) => t.properties.get("name") === this.chosenCharacter,
    );
    if (!playerTile) {
      Logger.getInstance().error(
        `Unable to spawn chosen player ${this.chosenCharacter} - no tile found with that name set.`,
      );
      return;
    }
    this.player = new Player(
      playerStartActor.pos,
      playerTile,
      this.chosenCharacter,
    );
    this.add(this.player);

    this.player.events.on("GiftCollected", (evt) => {
      this.gifts = this.gifts.filter((g) => g !== evt.gift);
    });
  }

  initializeExit() {
    const levelExitActor = this.tiledLevel.getEntitiesByClassName("exit").at(0);
    if (!(levelExitActor instanceof Actor)) {
      Logger.getInstance().error(
        "exit not found or not correct type; exit will not spawn",
      );
      return;
    }

    this.exit = new LevelExit(levelExitActor.pos);
    this.add(this.exit);
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

  initializeCamera() {
    const playerStartActor = this.tiledLevel
      .getEntitiesByClassName("playerStart")
      .at(0);
    if (playerStartActor && playerStartActor instanceof Actor) {
      this.camera.pos = playerStartActor.pos;
    }
    this.setScaledZoom();
  }

  override onActivate(context: SceneActivationContext<unknown>): void {
    if (this.showCharacterSelectOnActivate) {
      this.showCharacterSelect();
    }
  }

  showCharacterSelect() {
    if (this.engine instanceof GameEngine) {
      this.engine.togglePause(true);
    }

    const elemTemplate = this.elemCharacterSelect.querySelector(
      ".template",
    ) as HTMLElement;
    const elemCharacterParent = this.elemCharacterSelect.querySelector(
      ".character-list",
    ) as HTMLElement;

    for (let i = elemCharacterParent.children.length - 1; i >= 0; i--) {
      const child = elemCharacterParent.children.item(i);
      if (!child?.classList.contains("template")) {
        child?.remove();
      }
    }

    const characters = this.tiledLevel.getTilesetByName("characters");
    const playerTileset = characters.find(
      (ch) => ch.getTilesByClassName("player").length > 0,
    );

    const playerTiles = playerTileset?.getTilesByClassName("player");
    for (const characterData of Resources.CharacterData.data!) {
      const playerTile = playerTiles!.find(
        (t) => t.properties.get("name") === characterData.name,
      )!;
      const weaponData = Resources.WeaponData.data.find(
        (w) => w.name === characterData?.startingWeapon,
      );

      const sprite = playerTile.tileset.spritesheet.sprites.at(playerTile.id);

      const prom = playerTile.tileset.spritesheet.getSpriteAsImage(
        sprite!.sourceView.x / sprite!.sourceView.width,
        sprite!.sourceView.y / sprite!.sourceView.height,
      );

      const cloned = elemTemplate.cloneNode(true) as HTMLElement;
      cloned.classList.remove("template");

      const elemName = cloned.querySelector(".name") as HTMLElement;
      elemName.innerText = characterData?.displayName ?? "-error-";

      const elemImg = cloned.querySelector(".img") as HTMLElement;
      prom.then((v) => {
        // should probably find a better way to do this...
        v.width = 64;
        v.height = 64;
        elemImg.appendChild(v);
      });

      const elemStartingWeapon = cloned.querySelector(
        ".starting-weapon",
      ) as HTMLElement;
      elemStartingWeapon.innerText = weaponData?.displayName ?? "-error-";

      const elemStartingWeaponDesc = cloned.querySelector(
        ".starting-weapon-description",
      ) as HTMLElement;
      elemStartingWeaponDesc.innerText = weaponData?.description ?? "-error-";

      const elemDifficulty = cloned.querySelector(".difficulty") as HTMLElement;
      elemDifficulty.innerText = characterData?.difficulty ?? "-error-";
      elemDifficulty.classList.remove(...Object.values(RarityCSSClassMap));
      elemDifficulty.classList.add(
        characterData?.difficultyClass ??
          RarityCSSClassMap[UpgradeRarity.Uncommon],
      );

      cloned.addEventListener("click", () => {
        this.onCharacterSelected(characterData!.name);
      });

      unhideElement(cloned);
      elemCharacterParent.appendChild(cloned);
    }

    unhideElement(this.elemCharacterSelect);
  }

  onCharacterSelected(name: string) {
    if (this.engine instanceof GameEngine) {
      this.engine.togglePause(false);
    }

    this.chosenCharacter = name;
    this.initializePlayer();

    hideElement(this.elemCharacterSelect);
    unhideElement(this.elemUIRoot);

    // set the camera to the player's position before making it elastic to avoid
    // a big across-the-world ease at the start of a level
    this.camera.pos = this.player!.pos;
    this.activateCameraStrategies();
    this.updateUI();

    this.events.emit("CharacterChosen");
  }

  activateCameraStrategies() {
    if (!this.player) {
      return;
    }

    this.camera.strategy.elasticToActor(this.player!, 0.15, 0.75);

    this.setScaledZoom();

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

    const noiseStrat = new PerlinNoiseCameraStrategy(this.player!);
    this.player!.cameraShake = noiseStrat;
    this.camera.addStrategy(noiseStrat);
  }

  private setScaledZoom() {
    const minZoom = 0.2;
    const maxZoom = 0.4;
    const maxViewportWidth = 2000;
    const minViewportWidth = 500;
    const clampedWidth = clamp(
      this.engine.screen.viewport.width,
      minViewportWidth,
      maxViewportWidth,
    );
    const scaledZoom = lerp(
      minZoom,
      maxZoom,
      (clampedWidth - minViewportWidth) / (maxViewportWidth - minViewportWidth),
    );
    this.camera.zoom = scaledZoom;
  }

  override onDeactivate(context: SceneActivationContext): void {
    // Called when Excalibur transitions away from this scene
    // Only 1 scene is active at a time
    this.elemKillCounter.innerText = "";
    this.elemGiftCounter.innerText = "";
    this.elemTimer.innerText = "";
    hideElement(this.elemUIRoot);

    this.player?.unhookAllEvents(this);
    context.engine.screen.events.off("resize", this._screenResizeHandler);
  }

  onPaused(paused: boolean, showPauseUI?: boolean) {
    this.player?.onPaused(paused);

    if (showPauseUI) {
      showOrHideElement(this.elemPause, paused);
    }
  }

  private getCurrentWave() {
    const nowSeconds = this.totalElapsed / 1000;
    return this.levelData.waveData.findLastIndex(
      (w) => w.timeSeconds <= nowSeconds,
    );
  }

  private getCurrentWaveData() {
    return this.levelData.waveData[
      Math.min(this.levelData.waveData.length - 1, this.currentWave)
    ];
  }

  private getCurrentSpawnTimings() {
    return this.levelData.spawnTimings.findLast(
      (t) => t.wave <= this.currentWave + 1,
    );
  }

  override onPreUpdate(engine: Engine, elapsedMs: number): void {
    // don't spawn any enemies or adjust the clock/waves before a player is chosen or after the player dies
    if (!this.player || this.player.isKilled() === true) {
      return;
    }
    if (engine instanceof GameEngine && (engine.playersOnly || engine.paused)) {
      return;
    }

    const currentWave = this.currentWave;
    this.currentWave = this.getCurrentWave() + 1;
    if (currentWave !== this.currentWave) {
      Logger.getInstance().info(
        `start of wave ${(this.currentWave + 1).toString()}`,
      );
    }

    this.trySpawnEnemies();
  }

  private trySpawnEnemies() {
    if (
      this.lastEnemySpawnTime &&
      this.totalElapsed <
        this.lastEnemySpawnTime + this.checkEnemySpawnIntervalMs
    ) {
      return;
    }

    const timings = this.getCurrentSpawnTimings();
    if (!timings) {
      Logger.getInstance().error(
        `Unable to find applicable spawn timings for wave ${this.currentWave} - not spawning anything.`,
      );
      return;
    }

    let livingEnemies = 0;
    for (let i = 0; i < this.enemies.length; i++) {
      if (!this.enemies[i].isKilled()) {
        livingEnemies++;
      }
    }

    Logger.getInstance().info(
      `spawning ${timings.minEnemies - livingEnemies} enemies, wave ${this.currentWave.toString()}`,
    );
    for (let i = livingEnemies; i < timings.minEnemies; i++) {
      this.spawnEnemy();
    }

    this.lastEnemySpawnTime = this.totalElapsed;
  }

  override onPostUpdate(engine: Engine, elapsedMs: number): void {
    if (!this.player || this.player.isKilled()) {
      return;
    }

    if (
      !(engine instanceof GameEngine) ||
      !(engine.playersOnly || engine.paused)
    ) {
      this.totalElapsed += elapsedMs;
    }
    this.updateUI();
  }

  spawnEnemy() {
    const eligibleEnemyNames = this.getCurrentSpawnTimings()?.allowedEnemies;
    const eligibleEnemies = this.enemyData.filter((e) =>
      eligibleEnemyNames?.includes(e.name),
    );
    if (!eligibleEnemies || eligibleEnemies.length === 0) {
      Logger.getInstance().error(
        `Requested to spawn an enemy, but no eligible enemies available. Wave: ${this.currentWave.toString()}`,
      );
      return;
    }

    const difficulty = this.getCurrentWaveData().difficulty;
    const idx = rand.integer(0, eligibleEnemies.length - 1);
    const enemyDef = eligibleEnemies[idx];
    const spawnLoc = this.getNextEnemySpawnLoc(enemyDef);
    const enemy = new Enemy(spawnLoc, enemyDef, difficulty);

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
    enemy.kill();
  }

  addWeaponActor(weap: WeaponActor) {
    let existing = this.projectiles.get(weap.definition.name);
    if (!existing) {
      existing = [];
      this.projectiles.set(weap.definition.name, existing);
    }

    if (existing.length > MaxLivingWeaponActors) {
      const removed = existing.shift();
      removed?.kill();
    }

    existing.push(weap);
    this.add(weap);
  }

  removeWeaponActor(weap: WeaponActor) {
    const existing = this.projectiles.get(weap.definition.name);
    if (!existing) {
      return;
    }

    const idx = existing.indexOf(weap);
    if (idx < 0) {
      return;
    }

    existing.splice(idx, 1);
  }
}
