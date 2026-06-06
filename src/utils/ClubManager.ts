import { SaveManager } from './SaveManager';
import { ClubData, ClubUpgradeType, ClubBuff } from '../types';
import { ClubUpgradeConfigs, ClubBuffCalculator, SCORE_TO_CLUB_COIN_RATIO } from '../config/ClubConfig';

export class ClubManager {
  private static instance: ClubManager;
  private saveManager!: SaveManager;

  private constructor() {
    this.saveManager = SaveManager.getInstance();
    this.ensureClubDataExists();
  }

  static getInstance(): ClubManager {
    if (!ClubManager.instance) {
      ClubManager.instance = new ClubManager();
    }
    return ClubManager.instance;
  }

  private ensureClubDataExists(): void {
    const data = this.saveManager.getSaveData();
    if (!data.club) {
      this.saveManager.saveGameData({
        club: this.getDefaultClubData()
      });
    }
  }

  private getDefaultClubData(): ClubData {
    return {
      clubCoins: 0,
      totalClubCoinsEarned: 0,
      upgrades: {
        [ClubUpgradeType.DECORATION]: 0,
        [ClubUpgradeType.LIGHTING]: 0,
        [ClubUpgradeType.SOUND]: 0
      }
    };
  }

  getClubData(): ClubData {
    const data = this.saveManager.getSaveData();
    return data.club || this.getDefaultClubData();
  }

  getClubCoins(): number {
    return this.getClubData().clubCoins;
  }

  getTotalClubCoinsEarned(): number {
    return this.getClubData().totalClubCoinsEarned;
  }

  addClubCoins(amount: number): void {
    const data = this.getClubData();
    this.saveManager.saveGameData({
      club: {
        ...data,
        clubCoins: data.clubCoins + amount,
        totalClubCoinsEarned: data.totalClubCoinsEarned + amount
      }
    });
  }

  spendClubCoins(amount: number): boolean {
    const data = this.getClubData();
    if (data.clubCoins >= amount) {
      this.saveManager.saveGameData({
        club: {
          ...data,
          clubCoins: data.clubCoins - amount
        }
      });
      return true;
    }
    return false;
  }

  convertScoreToClubCoins(score: number): number {
    return Math.floor(score / SCORE_TO_CLUB_COIN_RATIO);
  }

  getUpgradeLevel(type: ClubUpgradeType): number {
    const data = this.getClubData();
    return data.upgrades[type] || 0;
  }

  getNextUpgradeCost(type: ClubUpgradeType): number | null {
    const currentLevel = this.getUpgradeLevel(type);
    const config = ClubUpgradeConfigs[type];
    if (currentLevel >= config.maxLevel) {
      return null;
    }
    return config.levels[currentLevel].cost;
  }

  canUpgrade(type: ClubUpgradeType): boolean {
    const cost = this.getNextUpgradeCost(type);
    if (cost === null) return false;
    return this.getClubCoins() >= cost;
  }

  upgrade(type: ClubUpgradeType): boolean {
    if (!this.canUpgrade(type)) return false;

    const cost = this.getNextUpgradeCost(type)!;
    if (!this.spendClubCoins(cost)) return false;

    const data = this.getClubData();
    const newLevel = data.upgrades[type] + 1;
    this.saveManager.saveGameData({
      club: {
        ...data,
        upgrades: {
          ...data.upgrades,
          [type]: newLevel
        }
      }
    });
    return true;
  }

  getCurrentBuff(): ClubBuff {
    const data = this.getClubData();
    return ClubBuffCalculator.calculateBuff(
      data.upgrades[ClubUpgradeType.DECORATION],
      data.upgrades[ClubUpgradeType.LIGHTING],
      data.upgrades[ClubUpgradeType.SOUND]
    );
  }

  resetClubData(): void {
    this.saveManager.saveGameData({
      club: this.getDefaultClubData()
    });
  }
}
