import Phaser from 'phaser';
import { GameConfig } from '../config/GameConfig';
import { AudioManager } from '../audio/AudioManager';
import { SeasonManager, SeasonClaimResult } from '../utils/SeasonManager';
import { SeasonRewardRarity } from '../config/SeasonConfig';
import { SeasonTask } from '../types';

type TabType = 'weekly' | 'cumulative';

export class SeasonScene extends Phaser.Scene {
  private audioManager!: AudioManager;
  private seasonManager!: SeasonManager;

  private headerContainer!: Phaser.GameObjects.Container;
  private tabContainer!: Phaser.GameObjects.Container;
  private taskListContainer!: Phaser.GameObjects.Container;
  private detailPanel!: Phaser.GameObjects.Container;
  private backButtonContainer!: Phaser.GameObjects.Container;
  private toastContainer!: Phaser.GameObjects.Container;

  private currentTab: TabType = 'weekly';
  private selectedTask: SeasonTask | null = null;
  private claimAnimationActive: boolean = false;

  constructor() {
    super('SeasonScene');
  }

  create(): void {
    this.audioManager = AudioManager.getInstance();
    this.seasonManager = SeasonManager.getInstance();
    this.seasonManager.clearNewlyCompleted();
    this.seasonManager.checkReset();

    this.cameras.main.setBackgroundColor('#0a0a1a');

    this.headerContainer = this.add.container(0, 0);
    this.tabContainer = this.add.container(0, 0);
    this.taskListContainer = this.add.container(0, 0);
    this.detailPanel = this.add.container(0, 0);
    this.backButtonContainer = this.add.container(0, 0);
    this.toastContainer = this.add.container(0, 0).setDepth(1000);

    this.createHeader();
    this.createTabs();
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

    objs.push(this.add.rectangle(GameConfig.width / 2, 55, GameConfig.width, 110, 0x151535, 1));
    objs.push(this.add.rectangle(GameConfig.width / 2, 108, GameConfig.width, 2, 0xff0066, 0.8));

    const seasonData = this.seasonManager.getSeasonData();
    const seasonInfo = seasonData.currentSeason;

    objs.push(this.add.text(GameConfig.width / 2, 20, `${seasonInfo.icon} ${seasonInfo.name}`, {
      fontSize: '22px',
      color: '#ffcc00',
      fontStyle: 'bold'
    }).setOrigin(0.5));

    objs.push(this.add.text(GameConfig.width / 2, 42, seasonInfo.description, {
      fontSize: '11px',
      color: '#888888',
      wordWrap: { width: GameConfig.width - 40 }
    }).setOrigin(0.5));

    const levelData = this.seasonManager.getLevelProgress();
    objs.push(this.add.text(35, 75, `Lv.${levelData.currentLevel}`, {
      fontSize: '16px',
      color: '#00ffff',
      fontStyle: 'bold'
    }).setOrigin(0, 0.5));

    const barWidth = GameConfig.width - 160;
    const barBg = this.add.graphics();
    barBg.fillStyle(0x222244, 1);
    barBg.fillRoundedRect(80, 69, barWidth, 12, 6);
    objs.push(barBg);

    const barFill = this.add.graphics();
    barFill.fillStyle(0xffcc00, 1);
    barFill.fillRoundedRect(80, 69, barWidth * (levelData.progressPercent / 100), 12, 6);
    objs.push(barFill);

    const expText = levelData.expToNext === 0
      ? 'MAX'
      : `${levelData.currentExp}/${levelData.expToNext} EXP`;
    objs.push(this.add.text(GameConfig.width - 35, 75, expText, {
      fontSize: '11px',
      color: '#cccccc'
    }).setOrigin(1, 0.5));

    objs.push(this.add.text(40, 95, `赛季积分: ${seasonData.totalSeasonPoints}`, {
      fontSize: '12px',
      color: '#66ffff'
    }));

    const resetTime = this.seasonManager.getTimeUntilWeeklyReset();
    objs.push(this.add.text(GameConfig.width - 40, 95,
      `周常重置: ${resetTime.days}天${resetTime.hours}时${resetTime.minutes}分`, {
      fontSize: '12px',
      color: '#ff9966'
    }).setOrigin(1, 0));

    this.headerContainer.add(objs);
  }

  private createTabs(): void {
    this.destroyContainerChildren(this.tabContainer);

    const tabs: { label: string; value: TabType; color: string }[] = [
      { label: '周常任务', value: 'weekly', color: '#66ffff' },
      { label: '赛季成就', value: 'cumulative', color: '#ff66ff' }
    ];

    const tabWidth = (GameConfig.width - 40) / tabs.length;
    const y = 128;

    tabs.forEach((tab, i) => {
      const isSelected = this.currentTab === tab.value;
      const bg = this.add.graphics();
      bg.fillStyle(isSelected ? 0xff0066 : 0x1a1a3a, 1);
      bg.fillRoundedRect(20 + i * tabWidth + 2, y, tabWidth - 4, 30, 6);
      if (isSelected) {
        bg.lineStyle(2, 0xffcc00, 1);
        bg.strokeRoundedRect(20 + i * tabWidth + 2, y, tabWidth - 4, 30, 6);
      }
      this.tabContainer.add(bg);

      let label = tab.label;
      let badgeCount = 0;
      if (tab.value === 'weekly') {
        badgeCount = this.seasonManager.getSeasonData().weeklyTaskProgress.filter(p => !p.isClaimed && p.isCompleted).length;
        label += ` (${this.seasonManager.getWeeklyProgressPercent()}%)`;
      } else {
        badgeCount = this.seasonManager.getSeasonData().cumulativeTaskProgress.filter(p => !p.isClaimed && p.isCompleted).length;
        label += ` (${this.seasonManager.getCumulativeProgressPercent()}%)`;
      }

      if (badgeCount > 0) {
        label += ' 🔔';
      }

      const text = this.add.text(20 + i * tabWidth + tabWidth / 2, y + 15, label, {
        fontSize: '13px',
        color: isSelected ? '#ffffff' : tab.color,
        fontStyle: isSelected ? 'bold' : 'normal'
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      text.on('pointerover', () => {
        if (!isSelected) {
          bg.fillStyle(0x2a2a5a, 1);
          bg.fillRoundedRect(20 + i * tabWidth + 2, y, tabWidth - 4, 30, 6);
        }
      });

      text.on('pointerout', () => {
        if (!isSelected) {
          bg.fillStyle(0x1a1a3a, 1);
          bg.fillRoundedRect(20 + i * tabWidth + 2, y, tabWidth - 4, 30, 6);
        }
      });

      text.on('pointerdown', () => {
        this.audioManager.play('select');
        this.currentTab = tab.value;
        this.selectedTask = null;
        this.createTabs();
        this.refreshList(true);
      });

      this.tabContainer.add(text);
    });

    if (this.seasonManager.hasClaimableRewards()) {
      const claimAllBtn = this.add.text(GameConfig.width / 2, 174, '✨ 领取所有奖励 ✨', {
        fontSize: '14px',
        color: '#ffffff',
        backgroundColor: '#ffaa00',
        padding: { left: 15, right: 15, top: 6, bottom: 6 },
        fontStyle: 'bold'
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      this.tweens.add({
        targets: claimAllBtn,
        scale: { from: 1, to: 1.03 },
        duration: 800,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });

      claimAllBtn.on('pointerover', () => claimAllBtn.setBackgroundColor('#ffbb33'));
      claimAllBtn.on('pointerout', () => claimAllBtn.setBackgroundColor('#ffaa00'));
      claimAllBtn.on('pointerdown', () => {
        this.audioManager.play('select');
        this.onClaimAll();
      });

      this.tabContainer.add(claimAllBtn);
    }
  }

  private getTasksForCurrentTab(): SeasonTask[] {
    return this.currentTab === 'weekly'
      ? this.seasonManager.getWeeklyTasks()
      : this.seasonManager.getCumulativeTasks();
  }

  private refreshList(clearSelection: boolean): void {
    if (clearSelection) this.selectedTask = null;
    this.destroyContainerChildren(this.taskListContainer);
    this.destroyContainerChildren(this.detailPanel);

    const tasks = this.getTasksForCurrentTab();
    const listStartY = 200;
    const itemHeight = 85;

    tasks.forEach((task, i) => {
      const y = listStartY + i * (itemHeight + 6);
      this.createTaskItem(task, y);
    });

    if (tasks.length === 0) {
      const emptyText = this.add.text(GameConfig.width / 2, listStartY + 100, '暂无任务', {
        fontSize: '16px',
        color: '#666666'
      }).setOrigin(0.5);
      this.taskListContainer.add(emptyText);
    }

    if (this.selectedTask) {
      this.showDetailPanel(this.selectedTask);
    }
  }

  private createTaskItem(task: SeasonTask, y: number): void {
    const progress = this.seasonManager.getTaskProgress(task.id);
    if (!progress) return;

    const isSelected = this.selectedTask?.id === task.id;
    const canClaim = progress.isCompleted && !progress.isClaimed;

    let rarityConfig;
    if (task.targetValue >= 50000) {
      rarityConfig = SeasonRewardRarity.legendary;
    } else if (task.targetValue >= 10000) {
      rarityConfig = SeasonRewardRarity.epic;
    } else if (task.targetValue >= 3000) {
      rarityConfig = SeasonRewardRarity.rare;
    } else {
      rarityConfig = SeasonRewardRarity.common;
    }

    const item = this.add.container(0, y);

    const bgColor = progress.isClaimed ? 0x1a1a2a : (progress.isCompleted ? rarityConfig.bgColor : 0x151525);
    const bg = this.add.graphics();
    bg.fillStyle(bgColor, 1);
    bg.fillRoundedRect(20, 0, GameConfig.width - 40, 83, 10);
    const borderColor = isSelected ? 0xffff00 : (canClaim ? 0xffaa00 : (progress.isCompleted ? rarityConfig.borderColor : 0x333344));
    bg.lineStyle(isSelected || canClaim ? 3 : 2, borderColor, 1);
    bg.strokeRoundedRect(20, 0, GameConfig.width - 40, 83, 10);
    item.add(bg);

    if (canClaim && !this.claimAnimationActive) {
      this.tweens.add({
        targets: bg,
        alpha: { from: 0.7, to: 1 },
        duration: 600,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }

    const iconBg = this.add.graphics();
    iconBg.fillStyle(progress.isClaimed ? 0x222233 : rarityConfig.borderColor, progress.isClaimed ? 0.2 : 0.35);
    iconBg.fillRoundedRect(30, 6, 62, 62, 8);
    item.add(iconBg);

    const iconColor = progress.isClaimed ? '#444455' : '#ffffff';
    item.add(this.add.text(61, 37, task.icon, {
      fontSize: '30px',
      color: iconColor
    }).setOrigin(0.5));

    const textColor = progress.isClaimed ? '#555566' : '#ffffff';
    item.add(this.add.text(105, 10, task.name, {
      fontSize: '15px',
      color: textColor,
      fontStyle: 'bold'
    }).setOrigin(0, 0));

    item.add(this.add.text(105, 30, task.description, {
      fontSize: '11px',
      color: progress.isClaimed ? '#444455' : '#aaaaaa',
      wordWrap: { width: GameConfig.width - 170 }
    }).setOrigin(0, 0));

    const progWidth = GameConfig.width - 240;
    const progBg = this.add.graphics();
    progBg.fillStyle(0x222244, 1);
    progBg.fillRoundedRect(105, 53, progWidth, 10, 5);
    item.add(progBg);

    const progPercent = Math.min(100, (progress.currentValue / progress.targetValue) * 100);
    const progColor = progress.isCompleted ? (progress.isClaimed ? 0x555566 : 0x00ff66) : 0x00aaff;
    const progFill = this.add.graphics();
    progFill.fillStyle(progColor, 1);
    progFill.fillRoundedRect(105, 53, progWidth * (progPercent / 100), 10, 5);
    item.add(progFill);

    item.add(this.add.text(GameConfig.width - 130, 58,
      `${progress.currentValue}/${progress.targetValue}`, {
      fontSize: '11px',
      color: progress.isClaimed ? '#555566' : '#cccccc',
      fontStyle: 'bold'
    }).setOrigin(0, 0.5));

    if (progress.isClaimed) {
      item.add(this.add.text(GameConfig.width - 38, 40, '✓', {
        fontSize: '22px',
        color: '#666677',
        fontStyle: 'bold'
      }).setOrigin(0.5));
    } else if (progress.isCompleted) {
      const claimBtn = this.add.text(GameConfig.width - 40, 40, '🎁', {
        fontSize: '24px'
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      claimBtn.on('pointerover', () => claimBtn.setScale(1.2));
      claimBtn.on('pointerout', () => claimBtn.setScale(1));
      claimBtn.on('pointerdown', () => {
        this.audioManager.play('select');
        this.onClaimTask(task.id);
      });

      item.add(claimBtn);
    } else {
      item.add(this.add.text(GameConfig.width - 38, 40, '🔒', {
        fontSize: '18px',
        color: '#555566'
      }).setOrigin(0.5));
    }

    const rewardPreview = task.rewards.map(r => r.icon).join(' ');
    item.add(this.add.text(105, 70, `奖励: ${rewardPreview}`, {
      fontSize: '10px',
      color: progress.isClaimed ? '#444455' : '#ffcc66'
    }));

    item.setSize(GameConfig.width, 83);
    item.setInteractive(new Phaser.Geom.Rectangle(20, 0, GameConfig.width - 40, 83), Phaser.Geom.Rectangle.Contains);

    item.on('pointerdown', () => {
      this.audioManager.play('select');
      const willShow = this.selectedTask?.id !== task.id;
      this.selectedTask = willShow ? task : null;
      this.refreshList(false);
    });

    this.taskListContainer.add(item);
  }

  private showDetailPanel(task: SeasonTask): void {
    this.destroyContainerChildren(this.detailPanel);
    const progress = this.seasonManager.getTaskProgress(task.id);
    if (!progress) return;

    const panelY = 615;
    const panelHeight = 95;

    const bg = this.add.graphics();
    bg.fillStyle(0x0a0a20, 0.98);
    bg.fillRoundedRect(15, 0, GameConfig.width - 30, panelHeight, 10);
    bg.lineStyle(2, 0xffaa00, 1);
    bg.strokeRoundedRect(15, 0, GameConfig.width - 30, panelHeight, 10);
    this.detailPanel.add(bg);

    this.detailPanel.add(this.add.text(GameConfig.width / 2, 18, `${task.icon} ${task.name}`, {
      fontSize: '16px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5));

    this.detailPanel.add(this.add.text(GameConfig.width / 2, 40, task.description, {
      fontSize: '12px',
      color: '#cccccc',
      wordWrap: { width: GameConfig.width - 60 }
    }).setOrigin(0.5));

    let rewardText = task.rewards.map(r => r.label).join('  |  ');
    const progPercent = Math.min(100, Math.floor((progress.currentValue / progress.targetValue) * 100));
    rewardText += `  (${progPercent}%)`;

    this.detailPanel.add(this.add.text(GameConfig.width / 2, 63, rewardText, {
      fontSize: '11px',
      color: '#ffcc66',
      fontStyle: 'bold'
    }).setOrigin(0.5));

    if (progress.isCompleted && !progress.isClaimed) {
      const claimBtn = this.add.text(GameConfig.width / 2, 85, '🎁 点击领取奖励', {
        fontSize: '13px',
        color: '#ffffff',
        backgroundColor: '#ffaa00',
        padding: { left: 15, right: 15, top: 4, bottom: 4 },
        fontStyle: 'bold'
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      claimBtn.on('pointerover', () => claimBtn.setBackgroundColor('#ffbb33'));
      claimBtn.on('pointerout', () => claimBtn.setBackgroundColor('#ffaa00'));
      claimBtn.on('pointerdown', () => {
        this.audioManager.play('select');
        this.onClaimTask(task.id);
      });

      this.detailPanel.add(claimBtn);
    } else if (progress.isClaimed) {
      this.detailPanel.add(this.add.text(GameConfig.width / 2, 85, '✓ 奖励已领取', {
        fontSize: '13px',
        color: '#00ff66',
        fontStyle: 'bold'
      }).setOrigin(0.5));
    }

    this.detailPanel.setPosition(0, panelY);
  }

  private onClaimTask(taskId: string): void {
    const result = this.seasonManager.claimReward(taskId);
    if (result) {
      this.showClaimToast(result);
      this.audioManager.play('select');
      this.refreshHeaderAndTabs();
    }
  }

  private onClaimAll(): void {
    const results = this.seasonManager.claimAllAvailable();
    if (results.length > 0) {
      this.claimAnimationActive = true;
      let delay = 0;
      results.forEach((result, i) => {
        this.time.delayedCall(delay, () => {
          this.showClaimToast(result);
          if (i === results.length - 1) {
            this.time.delayedCall(1500, () => {
              this.claimAnimationActive = false;
              this.refreshHeaderAndTabs();
            });
          }
        });
        delay += 350;
      });
    }
  }

  private refreshHeaderAndTabs(): void {
    this.createHeader();
    this.createTabs();
    this.refreshList(false);
  }

  private showClaimToast(result: SeasonClaimResult): void {
    const toast = this.add.container(0, 0);
    const bgHeight = 60;
    const y = GameConfig.height - 180;

    const bg = this.add.graphics();
    bg.fillStyle(0x1a0022, 0.97);
    bg.fillRoundedRect(40, y, GameConfig.width - 80, bgHeight, 12);
    bg.lineStyle(3, 0xffcc00, 1);
    bg.strokeRoundedRect(40, y, GameConfig.width - 80, bgHeight, 12);
    toast.add(bg);

    toast.add(this.add.text(GameConfig.width / 2, y + 15, `🎉 ${result.task.name} 完成!`, {
      fontSize: '14px',
      color: '#ffcc00',
      fontStyle: 'bold'
    }).setOrigin(0.5));

    const rewardStr = result.rewards.map(r => `${r.icon} ${r.label}`).join('   ');
    toast.add(this.add.text(GameConfig.width / 2, y + 40, rewardStr, {
      fontSize: '12px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5));

    this.toastContainer.add(toast);

    this.tweens.add({
      targets: toast,
      alpha: { from: 0, to: 1 },
      y: { from: y + 30, to: y },
      duration: 400,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: toast,
          alpha: { from: 1, to: 0 },
          y: { from: y, to: y - 30 },
          duration: 600,
          delay: 1500,
          ease: 'Sine.easeIn',
          onComplete: () => toast.destroy()
        });
      }
    });
  }

  private createBackButton(): void {
    this.destroyContainerChildren(this.backButtonContainer);

    const backBtn = this.add.text(GameConfig.width / 2, GameConfig.height - 22, '← 返回菜单', {
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

    this.backButtonContainer.add(backBtn);
  }
}
