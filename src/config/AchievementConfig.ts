import { Achievement, AchievementRarity } from '../types';

export const AchievementRarityConfig: Record<AchievementRarity, {
  name: string;
  color: string;
  bgColor: number;
  borderColor: number;
}> = {
  [AchievementRarity.COMMON]: {
    name: '普通',
    color: '#aaaaaa',
    bgColor: 0x2a2a3a,
    borderColor: 0x666666
  },
  [AchievementRarity.RARE]: {
    name: '稀有',
    color: '#44aaff',
    bgColor: 0x1a2a4a,
    borderColor: 0x4488ff
  },
  [AchievementRarity.EPIC]: {
    name: '史诗',
    color: '#aa66ff',
    bgColor: 0x2a1a4a,
    borderColor: 0x9944ff
  },
  [AchievementRarity.LEGENDARY]: {
    name: '传说',
    color: '#ffcc00',
    bgColor: 0x3a2a0a,
    borderColor: 0xffaa00
  }
};

export const Achievements: Achievement[] = [
  {
    id: 'first_game',
    name: '初入夜店',
    title: '新手冒险者',
    icon: '🌃',
    rarity: AchievementRarity.COMMON,
    description: '完成你的第一局游戏',
    condition: { type: 'totalGamesPlayed', value: 1 },
    unlockHint: '开始一局游戏即可'
  },
  {
    id: 'games_10',
    name: '夜店常客',
    title: '资深玩家',
    icon: '🎯',
    rarity: AchievementRarity.COMMON,
    description: '累计进行10局游戏',
    condition: { type: 'totalGamesPlayed', value: 10 },
    unlockHint: '累计进行10局游戏'
  },
  {
    id: 'games_50',
    name: '不归路',
    title: '沉迷者',
    icon: '💊',
    rarity: AchievementRarity.RARE,
    description: '累计进行50局游戏',
    condition: { type: 'totalGamesPlayed', value: 50 },
    unlockHint: '累计进行50局游戏'
  },
  {
    id: 'score_1000',
    name: '初露锋芒',
    title: '得分新星',
    icon: '⭐',
    rarity: AchievementRarity.COMMON,
    description: '单局得分达到1000分',
    condition: { type: 'singleGameScore', value: 1000 },
    unlockHint: '单局得分达到1000分'
  },
  {
    id: 'score_5000',
    name: '得分高手',
    title: '精英玩家',
    icon: '🌟',
    rarity: AchievementRarity.RARE,
    description: '单局得分达到5000分',
    condition: { type: 'singleGameScore', value: 5000 },
    unlockHint: '单局得分达到5000分'
  },
  {
    id: 'score_15000',
    name: '夜店之王',
    title: '传奇玩家',
    icon: '👑',
    rarity: AchievementRarity.LEGENDARY,
    description: '单局得分达到15000分',
    condition: { type: 'singleGameScore', value: 15000 },
    unlockHint: '单局得分达到15000分'
  },
  {
    id: 'total_highscore_20000',
    name: '永不服输',
    title: '坚持不懈',
    icon: '💪',
    rarity: AchievementRarity.EPIC,
    description: '最高累计得分达到20000分',
    condition: { type: 'totalHighScore', value: 20000 },
    unlockHint: '不断刷新你的最高分'
  },
  {
    id: 'floor_5',
    name: '深入地下',
    title: '探索者',
    icon: '⬇️',
    rarity: AchievementRarity.COMMON,
    description: '单局到达5层',
    condition: { type: 'singleGameFloor', value: 5 },
    unlockHint: '单局到达5层'
  },
  {
    id: 'floor_15',
    name: '深渊行者',
    title: '深渊探险家',
    icon: '🕳️',
    rarity: AchievementRarity.RARE,
    description: '单局到达15层',
    condition: { type: 'singleGameFloor', value: 15 },
    unlockHint: '单局到达15层'
  },
  {
    id: 'pills_10',
    name: '尝鲜者',
    title: '药片新手',
    icon: '💊',
    rarity: AchievementRarity.COMMON,
    description: '单局拾取10个药片',
    condition: { type: 'singleGamePills', value: 10 },
    unlockHint: '单局拾取10个药片'
  },
  {
    id: 'pills_30',
    name: '瘾君子',
    title: '药片收藏家',
    icon: '💉',
    rarity: AchievementRarity.RARE,
    description: '单局拾取30个药片',
    condition: { type: 'singleGamePills', value: 30 },
    unlockHint: '单局拾取30个药片'
  },
  {
    id: 'total_pills_200',
    name: '药不能停',
    title: '药片大师',
    icon: '⚗️',
    rarity: AchievementRarity.EPIC,
    description: '累计拾取200个药片',
    condition: { type: 'totalPills', value: 200 },
    unlockHint: '累计拾取200个药片'
  },
  {
    id: 'combo_5',
    name: '连击入门',
    title: '连击学徒',
    icon: '🔥',
    rarity: AchievementRarity.COMMON,
    description: '单局最高连击达到5',
    condition: { type: 'singleGameCombo', value: 5 },
    unlockHint: '连续跳跃在空中再跳，达到5连击'
  },
  {
    id: 'combo_15',
    name: '空中舞者',
    title: '连击大师',
    icon: '💃',
    rarity: AchievementRarity.RARE,
    description: '单局最高连击达到15',
    condition: { type: 'singleGameCombo', value: 15 },
    unlockHint: '单局最高连击达到15'
  },
  {
    id: 'combo_30',
    name: '飞行大师',
    title: '空中王者',
    icon: '🦅',
    rarity: AchievementRarity.EPIC,
    description: '单局最高连击达到30',
    condition: { type: 'singleGameCombo', value: 30 },
    unlockHint: '单局最高连击达到30'
  },
  {
    id: 'total_combos_100',
    name: '永不落地',
    title: '连击狂人',
    icon: '🌀',
    rarity: AchievementRarity.EPIC,
    description: '累计最高连击总和达到100',
    condition: { type: 'totalCombos', value: 100 },
    unlockHint: '每局的最高连击累加达到100'
  },
  {
    id: 'nodamage_5',
    name: '完美躲避',
    title: '无伤达人',
    icon: '🛡️',
    rarity: AchievementRarity.COMMON,
    description: '单局无伤连层达到5层',
    condition: { type: 'singleGameNoDamageFloors', value: 5 },
    unlockHint: '连续5层不被保安碰到'
  },
  {
    id: 'nodamage_10',
    name: '影子行者',
    title: '幽灵般的存在',
    icon: '👻',
    rarity: AchievementRarity.RARE,
    description: '单局无伤连层达到10层',
    condition: { type: 'singleGameNoDamageFloors', value: 10 },
    unlockHint: '连续10层不被保安碰到'
  },
  {
    id: 'no_guard_hit',
    name: '完美主义者',
    title: '零失误玩家',
    icon: '✨',
    rarity: AchievementRarity.RARE,
    description: '完成一局游戏且全程未被保安碰到',
    condition: { type: 'noGuardHitGame', value: 1 },
    unlockHint: '完成一局游戏且全程未被保安碰到'
  },
  {
    id: 'addiction_50',
    name: '初次上头',
    title: '轻度成瘾者',
    icon: '😵',
    rarity: AchievementRarity.COMMON,
    description: '单局最高成瘾度达到50%',
    condition: { type: 'singleGameMaxAddiction', value: 50 },
    unlockHint: '持续吃药片让成瘾度达到50%'
  },
  {
    id: 'addiction_90',
    name: '重度成瘾',
    title: '深度中毒者',
    icon: '☠️',
    rarity: AchievementRarity.EPIC,
    description: '单局最高成瘾度达到90%',
    condition: { type: 'singleGameMaxAddiction', value: 90 },
    unlockHint: '吃药片让成瘾度达到90%，注意安全！'
  },
  {
    id: 'hallucination_3',
    name: '幻觉世界',
    title: '迷幻旅人',
    icon: '🌈',
    rarity: AchievementRarity.RARE,
    description: '单局触发3次幻觉',
    condition: { type: 'singleGameHallucinations', value: 3 },
    unlockHint: '高成瘾度下吃药片更容易触发幻觉'
  },
  {
    id: 'total_hallucinations_20',
    name: '迷幻常客',
    title: '幻觉大师',
    icon: '🌀',
    rarity: AchievementRarity.EPIC,
    description: '累计触发20次幻觉',
    condition: { type: 'totalHallucinations', value: 20 },
    unlockHint: '累计触发20次幻觉'
  },
  {
    id: 'lossofcontrol_2',
    name: '失控边缘',
    title: '身不由己',
    icon: '💫',
    rarity: AchievementRarity.RARE,
    description: '单局触发2次失控',
    condition: { type: 'singleGameLossOfControl', value: 2 },
    unlockHint: '极高成瘾度下吃药片可能触发失控'
  },
  {
    id: 'daycycles_5',
    name: '日夜颠倒',
    title: '时间旅人',
    icon: '🌓',
    rarity: AchievementRarity.COMMON,
    description: '累计经历5个日夜循环',
    condition: { type: 'totalDayCycles', value: 5 },
    unlockHint: '游戏中会自动经历日夜变化'
  },
  {
    id: 'events_10',
    name: '事件目击者',
    title: '见多识广',
    icon: '📢',
    rarity: AchievementRarity.COMMON,
    description: '累计触发10次楼层事件',
    condition: { type: 'totalEventsTriggered', value: 10 },
    unlockHint: '每隔几层会触发随机事件'
  },
  {
    id: 'endless_floor_20',
    name: '无尽探索者',
    title: '耐力选手',
    icon: '♾️',
    rarity: AchievementRarity.RARE,
    description: '无尽模式到达20层',
    condition: { type: 'endlessBestFloor', value: 20 },
    unlockHint: '在无尽模式中坚持到20层'
  },
  {
    id: 'endless_score_10000',
    name: '无尽传说',
    title: '竞速之王',
    icon: '🏆',
    rarity: AchievementRarity.LEGENDARY,
    description: '无尽模式得分达到10000分',
    condition: { type: 'endlessBestScore', value: 10000 },
    unlockHint: '在无尽模式中获得10000分'
  },
  {
    id: 'endless_games_10',
    name: '竞速爱好者',
    title: '无尽常客',
    icon: '⚡',
    rarity: AchievementRarity.COMMON,
    description: '进行10局无尽模式',
    condition: { type: 'endlessGamesPlayed', value: 10 },
    unlockHint: '进行10局无尽模式'
  },
  {
    id: 'training_score_5000',
    name: '训练有素',
    title: '训练馆达人',
    icon: '🎓',
    rarity: AchievementRarity.RARE,
    description: '训练模式累计总分达到5000',
    condition: { type: 'trainingTotalScore', value: 5000 },
    unlockHint: '在番外训练馆中获得更高分数'
  }
];
