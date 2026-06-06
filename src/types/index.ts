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

export interface PillSideEffectState {
  addictionLevel: number;
  isHallucinating: boolean;
  hallucinationEndTime: number;
  isOutOfControl: boolean;
  lossOfControlEndTime: number;
  controlOverrideDirection: number;
  pillsConsumedInGame: number;
  hallucinationsTriggeredInGame: number;
  lossOfControlTriggeredInGame: number;
  maxAddictionInGame: number;
}

export interface EndlessLeaderboardEntry {
  score: number;
  floor: number;
  pills: number;
  maxCombo: number;
  multiplier: number;
  timeRemaining: number;
  date: string;
  rank: number;
  maxAddiction: number;
  hallucinations: number;
  lossOfControl: number;
}

export interface TrainingScores {
  jumpTraining: JumpTrainingScore;
  pillTraining: PillTrainingScore;
  guardTraining: GuardTrainingScore;
}

export interface JumpTrainingScore {
  bestCombo: number;
  totalJumps: number;
  perfectJumps: number;
  highestFloor: number;
  gamesPlayed: number;
}

export interface PillTrainingScore {
  pillsCollected: number;
  pillsPerType: Record<string, number>;
  bestStreak: number;
  totalScore: number;
  gamesPlayed: number;
  totalAddictionAccumulated: number;
  maxAddictionReached: number;
  totalHallucinations: number;
  totalLossOfControl: number;
}

export interface GuardTrainingScore {
  guardsAvoided: number;
  longestSurvival: number;
  guardsTricked: number;
  totalScore: number;
  gamesPlayed: number;
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
  description: string;
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

export enum ArchiveCategory {
  CHARACTER = 'character',
  RUMOR = 'rumor',
  HIDDEN_FLOOR = 'hidden_floor'
}

export interface ArchiveUnlockCondition {
  type: 'gamesPlayed' | 'highScore' | 'totalPills' | 'floorReached' | 'endlessFloor' | 'endlessScore' | 'eventsTriggered' | 'maxCombo' | 'hallucinations' | 'addiction' | 'trainingScore' | 'dayCycles';
  value: number;
}

export interface CharacterProfile {
  id: string;
  name: string;
  title: string;
  icon: string;
  rarity: 'common' | 'rare' | 'legendary';
  description: string;
  backstory: string;
  unlockCondition: ArchiveUnlockCondition;
  unlockedHint: string;
}

export interface NightclubRumor {
  id: string;
  title: string;
  source: string;
  content: string;
  unlockCondition: ArchiveUnlockCondition;
  unlockedHint: string;
}

export interface HiddenFloorRecord {
  id: string;
  floorNumber: number;
  floorName: string;
  icon: string;
  phenomenon: string;
  notes: string;
  unlockCondition: ArchiveUnlockCondition;
  unlockedHint: string;
}

export interface ArchiveData {
  unlockedCharacters: string[];
  unlockedRumors: string[];
  unlockedHiddenFloors: string[];
  newlyUnlocked: string[];
}

export interface SaveData {
  highScore: number;
  totalPills: number;
  gamesPlayed: number;
  lastTimeOfDay: TimeOfDay;
  totalDayCycles: number;
  eventsTriggered: number;
  maxCombo: number;
  maxNoDamageFloors: number;
  totalCombos: number;
  trainingScores: TrainingScores;
  endlessLeaderboard: EndlessLeaderboardEntry[];
  endlessBestScore: number;
  endlessBestFloor: number;
  endlessGamesPlayed: number;
  totalAddictionLevel: number;
  maxAddictionReached: number;
  totalHallucinationsTriggered: number;
  totalLossOfControlTriggered: number;
  archive: ArchiveData;
}

