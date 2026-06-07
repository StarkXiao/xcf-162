import Phaser from 'phaser';
import { GameConfig } from '../config/GameConfig';
import { Player } from '../characters/Player';
import { SaveManager } from '../utils/SaveManager';
import { AudioManager } from '../audio/AudioManager';
import { SeasonManager } from '../utils/SeasonManager';
import { SeasonTaskType } from '../types';

export class JumpTrainingScene extends Phaser.Scene {
  private player!: Player;
  private platforms: Phaser.Physics.Arcade.StaticGroup[] = [];
  private keys!: { left: Phaser.Input.Keyboard.Key; right: Phaser.Input.Keyboard.Key; jump: Phaser.Input.Keyboard.Key };
  private currentFloor: number = 0;
  private jumpCount: number = 0;
  private comboCount: number = 0;
  private bestCombo: number = 0;
  private perfectJumps: number = 0;
  private highestFloor: number = 0;
  private lastJumpTime: number = 0;
  private hudTexts: Map<string, Phaser.GameObjects.Text> = new Map();
  private saveManager!: SaveManager;
  private audioManager!: AudioManager;
  private seasonManager!: SeasonManager;
  private isEnded: boolean = false;
  private neonLights: Phaser.GameObjects.Image[] = [];
  private tutorialStep: number = 0;
  private tutorialText!: Phaser.GameObjects.Text;
  private tutorialBox!: Phaser.GameObjects.Graphics;

  constructor() {
    super('JumpTrainingScene');
  }

  create(): void {
    this.saveManager = SaveManager.getInstance();
    this.audioManager = AudioManager.getInstance();
    this.seasonManager = SeasonManager.getInstance();
    this.seasonManager.checkReset();
    this.currentFloor = 0;
    this.jumpCount = 0;
    this.comboCount = 0;
    this.bestCombo = 0;
    this.perfectJumps = 0;
    this.highestFloor = 0;
    this.lastJumpTime = 0;
    this.isEnded = false;
    this.tutorialStep = 0;

    this.cameras.main.setBackgroundColor('#0a1a0a');
    this.createBackground();

    this.keys = {
      left: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
      right: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
      jump: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
    };

    this.createTrainingPlatforms();
    this.createHUD();
    this.createTutorial();

    const startPlatform = this.platforms[0];
    const firstPlatform = startPlatform.getChildren()[0] as Phaser.Physics.Arcade.Sprite;
    const startX = firstPlatform.body!.position.x + GameConfig.platformWidth / 2;
    const startY = firstPlatform.body!.position.y - GameConfig.playerHeight;

    this.player = new Player(this, startX, startY);

    this.platforms.forEach(platformGroup => {
      this.physics.add.collider(this.player, platformGroup, this.onPlayerLand, undefined, this);
    });

    this.events.on('playerDoubleJump', this.onPlayerDoubleJump, this);

    this.audioManager.playMusic();
  }

  private createTrainingPlatforms(): void {
    for (let floor = 0; floor < 30; floor++) {
      const platformGroup = this.physics.add.staticGroup();
      const y = GameConfig.height - 100 - floor * 120;

      if (floor === 0) {
        const platform = platformGroup.create(GameConfig.width / 2, y, 'platform');
        platform.setDisplaySize(GameConfig.platformWidth * 2, GameConfig.platformHeight);
        platform.refreshBody();
        platform.setData('floor', floor);
        platform.setData('isStart', true);
      } else {
        const difficulty = Math.min(floor / 15, 1);
        const gap = 80 + difficulty * 60;
        const x = Phaser.Math.Between(60 + gap, GameConfig.width - 60 - gap - GameConfig.platformWidth);
        const scale = 1.2 - difficulty * 0.5;

        const platform = platformGroup.create(x + (GameConfig.platformWidth * scale) / 2, y, 'platform');
        platform.setDisplaySize(GameConfig.platformWidth * scale, GameConfig.platformHeight);
        platform.refreshBody();
        platform.setData('floor', floor);

        if (floor % 5 === 0 && floor > 0) {
          platform.setData('perfectZone', true);
          platform.setTint(0x00ff88);
        }
      }

      this.platforms.push(platformGroup);
    }
  }

  private createHUD(): void {
    const hudBg = this.add.graphics();
    hudBg.fillStyle(0x000000, 0.7);
    hudBg.fillRect(0, 0, GameConfig.width, 80);
    hudBg.setScrollFactor(0);
    hudBg.setDepth(100);

    this.addText('floor', 20, 15, '楼层: 0', { fontSize: '18px', color: '#00ff88' }, 100);
    this.addText('jumps', 20, 45, '跳跃: 0', { fontSize: '14px', color: '#ffffff' }, 100);
    this.addText('combo', 160, 15, '连跳: 0', { fontSize: '18px', color: '#ffcc00' }, 100);
    this.addText('bestCombo', 160, 45, '最佳: 0', { fontSize: '14px', color: '#ff8800' }, 100);
    this.addText('perfect', 300, 15, '完美: 0', { fontSize: '18px', color: '#00ffff' }, 100);
    this.addText('highest', 300, 45, '最高: 0', { fontSize: '14px', color: '#ff00ff' }, 100);

    const backBtn = this.add.text(GameConfig.width - 20, 15, '返回', {
      fontSize: '16px',
      color: '#ff6666'
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true });
    backBtn.setScrollFactor(0);
    backBtn.setDepth(100);

    backBtn.on('pointerover', () => {
      backBtn.setColor('#ff9999');
      this.audioManager.play('hover');
    });
    backBtn.on('pointerout', () => backBtn.setColor('#ff6666'));
    backBtn.on('pointerdown', () => {
      this.audioManager.play('select');
      this.endTraining();
    });

    const restartBtn = this.add.text(GameConfig.width - 20, 45, '重来', {
      fontSize: '14px',
      color: '#88aaff'
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true });
    restartBtn.setScrollFactor(0);
    restartBtn.setDepth(100);

    restartBtn.on('pointerover', () => {
      restartBtn.setColor('#aaccff');
      this.audioManager.play('hover');
    });
    restartBtn.on('pointerout', () => restartBtn.setColor('#88aaff'));
    restartBtn.on('pointerdown', () => {
      this.audioManager.play('select');
      this.scene.restart();
    });
  }

  private addText(key: string, x: number, y: number, text: string, style: object, depth: number): void {
    const t = this.add.text(x, y, text, style);
    t.setScrollFactor(0);
    t.setDepth(depth);
    this.hudTexts.set(key, t);
  }

  private updateHUD(): void {
    this.hudTexts.get('floor')?.setText(`楼层: ${this.currentFloor}`);
    this.hudTexts.get('jumps')?.setText(`跳跃: ${this.jumpCount}`);
    this.hudTexts.get('combo')?.setText(`连跳: ${this.comboCount}`);
    this.hudTexts.get('bestCombo')?.setText(`最佳: ${this.bestCombo}`);
    this.hudTexts.get('perfect')?.setText(`完美: ${this.perfectJumps}`);
    this.hudTexts.get('highest')?.setText(`最高: ${this.highestFloor}`);
  }

  private createTutorial(): void {
    this.tutorialBox = this.add.graphics();
    this.tutorialBox.fillStyle(0x000000, 0.85);
    this.tutorialBox.fillRoundedRect(40, GameConfig.height - 160, GameConfig.width - 80, 120, 10);
    this.tutorialBox.lineStyle(2, 0x00ff88, 1);
    this.tutorialBox.strokeRoundedRect(40, GameConfig.height - 160, GameConfig.width - 80, 120, 10);
    this.tutorialBox.setScrollFactor(0);
    this.tutorialBox.setDepth(90);

    this.tutorialText = this.add.text(60, GameConfig.height - 140, '', {
      fontSize: '16px',
      color: '#ffffff',
      wordWrap: { width: GameConfig.width - 120 }
    });
    this.tutorialText.setScrollFactor(0);
    this.tutorialText.setDepth(91);

    const nextBtn = this.add.text(GameConfig.width - 60, GameConfig.height - 60, '下一步 →', {
      fontSize: '14px',
      color: '#00ff88'
    }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true });
    nextBtn.setScrollFactor(0);
    nextBtn.setDepth(91);

    nextBtn.on('pointerover', () => {
      nextBtn.setColor('#66ffaa');
      this.audioManager.play('hover');
    });
    nextBtn.on('pointerout', () => nextBtn.setColor('#00ff88'));
    nextBtn.on('pointerdown', () => {
      this.audioManager.play('select');
      this.advanceTutorial();
    });

    this.showTutorialStep();
  }

  private showTutorialStep(): void {
    const tutorials = [
      '欢迎来到跳跃教学！\n\n使用 ← → 键左右移动，空格键跳跃。\n先试试基础移动和跳跃吧！',
      '二段跳技巧：\n\n在空中再次按空格可以进行二段跳！\n二段跳会触发连跳Combo，连跳越多分数越高。',
      '完美跳跃：\n\n绿色发光的平台是完美区域，落在上面算完美跳跃。\n完美跳跃会给你额外的成就感！',
      '训练目标：\n\n尽可能往上跳，楼层越高越好！\n完成后点击右上角"返回"保存成绩。\n\n准备好了吗？开始训练！'
    ];

    if (this.tutorialStep < tutorials.length) {
      this.tutorialText.setText(tutorials[this.tutorialStep]);
    } else {
      this.tutorialBox.setVisible(false);
      this.tutorialText.setVisible(false);
    }
  }

  private advanceTutorial(): void {
    this.tutorialStep++;
    if (this.tutorialStep >= 4) {
      this.tutorialBox.setVisible(false);
      this.tutorialText.setVisible(false);
    }
    this.showTutorialStep();
  }

  private onPlayerLand(_player: unknown, platform: unknown): void {
    const floor = (platform as Phaser.GameObjects.GameObject).getData('floor') as number;
    const isPerfect = (platform as Phaser.GameObjects.GameObject).getData('perfectZone') as boolean;

    if (floor > this.currentFloor) {
      const floorsGained = floor - this.currentFloor;
      this.currentFloor = floor;
      if (this.currentFloor > this.highestFloor) {
        this.highestFloor = this.currentFloor;
      }

      if (isPerfect) {
        this.perfectJumps++;
        this.showPerfectEffect((platform as Phaser.Physics.Arcade.Sprite).x, (platform as Phaser.Physics.Arcade.Sprite).y);
      }

      this.audioManager.play('jump');
      this.updateHUD();

      this.seasonManager.updateTaskProgress(SeasonTaskType.FLOOR, floorsGained);
      this.seasonManager.updateSingleGameMax(SeasonTaskType.FLOOR, this.highestFloor);
      const trainingScore = this.highestFloor * 100 + this.perfectJumps * 50 + this.bestCombo * 20;
      this.seasonManager.updateTaskProgress(SeasonTaskType.TRAINING_SCORE, trainingScore);
      this.seasonManager.updateSingleGameMax(SeasonTaskType.TRAINING_SCORE, trainingScore);
    }

    if (this.time.now - this.lastJumpTime > GameConfig.comboTimeoutMs) {
      this.comboCount = 0;
    }

    const targetCamY = this.player.y - GameConfig.height * 0.5;
    this.cameras.main.scrollY = Math.min(this.cameras.main.scrollY, targetCamY);
  }

  private onPlayerDoubleJump(): void {
    this.jumpCount++;
    this.lastJumpTime = this.time.now;
    this.comboCount++;

    if (this.comboCount > this.bestCombo) {
      this.bestCombo = this.comboCount;
    }

    this.audioManager.play('jump');
    this.updateHUD();

    this.seasonManager.updateSingleGameMax(SeasonTaskType.COMBO, this.bestCombo);
    const trainingScore = this.highestFloor * 100 + this.perfectJumps * 50 + this.bestCombo * 20;
    this.seasonManager.updateSingleGameMax(SeasonTaskType.TRAINING_SCORE, trainingScore);
  }

  private showPerfectEffect(x: number, y: number): void {
    const particles = this.add.graphics();
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const px = x + Math.cos(angle) * 30;
      const py = y + Math.sin(angle) * 30;
      particles.fillStyle(0x00ff88, 1);
      particles.fillCircle(px, py, 5);
    }

    const label = this.add.text(x, y - 30, 'PERFECT!', {
      fontSize: '20px',
      color: '#00ff88',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.tweens.add({
      targets: particles,
      alpha: 0,
      scale: 2,
      duration: 400,
      onComplete: () => particles.destroy()
    });

    this.tweens.add({
      targets: label,
      y: y - 60,
      alpha: 0,
      duration: 500,
      onComplete: () => label.destroy()
    });
  }

  private createBackground(): void {
    this.add.image(20, GameConfig.height / 2, 'wall').setScrollFactor(0);
    this.add.image(GameConfig.width - 20, GameConfig.height / 2, 'wall').setScrollFactor(0);

    for (let i = 0; i < 30; i++) {
      const x = Phaser.Math.Between(50, GameConfig.width - 50);
      const y = Phaser.Math.Between(-GameConfig.height * 3, GameConfig.height);
      const light = this.add.image(x, y, i % 2 === 0 ? 'neon-pink' : 'neon-cyan');
      light.setAlpha(Phaser.Math.FloatBetween(0.2, 0.5));
      light.setScale(Phaser.Math.FloatBetween(0.5, 1.2));
      this.neonLights.push(light);
    }
  }

  private endTraining(): void {
    if (this.isEnded) return;
    this.isEnded = true;

    this.events.off('playerDoubleJump', this.onPlayerDoubleJump, this);
    this.audioManager.setDangerState(false);
    this.audioManager.stopMusic();

    this.saveManager.saveJumpTrainingScore({
      bestCombo: this.bestCombo,
      totalJumps: this.jumpCount,
      perfectJumps: this.perfectJumps,
      highestFloor: this.highestFloor,
      gamesPlayed: 1
    });

    this.seasonManager.updateTaskProgress(SeasonTaskType.GAMES_PLAYED, 1);
    this.seasonManager.updateSingleGameMax(SeasonTaskType.FLOOR, this.highestFloor);
    this.seasonManager.updateSingleGameMax(SeasonTaskType.COMBO, this.bestCombo);
    const finalTrainingScore = this.highestFloor * 100 + this.perfectJumps * 50 + this.bestCombo * 20;
    this.seasonManager.updateTaskProgress(SeasonTaskType.TRAINING_SCORE, finalTrainingScore);
    this.seasonManager.updateSingleGameMax(SeasonTaskType.TRAINING_SCORE, finalTrainingScore);

    this.cameras.main.fade(400, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start('TrainingScene');
    });
  }

  update(_time: number, delta: number): void {
    if (this.isEnded) return;

    this.player.update(this.keys, delta);

    if (this.time.now - this.lastJumpTime > GameConfig.comboTimeoutMs && this.comboCount > 0) {
      this.comboCount = 0;
      this.updateHUD();
    }

    if (this.player.y > this.cameras.main.scrollY + GameConfig.height + 50) {
      this.endTraining();
    }

    this.neonLights.forEach((light, index) => {
      const pulse = Math.sin(this.time.now * 0.003 + index) * 0.2 + 0.4;
      light.setAlpha(pulse);
    });

    this.updateDangerState();
  }

  private updateDangerState(): void {
    if (!this.audioManager.isAdaptiveMixingEnabled()) return;

    let isDanger = false;
    const sideEffectState = this.player.getSideEffectState();
    if (sideEffectState.addictionLevel >= 70 || sideEffectState.isHallucinating || sideEffectState.isOutOfControl) {
      isDanger = true;
    }

    this.audioManager.setDangerState(isDanger);
  }
}
