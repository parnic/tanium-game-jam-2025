import { Engine } from "excalibur";
import { GameLevel } from "./scenes/game-level";

export class GameEngine extends Engine {
  playersOnly = false;
  paused = false;

  togglePlayersOnly(enabled?: boolean) {
    this.playersOnly = enabled ?? !this.playersOnly;
  }

  togglePause(enabled?: boolean, showPauseUI?: boolean) {
    this.paused = enabled ?? !this.paused;

    if (this.currentScene instanceof GameLevel) {
      this.currentScene.onPaused(this.paused, showPauseUI);
    }
  }
}
