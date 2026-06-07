import { SaveData, TimeOfDay, TrainingScores, JumpTrainingScore, PillTrainingScore, GuardTrainingScore, EndlessLeaderboardEntry, ArchiveData, ArchiveUnlockCondition, AchievementData, SeasonData, SeasonTaskProgress, ClubData, ClubUpgradeType, AudioSettings } from '../types';
import { GameConfig } from '../config/GameConfig';
import { getCurrentSeason, pickWeeklyTasks, SeasonCumulativeTasks } from '../config/SeasonConfig';

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
      gamesPlayed: 0,
      totalAddictionAccumulated: 0,
      maxAddictionReached: 0,
      totalHallucinations: 0,
      totalLossOfControl: 0
    },
    guardTraining: {
      guardsAvoided: 0,
      longestSurvival: 0,
      guardsTricked: 0,
      totalScore: 0,
      gamesPlayed: 0
    }
  };

  private defaultAchievementData: AchievementData = {
    unlockedAchievements: [],
    newlyUnlocked: [],
    inGameStats: {
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
      perfectJumps: 0,
      shopPurchases: {
        shieldsPurchased: 0,
        slowPulsesPurchased: 0,
        emergencyBouncesPurchased: 0,
        totalPillsSpent: 0
      }
    },
    stats: {
      totalDoubleJumps: 0,
      totalPerfectJumps: 0,
      totalNoGuardHitGames: 0,
      totalCollectAllPillsGames: 0
    }
  };

  private getDefaultSeasonData(): SeasonData {
    const season = getCurrentSeason();
    const weeklyTasks = pickWeeklyTasks(season.startDate);

    const cumulativeProgress: SeasonTaskProgress[] = SeasonCumulativeTasks.map(t => ({
      taskId: t.id,
      currentValue: 0,
      targetValue: t.targetValue,
      isCompleted: false,
      isClaimed: false,
      updatedAt: Date.now()
    }));

    const weeklyProgress: SeasonTaskProgress[] = weeklyTasks.map(t => ({
      taskId: t.id,
      currentValue: 0,
      targetValue: t.targetValue,
      isCompleted: false,
      isClaimed: false,
      updatedAt: Date.now()
    }));

    return {
      currentSeason: season,
      weeklyResetTimestamp: this.getNextWeeklyReset(),
      totalSeasonPoints: 0,
      cumulativeTaskProgress: cumulativeProgress,
      weeklyTaskProgress: weeklyProgress,
      claimedRewards: [],
      newlyCompletedTasks: [],
      newlyClaimableTasks: [],
      seasonLevel: 1,
      seasonExp: 0,
      lifetimeStats: {
        totalSeasonsCompleted: 0,
        totalSeasonPointsEarned: 0,
        totalTasksCompleted: 0,
        weeklyBestCompletionRate: 0
      }
    };
  }

  private getDefaultClubData(): ClubData {
    return {
      clubCoins: 0,
      totalClubCoinsEarned: 0,
      upgrades: {
        [ClubUpgradeType.DECORATION]: 0,
        [ClubUpgradeType.LIGHTING]: 0,
        [ClubUpgradeType.SOUND]: 0
      }
    };
  }

  private getNextWeeklyReset(): number {
    const now = new Date();
    const nextMonday = new Date(now);
    nextMonday.setDate(now.getDate() + ((8 - now.getDay()) % 7 || 7));
    nextMonday.setHours(0, 0, 0, 0);
    return nextMonday.getTime();
  }

  private defaultAudioSettings: AudioSettings = {
    musicVolume: 70,
    sfxVolume: 80,
    musicMuted: false,
    sfxMuted: false,
    adaptiveMixing: true
  };

  private defaultData: SaveData = {
    highScore: 0,
    totalPills: 0,
    gamesPlayed: 0,
    riskRewardBestScore: 0,
    riskRewardMode: false,
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
    endlessGamesPlayed: 0,
    totalAddictionLevel: 0,
    maxAddictionReached: 0,
    totalHallucinationsTriggered: 0,
    totalLossOfControlTriggered: 0,
    totalShieldsPurchased: 0,
    totalSlowPulsesPurchased: 0,
    totalEmergencyBouncesPurchased: 0,
    totalPillsSpentInShop: 0,
    archive: {
      unlockedCharacters: [],
      unlockedRumors: [],
      unlockedHiddenFloors: [],
      newlyUnlocked: []
    },
    achievements: this.defaultAchievementData,
    season: this.getDefaultSeasonData(),
    club: this.getDefaultClubData(),
    audio: this.defaultAudioSettings
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
          ...parsed,
          audio: {
            ...this.defaultAudioSettings,
            ...(parsed.audio || {})
          }
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
      maxAddiction: entry.maxAddiction || 0,
      hallucinations: entry.hallucinations || 0,
      lossOfControl: entry.lossOfControl || 0,
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

  addAddictionStats(addictionGained: number, hallucinations: number, lossOfControl: number): void {
    const data = this.getSaveData();
    this.saveGameData({
      totalAddictionLevel: (data.totalAddictionLevel || 0) + addictionGained,
      maxAddictionReached: Math.max(data.maxAddictionReached || 0, addictionGained),
      totalHallucinationsTriggered: (data.totalHallucinationsTriggered || 0) + hallucinations,
      totalLossOfControlTriggered: (data.totalLossOfControlTriggered || 0) + lossOfControl
    });
  }

  getTotalAddictionLevel(): number {
    return this.getSaveData().totalAddictionLevel || 0;
  }

  getMaxAddictionReached(): number {
    return this.getSaveData().maxAddictionReached || 0;
  }

  getTotalHallucinationsTriggered(): number {
    return this.getSaveData().totalHallucinationsTriggered || 0;
  }

  getTotalLossOfControlTriggered(): number {
    return this.getSaveData().totalLossOfControlTriggered || 0;
  }

  getTotalShieldsPurchased(): number {
    return this.getSaveData().totalShieldsPurchased || 0;
  }

  getTotalSlowPulsesPurchased(): number {
    return this.getSaveData().totalSlowPulsesPurchased || 0;
  }

  getTotalEmergencyBouncesPurchased(): number {
    return this.getSaveData().totalEmergencyBouncesPurchased || 0;
  }

  getTotalPillsSpentInShop(): number {
    return this.getSaveData().totalPillsSpentInShop || 0;
  }

  isRiskRewardMode(): boolean {
    return this.getSaveData().riskRewardMode || false;
  }

  setRiskRewardMode(enabled: boolean): void {
    this.saveGameData({ riskRewardMode: enabled });
  }

  getRiskRewardBestScore(): number {
    return this.getSaveData().riskRewardBestScore || 0;
  }

  setRiskRewardBestScore(score: number): void {
    const current = this.getRiskRewardBestScore();
    if (score > current) {
      this.saveGameData({ riskRewardBestScore: score });
    }
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
      gamesPlayed: existing.gamesPlayed + (score.gamesPlayed || 0),
      totalAddictionAccumulated: (existing.totalAddictionAccumulated || 0) + (score.totalAddictionAccumulated || 0),
      maxAddictionReached: Math.max(existing.maxAddictionReached || 0, score.maxAddictionReached || 0),
      totalHallucinations: (existing.totalHallucinations || 0) + (score.totalHallucinations || 0),
      totalLossOfControl: (existing.totalLossOfControl || 0) + (score.totalLossOfControl || 0)
    };
    this.saveGameData({
      trainingScores: {
        ...current,
        pillTraining: updated
      }
    });
  }

  getArchiveData(): ArchiveData {
    const data = this.getSaveData();
    const defaultArchive: ArchiveData = {
      unlockedCharacters: [],
      unlockedRumors: [],
      unlockedHiddenFloors: [],
      newlyUnlocked: []
    };
    return { ...defaultArchive, ...(data.archive || {}) };
  }

  isConditionMet(condition: ArchiveUnlockCondition): boolean {
    const data = this.getSaveData();
    switch (condition.type) {
      case 'gamesPlayed':
        return data.gamesPlayed >= condition.value;
      case 'highScore':
        return data.highScore >= condition.value;
      case 'totalPills':
        return data.totalPills >= condition.value;
      case 'floorReached':
        return data.maxNoDamageFloors >= condition.value;
      case 'endlessFloor':
        return data.endlessBestFloor >= condition.value;
      case 'endlessScore':
        return data.endlessBestScore >= condition.value;
      case 'eventsTriggered':
        return data.eventsTriggered >= condition.value;
      case 'maxCombo':
        return data.maxCombo >= condition.value;
      case 'hallucinations':
        return data.totalHallucinationsTriggered >= condition.value;
      case 'addiction':
        return data.maxAddictionReached >= condition.value;
      case 'trainingScore':
        const training = this.getTrainingScores();
        const totalTrainingScore = (training.pillTraining.totalScore || 0) + (training.guardTraining.totalScore || 0) + training.jumpTraining.bestCombo * 100;
        return totalTrainingScore >= condition.value;
      case 'dayCycles':
        return data.totalDayCycles >= condition.value;
      default:
        return false;
    }
  }

  unlockCharacter(id: string): boolean {
    const archive = this.getArchiveData();
    if (archive.unlockedCharacters.includes(id)) return false;
    archive.unlockedCharacters.push(id);
    archive.newlyUnlocked.push(`char:${id}`);
    this.saveGameData({ archive });
    return true;
  }

  unlockRumor(id: string): boolean {
    const archive = this.getArchiveData();
    if (archive.unlockedRumors.includes(id)) return false;
    archive.unlockedRumors.push(id);
    archive.newlyUnlocked.push(`rumor:${id}`);
    this.saveGameData({ archive });
    return true;
  }

  unlockHiddenFloor(id: string): boolean {
    const archive = this.getArchiveData();
    if (archive.unlockedHiddenFloors.includes(id)) return false;
    archive.unlockedHiddenFloors.push(id);
    archive.newlyUnlocked.push(`floor:${id}`);
    this.saveGameData({ archive });
    return true;
  }

  isCharacterUnlocked(id: string): boolean {
    return this.getArchiveData().unlockedCharacters.includes(id);
  }

  isRumorUnlocked(id: string): boolean {
    return this.getArchiveData().unlockedRumors.includes(id);
  }

  isHiddenFloorUnlocked(id: string): boolean {
    return this.getArchiveData().unlockedHiddenFloors.includes(id);
  }

  getNewlyUnlocked(): string[] {
    return this.getArchiveData().newlyUnlocked || [];
  }

  clearNewlyUnlocked(): void {
    const archive = this.getArchiveData();
    archive.newlyUnlocked = [];
    this.saveGameData({ archive });
  }

  getSeasonData(): SeasonData {
    const data = this.getSaveData();
    const defaultSeason = this.getDefaultSeasonData();
    const saved = data.season || defaultSeason;

    return {
      ...defaultSeason,
      ...saved,
      currentSeason: saved.currentSeason || defaultSeason.currentSeason,
      cumulativeTaskProgress: saved.cumulativeTaskProgress || defaultSeason.cumulativeTaskProgress,
      weeklyTaskProgress: saved.weeklyTaskProgress || defaultSeason.weeklyTaskProgress,
      claimedRewards: saved.claimedRewards || [],
      newlyCompletedTasks: saved.newlyCompletedTasks || [],
      newlyClaimableTasks: saved.newlyClaimableTasks || [],
      lifetimeStats: {
        ...defaultSeason.lifetimeStats,
        ...(saved.lifetimeStats || {})
      }
    };
  }

  saveSeasonData(data: Partial<SeasonData>): void {
    const current = this.getSeasonData();
    const updated: SeasonData = {
      ...current,
      ...data,
      cumulativeTaskProgress: data.cumulativeTaskProgress || current.cumulativeTaskProgress,
      weeklyTaskProgress: data.weeklyTaskProgress || current.weeklyTaskProgress,
      lifetimeStats: {
        ...current.lifetimeStats,
        ...(data.lifetimeStats || {})
      }
    };
    this.saveGameData({ season: updated });
  }

  checkSeasonAndWeeklyReset(): { seasonChanged: boolean; weeklyReset: boolean } {
    const currentSeason = getCurrentSeason();
    const seasonData = this.getSeasonData();
    const now = Date.now();
    let seasonChanged = false;
    let weeklyReset = false;

    if (seasonData.currentSeason.id !== currentSeason.id) {
      const completedTasks = [
        ...seasonData.cumulativeTaskProgress,
        ...seasonData.weeklyTaskProgress
      ].filter(p => p.isCompleted).length;

      const newLifetimeStats = {
        totalSeasonsCompleted: seasonData.lifetimeStats.totalSeasonsCompleted + 1,
        totalSeasonPointsEarned: seasonData.lifetimeStats.totalSeasonPointsEarned + seasonData.totalSeasonPoints,
        totalTasksCompleted: seasonData.lifetimeStats.totalTasksCompleted + completedTasks,
        weeklyBestCompletionRate: seasonData.lifetimeStats.weeklyBestCompletionRate
      };

      const newSeasonData = this.getDefaultSeasonData();
      newSeasonData.lifetimeStats = newLifetimeStats;
      this.saveGameData({ season: newSeasonData });
      seasonChanged = true;
    } else if (seasonData.weeklyResetTimestamp <= now) {
      const weeklyTasks = seasonData.weeklyTaskProgress;
      const completedCount = weeklyTasks.filter(t => t.isCompleted).length;
      const completionRate = weeklyTasks.length > 0 ? completedCount / weeklyTasks.length : 0;
      const bestRate = Math.max(seasonData.lifetimeStats.weeklyBestCompletionRate, completionRate);

      const newWeeklyTaskDefs = pickWeeklyTasks(currentSeason.startDate + Math.floor(now / (7 * 24 * 60 * 60 * 1000)));
      const newWeeklyProgress: SeasonTaskProgress[] = newWeeklyTaskDefs.map(t => ({
        taskId: t.id,
        currentValue: 0,
        targetValue: t.targetValue,
        isCompleted: false,
        isClaimed: false,
        updatedAt: now
      }));

      this.saveSeasonData({
        weeklyResetTimestamp: this.getNextWeeklyReset(),
        weeklyTaskProgress: newWeeklyProgress,
        lifetimeStats: {
          ...seasonData.lifetimeStats,
          weeklyBestCompletionRate: bestRate
        }
      });
      weeklyReset = true;
    }

    return { seasonChanged, weeklyReset };
  }

  getAudioSettings(): AudioSettings {
    return { ...this.defaultAudioSettings, ...(this.getSaveData().audio || {}) };
  }

  saveAudioSettings(settings: Partial<AudioSettings>): void {
    const current = this.getAudioSettings();
    const updated: AudioSettings = {
      ...current,
      ...settings
    };
    this.saveGameData({ audio: updated });
  }

  getMusicVolume(): number {
    return this.getAudioSettings().musicVolume;
  }

  setMusicVolume(volume: number): void {
    this.saveAudioSettings({ musicVolume: Math.max(0, Math.min(100, volume)) });
  }

  getSFXVolume(): number {
    return this.getAudioSettings().sfxVolume;
  }

  setSFXVolume(volume: number): void {
    this.saveAudioSettings({ sfxVolume: Math.max(0, Math.min(100, volume)) });
  }

  isMusicMuted(): boolean {
    return this.getAudioSettings().musicMuted;
  }

  setMusicMuted(muted: boolean): void {
    this.saveAudioSettings({ musicMuted: muted });
  }

  isSFXMuted(): boolean {
    return this.getAudioSettings().sfxMuted;
  }

  setSFXMuted(muted: boolean): void {
    this.saveAudioSettings({ sfxMuted: muted });
  }

  isAdaptiveMixingEnabled(): boolean {
    return this.getAudioSettings().adaptiveMixing;
  }

  setAdaptiveMixingEnabled(enabled: boolean): void {
    this.saveAudioSettings({ adaptiveMixing: enabled });
  }
}

