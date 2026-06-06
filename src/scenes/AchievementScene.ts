import Phaser from 'phaser';
import { GameConfig } from '../config/GameConfig';
import { AudioManager } from '../audio/AudioManager';
import { AchievementManager } from '../utils/AchievementManager';
import { Achievements, AchievementRarityConfig } from '../config/AchievementConfig';
import { Achievement, AchievementRarity } from '../types';

export class AchievementScene extends Phaser.Scene {
  private audioManager!: AudioManager;
  private achievementManager!: AchievementManager;
  private selectedAchievement: Achievement | null = null;
  private currentPage: number = 0;
  private readonly itemsPerPage: number = 5;
  private detailPanel: Phaser.GameObjects.Container | null = null;
  private listContainer: Phaser.GameObjects.Container | null = null;
  private filterRarity: AchievementRarity | 'all' = 'all';

  constructor() {
    super('AchievementScene');
  }

  create(): void {
    this.audioManager = AudioManager.getInstance();
    this.achievementManager = AchievementManager.getInstance();
    this.achievementManager.clearNewlyUnlocked();

    this.cameras.main.setBackgroundColor('#0a0a1a');
    this.createHeader();
    this.createFilterTabs();
    this.createAchievementList();
    this.createBackButton();
  }

  private createHeader(): void {
    this.add.rectangle(GameConfig.width / 2, 50, GameConfig.width, 80, 0x151535, 1);
    this.add.rectangle(GameConfig.width / 2, 90, GameConfig.width, 2, 0xff0066, 0.8);

    this.add.text(GameConfig.width / 2, 30, '🏆 称号成就', {
      fontSize: '28px',
      color: '#ffcc00',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const unlocked = this.achievementManager.getUnlockedCount();
    const total = this.achievementManager.getTotalCount();
    const percent = this.achievementManager.getProgressPercent();

    this.add.text(GameConfig.width / 2, 65, `已解锁 ${unlocked}/${total} (${percent}%)`, {
      fontSize: '14px',
      color: '#00ffff'
    }).setOrigin(0.5);

    const barWidth = GameConfig.width - 80;
    const barBg = this.add.graphics();
    barBg.fillStyle(0x222244, 1);
    barBg.fillRoundedRect(40, 78, barWidth, 8, 4);

    const barFill = this.add.graphics();
    barFill.fillStyle(0xffcc00, 1);
    barFill.fillRoundedRect(40, 78, barWidth * (percent / 100), 8, 4);
  }

  private createFilterTabs(): void {
    const tabs: { label: string; value: AchievementRarity | 'all'; color: string }[] = [
      { label: '全部', value: 'all', color: '#ffffff' },
      { label: '普通', value: AchievementRarity.COMMON, color: AchievementRarityConfig[AchievementRarity.COMMON].color },
      { label: '稀有', value: AchievementRarity.RARE, color: AchievementRarityConfig[AchievementRarity.RARE].color },
      { label: '史诗', value: AchievementRarity.EPIC, color: AchievementRarityConfig[AchievementRarity.EPIC].color },
      { label: '传说', value: AchievementRarity.LEGENDARY, color: AchievementRarityConfig[AchievementRarity.LEGENDARY].color }
    ];

    const startX = 20;
    const tabWidth = (GameConfig.width - 40) / tabs.length;
    const y = 115;

    tabs.forEach((tab, i) => {
      const isSelected = this.filterRarity === tab.value;
      const bg = this.add.graphics();
      bg.fillStyle(isSelected ? 0xff0066 : 0x1a1a3a, 1);
      bg.fillRoundedRect(startX + i * tabWidth + 2, y, tabWidth - 4, 28, 6);
      if (isSelected) {
        bg.lineStyle(2, 0xffcc00, 1);
        bg.strokeRoundedRect(startX + i * tabWidth + 2, y, tabWidth - 4, 28, 6);
      }

      const text = this.add.text(startX + i * tabWidth + tabWidth / 2, y + 14, tab.label, {
        fontSize: '13px',
        color: isSelected ? '#ffffff' : tab.color,
        fontStyle: isSelected ? 'bold' : 'normal'
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      text.on('pointerover', () => {
        if (!isSelected) {
          bg.fillStyle(0x2a2a5a, 1);
          bg.fillRoundedRect(startX + i * tabWidth + 2, y, tabWidth - 4, 28, 6);
        }
      });

      text.on('pointerout', () => {
        if (!isSelected) {
          bg.fillStyle(0x1a1a3a, 1);
          bg.fillRoundedRect(startX + i * tabWidth + 2, y, tabWidth - 4, 28, 6);
        }
      });

      text.on('pointerdown', () => {
        this.audioManager.play('select');
        this.filterRarity = tab.value;
        this.currentPage = 0;
        this.selectedAchievement = null;
        this.refreshList();
      });
    });
  }

  private getFilteredAchievements(): Achievement[] {
    if (this.filterRarity === 'all') {
      return [...Achievements];
    }
    return Achievements.filter(a => a.rarity === this.filterRarity);
  }

  private createAchievementList(): void {
    this.refreshList();
  }

  private refreshList(): void {
    if (this.listContainer) {
      this.listContainer.destroy();
    }
    if (this.detailPanel) {
      this.detailPanel.destroy();
      this.detailPanel = null;
    }

    this.listContainer = this.add.container(0, 0);

    const filtered = this.getFilteredAchievements();
    const totalPages = Math.max(1, Math.ceil(filtered.length / this.itemsPerPage));
    if (this.currentPage >= totalPages) {
      this.currentPage = totalPages - 1;
    }

    const startIdx = this.currentPage * this.itemsPerPage;
    const pageItems = filtered.slice(startIdx, startIdx + this.itemsPerPage);

    const listStartY = 160;
    const itemHeight = 80;

    pageItems.forEach((achievement, i) => {
      const y = listStartY + i * (itemHeight + 6);
      this.createAchievementItem(achievement, y);
    });

    if (filtered.length === 0) {
      this.add.text(GameConfig.width / 2, listStartY + 100, '该分类暂无成就', {
        fontSize: '16px',
        color: '#666666'
      }).setOrigin(0.5);
    }

    if (totalPages > 1) {
      this.add.text(GameConfig.width / 2, 600, `第 ${this.currentPage + 1}/${totalPages} 页`, {
        fontSize: '13px',
        color: '#888888'
      }).setOrigin(0.5);

      if (this.currentPage > 0) {
        const prevBtn = this.add.text(60, 600, '◀ 上一页', {
          fontSize: '14px',
          color: '#00ffff'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        prevBtn.on('pointerdown', () => {
          this.audioManager.play('select');
          this.currentPage--;
          this.refreshList();
        });

        prevBtn.on('pointerover', () => prevBtn.setColor('#66ffff'));
        prevBtn.on('pointerout', () => prevBtn.setColor('#00ffff'));
      }

      if (this.currentPage < totalPages - 1) {
        const nextBtn = this.add.text(GameConfig.width - 60, 600, '下一页 ▶', {
          fontSize: '14px',
          color: '#00ffff'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        nextBtn.on('pointerdown', () => {
          this.audioManager.play('select');
          this.currentPage++;
          this.refreshList();
        });

        nextBtn.on('pointerover', () => nextBtn.setColor('#66ffff'));
        nextBtn.on('pointerout', () => nextBtn.setColor('#00ffff'));
      }
    }
  }

  private createAchievementItem(achievement: Achievement, y: number): void {
    const isUnlocked = this.achievementManager.isAchievementUnlocked(achievement.id);
    const rarityConfig = AchievementRarityConfig[achievement.rarity];
    const isSelected = this.selectedAchievement?.id === achievement.id;

    const item = this.add.container(0, y);

    const bg = this.add.graphics();
    const bgColor = isUnlocked ? rarityConfig.bgColor : 0x151525;
    bg.fillStyle(bgColor, 1);
    bg.fillRoundedRect(20, 0, GameConfig.width - 40, 78, 10);

    const borderColor = isSelected ? 0xffff00 : (isUnlocked ? rarityConfig.borderColor : 0x333344);
    bg.lineStyle(isSelected ? 3 : 2, borderColor, 1);
    bg.strokeRoundedRect(20, 0, GameConfig.width - 40, 78, 10);

    const iconBg = this.add.graphics();
    iconBg.fillStyle(isUnlocked ? rarityConfig.borderColor : 0x222233, 0.3);
    iconBg.fillRoundedRect(30, 8, 62, 62, 8);

    const iconColor = isUnlocked ? '#ffffff' : '#444455';
    this.add.text(61, 39, achievement.icon, {
      fontSize: '32px',
      color: iconColor
    }).setOrigin(0.5);

    const textColor = isUnlocked ? '#ffffff' : '#555566';
    this.add.text(105, 15, achievement.name, {
      fontSize: '16px',
      color: textColor,
      fontStyle: 'bold'
    }).setOrigin(0, 0);

    this.add.text(105, 38, `称号: ${achievement.title}`, {
      fontSize: '12px',
      color: isUnlocked ? rarityConfig.color : '#444455'
    }).setOrigin(0, 0);

    const rarityLabel = this.add.text(105, 58, AchievementRarityConfig[achievement.rarity].name, {
      fontSize: '11px',
      color: rarityConfig.color,
      backgroundColor: 'rgba(0,0,0,0.4)',
      padding: { left: 6, right: 6, top: 2, bottom: 2 }
    }).setOrigin(0, 0);

    if (isUnlocked) {
      this.add.text(GameConfig.width - 35, 39, '✓', {
        fontSize: '28px',
        color: '#00ff66',
        fontStyle: 'bold'
      }).setOrigin(0.5);
    } else {
      this.add.text(GameConfig.width - 35, 39, '🔒', {
        fontSize: '20px',
        color: '#555566'
      }).setOrigin(0.5);
    }

    item.setSize(GameConfig.width, 78);
    item.setInteractive(new Phaser.Geom.Rectangle(20, 0, GameConfig.width - 40, 78), Phaser.Geom.Rectangle.Contains);

    item.on('pointerover', () => {
      bg.fillStyle(bgColor, 1);
      bg.fillRoundedRect(20, 0, GameConfig.width - 40, 78, 10);
      bg.lineStyle(isSelected ? 3 : 2, borderColor, 1);
      bg.strokeRoundedRect(20, 0, GameConfig.width - 40, 78, 10);
    });

    item.on('pointerout', () => {
      bg.fillStyle(bgColor, 1);
      bg.fillRoundedRect(20, 0, GameConfig.width - 40, 78, 10);
      bg.lineStyle(isSelected ? 3 : 2, borderColor, 1);
      bg.strokeRoundedRect(20, 0, GameConfig.width - 40, 78, 10);
    });

    item.on('pointerdown', () => {
      this.audioManager.play('select');
      this.selectedAchievement = achievement;
      this.refreshList();
      this.showDetailPanel(achievement);
    });

    if (this.listContainer) {
      this.listContainer.add([bg, iconBg, item, rarityLabel]);
    }
  }

  private showDetailPanel(achievement: Achievement): void {
    if (this.detailPanel) {
      this.detailPanel.destroy();
    }

    const isUnlocked = this.achievementManager.isAchievementUnlocked(achievement.id);
    const rarityConfig = AchievementRarityConfig[achievement.rarity];

    const panelY = 620;
    const panelHeight = 90;

    this.detailPanel = this.add.container(0, panelY);

    const bg = this.add.graphics();
    bg.fillStyle(0x0a0a20, 0.98);
    bg.fillRoundedRect(15, 0, GameConfig.width - 30, panelHeight, 10);
    bg.lineStyle(2, rarityConfig.borderColor, 1);
    bg.strokeRoundedRect(15, 0, GameConfig.width - 30, panelHeight, 10);

    this.add.text(GameConfig.width / 2, 18, `${achievement.icon} ${achievement.name}`, {
      fontSize: '17px',
      color: isUnlocked ? '#ffffff' : '#666677',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(GameConfig.width / 2, 42, achievement.description, {
      fontSize: '13px',
      color: isUnlocked ? '#cccccc' : '#555566',
      wordWrap: { width: GameConfig.width - 60 }
    }).setOrigin(0.5);

    const hintText = isUnlocked
      ? `✓ 已解锁 - 获得称号: "${achievement.title}"`
      : `💡 ${achievement.unlockHint}`;

    this.add.text(GameConfig.width / 2, 68, hintText, {
      fontSize: '12px',
      color: isUnlocked ? '#00ff66' : '#ffaa66',
      fontStyle: 'italic'
    }).setOrigin(0.5);

    this.detailPanel.add([bg]);
  }

  private createBackButton(): void {
    const backBtn = this.add.text(GameConfig.width / 2, GameConfig.height - 25, '← 返回菜单', {
      fontSize: '18px',
      color: '#888888',
      backgroundColor: '#222222',
      padding: { left: 25, right: 25, top: 8, bottom: 8 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    backBtn.on('pointerover', () => {
      backBtn.setBackgroundColor('#333333');
      backBtn.setColor('#ffffff');
      this.audioManager.play('hover');
    });

    backBtn.on('pointerout', () => {
      backBtn.setBackgroundColor('#222222');
      backBtn.setColor('#888888');
    });

    backBtn.on('pointerdown', () => {
      this.audioManager.play('select');
      this.scene.start('MenuScene');
    });
  }
}
