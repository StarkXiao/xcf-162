import Phaser from 'phaser';
import { GameConfig } from '../config/GameConfig';
import { AudioManager } from '../audio/AudioManager';
import { EndlessLeaderboardEntry } from '../types';

export class EndlessGameOverScene extends Phaser.Scene {
  private audioManager!: AudioManager;
  private rawScore: number = 0;
  private finalScore: number = 0;
  private pills: number = 0;
  private floor: number = 0;
  private maxCombo: number = 0;
  private multiplier: number = 1.0;
  private isNewRecord: boolean = false;
  private rank: number = 0;
  private leaderboard: EndlessLeaderboardEntry[] = [];
  private maxAddiction: number = 0;
  private hallucinations: number = 0;
  private lossOfControl: number = 0;

  constructor() {
    super('EndlessGameOverScene');
  }

  init(data: {
    rawScore: number;
    finalScore: number;
    pills: number;
    floor: number;
    maxCombo: number;
    multiplier: number;
    isNewRecord: boolean;
    rank: number;
    leaderboard: EndlessLeaderboardEntry[];
    maxAddiction?: number;
    hallucinations?: number;
    lossOfControl?: number;
  }): void {
    this.audioManager = AudioManager.getInstance();
    this.rawScore = data.rawScore;
    this.finalScore = data.finalScore;
    this.pills = data.pills;
    this.floor = data.floor;
    this.maxCombo = data.maxCombo;
    this.multiplier = data.multiplier;
    this.isNewRecord = data.isNewRecord;
    this.rank = data.rank;
    this.leaderboard = data.leaderboard;
    this.maxAddiction = data.maxAddiction || 0;
    this.hallucinations = data.hallucinations || 0;
    this.lossOfControl = data.lossOfControl || 0;
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#1a0a2e');

    this.add.rectangle(GameConfig.width / 2, 0, GameConfig.width, GameConfig.height, 0x000000, 0.85);

    this.add.text(GameConfig.width / 2, 55, '无尽竞速', {
      fontSize: '20px',
      color: '#ff66ff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(GameConfig.width / 2, 85, '本局结算', {
      fontSize: '36px',
      color: '#ff0066',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    let nextY = 135;

    if (this.isNewRecord) {
      const newRecord = this.add.text(GameConfig.width / 2, nextY, '★ 新纪录! ★', {
        fontSize: '26px',
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
    } else if (this.rank > 0 && this.rank <= GameConfig.endlessLeaderboardMaxEntries) {
      this.add.text(GameConfig.width / 2, nextY, `排行榜 #${this.rank}`, {
        fontSize: '20px',
        color: '#00ffff',
        fontStyle: 'bold'
      }).setOrigin(0.5);
      nextY += 35;
    }

    this.add.text(GameConfig.width / 2, nextY, '最终得分', {
      fontSize: '18px',
      color: '#888888'
    }).setOrigin(0.5);
    nextY += 30;

    this.add.text(GameConfig.width / 2, nextY, this.finalScore.toString(), {
      fontSize: '56px',
      color: '#ff66ff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    nextY += 50;

    this.createBreakdownPanel(nextY);
    const hasSideEffects = this.maxAddiction > 0 || this.hallucinations > 0 || this.lossOfControl > 0;
    nextY += hasSideEffects ? 215 : 155;

    this.createLeaderboardPanel(nextY);
    nextY += 240;

    const restartBtn = this.add.text(GameConfig.width / 2 - 90, nextY, '再来一局', {
      fontSize: '22px',
      color: '#ffffff',
      backgroundColor: '#ff0066',
      padding: { left: 20, right: 20, top: 10, bottom: 10 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    restartBtn.on('pointerover', () => {
      restartBtn.setBackgroundColor('#ff3385');
      this.audioManager.play('hover');
    });

    restartBtn.on('pointerout', () => {
      restartBtn.setBackgroundColor('#ff0066');
    });

    restartBtn.on('pointerdown', () => {
      this.audioManager.play('select');
      this.scene.start('EndlessScene');
    });

    const menuBtn = this.add.text(GameConfig.width / 2 + 90, nextY, '返回菜单', {
      fontSize: '20px',
      color: '#888888',
      backgroundColor: '#222222',
      padding: { left: 20, right: 20, top: 10, bottom: 10 }
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
  }

  private createBreakdownPanel(startY: number): void {
    const hasSideEffects = this.maxAddiction > 0 || this.hallucinations > 0 || this.lossOfControl > 0;
    const panelHeight = hasSideEffects ? 200 : 140;

    const panel = this.add.graphics();
    panel.fillStyle(0x1a1a2e, 0.8);
    panel.fillRect(30, startY, GameConfig.width - 60, panelHeight);
    panel.lineStyle(2, 0xff66ff, 0.5);
    panel.strokeRect(30, startY, GameConfig.width - 60, panelHeight);

    this.add.text(GameConfig.width / 2, startY + 12, '结算明细', {
      fontSize: '16px',
      color: '#ff66ff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const leftX = 55;
    const rightX = GameConfig.width - 55;
    let rowY = startY + 40;
    const rowSpacing = 22;

    this.add.text(leftX, rowY, '基础得分', { fontSize: '14px', color: '#aaaaaa' });
    this.add.text(rightX, rowY, this.rawScore.toString(), { fontSize: '14px', color: '#ffffff' }).setOrigin(1, 0);
    rowY += rowSpacing;

    this.add.text(leftX, rowY, '到达楼层', { fontSize: '14px', color: '#aaaaaa' });
    this.add.text(rightX, rowY, `B${this.floor + 1}F`, { fontSize: '14px', color: '#00ffff' }).setOrigin(1, 0);
    rowY += rowSpacing;

    this.add.text(leftX, rowY, '拾取药片', { fontSize: '14px', color: '#aaaaaa' });
    this.add.text(rightX, rowY, this.pills.toString(), { fontSize: '14px', color: '#00ff88' }).setOrigin(1, 0);
    rowY += rowSpacing;

    this.add.text(leftX, rowY, '最高连击', { fontSize: '14px', color: '#aaaaaa' });
    this.add.text(rightX, rowY, this.maxCombo.toString(), { fontSize: '14px', color: '#ffcc00' }).setOrigin(1, 0);
    rowY += rowSpacing;

    const mulColor = this.multiplier >= 5 ? '#ff0066' : this.multiplier >= 3 ? '#ff6600' : this.multiplier >= 2 ? '#00ffff' : '#ffcc00';
    this.add.text(leftX, rowY, '倍率加成', { fontSize: '14px', color: '#aaaaaa' });
    const mulText = this.add.text(rightX, rowY, `x${this.multiplier.toFixed(1)}`, { fontSize: '14px', color: mulColor, fontStyle: 'bold' }).setOrigin(1, 0);

    this.tweens.add({
      targets: mulText,
      scale: { from: 1, to: 1.15 },
      duration: 800,
      yoyo: true,
      repeat: -1
    });

    if (hasSideEffects) {
      rowY += rowSpacing + 5;
      this.add.text(leftX, rowY, '—— 副作用统计 ——', { fontSize: '12px', color: '#ff66ff' });
      rowY += rowSpacing;

      const addictionColor = this.maxAddiction >= 90 ? '#ff0000' :
                             this.maxAddiction >= 75 ? '#ff0066' :
                             this.maxAddiction >= 50 ? '#ffaa00' :
                             this.maxAddiction >= 25 ? '#ffcc00' : '#888888';
      this.add.text(leftX, rowY, '最高成瘾', { fontSize: '13px', color: '#aaaaaa' });
      this.add.text(rightX, rowY, `${Math.floor(this.maxAddiction)}%`, { fontSize: '13px', color: addictionColor, fontStyle: 'bold' }).setOrigin(1, 0);
      rowY += rowSpacing;

      if (this.hallucinations > 0) {
        this.add.text(leftX, rowY, '幻觉发作', { fontSize: '13px', color: '#aaaaaa' });
        this.add.text(rightX, rowY, `${this.hallucinations}次`, { fontSize: '13px', color: '#ff00ff' }).setOrigin(1, 0);
        rowY += rowSpacing;
      }

      if (this.lossOfControl > 0) {
        this.add.text(leftX, rowY, '失控发作', { fontSize: '13px', color: '#aaaaaa' });
        this.add.text(rightX, rowY, `${this.lossOfControl}次`, { fontSize: '13px', color: '#ff0066' }).setOrigin(1, 0);
      }
    }
  }

  private createLeaderboardPanel(startY: number): void {
    const panel = this.add.graphics();
    panel.fillStyle(0x0a0a1a, 0.9);
    panel.fillRect(30, startY, GameConfig.width - 60, 220);
    panel.lineStyle(2, 0xffcc00, 0.5);
    panel.strokeRect(30, startY, GameConfig.width - 60, 220);

    this.add.text(GameConfig.width / 2, startY + 12, '🏆 无尽竞速排行榜', {
      fontSize: '18px',
      color: '#ffcc00',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    if (this.leaderboard.length === 0) {
      this.add.text(GameConfig.width / 2, startY + 110, '暂无记录，成为第一名！', {
        fontSize: '16px',
        color: '#666666'
      }).setOrigin(0.5);
      return;
    }

    let entryY = startY + 38;
    const entrySpacing = 18;

    this.leaderboard.slice(0, 10).forEach((entry, index) => {
      const isCurrentRun = entry.score === this.finalScore &&
        entry.floor === this.floor &&
        entry.pills === this.pills;

      const rankColors = ['#ffcc00', '#cccccc', '#cd7f32', '#aaaaaa', '#aaaaaa', '#888888', '#888888', '#666666', '#666666', '#666666'];
      const rankColor = rankColors[index] || '#666666';

      if (isCurrentRun) {
        const highlight = this.add.graphics();
        highlight.fillStyle(0xff66ff, 0.15);
        highlight.fillRect(35, entryY - 3, GameConfig.width - 70, 18);
        highlight.lineStyle(1, 0xff66ff, 0.6);
        highlight.strokeRect(35, entryY - 3, GameConfig.width - 70, 18);
      }

      const rankLabel = `#${entry.rank}`;
      this.add.text(50, entryY, rankLabel, {
        fontSize: '13px',
        color: rankColor,
        fontStyle: 'bold'
      });

      this.add.text(90, entryY, entry.score.toString(), {
        fontSize: '13px',
        color: isCurrentRun ? '#ff66ff' : '#ffffff',
        fontStyle: isCurrentRun ? 'bold' : 'normal'
      });

      this.add.text(185, entryY, `B${entry.floor + 1}F`, {
        fontSize: '12px',
        color: '#00ffff'
      });

      this.add.text(245, entryY, `x${entry.multiplier.toFixed(1)}`, {
        fontSize: '12px',
        color: '#ffcc00'
      });

      this.add.text(310, entryY, `${entry.pills}💊`, {
        fontSize: '12px',
        color: '#00ff88'
      });

      this.add.text(370, entryY, `${entry.maxCombo}连`, {
        fontSize: '12px',
        color: '#ff66ff'
      });

      entryY += entrySpacing;
    });
  }
}
