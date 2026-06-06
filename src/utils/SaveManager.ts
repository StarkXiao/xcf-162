import { SaveData, TimeOfDay } from '../types';

export class SaveManager {
  private static instance: SaveManager;
  private readonly STORAGE_KEY: string = 'elevator_survival_save';
  private defaultData: SaveData = {
    highScore: 0,
    totalPills: 0,
    gamesPlayed: 0,
    lastTimeOfDay: TimeOfDay.DAWN,
    totalDayCycles: 0,
    eventsTriggered: 0,
    maxCombo: 0,
    maxNoDamageFloors: 0,
    totalCombos: 0
  };

  private constructor() {
    this.initializeSave();
  }

  static getInstance(): SaveManager {
    if (!SaveManager.instance) {
      SaveManager.instance = new SaveManager();
    }
    return SaveManager.instance;
  }

  private initializeSave(): void {
    if (!localStorage.getItem(this.STORAGE_KEY)) {
      this.saveGameData(this.defaultData);
    }
  }

  getSaveData(): SaveData {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...this.defaultData,
          ...parsed
        };
      }
      return { ...this.defaultData };
    } catch (e) {
      console.warn('Failed to load save data:', e);
      return { ...this.defaultData };
    }
  }

  saveGameData(data: Partial<SaveData>): void {
    try {
      const currentData = this.getSaveData();
      const newData: SaveData = {
        ...currentData,
        ...data
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(newData));
    } catch (e) {
      console.warn('Failed to save game data:', e);
    }
  }

  getHighScore(): number {
    return this.getSaveData().highScore;
  }

  setHighScore(score: number): void {
    const current = this.getHighScore();
    if (score > current) {
      this.saveGameData({ highScore: score });
    }
  }

  addPills(count: number): void {
    const data = this.getSaveData();
    this.saveGameData({ totalPills: data.totalPills + count });
  }

  incrementGamesPlayed(): void {
    const data = this.getSaveData();
    this.saveGameData({ gamesPlayed: data.gamesPlayed + 1 });
  }

  setLastTimeOfDay(time: TimeOfDay): void {
    this.saveGameData({ lastTimeOfDay: time });
  }

  getLastTimeOfDay(): TimeOfDay {
    return this.getSaveData().lastTimeOfDay || TimeOfDay.DAWN;
  }

  addDayCycles(count: number): void {
    const data = this.getSaveData();
    this.saveGameData({ totalDayCycles: data.totalDayCycles + count });
  }

  getTotalDayCycles(): number {
    return this.getSaveData().totalDayCycles || 0;
  }

  addEventsTriggered(count: number): void {
    const data = this.getSaveData();
    this.saveGameData({ eventsTriggered: data.eventsTriggered + count });
  }

  getEventsTriggered(): number {
    return this.getSaveData().eventsTriggered || 0;
  }

  resetSaveData(): void {
    this.saveGameData(this.defaultData);
  }

  isNewHighScore(score: number): boolean {
    return score > this.getHighScore();
  }

  getMaxCombo(): number {
    return this.getSaveData().maxCombo || 0;
  }

  setMaxCombo(combo: number): void {
    const current = this.getMaxCombo();
    if (combo > current) {
      this.saveGameData({ maxCombo: combo });
    }
  }

  getMaxNoDamageFloors(): number {
    return this.getSaveData().maxNoDamageFloors || 0;
  }

  setMaxNoDamageFloors(floors: number): void {
    const current = this.getMaxNoDamageFloors();
    if (floors > current) {
      this.saveGameData({ maxNoDamageFloors: floors });
    }
  }

  addCombos(count: number): void {
    const data = this.getSaveData();
    this.saveGameData({ totalCombos: (data.totalCombos || 0) + count });
  }

  getTotalCombos(): number {
    return this.getSaveData().totalCombos || 0;
  }

  isNewMaxCombo(combo: number): boolean {
    return combo > this.getMaxCombo();
  }

  isNewMaxNoDamageFloors(floors: number): boolean {
    return floors > this.getMaxNoDamageFloors();
  }
}

