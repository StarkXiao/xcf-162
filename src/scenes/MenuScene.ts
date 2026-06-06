import Phaser from 'phaser';
import { GameConfig } from '../config/GameConfig';
import { SaveManager } from '../utils/SaveManager';
import { AudioManager } from '../audio/AudioManager';
import { ArchiveManager } from '../utils/ArchiveManager';
import { AchievementManager } from '../utils/AchievementManager';

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

    const startBtn = this.add.text(GameConfig.width / 2, 290, '开始游戏', {
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

    const dualBtn = this.add.text(GameConfig.width / 2, 365, '🔄 双角色接力 🔄', {
      fontSize: '26px',
      color: '#ffffff',
      backgroundColor: '#00ccaa',
      padding: { left: 28, right: 28, top: 12, bottom: 12 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    this.tweens.add({
      targets: dualBtn,
      scale: { from: 1, to: 1.02 },
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    dualBtn.on('pointerover', () => {
      dualBtn.setBackgroundColor('#00eecc');
      this.audioManager.play('hover');
    });

    dualBtn.on('pointerout', () => {
      dualBtn.setBackgroundColor('#00ccaa');
    });

    dualBtn.on('pointerdown', () => {
      this.audioManager.play('select');
      this.scene.start('DualGameScene');
    });

    const endlessBtn = this.add.text(GameConfig.width / 2, 435, '⚡ 无尽竞速 ⚡', {
      fontSize: '24px',
      color: '#ffffff',
      backgroundColor: '#9933ff',
      padding: { left: 30, right: 30, top: 10, bottom: 10 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    this.tweens.add({
      targets: endlessBtn,
      scale: { from: 1, to: 1.03 },
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    endlessBtn.on('pointerover', () => {
      endlessBtn.setBackgroundColor('#bb55ff');
      this.audioManager.play('hover');
    });

    endlessBtn.on('pointerout', () => {
      endlessBtn.setBackgroundColor('#9933ff');
    });

    endlessBtn.on('pointerdown', () => {
      this.audioManager.play('select');
      this.scene.start('EndlessScene');
    });

    const trainingBtn = this.add.text(GameConfig.width / 2, 495, '番外训练馆', {
      fontSize: '22px',
      color: '#ffffff',
      backgroundColor: '#00aaff',
      padding: { left: 35, right: 35, top: 10, bottom: 10 }
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

    const challengeBtn = this.add.text(GameConfig.width / 2, 545, '🎮 自定义挑战', {
      fontSize: '20px',
      color: '#ffffff',
      backgroundColor: '#ff6633',
      padding: { left: 30, right: 30, top: 10, bottom: 10 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    challengeBtn.on('pointerover', () => {
      challengeBtn.setBackgroundColor('#ff8855');
      this.audioManager.play('hover');
    });

    challengeBtn.on('pointerout', () => {
      challengeBtn.setBackgroundColor('#ff6633');
    });

    challengeBtn.on('pointerdown', () => {
      this.audioManager.play('select');
      this.scene.start('ChallengeEditorScene');
    });

    const archiveManager = ArchiveManager.getInstance();
    const archiveProgress = archiveManager.getArchiveProgress();
    const archiveTotal = archiveManager.getTotalArchiveCount();
    const totalUnlocked = archiveProgress.characters + archiveProgress.rumors + archiveProgress.floors;
    const totalCount = archiveTotal.characters + archiveTotal.rumors + archiveTotal.floors;
    const hasNewUnlocks = this.saveManager.getNewlyUnlocked().length > 0;

    const achievementManager = AchievementManager.getInstance();
    const achUnlocked = achievementManager.getUnlockedCount();
    const achTotal = achievementManager.getTotalCount();
    const hasNewAchievements = achievementManager.getNewlyUnlocked().length > 0;

    const achievementBtn = this.add.text(GameConfig.width / 2, 590, `🏆 称号成就 ${hasNewAchievements ? '🔔' : ''}`, {
      fontSize: '20px',
      color: '#ffffff',
      backgroundColor: '#ffaa00',
      padding: { left: 30, right: 30, top: 8, bottom: 8 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    if (hasNewAchievements) {
      this.tweens.add({
        targets: achievementBtn,
        scale: { from: 1, to: 1.04 },
        duration: 1000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }

    achievementBtn.on('pointerover', () => {
      achievementBtn.setBackgroundColor('#ffbb33');
      this.audioManager.play('hover');
    });

    achievementBtn.on('pointerout', () => {
      achievementBtn.setBackgroundColor('#ffaa00');
    });

    achievementBtn.on('pointerdown', () => {
      this.audioManager.play('select');
      this.scene.start('AchievementScene');
    });

    this.add.text(GameConfig.width / 2, 620, `成就解锁: ${achUnlocked}/${achTotal}`, {
      fontSize: '12px',
      color: '#ffcc66'
    }).setOrigin(0.5);

    const archiveBtn = this.add.text(GameConfig.width / 2, 642, `📂 剧情档案室 ${hasNewUnlocks ? '🔔' : ''}`, {
      fontSize: '18px',
      color: '#ffffff',
      backgroundColor: '#aa66ff',
      padding: { left: 25, right: 25, top: 7, bottom: 7 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    if (hasNewUnlocks) {
      this.tweens.add({
        targets: archiveBtn,
        scale: { from: 1, to: 1.04 },
        duration: 1000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }

    archiveBtn.on('pointerover', () => {
      archiveBtn.setBackgroundColor('#bb77ff');
      this.audioManager.play('hover');
    });

    archiveBtn.on('pointerout', () => {
      archiveBtn.setBackgroundColor('#aa66ff');
    });

    archiveBtn.on('pointerdown', () => {
      this.audioManager.play('select');
      this.scene.start('ArchiveScene');
    });

    this.add.text(GameConfig.width / 2, 668, `档案解锁: ${totalUnlocked}/${totalCount}`, {
      fontSize: '11px',
      color: '#cc99ff'
    }).setOrigin(0.5);

    const saveData = this.saveManager.getSaveData();
    this.add.text(GameConfig.width / 2, 686, `生存最高分: ${saveData.highScore}`, {
      fontSize: '12px',
      color: '#ffcc00'
    }).setOrigin(0.5);

    this.add.text(GameConfig.width / 2, 701, `无尽最高分: ${this.saveManager.getEndlessBestScore()}`, {
      fontSize: '12px',
      color: '#ff66ff'
    }).setOrigin(0.5);

    this.add.text(GameConfig.width / 2, 715, `总药片: ${saveData.totalPills} | 游戏: ${saveData.gamesPlayed}`, {
      fontSize: '11px',
      color: '#00ff88'
    }).setOrigin(0.5);

    this.add.text(GameConfig.width / 2, 730, '← → 移动 | 空格 跳跃 | Shift 切换角色', {
      fontSize: '11px',
      color: '#666666'
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
