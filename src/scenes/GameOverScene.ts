import Phaser from 'phaser';
import { GameConfig } from '../config/GameConfig';
import { AudioManager } from '../audio/AudioManager';
import { ArchiveManager } from '../utils/ArchiveManager';
import { AchievementManager } from '../utils/AchievementManager';
import { SeasonManager } from '../utils/SeasonManager';
import { AchievementRarityConfig } from '../config/AchievementConfig';
import { SaveManager } from '../utils/SaveManager';
import { ReplayData } from '../types';

export class GameOverScene extends Phaser.Scene {
  private audioManager!: AudioManager;
  private finalScore: number = 0;
  private finalMaxCombo: number = 0;
  private finalMaxNoDamageFloors: number = 0;
  private isNewHighScore: boolean = false;
  private isNewMaxCombo: boolean = false;
  private isNewMaxNoDamage: boolean = false;
  private savedHighScore: number = 0;
  private maxAddiction: number = 0;
  private hallucinations: number = 0;
  private lossOfControl: number = 0;
  private shopShields: number = 0;
  private shopSlowPulses: number = 0;
  private shopBounces: number = 0;
  private shopPillsSpent: number = 0;
  private replayData: ReplayData | null = null;
  private saveManager!: SaveManager;
  private replaySaved: boolean = false;

  constructor() {
    super('GameOverScene');
  }

  init(data: {
    score: number;
    pills: number;
    floor: number;
    maxCombo?: number;
    maxNoDamageFloors?: number;
    isNewHighScore?: boolean;
    isNewMaxCombo?: boolean;
    isNewMaxNoDamage?: boolean;
    savedHighScore?: number;
    maxAddiction?: number;
    hallucinations?: number;
    lossOfControl?: number;
    shopShields?: number;
    shopSlowPulses?: number;
    shopBounces?: number;
    shopPillsSpent?: number;
    replayData?: ReplayData;
  }): void {
    this.audioManager = AudioManager.getInstance();
    this.saveManager = SaveManager.getInstance();
    this.finalScore = data.score;
    this.finalMaxCombo = data.maxCombo || 0;
    this.finalMaxNoDamageFloors = data.maxNoDamageFloors || 0;
    this.isNewHighScore = !!data.isNewHighScore;
    this.isNewMaxCombo = !!data.isNewMaxCombo;
    this.isNewMaxNoDamage = !!data.isNewMaxNoDamage;
    this.savedHighScore = data.savedHighScore ?? data.score;
    this.maxAddiction = data.maxAddiction || 0;
    this.hallucinations = data.hallucinations || 0;
    this.lossOfControl = data.lossOfControl || 0;
    this.shopShields = data.shopShields || 0;
    this.shopSlowPulses = data.shopSlowPulses || 0;
    this.shopBounces = data.shopBounces || 0;
    this.shopPillsSpent = data.shopPillsSpent || 0;
    this.replayData = data.replayData || null;
    this.replaySaved = false;
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#0a0a1a');

    this.add.rectangle(GameConfig.width / 2, 0, GameConfig.width, GameConfig.height, 0x000000, 0.8);

    this.add.text(GameConfig.width / 2, 100, '游戏结束', {
      fontSize: '48px',
      color: '#ff0066',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    let nextY = 160;

    if (this.isNewHighScore) {
      const newRecord = this.add.text(GameConfig.width / 2, nextY, '★ 新纪录! ★', {
        fontSize: '24px',
        color: '#ffcc00',
        fontStyle: 'bold'
      }).setOrigin(0.5);

      this.tweens.add({
        targets: newRecord,
        scale: { from: 1, to: 1.2 },
        duration: 500,
        yoyo: true,
        repeat: -1
      });
      nextY += 40;
    }

    this.add.text(GameConfig.width / 2, nextY, '得分', {
      fontSize: '20px',
      color: '#888888'
    }).setOrigin(0.5);
    nextY += 35;

    this.add.text(GameConfig.width / 2, nextY, this.finalScore.toString(), {
      fontSize: '64px',
      color: '#00ffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    nextY += 55;

    this.add.text(GameConfig.width / 2, nextY, `最高分: ${this.savedHighScore}`, {
      fontSize: '18px',
      color: '#ffcc00'
    }).setOrigin(0.5);
    nextY += 40;

    const comboLabel = this.add.text(GameConfig.width / 2, nextY, `最高连击: ${this.finalMaxCombo}`, {
      fontSize: '20px',
      color: this.isNewMaxCombo ? '#ffff00' : '#ff66ff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    if (this.isNewMaxCombo && this.finalMaxCombo > 0) {
      comboLabel.setText(`最高连击: ${this.finalMaxCombo} ★新纪录!`);
      this.tweens.add({
        targets: comboLabel,
        scale: { from: 1, to: 1.15 },
        duration: 500,
        yoyo: true,
        repeat: -1
      });
    }
    nextY += 35;

    const noDamageLabel = this.add.text(GameConfig.width / 2, nextY, `无伤连层: ${this.finalMaxNoDamageFloors}`, {
      fontSize: '20px',
      color: this.isNewMaxNoDamage ? '#ffff00' : '#66ff66',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    if (this.isNewMaxNoDamage && this.finalMaxNoDamageFloors > 0) {
      noDamageLabel.setText(`无伤连层: ${this.finalMaxNoDamageFloors} ★新纪录!`);
      this.tweens.add({
        targets: noDamageLabel,
        scale: { from: 1, to: 1.15 },
        duration: 500,
        yoyo: true,
        repeat: -1
      });
    }
    nextY += 35;

    if (this.maxAddiction > 0 || this.hallucinations > 0 || this.lossOfControl > 0) {
      const addictionColor = this.maxAddiction >= 90 ? '#ff0000' :
                             this.maxAddiction >= 75 ? '#ff0066' :
                             this.maxAddiction >= 50 ? '#ffaa00' :
                             this.maxAddiction >= 25 ? '#ffcc00' : '#888888';
      this.add.text(GameConfig.width / 2, nextY, `最高成瘾: ${Math.floor(this.maxAddiction)}%`, {
        fontSize: '16px',
        color: addictionColor,
        fontStyle: 'bold'
      }).setOrigin(0.5);
      nextY += 25;

      if (this.hallucinations > 0) {
        this.add.text(GameConfig.width / 2, nextY, `幻觉发作: ${this.hallucinations}次`, {
          fontSize: '14px',
          color: '#ff00ff'
        }).setOrigin(0.5);
        nextY += 22;
      }

      if (this.lossOfControl > 0) {
        this.add.text(GameConfig.width / 2, nextY, `失控发作: ${this.lossOfControl}次`, {
          fontSize: '14px',
          color: '#ff0066'
        }).setOrigin(0.5);
        nextY += 22;
      }
    }

    if (this.shopShields > 0 || this.shopSlowPulses > 0 || this.shopBounces > 0 || this.shopPillsSpent > 0) {
      nextY += 10;
      this.add.text(GameConfig.width / 2, nextY, '—— 商店使用 ——', {
        fontSize: '14px',
        color: '#6666ff',
        fontStyle: 'bold'
      }).setOrigin(0.5);
      nextY += 24;

      if (this.shopShields > 0) {
        this.add.text(GameConfig.width / 2, nextY, `🛡 护盾: ${this.shopShields}次`, {
          fontSize: '13px',
          color: '#ff00ff'
        }).setOrigin(0.5);
        nextY += 20;
      }
      if (this.shopSlowPulses > 0) {
        this.add.text(GameConfig.width / 2, nextY, `❄ 减速脉冲: ${this.shopSlowPulses}次`, {
          fontSize: '13px',
          color: '#0088ff'
        }).setOrigin(0.5);
        nextY += 20;
      }
      if (this.shopBounces > 0) {
        this.add.text(GameConfig.width / 2, nextY, `⬆ 紧急弹跳: ${this.shopBounces}次`, {
          fontSize: '13px',
          color: '#00ff88'
        }).setOrigin(0.5);
        nextY += 20;
      }
      if (this.shopPillsSpent > 0) {
        this.add.text(GameConfig.width / 2, nextY, `💊 消耗药片: ${this.shopPillsSpent}`, {
          fontSize: '13px',
          color: '#ffff66',
          fontStyle: 'bold'
        }).setOrigin(0.5);
        nextY += 20;
      }
    }

    if (this.replayData?.deathReason) {
      nextY += 15;
      this.add.text(GameConfig.width / 2, nextY, '—— 死亡原因 ——', {
        fontSize: '14px',
        color: '#ff6666',
        fontStyle: 'bold'
      }).setOrigin(0.5);
      nextY += 26;
      this.add.text(GameConfig.width / 2, nextY, this.replayData.deathReason, {
        fontSize: '20px',
        color: '#ff3333',
        fontStyle: 'bold'
      }).setOrigin(0.5);
      nextY += 35;
    }
    nextY += 10;

    if (this.replayData) {
      const viewReplayBtn = this.add.text(GameConfig.width / 2, nextY, '📋 查看局内复盘', {
        fontSize: '18px',
        color: '#66ffff',
        backgroundColor: '#112244',
        padding: { left: 25, right: 25, top: 8, bottom: 8 }
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      nextY += 55;

      viewReplayBtn.on('pointerover', () => {
        viewReplayBtn.setBackgroundColor('#113366');
        this.audioManager.play('hover');
      });
      viewReplayBtn.on('pointerout', () => {
        viewReplayBtn.setBackgroundColor('#112244');
      });
      viewReplayBtn.on('pointerdown', () => {
        this.audioManager.play('select');
        if (this.replayData) {
          this.scene.start('ReplayScene', { replayData: this.replayData, fromHistory: false });
        }
      });

      const saveReplayBtn = this.add.text(GameConfig.width / 2, nextY, this.replaySaved ? '✓ 已保存到历史记录' : '💾 保存到历史记录', {
        fontSize: '16px',
        color: this.replaySaved ? '#66ff66' : '#ffff66',
        backgroundColor: this.replaySaved ? '#113311' : '#333311',
        padding: { left: 20, right: 20, top: 6, bottom: 6 }
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      nextY += 50;

      saveReplayBtn.on('pointerover', () => {
        if (!this.replaySaved) {
          saveReplayBtn.setBackgroundColor('#444422');
          this.audioManager.play('hover');
        }
      });
      saveReplayBtn.on('pointerout', () => {
        if (!this.replaySaved) {
          saveReplayBtn.setBackgroundColor('#333311');
        }
      });
      saveReplayBtn.on('pointerdown', () => {
        if (!this.replaySaved && this.replayData) {
          this.audioManager.play('select');
          this.saveManager.addReplayToHistory(this.replayData);
          this.replaySaved = true;
          saveReplayBtn.setText('✓ 已保存到历史记录');
          saveReplayBtn.setColor('#66ff66');
          saveReplayBtn.setBackgroundColor('#113311');
        }
      });

      const historyBtn = this.add.text(GameConfig.width / 2, nextY, '📚 查看历史记录', {
        fontSize: '16px',
        color: '#cc99ff',
        backgroundColor: '#221133',
        padding: { left: 20, right: 20, top: 6, bottom: 6 }
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      nextY += 50;

      historyBtn.on('pointerover', () => {
        historyBtn.setBackgroundColor('#331155');
        this.audioManager.play('hover');
      });
      historyBtn.on('pointerout', () => {
        historyBtn.setBackgroundColor('#221133');
      });
      historyBtn.on('pointerdown', () => {
        this.audioManager.play('select');
        this.scene.start('ReplayScene', { fromHistory: true });
      });
    }
    nextY += 10;

    const restartBtn = this.add.text(GameConfig.width / 2, nextY, '再来一次', {
      fontSize: '28px',
      color: '#ffffff',
      backgroundColor: '#ff0066',
      padding: { left: 30, right: 30, top: 12, bottom: 12 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    nextY += 70;

    restartBtn.on('pointerover', () => {
      restartBtn.setBackgroundColor('#ff3385');
      this.audioManager.play('hover');
    });

    restartBtn.on('pointerout', () => {
      restartBtn.setBackgroundColor('#ff0066');
    });

    restartBtn.on('pointerdown', () => {
      this.audioManager.play('select');
      this.scene.start('GameScene');
    });

    const menuBtn = this.add.text(GameConfig.width / 2, nextY, '返回菜单', {
      fontSize: '22px',
      color: '#888888',
      backgroundColor: '#222222',
      padding: { left: 25, right: 25, top: 10, bottom: 10 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    menuBtn.on('pointerover', () => {
      menuBtn.setBackgroundColor('#333333');
      menuBtn.setColor('#ffffff');
      this.audioManager.play('hover');
    });

    menuBtn.on('pointerout', () => {
      menuBtn.setBackgroundColor('#222222');
      menuBtn.setColor('#888888');
    });

    menuBtn.on('pointerdown', () => {
      this.audioManager.play('select');
      this.scene.start('MenuScene');
    });

    this.checkAndShowNewUnlocks();
  }

  private checkAndShowNewUnlocks(): void {
    const archiveManager = ArchiveManager.getInstance();
    const archiveResult = archiveManager.checkAllArchives();

    const achievementManager = AchievementManager.getInstance();
    const achievementResult = achievementManager.checkAllAchievements();

    const seasonManager = SeasonManager.getInstance();
    seasonManager.checkReset();
    const hasNewSeasonTasks = seasonManager.hasNewlyCompletedTasks();
    const seasonClaimable = seasonManager.getClaimableCount();

    const hasNew = archiveResult.newlyUnlocked.length > 0 || achievementResult.newlyUnlocked.length > 0 || hasNewSeasonTasks || seasonClaimable > 0;

    if (hasNew) {
      let notifY = GameConfig.height - 130;
      let notifHeight = 70;

      if (achievementResult.newlyUnlocked.length > 0) {
        notifHeight += 30 + achievementResult.newlyUnlocked.length * 26;
      }
      if (archiveResult.newlyUnlocked.length > 0) {
        notifHeight += 30;
      }
      if (hasNewSeasonTasks || seasonClaimable > 0) {
        notifHeight += 45;
      }

      notifY = GameConfig.height - notifHeight - 10;

      const tweenTargets: Phaser.GameObjects.GameObject[] = [];

      const notifBg = this.add.graphics();
      notifBg.fillStyle(0x150022, 0.97);
      notifBg.fillRoundedRect(20, notifY, GameConfig.width - 40, notifHeight, 12);
      notifBg.lineStyle(2, 0xffcc00, 0.9);
      notifBg.strokeRoundedRect(20, notifY, GameConfig.width - 40, notifHeight, 12);
      notifBg.setDepth(100);
      tweenTargets.push(notifBg);

      let currentY = notifY + 20;

      if (achievementResult.newlyUnlocked.length > 0) {
        const achTitle = this.add.text(
          GameConfig.width / 2,
          currentY,
          '🏆 新成就解锁！',
          {
            fontSize: '17px',
            color: '#ffcc00',
            fontStyle: 'bold'
          }
        ).setOrigin(0.5).setDepth(101);
        tweenTargets.push(achTitle);
        currentY += 22;

        achievementResult.newlyUnlocked.forEach(ach => {
          const rarityConfig = AchievementRarityConfig[ach.rarity];
          this.add.text(
            GameConfig.width / 2,
            currentY,
            `${ach.icon} ${ach.name} — 称号: "${ach.title}"`,
            {
              fontSize: '13px',
              color: rarityConfig.color,
              fontStyle: 'bold'
            }
          ).setOrigin(0.5).setDepth(101);
          currentY += 24;
        });
        currentY += 6;
      }

      if (archiveResult.newlyUnlocked.length > 0) {
        const names = archiveResult.newlyUnlocked.map(u => u.name).join('、');
        this.add.text(
          GameConfig.width / 2,
          currentY,
          '🎉 新档案解锁！',
          {
            fontSize: '15px',
            color: '#cc99ff',
            fontStyle: 'bold'
          }
        ).setOrigin(0.5).setDepth(101);
        currentY += 20;

        this.add.text(
          GameConfig.width / 2,
          currentY,
          names,
          {
            fontSize: '12px',
            color: '#ffffff',
            wordWrap: { width: GameConfig.width - 80 }
          }
        ).setOrigin(0.5).setDepth(101);
        currentY += 24;
      }

      if (hasNewSeasonTasks || seasonClaimable > 0) {
        const seasonMsg = seasonClaimable > 0
          ? `🏅 赛季任务更新！${seasonClaimable} 个奖励可领取`
          : '🏅 赛季任务有新进展！';
        const seasonText = this.add.text(
          GameConfig.width / 2,
          currentY,
          seasonMsg,
          {
            fontSize: '14px',
            color: '#66ffff',
            fontStyle: 'bold'
          }
        ).setOrigin(0.5).setDepth(101).setInteractive({ useHandCursor: true });
        tweenTargets.push(seasonText);
        currentY += 20;

        const goSeason = this.add.text(
          GameConfig.width / 2,
          currentY,
          '[点击查看赛季进度]',
          {
            fontSize: '11px',
            color: '#ffaa66',
            fontStyle: 'italic'
          }
        ).setOrigin(0.5).setDepth(101).setInteractive({ useHandCursor: true });
        tweenTargets.push(goSeason);

        seasonText.on('pointerdown', () => {
          this.audioManager.play('select');
          this.scene.start('SeasonScene');
        });
        goSeason.on('pointerdown', () => {
          this.audioManager.play('select');
          this.scene.start('SeasonScene');
        });
      }

      this.tweens.add({
        targets: tweenTargets,
        alpha: { from: 0, to: 1 },
        duration: 600,
        ease: 'Sine.easeOut'
      });
    }
  }
}
