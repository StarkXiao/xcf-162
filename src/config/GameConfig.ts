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
