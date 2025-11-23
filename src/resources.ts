import { TiledResource } from "@excaliburjs/plugin-tiled";
import { ImageSource, Loader } from "excalibur";
import { config } from "./config";

export const Resources = {
  Sword: new ImageSource("./images/sword.png"),
} as const;

export const LevelResources: TiledResource[] = [
  new TiledResource("./levels/level1.tmx", {
    startZIndex: config.ZIndexBackground,
    useTilemapCameraStrategy: false,
  }),
];

export const loader = new Loader(LevelResources);
for (const res of Object.values(Resources)) {
  loader.addResource(res);
}
