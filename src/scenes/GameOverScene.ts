import Phaser from 'phaser';
import { GameConfig } from '../config/GameConfig';
import { AudioManager } from '../audio/AudioManager';
import { ArchiveManager } from '../utils/ArchiveManager';
import { AchievementManager } from '../utils/AchievementManager';
import { SeasonManager } from '../utils/SeasonManager';
import { AchievementRarityConfig } from '../config/AchievementConfig';
import { SaveManager } from '../utils/SaveManager';
import { ReplayData, ReplayEventType } from '../types';

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
        this.showReplayPanel();
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
        this.showReplayHistoryPanel();
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

  private getReplayEventColor(type: ReplayEventType): string {
    switch (type) {
      case ReplayEventType.FLOOR_CHANGE: return '#66ccff';
      case ReplayEventType.COLLISION_GUARD: return '#ff4444';
      case ReplayEventType.COLLISION_PILL: return '#ff99ff';
      case ReplayEventType.COLLISION_FALL: return '#ff6600';
      case ReplayEventType.COLLISION_TRAP: return '#ffaa00';
      case ReplayEventType.SCORE_SURVIVAL: return '#88ff88';
      case ReplayEventType.SCORE_FLOOR: return '#66ffcc';
      case ReplayEventType.SCORE_COMBO: return '#ffcc66';
      case ReplayEventType.SCORE_PILL: return '#ff99ff';
      case ReplayEventType.SCORE_NODAMAGE: return '#aaff66';
      default: return '#aaaaaa';
    }
  }

  private getReplayEventIcon(type: ReplayEventType): string {
    switch (type) {
      case ReplayEventType.FLOOR_CHANGE: return '⬆';
      case ReplayEventType.COLLISION_GUARD: return '👮';
      case ReplayEventType.COLLISION_PILL: return '💊';
      case ReplayEventType.COLLISION_FALL: return '💥';
      case ReplayEventType.COLLISION_TRAP: return '⚠';
      case ReplayEventType.SCORE_SURVIVAL: return '⏱';
      case ReplayEventType.SCORE_FLOOR: return '🏢';
      case ReplayEventType.SCORE_COMBO: return '🔥';
      case ReplayEventType.SCORE_PILL: return '💎';
      case ReplayEventType.SCORE_NODAMAGE: return '🛡';
      default: return '•';
    }
  }

  private showReplayPanel(): void {
    if (!this.replayData) return;

    const overlay = this.add.graphics().setDepth(300);
    overlay.fillStyle(0x000000, 0.92);
    overlay.fillRect(0, 0, GameConfig.width, GameConfig.height);

    const panelW = GameConfig.width - 40;
    const panelH = GameConfig.height - 80;
    const panelX = 20;
    const panelY = 40;

    const panel = this.add.graphics().setDepth(301);
    panel.fillStyle(0x0d0d20, 1);
    panel.fillRoundedRect(panelX, panelY, panelW, panelH, 12);
    panel.lineStyle(2, 0x66ffff, 0.8);
    panel.strokeRoundedRect(panelX, panelY, panelW, panelH, 12);

    const title = this.add.text(GameConfig.width / 2, panelY + 25, '📋 局内复盘（最近 10 秒）', {
      fontSize: '22px',
      color: '#66ffff',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(302);

    let infoY = panelY + 55;
    this.add.text(panelX + 20, infoY, `死亡原因: ${this.replayData.deathReason || '未知'}`, {
      fontSize: '15px',
      color: '#ff6666',
      fontStyle: 'bold'
    }).setOrigin(0, 0.5).setDepth(302);

    this.add.text(GameConfig.width - 20, infoY, `最终楼层: ${this.replayData.finalFloor}F | 得分: ${this.replayData.finalScore}`, {
      fontSize: '14px',
      color: '#ffcc00',
      fontStyle: 'bold'
    }).setOrigin(1, 0.5).setDepth(302);

    infoY += 25;
    const line = this.add.graphics().setDepth(302);
    line.lineStyle(1, 0x444466, 0.8);
    line.lineBetween(panelX + 15, infoY, GameConfig.width - 15, infoY);
    infoY += 15;

    const events = this.replayData.events;
    if (events.length === 0) {
      this.add.text(GameConfig.width / 2, infoY + 60, '暂无事件记录', {
        fontSize: '18px',
        color: '#666666'
      }).setOrigin(0.5).setDepth(302);
    } else {
      const maxVisible = Math.min(events.length, Math.floor((panelH - 150) / 28));
      const startIdx = Math.max(0, events.length - maxVisible);
      const displayEvents = events.slice(startIdx);
      const startTime = events.length > 0 ? events[0].timestamp : 0;

      displayEvents.forEach((event, i) => {
        const eventY = infoY + i * 28;
        const relTime = ((event.timestamp - startTime) / 1000).toFixed(1);
        const icon = this.getReplayEventIcon(event.type);
        const color = this.getReplayEventColor(event.type);

        let text = `${icon} [${relTime}s] ${event.description}`;
        if (event.floorNumber !== undefined) {
          text += ` @${event.floorNumber}F`;
        }
        if (event.scoreGain !== undefined && event.scoreGain > 0) {
          text += `  +${event.scoreGain}`;
        }

        this.add.text(panelX + 20, eventY, text, {
          fontSize: '14px',
          color: color
        }).setOrigin(0, 0.5).setDepth(302);

        if (event.scoreGain !== undefined && event.scoreGain > 0) {
          this.add.text(GameConfig.width - 25, eventY, `+${event.scoreGain}`, {
            fontSize: '13px',
            color: '#ffff66',
            fontStyle: 'bold'
          }).setOrigin(1, 0.5).setDepth(302);
        }
      });
    }

    const closeBtn = this.add.text(GameConfig.width / 2, panelY + panelH - 30, '关闭', {
      fontSize: '18px',
      color: '#ffffff',
      backgroundColor: '#444466',
      padding: { left: 30, right: 30, top: 8, bottom: 8 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(302);

    closeBtn.on('pointerover', () => {
      closeBtn.setBackgroundColor('#555588');
      this.audioManager.play('hover');
    });
    closeBtn.on('pointerout', () => {
      closeBtn.setBackgroundColor('#444466');
    });
    closeBtn.on('pointerdown', () => {
      this.audioManager.play('select');
      overlay.destroy();
      panel.destroy();
      title.destroy();
      closeBtn.destroy();
      this.children.list.filter(c => (c as any).depth >= 300 && c !== overlay && c !== panel && c !== title && c !== closeBtn).forEach(c => c.destroy());
      this.children.each(c => {
        if ((c as any).depth >= 300) {
          c.destroy();
        }
      });
    });
  }

  private showReplayHistoryPanel(): void {
    const history = this.saveManager.getReplayHistory();

    const overlay = this.add.graphics().setDepth(300);
    overlay.fillStyle(0x000000, 0.92);
    overlay.fillRect(0, 0, GameConfig.width, GameConfig.height);

    const panelW = GameConfig.width - 40;
    const panelH = GameConfig.height - 80;
    const panelX = 20;
    const panelY = 40;

    const panel = this.add.graphics().setDepth(301);
    panel.fillStyle(0x150520, 1);
    panel.fillRoundedRect(panelX, panelY, panelW, panelH, 12);
    panel.lineStyle(2, 0xcc99ff, 0.8);
    panel.strokeRoundedRect(panelX, panelY, panelW, panelH, 12);

    const title = this.add.text(GameConfig.width / 2, panelY + 25, '📚 复盘历史记录', {
      fontSize: '22px',
      color: '#cc99ff',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(302);

    let infoY = panelY + 55;
    this.add.text(panelX + 20, infoY, `共 ${history.length} 条记录`, {
      fontSize: '14px',
      color: '#888888'
    }).setOrigin(0, 0.5).setDepth(302);
    infoY += 25;

    const line = this.add.graphics().setDepth(302);
    line.lineStyle(1, 0x442266, 0.8);
    line.lineBetween(panelX + 15, infoY, GameConfig.width - 15, infoY);
    infoY += 15;

    if (history.length === 0) {
      this.add.text(GameConfig.width / 2, infoY + 60, '暂无历史记录', {
        fontSize: '18px',
        color: '#666666'
      }).setOrigin(0.5).setDepth(302);
    } else {
      const maxVisible = Math.min(history.length, Math.floor((panelH - 180) / 45));

      for (let i = 0; i < maxVisible; i++) {
        const record = history[i];
        const itemY = infoY + i * 45;

        const itemBg = this.add.graphics().setDepth(302);
        itemBg.fillStyle(0x221133, 0.6);
        itemBg.fillRoundedRect(panelX + 15, itemY, panelW - 30, 40, 6);

        const date = new Date(record.date);
        const dateStr = `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
        const duration = (record.gameDuration / 1000).toFixed(1);

        this.add.text(panelX + 25, itemY + 12, `#${i + 1}  ${dateStr}  时长:${duration}s`, {
          fontSize: '12px',
          color: '#aa88cc'
        }).setOrigin(0, 0.5).setDepth(303);

        this.add.text(panelX + 25, itemY + 30, `${record.deathReason || '未知'}`, {
          fontSize: '13px',
          color: '#ff8888',
          fontStyle: 'bold'
        }).setOrigin(0, 0.5).setDepth(303);

        this.add.text(GameConfig.width - 25, itemY + 12, `${record.finalFloor}F`, {
          fontSize: '13px',
          color: '#66ccff',
          fontStyle: 'bold'
        }).setOrigin(1, 0.5).setDepth(303);

        this.add.text(GameConfig.width - 25, itemY + 30, `${record.finalScore}分`, {
          fontSize: '13px',
          color: '#ffcc00',
          fontStyle: 'bold'
        }).setOrigin(1, 0.5).setDepth(303);

        itemBg.setInteractive(new Phaser.Geom.Rectangle(panelX + 15, itemY, panelW - 30, 40), Phaser.Geom.Rectangle.Contains);
        itemBg.on('pointerover', () => {
          itemBg.fillStyle(0x332255, 0.8);
          itemBg.fillRoundedRect(panelX + 15, itemY, panelW - 30, 40, 6);
          this.audioManager.play('hover');
        });
        itemBg.on('pointerout', () => {
          itemBg.fillStyle(0x221133, 0.6);
          itemBg.fillRoundedRect(panelX + 15, itemY, panelW - 30, 40, 6);
        });
        itemBg.on('pointerdown', () => {
          this.audioManager.play('select');
          this.showHistoryDetailPanel(record, overlay, panel, title);
        });
      }
    }

    const btnY = panelY + panelH - 30;
    const closeBtn = this.add.text(GameConfig.width / 2, btnY, '关闭', {
      fontSize: '18px',
      color: '#ffffff',
      backgroundColor: '#553366',
      padding: { left: 30, right: 30, top: 8, bottom: 8 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(302);

    closeBtn.on('pointerover', () => {
      closeBtn.setBackgroundColor('#774488');
      this.audioManager.play('hover');
    });
    closeBtn.on('pointerout', () => {
      closeBtn.setBackgroundColor('#553366');
    });
    closeBtn.on('pointerdown', () => {
      this.audioManager.play('select');
      this.children.each(c => {
        if ((c as any).depth >= 300) {
          c.destroy();
        }
      });
    });
  }

  private showHistoryDetailPanel(record: ReplayData, _parentOverlay: Phaser.GameObjects.Graphics, _parentPanel: Phaser.GameObjects.Graphics, _parentTitle: Phaser.GameObjects.Text): void {
    this.children.each(c => {
      if ((c as any).depth >= 300) {
        c.destroy();
      }
    });

    const overlay = this.add.graphics().setDepth(300);
    overlay.fillStyle(0x000000, 0.95);
    overlay.fillRect(0, 0, GameConfig.width, GameConfig.height);

    const panelW = GameConfig.width - 40;
    const panelH = GameConfig.height - 80;
    const panelX = 20;
    const panelY = 40;

    const panel = this.add.graphics().setDepth(301);
    panel.fillStyle(0x0d0d20, 1);
    panel.fillRoundedRect(panelX, panelY, panelW, panelH, 12);
    panel.lineStyle(2, 0xcc99ff, 0.8);
    panel.strokeRoundedRect(panelX, panelY, panelW, panelH, 12);

    const date = new Date(record.date);
    const dateStr = `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

    this.add.text(GameConfig.width / 2, panelY + 25, '📜 历史复盘详情', {
      fontSize: '22px',
      color: '#cc99ff',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(302);

    let infoY = panelY + 55;
    this.add.text(panelX + 20, infoY, dateStr, {
      fontSize: '13px',
      color: '#888888'
    }).setOrigin(0, 0.5).setDepth(302);
    this.add.text(GameConfig.width - 20, infoY, `时长: ${(record.gameDuration / 1000).toFixed(1)}s`, {
      fontSize: '13px',
      color: '#888888'
    }).setOrigin(1, 0.5).setDepth(302);

    infoY += 22;
    this.add.text(panelX + 20, infoY, `死亡原因: ${record.deathReason || '未知'}`, {
      fontSize: '15px',
      color: '#ff6666',
      fontStyle: 'bold'
    }).setOrigin(0, 0.5).setDepth(302);

    this.add.text(GameConfig.width - 20, infoY, `最终楼层: ${record.finalFloor}F | 得分: ${record.finalScore}`, {
      fontSize: '14px',
      color: '#ffcc00',
      fontStyle: 'bold'
    }).setOrigin(1, 0.5).setDepth(302);

    infoY += 28;
    const line = this.add.graphics().setDepth(302);
    line.lineStyle(1, 0x444466, 0.8);
    line.lineBetween(panelX + 15, infoY, GameConfig.width - 15, infoY);
    infoY += 15;

    const events = record.events;
    if (events.length === 0) {
      this.add.text(GameConfig.width / 2, infoY + 60, '暂无事件记录', {
        fontSize: '18px',
        color: '#666666'
      }).setOrigin(0.5).setDepth(302);
    } else {
      const maxVisible = Math.min(events.length, Math.floor((panelH - 170) / 28));
      const startIdx = Math.max(0, events.length - maxVisible);
      const displayEvents = events.slice(startIdx);
      const startTime = events.length > 0 ? events[0].timestamp : 0;

      displayEvents.forEach((event, i) => {
        const eventY = infoY + i * 28;
        const relTime = ((event.timestamp - startTime) / 1000).toFixed(1);
        const icon = this.getReplayEventIcon(event.type);
        const color = this.getReplayEventColor(event.type);

        let text = `${icon} [${relTime}s] ${event.description}`;
        if (event.floorNumber !== undefined) {
          text += ` @${event.floorNumber}F`;
        }
        if (event.scoreGain !== undefined && event.scoreGain > 0) {
          text += `  +${event.scoreGain}`;
        }

        this.add.text(panelX + 20, eventY, text, {
          fontSize: '14px',
          color: color
        }).setOrigin(0, 0.5).setDepth(302);

        if (event.scoreGain !== undefined && event.scoreGain > 0) {
          this.add.text(GameConfig.width - 25, eventY, `+${event.scoreGain}`, {
            fontSize: '13px',
            color: '#ffff66',
            fontStyle: 'bold'
          }).setOrigin(1, 0.5).setDepth(302);
        }
      });
    }

    const btnY = panelY + panelH - 30;
    const backBtn = this.add.text(GameConfig.width / 2 - 70, btnY, '返回列表', {
      fontSize: '16px',
      color: '#ffffff',
      backgroundColor: '#444466',
      padding: { left: 20, right: 20, top: 8, bottom: 8 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(302);

    const closeBtn = this.add.text(GameConfig.width / 2 + 70, btnY, '关闭', {
      fontSize: '16px',
      color: '#ffffff',
      backgroundColor: '#553366',
      padding: { left: 20, right: 20, top: 8, bottom: 8 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(302);

    backBtn.on('pointerover', () => {
      backBtn.setBackgroundColor('#555588');
      this.audioManager.play('hover');
    });
    backBtn.on('pointerout', () => {
      backBtn.setBackgroundColor('#444466');
    });
    backBtn.on('pointerdown', () => {
      this.audioManager.play('select');
      this.children.each(c => {
        if ((c as any).depth >= 300) {
          c.destroy();
        }
      });
      this.showReplayHistoryPanel();
    });

    closeBtn.on('pointerover', () => {
      closeBtn.setBackgroundColor('#774488');
      this.audioManager.play('hover');
    });
    closeBtn.on('pointerout', () => {
      closeBtn.setBackgroundColor('#553366');
    });
    closeBtn.on('pointerdown', () => {
      this.audioManager.play('select');
      this.children.each(c => {
        if ((c as any).depth >= 300) {
          c.destroy();
        }
      });
    });
  }
}
