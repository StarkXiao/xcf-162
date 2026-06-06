export interface GameData {
  score: number;
  highScore: number;
  floor: number;
  pills: number;
  hasShield: boolean;
  speedMultiplier: number;
  guardSlowMultiplier: number;
  timeOfDay: TimeOfDay;
  currentEvent: FloorEventType | null;
}

export interface SaveData {
  highScore: number;
  totalPills: number;
  gamesPlayed: number;
  lastTimeOfDay: TimeOfDay;
  totalDayCycles: number;
  eventsTriggered: number;
}

export interface Platform {
  x: number;
  y: number;
  width: number;
}

export enum TimeOfDay {
  DAWN = 'dawn',
  DAY = 'day',
  DUSK = 'dusk',
  NIGHT = 'night',
  MIDNIGHT = 'midnight'
}

export enum FloorEventType {
  GUARD_SURGE = 'guard_surge',
  PILL_RAIN = 'pill_rain',
  LIGHTS_OUT = 'lights_out',
  SECURITY_ALERT = 'security_alert',
  BONUS_FLOOR = 'bonus_floor'
}

export interface TimeOfDayConfig {
  name: string;
  icon: string;
  bgColor: number;
  lightOpacity: number;
  guardSpeedMultiplier: number;
  guardSpawnMultiplier: number;
  guardDetectionRange: number;
  pillWeights: Record<string, number>;
  pillSpawnMultiplier: number;
  duration: number;
}

export interface FloorEvent {
  type: FloorEventType;
  name: string;
  description: string;
  duration: number;
  startTime: number;
}

