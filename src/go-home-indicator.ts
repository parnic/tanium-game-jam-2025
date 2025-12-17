import * as ex from "excalibur";
import { config } from "./config";
import type { LevelExit } from "./exit";
import { GameEngine } from "./game-engine";
import { Resources } from "./resources";
import { GameLevel } from "./scenes/game-level";

export class GoHomeIndicator extends ex.ScreenElement {
  private text?: ex.Text;
  private directionText?: ex.Text;
  target?: LevelExit;
  private directionActor?: ex.Actor;
  private aliveTimeMs = 0;
  private lastStateChangeTimeMs = 0;
  private showing = true;
  private flashOnIntervalMs = 650;
  private flashOffIntervalMs = 200;
  private maxFlashes = 5;
  private numFlashes = 0;

  constructor() {
    super({
      z: config.ZIndexScreenElements,
    });
  }

  override onInitialize(engine: ex.Engine): void {
    const fontSize = ex.lerp(
      30,
      72,
      ex.clamp(ex.inverseLerp(480, 3840, engine.screen.viewport.width), 0, 1),
    );
    this.text = new ex.Text({
      text: "TIME TO LEAVE",
      font: new ex.Font({
        size: fontSize,
        unit: ex.FontUnit.Pt,
        family: Resources.FontSilkscreen.family,
        color: ex.Color.White,
        strokeColor: ex.Color.Black,
      }),
    });

    this.graphics.use(this.text);

    this.directionText = new ex.Text({
      text: ">",
      font: new ex.Font({
        size: fontSize,
        unit: ex.FontUnit.Pt,
        family: Resources.FontSilkscreen.family,
        color: ex.Color.White,
        strokeColor: ex.Color.Black,
      }),
    });
    this.directionActor = new ex.ScreenElement({
      anchor: ex.Vector.Half,
    });
    this.directionActor.graphics.use(this.directionText);
    this.addChild(this.directionActor);
  }

  override onAdd(engine: ex.Engine): void {
    if (!(this.scene instanceof GameLevel)) {
      return;
    }

    this.target = this.scene.exit;
    if (!this.target) {
      this.kill();
    }
  }

  override onPreUpdate(engine: ex.Engine, elapsedMs: number): void {
    if (
      !(engine instanceof GameEngine) ||
      !(engine.playersOnly || engine.paused)
    ) {
      this.aliveTimeMs += elapsedMs;
    }

    const currInterval = this.showing
      ? this.flashOnIntervalMs
      : this.flashOffIntervalMs;
    if (this.aliveTimeMs >= this.lastStateChangeTimeMs + currInterval) {
      this.showing = !this.showing;
      if (this.showing) {
        this.numFlashes++;
      }
      this.lastStateChangeTimeMs = this.aliveTimeMs;
    }

    this.graphics.opacity = this.showing ? 1 : 0;

    if (this.numFlashes === this.maxFlashes) {
      this.kill();
      return;
    }

    if (!(this.scene instanceof GameLevel)) {
      return;
    }

    const player = this.scene.player;
    if (!player || player.isKilled()) {
      this.kill();
      return;
    }

    const targetScreenLoc = engine.worldToScreenCoordinates(this.target!.pos);
    const playerScreenLoc = engine.worldToScreenCoordinates(player.pos);
    const toTarget = targetScreenLoc.sub(playerScreenLoc);
    const angle = toTarget.toAngle();
    this.directionActor!.rotation = angle;

    this.pos.y = engine.screen.viewport.height / 4;
    this.pos.x = engine.screen.viewport.width / 2 - this.text!.width / 2;

    this.directionActor!.pos.x =
      this.text!.width / 2 - this.directionText!.width / 2;
    this.directionActor!.pos.y =
      this.text!.height + this.directionText!.height / 2;
  }
}
