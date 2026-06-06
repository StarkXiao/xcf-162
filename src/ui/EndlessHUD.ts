import Phaser from 'phaser';
import { GameConfig, PillType, PillColors, GuardChaseState, GuardChaseStateConfig, PillSideEffectConfig } from '../config/GameConfig';
import { AudioManager } from '../audio/AudioManager';

export class EndlessHUD {
  private scene: Phaser.Scene;
  private audioManager: AudioManager;
  private scoreText!: Phaser.GameObjects.Text;
  private floorText!: Phaser.GameObjects.Text;
  private pillText!: Phaser.GameObjects.Text;
  private multiplierText!: Phaser.GameObjects.Text;
  private multiplierIcon!: Phaser.GameObjects.Text;
  private timerText!: Phaser.GameObjects.Text;
  private timerLabel!: Phaser.GameObjects.Text;
  private timerBarBg!: Phaser.GameObjects.Graphics;
  private timerBar!: Phaser.GameObjects.Graphics;
  private comboText!: Phaser.GameObjects.Text;
  private effectText!: Phaser.GameObjects.Text;
  private effectIcon!: Phaser.GameObjects.Graphics;
  private shieldIcon!: Phaser.GameObjects.Graphics;
  private currentEffectTimer!: Phaser.Time.TimerEvent | null;
  private scorePopup: Phaser.GameObjects.Text[] = [];
  private musicBtn!: Phaser.GameObjects.Text;
  private sfxBtn!: Phaser.GameObjects.Text;
  private timeBonusPopup!: Phaser.GameObjects.Text;
  private nextMilestoneText!: Phaser.GameObjects.Text;
  private chaseStateText!: Phaser.GameObjects.Text;
  private chaseStateIcon!: Phaser.GameObjects.Text;
  private chaseStateBanner!: Phaser.GameObjects.Text;
  private chaseStateBannerBg!: Phaser.GameObjects.Graphics;
  private currentChaseState: GuardChaseState = GuardChaseState.PATROL;
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

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.audioManager = AudioManager.getInstance();
    this.createUI();
    this.setupEvents();
  }

  private createUI(): void {
    const scrollY = this.scene.cameras.main.scrollY;

    const topBar = this.scene.add.graphics();
    topBar.setScrollFactor(0).setDepth(100);
    topBar.fillStyle(0x1a0a2e, 0.9);
    topBar.fillRect(0, 0 + scrollY, GameConfig.width, 75);
    topBar.lineStyle(2, 0xff66ff, 0.8);
    topBar.strokeRect(0, 0 + scrollY, GameConfig.width, 75);

    this.multiplierIcon = this.scene.add.text(15, 8 + scrollY, '⚡', {
      fontSize: '22px'
    }).setScrollFactor(0).setDepth(101);

    this.multiplierText = this.scene.add.text(42, 8 + scrollY, 'x1.0', {
      fontSize: '22px',
      color: '#ffcc00',
      fontStyle: 'bold'
    }).setScrollFactor(0).setDepth(101);

    this.scoreText = this.scene.add.text(15, 38 + scrollY, '0', {
      fontSize: '26px',
      color: '#ff66ff',
      fontStyle: 'bold'
    }).setScrollFactor(0).setDepth(101);

    this.floorText = this.scene.add.text(GameConfig.width / 2, 10 + scrollY, 'B1F', {
      fontSize: '22px',
      color: '#00ffff',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(101);

    this.nextMilestoneText = this.scene.add.text(GameConfig.width / 2, 38 + scrollY, '', {
      fontSize: '12px',
      color: '#888888'
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(101);

    const initialStateConfig = GuardChaseStateConfig[GuardChaseState.PATROL];
    this.chaseStateIcon = this.scene.add.text(GameConfig.width - 160, 8 + scrollY, initialStateConfig.alertIcon, {
      fontSize: '20px'
    }).setScrollFactor(0).setDepth(101);

    this.chaseStateText = this.scene.add.text(GameConfig.width - 130, 10 + scrollY, initialStateConfig.name, {
      fontSize: '14px',
      color: initialStateConfig.alertColor,
      fontStyle: 'bold'
    }).setScrollFactor(0).setDepth(101);

    this.chaseStateBannerBg = this.scene.add.graphics().setScrollFactor(0).setDepth(200);
    this.chaseStateBannerBg.setVisible(false);

    this.chaseStateBanner = this.scene.add.text(GameConfig.width / 2, GameConfig.height / 2 + scrollY, '', {
      fontSize: '36px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5).setScrollFactor(0).setDepth(201).setAlpha(0);

    this.pillText = this.scene.add.text(GameConfig.width - 70, 8 + scrollY, '0', {
      fontSize: '20px',
      color: '#00ff88',
      fontStyle: 'bold'
    }).setScrollFactor(0).setDepth(101);

    const pillIcon = this.scene.add.graphics();
    pillIcon.fillStyle(0x00ff88);
    pillIcon.fillCircle(GameConfig.width - 85, 20 + scrollY, 8);
    pillIcon.setScrollFactor(0).setDepth(101);

    this.timerLabel = this.scene.add.text(GameConfig.width - 140, 38 + scrollY, '剩余', {
      fontSize: '12px',
      color: '#aaaaaa'
    }).setScrollFactor(0).setDepth(101);

    this.timerText = this.scene.add.text(GameConfig.width - 70, 35 + scrollY, '01:30', {
      fontSize: '22px',
      color: '#00ff00',
      fontStyle: 'bold'
    }).setScrollFactor(0).setDepth(101);

    this.timerBarBg = this.scene.add.graphics().setScrollFactor(0).setDepth(101);
    this.timerBar = this.scene.add.graphics().setScrollFactor(0).setDepth(101);

    const midBar = this.scene.add.graphics();
    midBar.setScrollFactor(0).setDepth(100);
    midBar.fillStyle(0x1a0a2e, 0.7);
    midBar.fillRect(0, 80 + scrollY, GameConfig.width, 35);

    this.comboText = this.scene.add.text(GameConfig.width / 2, 85 + scrollY, '', {
      fontSize: '18px',
      color: '#ff66ff',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(101).setAlpha(0);

    this.effectText = this.scene.add.text(GameConfig.width / 2, 125 + scrollY, '', {
      fontSize: '16px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(101).setAlpha(0);

    this.effectIcon = this.scene.add.graphics().setScrollFactor(0).setDepth(101);

    this.shieldIcon = this.scene.add.graphics().setScrollFactor(0).setDepth(101);
    this.shieldIcon.setVisible(false);

    this.addictionIcon = this.scene.add.text(15, 95 + scrollY, '☠', {
      fontSize: '14px',
      color: '#888888'
    }).setScrollFactor(0).setDepth(101);

    this.addictionText = this.scene.add.text(35, 93 + scrollY, '0%', {
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

    this.sideEffectStatusText = this.scene.add.text(GameConfig.width / 2, 165 + scrollY, '', {
      fontSize: '14px',
      color: '#ff0066',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(101).setAlpha(0);

    this.timeBonusPopup = this.scene.add.text(GameConfig.width / 2, 0, '', {
      fontSize: '20px',
      color: '#00ff00',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setScrollFactor(0).setDepth(102).setAlpha(0);

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
    const barX = 60;
    const barY = 97 + scrollY;
    const barWidth = 90;
    const barHeight = 5;
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
      scale: { from: 1.4, to: 1 },
      duration: 300,
      ease: 'Elastic.easeOut'
    });

    this.updateNextMilestone(floor);
  }

  private updateNextMilestone(floor: number): void {
    const nextMul = GameConfig.endlessFloorMultipliers.find(m => m.floor > floor + 1);
    if (nextMul) {
      this.nextMilestoneText.setText(`下一倍率 B${nextMul.floor}F → x${nextMul.multiplier}`);
    } else {
      this.nextMilestoneText.setText('已达最高倍率!');
    }
  }

  updatePills(count: number): void {
    this.pillText.setText(count.toString());
  }

  updateMultiplier(multiplier: number): void {
    this.multiplierText.setText(`x${multiplier.toFixed(1)}`);

    let color = '#ffcc00';
    if (multiplier >= 10) color = '#ff0066';
    else if (multiplier >= 5) color = '#ff6600';
    else if (multiplier >= 3) color = '#ff66ff';
    else if (multiplier >= 2) color = '#00ffff';
    else if (multiplier >= 1.5) color = '#00ff88';

    this.multiplierText.setColor(color);

    this.scene.tweens.add({
      targets: [this.multiplierText, this.multiplierIcon],
      scale: { from: 1.5, to: 1 },
      duration: 400,
      ease: 'Elastic.easeOut'
    });
  }

  updateTimer(timeRemainingMs: number, totalTimeMs: number): void {
    const seconds = Math.ceil(timeRemainingMs / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    this.timerText.setText(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);

    if (seconds <= 10) {
      this.timerText.setColor('#ff0000');
      this.timerLabel.setColor('#ff0000');
    } else if (seconds <= 30) {
      this.timerText.setColor('#ffaa00');
      this.timerLabel.setColor('#ffaa00');
    } else {
      this.timerText.setColor('#00ff00');
      this.timerLabel.setColor('#aaaaaa');
    }

    const scrollY = this.scene.cameras.main.scrollY;
    const barX = GameConfig.width / 2 - 100;
    const barY = 63 + scrollY;
    const barWidth = 200;
    const barHeight = 6;
    const progress = Math.max(0, Math.min(1, timeRemainingMs / totalTimeMs));

    this.timerBarBg.clear();
    this.timerBarBg.fillStyle(0x333333, 0.8);
    this.timerBarBg.fillRect(barX, barY, barWidth, barHeight);

    this.timerBar.clear();
    let barColor = 0x00ff00;
    if (progress < 0.15) barColor = 0xff0000;
    else if (progress < 0.35) barColor = 0xffaa00;
    this.timerBar.fillStyle(barColor, 1);
    this.timerBar.fillRect(barX, barY, barWidth * progress, barHeight);
  }

  showTimeBonus(ms: number): void {
    const seconds = (ms / 1000).toFixed(0);
    this.timeBonusPopup.setText(`+${seconds}秒!`);
    this.timeBonusPopup.setY(GameConfig.height / 2 + this.scene.cameras.main.scrollY);
    this.timeBonusPopup.setAlpha(1);

    this.scene.tweens.add({
      targets: this.timeBonusPopup,
      y: '-=80',
      alpha: 0,
      duration: 1200,
      ease: 'Cubic.easeOut'
    });
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
    this.effectIcon.fillCircle(GameConfig.width / 2 - 80, 135 + this.scene.cameras.main.scrollY, 10);

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
  }

  private showShield(): void {
    this.shieldIcon.setVisible(true);
    this.shieldIcon.clear();
    this.shieldIcon.lineStyle(2, 0xff00ff, 0.8);
    this.shieldIcon.strokeCircle(50, 95 + this.scene.cameras.main.scrollY, 15);
  }

  hideShield(): void {
    this.shieldIcon.setVisible(false);
  }

  private showScorePopup(value: number): void {
    const scrollY = this.scene.cameras.main.scrollY;
    const popup = this.scene.add.text(GameConfig.width / 2, GameConfig.height / 2 + scrollY, `+${value}`, {
      fontSize: '32px',
      color: '#ff66ff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3
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

    const hue = (combo * 30 + 280) % 360;
    this.comboText.setColor(`hsl(${hue}, 100%, 70%)`);
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

  updateChaseState(state: GuardChaseState): void {
    if (state === this.currentChaseState) return;

    this.currentChaseState = state;
    const config = GuardChaseStateConfig[state];

    this.chaseStateIcon.setText(config.alertIcon);
    this.chaseStateText.setText(config.name);
    this.chaseStateText.setColor(config.alertColor);

    this.scene.tweens.add({
      targets: [this.chaseStateIcon, this.chaseStateText],
      scale: { from: 1.8, to: 1 },
      duration: 500,
      ease: 'Elastic.easeOut'
    });

    const scrollY = this.scene.cameras.main.scrollY;
    this.chaseStateBannerBg.setVisible(true);
    this.chaseStateBannerBg.clear();
    const bannerColor = parseInt(config.alertColor.replace('#', ''), 16);
    this.chaseStateBannerBg.fillStyle(bannerColor, 0.3);
    this.chaseStateBannerBg.fillRect(0, GameConfig.height / 2 - 80 + scrollY, GameConfig.width, 160);

    this.chaseStateBanner.setText(`${config.alertIcon} ${config.description} ${config.alertIcon}`);
    this.chaseStateBanner.setColor(config.alertColor);
    this.chaseStateBanner.setAlpha(1);
    this.chaseStateBanner.setY(GameConfig.height / 2 + scrollY);

    this.scene.tweens.add({
      targets: this.chaseStateBanner,
      y: '-=60',
      alpha: 0,
      duration: 2500,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        this.chaseStateBannerBg.setVisible(false);
      }
    });
  }

  update(): void {
    const scrollY = this.scene.cameras.main.scrollY;

    if (this.shieldIcon.visible) {
      const pulse = Math.sin(this.scene.time.now * 0.01) * 0.3 + 0.7;
      this.shieldIcon.clear();
      this.shieldIcon.lineStyle(2, 0xff00ff, pulse);
      this.shieldIcon.strokeCircle(50, 95 + scrollY, 15);
    }

    if (this.currentChaseState !== GuardChaseState.PATROL) {
      const pulse = Math.sin(this.scene.time.now * 0.008) * 0.3 + 0.7;
      this.chaseStateIcon.setAlpha(pulse);
      this.chaseStateText.setAlpha(pulse);
    } else {
      this.chaseStateIcon.setAlpha(1);
      this.chaseStateText.setAlpha(1);
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
      this.sideEffectStatusText.setY(165 + scrollY + wobble);
      this.sideEffectStatusText.setColor(`hsl(${colorHue}, 100%, 60%)`);
    }
  }
}
