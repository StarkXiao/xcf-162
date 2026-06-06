import Phaser from 'phaser';
import { GameConfig } from '../config/GameConfig';
import { SaveManager } from '../utils/SaveManager';
import { AudioManager } from '../audio/AudioManager';

export class MenuScene extends Phaser.Scene {
  private saveManager!: SaveManager;
  private audioManager!: AudioManager;
  private neonLights: Phaser.GameObjects.Image[] = [];

  constructor() {
    super('MenuScene');
  }

  create(): void {
    this.saveManager = SaveManager.getInstance();
    this.audioManager = AudioManager.getInstance();

    this.cameras.main.setBackgroundColor('#0a0a1a');
    this.createBackground();

    this.add.text(GameConfig.width / 2, 120, '失控夜店', {
      fontSize: '56px',
      color: '#ff0066',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(GameConfig.width / 2, 180, '电梯井生存', {
      fontSize: '28px',
      color: '#00ffff'
    }).setOrigin(0.5);

    const startBtn = this.add.text(GameConfig.width / 2, 320, '开始游戏', {
      fontSize: '32px',
      color: '#ffffff',
      backgroundColor: '#ff0066',
      padding: { left: 40, right: 40, top: 15, bottom: 15 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    startBtn.on('pointerover', () => {
      startBtn.setBackgroundColor('#ff3385');
      this.audioManager.play('hover');
    });

    startBtn.on('pointerout', () => {
      startBtn.setBackgroundColor('#ff0066');
    });

    startBtn.on('pointerdown', () => {
      this.audioManager.play('select');
      this.scene.start('GameScene');
    });

    const trainingBtn = this.add.text(GameConfig.width / 2, 390, '番外训练馆', {
      fontSize: '26px',
      color: '#ffffff',
      backgroundColor: '#00aaff',
      padding: { left: 35, right: 35, top: 12, bottom: 12 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    trainingBtn.on('pointerover', () => {
      trainingBtn.setBackgroundColor('#33bbff');
      this.audioManager.play('hover');
    });

    trainingBtn.on('pointerout', () => {
      trainingBtn.setBackgroundColor('#00aaff');
    });

    trainingBtn.on('pointerdown', () => {
      this.audioManager.play('select');
      this.scene.start('TrainingScene');
    });

    const saveData = this.saveManager.getSaveData();
    this.add.text(GameConfig.width / 2, 470, `最高分: ${saveData.highScore}`, {
      fontSize: '20px',
      color: '#ffcc00'
    }).setOrigin(0.5);

    this.add.text(GameConfig.width / 2, 505, `总药片: ${saveData.totalPills}`, {
      fontSize: '16px',
      color: '#00ff88'
    }).setOrigin(0.5);

    this.add.text(GameConfig.width / 2, 535, `游戏次数: ${saveData.gamesPlayed}`, {
      fontSize: '16px',
      color: '#888888'
    }).setOrigin(0.5);

    this.add.text(GameConfig.width / 2, 600, '← → 移动 | 空格 跳跃', {
      fontSize: '18px',
      color: '#666666'
    }).setOrigin(0.5);

    this.add.text(GameConfig.width / 2, 630, '拾取药片 | 躲避保安', {
      fontSize: '16px',
      color: '#444444'
    }).setOrigin(0.5);

    this.time.addEvent({
      delay: 100,
      callback: this.animateNeonLights,
      callbackScope: this,
      loop: true
    });
  }

  private createBackground(): void {
    for (let i = 0; i < 20; i++) {
      const x = Phaser.Math.Between(0, GameConfig.width);
      const y = Phaser.Math.Between(0, GameConfig.height);
      const type = Phaser.Math.Between(0, 1) === 0 ? 'neon-pink' : 'neon-cyan';
      const light = this.add.image(x, y, type);
      light.setAlpha(Phaser.Math.FloatBetween(0.3, 0.8));
      light.setScale(Phaser.Math.FloatBetween(0.5, 1.5));
      this.neonLights.push(light);
    }

    for (let i = 0; i < 5; i++) {
      const y = i * 150 + 50;
      this.add.rectangle(0, y, GameConfig.width * 2, 2, 0xff0066, 0.1);
      this.add.rectangle(0, y + 75, GameConfig.width * 2, 1, 0x00ffff, 0.1);
    }
  }

  private animateNeonLights(): void {
    this.neonLights.forEach((light, index) => {
      const pulse = Math.sin(this.time.now * 0.003 + index) * 0.3 + 0.5;
      light.setAlpha(pulse);
    });
  }
}
