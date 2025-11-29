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
import { GameActor, TiledCollision } from "./game-actor";
import { Tile } from "@excaliburjs/plugin-tiled";
import { GameLevel } from "./game-level";
import { config } from "./config";

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
}

export class GiftOffScreenIndicator extends ScreenElement {
  overlay: Actor;
  gift: Gift;

  constructor(gift: Gift, background: Tile) {
    super({
      width: background.tileset.tileWidth,
      height: background.tileset.tileHeight,
    });

    this.z = config.ZIndexScreenElements;
    this.scale = Vector.Half;
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
      engine.screen.scaledWidth / 2,
      engine.screen.scaledHeight / 2,
    );
    const giftLoc = this.gift.pos;
    const giftScreenPos = engine.worldToScreenCoordinates(giftLoc);
    const giftToPlayer = giftScreenPos.sub(playerScreenPos);
    const normGiftToPlayer = vec(
      giftToPlayer.x / (engine.screen.scaledWidth * 2),
      giftToPlayer.y / (engine.screen.scaledHeight * 2),
    );

    const div =
      Math.abs(normGiftToPlayer.x) > Math.abs(normGiftToPlayer.y)
        ? Math.abs(normGiftToPlayer.x)
        : Math.abs(normGiftToPlayer.y);

    const screenNormGiftToPlayer = vec(
      normGiftToPlayer.x / div,
      normGiftToPlayer.y / div,
    );

    const fromCenter = screenNormGiftToPlayer.scale(
      vec(
        playerScreenPos.x - this.width / 2,
        playerScreenPos.y - this.height / 2,
      ),
    );

    const indicatorPos = playerScreenPos.add(fromCenter);
    this.pos = indicatorPos;
    this.pos.x -= this.width / 2;
    this.pos.y -= this.height / 2;
  }
}
