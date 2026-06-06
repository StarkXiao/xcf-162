import { ClubUpgradeType, ClubUpgrade, ClubBuff } from '../types';

export const SCORE_TO_CLUB_COIN_RATIO: number = 100;

export const ClubUpgradeConfigs: Record<ClubUpgradeType, ClubUpgrade> = {
  [ClubUpgradeType.DECORATION]: {
    type: ClubUpgradeType.DECORATION,
    name: '店面装修',
    icon: '🎨',
    description: '豪华装修提升整体得分倍率',
    color: '#ff66aa',
    currentLevel: 0,
    maxLevel: 10,
    levels: [
      { level: 1, cost: 50, bonus: 0.05, description: '基础海报装饰：得分+5%' },
      { level: 2, cost: 120, bonus: 0.10, description: 'LED灯条装饰：得分+10%' },
      { level: 3, cost: 250, bonus: 0.15, description: '霓虹灯牌装饰：得分+15%' },
      { level: 4, cost: 500, bonus: 0.20, description: '豪华舞池装置：得分+20%' },
      { level: 5, cost: 1000, bonus: 0.28, description: 'VIP包间配置：得分+28%' },
      { level: 6, cost: 1800, bonus: 0.36, description: '专属DJ台：得分+36%' },
      { level: 7, cost: 3000, bonus: 0.45, description: '镜面装饰墙：得分+45%' },
      { level: 8, cost: 5000, bonus: 0.55, description: '水晶吊灯：得分+55%' },
      { level: 9, cost: 8000, bonus: 0.70, description: '奢华大理石地板：得分+70%' },
      { level: 10, cost: 15000, bonus: 1.00, description: '顶级夜总会规格：得分翻倍！' }
    ]
  },
  [ClubUpgradeType.LIGHTING]: {
    type: ClubUpgradeType.LIGHTING,
    name: '灯光系统',
    icon: '💡',
    description: '炫彩灯光增加药片掉落与连击时间',
    color: '#66ffaa',
    currentLevel: 0,
    maxLevel: 10,
    levels: [
      { level: 1, cost: 40, bonus: 0.05, description: '基础彩光：药片+5%' },
      { level: 2, cost: 100, bonus: 0.10, description: '频闪灯效：药片+10%' },
      { level: 3, cost: 220, bonus: 0.15, description: '激光阵列：药片+15%，连击+500ms' },
      { level: 4, cost: 450, bonus: 0.20, description: '智能追光：药片+20%，连击+800ms' },
      { level: 5, cost: 900, bonus: 0.28, description: 'UV荧光系统：药片+28%，连击+1200ms' },
      { level: 6, cost: 1600, bonus: 0.36, description: '3D全息投影：药片+36%，连击+1600ms' },
      { level: 7, cost: 2800, bonus: 0.45, description: '烟雾+激光联动：药片+45%，连击+2000ms' },
      { level: 8, cost: 4500, bonus: 0.55, description: '可编程灯光秀：药片+55%，连击+2500ms' },
      { level: 9, cost: 7500, bonus: 0.70, description: '演唱会级灯光：药片+70%，连击+3000ms' },
      { level: 10, cost: 14000, bonus: 1.00, description: '沉浸式全景灯光：药片翻倍，连击+4000ms' }
    ]
  },
  [ClubUpgradeType.SOUND]: {
    type: ClubUpgradeType.SOUND,
    name: '音响系统',
    icon: '🔊',
    description: '震撼音效增加生存时间并削弱保安',
    color: '#66aaff',
    currentLevel: 0,
    maxLevel: 10,
    levels: [
      { level: 1, cost: 60, bonus: 3000, description: '基础音响：初始时间+3秒' },
      { level: 2, cost: 150, bonus: 6000, description: '低音炮：初始时间+6秒' },
      { level: 3, cost: 300, bonus: 10000, description: '环绕声系统：初始时间+10秒，保安-3%速度' },
      { level: 4, cost: 600, bonus: 15000, description: '专业混音台：初始时间+15秒，保安-5%速度' },
      { level: 5, cost: 1200, bonus: 22000, description: '线阵列音响：初始时间+22秒，保安-8%速度' },
      { level: 6, cost: 2000, bonus: 30000, description: '超重低音阵列：初始时间+30秒，保安-12%速度' },
      { level: 7, cost: 3500, bonus: 40000, description: 'THX认证系统：初始时间+40秒，保安-16%速度' },
      { level: 8, cost: 5500, bonus: 55000, description: '杜比全景声：初始时间+55秒，保安-20%速度' },
      { level: 9, cost: 9000, bonus: 75000, description: '音乐节级音响：初始时间+75秒，保安-25%速度' },
      { level: 10, cost: 16000, bonus: 120000, description: '震感音响系统：初始时间+120秒，保安-35%速度' }
    ]
  }
};

export class ClubBuffCalculator {
  static calculateBuff(decorationLevel: number, lightingLevel: number, soundLevel: number): ClubBuff {
    const decoBonuses = [0, 0.05, 0.10, 0.15, 0.20, 0.28, 0.36, 0.45, 0.55, 0.70, 1.00];
    const pillBonuses = [0, 0.05, 0.10, 0.15, 0.20, 0.28, 0.36, 0.45, 0.55, 0.70, 1.00];
    const comboTimeouts = [0, 0, 0, 500, 800, 1200, 1600, 2000, 2500, 3000, 4000];
    const timeBonuses = [0, 3000, 6000, 10000, 15000, 22000, 30000, 40000, 55000, 75000, 120000];
    const guardReductions = [0, 0, 0, 0.03, 0.05, 0.08, 0.12, 0.16, 0.20, 0.25, 0.35];

    const decoLvl = Math.min(decorationLevel, 10);
    const lightLvl = Math.min(lightingLevel, 10);
    const soundLvl = Math.min(soundLevel, 10);

    return {
      scoreMultiplier: 1.0 + decoBonuses[decoLvl],
      pillSpawnMultiplier: 1.0 + pillBonuses[lightLvl],
      baseTimeBonus: timeBonuses[soundLvl],
      comboTimeoutBonus: comboTimeouts[lightLvl],
      guardSpeedReduction: guardReductions[soundLvl]
    };
  }
}
