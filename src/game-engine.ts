import { Engine } from "excalibur";

export class GameEngine extends Engine {
  playersOnly = false;

  togglePlayersOnly(enabled?: boolean) {
    this.playersOnly = enabled ?? !this.playersOnly;
  }
}
