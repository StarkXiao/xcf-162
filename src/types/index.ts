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

export enum PlatformTrapType {
  COLLAPSIBLE = 'collapsible',
  MOVING = 'moving',
  TEMPORARY = 'temporary'
}

export interface PlatformTrapConfig {
  type: PlatformTrapType;
  collapseDelayMs?: number;
  respawnDelayMs?: number;
  moveRangeX?: number;
  moveRangeY?: number;
  moveSpeed?: number;
  onDurationMs?: number;
  offDurationMs?: number;
  startPhase?: number;
}

export interface PlatformTrapState {
  type: PlatformTrapType;
  isActive: boolean;
  isCollapsing: boolean;
  collapseTimer: number;
  originalX: number;
  originalY: number;
  movePhase: number;
  moveDirection: number;
  togglePhase: number;
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

export enum WinConditionType {
  FLOOR_REACHED = 'floor_reached',
  SCORE_REACHED = 'score_reached',
  PILLS_COLLECTED = 'pills_collected',
  SURVIVAL_TIME = 'survival_time',
  GUARDS_AVOIDED = 'guards_avoided'
}

export interface ChallengeWinCondition {
  type: WinConditionType;
  value: number;
}

export interface ChallengeConfig {
  id: string;
  name: string;
  createdAt: number;
  floorDensity: number;
  platformCountMin: number;
  platformCountMax: number;
  guardCount: number;
  guardSpeedMultiplier: number;
  guardDetectionRange: number;
  guardSpawnInterval: number;
  pillWeights: Record<string, number>;
  pillSpawnInterval: number;
  maxPills: number;
  winCondition: ChallengeWinCondition;
  loseOnGuardCollision: boolean;
  loseOnFall: boolean;
  timeLimitMs: number;
  enableDayNightCycle: boolean;
  enableFloorEvents: boolean;
  enableSideEffects: boolean;
  description: string;
}

export interface ChallengePresetList {
  presets: ChallengeConfig[];
}

export enum AchievementRarity {
  COMMON = 'common',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary'
}

export type AchievementConditionType =
  | 'singleGameScore'
  | 'singleGameFloor'
  | 'singleGamePills'
  | 'singleGameCombo'
  | 'singleGameNoDamageFloors'
  | 'singleGameMaxAddiction'
  | 'singleGameHallucinations'
  | 'singleGameLossOfControl'
  | 'totalGamesPlayed'
  | 'totalPills'
  | 'totalHighScore'
  | 'totalCombos'
  | 'totalDayCycles'
  | 'totalEventsTriggered'
  | 'totalHallucinations'
  | 'totalLossOfControl'
  | 'endlessBestScore'
  | 'endlessBestFloor'
  | 'endlessGamesPlayed'
  | 'trainingTotalScore'
  | 'collectAllPillsInGame'
  | 'noGuardHitGame'
  | 'perfectJumpCombo';

export interface AchievementCondition {
  type: AchievementConditionType;
  value: number;
}

export interface Achievement {
  id: string;
  name: string;
  title: string;
  icon: string;
  rarity: AchievementRarity;
  description: string;
  condition: AchievementCondition;
  unlockHint: string;
}

export enum ShopItemType {
  SHIELD = 'shield',
  SLOW_PULSE = 'slow_pulse',
  EMERGENCY_BOUNCE = 'emergency_bounce'
}

export interface ShopItemConfig {
  type: ShopItemType;
  name: string;
  description: string;
  icon: string;
  cost: number;
  color: number;
  duration?: number;
}

export interface ShopPurchaseStats {
  shieldsPurchased: number;
  slowPulsesPurchased: number;
  emergencyBouncesPurchased: number;
  totalPillsSpent: number;
}

export interface InGameStats {
  score: number;
  floor: number;
  pills: number;
  maxCombo: number;
  maxNoDamageFloors: number;
  maxAddiction: number;
  hallucinations: number;
  lossOfControl: number;
  doubleJumps: number;
  guardHits: number;
  perfectJumps: number;
  shopPurchases: ShopPurchaseStats;
}

export interface AchievementData {
  unlockedAchievements: string[];
  newlyUnlocked: string[];
  inGameStats: InGameStats;
  stats: {
    totalDoubleJumps: number;
    totalPerfectJumps: number;
    totalNoGuardHitGames: number;
    totalCollectAllPillsGames: number;
  };
}

export enum CharacterType {
  SWIFT = 'swift',
  TANK = 'tank'
}

export interface CharacterConfig {
  type: CharacterType;
  name: string;
  icon: string;
  color: number;
  accentColor: number;
  description: string;
  jumpForce: number;
  maxJumps: number;
  speedMultiplier: number;
  pillEffects: Record<string, number>;
  addictionMultiplier: number;
  gravityScale: number;
}

export interface DualCharacterState {
  activeCharacter: CharacterType;
  swift: {
    pills: number;
    activeEffects: string[];
  };
  tank: {
    pills: number;
    activeEffects: string[];
  };
  switchCooldownMs: number;
  lastSwitchTime: number;
  totalSwitches: number;
}

export enum SeasonTaskType {
  SCORE = 'score',
  FLOOR = 'floor',
  PILLS = 'pills',
  COMBO = 'combo',
  NODAMAGE = 'nodamage',
  GAMES_PLAYED = 'games_played',
  ADDICTION = 'addiction',
  HALLUCINATIONS = 'hallucinations',
  ENDLESS_SCORE = 'endless_score',
  ENDLESS_FLOOR = 'endless_floor',
  TRAINING_SCORE = 'training_score',
  GUARD_HITS = 'guard_hits',
  DAY_CYCLES = 'day_cycles',
  EVENTS = 'events'
}

export enum SeasonRewardType {
  SEASON_POINTS = 'season_points',
  PILLS_BONUS = 'pills_bonus',
  TITLE = 'title',
  BADGE = 'badge'
}

export interface SeasonReward {
  type: SeasonRewardType;
  value: number | string;
  label: string;
  icon: string;
}

export interface SeasonTask {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: SeasonTaskType;
  targetValue: number;
  rewards: SeasonReward[];
  isWeekly: boolean;
  isCumulative: boolean;
}

export interface SeasonTaskProgress {
  taskId: string;
  currentValue: number;
  targetValue: number;
  isCompleted: boolean;
  isClaimed: boolean;
  updatedAt: number;
}

export interface SeasonInfo {
  id: string;
  name: string;
  description: string;
  startDate: number;
  endDate: number;
  icon: string;
}

export interface SeasonData {
  currentSeason: SeasonInfo;
  weeklyResetTimestamp: number;
  totalSeasonPoints: number;
  cumulativeTaskProgress: SeasonTaskProgress[];
  weeklyTaskProgress: SeasonTaskProgress[];
  claimedRewards: string[];
  newlyCompletedTasks: string[];
  newlyClaimableTasks: string[];
  seasonLevel: number;
  seasonExp: number;
  lifetimeStats: {
    totalSeasonsCompleted: number;
    totalSeasonPointsEarned: number;
    totalTasksCompleted: number;
    weeklyBestCompletionRate: number;
  };
}

export enum ClubUpgradeType {
  DECORATION = 'decoration',
  LIGHTING = 'lighting',
  SOUND = 'sound'
}

export interface ClubUpgradeLevel {
  level: number;
  cost: number;
  bonus: number;
  description: string;
}

export interface ClubUpgrade {
  type: ClubUpgradeType;
  name: string;
  icon: string;
  description: string;
  color: string;
  currentLevel: number;
  maxLevel: number;
  levels: ClubUpgradeLevel[];
}

export interface ClubBuff {
  scoreMultiplier: number;
  pillSpawnMultiplier: number;
  baseTimeBonus: number;
  comboTimeoutBonus: number;
  guardSpeedReduction: number;
}

export interface ClubData {
  clubCoins: number;
  totalClubCoinsEarned: number;
  upgrades: Record<ClubUpgradeType, number>;
}

export interface AudioSettings {
  musicVolume: number;
  sfxVolume: number;
  musicMuted: boolean;
  sfxMuted: boolean;
  adaptiveMixing: boolean;
}

export enum ReplayEventType {
  FLOOR_CHANGE = 'floor_change',
  COLLISION_GUARD = 'collision_guard',
  COLLISION_PILL = 'collision_pill',
  COLLISION_FALL = 'collision_fall',
  COLLISION_TRAP = 'collision_trap',
  SCORE_SURVIVAL = 'score_survival',
  SCORE_FLOOR = 'score_floor',
  SCORE_COMBO = 'score_combo',
  SCORE_PILL = 'score_pill',
  SCORE_NODAMAGE = 'score_nodamage'
}

export interface ReplayEvent {
  timestamp: number;
  type: ReplayEventType;
  description: string;
  details?: string;
  scoreGain?: number;
  floorNumber?: number;
}

export interface ReplayData {
  events: ReplayEvent[];
  finalFloor: number;
  finalScore: number;
  deathReason: string;
  gameDuration: number;
  date: string;
}

export interface SaveData {
  highScore: number;
  totalPills: number;
  gamesPlayed: number;
  riskRewardBestScore: number;
  riskRewardMode: boolean;
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
  totalShieldsPurchased: number;
  totalSlowPulsesPurchased: number;
  totalEmergencyBouncesPurchased: number;
  totalPillsSpentInShop: number;
  archive: ArchiveData;
  achievements: AchievementData;
  season: SeasonData;
  club: ClubData;
  audio: AudioSettings;
  replayHistory: ReplayData[];
}

