import Phaser from 'phaser';
import { GameConfig } from '../config/GameConfig';
import { AudioManager } from '../audio/AudioManager';
import { LeaderboardManager } from '../utils/LeaderboardManager';
import {
  LeaderboardGameMode,
  LeaderboardSortType,
  LeaderboardModeLabels,
  LeaderboardSortLabels,
  LeaderboardEntry
} from '../types';

export class LeaderboardScene extends Phaser.Scene {
  private audioManager!: AudioManager;
  private leaderboardManager!: LeaderboardManager;

  private currentMode: LeaderboardGameMode | 'all' = 'all';
  private currentSort: LeaderboardSortType = LeaderboardSortType.HIGH_SCORE;
  private currentPage: number = 0;
  private readonly itemsPerPage: number = 8;

  private headerContainer!: Phaser.GameObjects.Container;
  private modeTabsContainer!: Phaser.GameObjects.Container;
  private sortTabsContainer!: Phaser.GameObjects.Container;
  private listContainer!: Phaser.GameObjects.Container;
  private pageNavContainer!: Phaser.GameObjects.Container;
  private backButtonContainer!: Phaser.GameObjects.Container;
  private statsContainer!: Phaser.GameObjects.Container;

  constructor() {
    super('LeaderboardScene');
  }

  create(): void {
    this.audioManager = AudioManager.getInstance();
    this.leaderboardManager = LeaderboardManager.getInstance();

    this.cameras.main.setBackgroundColor('#0a0a1a');

    this.headerContainer = this.add.container(0, 0);
    this.modeTabsContainer = this.add.container(0, 0);
    this.sortTabsContainer = this.add.container(0, 0);
    this.statsContainer = this.add.container(0, 0);
    this.listContainer = this.add.container(0, 0);
    this.pageNavContainer = this.add.container(0, 0);
    this.backButtonContainer = this.add.container(0, 0);

    this.createHeader();
    this.createModeTabs();
    this.createSortTabs();
    this.refreshStats();
    this.refreshList(true);
    this.createBackButton();
  }

  private destroyContainerChildren(container: Phaser.GameObjects.Container): void {
    const children = [...container.list];
    for (let i = children.length - 1; i >= 0; i--) {
      const child = children[i];
      if (child instanceof Phaser.GameObjects.Container) {
        this.destroyContainerChildren(child);
      }
      child.destroy();
    }
    container.removeAll();
  }

  private createHeader(): void {
    this.destroyContainerChildren(this.headerContainer);
    const objs: Phaser.GameObjects.GameObject[] = [];

    objs.push(this.add.rectangle(GameConfig.width / 2, 45, GameConfig.width, 70, 0x151535, 1));
    objs.push(this.add.rectangle(GameConfig.width / 2, 80, GameConfig.width, 2, 0x00ffff, 0.8));

    objs.push(this.add.text(GameConfig.width / 2, 25, '🏆 本地排行榜', {
      fontSize: '26px',
      color: '#00ffff',
      fontStyle: 'bold'
    }).setOrigin(0.5));

    const totalEntries = this.leaderboardManager.getTotalEntries();
    objs.push(this.add.text(GameConfig.width / 2, 58, `共 ${totalEntries} 条记录`, {
      fontSize: '12px',
      color: '#8888aa'
    }).setOrigin(0.5));

    this.headerContainer.add(objs);
  }

  private createModeTabs(): void {
    this.destroyContainerChildren(this.modeTabsContainer);
    const objs: Phaser.GameObjects.GameObject[] = [];

    const tabs: { label: string; value: LeaderboardGameMode | 'all'; color: string }[] = [
      { label: '全部', value: 'all', color: '#ffffff' },
      { label: LeaderboardModeLabels[LeaderboardGameMode.NORMAL], value: LeaderboardGameMode.NORMAL, color: '#00ffff' },
      { label: LeaderboardModeLabels[LeaderboardGameMode.ENDLESS], value: LeaderboardGameMode.ENDLESS, color: '#ff66ff' },
      { label: LeaderboardModeLabels[LeaderboardGameMode.DUAL], value: LeaderboardGameMode.DUAL, color: '#00ccaa' },
      { label: LeaderboardModeLabels[LeaderboardGameMode.STORY], value: LeaderboardGameMode.STORY, color: '#ff6699' },
      { label: LeaderboardModeLabels[LeaderboardGameMode.RISK_REWARD], value: LeaderboardGameMode.RISK_REWARD, color: '#ff3300' }
    ];

    const tabY = 105;
    const tabWidth = 72;
    const startX = (GameConfig.width - tabs.length * tabWidth) / 2 + tabWidth / 2;

    tabs.forEach((tab, i) => {
      const isSelected = this.currentMode === tab.value;
      const tabX = startX + i * tabWidth;

      const bg = this.add.rectangle(tabX, tabY, tabWidth - 4, 28, isSelected ? 0x00ffff : 0x222244, isSelected ? 0.9 : 0.6);
      bg.setInteractive({ useHandCursor: true });
      objs.push(bg);

      if (isSelected) {
        const border = this.add.graphics();
        border.lineStyle(2, 0x00ffff, 1);
        border.strokeRoundedRect(tabX - (tabWidth - 4) / 2, tabY - 14, tabWidth - 4, 28, 4);
        objs.push(border);
      }

      const label = this.add.text(tabX, tabY, tab.label, {
        fontSize: isSelected ? '13px' : '12px',
        color: isSelected ? '#000022' : tab.color,
        fontStyle: isSelected ? 'bold' : 'normal'
      }).setOrigin(0.5);
      objs.push(label);

      bg.on('pointerover', () => {
        if (!isSelected) {
          bg.setFillStyle(0x333366, 0.8);
          this.audioManager.play('hover');
        }
      });
      bg.on('pointerout', () => {
        if (!isSelected) {
          bg.setFillStyle(0x222244, 0.6);
        }
      });
      bg.on('pointerdown', () => {
        if (this.currentMode !== tab.value) {
          this.audioManager.play('select');
          this.currentMode = tab.value;
          this.currentPage = 0;
          this.createModeTabs();
          this.refreshStats();
          this.refreshList(true);
        }
      });
    });

    this.modeTabsContainer.add(objs);
  }

  private createSortTabs(): void {
    this.destroyContainerChildren(this.sortTabsContainer);
    const objs: Phaser.GameObjects.GameObject[] = [];

    const tabs: { label: string; value: LeaderboardSortType }[] = [
      { label: LeaderboardSortLabels[LeaderboardSortType.HIGH_SCORE], value: LeaderboardSortType.HIGH_SCORE },
      { label: LeaderboardSortLabels[LeaderboardSortType.HIGHEST_FLOOR], value: LeaderboardSortType.HIGHEST_FLOOR },
      { label: LeaderboardSortLabels[LeaderboardSortType.TOTAL_PILLS], value: LeaderboardSortType.TOTAL_PILLS },
      { label: LeaderboardSortLabels[LeaderboardSortType.FASTEST_CLEAR], value: LeaderboardSortType.FASTEST_CLEAR }
    ];

    const tabY = 145;
    const tabWidth = 110;
    const startX = (GameConfig.width - tabs.length * tabWidth) / 2 + tabWidth / 2;

    tabs.forEach((tab, i) => {
      const isSelected = this.currentSort === tab.value;
      const tabX = startX + i * tabWidth;

      const bg = this.add.rectangle(tabX, tabY, tabWidth - 6, 24, isSelected ? 0xffcc00 : 0x222244, isSelected ? 0.9 : 0.5);
      bg.setInteractive({ useHandCursor: true });
      objs.push(bg);

      const label = this.add.text(tabX, tabY, tab.label, {
        fontSize: isSelected ? '13px' : '12px',
        color: isSelected ? '#221100' : '#ffeecc',
        fontStyle: isSelected ? 'bold' : 'normal'
      }).setOrigin(0.5);
      objs.push(label);

      bg.on('pointerover', () => {
        if (!isSelected) {
          bg.setFillStyle(0x443366, 0.7);
          this.audioManager.play('hover');
        }
      });
      bg.on('pointerout', () => {
        if (!isSelected) {
          bg.setFillStyle(0x222244, 0.5);
        }
      });
      bg.on('pointerdown', () => {
        if (this.currentSort !== tab.value) {
          this.audioManager.play('select');
          this.currentSort = tab.value;
          this.currentPage = 0;
          this.createSortTabs();
          this.refreshList(true);
        }
      });
    });

    this.sortTabsContainer.add(objs);
  }

  private refreshStats(): void {
    this.destroyContainerChildren(this.statsContainer);
    const objs: Phaser.GameObjects.GameObject[] = [];

    let bestScore = 0, bestFloor = 0, bestPills = 0, bestTime: number | undefined;

    if (this.currentMode === 'all') {
      const allModes = Object.values(LeaderboardGameMode);
      for (const mode of allModes) {
        const best = this.leaderboardManager.getBestByMode(mode);
        bestScore = Math.max(bestScore, best.bestScore);
        bestFloor = Math.max(bestFloor, best.bestFloor);
        bestPills = Math.max(bestPills, best.bestPills);
        if (best.bestClearTimeMs !== undefined) {
          if (bestTime === undefined || best.bestClearTimeMs < bestTime) {
            bestTime = best.bestClearTimeMs;
          }
        }
      }
    } else {
      const best = this.leaderboardManager.getBestByMode(this.currentMode);
      bestScore = best.bestScore;
      bestFloor = best.bestFloor;
      bestPills = best.bestPills;
      bestTime = best.bestClearTimeMs;
    }

    const panelY = 180;
    const panel = this.add.graphics();
    panel.fillStyle(0x0f0f25, 0.9);
    panel.fillRoundedRect(20, panelY, GameConfig.width - 40, 45, 8);
    panel.lineStyle(1, 0x444466, 0.5);
    panel.strokeRoundedRect(20, panelY, GameConfig.width - 40, 45, 8);
    objs.push(panel);

    const statLabels = [
      { label: '最高分', value: bestScore.toString(), color: '#00ffff' },
      { label: '最高层', value: `${bestFloor}F`, color: '#ff66ff' },
      { label: '药片', value: bestPills.toString(), color: '#00ff88' },
      { label: '最快通关', value: LeaderboardManager.formatClearTime(bestTime), color: '#ffcc00' }
    ];

    const statWidth = (GameConfig.width - 40) / statLabels.length;
    statLabels.forEach((stat, i) => {
      const x = 20 + statWidth * (i + 0.5);
      objs.push(this.add.text(x, panelY + 12, stat.label, {
        fontSize: '10px',
        color: '#8888aa'
      }).setOrigin(0.5));
      objs.push(this.add.text(x, panelY + 30, stat.value, {
        fontSize: '14px',
        color: stat.color,
        fontStyle: 'bold'
      }).setOrigin(0.5));
    });

    this.statsContainer.add(objs);
  }

  private refreshList(resetNav: boolean = false): void {
    this.destroyContainerChildren(this.listContainer);
    const objs: Phaser.GameObjects.GameObject[] = [];

    const allEntries = this.leaderboardManager.getEntries(
      this.currentMode === 'all' ? undefined : this.currentMode,
      this.currentSort
    );

    const totalPages = Math.max(1, Math.ceil(allEntries.length / this.itemsPerPage));
    if (this.currentPage >= totalPages) {
      this.currentPage = totalPages - 1;
    }

    const startIdx = this.currentPage * this.itemsPerPage;
    const pageEntries = allEntries.slice(startIdx, startIdx + this.itemsPerPage);

    const listStartY = 245;
    const rowHeight = 48;

    if (pageEntries.length === 0) {
      const emptyPanel = this.add.graphics();
      emptyPanel.fillStyle(0x0a0a1a, 0.8);
      emptyPanel.fillRoundedRect(20, listStartY, GameConfig.width - 40, 200, 8);
      emptyPanel.lineStyle(2, 0x333355, 0.5);
      emptyPanel.strokeRoundedRect(20, listStartY, GameConfig.width - 40, 200, 8);
      objs.push(emptyPanel);

      objs.push(this.add.text(GameConfig.width / 2, listStartY + 80, '📭 暂无排行榜数据', {
        fontSize: '20px',
        color: '#666688'
      }).setOrigin(0.5));

      objs.push(this.add.text(GameConfig.width / 2, listStartY + 120, '去游戏中创造记录吧！', {
        fontSize: '13px',
        color: '#444466'
      }).setOrigin(0.5));

      this.listContainer.add(objs);
      if (resetNav) this.refreshPageNav(totalPages);
      return;
    }

    pageEntries.forEach((entry, idx) => {
      const globalRank = startIdx + idx + 1;
      const y = listStartY + idx * rowHeight;
      objs.push(...this.createEntryRow(entry, globalRank, y));
    });

    this.listContainer.add(objs);
    if (resetNav) this.refreshPageNav(totalPages);
  }

  private createEntryRow(entry: LeaderboardEntry, rank: number, y: number): Phaser.GameObjects.GameObject[] {
    const objs: Phaser.GameObjects.GameObject[] = [];
    const rowH = 48;

    const isTop3 = rank <= 3;
    const rankColors = ['#ffcc00', '#cccccc', '#cd7f32'];
    const rankHexColors = [0xffcc00, 0xcccccc, 0xcd7f32];
    const bgColor = isTop3 ? 0x221a33 : 0x111128;

    const rowBg = this.add.graphics();
    rowBg.fillStyle(bgColor, 0.8);
    rowBg.fillRoundedRect(20, y, GameConfig.width - 40, rowH - 4, 6);
    if (isTop3) {
      rowBg.lineStyle(2, rankHexColors[rank - 1], 0.8);
    } else {
      rowBg.lineStyle(1, 0x333355, 0.4);
    }
    rowBg.strokeRoundedRect(20, y, GameConfig.width - 40, rowH - 4, 6);
    objs.push(rowBg);

    const rankLabel = rank <= 3 ? ['🥇', '🥈', '🥉'][rank - 1] : `#${rank}`;
    objs.push(this.add.text(40, y + (rowH - 4) / 2, rankLabel, {
      fontSize: isTop3 ? '18px' : '14px',
      color: isTop3 ? rankColors[rank - 1] : '#8888aa',
      fontStyle: 'bold'
    }).setOrigin(0, 0.5));

    const modeLabel = LeaderboardModeLabels[entry.mode];
    const modeColors: Record<LeaderboardGameMode, string> = {
      [LeaderboardGameMode.NORMAL]: '#00ffff',
      [LeaderboardGameMode.ENDLESS]: '#ff66ff',
      [LeaderboardGameMode.DUAL]: '#00ccaa',
      [LeaderboardGameMode.STORY]: '#ff6699',
      [LeaderboardGameMode.RISK_REWARD]: '#ff3300'
    };
    objs.push(this.add.text(80, y + 10, modeLabel, {
      fontSize: '11px',
      color: modeColors[entry.mode]
    }).setOrigin(0, 0.5));

    if (entry.chapterId !== undefined) {
      objs.push(this.add.text(80, y + 28, `第${entry.chapterId}章`, {
        fontSize: '9px',
        color: '#aa8899'
      }).setOrigin(0, 0.5));
    }

    const centerX = GameConfig.width / 2 - 20;
    const mainValue = this.getSortValue(entry);
    const mainColor = this.getSortColor();
    objs.push(this.add.text(centerX, y + (rowH - 4) / 2, mainValue, {
      fontSize: '18px',
      color: mainColor,
      fontStyle: 'bold'
    }).setOrigin(0, 0.5));

    const rightX = GameConfig.width - 30;
    objs.push(this.add.text(rightX, y + 10, `分数:${entry.score} 层:${entry.floor}F`, {
      fontSize: '10px',
      color: '#aabbcc'
    }).setOrigin(1, 0.5));
    objs.push(this.add.text(rightX, y + 28, `💊${entry.pills}  🔥${entry.maxCombo}连  ${entry.date}`, {
      fontSize: '9px',
      color: '#667788'
    }).setOrigin(1, 0.5));

    return objs;
  }

  private getSortValue(entry: LeaderboardEntry): string {
    switch (this.currentSort) {
      case LeaderboardSortType.HIGHEST_FLOOR:
        return `${entry.floor}F`;
      case LeaderboardSortType.TOTAL_PILLS:
        return `${entry.pills} 💊`;
      case LeaderboardSortType.FASTEST_CLEAR:
        return LeaderboardManager.formatClearTime(entry.clearTimeMs);
      case LeaderboardSortType.HIGH_SCORE:
      default:
        return entry.score.toString();
    }
  }

  private getSortColor(): string {
    switch (this.currentSort) {
      case LeaderboardSortType.HIGHEST_FLOOR:
        return '#ff66ff';
      case LeaderboardSortType.TOTAL_PILLS:
        return '#00ff88';
      case LeaderboardSortType.FASTEST_CLEAR:
        return '#ffcc00';
      case LeaderboardSortType.HIGH_SCORE:
      default:
        return '#00ffff';
    }
  }

  private refreshPageNav(totalPages: number): void {
    this.destroyContainerChildren(this.pageNavContainer);
    const objs: Phaser.GameObjects.GameObject[] = [];

    const navY = 655;
    const centerX = GameConfig.width / 2;

    if (totalPages > 1) {
      const prevBtn = this.add.text(centerX - 80, navY, '◀ 上一页', {
        fontSize: '14px',
        color: this.currentPage > 0 ? '#ffffff' : '#444466',
        backgroundColor: this.currentPage > 0 ? '#3344aa' : '#222233',
        padding: { left: 12, right: 12, top: 6, bottom: 6 }
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      objs.push(prevBtn);

      const pageLabel = this.add.text(centerX, navY, `${this.currentPage + 1} / ${totalPages}`, {
        fontSize: '14px',
        color: '#ffeecc',
        fontStyle: 'bold'
      }).setOrigin(0.5);
      objs.push(pageLabel);

      const nextBtn = this.add.text(centerX + 80, navY, '下一页 ▶', {
        fontSize: '14px',
        color: this.currentPage < totalPages - 1 ? '#ffffff' : '#444466',
        backgroundColor: this.currentPage < totalPages - 1 ? '#3344aa' : '#222233',
        padding: { left: 12, right: 12, top: 6, bottom: 6 }
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      objs.push(nextBtn);

      if (this.currentPage > 0) {
        prevBtn.on('pointerover', () => { prevBtn.setBackgroundColor('#4455cc'); this.audioManager.play('hover'); });
        prevBtn.on('pointerout', () => prevBtn.setBackgroundColor('#3344aa'));
        prevBtn.on('pointerdown', () => {
          this.audioManager.play('select');
          this.currentPage--;
          this.refreshList(true);
        });
      }

      if (this.currentPage < totalPages - 1) {
        nextBtn.on('pointerover', () => { nextBtn.setBackgroundColor('#4455cc'); this.audioManager.play('hover'); });
        nextBtn.on('pointerout', () => nextBtn.setBackgroundColor('#3344aa'));
        nextBtn.on('pointerdown', () => {
          this.audioManager.play('select');
          this.currentPage++;
          this.refreshList(true);
        });
      }
    }

    this.pageNavContainer.add(objs);
  }

  private createBackButton(): void {
    this.destroyContainerChildren(this.backButtonContainer);
    const objs: Phaser.GameObjects.GameObject[] = [];

    const btnY = 695;
    const backBtn = this.add.text(GameConfig.width / 2, btnY, '← 返回菜单', {
      fontSize: '18px',
      color: '#ffffff',
      backgroundColor: '#555577',
      padding: { left: 30, right: 30, top: 8, bottom: 8 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    objs.push(backBtn);

    backBtn.on('pointerover', () => { backBtn.setBackgroundColor('#666688'); this.audioManager.play('hover'); });
    backBtn.on('pointerout', () => backBtn.setBackgroundColor('#555577'));
    backBtn.on('pointerdown', () => {
      this.audioManager.play('select');
      this.scene.start('MenuScene');
    });

    this.backButtonContainer.add(objs);
  }
}
