import Phaser from 'phaser';
import { GameConfig, PillType, PillColors, TimeOfDayConfigs } from '../config/GameConfig';
import { AudioManager } from '../audio/AudioManager';
import { Player } from '../characters/Player';
import { TimeOfDay, FloorEvent } from '../types';

export class HUD {
  private scene: Phaser.Scene;
  private scoreText!: Phaser.GameObjects.Text;
  private floorText!: Phaser.GameObjects.Text;
  private pillText!: Phaser.GameObjects.Text;
  private effectText!: Phaser.GameObjects.Text;
  private effectIcon!: Phaser.GameObjects.Graphics;
  private shieldIcon!: Phaser.GameObjects.Graphics;
  private audioManager: AudioManager;
  private musicBtn!: Phaser.GameObjects.Text;
  private sfxBtn!: Phaser.GameObjects.Text;
  private currentEffectTimer!: Phaser.Time.TimerEvent | null;
  private scorePopup: Phaser.GameObjects.Text[] = [];
  private timeText!: Phaser.GameObjects.Text;
  private timeIcon!: Phaser.GameObjects.Text;
  private timeDescText!: Phaser.GameObjects.Text;
  private timeBarBg!: Phaser.GameObjects.Graphics;
  private timeBar!: Phaser.GameObjects.Graphics;
  private eventText!: Phaser.GameObjects.Text;
  private eventDescription!: Phaser.GameObjects.Text;
  private eventTimerBar!: Phaser.GameObjects.Graphics;
  private eventTimerBarBg!: Phaser.GameObjects.Graphics;
  private currentEvent: FloorEvent | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.audioManager = AudioManager.getInstance();
    this.createUI();
    this.setupEvents();
  }

  private createUI(): void {
    const scrollY = this.scene.cameras.main.scrollY;

    this.scene.add.rectangle(GameConfig.width / 2, 30 + scrollY, GameConfig.width, 60, 0x000000, 0.7).setScrollFactor(0).setDepth(100);

    this.scoreText = this.scene.add.text(20, 15 + scrollY, '0', {
      fontSize: '24px',
      color: '#00ffff',
      fontStyle: 'bold'
    }).setScrollFactor(0).setDepth(101);

    this.floorText = this.scene.add.text(GameConfig.width / 2, 15 + scrollY, 'B1F', {
      fontSize: '20px',
      color: '#ffcc00',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(101);

    this.pillText = this.scene.add.text(GameConfig.width - 100, 15 + scrollY, '0', {
      fontSize: '20px',
      color: '#00ff88',
      fontStyle: 'bold'
    }).setScrollFactor(0).setDepth(101);

    const pillIcon = this.scene.add.graphics();
    pillIcon.fillStyle(0x00ff88);
    pillIcon.fillCircle(GameConfig.width - 115, 27 + scrollY, 8);
    pillIcon.setScrollFactor(0).setDepth(101);

    this.timeIcon = this.scene.add.text(20, 50 + scrollY, '🌅', {
      fontSize: '18px'
    }).setScrollFactor(0).setDepth(101);

    this.timeText = this.scene.add.text(45, 48 + scrollY, '黎明', {
      fontSize: '13px',
      color: '#ffaa00',
      fontStyle: 'bold'
    }).setScrollFactor(0).setDepth(101);

    this.timeDescText = this.scene.add.text(45, 63 + scrollY, '', {
      fontSize: '10px',
      color: '#cc9966'
    }).setScrollFactor(0).setDepth(101);

    this.timeBarBg = this.scene.add.graphics().setScrollFactor(0).setDepth(101);
    this.timeBar = this.scene.add.graphics().setScrollFactor(0).setDepth(101);

    this.eventText = this.scene.add.text(GameConfig.width / 2, 105 + scrollY, '', {
      fontSize: '18px',
      color: '#ff6600',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(101).setAlpha(0);

    this.eventDescription = this.scene.add.text(GameConfig.width / 2, 128 + scrollY, '', {
      fontSize: '12px',
      color: '#ffcc88'
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(101).setAlpha(0);

    this.eventTimerBarBg = this.scene.add.graphics().setScrollFactor(0).setDepth(101);
    this.eventTimerBar = this.scene.add.graphics().setScrollFactor(0).setDepth(101);

    this.effectText = this.scene.add.text(GameConfig.width / 2, 155 + scrollY, '', {
      fontSize: '16px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(101).setAlpha(0);

    this.effectIcon = this.scene.add.graphics().setScrollFactor(0).setDepth(101);

    this.shieldIcon = this.scene.add.graphics().setScrollFactor(0).setDepth(101);
    this.shieldIcon.setVisible(false);

    this.musicBtn = this.scene.add.text(10, GameConfig.height - 40 + scrollY, '♪', {
      fontSize: '24px',
      color: '#ffffff',
      backgroundColor: '#222222',
      padding: { left: 10, right: 10, top: 5, bottom: 5 }
    }).setScrollFactor(0).setDepth(101).setInteractive({ useHandCursor: true });

    this.musicBtn.on('pointerdown', () => {
      const enabled = this.audioManager.toggleMusic();
      this.musicBtn.setColor(enabled ? '#ffffff' : '#666666');
      this.audioManager.play('select');
    });

    this.sfxBtn = this.scene.add.text(60, GameConfig.height - 40 + scrollY, '🔊', {
      fontSize: '20px',
      color: '#ffffff',
      backgroundColor: '#222222',
      padding: { left: 10, right: 10, top: 7, bottom: 7 }
    }).setScrollFactor(0).setDepth(101).setInteractive({ useHandCursor: true });

    this.sfxBtn.on('pointerdown', () => {
      const enabled = this.audioManager.toggleSFX();
      this.sfxBtn.setColor(enabled ? '#ffffff' : '#666666');
      this.audioManager.play('select');
    });
  }

  private setupEvents(): void {
    this.scene.events.on('scoreBonus', (value: number) => {
      this.showScorePopup(value);
    });
  }

  updateScore(score: number): void {
    this.scoreText.setText(score.toString());

    this.scene.tweens.add({
      targets: this.scoreText,
      scale: { from: 1.2, to: 1 },
      duration: 200
    });
  }

  updateFloor(floor: number): void {
    this.floorText.setText(`B${floor + 1}F`);

    this.scene.tweens.add({
      targets: this.floorText,
      scale: { from: 1.3, to: 1 },
      duration: 300,
      ease: 'Elastic.easeOut'
    });
  }

  updatePills(count: number): void {
    this.pillText.setText(count.toString());
  }

  updateTimeOfDay(time: TimeOfDay, progress: number): void {
    const config = TimeOfDayConfigs[time];
    this.timeIcon.setText(config.icon);
    this.timeText.setText(config.name);
    this.timeDescText.setText(config.description);

    const scrollY = this.scene.cameras.main.scrollY;
    const barX = 180;
    const barY = 57 + scrollY;
    const barWidth = 70;
    const barHeight = 5;

    this.timeBarBg.clear();
    this.timeBarBg.fillStyle(0x333333, 0.8);
    this.timeBarBg.fillRect(barX, barY, barWidth, barHeight);

    this.timeBar.clear();
    this.timeBar.fillStyle(0xffaa00, 1);
    this.timeBar.fillRect(barX, barY, barWidth * progress, barHeight);
  }

  showEvent(event: FloorEvent): void {
    this.currentEvent = event;

    this.eventText.setText(`⚡ ${event.name}`);
    this.eventText.setAlpha(1);
    this.eventDescription.setText(event.description);
    this.eventDescription.setAlpha(1);

    this.scene.tweens.add({
      targets: [this.eventText, this.eventDescription],
      y: '+=5',
      duration: 300,
      yoyo: true,
      repeat: 2
    });
  }

  hideEvent(): void {
    this.currentEvent = null;
    this.scene.tweens.add({
      targets: [this.eventText, this.eventDescription, this.eventTimerBar, this.eventTimerBarBg],
      alpha: 0,
      duration: 300
    });
  }

  updateEventProgress(progress: number): void {
    if (!this.currentEvent) return;

    const scrollY = this.scene.cameras.main.scrollY;
    const barX = GameConfig.width / 2 - 60;
    const barY = 150 + scrollY;
    const barWidth = 120;
    const barHeight = 4;

    this.eventTimerBarBg.clear();
    this.eventTimerBarBg.fillStyle(0x333333, 0.8);
    this.eventTimerBarBg.fillRect(barX, barY, barWidth, barHeight);
    this.eventTimerBarBg.setAlpha(1);

    this.eventTimerBar.clear();
    this.eventTimerBar.fillStyle(0xff6600, 1);
    this.eventTimerBar.fillRect(barX, barY, barWidth * (1 - progress), barHeight);
    this.eventTimerBar.setAlpha(1);
  }

  showEffect(type: PillType): void {
    const effectNames: Record<PillType, string> = {
      [PillType.SPEED]: '速度提升!',
      [PillType.SLOW]: '保安减速!',
      [PillType.SCORE]: '分数+500!',
      [PillType.SHIELD]: '护盾激活!'
    };

    this.effectText.setText(effectNames[type]);
    this.effectText.setColor(`#${PillColors[type].toString(16).padStart(6, '0')}`);
    this.effectText.setAlpha(1);

    if (this.currentEffectTimer) {
      this.currentEffectTimer.destroy();
    }

    this.effectIcon.clear();
    this.effectIcon.fillStyle(PillColors[type]);
    this.effectIcon.fillCircle(GameConfig.width / 2 - 80, 165 + this.scene.cameras.main.scrollY, 10);

    this.scene.tweens.add({
      targets: [this.effectText, this.effectIcon],
      y: '+=10',
      duration: 500,
      yoyo: true,
      repeat: -1
    });

    this.currentEffectTimer = this.scene.time.delayedCall(2000, () => {
      this.scene.tweens.add({
        targets: [this.effectText, this.effectIcon],
        alpha: 0,
        duration: 500
      });
    });

    if (type === PillType.SHIELD) {
      this.showShield();
    }

    const player = this.scene.children.list.find(c => c instanceof Player) as Player;
    if (player && type === PillType.SCORE) {
      const currentScore = parseInt(this.scoreText.text);
      this.updateScore(currentScore + 500);
    }
  }

  private showShield(): void {
    this.shieldIcon.setVisible(true);
    this.shieldIcon.clear();
    this.shieldIcon.lineStyle(2, 0xff00ff, 0.8);
    this.shieldIcon.strokeCircle(50, 60 + this.scene.cameras.main.scrollY, 15);
  }

  hideShield(): void {
    this.shieldIcon.setVisible(false);
  }

  private showScorePopup(value: number): void {
    const scrollY = this.scene.cameras.main.scrollY;
    const popup = this.scene.add.text(GameConfig.width / 2, GameConfig.height / 2 + scrollY, `+${value}`, {
      fontSize: '32px',
      color: '#ffcc00',
      fontStyle: 'bold'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(102);

    this.scorePopup.push(popup);

    this.scene.tweens.add({
      targets: popup,
      y: '-=100',
      alpha: 0,
      duration: 1000,
      onComplete: () => {
        popup.destroy();
        const index = this.scorePopup.indexOf(popup);
        if (index > -1) this.scorePopup.splice(index, 1);
      }
    });
  }

  update(): void {
    const scrollY = this.scene.cameras.main.scrollY;

    if (this.shieldIcon.visible) {
      const pulse = Math.sin(this.scene.time.now * 0.01) * 0.3 + 0.7;
      this.shieldIcon.clear();
      this.shieldIcon.lineStyle(2, 0xff00ff, pulse);
      this.shieldIcon.strokeCircle(50, 60 + scrollY, 15);
    }
  }
}

