import { Tile } from "@excaliburjs/plugin-tiled";
import { Frame, Graphic } from "excalibur";
import { TiledCollision } from "./game-actor";

export class EnemyData {
  private _health: number;
  private _speed: number;
  private _walkFrames: Frame[];
  private _name: string;
  private _facing: number;
  private _difficulty: number;
  private _collisionDef: TiledCollision;
  private _textureWidth: number;
  private _textureHeight: number;
  private _corpseTile: Graphic | undefined;

  public get health() {
    return this._health;
  }

  public get speed() {
    return this._speed;
  }

  public get walkFrames() {
    return this._walkFrames;
  }

  public get name() {
    return this._name;
  }

  public get facing() {
    return this._facing;
  }

  public get difficulty() {
    return this._difficulty;
  }

  public get collisionDef() {
    return this._collisionDef;
  }

  public get textureWidth() {
    return this._textureWidth;
  }

  public get textureHeight() {
    return this._textureHeight;
  }

  public get corpseTile() {
    return this._corpseTile;
  }

  constructor(tile: Tile) {
    const facingProp = tile.properties.get("facing");
    const nameProp = tile.properties.get("name");
    const healthProp = tile.properties.get("health-mult");
    const speedProp = tile.properties.get("speed");
    const difficultyProp = tile.properties.get("difficulty");
    const corpseTileID = tile.properties.get("corpse-id");

    this._name = typeof nameProp === "string" ? nameProp : "enemy";
    this._facing = typeof facingProp === "number" ? facingProp : -1;
    this._health = typeof healthProp === "number" ? healthProp : 1;
    this._speed = typeof speedProp === "number" ? speedProp : 1;
    this._difficulty = typeof difficultyProp === "number" ? difficultyProp : 0;
    this._collisionDef = new TiledCollision(tile);
    this._textureWidth = tile.tileset.tileWidth;
    this._textureHeight = tile.tileset.tileHeight;
    if (typeof corpseTileID === "number") {
      this._corpseTile = tile.tileset.spritesheet.sprites[corpseTileID];
    }

    this._walkFrames = tile.animation.map((anim) => {
      return {
        graphic: tile.tileset.spritesheet.sprites[anim.tileid],
        duration: anim.duration,
      };
    });
  }
}
