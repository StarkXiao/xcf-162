import {
  LeaderboardEntry,
  LeaderboardGameMode,
  LeaderboardSortType
} from '../types';
import { SaveManager } from './SaveManager';

export interface AddLeaderboardResult {
  isNewRecord: boolean;
  rank: number;
  entry: LeaderboardEntry;
}

export class LeaderboardManager {
  private static instance: LeaderboardManager;
  private saveManager: SaveManager;
  private readonly MAX_ENTRIES_PER_MODE = 50;

  private constructor() {
    this.saveManager = SaveManager.getInstance();
  }

  static getInstance(): LeaderboardManager {
    if (!LeaderboardManager.instance) {
      LeaderboardManager.instance = new LeaderboardManager();
    }
    return LeaderboardManager.instance;
  }

  addEntry(params: {
    mode: LeaderboardGameMode;
    score: number;
    floor: number;
    pills: number;
    maxCombo: number;
    clearTimeMs?: number;
    chapterId?: number;
    maxAddiction?: number;
    hallucinations?: number;
    lossOfControl?: number;
  }): AddLeaderboardResult {
    const data = this.saveManager.getLeaderboardData();
    const entries = [...(data.entries || [])];

    const now = Date.now();
    const newEntry: LeaderboardEntry = {
      id: `${now}-${Math.random().toString(36).substring(2, 9)}`,
      mode: params.mode,
      score: params.score,
      floor: params.floor,
      pills: params.pills,
      maxCombo: params.maxCombo,
      clearTimeMs: params.clearTimeMs,
      chapterId: params.chapterId,
      maxAddiction: params.maxAddiction,
      hallucinations: params.hallucinations,
      lossOfControl: params.lossOfControl,
      date: new Date(now).toLocaleDateString('zh-CN'),
      timestamp: now
    };

    entries.push(newEntry);

    const modeEntries = entries.filter(e => e.mode === params.mode);
    const otherEntries = entries.filter(e => e.mode !== params.mode);

    const sortedForTrim = [...modeEntries].sort((a, b) => b.score - a.score || b.timestamp - a.timestamp);
    const trimmedModeEntries = sortedForTrim.slice(0, this.MAX_ENTRIES_PER_MODE);

    const allEntries = [...trimmedModeEntries, ...otherEntries];

    this.saveManager.saveLeaderboardData({ entries: allEntries });

    const sortedForRank = this.sortEntries(trimmedModeEntries, LeaderboardSortType.HIGH_SCORE);
    const rank = sortedForRank.findIndex(e => e.id === newEntry.id) + 1;

    const isNewRecord = this.checkIsNewRecord(newEntry, sortedForRank);

    return { isNewRecord, rank, entry: newEntry };
  }

  private checkIsNewRecord(entry: LeaderboardEntry, sortedEntries: LeaderboardEntry[]): boolean {
    if (sortedEntries.length === 0) return true;
    const sameMode = sortedEntries.filter(e => e.mode === entry.mode);
    if (sameMode.length === 0) return true;

    const topScore = sameMode[0]?.score || 0;
    const topFloor = Math.max(...sameMode.map(e => e.floor));
    const topPills = Math.max(...sameMode.map(e => e.pills));

    if (entry.clearTimeMs !== undefined && entry.clearTimeMs > 0) {
      const bestClear = sameMode
        .filter(e => e.clearTimeMs && e.clearTimeMs > 0)
        .sort((a, b) => (a.clearTimeMs || 0) - (b.clearTimeMs || 0))[0];
      if (bestClear && entry.clearTimeMs < (bestClear.clearTimeMs || Infinity)) {
        return true;
      }
    }

    return entry.score >= topScore ||
           entry.floor >= topFloor ||
           entry.pills >= topPills;
  }

  getEntries(mode?: LeaderboardGameMode, sortType: LeaderboardSortType = LeaderboardSortType.HIGH_SCORE): LeaderboardEntry[] {
    const data = this.saveManager.getLeaderboardData();
    let entries = [...(data.entries || [])];

    if (mode !== undefined) {
      entries = entries.filter(e => e.mode === mode);
    }

    return this.sortEntries(entries, sortType);
  }

  private sortEntries(entries: LeaderboardEntry[], sortType: LeaderboardSortType): LeaderboardEntry[] {
    const sorted = [...entries];

    switch (sortType) {
      case LeaderboardSortType.HIGHEST_FLOOR:
        sorted.sort((a, b) => b.floor - a.floor || b.score - a.score || b.timestamp - a.timestamp);
        break;
      case LeaderboardSortType.TOTAL_PILLS:
        sorted.sort((a, b) => b.pills - a.pills || b.score - a.score || b.timestamp - a.timestamp);
        break;
      case LeaderboardSortType.FASTEST_CLEAR:
        sorted.sort((a, b) => {
          const aTime = a.clearTimeMs || Infinity;
          const bTime = b.clearTimeMs || Infinity;
          if (aTime === Infinity && bTime === Infinity) {
            return b.score - a.score;
          }
          if (aTime === Infinity) return 1;
          if (bTime === Infinity) return -1;
          return aTime - bTime;
        });
        break;
      case LeaderboardSortType.HIGH_SCORE:
      default:
        sorted.sort((a, b) => b.score - a.score || b.floor - a.floor || b.timestamp - a.timestamp);
        break;
    }

    return sorted;
  }

  getBestByMode(mode: LeaderboardGameMode): {
    bestScore: number;
    bestFloor: number;
    bestPills: number;
    bestClearTimeMs?: number;
  } {
    const entries = this.getEntries(mode);

    if (entries.length === 0) {
      return { bestScore: 0, bestFloor: 0, bestPills: 0 };
    }

    const bestScore = entries[0]?.score || 0;
    const bestFloor = Math.max(...entries.map(e => e.floor));
    const bestPills = Math.max(...entries.map(e => e.pills));

    const withClearTime = entries.filter(e => e.clearTimeMs && e.clearTimeMs > 0);
    let bestClearTimeMs: number | undefined;
    if (withClearTime.length > 0) {
      bestClearTimeMs = Math.min(...withClearTime.map(e => e.clearTimeMs!));
    }

    return { bestScore, bestFloor, bestPills, bestClearTimeMs };
  }

  clearAll(): void {
    this.saveManager.saveLeaderboardData({ entries: [] });
  }

  clearByMode(mode: LeaderboardGameMode): void {
    const data = this.saveManager.getLeaderboardData();
    const filtered = (data.entries || []).filter(e => e.mode !== mode);
    this.saveManager.saveLeaderboardData({ entries: filtered });
  }

  getTotalEntries(): number {
    const data = this.saveManager.getLeaderboardData();
    return (data.entries || []).length;
  }

  static formatClearTime(ms?: number): string {
    if (!ms || ms <= 0) return '--:--:--';
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
}
