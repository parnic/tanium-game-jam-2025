import {
  type Actor,
  type Camera,
  type CameraStrategy,
  clamp,
  type Engine,
  vec,
} from "excalibur";
import { rand } from "./utilities/math";
import { PerlinNoise } from "./utilities/perlin-noise";

export class PerlinNoiseCameraStrategy implements CameraStrategy<Actor> {
  private elapsed = 0;
  private noisePosX = new PerlinNoise({ seed: rand.nextInt() });
  private noisePosY = new PerlinNoise({ seed: rand.nextInt() });
  private trauma = 0;
  private recoverySpeed = 10;
  private traumaExponent = 2;
  private frequency = 25;
  private maxTrauma = 10;

  constructor(public target: Actor) {}

  public action = (
    target: Actor,
    camera: Camera,
    engine: Engine,
    elapsed: number,
  ) => {
    elapsed /= 1000;
    this.elapsed += elapsed;

    const shake = this.trauma ** this.traumaExponent;
    const offset = vec(
      this.noisePosX.noise(this.elapsed * this.frequency) * 2 - 1,
      this.noisePosY.noise(this.elapsed * this.frequency) * 2 - 1,
    ).scale(shake);

    this.trauma = clamp(
      this.trauma - this.recoverySpeed * elapsed,
      0,
      this.maxTrauma,
    );

    return camera.pos.add(offset);
  };

  public induceStress(stress: number) {
    this.trauma = clamp(this.trauma + stress, 0, this.maxTrauma);
  }
}
