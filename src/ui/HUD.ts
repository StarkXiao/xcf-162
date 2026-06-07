import Phaser from 'phaser';
import { GameConfig, PillType, PillColors, TimeOfDayConfigs, PillSideEffectConfig, ShopItemConfigs } from '../config/GameConfig';
import { AudioManager } from '../audio/AudioManager';
import { Player } from '../characters/Player';
import { TimeOfDay, FloorEvent, ShopItemType } from '../types';

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
  private comboText!: Phaser.GameObjects.Text;
  private noDamageText!: Phaser.GameObjects.Text;
  private multiplierText!: Phaser.GameObjects.Text;
  private addictionBarBg!: Phaser.GameObjects.Graphics;
  private addictionBar!: Phaser.GameObjects.Graphics;
  private addictionText!: Phaser.GameObjects.Text;
  private addictionIcon!: Phaser.GameObjects.Text;
  private sideEffectStatusText!: Phaser.GameObjects.Text;
  private sideEffectWarningText!: Phaser.GameObjects.Text;
  private sideEffectWarningBg!: Phaser.GameObjects.Graphics;
  private currentAddictionLevel: number = 0;
  private isHallucinating: boolean = false;
  private isOutOfControl: boolean = false;

  private shopBtn!: Phaser.GameObjects.Text;
  private shopPanel!: Phaser.GameObjects.Container;
  private shopPanelBg!: Phaser.GameObjects.Graphics;
  private shopPanelVisible: boolean = false;
  private onShopPurchaseCallback: ((itemType: ShopItemType) => boolean) | null = null;
  private currentPillCount: number = 0;
  private shopItemButtons: Map<ShopItemType, Phaser.GameObjects.Text> = new Map();

  private volumeSliderContainer: Phaser.GameObjects.Container | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.audioManager = AudioManager.getInstance();
    this.createUI();
    this.setupEvents();
    this.updateAddictionLevel(0);
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

    this.comboText = this.scene.add.text(GameConfig.width / 2, 80 + scrollY, '', {
      fontSize: '18px',
      color: '#ff66ff',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(101).setAlpha(0);

    this.noDamageText = this.scene.add.text(GameConfig.width / 2, 100 + scrollY, '', {
      fontSize: '14px',
      color: '#66ff66',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(101).setAlpha(0);

    this.multiplierText = this.scene.add.text(GameConfig.width - 20, 50 + scrollY, '', {
      fontSize: '16px',
      color: '#ff6600',
      fontStyle: 'bold'
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(101).setAlpha(0);

    this.addictionIcon = this.scene.add.text(20, 75 + scrollY, '☠', {
      fontSize: '14px',
      color: '#888888'
    }).setScrollFactor(0).setDepth(101);

    this.addictionText = this.scene.add.text(40, 73 + scrollY, '0%', {
      fontSize: '12px',
      color: '#888888',
      fontStyle: 'bold'
    }).setScrollFactor(0).setDepth(101);

    this.addictionBarBg = this.scene.add.graphics().setScrollFactor(0).setDepth(101);
    this.addictionBar = this.scene.add.graphics().setScrollFactor(0).setDepth(101);

    this.sideEffectWarningBg = this.scene.add.graphics().setScrollFactor(0).setDepth(199);
    this.sideEffectWarningBg.setVisible(false);

    this.sideEffectWarningText = this.scene.add.text(GameConfig.width / 2, GameConfig.height / 2 - 100 + scrollY, '', {
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5).setScrollFactor(0).setDepth(200).setAlpha(0);

    this.sideEffectStatusText = this.scene.add.text(GameConfig.width / 2, 180 + scrollY, '', {
      fontSize: '14px',
      color: '#ff0066',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(101).setAlpha(0);

    this.musicBtn = this.scene.add.text(10, GameConfig.height - 40 + scrollY, '', {
      fontSize: '12px',
      color: '#ffffff',
      backgroundColor: '#222244',
      padding: { left: 8, right: 8, top: 8, bottom: 8 },
      fontStyle: 'bold'
    }).setScrollFactor(0).setDepth(101).setInteractive({ useHandCursor: true });

    let musicPressTimer: Phaser.Time.TimerEvent | null = null;
    let musicLongPressed = false;
    this.musicBtn.on('pointerdown', () => {
      musicLongPressed = false;
      musicPressTimer = this.scene.time.delayedCall(300, () => {
        musicLongPressed = true;
        this.showMusicVolumeSlider();
      });
    });
    this.musicBtn.on('pointerup', () => {
      if (musicPressTimer) musicPressTimer.remove();
      if (!musicLongPressed) {
        this.audioManager.toggleMusic();
        this.updateAudioButtons();
        this.audioManager.play('select');
      }
    });
    this.musicBtn.on('pointerout', () => {
      if (musicPressTimer) musicPressTimer.remove();
    });

    this.sfxBtn = this.scene.add.text(75, GameConfig.height - 40 + scrollY, '', {
      fontSize: '12px',
      color: '#ffffff',
      backgroundColor: '#224422',
      padding: { left: 8, right: 8, top: 8, bottom: 8 },
      fontStyle: 'bold'
    }).setScrollFactor(0).setDepth(101).setInteractive({ useHandCursor: true });

    let sfxPressTimer: Phaser.Time.TimerEvent | null = null;
    let sfxLongPressed = false;
    this.sfxBtn.on('pointerdown', () => {
      sfxLongPressed = false;
      sfxPressTimer = this.scene.time.delayedCall(300, () => {
        sfxLongPressed = true;
        this.showSfxVolumeSlider();
      });
    });
    this.sfxBtn.on('pointerup', () => {
      if (sfxPressTimer) sfxPressTimer.remove();
      if (!sfxLongPressed) {
        this.audioManager.toggleSFX();
        this.updateAudioButtons();
        this.audioManager.play('select');
      }
    });
    this.sfxBtn.on('pointerout', () => {
      if (sfxPressTimer) sfxPressTimer.remove();
    });

    this.updateAudioButtons();

    this.shopBtn = this.scene.add.text(GameConfig.width - 55, GameConfig.height - 40 + scrollY, '🛒', {
      fontSize: '22px',
      color: '#ffffff',
      backgroundColor: '#333366',
      padding: { left: 10, right: 10, top: 6, bottom: 6 }
    }).setScrollFactor(0).setDepth(101).setInteractive({ useHandCursor: true });

    this.shopBtn.on('pointerover', () => {
      this.shopBtn.setBackgroundColor('#4444aa');
    });
    this.shopBtn.on('pointerout', () => {
      this.shopBtn.setBackgroundColor('#333366');
    });
    this.shopBtn.on('pointerdown', () => {
      this.audioManager.play('select');
      this.toggleShopPanel();
    });

    this.createShopPanel();
  }

  private setupEvents(): void {
    this.scene.events.on('scoreBonus', (value: number) => {
      this.showScorePopup(value);
    });

    this.scene.events.on('addictionLevelChanged', (level: number) => {
      this.updateAddictionLevel(level);
    });

    this.scene.events.on('addictionWarning', (severity: string) => {
      this.showAddictionWarning(severity);
    });

    this.scene.events.on('hallucinationStarted', (_duration: number) => {
      this.isHallucinating = true;
      this.updateSideEffectStatus();
    });

    this.scene.events.on('hallucinationEnded', () => {
      this.isHallucinating = false;
      this.updateSideEffectStatus();
    });

    this.scene.events.on('lossOfControlStarted', (_duration: number) => {
      this.isOutOfControl = true;
      this.updateSideEffectStatus();
    });

    this.scene.events.on('lossOfControlEnded', () => {
      this.isOutOfControl = false;
      this.updateSideEffectStatus();
    });
  }

  updateAddictionLevel(level: number): void {
    this.currentAddictionLevel = level;
    this.addictionText.setText(`${Math.floor(level)}%`);

    let color = '#888888';
    if (level >= PillSideEffectConfig.WARNING_THRESHOLD_CRITICAL) color = '#ff0000';
    else if (level >= PillSideEffectConfig.WARNING_THRESHOLD_HIGH) color = '#ff0066';
    else if (level >= PillSideEffectConfig.WARNING_THRESHOLD_MEDIUM) color = '#ffaa00';
    else if (level >= PillSideEffectConfig.WARNING_THRESHOLD_LOW) color = '#ffcc00';

    this.addictionText.setColor(color);
    this.addictionIcon.setColor(color);

    const scrollY = this.scene.cameras.main.scrollY;
    const barX = 65;
    const barY = 77 + scrollY;
    const barWidth = 100;
    const barHeight = 6;
    const progress = Math.max(0, Math.min(1, level / PillSideEffectConfig.MAX_ADDICTION));

    this.addictionBarBg.clear();
    this.addictionBarBg.fillStyle(0x333333, 0.8);
    this.addictionBarBg.fillRect(barX, barY, barWidth, barHeight);

    this.addictionBar.clear();
    let barColor = 0x888888;
    if (level >= PillSideEffectConfig.WARNING_THRESHOLD_CRITICAL) barColor = 0xff0000;
    else if (level >= PillSideEffectConfig.WARNING_THRESHOLD_HIGH) barColor = 0xff0066;
    else if (level >= PillSideEffectConfig.WARNING_THRESHOLD_MEDIUM) barColor = 0xffaa00;
    else if (level >= PillSideEffectConfig.WARNING_THRESHOLD_LOW) barColor = 0xffcc00;
    this.addictionBar.fillStyle(barColor, 1);
    this.addictionBar.fillRect(barX, barY, barWidth * progress, barHeight);
  }

  showAddictionWarning(severity: string): void {
    const warnings: Record<string, { text: string; color: string; bgColor: number }> = {
      low: { text: '⚠ 开始成瘾...', color: '#ffcc00', bgColor: 0xffcc00 },
      medium: { text: '⚠⚠ 依赖加深！', color: '#ffaa00', bgColor: 0xffaa00 },
      high: { text: '⚠⚠⚠ 危险！失控边缘！', color: '#ff0066', bgColor: 0xff0066 },
      critical: { text: '☠☠☠ 极度危险！随时失控！', color: '#ff0000', bgColor: 0xff0000 }
    };

    const warning = warnings[severity];
    if (!warning) return;

    const scrollY = this.scene.cameras.main.scrollY;
    this.sideEffectWarningBg.setVisible(true);
    this.sideEffectWarningBg.clear();
    this.sideEffectWarningBg.fillStyle(warning.bgColor, 0.2);
    this.sideEffectWarningBg.fillRect(0, GameConfig.height / 2 - 130 + scrollY, GameConfig.width, 80);

    this.sideEffectWarningText.setText(warning.text);
    this.sideEffectWarningText.setColor(warning.color);
    this.sideEffectWarningText.setAlpha(1);

    this.scene.tweens.add({
      targets: this.sideEffectWarningText,
      scale: { from: 1.5, to: 1 },
      duration: 400,
      ease: 'Elastic.easeOut'
    });

    this.scene.time.delayedCall(2500, () => {
      this.scene.tweens.add({
        targets: [this.sideEffectWarningText, this.sideEffectWarningBg],
        alpha: 0,
        duration: 500,
        onComplete: () => {
          this.sideEffectWarningBg.setVisible(false);
        }
      });
    });
  }

  private updateSideEffectStatus(): void {
    if (this.isHallucinating || this.isOutOfControl) {
      let status = '';
      if (this.isHallucinating && this.isOutOfControl) {
        status = '☠ 幻觉 + 失控！';
      } else if (this.isHallucinating) {
        status = '✦ 幻觉中...';
      } else if (this.isOutOfControl) {
        status = '⚡ 失控中...';
      }
      this.sideEffectStatusText.setText(status);
      this.sideEffectStatusText.setAlpha(1);
      this.scene.tweens.add({
        targets: this.sideEffectStatusText,
        scale: { from: 1.4, to: 1 },
        duration: 300,
        ease: 'Elastic.easeOut'
      });
    } else {
      this.scene.tweens.add({
        targets: this.sideEffectStatusText,
        alpha: 0,
        duration: 300
      });
    }
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

  showShield(): void {
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

  updateCombo(combo: number): void {
    if (combo <= 0) {
      this.scene.tweens.add({
        targets: this.comboText,
        alpha: 0,
        scale: 0.5,
        duration: 200
      });
      return;
    }

    this.comboText.setText(`${combo} 连击!`);
    this.comboText.setAlpha(1);

    this.scene.tweens.add({
      targets: this.comboText,
      scale: { from: 1.6, to: 1 },
      duration: 250,
      ease: 'Elastic.easeOut'
    });

    const hue = (combo * 30) % 360;
    this.comboText.setColor(`hsl(${hue}, 100%, 70%)`);
  }

  updateNoDamageFloors(floors: number): void {
    if (floors <= 0) {
      this.scene.tweens.add({
        targets: this.noDamageText,
        alpha: 0,
        duration: 200
      });
      return;
    }

    this.noDamageText.setText(`无伤连层 ${floors}`);
    this.noDamageText.setAlpha(1);

    this.scene.tweens.add({
      targets: this.noDamageText,
      scale: { from: 1.4, to: 1 },
      duration: 250,
      ease: 'Elastic.easeOut'
    });
  }

  showComboBonus(value: number, combo: number): void {
    const scrollY = this.scene.cameras.main.scrollY;
    const popup = this.scene.add.text(GameConfig.width / 2, GameConfig.height / 2 - 40 + scrollY, `连击 +${value}`, {
      fontSize: '28px',
      color: '#ff66ff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5).setScrollFactor(0).setDepth(102);

    if (combo >= 5) {
      popup.setFontSize(36);
      popup.setColor('#ffff00');
    }
    if (combo >= 10) {
      popup.setFontSize(44);
      popup.setColor('#ff0066');
    }

    this.scorePopup.push(popup);

    this.scene.tweens.add({
      targets: popup,
      y: '-=120',
      alpha: 0,
      duration: 1200,
      onComplete: () => {
        popup.destroy();
        const index = this.scorePopup.indexOf(popup);
        if (index > -1) this.scorePopup.splice(index, 1);
      }
    });
  }

  showNoDamageBonus(value: number, floors: number): void {
    const scrollY = this.scene.cameras.main.scrollY;
    const popup = this.scene.add.text(GameConfig.width / 2, GameConfig.height / 2 - 80 + scrollY, `无伤 ${floors}层 +${value}`, {
      fontSize: '26px',
      color: '#66ff66',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5).setScrollFactor(0).setDepth(102);

    if (floors >= 5) {
      popup.setFontSize(32);
      popup.setColor('#00ffaa');
    }

    this.scorePopup.push(popup);

    this.scene.tweens.add({
      targets: popup,
      y: '-=130',
      alpha: 0,
      duration: 1300,
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

    if (this.isHallucinating || this.isOutOfControl || this.currentAddictionLevel >= PillSideEffectConfig.WARNING_THRESHOLD_MEDIUM) {
      const pulse = Math.sin(this.scene.time.now * 0.015) * 0.4 + 0.6;
      this.addictionIcon.setAlpha(pulse);
      this.addictionText.setAlpha(pulse);
    } else {
      this.addictionIcon.setAlpha(1);
      this.addictionText.setAlpha(1);
    }

    if (this.sideEffectStatusText.alpha > 0 && (this.isHallucinating || this.isOutOfControl)) {
      const wobble = Math.sin(this.scene.time.now * 0.02) * 2;
      const colorHue = (this.scene.time.now * 0.1) % 360;
      this.sideEffectStatusText.setY(180 + scrollY + wobble);
      this.sideEffectStatusText.setColor(`hsl(${colorHue}, 100%, 60%)`);
    }

    this.updateShopItemButtons();
  }

  private createShopPanel(): void {
    const scrollY = this.scene.cameras.main.scrollY;
    this.shopPanel = this.scene.add.container(0, 0).setScrollFactor(0).setDepth(150);
    this.shopPanel.setVisible(false);

    const panelW = 320;
    const panelH = 280;
    const panelX = (GameConfig.width - panelW) / 2;
    const panelY = (GameConfig.height - panelH) / 2 + scrollY;

    this.shopPanelBg = this.scene.add.graphics();
    this.shopPanelBg.fillStyle(0x0a0a20, 0.97);
    this.shopPanelBg.fillRoundedRect(panelX, panelY, panelW, panelH, 12);
    this.shopPanelBg.lineStyle(2, 0x6666ff, 0.9);
    this.shopPanelBg.strokeRoundedRect(panelX, panelY, panelW, panelH, 12);

    const title = this.scene.add.text(GameConfig.width / 2, panelY + 25, '🏪 局内商店', {
      fontSize: '20px',
      color: '#ffff66',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const closeBtn = this.scene.add.text(panelX + panelW - 20, panelY + 15, '✕', {
      fontSize: '18px',
      color: '#ff6666',
      fontStyle: 'bold'
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => {
      this.audioManager.play('select');
      this.hideShopPanel();
    });

    const pillBalanceLabel = this.scene.add.text(panelX + 15, panelY + 55, '药片余额:', {
      fontSize: '14px',
      color: '#88ff88',
      fontStyle: 'bold'
    });

    const pillBalanceValue = this.scene.add.text(panelX + 90, panelY + 55, '0', {
      fontSize: '14px',
      color: '#00ff88',
      fontStyle: 'bold'
    });
    pillBalanceValue.setName('pillBalance');

    this.shopPanel.add([this.shopPanelBg, title, closeBtn, pillBalanceLabel, pillBalanceValue]);

    const items = [ShopItemType.SHIELD, ShopItemType.SLOW_PULSE, ShopItemType.EMERGENCY_BOUNCE];
    items.forEach((itemType, i) => {
      const config = ShopItemConfigs[itemType];
      const itemY = panelY + 90 + i * 55;

      const itemBg = this.scene.add.graphics();
      itemBg.fillStyle(0x1a1a3a, 1);
      itemBg.fillRoundedRect(panelX + 10, itemY, panelW - 20, 48, 6);
      itemBg.lineStyle(1, config.color, 0.5);
      itemBg.strokeRoundedRect(panelX + 10, itemY, panelW - 20, 48, 6);

      const icon = this.scene.add.text(panelX + 22, itemY + 24, config.icon, {
        fontSize: '22px'
      }).setOrigin(0, 0.5);

      const nameLabel = this.scene.add.text(panelX + 52, itemY + 12, config.name, {
        fontSize: '14px',
        color: '#ffffff',
        fontStyle: 'bold'
      });

      const descLabel = this.scene.add.text(panelX + 52, itemY + 30, config.description, {
        fontSize: '11px',
        color: '#aaaaaa'
      });

      const buyBtn = this.scene.add.text(panelX + panelW - 20, itemY + 24, `💊${config.cost}`, {
        fontSize: '14px',
        color: '#ffffff',
        backgroundColor: '#226622',
        padding: { left: 8, right: 8, top: 5, bottom: 5 },
        fontStyle: 'bold'
      }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true });

      buyBtn.on('pointerover', () => {
        if (this.currentPillCount >= config.cost) {
          buyBtn.setBackgroundColor('#33aa33');
        }
      });
      buyBtn.on('pointerout', () => {
        buyBtn.setBackgroundColor(this.currentPillCount >= config.cost ? '#226622' : '#552222');
      });
      buyBtn.on('pointerdown', () => {
        if (this.currentPillCount >= config.cost) {
          this.audioManager.play('select');
          this.tryPurchase(itemType);
        } else {
          this.audioManager.play('gameover');
        }
      });

      this.shopItemButtons.set(itemType, buyBtn);
      this.shopPanel.add([itemBg, icon, nameLabel, descLabel, buyBtn]);
    });

    this.updateShopItemButtons();
  }

  private tryPurchase(itemType: ShopItemType): void {
    if (this.onShopPurchaseCallback) {
      const success = this.onShopPurchaseCallback(itemType);
      if (success) {
        this.showShopPurchaseFeedback(itemType);
      }
    }
  }

  private showShopPurchaseFeedback(itemType: ShopItemType): void {
    const config = ShopItemConfigs[itemType];
    const scrollY = this.scene.cameras.main.scrollY;
    const popup = this.scene.add.text(GameConfig.width / 2, GameConfig.height / 2 + scrollY, `✨ ${config.name} 已激活!`, {
      fontSize: '24px',
      color: `#${config.color.toString(16).padStart(6, '0')}`,
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setScrollFactor(0).setDepth(160);

    this.scene.tweens.add({
      targets: popup,
      y: '-=80',
      alpha: 0,
      scale: 1.3,
      duration: 900,
      ease: 'Cubic.easeOut',
      onComplete: () => popup.destroy()
    });
  }

  private updateShopItemButtons(): void {
    this.shopItemButtons.forEach((btn, itemType) => {
      const config = ShopItemConfigs[itemType];
      const canAfford = this.currentPillCount >= config.cost;
      btn.setBackgroundColor(canAfford ? '#226622' : '#552222');
      btn.setColor(canAfford ? '#ffffff' : '#888888');
    });

    if (this.shopPanel && this.shopPanel.visible) {
      const balanceText = this.shopPanel.getByName('pillBalance') as Phaser.GameObjects.Text;
      if (balanceText) {
        balanceText.setText(this.currentPillCount.toString());
      }
    }
  }

  toggleShopPanel(): void {
    if (this.shopPanelVisible) {
      this.hideShopPanel();
    } else {
      this.showShopPanel();
    }
  }

  showShopPanel(): void {
    if (!this.shopPanel) return;
    this.shopPanelVisible = true;
    this.shopPanel.setVisible(true);
    this.shopPanel.setAlpha(0);
    this.scene.tweens.add({
      targets: this.shopPanel,
      alpha: 1,
      scale: { from: 0.85, to: 1 },
      duration: 250,
      ease: 'Back.easeOut'
    });
    this.updateShopItemButtons();
  }

  hideShopPanel(): void {
    if (!this.shopPanel) return;
    this.shopPanelVisible = false;
    this.scene.tweens.add({
      targets: this.shopPanel,
      alpha: 0,
      scale: 0.85,
      duration: 200,
      ease: 'Cubic.easeIn',
      onComplete: () => this.shopPanel.setVisible(false)
    });
  }

  setShopPurchaseCallback(callback: (itemType: ShopItemType) => boolean): void {
    this.onShopPurchaseCallback = callback;
  }

  updatePills(count: number): void {
    this.pillText.setText(count.toString());
    this.currentPillCount = count;
    this.updateShopItemButtons();
  }

  updateMultiplier(multiplier: number, isRiskReward: boolean = false): void {
    if (multiplier <= 1.0 && !isRiskReward) {
      this.scene.tweens.add({
        targets: this.multiplierText,
        alpha: 0,
        duration: 200
      });
      return;
    }

    const label = isRiskReward ? '🔥 风险x' : 'x';
    this.multiplierText.setText(`${label}${multiplier.toFixed(1)}`);
    this.multiplierText.setAlpha(1);

    if (isRiskReward) {
      const hue = Math.min(30, (multiplier - 1) * 10);
      this.multiplierText.setColor(`hsl(${30 - hue}, 100%, ${Math.max(40, 70 - multiplier * 3)}%)`);
    } else {
      this.multiplierText.setColor('#ffcc00');
    }

    this.scene.tweens.add({
      targets: this.multiplierText,
      scale: { from: 1.5, to: 1 },
      duration: 300,
      ease: 'Elastic.easeOut'
    });
  }

  private updateAudioButtons(): void {
    const musicVol = this.audioManager.getMusicVolume();
    const musicEnabled = this.audioManager.isMusicEnabled();
    this.musicBtn.setText(musicEnabled ? `🎵${musicVol}%` : '🎵🔇');
    this.musicBtn.setColor(musicEnabled ? '#ffffff' : '#666666');
    this.musicBtn.setBackgroundColor(musicEnabled ? '#222244' : '#332222');

    const sfxVol = this.audioManager.getSFXVolume();
    const sfxEnabled = this.audioManager.isSFXEnabled();
    this.sfxBtn.setText(sfxEnabled ? `🔔${sfxVol}%` : '🔔🔇');
    this.sfxBtn.setColor(sfxEnabled ? '#ffffff' : '#666666');
    this.sfxBtn.setBackgroundColor(sfxEnabled ? '#224422' : '#332222');
  }

  private showMusicVolumeSlider(): void {
    this.showVolumeSlider('music');
  }

  private showSfxVolumeSlider(): void {
    this.showVolumeSlider('sfx');
  }

  private showVolumeSlider(type: 'music' | 'sfx'): void {
    this.hideVolumeSlider();

    const scrollY = this.scene.cameras.main.scrollY;
    const container = this.scene.add.container(0, 0).setScrollFactor(0).setDepth(140);

    const isMusic = type === 'music';
    const anchorX = isMusic ? 10 : 75;
    const color = isMusic ? 0xff99cc : 0x66ff99;
    const colorHex = isMusic ? '#ff99cc' : '#66ff99';
    const label = isMusic ? '🎵 音乐音量' : '🔔 音效音量';

    const panelW = 160;
    const panelH = 65;
    const panelX = anchorX;
    const panelY = GameConfig.height - 115 + scrollY;

    const bg = this.scene.add.graphics();
    bg.fillStyle(0x0a0a20, 0.95);
    bg.fillRoundedRect(panelX, panelY, panelW, panelH, 8);
    bg.lineStyle(2, color, 0.8);
    bg.strokeRoundedRect(panelX, panelY, panelW, panelH, 8);

    const title = this.scene.add.text(panelX + 10, panelY + 10, label, {
      fontSize: '12px',
      color: colorHex,
      fontStyle: 'bold'
    });

    const sliderX = panelX + 15;
    const sliderY = panelY + 35;
    const sliderW = panelW - 30;
    const sliderH = 6;

    const sliderBg = this.scene.add.graphics();
    sliderBg.fillStyle(0x333344, 1);
    sliderBg.fillRoundedRect(sliderX, sliderY - sliderH / 2, sliderW, sliderH, 3);

    const sliderFill = this.scene.add.graphics();

    const currentVol = isMusic ? this.audioManager.getMusicVolume() : this.audioManager.getSFXVolume();
    const muted = isMusic ? !this.audioManager.isMusicEnabled() : !this.audioManager.isSFXEnabled();
    const fillW = muted ? 0 : (currentVol / 100) * sliderW;
    sliderFill.fillStyle(color, 1);
    sliderFill.fillRoundedRect(sliderX, sliderY - sliderH / 2, fillW, sliderH, 3);

    const knobX = sliderX + (muted ? 0 : (currentVol / 100) * sliderW);
    const knob = this.scene.add.circle(knobX, sliderY, 7, color).setInteractive({ useHandCursor: true });

    const valueText = this.scene.add.text(panelX + panelW - 10, panelY + 10, muted ? '静音' : `${currentVol}%`, {
      fontSize: '12px',
      color: muted ? '#666666' : '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(1, 0);

    const muteBtn = this.scene.add.text(panelX + 10, panelY + panelH - 22, '', {
      fontSize: '11px',
      color: '#ffffff',
      backgroundColor: muted ? '#553333' : '#224466',
      padding: { left: 6, right: 6, top: 2, bottom: 2 },
      fontStyle: 'bold'
    }).setInteractive({ useHandCursor: true });
    muteBtn.setText(muted ? '🔇 已静音' : '🔊 点击静音');

    const closeBtn = this.scene.add.text(panelX + panelW - 10, panelY + panelH - 18, '✕', {
      fontSize: '12px',
      color: '#ff6666',
      fontStyle: 'bold'
    }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true });

    container.add([bg, title, sliderBg, sliderFill, knob, valueText, muteBtn, closeBtn]);
    this.volumeSliderContainer = container;

    let dragging = false;

    const updateFromPointer = (pointer: Phaser.Input.Pointer) => {
      const localX = Math.max(sliderX, Math.min(sliderX + sliderW, pointer.x));
      const percent = Math.round(((localX - sliderX) / sliderW) * 100);

      if (isMusic) {
        this.audioManager.setMusicVolume(percent);
        if (percent > 0 && !this.audioManager.isMusicEnabled()) {
          this.audioManager.setMusicMuted(false);
        }
      } else {
        this.audioManager.setSFXVolume(percent);
        if (percent > 0 && !this.audioManager.isSFXEnabled()) {
          this.audioManager.setSFXMuted(false);
        }
      }

      const isMutedNow = isMusic ? !this.audioManager.isMusicEnabled() : !this.audioManager.isSFXEnabled();
      const newVol = isMusic ? this.audioManager.getMusicVolume() : this.audioManager.getSFXVolume();
      const newFillW = isMutedNow ? 0 : (newVol / 100) * sliderW;
      sliderFill.clear();
      sliderFill.fillStyle(color, 1);
      sliderFill.fillRoundedRect(sliderX, sliderY - sliderH / 2, newFillW, sliderH, 3);
      knob.setX(sliderX + (isMutedNow ? 0 : (newVol / 100) * sliderW));
      valueText.setText(isMutedNow ? '静音' : `${newVol}%`);
      valueText.setColor(isMutedNow ? '#666666' : '#ffffff');
      muteBtn.setText(isMutedNow ? '🔇 已静音' : '🔊 点击静音');
      muteBtn.setBackgroundColor(isMutedNow ? '#553333' : '#224466');
      this.updateAudioButtons();
    };

    knob.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      dragging = true;
      updateFromPointer(pointer);
    });

    this.scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (dragging) {
        updateFromPointer(pointer);
      }
    });

    this.scene.input.on('pointerup', () => {
      if (dragging) {
        dragging = false;
        if (!isMusic) this.audioManager.play('hover');
      }
    });

    muteBtn.on('pointerover', () => {
      const isMutedNow = isMusic ? !this.audioManager.isMusicEnabled() : !this.audioManager.isSFXEnabled();
      if (!isMutedNow) muteBtn.setBackgroundColor('#3366aa');
    });
    muteBtn.on('pointerout', () => {
      const isMutedNow = isMusic ? !this.audioManager.isMusicEnabled() : !this.audioManager.isSFXEnabled();
      muteBtn.setBackgroundColor(isMutedNow ? '#553333' : '#224466');
    });
    muteBtn.on('pointerdown', () => {
      if (isMusic) {
        this.audioManager.toggleMusic();
      } else {
        this.audioManager.toggleSFX();
      }
      const isMutedNow = isMusic ? !this.audioManager.isMusicEnabled() : !this.audioManager.isSFXEnabled();
      const newVol = isMusic ? this.audioManager.getMusicVolume() : this.audioManager.getSFXVolume();
      const newFillW = isMutedNow ? 0 : (newVol / 100) * sliderW;
      sliderFill.clear();
      sliderFill.fillStyle(color, 1);
      sliderFill.fillRoundedRect(sliderX, sliderY - sliderH / 2, newFillW, sliderH, 3);
      knob.setX(sliderX + (isMutedNow ? 0 : (newVol / 100) * sliderW));
      knob.setFillStyle(isMutedNow ? 0x666666 : color);
      valueText.setText(isMutedNow ? '静音' : `${newVol}%`);
      valueText.setColor(isMutedNow ? '#666666' : '#ffffff');
      muteBtn.setText(isMutedNow ? '🔇 已静音' : '🔊 点击静音');
      muteBtn.setBackgroundColor(isMutedNow ? '#553333' : '#224466');
      this.updateAudioButtons();
      if (!isMutedNow) this.audioManager.play('select');
    });

    closeBtn.on('pointerdown', () => {
      this.hideVolumeSlider();
      this.audioManager.play('select');
    });
  }

  private hideVolumeSlider(): void {
    if (this.volumeSliderContainer) {
      this.volumeSliderContainer.destroy();
      this.volumeSliderContainer = null;
    }
  }
}

