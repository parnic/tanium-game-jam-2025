import { Component, Entity, EventEmitter, GameEvent } from "excalibur";

interface XpEvents {
  LeveledUp: LeveledUpEvent;
  GainedXp: GainedXpEvent;
}

export class LeveledUpEvent extends GameEvent<void> {
  level: number;

  constructor(level: number) {
    super();

    this.level = level;
  }
}

export class GainedXpEvent extends GameEvent<void> {
  amount: number;

  constructor(amount: number) {
    super();

    this.amount = amount;
  }
}

export const XpEvents = {
  GainedXp: "GainedXp",
  LeveledUp: "LeveledUp",
} as const;

export class XpComponent extends Component {
  public events = new EventEmitter<XpEvents>();

  protected _currXp = 0;
  protected _level = 1;

  public get currXp() {
    return this._currXp;
  }

  public get level() {
    return this._level;
  }

  protected _xpToLevelCache?: Map<number, number>;

  override onAdd(owner: Entity): void {
    this.populateXpToLevelCache();
  }

  populateXpToLevelCache() {
    if (this._xpToLevelCache) {
      return;
    }

    this._xpToLevelCache = new Map<number, number>();
    for (let i = 0; i <= 100; i++) {
      this._xpToLevelCache.set(this.xpRequiredForLevel(i), i);
    }
  }

  public get xpRequiredForNextLevel(): number {
    return this.xpRequiredForLevel(this.level);
  }

  public get xpPercentToNextLevel(): number {
    const thisLevelXp = this.xpRequiredForLevel(this.level - 1);
    const nextLevelXp = this.xpRequiredForNextLevel;
    const nextScaled = nextLevelXp - thisLevelXp;
    const currScaled = this.currXp - thisLevelXp;
    const percent = currScaled / nextScaled;
    return percent;
  }

  xpRequiredForLevel(level: number): number {
    if (level === 0) {
      return 0;
    }

    return level * 5 + Math.pow(level, 2);
  }

  levelForXp(inXp: number): number {
    let highestLevel = 0;
    for (const [xp, level] of this._xpToLevelCache!) {
      highestLevel = level;
      if (xp > inXp) {
        return level;
      }
    }

    // not found in cache, compute it and update cache
    for (;;) {
      highestLevel++;
      const requiredXp = this.xpRequiredForLevel(highestLevel);
      this._xpToLevelCache!.set(requiredXp, highestLevel);
      if (requiredXp >= inXp) {
        return highestLevel;
      }
    }
  }

  giveXp(xp: number) {
    this._currXp += xp;
    this.events.emit(XpEvents.GainedXp, new GainedXpEvent(xp));

    const newLevel = this.levelForXp(this._currXp);
    for (let l = this.level + 1; l <= newLevel; l++) {
      this._level = l;
      this.events.emit(XpEvents.LeveledUp, new LeveledUpEvent(l));
    }
  }
}
