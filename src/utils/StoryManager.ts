import { StorySaveData, StoryConfig, Chapters } from '../config/StoryConfig';

export class StoryManager {
  private static instance: StoryManager;
  private readonly STORAGE_KEY = StoryConfig.storageKey;

  private defaultData: StorySaveData = {
    currentChapter: 1,
    highestUnlockedChapter: 1,
    completedChapters: [],
    chapterScores: {},
    chapterBestFloors: {},
    totalStoryScore: 0,
    totalDeaths: 0,
    totalPlayTime: 0,
    lastPlayedAt: 0
  };

  private constructor() {
    this.initializeSave();
  }

  static getInstance(): StoryManager {
    if (!StoryManager.instance) {
      StoryManager.instance = new StoryManager();
    }
    return StoryManager.instance;
  }

  private initializeSave(): void {
    if (!localStorage.getItem(this.STORAGE_KEY)) {
      this.saveData(this.defaultData);
    }
  }

  getSaveData(): StorySaveData {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...this.defaultData,
          ...parsed,
          chapterScores: parsed.chapterScores || {},
          chapterBestFloors: parsed.chapterBestFloors || {},
          completedChapters: parsed.completedChapters || []
        };
      }
      return { ...this.defaultData };
    } catch (e) {
      console.warn('Failed to load story save data:', e);
      return { ...this.defaultData };
    }
  }

  saveData(data: Partial<StorySaveData>): void {
    try {
      const currentData = this.getSaveData();
      const newData: StorySaveData = {
        ...currentData,
        ...data
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(newData));
    } catch (e) {
      console.warn('Failed to save story data:', e);
    }
  }

  getCurrentChapter(): number {
    return this.getSaveData().currentChapter;
  }

  setCurrentChapter(chapter: number): void {
    this.saveData({ currentChapter: chapter, lastPlayedAt: Date.now() });
  }

  getHighestUnlockedChapter(): number {
    return this.getSaveData().highestUnlockedChapter;
  }

  isChapterUnlocked(chapterId: number): boolean {
    return chapterId <= this.getHighestUnlockedChapter();
  }

  isChapterCompleted(chapterId: number): boolean {
    return this.getSaveData().completedChapters.includes(chapterId);
  }

  completeChapter(chapterId: number, score: number, floor: number): void {
    const data = this.getSaveData();
    const completed = [...data.completedChapters];
    if (!completed.includes(chapterId)) {
      completed.push(chapterId);
    }

    const chapterScores = { ...data.chapterScores };
    if (!chapterScores[chapterId] || score > chapterScores[chapterId]) {
      chapterScores[chapterId] = score;
    }

    const chapterBestFloors = { ...data.chapterBestFloors };
    if (!chapterBestFloors[chapterId] || floor > chapterBestFloors[chapterId]) {
      chapterBestFloors[chapterId] = floor;
    }

    let nextHighest = data.highestUnlockedChapter;
    if (chapterId >= data.highestUnlockedChapter && chapterId < StoryConfig.totalChapters) {
      nextHighest = chapterId + 1;
    }

    this.saveData({
      completedChapters: completed,
      chapterScores,
      chapterBestFloors,
      highestUnlockedChapter: nextHighest,
      totalStoryScore: data.totalStoryScore + score,
      lastPlayedAt: Date.now()
    });
  }

  addDeath(): void {
    const data = this.getSaveData();
    this.saveData({ totalDeaths: data.totalDeaths + 1 });
  }

  addPlayTime(ms: number): void {
    const data = this.getSaveData();
    this.saveData({ totalPlayTime: data.totalPlayTime + ms });
  }

  getChapterScore(chapterId: number): number {
    return this.getSaveData().chapterScores[chapterId] || 0;
  }

  getChapterBestFloor(chapterId: number): number {
    return this.getSaveData().chapterBestFloors[chapterId] || 0;
  }

  getTotalStoryScore(): number {
    return this.getSaveData().totalStoryScore;
  }

  getTotalDeaths(): number {
    return this.getSaveData().totalDeaths;
  }

  getTotalPlayTime(): number {
    return this.getSaveData().totalPlayTime;
  }

  isAllChaptersCompleted(): boolean {
    return Chapters.every(ch => this.isChapterCompleted(ch.id));
  }

  resetStoryProgress(): void {
    this.saveData(this.defaultData);
  }

  getChapterConfig(chapterId: number) {
    return Chapters.find(c => c.id === chapterId);
  }
}
