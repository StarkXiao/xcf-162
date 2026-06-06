import { SaveManager } from './SaveManager';
import { Achievements } from '../config/AchievementConfig';
import { Achievement, AchievementData, InGameStats, AchievementConditionType } from '../types';

export interface AchievementUnlockResult {
  newlyUnlocked: Achievement[];
}

export class AchievementManager {
  private static instance: AchievementManager;

  private constructor() {}

  static getInstance(): AchievementManager {
    if (!AchievementManager.instance) {
      AchievementManager.instance = new AchievementManager();
    }
    return AchievementManager.instance;
  }

  getAchievementData(): AchievementData {
    const saveManager = SaveManager.getInstance();
    const saveData = saveManager.getSaveData();
    const defaultData: AchievementData = {
      unlockedAchievements: [],
      newlyUnlocked: [],
      inGameStats: this.getDefaultInGameStats(),
      stats: {
        totalDoubleJumps: 0,
        totalPerfectJumps: 0,
        totalNoGuardHitGames: 0,
        totalCollectAllPillsGames: 0
      }
    };
    return {
      ...defaultData,
      ...saveData.achievements,
      inGameStats: { ...defaultData.inGameStats, ...(saveData.achievements?.inGameStats || {}) },
      stats: { ...defaultData.stats, ...(saveData.achievements?.stats || {}) }
    };
  }

  getDefaultInGameStats(): InGameStats {
    return {
      score: 0,
      floor: 0,
      pills: 0,
      maxCombo: 0,
      maxNoDamageFloors: 0,
      maxAddiction: 0,
      hallucinations: 0,
      lossOfControl: 0,
      doubleJumps: 0,
      guardHits: 0,
      perfectJumps: 0
    };
  }

  saveAchievementData(data: Partial<AchievementData>): void {
    const saveManager = SaveManager.getInstance();
    const current = this.getAchievementData();
    const updated: AchievementData = {
      ...current,
      ...data,
      inGameStats: { ...current.inGameStats, ...(data.inGameStats || {}) },
      stats: { ...current.stats, ...(data.stats || {}) }
    };
    saveManager.saveGameData({ achievements: updated });
  }

  resetInGameStats(): void {
    this.saveAchievementData({ inGameStats: this.getDefaultInGameStats() });
  }

  updateInGameStat<K extends keyof InGameStats>(key: K, value: InGameStats[K], takeMax: boolean = false): void {
    const data = this.getAchievementData();
    const current = data.inGameStats[key];
    if (takeMax) {
      data.inGameStats[key] = (value > current ? value : current) as InGameStats[K];
    } else {
      data.inGameStats[key] = value;
    }
    this.saveAchievementData({ inGameStats: data.inGameStats });
  }

  addInGameStat<K extends keyof InGameStats>(key: K, amount: number): void {
    const data = this.getAchievementData();
    (data.inGameStats[key] as number) = ((data.inGameStats[key] as number) || 0) + amount;
    this.saveAchievementData({ inGameStats: data.inGameStats });
  }

  isAchievementUnlocked(id: string): boolean {
    return this.getAchievementData().unlockedAchievements.includes(id);
  }

  unlockAchievement(id: string): boolean {
    if (this.isAchievementUnlocked(id)) return false;
    const data = this.getAchievementData();
    data.unlockedAchievements.push(id);
    data.newlyUnlocked.push(id);
    this.saveAchievementData(data);
    return true;
  }

  getNewlyUnlocked(): string[] {
    return this.getAchievementData().newlyUnlocked || [];
  }

  clearNewlyUnlocked(): void {
    const data = this.getAchievementData();
    data.newlyUnlocked = [];
    this.saveAchievementData(data);
  }

  getUnlockedCount(): number {
    return this.getAchievementData().unlockedAchievements.length;
  }

  getTotalCount(): number {
    return Achievements.length;
  }

  getProgressPercent(): number {
    const total = this.getTotalCount();
    if (total === 0) return 0;
    return Math.floor((this.getUnlockedCount() / total) * 100);
  }

  checkCondition(condition: { type: AchievementConditionType; value: number }): boolean {
    const saveManager = SaveManager.getInstance();
    const saveData = saveManager.getSaveData();
    const achievementData = this.getAchievementData();
    const inGame = achievementData.inGameStats;
    const stats = achievementData.stats;

    switch (condition.type) {
      case 'singleGameScore':
        return inGame.score >= condition.value;
      case 'singleGameFloor':
        return inGame.floor >= condition.value;
      case 'singleGamePills':
        return inGame.pills >= condition.value;
      case 'singleGameCombo':
        return inGame.maxCombo >= condition.value;
      case 'singleGameNoDamageFloors':
        return inGame.maxNoDamageFloors >= condition.value;
      case 'singleGameMaxAddiction':
        return inGame.maxAddiction >= condition.value;
      case 'singleGameHallucinations':
        return inGame.hallucinations >= condition.value;
      case 'singleGameLossOfControl':
        return inGame.lossOfControl >= condition.value;
      case 'totalGamesPlayed':
        return saveData.gamesPlayed >= condition.value;
      case 'totalPills':
        return saveData.totalPills >= condition.value;
      case 'totalHighScore':
        return saveData.highScore >= condition.value;
      case 'totalCombos':
        return (saveData.totalCombos || 0) >= condition.value;
      case 'totalDayCycles':
        return (saveData.totalDayCycles || 0) >= condition.value;
      case 'totalEventsTriggered':
        return (saveData.eventsTriggered || 0) >= condition.value;
      case 'totalHallucinations':
        return (saveData.totalHallucinationsTriggered || 0) >= condition.value;
      case 'totalLossOfControl':
        return (saveData.totalLossOfControlTriggered || 0) >= condition.value;
      case 'endlessBestScore':
        return (saveData.endlessBestScore || 0) >= condition.value;
      case 'endlessBestFloor':
        return (saveData.endlessBestFloor || 0) >= condition.value;
      case 'endlessGamesPlayed':
        return (saveData.endlessGamesPlayed || 0) >= condition.value;
      case 'trainingTotalScore':
        const training = saveManager.getTrainingScores();
        const totalTrainingScore =
          (training.pillTraining.totalScore || 0) +
          (training.guardTraining.totalScore || 0) +
          training.jumpTraining.bestCombo * 100;
        return totalTrainingScore >= condition.value;
      case 'noGuardHitGame':
        return stats.totalNoGuardHitGames >= condition.value;
      case 'collectAllPillsInGame':
        return stats.totalCollectAllPillsGames >= condition.value;
      case 'perfectJumpCombo':
        return stats.totalPerfectJumps >= condition.value;
      default:
        return false;
    }
  }

  checkAllAchievements(): AchievementUnlockResult {
    const result: AchievementUnlockResult = { newlyUnlocked: [] };

    for (const achievement of Achievements) {
      if (!this.isAchievementUnlocked(achievement.id) && this.checkCondition(achievement.condition)) {
        if (this.unlockAchievement(achievement.id)) {
          result.newlyUnlocked.push(achievement);
        }
      }
    }

    return result;
  }

  onGameEnd(noGuardHits: boolean): void {
    const data = this.getAchievementData();
    if (noGuardHits && data.inGameStats.floor > 0) {
      data.stats.totalNoGuardHitGames += 1;
    }
    data.stats.totalDoubleJumps += data.inGameStats.doubleJumps;
    data.stats.totalPerfectJumps += data.inGameStats.perfectJumps;
    this.saveAchievementData({ stats: data.stats });
  }

  getAchievementById(id: string): Achievement | undefined {
    return Achievements.find(a => a.id === id);
  }

  getAchievementsByRarity(rarity: string): Achievement[] {
    return Achievements.filter(a => a.rarity === rarity);
  }
}
