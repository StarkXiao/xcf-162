import { SeasonTask, SeasonTaskType, SeasonRewardType, SeasonInfo } from '../types';

export const SeasonLevelConfig = {
  expPerLevel: 100,
  maxLevel: 100,
  levelExpMultiplier: 1.1
};

export const SeasonRewardRarity = {
  common: { color: '#aaaaaa', bgColor: 0x2a2a3a, borderColor: 0x666666 },
  rare: { color: '#44aaff', bgColor: 0x1a2a4a, borderColor: 0x4488ff },
  epic: { color: '#aa66ff', bgColor: 0x2a1a4a, borderColor: 0x9944ff },
  legendary: { color: '#ffcc00', bgColor: 0x3a2a0a, borderColor: 0xffaa00 }
};

export const getCurrentSeason = (): SeasonInfo => {
  const now = Date.now();
  const seasonDuration = 90 * 24 * 60 * 60 * 1000;
  const seasonStart = new Date('2025-01-01T00:00:00Z').getTime();
  const seasonIndex = Math.floor((now - seasonStart) / seasonDuration);
  const actualStart = seasonStart + seasonIndex * seasonDuration;

  return {
    id: `season_${seasonIndex + 1}`,
    name: `第 ${seasonIndex + 1} 赛季`,
    description: '深入夜店深渊，挑战全新赛季目标，解锁专属奖励！',
    startDate: actualStart,
    endDate: actualStart + seasonDuration,
    icon: '🏆'
  };
};

export const SeasonCumulativeTasks: SeasonTask[] = [
  {
    id: 'cum_score_50000',
    name: '夜店老兵',
    description: '赛季累计得分达到 50,000 分',
    icon: '⭐',
    type: SeasonTaskType.SCORE,
    targetValue: 50000,
    isWeekly: false,
    isCumulative: true,
    rewards: [
      { type: SeasonRewardType.SEASON_POINTS, value: 200, label: '赛季积分 +200', icon: '🏆' },
      { type: SeasonRewardType.PILLS_BONUS, value: 50, label: '额外药片 x50', icon: '💊' }
    ]
  },
  {
    id: 'cum_score_200000',
    name: '传奇玩家',
    description: '赛季累计得分达到 200,000 分',
    icon: '👑',
    type: SeasonTaskType.SCORE,
    targetValue: 200000,
    isWeekly: false,
    isCumulative: true,
    rewards: [
      { type: SeasonRewardType.SEASON_POINTS, value: 800, label: '赛季积分 +800', icon: '🏆' },
      { type: SeasonRewardType.TITLE, value: 'night_legend', label: '专属称号: 夜店传奇', icon: '🎖️' }
    ]
  },
  {
    id: 'cum_floor_100',
    name: '深渊探险家',
    description: '赛季累计到达 100 层',
    icon: '⬇️',
    type: SeasonTaskType.FLOOR,
    targetValue: 100,
    isWeekly: false,
    isCumulative: true,
    rewards: [
      { type: SeasonRewardType.SEASON_POINTS, value: 300, label: '赛季积分 +300', icon: '🏆' },
      { type: SeasonRewardType.PILLS_BONUS, value: 80, label: '额外药片 x80', icon: '💊' }
    ]
  },
  {
    id: 'cum_pills_500',
    name: '药片收藏家',
    description: '赛季累计拾取 500 个药片',
    icon: '💊',
    type: SeasonTaskType.PILLS,
    targetValue: 500,
    isWeekly: false,
    isCumulative: true,
    rewards: [
      { type: SeasonRewardType.SEASON_POINTS, value: 250, label: '赛季积分 +250', icon: '🏆' },
      { type: SeasonRewardType.BADGE, value: 'pill_master', label: '徽章: 药片大师', icon: '🎖️' }
    ]
  },
  {
    id: 'cum_combo_200',
    name: '空中王者',
    description: '赛季累计最高连击总和达到 200',
    icon: '🦅',
    type: SeasonTaskType.COMBO,
    targetValue: 200,
    isWeekly: false,
    isCumulative: true,
    rewards: [
      { type: SeasonRewardType.SEASON_POINTS, value: 400, label: '赛季积分 +400', icon: '🏆' },
      { type: SeasonRewardType.TITLE, value: 'sky_king', label: '专属称号: 空中王者', icon: '🎖️' }
    ]
  },
  {
    id: 'cum_games_100',
    name: '不归路',
    description: '赛季累计进行 100 局游戏',
    icon: '🎮',
    type: SeasonTaskType.GAMES_PLAYED,
    targetValue: 100,
    isWeekly: false,
    isCumulative: true,
    rewards: [
      { type: SeasonRewardType.SEASON_POINTS, value: 500, label: '赛季积分 +500', icon: '🏆' },
      { type: SeasonRewardType.PILLS_BONUS, value: 150, label: '额外药片 x150', icon: '💊' }
    ]
  },
  {
    id: 'cum_nodamage_50',
    name: '影子行者',
    description: '赛季累计无伤连层总和达到 50',
    icon: '👻',
    type: SeasonTaskType.NODAMAGE,
    targetValue: 50,
    isWeekly: false,
    isCumulative: true,
    rewards: [
      { type: SeasonRewardType.SEASON_POINTS, value: 600, label: '赛季积分 +600', icon: '🏆' },
      { type: SeasonRewardType.BADGE, value: 'shadow_walker', label: '徽章: 影子行者', icon: '🎖️' }
    ]
  },
  {
    id: 'cum_endless_floor_100',
    name: '无尽挑战',
    description: '赛季无尽模式累计到达 100 层',
    icon: '♾️',
    type: SeasonTaskType.ENDLESS_FLOOR,
    targetValue: 100,
    isWeekly: false,
    isCumulative: true,
    rewards: [
      { type: SeasonRewardType.SEASON_POINTS, value: 700, label: '赛季积分 +700', icon: '🏆' },
      { type: SeasonRewardType.TITLE, value: 'endless_master', label: '专属称号: 无尽大师', icon: '🎖️' }
    ]
  }
];

export const SeasonWeeklyTaskPool: SeasonTask[] = [
  {
    id: 'weekly_score_5000',
    name: '本周目标: 得分新星',
    description: '本周单局最高得分达到 5,000 分',
    icon: '⭐',
    type: SeasonTaskType.SCORE,
    targetValue: 5000,
    isWeekly: true,
    isCumulative: false,
    rewards: [
      { type: SeasonRewardType.SEASON_POINTS, value: 100, label: '赛季积分 +100', icon: '🏆' },
      { type: SeasonRewardType.PILLS_BONUS, value: 20, label: '额外药片 x20', icon: '💊' }
    ]
  },
  {
    id: 'weekly_score_10000',
    name: '本周目标: 高分达人',
    description: '本周单局最高得分达到 10,000 分',
    icon: '🌟',
    type: SeasonTaskType.SCORE,
    targetValue: 10000,
    isWeekly: true,
    isCumulative: false,
    rewards: [
      { type: SeasonRewardType.SEASON_POINTS, value: 200, label: '赛季积分 +200', icon: '🏆' },
      { type: SeasonRewardType.PILLS_BONUS, value: 40, label: '额外药片 x40', icon: '💊' }
    ]
  },
  {
    id: 'weekly_floor_10',
    name: '本周目标: 探索者',
    description: '本周单局到达 10 层',
    icon: '⬇️',
    type: SeasonTaskType.FLOOR,
    targetValue: 10,
    isWeekly: true,
    isCumulative: false,
    rewards: [
      { type: SeasonRewardType.SEASON_POINTS, value: 80, label: '赛季积分 +80', icon: '🏆' },
      { type: SeasonRewardType.PILLS_BONUS, value: 15, label: '额外药片 x15', icon: '💊' }
    ]
  },
  {
    id: 'weekly_floor_20',
    name: '本周目标: 深度探索',
    description: '本周单局到达 20 层',
    icon: '🕳️',
    type: SeasonTaskType.FLOOR,
    targetValue: 20,
    isWeekly: true,
    isCumulative: false,
    rewards: [
      { type: SeasonRewardType.SEASON_POINTS, value: 180, label: '赛季积分 +180', icon: '🏆' },
      { type: SeasonRewardType.PILLS_BONUS, value: 35, label: '额外药片 x35', icon: '💊' }
    ]
  },
  {
    id: 'weekly_pills_30',
    name: '本周目标: 尝鲜',
    description: '本周累计拾取 30 个药片',
    icon: '💊',
    type: SeasonTaskType.PILLS,
    targetValue: 30,
    isWeekly: true,
    isCumulative: true,
    rewards: [
      { type: SeasonRewardType.SEASON_POINTS, value: 90, label: '赛季积分 +90', icon: '🏆' },
      { type: SeasonRewardType.PILLS_BONUS, value: 20, label: '额外药片 x20', icon: '💊' }
    ]
  },
  {
    id: 'weekly_combo_10',
    name: '本周目标: 连击入门',
    description: '本周单局最高连击达到 10',
    icon: '🔥',
    type: SeasonTaskType.COMBO,
    targetValue: 10,
    isWeekly: true,
    isCumulative: false,
    rewards: [
      { type: SeasonRewardType.SEASON_POINTS, value: 120, label: '赛季积分 +120', icon: '🏆' },
      { type: SeasonRewardType.PILLS_BONUS, value: 25, label: '额外药片 x25', icon: '💊' }
    ]
  },
  {
    id: 'weekly_combo_20',
    name: '本周目标: 空中舞者',
    description: '本周单局最高连击达到 20',
    icon: '💃',
    type: SeasonTaskType.COMBO,
    targetValue: 20,
    isWeekly: true,
    isCumulative: false,
    rewards: [
      { type: SeasonRewardType.SEASON_POINTS, value: 250, label: '赛季积分 +250', icon: '🏆' },
      { type: SeasonRewardType.PILLS_BONUS, value: 50, label: '额外药片 x50', icon: '💊' }
    ]
  },
  {
    id: 'weekly_games_10',
    name: '本周目标: 常客',
    description: '本周进行 10 局游戏',
    icon: '🎯',
    type: SeasonTaskType.GAMES_PLAYED,
    targetValue: 10,
    isWeekly: true,
    isCumulative: true,
    rewards: [
      { type: SeasonRewardType.SEASON_POINTS, value: 150, label: '赛季积分 +150', icon: '🏆' },
      { type: SeasonRewardType.PILLS_BONUS, value: 30, label: '额外药片 x30', icon: '💊' }
    ]
  },
  {
    id: 'weekly_nodamage_5',
    name: '本周目标: 完美躲避',
    description: '本周单局无伤连层达到 5 层',
    icon: '🛡️',
    type: SeasonTaskType.NODAMAGE,
    targetValue: 5,
    isWeekly: true,
    isCumulative: false,
    rewards: [
      { type: SeasonRewardType.SEASON_POINTS, value: 140, label: '赛季积分 +140', icon: '🏆' },
      { type: SeasonRewardType.PILLS_BONUS, value: 28, label: '额外药片 x28', icon: '💊' }
    ]
  },
  {
    id: 'weekly_addiction_75',
    name: '本周目标: 深度体验',
    description: '本周单局最高成瘾度达到 75%',
    icon: '😵',
    type: SeasonTaskType.ADDICTION,
    targetValue: 75,
    isWeekly: true,
    isCumulative: false,
    rewards: [
      { type: SeasonRewardType.SEASON_POINTS, value: 110, label: '赛季积分 +110', icon: '🏆' },
      { type: SeasonRewardType.PILLS_BONUS, value: 22, label: '额外药片 x22', icon: '💊' }
    ]
  },
  {
    id: 'weekly_hallucination_2',
    name: '本周目标: 迷幻之旅',
    description: '本周单局触发 2 次幻觉',
    icon: '🌈',
    type: SeasonTaskType.HALLUCINATIONS,
    targetValue: 2,
    isWeekly: true,
    isCumulative: false,
    rewards: [
      { type: SeasonRewardType.SEASON_POINTS, value: 130, label: '赛季积分 +130', icon: '🏆' },
      { type: SeasonRewardType.PILLS_BONUS, value: 26, label: '额外药片 x26', icon: '💊' }
    ]
  },
  {
    id: 'weekly_endless_score_5000',
    name: '本周目标: 竞速新星',
    description: '本周无尽模式最高得分达到 5,000 分',
    icon: '⚡',
    type: SeasonTaskType.ENDLESS_SCORE,
    targetValue: 5000,
    isWeekly: true,
    isCumulative: false,
    rewards: [
      { type: SeasonRewardType.SEASON_POINTS, value: 160, label: '赛季积分 +160', icon: '🏆' },
      { type: SeasonRewardType.PILLS_BONUS, value: 32, label: '额外药片 x32', icon: '💊' }
    ]
  },
  {
    id: 'weekly_training_2000',
    name: '本周目标: 训练有素',
    description: '本周训练模式累计得分达到 2,000 分',
    icon: '🎓',
    type: SeasonTaskType.TRAINING_SCORE,
    targetValue: 2000,
    isWeekly: true,
    isCumulative: true,
    rewards: [
      { type: SeasonRewardType.SEASON_POINTS, value: 170, label: '赛季积分 +170', icon: '🏆' },
      { type: SeasonRewardType.PILLS_BONUS, value: 34, label: '额外药片 x34', icon: '💊' }
    ]
  },
  {
    id: 'weekly_events_5',
    name: '本周目标: 事件目击者',
    description: '本周累计触发 5 次楼层事件',
    icon: '📢',
    type: SeasonTaskType.EVENTS,
    targetValue: 5,
    isWeekly: true,
    isCumulative: true,
    rewards: [
      { type: SeasonRewardType.SEASON_POINTS, value: 100, label: '赛季积分 +100', icon: '🏆' },
      { type: SeasonRewardType.PILLS_BONUS, value: 20, label: '额外药片 x20', icon: '💊' }
    ]
  },
  {
    id: 'weekly_daycycles_3',
    name: '本周目标: 日夜颠倒',
    description: '本周累计经历 3 个日夜循环',
    icon: '🌓',
    type: SeasonTaskType.DAY_CYCLES,
    targetValue: 3,
    isWeekly: true,
    isCumulative: true,
    rewards: [
      { type: SeasonRewardType.SEASON_POINTS, value: 90, label: '赛季积分 +90', icon: '🏆' },
      { type: SeasonRewardType.PILLS_BONUS, value: 18, label: '额外药片 x18', icon: '💊' }
    ]
  }
];

export const WEEKLY_TASK_COUNT = 5;

export const pickWeeklyTasks = (seed?: number): SeasonTask[] => {
  const pool = [...SeasonWeeklyTaskPool];
  const tasks: SeasonTask[] = [];
  const random = seed ? seededRandom(seed) : Math.random;

  for (let i = 0; i < WEEKLY_TASK_COUNT && pool.length > 0; i++) {
    const idx = Math.floor(random() * pool.length);
    tasks.push(pool.splice(idx, 1)[0]);
  }

  return tasks;
};

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}
