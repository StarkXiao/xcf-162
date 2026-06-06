import Phaser from 'phaser';
import { GameConfig } from '../config/GameConfig';
import { AudioManager } from '../audio/AudioManager';

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
  }): void {
    this.audioManager = AudioManager.getInstance();
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
    nextY += 20;

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
  }
}
