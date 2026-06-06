import { SaveData, TimeOfDay, TrainingScores, JumpTrainingScore, PillTrainingScore, GuardTrainingScore, EndlessLeaderboardEntry } from '../types';
import { GameConfig } from '../config/GameConfig';

export class SaveManager {
  private static instance: SaveManager;
  private readonly STORAGE_KEY: string = 'elevator_survival_save';
  private defaultTrainingScores: TrainingScores = {
    jumpTraining: {
      bestCombo: 0,
      totalJumps: 0,
      perfectJumps: 0,
      highestFloor: 0,
      gamesPlayed: 0
    },
    pillTraining: {
      pillsCollected: 0,
      pillsPerType: {},
      bestStreak: 0,
      totalScore: 0,
      gamesPlayed: 0
    },
    guardTraining: {
      guardsAvoided: 0,
      longestSurvival: 0,
      guardsTricked: 0,
      totalScore: 0,
      gamesPlayed: 0
    }
  };

  private defaultData: SaveData = {
    highScore: 0,
    totalPills: 0,
    gamesPlayed: 0,
    lastTimeOfDay: TimeOfDay.DAWN,
    totalDayCycles: 0,
    eventsTriggered: 0,
    maxCombo: 0,
    maxNoDamageFloors: 0,
    totalCombos: 0,
    trainingScores: this.defaultTrainingScores,
    endlessLeaderboard: [],
    endlessBestScore: 0,
    endlessBestFloor: 0,
    endlessGamesPlayed: 0
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

  getTrainingScores(): TrainingScores {
    const data = this.getSaveData();
    return {
      jumpTraining: { ...this.defaultTrainingScores.jumpTraining, ...(data.trainingScores?.jumpTraining || {}) },
      pillTraining: { ...this.defaultTrainingScores.pillTraining, ...(data.trainingScores?.pillTraining || {}) },
      guardTraining: { ...this.defaultTrainingScores.guardTraining, ...(data.trainingScores?.guardTraining || {}) }
    };
  }

  saveJumpTrainingScore(score: Partial<JumpTrainingScore>): void {
    const current = this.getTrainingScores();
    const existing = current.jumpTraining;
    const updated: JumpTrainingScore = {
      bestCombo: Math.max(existing.bestCombo, score.bestCombo || 0),
      totalJumps: existing.totalJumps + (score.totalJumps || 0),
      perfectJumps: existing.perfectJumps + (score.perfectJumps || 0),
      highestFloor: Math.max(existing.highestFloor, score.highestFloor || 0),
      gamesPlayed: existing.gamesPlayed + (score.gamesPlayed || 0)
    };
    this.saveGameData({
      trainingScores: {
        ...current,
        jumpTraining: updated
      }
    });
  }

  savePillTrainingScore(score: Partial<PillTrainingScore>): void {
    const current = this.getTrainingScores();
    const existing = current.pillTraining;
    const mergedPillsPerType = { ...existing.pillsPerType };
    if (score.pillsPerType) {
      for (const [type, count] of Object.entries(score.pillsPerType)) {
        mergedPillsPerType[type] = (mergedPillsPerType[type] || 0) + count;
      }
    }
    const updated: PillTrainingScore = {
      pillsCollected: existing.pillsCollected + (score.pillsCollected || 0),
      pillsPerType: mergedPillsPerType,
      bestStreak: Math.max(existing.bestStreak, score.bestStreak || 0),
      totalScore: existing.totalScore + (score.totalScore || 0),
      gamesPlayed: existing.gamesPlayed + (score.gamesPlayed || 0)
    };
    this.saveGameData({
      trainingScores: {
        ...current,
        pillTraining: updated
      }
    });
  }

  saveGuardTrainingScore(score: Partial<GuardTrainingScore>): void {
    const current = this.getTrainingScores();
    const existing = current.guardTraining;
    const updated: GuardTrainingScore = {
      guardsAvoided: existing.guardsAvoided + (score.guardsAvoided || 0),
      longestSurvival: Math.max(existing.longestSurvival, score.longestSurvival || 0),
      guardsTricked: existing.guardsTricked + (score.guardsTricked || 0),
      totalScore: existing.totalScore + (score.totalScore || 0),
      gamesPlayed: existing.gamesPlayed + (score.gamesPlayed || 0)
    };
    this.saveGameData({
      trainingScores: {
        ...current,
        guardTraining: updated
      }
    });
  }

  getEndlessLeaderboard(): EndlessLeaderboardEntry[] {
    const data = this.getSaveData();
    return data.endlessLeaderboard || [];
  }

  addEndlessScore(entry: Omit<EndlessLeaderboardEntry, 'rank'>): { isNewRecord: boolean; rank: number; leaderboard: EndlessLeaderboardEntry[] } {
    const data = this.getSaveData();
    const leaderboard = [...(data.endlessLeaderboard || [])];

    const newEntry: EndlessLeaderboardEntry = {
      ...entry,
      rank: 0
    };

    leaderboard.push(newEntry);
    leaderboard.sort((a, b) => b.score - a.score);

    const ranked = leaderboard.slice(0, GameConfig.endlessLeaderboardMaxEntries).map((e, i) => ({
      ...e,
      rank: i + 1
    }));

    const rank = ranked.findIndex(e => e.date === newEntry.date && e.score === newEntry.score) + 1;
    const isNewRecord = rank === 1 || newEntry.score > (data.endlessBestScore || 0);

    this.saveGameData({
      endlessLeaderboard: ranked,
      endlessBestScore: Math.max(data.endlessBestScore || 0, newEntry.score),
      endlessBestFloor: Math.max(data.endlessBestFloor || 0, newEntry.floor),
      endlessGamesPlayed: (data.endlessGamesPlayed || 0) + 1
    });

    return { isNewRecord, rank, leaderboard: ranked };
  }

  getEndlessBestScore(): number {
    return this.getSaveData().endlessBestScore || 0;
  }

  getEndlessBestFloor(): number {
    return this.getSaveData().endlessBestFloor || 0;
  }

  getEndlessGamesPlayed(): number {
    return this.getSaveData().endlessGamesPlayed || 0;
  }
}

