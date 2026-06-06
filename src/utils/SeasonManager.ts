import { SaveManager } from './SaveManager';
import {
  SeasonTask,
  SeasonTaskProgress,
  SeasonData,
  SeasonTaskType,
  SeasonReward,
  SeasonRewardType
} from '../types';
import {
  SeasonCumulativeTasks,
  SeasonWeeklyTaskPool,
  SeasonLevelConfig
} from '../config/SeasonConfig';

export interface SeasonCheckResult {
  newlyCompleted: SeasonTask[];
  newlyClaimable: SeasonTask[];
  expGained: number;
  leveledUp: boolean;
  newLevel: number;
}

export interface SeasonClaimResult {
  task: SeasonTask;
  rewards: SeasonReward[];
  pillsBonus: number;
  seasonPoints: number;
}

export class SeasonManager {
  private static instance: SeasonManager;

  private constructor() {}

  static getInstance(): SeasonManager {
    if (!SeasonManager.instance) {
      SeasonManager.instance = new SeasonManager();
    }
    return SeasonManager.instance;
  }

  checkReset(): { seasonChanged: boolean; weeklyReset: boolean } {
    return SaveManager.getInstance().checkSeasonAndWeeklyReset();
  }

  getSeasonData(): SeasonData {
    return SaveManager.getInstance().getSeasonData();
  }

  getCumulativeTasks(): SeasonTask[] {
    return SeasonCumulativeTasks;
  }

  getWeeklyTasks(): SeasonTask[] {
    const seasonData = this.getSeasonData();
    const weeklyTaskIds = seasonData.weeklyTaskProgress.map(p => p.taskId);
    return SeasonWeeklyTaskPool.filter(t => weeklyTaskIds.includes(t.id));
  }

  getTaskById(id: string): SeasonTask | undefined {
    return [...SeasonCumulativeTasks, ...SeasonWeeklyTaskPool].find(t => t.id === id);
  }

  getTaskProgress(taskId: string): SeasonTaskProgress | undefined {
    const data = this.getSeasonData();
    return [...data.cumulativeTaskProgress, ...data.weeklyTaskProgress].find(p => p.taskId === taskId);
  }

  getProgressPercent(): number {
    const data = this.getSeasonData();
    const all = [...data.cumulativeTaskProgress, ...data.weeklyTaskProgress];
    if (all.length === 0) return 0;
    const completed = all.filter(p => p.isCompleted).length;
    return Math.floor((completed / all.length) * 100);
  }

  getWeeklyProgressPercent(): number {
    const data = this.getSeasonData();
    const weekly = data.weeklyTaskProgress;
    if (weekly.length === 0) return 0;
    const completed = weekly.filter(p => p.isCompleted).length;
    return Math.floor((completed / weekly.length) * 100);
  }

  getCumulativeProgressPercent(): number {
    const data = this.getSeasonData();
    const cum = data.cumulativeTaskProgress;
    if (cum.length === 0) return 0;
    const completed = cum.filter(p => p.isCompleted).length;
    return Math.floor((completed / cum.length) * 100);
  }

  getTimeUntilWeeklyReset(): { days: number; hours: number; minutes: number } {
    const data = this.getSeasonData();
    const now = Date.now();
    const diff = Math.max(0, data.weeklyResetTimestamp - now);
    return {
      days: Math.floor(diff / (24 * 60 * 60 * 1000)),
      hours: Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000)),
      minutes: Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000))
    };
  }

  getLevelProgress(): { currentLevel: number; currentExp: number; expToNext: number; progressPercent: number } {
    const data = this.getSeasonData();
    const { expPerLevel, maxLevel } = SeasonLevelConfig;
    let requiredExp = expPerLevel;
    let level = 1;
    let remaining = data.seasonExp;

    while (remaining >= requiredExp && level < maxLevel) {
      remaining -= requiredExp;
      level++;
      requiredExp = Math.floor(expPerLevel * Math.pow(SeasonLevelConfig.levelExpMultiplier, level - 1));
    }

    const currentLevel = Math.min(level, maxLevel);
    const expToNext = currentLevel >= maxLevel ? 0 : requiredExp;
    const progressPercent = expToNext === 0 ? 100 : Math.floor((remaining / expToNext) * 100);

    return {
      currentLevel,
      currentExp: remaining,
      expToNext,
      progressPercent
    };
  }

  updateTaskProgress(type: SeasonTaskType, value: number, takeMax: boolean = false): SeasonCheckResult {
    const saveManager = SaveManager.getInstance();
    const data = saveManager.getSeasonData();
    const result: SeasonCheckResult = {
      newlyCompleted: [],
      newlyClaimable: [],
      expGained: 0,
      leveledUp: false,
      newLevel: this.getLevelProgress().currentLevel
    };

    const allTasks = [...SeasonCumulativeTasks, ...this.getWeeklyTasks()];
    const allProgress = [...data.cumulativeTaskProgress, ...data.weeklyTaskProgress];

    const oldLevel = this.getLevelProgress().currentLevel;

    for (const task of allTasks) {
      if (task.type !== type) continue;

      const progress = allProgress.find(p => p.taskId === task.id);
      if (!progress) continue;
      if (progress.isCompleted) continue;

      const newValue = takeMax
        ? Math.max(progress.currentValue, value)
        : progress.currentValue + value;

      progress.currentValue = Math.min(newValue, task.targetValue);
      progress.updatedAt = Date.now();

      if (progress.currentValue >= task.targetValue && !progress.isCompleted) {
        progress.isCompleted = true;
        result.newlyCompleted.push(task);
        result.newlyClaimable.push(task);

        const taskDef = this.getTaskById(task.id);
        if (taskDef) {
          const pointsReward = taskDef.rewards.find(r => r.type === SeasonRewardType.SEASON_POINTS);
          if (pointsReward) {
            result.expGained += pointsReward.value as number;
          }
        }

        if (!data.newlyCompletedTasks.includes(task.id)) {
          data.newlyCompletedTasks.push(task.id);
        }
        if (!data.newlyClaimableTasks.includes(task.id)) {
          data.newlyClaimableTasks.push(task.id);
        }
      }
    }

    if (result.expGained > 0) {
      data.seasonExp += result.expGained;
      data.totalSeasonPoints += result.expGained;

      const newLevelData = this.getLevelProgress();
      data.seasonLevel = newLevelData.currentLevel;
      if (newLevelData.currentLevel > oldLevel) {
        result.leveledUp = true;
        result.newLevel = newLevelData.currentLevel;
      }
    }

    saveManager.saveSeasonData({
      cumulativeTaskProgress: data.cumulativeTaskProgress,
      weeklyTaskProgress: data.weeklyTaskProgress,
      newlyCompletedTasks: data.newlyCompletedTasks,
      newlyClaimableTasks: data.newlyClaimableTasks,
      seasonExp: data.seasonExp,
      seasonLevel: data.seasonLevel,
      totalSeasonPoints: data.totalSeasonPoints,
      lifetimeStats: {
        ...data.lifetimeStats,
        totalSeasonPointsEarned: data.lifetimeStats.totalSeasonPointsEarned + result.expGained,
        totalTasksCompleted: data.lifetimeStats.totalTasksCompleted + result.newlyCompleted.length
      }
    });

    return result;
  }

  updateSingleGameMax(type: SeasonTaskType, value: number): SeasonCheckResult {
    return this.updateTaskProgress(type, value, true);
  }

  claimReward(taskId: string): SeasonClaimResult | null {
    const saveManager = SaveManager.getInstance();
    const data = saveManager.getSeasonData();
    const allProgress = [...data.cumulativeTaskProgress, ...data.weeklyTaskProgress];
    const progress = allProgress.find(p => p.taskId === taskId);

    if (!progress || !progress.isCompleted || progress.isClaimed) {
      return null;
    }

    const task = this.getTaskById(taskId);
    if (!task) return null;

    progress.isClaimed = true;
    data.newlyClaimableTasks = data.newlyClaimableTasks.filter(id => id !== taskId);
    if (!data.claimedRewards.includes(taskId)) {
      data.claimedRewards.push(taskId);
    }

    let pillsBonus = 0;
    let seasonPoints = 0;
    for (const reward of task.rewards) {
      if (reward.type === SeasonRewardType.PILLS_BONUS) {
        pillsBonus = reward.value as number;
      }
      if (reward.type === SeasonRewardType.SEASON_POINTS) {
        seasonPoints = reward.value as number;
      }
    }

    if (pillsBonus > 0) {
      saveManager.addPills(pillsBonus);
    }

    saveManager.saveSeasonData({
      cumulativeTaskProgress: data.cumulativeTaskProgress,
      weeklyTaskProgress: data.weeklyTaskProgress,
      newlyClaimableTasks: data.newlyClaimableTasks,
      claimedRewards: data.claimedRewards
    });

    return {
      task,
      rewards: task.rewards,
      pillsBonus,
      seasonPoints
    };
  }

  claimAllAvailable(): SeasonClaimResult[] {
    const results: SeasonClaimResult[] = [];
    const data = this.getSeasonData();
    const allIds = data.newlyClaimableTasks.slice();
    for (const id of allIds) {
      const result = this.claimReward(id);
      if (result) results.push(result);
    }
    return results;
  }

  hasClaimableRewards(): boolean {
    const data = this.getSeasonData();
    return data.newlyClaimableTasks.length > 0;
  }

  hasNewlyCompletedTasks(): boolean {
    const data = this.getSeasonData();
    return data.newlyCompletedTasks.length > 0;
  }

  clearNewlyCompleted(): void {
    SaveManager.getInstance().saveSeasonData({
      newlyCompletedTasks: []
    });
  }

  getClaimableCount(): number {
    return this.getSeasonData().newlyClaimableTasks.length;
  }

  getCompletedCount(): number {
    const data = this.getSeasonData();
    return [...data.cumulativeTaskProgress, ...data.weeklyTaskProgress].filter(p => p.isCompleted).length;
  }

  getTotalTaskCount(): number {
    return SeasonCumulativeTasks.length + this.getWeeklyTasks().length;
  }
}
