import { Tile } from "@excaliburjs/plugin-tiled";
import {
  Actor,
  Animation,
  CollisionType,
  Engine,
  Scene,
  ScreenElement,
  vec,
  Vector,
} from "excalibur";
import { config } from "./config";
import { GameActor, TiledCollision } from "./game-actor";
import { GameEngine } from "./game-engine";
import { GameLevel } from "./scenes/game-level";

export class Gift extends GameActor {
  offScreen: GiftOffScreenIndicator;

  constructor(inPos: Vector, name: string, tile: Tile) {
    super({
      name: name,
      pos: inPos,
      width: tile.tileset.tileWidth,
      height: tile.tileset.tileHeight,
      collisionType: CollisionType.Passive,
      collisionDef: new TiledCollision(tile),
    });

    // todo: determine if we should be using the on-dark image or not (probably from the level's properties)
    const bgs = tile.tileset.getTilesByClassName("offscreen-indicator");
    const onDark = bgs.filter((bg) => bg.properties.get("on-dark") === true);
    // todo: determine which of the options to choose somehow (random? maybe always grabbing the first one is good for consistency?)
    const bg = onDark.at(0);

    this.alwaysAnimate = true;
    this.walk = new Animation({
      frames: tile.animation.map((anim) => {
        return {
          graphic: tile.tileset.spritesheet.sprites[anim.tileid],
          duration: anim.duration,
        };
      }),
    });

    this.offScreen = new GiftOffScreenIndicator(this, bg!);
  }

  override onAdd(engine: Engine): void {
    this.scene?.add(this.offScreen);
  }

  override onRemove(engine: Engine): void {
    this.scene?.remove(this.offScreen);
  }

  override onPostKill(scene: Scene): void {
    this.offScreen.kill();
  }

  override onPaused(paused: boolean): void {
    super.onPaused(paused);

    this.offScreen.onPaused(paused);
  }

  override onPostUpdate(engine: Engine, elapsedMs: number): void {
    if (engine instanceof GameEngine && (engine.playersOnly || engine.paused)) {
      return;
    }

    super.onPostUpdate(engine, elapsedMs);
  }
}

export class GiftOffScreenIndicator extends ScreenElement {
  overlay: Actor;
  gift: Gift;

  constructor(gift: Gift, background: Tile) {
    super({
      width: background.tileset.tileWidth,
      height: background.tileset.tileHeight,
      scale: Vector.Half,
      z: config.ZIndexScreenElements,
    });

    this.gift = gift;
    this.overlay = new Actor({
      x: this.width / 2 / this.scale.x,
      y: this.height / 2 / this.scale.y,
    });

    if (gift.activeGraphic) {
      this.overlay.graphics.use(gift.activeGraphic);
    }
    this.addChild(this.overlay);

    const bgGraphic = background.tileset.spritesheet.sprites.at(
      background.tiledTile.id,
    );
    if (bgGraphic) {
      this.graphics.use(bgGraphic);
    }
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

    if (!this.gift.isOffScreen) {
      this.graphics.isVisible = false;
      this.overlay.graphics.isVisible = false;
      return;
    }
    this.graphics.isVisible = true;
    this.overlay.graphics.isVisible = true;

    const playerScreenPos = vec(
      engine.screen.viewport.width / 2,
      engine.screen.viewport.height / 2,
    );
    const giftLoc = this.gift.pos;
    const giftScreenPos = engine.worldToScreenCoordinates(giftLoc);
    const giftToPlayer = giftScreenPos.sub(playerScreenPos);
    const normGiftToPlayer = vec(
      giftToPlayer.x / (engine.screen.viewport.width * 2),
      giftToPlayer.y / (engine.screen.viewport.height * 2),
    );

    const div =
      Math.abs(normGiftToPlayer.x) > Math.abs(normGiftToPlayer.y)
        ? Math.abs(normGiftToPlayer.x)
        : Math.abs(normGiftToPlayer.y);

    const screenNormGiftToPlayer = vec(
      normGiftToPlayer.x / div,
      normGiftToPlayer.y / div,
    );

    const posOffset = vec(this.width / 2, this.height / 2);
    const fromCenter = screenNormGiftToPlayer.scale(
      vec(playerScreenPos.x - posOffset.x, playerScreenPos.y - posOffset.y),
    );

    const indicatorPos = playerScreenPos.add(fromCenter);
    this.pos = indicatorPos.sub(posOffset);
  }
}
