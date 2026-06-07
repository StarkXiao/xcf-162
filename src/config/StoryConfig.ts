import { TimeOfDay } from '../types';
import { GuardChaseState } from './GameConfig';

export interface CutsceneLine {
  speaker: string;
  text: string;
  color?: string;
  delay?: number;
}

export interface CutsceneData {
  id: string;
  lines: CutsceneLine[];
  background?: number;
}

export interface BossConfig {
  id: string;
  name: string;
  description: string;
  hp: number;
  speedMultiplier: number;
  detectionRange: number;
  chaseState: GuardChaseState;
  spawnInterval: number;
  color: number;
  icon: string;
  specialAbility?: string;
}

export interface ChapterConfig {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  targetFloor: number;
  startingTimeOfDay: TimeOfDay;
  enableDayNightCycle: boolean;
  enableFloorEvents: boolean;
  enableSideEffects: boolean;
  guardDifficulty: {
    spawnMultiplier: number;
    speedMultiplier: number;
    detectionMultiplier: number;
    unlockChaseStates: GuardChaseState[];
  };
  pillDifficulty: {
    spawnMultiplier: number;
    weights: Record<string, number>;
  };
  bossConfig?: BossConfig;
  bossFloor?: number;
  introCutsceneId?: string;
  outroCutsceneId?: string;
  preBossCutsceneId?: string;
  platformDensity: number;
  trapStartFloor: number;
  trapChance: number;
}

export interface StorySaveData {
  currentChapter: number;
  highestUnlockedChapter: number;
  completedChapters: number[];
  chapterScores: Record<number, number>;
  chapterBestFloors: Record<number, number>;
  totalStoryScore: number;
  totalDeaths: number;
  totalPlayTime: number;
  lastPlayedAt: number;
}

export const Cutscenes: Record<string, CutsceneData> = {
  intro_ch1: {
    id: 'intro_ch1',
    lines: [
      { speaker: '???', text: '你醒了...', color: '#ff6666', delay: 1500 },
      { speaker: '???', text: '头痛欲裂，霓虹灯光刺痛双眼', color: '#ff9966', delay: 2000 },
      { speaker: '旁白', text: '这是「失控夜店」的地下一层。', color: '#66ccff', delay: 2000 },
      { speaker: '旁白', text: '刺耳的警报声响起——保安已经发现了你。', color: '#66ccff', delay: 2500 },
      { speaker: '你', text: '必须...向上逃...', color: '#ffff66', delay: 2000 }
    ],
    background: 0x0a0a1a
  },
  outro_ch1: {
    id: 'outro_ch1',
    lines: [
      { speaker: '旁白', text: '你成功到达了第10层！', color: '#66ff66', delay: 1500 },
      { speaker: '旁白', text: '暂时甩掉了那些普通保安...', color: '#66ccff', delay: 2000 },
      { speaker: '你', text: '喘口气...等等，那是什么脚步声？', color: '#ffff66', delay: 2500 }
    ],
    background: 0x1a1a3a
  },
  pre_boss_ch1: {
    id: 'pre_boss_ch1',
    lines: [
      { speaker: '???', text: '「逃犯，你跑不掉的。」', color: '#ff0000', delay: 2000 },
      { speaker: '旁白', text: '一个身形巨大的保安堵住了去路——', color: '#66ccff', delay: 2500 },
      { speaker: '旁白', text: '这是夜班队长「铁拳」。', color: '#ff9900', delay: 2000 },
      { speaker: '铁拳', text: '今晚的业绩就靠你了！', color: '#ff4444', delay: 2000 }
    ],
    background: 0x2a0a0a
  },
  intro_ch2: {
    id: 'intro_ch2',
    lines: [
      { speaker: '旁白', text: '击败铁拳后，你继续向上攀登。', color: '#66ccff', delay: 1500 },
      { speaker: '旁白', text: '这里是夜店的中层区，灯光更加迷离。', color: '#ff99ff', delay: 2000 },
      { speaker: '你', text: '药片...这里到处都是药片...', color: '#ffff66', delay: 2000 },
      { speaker: '???', text: '「嘻嘻~来玩呀~」', color: '#ff66cc', delay: 2500 }
    ],
    background: 0x2a1a3a
  },
  outro_ch2: {
    id: 'outro_ch2',
    lines: [
      { speaker: '旁白', text: '第20层到了！', color: '#66ff66', delay: 1500 },
      { speaker: '旁白', text: '空气中弥漫着诡异的甜香...', color: '#ff99ff', delay: 2000 },
      { speaker: '你', text: '头晕...我必须...保持清醒...', color: '#ffff66', delay: 2500 }
    ],
    background: 0x3a1a4a
  },
  pre_boss_ch2: {
    id: 'pre_boss_ch2',
    lines: [
      { speaker: '???', text: '「小可爱，你要去哪呀~」', color: '#ff66cc', delay: 2000 },
      { speaker: '旁白', text: '穿着荧光外套的女保安挡在前方——', color: '#66ccff', delay: 2500 },
      { speaker: '旁白', text: '迷幻药剂师「魅影」。她的药让人飘飘欲仙...然后永远倒下。', color: '#ff99ff', delay: 3000 },
      { speaker: '魅影', text: '来，吃颗糖~姐姐给你个痛快~', color: '#ff66cc', delay: 2500 }
    ],
    background: 0x3a0a2a
  },
  intro_ch3: {
    id: 'intro_ch3',
    lines: [
      { speaker: '旁白', text: '你咬牙冲破魅影的迷魂阵。', color: '#66ccff', delay: 1500 },
      { speaker: '旁白', text: '顶层就在眼前，灯光却突然熄灭。', color: '#ff9900', delay: 2000 },
      { speaker: '你', text: '断电了？不...这是...', color: '#ffff66', delay: 2000 },
      { speaker: '系统广播', text: '「安全警报启动。所有保安前往顶层围堵。」', color: '#ff0000', delay: 3000 }
    ],
    background: 0x050510
  },
  outro_ch3: {
    id: 'outro_ch3',
    lines: [
      { speaker: '旁白', text: '第30层——夜店顶层VIP区。', color: '#66ff66', delay: 1500 },
      { speaker: '旁白', text: '出口的标志在闪烁，但门已被锁死。', color: '#ff9900', delay: 2000 },
      { speaker: '你', text: '打不开...等等，那边有电梯机房的门！', color: '#ffff66', delay: 2500 }
    ],
    background: 0x1a0a0a
  },
  pre_boss_ch3: {
    id: 'pre_boss_ch3',
    lines: [
      { speaker: '???', text: '「不错不错，能来到这里。」', color: '#ffff00', delay: 2000 },
      { speaker: '旁白', text: '一个穿着定制西装的男人缓缓鼓掌——', color: '#66ccff', delay: 2500 },
      { speaker: '旁白', text: '夜店老板「金牙」，传说他亲自看守最后的逃生通道。', color: '#ffcc00', delay: 3000 },
      { speaker: '金牙', text: '但游戏该结束了。保安部，全体集合！', color: '#ffff00', delay: 2500 }
    ],
    background: 0x2a2a0a
  },
  story_ending: {
    id: 'story_ending',
    lines: [
      { speaker: '旁白', text: '你拼尽全力打倒了金牙！', color: '#66ff66', delay: 1500 },
      { speaker: '旁白', text: '机房门开了，新鲜空气扑面而来——', color: '#66ccff', delay: 2000 },
      { speaker: '旁白', text: '黎明的阳光穿过缝隙，照亮了你的逃生之路。', color: '#ffff99', delay: 3000 },
      { speaker: '你', text: '我...逃出来了...', color: '#ffff66', delay: 2500 },
      { speaker: '旁白', text: '【危机逃生 · 通关】', color: '#ffff00', delay: 3000 },
      { speaker: '旁白', text: '但这座城市还有无数个「失控夜店」...', color: '#66ccff', delay: 3000 },
      { speaker: '旁白', text: '你的故事，才刚刚开始。', color: '#ffffff', delay: 3500 }
    ],
    background: 0x1a3a1a
  }
};

export const Chapters: ChapterConfig[] = [
  {
    id: 1,
    title: '第一章',
    subtitle: '地下苏醒',
    description: '从地下一层开始逃生，熟悉基本操作。小心普通保安！',
    icon: '🌅',
    targetFloor: 10,
    startingTimeOfDay: TimeOfDay.DAWN,
    enableDayNightCycle: false,
    enableFloorEvents: false,
    enableSideEffects: false,
    guardDifficulty: {
      spawnMultiplier: 0.7,
      speedMultiplier: 0.7,
      detectionMultiplier: 0.8,
      unlockChaseStates: [GuardChaseState.PATROL]
    },
    pillDifficulty: {
      spawnMultiplier: 1.2,
      weights: { speed: 3, slow: 2, score: 3, shield: 2 }
    },
    bossConfig: {
      id: 'boss_iron_fist',
      name: '铁拳',
      description: '夜班保安队长，力量型追击者',
      hp: 3,
      speedMultiplier: 1.2,
      detectionRange: 200,
      chaseState: GuardChaseState.SURROUND,
      spawnInterval: 15000,
      color: 0xff4444,
      icon: '👊',
      specialAbility: '冲撞：速度短时间内翻倍'
    },
    bossFloor: 10,
    introCutsceneId: 'intro_ch1',
    outroCutsceneId: 'outro_ch1',
    preBossCutsceneId: 'pre_boss_ch1',
    platformDensity: 1.0,
    trapStartFloor: 5,
    trapChance: 0.2
  },
  {
    id: 2,
    title: '第二章',
    subtitle: '迷幻中层',
    description: '药片增多但副作用显现。小心迷幻药剂师魅影！',
    icon: '🌙',
    targetFloor: 20,
    startingTimeOfDay: TimeOfDay.NIGHT,
    enableDayNightCycle: true,
    enableFloorEvents: true,
    enableSideEffects: true,
    guardDifficulty: {
      spawnMultiplier: 1.0,
      speedMultiplier: 1.0,
      detectionMultiplier: 1.0,
      unlockChaseStates: [GuardChaseState.PATROL, GuardChaseState.SURROUND]
    },
    pillDifficulty: {
      spawnMultiplier: 1.4,
      weights: { speed: 2, slow: 3, score: 2, shield: 3 }
    },
    bossConfig: {
      id: 'boss_phantom',
      name: '魅影',
      description: '迷幻药剂师，会召唤幻觉迷惑你',
      hp: 4,
      speedMultiplier: 1.4,
      detectionRange: 220,
      chaseState: GuardChaseState.SURROUND,
      spawnInterval: 12000,
      color: 0xff66cc,
      icon: '💊',
      specialAbility: '迷魂：触发幻觉效果让你操作失控'
    },
    bossFloor: 20,
    introCutsceneId: 'intro_ch2',
    outroCutsceneId: 'outro_ch2',
    preBossCutsceneId: 'pre_boss_ch2',
    platformDensity: 1.1,
    trapStartFloor: 3,
    trapChance: 0.3
  },
  {
    id: 3,
    title: '第三章',
    subtitle: '顶楼决战',
    description: '最终关卡。所有保安倾巢而出，对战夜店老板金牙！',
    icon: '👑',
    targetFloor: 30,
    startingTimeOfDay: TimeOfDay.MIDNIGHT,
    enableDayNightCycle: true,
    enableFloorEvents: true,
    enableSideEffects: true,
    guardDifficulty: {
      spawnMultiplier: 1.4,
      speedMultiplier: 1.3,
      detectionMultiplier: 1.2,
      unlockChaseStates: [GuardChaseState.PATROL, GuardChaseState.SURROUND, GuardChaseState.JUMP_CHASE]
    },
    pillDifficulty: {
      spawnMultiplier: 1.0,
      weights: { speed: 1, slow: 2, score: 2, shield: 5 }
    },
    bossConfig: {
      id: 'boss_golden_tooth',
      name: '金牙',
      description: '夜店老板，速度与力量兼备的终极Boss',
      hp: 5,
      speedMultiplier: 1.6,
      detectionRange: 280,
      chaseState: GuardChaseState.JUMP_CHASE,
      spawnInterval: 8000,
      color: 0xffcc00,
      icon: '👑',
      specialAbility: '召唤：定期召唤普通保安协助围堵'
    },
    bossFloor: 30,
    introCutsceneId: 'intro_ch3',
    outroCutsceneId: 'outro_ch3',
    preBossCutsceneId: 'pre_boss_ch3',
    platformDensity: 1.2,
    trapStartFloor: 2,
    trapChance: 0.4
  }
];

export const StoryConfig = {
  totalChapters: 3,
  startChapter: 1,
  storageKey: 'elevator_survival_story_save',
  bossInvulnerabilityMs: 2000,
  bossHitFlashMs: 300
};
