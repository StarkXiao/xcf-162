import { ReplayData, ReplayEvent, ReplayEventType, ShopItemType, TimeOfDay, FloorEvent, FloorEventType, CharacterType, ShopPurchaseStats } from '../types';
import { PillType } from '../config/GameConfig';

export class ReplayManager {
  private static instance: ReplayManager;
  private events: ReplayEvent[] = [];
  private gameStartTime: number = 0;
  private deathReason: string = '';
  private finalFloor: number = 0;
  private finalScore: number = 0;
  private gameMode: 'normal' | 'endless' | 'challenge' | 'dual' = 'normal';
  private maxCombo: number = 0;
  private maxNoDamageFloors: number = 0;
  private pillsCollected: number = 0;
  private shopItemsUsed: { shield: number; slowPulse: number; bounce: number; pillsSpent: number } = {
    shield: 0, slowPulse: 0, bounce: 0, pillsSpent: 0
  };
  private maxAddiction: number = 0;
  private hallucinations: number = 0;
  private lossOfControl: number = 0;

  private constructor() {}

  static getInstance(): ReplayManager {
    if (!ReplayManager.instance) {
      ReplayManager.instance = new ReplayManager();
    }
    return ReplayManager.instance;
  }

  startGame(mode: 'normal' | 'endless' | 'challenge' | 'dual' = 'normal'): void {
    this.events = [];
    this.gameStartTime = Date.now();
    this.deathReason = '';
    this.finalFloor = 0;
    this.finalScore = 0;
    this.gameMode = mode;
    this.maxCombo = 0;
    this.maxNoDamageFloors = 0;
    this.pillsCollected = 0;
    this.shopItemsUsed = { shield: 0, slowPulse: 0, bounce: 0, pillsSpent: 0 };
    this.maxAddiction = 0;
    this.hallucinations = 0;
    this.lossOfControl = 0;
  }

  private getRelativeTime(): number {
    return Date.now() - this.gameStartTime;
  }

  private addEvent(event: Omit<ReplayEvent, 'timestamp' | 'relativeTime'>): void {
    this.events.push({
      ...event,
      timestamp: Date.now(),
      relativeTime: this.getRelativeTime()
    });
  }

  setFinalStats(stats: {
    floor: number;
    score: number;
    deathReason: string;
    maxCombo?: number;
    maxNoDamageFloors?: number;
    pillsCollected?: number;
    shopItemsUsed?: ShopPurchaseStats;
    maxAddiction?: number;
    hallucinations?: number;
    lossOfControl?: number;
  }): void {
    this.finalFloor = stats.floor;
    this.finalScore = stats.score;
    this.deathReason = stats.deathReason;
    if (stats.maxCombo !== undefined) this.maxCombo = stats.maxCombo;
    if (stats.maxNoDamageFloors !== undefined) this.maxNoDamageFloors = stats.maxNoDamageFloors;
    if (stats.pillsCollected !== undefined) this.pillsCollected = stats.pillsCollected;
    if (stats.shopItemsUsed) {
      this.shopItemsUsed = {
        shield: stats.shopItemsUsed.shieldsPurchased,
        slowPulse: stats.shopItemsUsed.slowPulsesPurchased,
        bounce: stats.shopItemsUsed.emergencyBouncesPurchased,
        pillsSpent: stats.shopItemsUsed.totalPillsSpent
      };
    }
    if (stats.maxAddiction !== undefined) this.maxAddiction = stats.maxAddiction;
    if (stats.hallucinations !== undefined) this.hallucinations = stats.hallucinations;
    if (stats.lossOfControl !== undefined) this.lossOfControl = stats.lossOfControl;
  }

  recordFloorChange(oldFloor: number, newFloor: number): void {
    this.addEvent({
      type: ReplayEventType.FLOOR_CHANGE,
      description: `楼层上升 ${oldFloor}F → ${newFloor}F`,
      floorNumber: newFloor
    });
  }

  recordGuardCollision(floor: number): void {
    this.addEvent({
      type: ReplayEventType.COLLISION_GUARD,
      description: '与保安碰撞',
      floorNumber: floor
    });
  }

  recordFall(floor: number): void {
    this.addEvent({
      type: ReplayEventType.COLLISION_FALL,
      description: '掉出屏幕',
      floorNumber: floor
    });
  }

  recordPillCollect(pillType: PillType | string, floor: number, scoreGain: number): void {
    const labels: Record<string, string> = {
      'speed': '加速',
      'slow': '减速',
      'shield': '护盾',
      'score': '得分'
    };
    this.addEvent({
      type: ReplayEventType.COLLISION_PILL,
      description: `收集药片: ${labels[pillType] || pillType}`,
      scoreGain,
      floorNumber: floor,
      pillType: pillType as string
    });
    this.pillsCollected++;
  }

  recordPillUse(pillType: PillType | string, floor: number): void {
    const labels: Record<string, string> = {
      'speed': '使用加速药片',
      'slow': '使用减速药片',
      'shield': '使用护盾药片',
      'score': '使用得分药片'
    };
    this.addEvent({
      type: ReplayEventType.ITEM_PILL_USE,
      description: labels[pillType] || `使用${pillType}药片`,
      floorNumber: floor,
      pillType: pillType as string
    });
  }

  recordShopPurchase(itemType: ShopItemType | string, floor: number, cost: number): void {
    const labels: Record<string, string> = {
      [ShopItemType.SHIELD]: '🛡 购买护盾',
      [ShopItemType.SLOW_PULSE]: '❄ 购买减速脉冲',
      [ShopItemType.EMERGENCY_BOUNCE]: '⬆ 购买紧急弹跳'
    };
    this.addEvent({
      type: ReplayEventType.ITEM_SHOP_PURCHASE,
      description: `${labels[itemType] || itemType} 消耗${cost}药片`,
      floorNumber: floor,
      shopItemType: itemType as string
    });
    this.shopItemsUsed.pillsSpent += cost;
    if (itemType === ShopItemType.SHIELD) this.shopItemsUsed.shield++;
    if (itemType === ShopItemType.SLOW_PULSE) this.shopItemsUsed.slowPulse++;
    if (itemType === ShopItemType.EMERGENCY_BOUNCE) this.shopItemsUsed.bounce++;
  }

  recordSurvivalScore(floor: number, scoreGain: number): void {
    this.addEvent({
      type: ReplayEventType.SCORE_SURVIVAL,
      description: '存活得分',
      scoreGain,
      floorNumber: floor
    });
  }

  recordCombo(comboCount: number, floor: number, scoreGain: number): void {
    this.addEvent({
      type: ReplayEventType.SCORE_COMBO,
      description: `连击 x${comboCount}`,
      scoreGain,
      floorNumber: floor,
      comboCount
    });
    if (comboCount > this.maxCombo) this.maxCombo = comboCount;
  }

  recordNoDamageBonus(noDamageFloors: number, floor: number, scoreGain: number): void {
    this.addEvent({
      type: ReplayEventType.SCORE_NODAMAGE,
      description: `无伤连层 ${noDamageFloors} 层`,
      scoreGain,
      floorNumber: floor
    });
    if (noDamageFloors > this.maxNoDamageFloors) this.maxNoDamageFloors = noDamageFloors;
  }

  recordFloorEventStart(event: FloorEvent, floor: number): void {
    const eventLabels: Record<string, string> = {
      [FloorEventType.GUARD_SURGE]: '保安来袭',
      [FloorEventType.PILL_RAIN]: '药片雨',
      [FloorEventType.LIGHTS_OUT]: '熄灯',
      [FloorEventType.SECURITY_ALERT]: '安全警报',
      [FloorEventType.BONUS_FLOOR]: '奖励楼层'
    };
    this.addEvent({
      type: ReplayEventType.EVENT_FLOOR_START,
      description: `楼层事件开始: ${eventLabels[event.type] || event.name}`,
      floorNumber: floor,
      eventType: event.type
    });
  }

  recordFloorEventEnd(event: FloorEvent, floor: number): void {
    const eventLabels: Record<string, string> = {
      [FloorEventType.GUARD_SURGE]: '保安来袭',
      [FloorEventType.PILL_RAIN]: '药片雨',
      [FloorEventType.LIGHTS_OUT]: '熄灯',
      [FloorEventType.SECURITY_ALERT]: '安全警报',
      [FloorEventType.BONUS_FLOOR]: '奖励楼层'
    };
    this.addEvent({
      type: ReplayEventType.EVENT_FLOOR_END,
      description: `楼层事件结束: ${eventLabels[event.type] || event.name}`,
      floorNumber: floor,
      eventType: event.type
    });
  }

  recordTimeOfDayChange(timeOfDay: TimeOfDay, floor: number): void {
    const timeLabels: Record<string, string> = {
      [TimeOfDay.DAWN]: '🌅 黎明',
      [TimeOfDay.DAY]: '☀️ 白天',
      [TimeOfDay.DUSK]: '🌇 黄昏',
      [TimeOfDay.NIGHT]: '🌙 夜晚',
      [TimeOfDay.MIDNIGHT]: '🌑 深夜'
    };
    this.addEvent({
      type: ReplayEventType.TIME_OF_DAY_CHANGE,
      description: `时间变化: ${timeLabels[timeOfDay] || timeOfDay}`,
      floorNumber: floor,
      timeOfDay
    });
  }

  recordCharacterSwitch(fromType: CharacterType, toType: CharacterType, floor: number): void {
    const charLabels: Record<string, string> = {
      [CharacterType.SWIFT]: '⚡疾风',
      [CharacterType.TANK]: '🛡重甲'
    };
    this.addEvent({
      type: ReplayEventType.CHARACTER_SWITCH,
      description: `角色切换: ${charLabels[fromType] || fromType} → ${charLabels[toType] || toType}`,
      floorNumber: floor,
      characterType: toType
    });
  }

  recordTrapCollision(floor: number): void {
    this.addEvent({
      type: ReplayEventType.COLLISION_TRAP,
      description: '触发平台陷阱',
      floorNumber: floor
    });
  }

  recordAddictionLevel(addiction: number, _floor: number): void {
    if (addiction > this.maxAddiction) this.maxAddiction = addiction;
  }

  recordHallucinationTrigger(_floor: number): void {
    this.hallucinations++;
  }

  recordLossOfControlTrigger(_floor: number): void {
    this.lossOfControl++;
  }

  recordPlayerDeath(reason: string, floor: number): void {
    this.addEvent({
      type: ReplayEventType.PLAYER_DEATH,
      description: `死亡: ${reason}`,
      floorNumber: floor
    });
    this.deathReason = reason;
  }

  getReplayData(): ReplayData {
    return {
      events: [...this.events],
      finalFloor: this.finalFloor,
      finalScore: this.finalScore,
      deathReason: this.deathReason,
      gameDuration: this.getRelativeTime(),
      date: new Date().toISOString(),
      gameMode: this.gameMode,
      maxCombo: this.maxCombo,
      maxNoDamageFloors: this.maxNoDamageFloors,
      pillsCollected: this.pillsCollected,
      shopItemsUsed: { ...this.shopItemsUsed },
      maxAddiction: this.maxAddiction,
      hallucinations: this.hallucinations,
      lossOfControl: this.lossOfControl
    };
  }

  getRecentEvents(windowMs: number = 10000): ReplayEvent[] {
    const cutoff = this.getRelativeTime() - windowMs;
    return this.events.filter(e => e.relativeTime >= cutoff);
  }

  getEventCount(): number {
    return this.events.length;
  }
}
