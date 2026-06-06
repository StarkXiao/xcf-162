import { TimeOfDay, TimeOfDayConfig, FloorEventType } from '../types';

export class GameConfig {
  static readonly width: number = 480;
  static readonly height: number = 720;
  static readonly gravity: number = 800;
  static readonly floorHeight: number = 120;
  static readonly floorGap: number = 200;
  static readonly platformWidth: number = 100;
  static readonly platformHeight: number = 15;
  static readonly playerSpeed: number = 250;
  static readonly playerJumpForce: number = -450;
  static readonly playerWidth: number = 32;
  static readonly playerHeight: number = 48;
  static readonly guardSpeed: number = 120;
  static readonly guardSpawnInterval: number = 8000;
  static readonly pillSpawnInterval: number = 3000;
  static readonly pillScore: number = 100;
  static readonly survivalScoreRate: number = 10;
  static readonly maxFloors: number = 20;
  static readonly eventTriggerFloorInterval: number = 3;
}

export enum PillType {
  SPEED = 'speed',
  SLOW = 'slow',
  SCORE = 'score',
  SHIELD = 'shield'
}

export const PillColors: Record<PillType, number> = {
  [PillType.SPEED]: 0x00ff00,
  [PillType.SLOW]: 0x0088ff,
  [PillType.SCORE]: 0xffcc00,
  [PillType.SHIELD]: 0xff00ff
};

export const PillEffects: Record<PillType, { duration: number; value: number }> = {
  [PillType.SPEED]: { duration: 5000, value: 1.5 },
  [PillType.SLOW]: { duration: 4000, value: 0.5 },
  [PillType.SCORE]: { duration: 0, value: 500 },
  [PillType.SHIELD]: { duration: 6000, value: 1 }
};

export const TimeOfDayConfigs: Record<TimeOfDay, TimeOfDayConfig> = {
  [TimeOfDay.DAWN]: {
    name: '黎明',
    icon: '🌅',
    bgColor: 0x1a1a2e,
    lightOpacity: 0.5,
    guardSpeedMultiplier: 0.8,
    guardSpawnMultiplier: 0.8,
    guardDetectionRange: 120,
    pillWeights: { speed: 3, slow: 2, score: 3, shield: 1 },
    pillSpawnMultiplier: 1.0,
    duration: 15000
  },
  [TimeOfDay.DAY]: {
    name: '白天',
    icon: '☀️',
    bgColor: 0x2a2a4e,
    lightOpacity: 0.8,
    guardSpeedMultiplier: 1.0,
    guardSpawnMultiplier: 1.0,
    guardDetectionRange: 150,
    pillWeights: { speed: 2, slow: 2, score: 4, shield: 1 },
    pillSpawnMultiplier: 1.2,
    duration: 20000
  },
  [TimeOfDay.DUSK]: {
    name: '黄昏',
    icon: '🌇',
    bgColor: 0x3a1a2e,
    lightOpacity: 0.6,
    guardSpeedMultiplier: 1.1,
    guardSpawnMultiplier: 1.2,
    guardDetectionRange: 170,
    pillWeights: { speed: 2, slow: 3, score: 2, shield: 2 },
    pillSpawnMultiplier: 1.0,
    duration: 15000
  },
  [TimeOfDay.NIGHT]: {
    name: '夜晚',
    icon: '🌙',
    bgColor: 0x0a0a1a,
    lightOpacity: 0.3,
    guardSpeedMultiplier: 1.3,
    guardSpawnMultiplier: 1.5,
    guardDetectionRange: 200,
    pillWeights: { speed: 2, slow: 3, score: 1, shield: 3 },
    pillSpawnMultiplier: 0.8,
    duration: 25000
  },
  [TimeOfDay.MIDNIGHT]: {
    name: '深夜',
    icon: '🌑',
    bgColor: 0x050510,
    lightOpacity: 0.15,
    guardSpeedMultiplier: 1.5,
    guardSpawnMultiplier: 2.0,
    guardDetectionRange: 250,
    pillWeights: { speed: 1, slow: 2, score: 1, shield: 4 },
    pillSpawnMultiplier: 0.6,
    duration: 20000
  }
};

export const FloorEventConfigs: Record<FloorEventType, { name: string; description: string; duration: number }> = {
  [FloorEventType.GUARD_SURGE]: {
    name: '保安来袭',
    description: '大量保安涌入！',
    duration: 10000
  },
  [FloorEventType.PILL_RAIN]: {
    name: '药片雨',
    description: '药片掉落频率翻倍！',
    duration: 8000
  },
  [FloorEventType.LIGHTS_OUT]: {
    name: '熄灯',
    description: '灯光昏暗，视野受限',
    duration: 12000
  },
  [FloorEventType.SECURITY_ALERT]: {
    name: '安全警报',
    description: '保安速度和侦测范围提升！',
    duration: 15000
  },
  [FloorEventType.BONUS_FLOOR]: {
    name: '奖励楼层',
    description: '得分翻倍，稀有药片更多！',
    duration: 10000
  }
};

export const TimeOfDayOrder: TimeOfDay[] = [
  TimeOfDay.DAWN,
  TimeOfDay.DAY,
  TimeOfDay.DUSK,
  TimeOfDay.NIGHT,
  TimeOfDay.MIDNIGHT
];

