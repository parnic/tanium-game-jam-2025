import type { Sound } from "excalibur";
import { SfxResources } from "../resources";
import { rand } from "./math";

let bgmOrder: number[] = [];
let currBgmOrderIdx = 0;

function currBgmIdx(): number {
  return bgmOrder[currBgmOrderIdx % bgmOrder.length];
}

const musicVolume = 0.6;
const enemyDeathSfxVolume = 0.65;
const pickupGiftSfxVolume = 1.0;
const levelUpSfxVolume = 1.0;
const selectUpgradeSfxVolume = 1.0;
const playerTakeDamageSfxVolume = 1.0;

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

export function playMusic() {
  currBgmOrderIdx++;
  playSound(SfxResources.bgm[currBgmIdx()], musicVolume);
}

export function playEnemyDeathSfx() {
  playSound(rand.pickOne(SfxResources.enemyDeath), enemyDeathSfxVolume);
}

export function playPickupGiftSfx() {
  playSound(rand.pickOne(SfxResources.pickupGift), pickupGiftSfxVolume);
}

export function playLevelUpSfx() {
  playSound(rand.pickOne(SfxResources.levelUp), levelUpSfxVolume);
}

export function playSelectUpgradeSfx() {
  playSound(rand.pickOne(SfxResources.selectUpgrade), selectUpgradeSfxVolume);
}

export function playPlayerTakeDamageSfx() {
  playSound(
    rand.pickOne(SfxResources.playerTakeDamage),
    playerTakeDamageSfxVolume,
  );
}
