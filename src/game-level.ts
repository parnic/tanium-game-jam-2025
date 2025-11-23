import {
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

  player: Player | undefined;
  enemyData: EnemyData[] = [];
  enemies: Enemy[] = [];
  lastTime = 0;

  override onInitialize(engine: Engine): void {
    // Scene.onInitialize is where we recommend you perform the composition for your game
  }

  override onPreLoad(loader: DefaultLoader): void {
    // Add any scene specific resources to load
  }

  override onActivate(context: SceneActivationContext<unknown>): void {
    // Called when Excalibur transitions to this scene
    // Only 1 scene is active at a time
  }

  override onDeactivate(context: SceneActivationContext): void {
    // Called when Excalibur transitions away from this scene
    // Only 1 scene is active at a time
  }

  override onPreUpdate(engine: Engine, elapsedMs: number): void {
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
      Logger.getInstance().info(`spawning enemy`);
      this.spawnEnemy();
    }

    this.lastTime = engine.clock.now();
  }

  override onPostUpdate(engine: Engine, elapsedMs: number): void {
    // empty
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

    const idx = Math.round(Math.random() * (eligibleEnemies.length - 1));
    const enemyDef = eligibleEnemies[idx];
    const enemy = new Enemy(
      (this.player?.pos ?? Vector.Zero).add(vec(5, 5)), // todo: pick the right position to spawn: random direction away from the player, just off screen
      enemyDef,
      128, // todo: extract these numbers from the right place
      128,
    );
    this.enemies.push(enemy);
    this.add(enemy);
  }
}
