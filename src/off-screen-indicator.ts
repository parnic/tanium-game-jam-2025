import type { Tile } from "@excaliburjs/plugin-tiled";
import {
  Actor,
  type Engine,
  Font,
  FontUnit,
  ScreenElement,
  Text,
  Vector,
  vec,
} from "excalibur";
import { config } from "./config";
import type { GameActor } from "./game-actor";
import { Resources } from "./resources";
import { GameLevel } from "./scenes/game-level";

export class OffScreenIndicator extends ScreenElement {
  overlay: Actor;
  distanceLabel: Text;
  distanceLabelActor: Actor;
  target: GameActor;

  constructor(target: GameActor, background: Tile) {
    super({
      width: background.tileset.tileWidth,
      height: background.tileset.tileHeight,
      scale: Vector.Half,
      z: config.ZIndexScreenElements,
    });

    this.target = target;
    this.overlay = new Actor({
      x: this.width / 2 / this.scale.x,
      y: this.height / 2 / this.scale.y,
    });

    if (this.target.activeGraphic) {
      this.overlay.graphics.use(this.target.activeGraphic);
    }
    this.addChild(this.overlay);

    const bgGraphic = background.tileset.spritesheet.sprites.at(
      background.tiledTile.id,
    );
    if (bgGraphic) {
      this.graphics.use(bgGraphic);
    }

    this.distanceLabel = new Text({
      text: "24m",
      font: new Font({
        size: 20,
        unit: FontUnit.Px,
        family: Resources.FontSilkscreen.family,
      }),
    });
    this.distanceLabelActor = new Actor({
      x: this.width / 2 / this.scale.x,
      y: (this.height - this.height / 5) / this.scale.y,
    });
    this.distanceLabelActor.graphics.use(this.distanceLabel);
    this.addChild(this.distanceLabelActor);
  }

  onPaused(paused: boolean) {
    // stub
  }

  override onPostUpdate(engine: Engine, elapsed: number): void {
    if (!(this.scene instanceof GameLevel)) {
      return;
    }
    if (!this.scene.player || this.scene.player.isKilled()) {
      return;
    }

    if (!this.target.isOffScreen) {
      this.graphics.isVisible = false;
      this.overlay.graphics.isVisible = false;
      this.distanceLabelActor.graphics.isVisible = false;
      return;
    }
    this.graphics.isVisible = true;
    this.overlay.graphics.isVisible = true;
    this.distanceLabelActor.graphics.isVisible = true;

    const playerScreenPos = vec(
      engine.screen.viewport.width / 2,
      engine.screen.viewport.height / 2,
    );
    const targetLoc = this.target.pos;
    const targetScreenPos = engine.worldToScreenCoordinates(targetLoc);
    const targetToPlayer = targetScreenPos.sub(playerScreenPos);
    const normTargetToPlayer = vec(
      targetToPlayer.x / (engine.screen.viewport.width * 2),
      targetToPlayer.y / (engine.screen.viewport.height * 2),
    );

    const div =
      Math.abs(normTargetToPlayer.x) > Math.abs(normTargetToPlayer.y)
        ? Math.abs(normTargetToPlayer.x)
        : Math.abs(normTargetToPlayer.y);

    const screenNormTargetToPlayer = vec(
      normTargetToPlayer.x / div,
      normTargetToPlayer.y / div,
    );

    const posOffset = vec(this.width / 2, this.height / 2);
    const fromCenter = screenNormTargetToPlayer.scale(
      vec(playerScreenPos.x - posOffset.x, playerScreenPos.y - posOffset.y),
    );

    const indicatorPos = playerScreenPos.add(fromCenter);
    this.pos = indicatorPos.sub(posOffset);

    const worldDist = targetLoc.distance(this.scene.player.pos);
    this.distanceLabel.text = `${Math.round(worldDist / 1000).toString()}m`;
  }
}
