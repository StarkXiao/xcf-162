import { TimeOfDay, TimeOfDayConfig, FloorEventType, PlatformTrapType, PlatformTrapConfig, ShopItemType, ShopItemConfig } from '../types';

export enum GuardChaseState {
  PATROL = 'patrol',
  SURROUND = 'surround',
  JUMP_CHASE = 'jump_chase'
}

export const GuardChaseStateConfig: Record<GuardChaseState, {
  name: string;
  description: string;
  speedMultiplier: number;
  detectionRangeMultiplier: number;
  spawnMultiplier: number;
  surroundEnabled: boolean;
  jumpChaseEnabled: boolean;
  alertColor: string;
  alertIcon: string;
}> = {
  [GuardChaseState.PATROL]: {
    name: '巡逻模式',
    description: '保安正在巡逻',
    speedMultiplier: 1.0,
    detectionRangeMultiplier: 1.0,
    spawnMultiplier: 1.0,
    surroundEnabled: false,
    jumpChaseEnabled: false,
    alertColor: '#00ff88',
    alertIcon: '👮'
  },
  [GuardChaseState.SURROUND]: {
    name: '围堵模式',
    description: '保安正在围堵！',
    speedMultiplier: 1.25,
    detectionRangeMultiplier: 1.4,
    spawnMultiplier: 1.5,
    surroundEnabled: true,
    jumpChaseEnabled: false,
    alertColor: '#ffaa00',
    alertIcon: '⚠️'
  },
  [GuardChaseState.JUMP_CHASE]: {
    name: '跳跃追击',
    description: '保安跳跃追击！极度危险！',
    speedMultiplier: 1.6,
    detectionRangeMultiplier: 1.8,
    spawnMultiplier: 2.0,
    surroundEnabled: true,
    jumpChaseEnabled: true,
    alertColor: '#ff0066',
    alertIcon: '🚨'
  }
};

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
  static readonly trapStartFloor: number = 2;
  static readonly trapChancePerPlatform: number = 0.35;

  static readonly comboBaseScore: number = 50;
  static readonly comboMultiplierPerCombo: number = 25;
  static readonly comboTimeoutMs: number = 2000;

  static readonly noDamageFloorBaseBonus: number = 200;
  static readonly noDamageFloorBonusPerFloor: number = 100;

  static readonly endlessBaseTime: number = 90000;
  static readonly endlessTimeBonusPerFloor: number = 3000;
  static readonly endlessMaxFloors: number = 999;
  static readonly endlessBaseScoreRate: number = 15;
  static readonly endlessLeaderboardMaxEntries: number = 10;

  static readonly guardChaseUnlockTime: { state: GuardChaseState; timeMs: number }[] = [
    { state: GuardChaseState.PATROL, timeMs: 0 },
    { state: GuardChaseState.SURROUND, timeMs: 20000 },
    { state: GuardChaseState.JUMP_CHASE, timeMs: 45000 }
  ];

  static readonly endlessFloorMultipliers: { floor: number; multiplier: number }[] = [
    { floor: 1, multiplier: 1.0 },
    { floor: 5, multiplier: 1.2 },
    { floor: 10, multiplier: 1.5 },
    { floor: 20, multiplier: 2.0 },
    { floor: 30, multiplier: 2.5 },
    { floor: 50, multiplier: 3.5 },
    { floor: 75, multiplier: 5.0 },
    { floor: 100, multiplier: 7.5 },
    { floor: 150, multiplier: 10.0 }
  ];

  static readonly endlessDifficultyRamp: { floor: number; guardSpawnMul: number; guardSpeedMul: number; pillSpawnMul: number }[] = [
    { floor: 1, guardSpawnMul: 0.8, guardSpeedMul: 0.8, pillSpawnMul: 1.2 },
    { floor: 10, guardSpawnMul: 1.0, guardSpeedMul: 1.0, pillSpawnMul: 1.1 },
    { floor: 25, guardSpawnMul: 1.3, guardSpeedMul: 1.2, pillSpawnMul: 1.0 },
    { floor: 50, guardSpawnMul: 1.6, guardSpeedMul: 1.4, pillSpawnMul: 0.9 },
    { floor: 75, guardSpawnMul: 2.0, guardSpeedMul: 1.6, pillSpawnMul: 0.8 },
    { floor: 100, guardSpawnMul: 2.5, guardSpeedMul: 1.8, pillSpawnMul: 0.7 }
  ];

  static readonly shopEmergencyBounceForce: number = -700;
}

export const ShopItemConfigs: Record<ShopItemType, ShopItemConfig> = {
  [ShopItemType.SHIELD]: {
    type: ShopItemType.SHIELD,
    name: '护盾',
    description: '可抵挡一次保安攻击',
    icon: '🛡',
    cost: 3,
    color: 0xff00ff,
    duration: 10000
  },
  [ShopItemType.SLOW_PULSE]: {
    type: ShopItemType.SLOW_PULSE,
    name: '减速脉冲',
    description: '所有保安减速5秒',
    icon: '❄',
    cost: 2,
    color: 0x0088ff,
    duration: 5000
  },
  [ShopItemType.EMERGENCY_BOUNCE]: {
    type: ShopItemType.EMERGENCY_BOUNCE,
    name: '紧急弹跳',
    description: '立即向上大幅弹跳',
    icon: '⬆',
    cost: 2,
    color: 0x00ff88
  }
};

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

export class PillSideEffectConfig {
  static readonly MAX_ADDICTION: number = 100;
  static readonly ADDICTION_PER_PILL: Record<PillType, number> = {
    [PillType.SPEED]: 12,
    [PillType.SLOW]: 8,
    [PillType.SCORE]: 10,
    [PillType.SHIELD]: 15
  };
  static readonly ADDICTION_DECAY_RATE_PER_SECOND: number = 1.5;
  static readonly ADDICTION_DECAY_INTERVAL_MS: number = 500;

  static readonly HALLUCINATION_THRESHOLD: number = 40;
  static readonly HALLUCINATION_CHANCE_PER_PILL: number = 0.15;
  static readonly HALLUCINATION_BASE_DURATION_MS: number = 3000;
  static readonly HALLUCINATION_MAX_DURATION_MS: number = 8000;
  static readonly HALLUCINATION_INPUT_INVERT_CHANCE: number = 0.3;
  static readonly HALLUCINATION_CAMERA_SHAKE_INTENSITY: number = 0.008;
  static readonly HALLUCINATION_VISUAL_FLASH_INTERVAL: number = 400;

  static readonly LOSS_OF_CONTROL_THRESHOLD: number = 75;
  static readonly LOSS_OF_CONTROL_CHANCE_PER_PILL: number = 0.1;
  static readonly LOSS_OF_CONTROL_BASE_DURATION_MS: number = 2000;
  static readonly LOSS_OF_CONTROL_MAX_DURATION_MS: number = 5000;
  static readonly LOSS_OF_CONTROL_FORCE_MOVE_CHANCE: number = 0.6;
  static readonly LOSS_OF_CONTROL_JUMP_CHANCE: number = 0.3;

  static readonly WARNING_THRESHOLD_LOW: number = 25;
  static readonly WARNING_THRESHOLD_MEDIUM: number = 50;
  static readonly WARNING_THRESHOLD_HIGH: number = 75;
  static readonly WARNING_THRESHOLD_CRITICAL: number = 90;
}

export const TimeOfDayConfigs: Record<TimeOfDay, TimeOfDayConfig> = {
  [TimeOfDay.DAWN]: {
    name: '黎明',
    icon: '🌅',
    description: '保安较弱，得分药片较多',
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
    description: '难度适中，大量药片补给',
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
    description: '保安渐强，护盾药片增多',
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
    description: '保安凶猛，护盾药片居多',
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
    description: '极度危险！稀有护盾必备',
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
    description: '保安数量×3，速度略增！',
    duration: 10000
  },
  [FloorEventType.PILL_RAIN]: {
    name: '药片雨',
    description: '药片掉落速度×2.5！',
    duration: 8000
  },
  [FloorEventType.LIGHTS_OUT]: {
    name: '熄灯',
    description: '灯光昏暗，视野受限',
    duration: 12000
  },
  [FloorEventType.SECURITY_ALERT]: {
    name: '安全警报',
    description: '保安速度×1.5，侦测×1.6，数量×1.5！',
    duration: 15000
  },
  [FloorEventType.BONUS_FLOOR]: {
    name: '奖励楼层',
    description: '得分×2，稀有药片×2，药片更多！',
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

export const PlatformTrapConfigs: Record<PlatformTrapType, PlatformTrapConfig> = {
  [PlatformTrapType.COLLAPSIBLE]: {
    type: PlatformTrapType.COLLAPSIBLE,
    collapseDelayMs: 800,
    respawnDelayMs: 4000
  },
  [PlatformTrapType.MOVING]: {
    type: PlatformTrapType.MOVING,
    moveRangeX: 60,
    moveRangeY: 0,
    moveSpeed: 0.003
  },
  [PlatformTrapType.TEMPORARY]: {
    type: PlatformTrapType.TEMPORARY,
    onDurationMs: 2500,
    offDurationMs: 2000,
    startPhase: 0
  }
};

