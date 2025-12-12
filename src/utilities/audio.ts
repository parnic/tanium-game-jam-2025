import type { Sound } from "excalibur";
import { SfxResources } from "../resources";
import { rand } from "./math";

let bgmOrder: number[] = [];
let currBgmOrderIdx = 0;

function currBgmIdx(): number {
  return bgmOrder[currBgmOrderIdx % bgmOrder.length];
}

const enemyDeathSfxVolume = 0.4;
const levelCompleteSfxVolume = 0.8;
const levelUpSfxVolume = 0.8;
const musicVolume = 0.3;
const pickupGiftSfxVolume = 1.0;
const pickupXpSfxVolume = 1.0;
const playerTakeDamageSfxVolume = 0.8;
const selectUpgradeSfxVolume = 0.8;

let _masterVolumeMultiplier = 1.0;
export function masterVolumeMultiplier(): number {
  return _masterVolumeMultiplier;
}
export function setMasterVolumeMultiplier(_volume: number) {
  _masterVolumeMultiplier = _volume;
  SfxResources.bgm[currBgmIdx()].volume =
    musicVolume * masterVolumeMultiplier();
}

export function init() {
  for (let i = 0; i < SfxResources.bgm.length; i++) {
    bgmOrder.push(i);
  }

  bgmOrder = rand.shuffle(bgmOrder);

  for (const bgm of SfxResources.bgm) {
    bgm.on("playbackend", () => playMusic());
  }
}

export function playSound(snd: Sound, volume: number) {
  snd.volume = volume * masterVolumeMultiplier();
  snd.play();
}

export function playEnemyDeathSfx() {
  playSound(rand.pickOne(SfxResources.enemyDeath), enemyDeathSfxVolume);
}

export function playLevelCompleteSfx() {
  playSound(rand.pickOne(SfxResources.levelComplete), levelCompleteSfxVolume);
}

export function playLevelUpSfx() {
  playSound(rand.pickOne(SfxResources.levelUp), levelUpSfxVolume);
}

export function playMusic() {
  currBgmOrderIdx++;
  playSound(SfxResources.bgm[currBgmIdx()], musicVolume);
}

export function playPickupGiftSfx() {
  playSound(rand.pickOne(SfxResources.pickupGift), pickupGiftSfxVolume);
}

export function playPickupXpSfx() {
  playSound(rand.pickOne(SfxResources.pickupXp), pickupXpSfxVolume);
}

export function playPlayerTakeDamageSfx() {
  playSound(
    rand.pickOne(SfxResources.playerTakeDamage),
    playerTakeDamageSfxVolume,
  );
}

export function playSelectUpgradeSfx() {
  playSound(rand.pickOne(SfxResources.selectUpgrade), selectUpgradeSfxVolume);
}
