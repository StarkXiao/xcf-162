import Phaser from 'phaser';
import { GameConfig } from '../config/GameConfig';
import { SaveManager } from '../utils/SaveManager';
import { AudioManager } from '../audio/AudioManager';

export class GameOverScene extends Phaser.Scene {
  private saveManager!: SaveManager;
  private audioManager!: AudioManager;
  private finalScore: number = 0;
  private isNewHighScore: boolean = false;

  constructor() {
    super('GameOverScene');
  }

  init(data: { score: number; pills: number; floor: number }): void {
    this.finalScore = data.score;
    this.saveManager = SaveManager.getInstance();
    this.audioManager = AudioManager.getInstance();

    const saveData = this.saveManager.getSaveData();
    this.isNewHighScore = data.score > saveData.highScore;

    this.saveManager.saveGameData({
      highScore: Math.max(saveData.highScore, data.score),
      totalPills: saveData.totalPills + data.pills,
      gamesPlayed: saveData.gamesPlayed + 1
    });
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#0a0a1a');

    this.add.rectangle(GameConfig.width / 2, 0, GameConfig.width, GameConfig.height, 0x000000, 0.8);

    this.add.text(GameConfig.width / 2, 150, '游戏结束', {
      fontSize: '48px',
      color: '#ff0066',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    if (this.isNewHighScore) {
      const newRecord = this.add.text(GameConfig.width / 2, 210, '★ 新纪录! ★', {
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
    }

    this.add.text(GameConfig.width / 2, 280, '得分', {
      fontSize: '20px',
      color: '#888888'
    }).setOrigin(0.5);

    this.add.text(GameConfig.width / 2, 320, this.finalScore.toString(), {
      fontSize: '64px',
      color: '#00ffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const saveData = this.saveManager.getSaveData();
    this.add.text(GameConfig.width / 2, 400, `最高分: ${saveData.highScore}`, {
      fontSize: '18px',
      color: '#ffcc00'
    }).setOrigin(0.5);

    const restartBtn = this.add.text(GameConfig.width / 2, 480, '再来一次', {
      fontSize: '28px',
      color: '#ffffff',
      backgroundColor: '#ff0066',
      padding: { left: 30, right: 30, top: 12, bottom: 12 }
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
      this.scene.start('GameScene');
    });

    const menuBtn = this.add.text(GameConfig.width / 2, 560, '返回菜单', {
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
