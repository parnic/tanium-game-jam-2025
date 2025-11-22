import { TiledResource } from "@excaliburjs/plugin-tiled";
import { ImageSource, Loader } from "excalibur";

// It is convenient to put your resources in one place
export const Resources = {
  Sword: new ImageSource("./images/sword.png"), // Vite public/ directory serves the root images
} as const; // the 'as const' is a neat typescript trick to get strong typing on your resources.
// So when you type Resources.Sword -> ImageSource

export const TiledResources: TiledResource[] = [
  new TiledResource("../levels/level1.tmx", {
    startZIndex: -10,
    useTilemapCameraStrategy: false,
  }),
  // new TiledResource("./levels/characters-double.tsx"),
  // new TiledResource("./levels/enemies-double.tsx"),
  // new TiledResource("./levels/world-double.tsx"),
];

// We build a loader and add all of our resources to the boot loader
// You can build your own loader by extending DefaultLoader
export const loader = new Loader(TiledResources);
for (const res of Object.values(Resources)) {
  loader.addResource(res);
}
