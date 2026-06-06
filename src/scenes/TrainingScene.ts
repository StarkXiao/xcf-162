import Phaser from 'phaser';
import { GameConfig } from '../config/GameConfig';
import { SaveManager } from '../utils/SaveManager';
import { AudioManager } from '../audio/AudioManager';

export class TrainingScene extends Phaser.Scene {
  private saveManager!: SaveManager;
  private audioManager!: AudioManager;
  private neonLights: Phaser.GameObjects.Image[] = [];

  constructor() {
    super('TrainingScene');
  }

  create(): void {
    this.saveManager = SaveManager.getInstance();
    this.audioManager = AudioManager.getInstance();

    this.cameras.main.setBackgroundColor('#0a0a1a');
    this.createBackground();

    this.add.text(GameConfig.width / 2, 80, '番外训练馆', {
      fontSize: '44px',
      color: '#ff0066',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(GameConfig.width / 2, 130, '夜店电梯井 · 特训模式', {
      fontSize: '20px',
      color: '#00ffff'
    }).setOrigin(0.5);

    this.createTrainingButton('跳跃教学', '掌握二段跳和连跳技巧', 210, '#00ff88', 'JumpTrainingScene');
    this.createTrainingButton('药片试用', '熟悉各类药片效果', 310, '#ffcc00', 'PillTrainingScene');
    this.createTrainingButton('保安练习', '练习躲避和戏耍保安', 410, '#ff6600', 'GuardTrainingScene');

    this.add.text(GameConfig.width / 2, 510, '—— 训练成绩 ——', {
      fontSize: '18px',
      color: '#888888'
    }).setOrigin(0.5);

    this.displayTrainingScores();

    const backBtn = this.add.text(GameConfig.width / 2, 650, '← 返回主菜单', {
      fontSize: '22px',
      color: '#aaaaaa'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    backBtn.on('pointerover', () => {
      backBtn.setColor('#ffffff');
      this.audioManager.play('hover');
    });

    backBtn.on('pointerout', () => {
      backBtn.setColor('#aaaaaa');
    });

    backBtn.on('pointerdown', () => {
      this.audioManager.play('select');
      this.scene.start('MenuScene');
    });

    this.time.addEvent({
      delay: 100,
      callback: this.animateNeonLights,
      callbackScope: this,
      loop: true
    });
  }

  private createTrainingButton(title: string, desc: string, y: number, color: string, sceneName: string): void {
    const btnBg = this.add.rectangle(GameConfig.width / 2, y, 360, 80, 0x1a1a2e, 0.8);
    btnBg.setStrokeStyle(2, Phaser.Display.Color.HexStringToColor(color).color);
    btnBg.setInteractive({ useHandCursor: true });

    this.add.text(GameConfig.width / 2 - 160, y - 18, title, {
      fontSize: '24px',
      color: color,
      fontStyle: 'bold'
    });

    this.add.text(GameConfig.width / 2 - 160, y + 12, desc, {
      fontSize: '14px',
      color: '#888888'
    });

    btnBg.on('pointerover', () => {
      btnBg.setFillStyle(0x2a2a4e, 0.9);
      this.audioManager.play('hover');
    });

    btnBg.on('pointerout', () => {
      btnBg.setFillStyle(0x1a1a2e, 0.8);
    });

    btnBg.on('pointerdown', () => {
      this.audioManager.play('select');
      this.scene.start(sceneName);
    });
  }

  private displayTrainingScores(): void {
    const scores = this.saveManager.getTrainingScores();
    const baseY = 545;

    this.add.text(60, baseY, `跳跃 最佳连跳:${scores.jumpTraining.bestCombo} 最高楼层:${scores.jumpTraining.highestFloor}`, {
      fontSize: '14px',
      color: '#00ff88'
    });

    this.add.text(60, baseY + 25, `药片 收集:${scores.pillTraining.pillsCollected} 最佳连击:${scores.pillTraining.bestStreak}`, {
      fontSize: '14px',
      color: '#ffcc00'
    });

    this.add.text(60, baseY + 50, `保安 躲避:${scores.guardTraining.guardsAvoided} 最长生存:${scores.guardTraining.longestSurvival}s`, {
      fontSize: '14px',
      color: '#ff6600'
    });
  }

  private createBackground(): void {
    for (let i = 0; i < 25; i++) {
      const x = Phaser.Math.Between(0, GameConfig.width);
      const y = Phaser.Math.Between(0, GameConfig.height);
      const type = Phaser.Math.Between(0, 1) === 0 ? 'neon-pink' : 'neon-cyan';
      const light = this.add.image(x, y, type);
      light.setAlpha(Phaser.Math.FloatBetween(0.3, 0.8));
      light.setScale(Phaser.Math.FloatBetween(0.5, 1.5));
      this.neonLights.push(light);
    }

    for (let i = 0; i < 6; i++) {
      const y = i * 130 + 30;
      this.add.rectangle(0, y, GameConfig.width * 2, 2, 0xff0066, 0.08);
      this.add.rectangle(0, y + 65, GameConfig.width * 2, 1, 0x00ffff, 0.08);
    }
  }

  private animateNeonLights(): void {
    this.neonLights.forEach((light, index) => {
      const pulse = Math.sin(this.time.now * 0.003 + index) * 0.3 + 0.5;
      light.setAlpha(pulse);
    });
  }
}
