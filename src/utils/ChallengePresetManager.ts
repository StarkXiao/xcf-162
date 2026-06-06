import { ChallengeConfig, WinConditionType } from '../types';

export class ChallengePresetManager {
  private static instance: ChallengePresetManager;
  private readonly STORAGE_KEY: string = 'elevator_challenge_presets';

  private defaultPresets: ChallengeConfig[] = [
    {
      id: 'default-easy',
      name: '轻松入门',
      createdAt: 0,
      floorDensity: 0.7,
      platformCountMin: 3,
      platformCountMax: 4,
      guardCount: 0,
      guardSpeedMultiplier: 0.6,
      guardDetectionRange: 100,
      guardSpawnInterval: 15000,
      pillWeights: { speed: 3, slow: 2, score: 4, shield: 2 },
      pillSpawnInterval: 2000,
      maxPills: 12,
      winCondition: { type: WinConditionType.FLOOR_REACHED, value: 10 },
      loseOnGuardCollision: true,
      loseOnFall: true,
      timeLimitMs: 0,
      enableDayNightCycle: false,
      enableFloorEvents: false,
      enableSideEffects: false,
      description: '少量保安，大量药片，适合新手熟悉操作'
    },
    {
      id: 'default-classic',
      name: '经典模式',
      createdAt: 0,
      floorDensity: 1.0,
      platformCountMin: 2,
      platformCountMax: 3,
      guardCount: 1,
      guardSpeedMultiplier: 1.0,
      guardDetectionRange: 150,
      guardSpawnInterval: 8000,
      pillWeights: { speed: 2, slow: 2, score: 3, shield: 1 },
      pillSpawnInterval: 3000,
      maxPills: 8,
      winCondition: { type: WinConditionType.FLOOR_REACHED, value: 20 },
      loseOnGuardCollision: true,
      loseOnFall: true,
      timeLimitMs: 0,
      enableDayNightCycle: true,
      enableFloorEvents: true,
      enableSideEffects: true,
      description: '标准游戏体验，完整的日夜循环与事件系统'
    },
    {
      id: 'default-guard-hell',
      name: '保安地狱',
      createdAt: 0,
      floorDensity: 0.8,
      platformCountMin: 2,
      platformCountMax: 3,
      guardCount: 3,
      guardSpeedMultiplier: 1.5,
      guardDetectionRange: 220,
      guardSpawnInterval: 3500,
      pillWeights: { speed: 3, slow: 3, score: 1, shield: 4 },
      pillSpawnInterval: 3500,
      maxPills: 6,
      winCondition: { type: WinConditionType.FLOOR_REACHED, value: 15 },
      loseOnGuardCollision: true,
      loseOnFall: true,
      timeLimitMs: 0,
      enableDayNightCycle: true,
      enableFloorEvents: true,
      enableSideEffects: true,
      description: '保安成群结队，只有护盾能拯救你'
    },
    {
      id: 'default-pill-rush',
      name: '药片狂飙',
      createdAt: 0,
      floorDensity: 1.2,
      platformCountMin: 3,
      platformCountMax: 4,
      guardCount: 0,
      guardSpeedMultiplier: 0.8,
      guardDetectionRange: 120,
      guardSpawnInterval: 12000,
      pillWeights: { speed: 4, slow: 1, score: 4, shield: 1 },
      pillSpawnInterval: 1200,
      maxPills: 20,
      winCondition: { type: WinConditionType.PILLS_COLLECTED, value: 50 },
      loseOnGuardCollision: true,
      loseOnFall: true,
      timeLimitMs: 120000,
      enableDayNightCycle: false,
      enableFloorEvents: false,
      enableSideEffects: true,
      description: '限时2分钟，尽可能多地收集药片！'
    },
    {
      id: 'default-marathon',
      name: '无尽马拉松',
      createdAt: 0,
      floorDensity: 1.0,
      platformCountMin: 2,
      platformCountMax: 3,
      guardCount: 1,
      guardSpeedMultiplier: 1.0,
      guardDetectionRange: 150,
      guardSpawnInterval: 6000,
      pillWeights: { speed: 2, slow: 2, score: 3, shield: 2 },
      pillSpawnInterval: 2500,
      maxPills: 10,
      winCondition: { type: WinConditionType.SCORE_REACHED, value: 10000 },
      loseOnGuardCollision: true,
      loseOnFall: true,
      timeLimitMs: 0,
      enableDayNightCycle: true,
      enableFloorEvents: true,
      enableSideEffects: true,
      description: '达到10000分即可获胜，考验你的综合能力'
    }
  ];

  private constructor() {}

  static getInstance(): ChallengePresetManager {
    if (!ChallengePresetManager.instance) {
      ChallengePresetManager.instance = new ChallengePresetManager();
    }
    return ChallengePresetManager.instance;
  }

  getAllPresets(): ChallengeConfig[] {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const customPresets = parsed.filter(
            (p: ChallengeConfig) => !this.defaultPresets.find(d => d.id === p.id)
          );
          return [...this.defaultPresets, ...customPresets];
        }
      }
      return [...this.defaultPresets];
    } catch (e) {
      console.warn('Failed to load challenge presets:', e);
      return [...this.defaultPresets];
    }
  }

  getPreset(id: string): ChallengeConfig | undefined {
    return this.getAllPresets().find(p => p.id === id);
  }

  savePreset(config: Omit<ChallengeConfig, 'id' | 'createdAt'> & { id?: string }): ChallengeConfig {
    const allPresets = this.getAllPresets();
    const isDefault = this.defaultPresets.find(d => d.id === config.id);

    let finalConfig: ChallengeConfig;

    if (config.id && !isDefault) {
      const index = allPresets.findIndex(p => p.id === config.id);
      finalConfig = {
        ...allPresets[index],
        ...config,
        id: config.id,
        createdAt: allPresets[index]?.createdAt || Date.now()
      };
      if (index >= 0) {
        allPresets[index] = finalConfig;
      } else {
        allPresets.push(finalConfig);
      }
    } else {
      finalConfig = {
        ...config,
        id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: Date.now()
      } as ChallengeConfig;
      allPresets.push(finalConfig);
    }

    const customPresets = allPresets.filter(
      (p) => !this.defaultPresets.find(d => d.id === p.id)
    );
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(customPresets));

    return finalConfig;
  }

  deletePreset(id: string): boolean {
    if (this.defaultPresets.find(d => d.id === id)) {
      return false;
    }

    const allPresets = this.getAllPresets();
    const filtered = allPresets.filter(p => p.id !== id);

    if (filtered.length === allPresets.length) {
      return false;
    }

    const customPresets = filtered.filter(
      (p) => !this.defaultPresets.find(d => d.id === p.id)
    );
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(customPresets));
    return true;
  }

  isDefaultPreset(id: string): boolean {
    return this.defaultPresets.some(p => p.id === id);
  }

  createEmptyConfig(): ChallengeConfig {
    return {
      id: '',
      name: '新挑战',
      createdAt: Date.now(),
      floorDensity: 1.0,
      platformCountMin: 2,
      platformCountMax: 3,
      guardCount: 1,
      guardSpeedMultiplier: 1.0,
      guardDetectionRange: 150,
      guardSpawnInterval: 8000,
      pillWeights: { speed: 2, slow: 2, score: 3, shield: 1 },
      pillSpawnInterval: 3000,
      maxPills: 8,
      winCondition: { type: WinConditionType.FLOOR_REACHED, value: 20 },
      loseOnGuardCollision: true,
      loseOnFall: true,
      timeLimitMs: 0,
      enableDayNightCycle: true,
      enableFloorEvents: true,
      enableSideEffects: true,
      description: ''
    };
  }

  getDefaultPresets(): ChallengeConfig[] {
    return [...this.defaultPresets];
  }
}
