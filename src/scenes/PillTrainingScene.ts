import Phaser from 'phaser';
import { GameConfig, PillType, PillColors, PillEffects } from '../config/GameConfig';
import { Player } from '../characters/Player';
import { PillManager } from '../items/PillManager';
import { SaveManager } from '../utils/SaveManager';
import { AudioManager } from '../audio/AudioManager';
import { SeasonManager } from '../utils/SeasonManager';
import { SeasonTaskType } from '../types';

export class PillTrainingScene extends Phaser.Scene {
  private player!: Player;
  private platforms: Phaser.Physics.Arcade.StaticGroup[] = [];
  private pillManager!: PillManager;
  private keys!: { left: Phaser.Input.Keyboard.Key; right: Phaser.Input.Keyboard.Key; jump: Phaser.Input.Keyboard.Key };
  private pillsCollected: number = 0;
  private pillsPerType: Record<string, number> = {};
  private currentStreak: number = 0;
  private bestStreak: number = 0;
  private totalScore: number = 0;
  private lastCollectTime: number = 0;
  private spawnTimer!: Phaser.Time.TimerEvent;
  private scoreTimer!: Phaser.Time.TimerEvent;
  private hudTexts: Map<string, Phaser.GameObjects.Text> = new Map();
  private saveManager!: SaveManager;
  private audioManager!: AudioManager;
  private seasonManager!: SeasonManager;
  private isEnded: boolean = false;
  private neonLights: Phaser.GameObjects.Image[] = [];
  private selectedPillType: PillType | null = null;
  private typeButtons: Map<PillType, { bg: Phaser.GameObjects.Graphics; label: Phaser.GameObjects.Text }> = new Map();
  private isAutoMode: boolean = true;
  private effectDisplay!: Phaser.GameObjects.Text;

  constructor() {
    super('PillTrainingScene');
  }

  create(): void {
    this.saveManager = SaveManager.getInstance();
    this.audioManager = AudioManager.getInstance();
    this.seasonManager = SeasonManager.getInstance();
    this.seasonManager.checkReset();
    this.pillsCollected = 0;
    this.pillsPerType = {};
    this.currentStreak = 0;
    this.bestStreak = 0;
    this.totalScore = 0;
    this.lastCollectTime = 0;
    this.isEnded = false;
    this.selectedPillType = null;
    this.isAutoMode = true;

    this.cameras.main.setBackgroundColor('#1a1a0a');
    this.createBackground();

    this.keys = {
      left: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
      right: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
      jump: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
    };

    this.createStaticPlatform();
    this.createHUD();
    this.createPillTypeSelector();

    const startX = GameConfig.width / 2;
    const startY = GameConfig.height - 200;

    this.player = new Player(this, startX, startY);
    this.pillManager = new PillManager(this);

    this.platforms.forEach(platformGroup => {
      this.physics.add.collider(this.player, platformGroup);
    });

    this.physics.add.overlap(this.player, this.pillManager.getPills(), this.onPillCollect, undefined, this);

    this.setupTimers();

    this.audioManager.playMusic();
  }

  private createStaticPlatform(): void {
    const groundGroup = this.physics.add.staticGroup();
    const ground = groundGroup.create(GameConfig.width / 2, GameConfig.height - 100, 'platform');
    ground.setDisplaySize(GameConfig.width - 80, GameConfig.platformHeight);
    ground.refreshBody();
    this.platforms.push(groundGroup);

    const midGroup = this.physics.add.staticGroup();
    const mid1 = midGroup.create(120, GameConfig.height - 300, 'platform');
    mid1.setDisplaySize(100, GameConfig.platformHeight);
    mid1.refreshBody();
    const mid2 = midGroup.create(GameConfig.width - 120, GameConfig.height - 300, 'platform');
    mid2.setDisplaySize(100, GameConfig.platformHeight);
    mid2.refreshBody();
    const mid3 = midGroup.create(GameConfig.width / 2, GameConfig.height - 430, 'platform');
    mid3.setDisplaySize(100, GameConfig.platformHeight);
    mid3.refreshBody();
    this.platforms.push(midGroup);
  }

  private createHUD(): void {
    const hudBg = this.add.graphics();
    hudBg.fillStyle(0x000000, 0.7);
    hudBg.fillRect(0, 0, GameConfig.width, 80);
    hudBg.setScrollFactor(0);
    hudBg.setDepth(100);

    this.addText('collected', 20, 15, '收集: 0', { fontSize: '18px', color: '#ffcc00' }, 100);
    this.addText('streak', 20, 45, '连击: 0', { fontSize: '14px', color: '#ff8800' }, 100);
    this.addText('bestStreak', 140, 15, '最佳: 0', { fontSize: '18px', color: '#ff00ff' }, 100);
    this.addText('score', 140, 45, '分数: 0', { fontSize: '14px', color: '#00ffff' }, 100);

    const statusText = this.add.text(260, 15, '模式: 自动', { fontSize: '16px', color: '#00ff88' });
    statusText.setScrollFactor(0);
    statusText.setDepth(100);
    this.hudTexts.set('mode', statusText);

    this.effectDisplay = this.add.text(GameConfig.width / 2, 100, '', {
      fontSize: '22px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.effectDisplay.setScrollFactor(0);
    this.effectDisplay.setDepth(100);

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
    this.hudTexts.get('collected')?.setText(`收集: ${this.pillsCollected}`);
    this.hudTexts.get('streak')?.setText(`连击: ${this.currentStreak}`);
    this.hudTexts.get('bestStreak')?.setText(`最佳: ${this.bestStreak}`);
    this.hudTexts.get('score')?.setText(`分数: ${this.totalScore}`);
    this.hudTexts.get('mode')?.setText(`模式: ${this.isAutoMode ? '自动' : '手动'}`);
    this.hudTexts.get('mode')?.setColor(this.isAutoMode ? '#00ff88' : '#ffcc00');
  }

  private createPillTypeSelector(): void {
    const y = GameConfig.height - 60;
    const types: PillType[] = [PillType.SPEED, PillType.SLOW, PillType.SHIELD, PillType.SCORE];
    const labels: Record<PillType, string> = {
      [PillType.SPEED]: '加速',
      [PillType.SLOW]: '减速',
      [PillType.SHIELD]: '护盾',
      [PillType.SCORE]: '得分'
    };

    const modeBtn = this.add.text(20, y - 25, '切换模式', {
      fontSize: '14px',
      color: '#00ffff',
      backgroundColor: '#222244',
      padding: { left: 10, right: 10, top: 5, bottom: 5 }
    }).setInteractive({ useHandCursor: true });
    modeBtn.setScrollFactor(0);
    modeBtn.setDepth(100);

    modeBtn.on('pointerover', () => {
      modeBtn.setBackgroundColor('#333366');
      this.audioManager.play('hover');
    });
    modeBtn.on('pointerout', () => modeBtn.setBackgroundColor('#222244'));
    modeBtn.on('pointerdown', () => {
      this.audioManager.play('select');
      this.isAutoMode = !this.isAutoMode;
      if (!this.isAutoMode) {
        this.spawnTimer.paused = true;
      } else {
        this.spawnTimer.paused = false;
      }
      this.updateHUD();
    });

    types.forEach((type, index) => {
      const x = 120 + index * 90;
      const bg = this.add.graphics();
      bg.fillStyle(0x222222, 0.9);
      bg.fillRoundedRect(x - 35, y - 20, 70, 40, 5);
      bg.lineStyle(2, PillColors[type], 0.8);
      bg.strokeRoundedRect(x - 35, y - 20, 70, 40, 5);
      bg.setScrollFactor(0);
      bg.setDepth(100);
      bg.setInteractive(new Phaser.Geom.Rectangle(x - 35, y - 20, 70, 40), Phaser.Geom.Rectangle.Contains);

      const colorHex = '#' + PillColors[type].toString(16).padStart(6, '0');
      const label = this.add.text(x, y, labels[type], {
        fontSize: '14px',
        color: colorHex,
        fontStyle: 'bold'
      }).setOrigin(0.5);
      label.setScrollFactor(0);
      label.setDepth(101);

      bg.on('pointerover', () => {
        bg.fillStyle(0x333333, 1);
        bg.fillRoundedRect(x - 35, y - 20, 70, 40, 5);
        bg.lineStyle(2, PillColors[type], 1);
        bg.strokeRoundedRect(x - 35, y - 20, 70, 40, 5);
        this.audioManager.play('hover');
      });

      bg.on('pointerout', () => {
        const isSelected = this.selectedPillType === type;
        bg.fillStyle(isSelected ? 0x334433 : 0x222222, isSelected ? 1 : 0.9);
        bg.fillRoundedRect(x - 35, y - 20, 70, 40, 5);
        bg.lineStyle(2, PillColors[type], isSelected ? 1 : 0.8);
        bg.strokeRoundedRect(x - 35, y - 20, 70, 40, 5);
      });

      bg.on('pointerdown', () => {
        this.audioManager.play('select');
        this.selectedPillType = this.selectedPillType === type ? null : type;
        this.updateTypeButtonSelection();
        if (!this.isAutoMode && this.selectedPillType) {
          this.spawnSpecificPill(this.selectedPillType);
        }
      });

      this.typeButtons.set(type, { bg, label });
    });
  }

  private updateTypeButtonSelection(): void {
    const y = GameConfig.height - 60;
    const types: PillType[] = [PillType.SPEED, PillType.SLOW, PillType.SHIELD, PillType.SCORE];

    types.forEach((type, index) => {
      const x = 120 + index * 90;
      const btn = this.typeButtons.get(type);
      if (!btn) return;

      const isSelected = this.selectedPillType === type;
      btn.bg.clear();
      btn.bg.fillStyle(isSelected ? 0x334433 : 0x222222, isSelected ? 1 : 0.9);
      btn.bg.fillRoundedRect(x - 35, y - 20, 70, 40, 5);
      btn.bg.lineStyle(2, PillColors[type], isSelected ? 1 : 0.8);
      btn.bg.strokeRoundedRect(x - 35, y - 20, 70, 40, 5);
    });
  }

  private setupTimers(): void {
    this.spawnTimer = this.time.addEvent({
      delay: 1500,
      callback: () => {
        if (this.isAutoMode && !this.isEnded) {
          this.spawnRandomPill();
        }
      },
      callbackScope: this,
      loop: true
    });

    this.scoreTimer = this.time.addEvent({
      delay: 1000,
      callback: () => {
        if (!this.isEnded) {
          this.totalScore += 10;
          this.updateHUD();
          this.seasonManager.updateTaskProgress(SeasonTaskType.TRAINING_SCORE, 10);
          this.seasonManager.updateSingleGameMax(SeasonTaskType.TRAINING_SCORE, this.totalScore);
        }
      },
      callbackScope: this,
      loop: true
    });
  }

  private spawnRandomPill(): void {
    const types: PillType[] = [PillType.SPEED, PillType.SLOW, PillType.SHIELD, PillType.SCORE];
    const type = types[Phaser.Math.Between(0, types.length - 1)];
    this.spawnSpecificPill(type);
  }

  private spawnSpecificPill(type: PillType): void {
    const spawnX = Phaser.Math.Between(80, GameConfig.width - 80);
    const spawnY = Phaser.Math.Between(140, GameConfig.height - 350);
    this.pillManager.spawnPill(spawnX, spawnY, type);
  }

  private onPillCollect(_player: unknown, pill: unknown): void {
    const pillObj = pill as Phaser.GameObjects.GameObject;
    const pillType = pillObj.getData('type') as PillType;
    this.pillManager.collectPill(pillObj);

    this.pillsCollected++;
    this.pillsPerType[pillType] = (this.pillsPerType[pillType] || 0) + 1;

    if (this.time.now - this.lastCollectTime < 3000) {
      this.currentStreak++;
      if (this.currentStreak > this.bestStreak) {
        this.bestStreak = this.currentStreak;
      }
    } else {
      this.currentStreak = 1;
    }
    this.lastCollectTime = this.time.now;

    this.totalScore += GameConfig.pillScore + this.currentStreak * 20;

    this.showPillEffect(pillType);
    this.audioManager.play('pill');
    this.updateHUD();

    this.seasonManager.updateTaskProgress(SeasonTaskType.PILLS, 1);
    this.seasonManager.updateTaskProgress(SeasonTaskType.SCORE, GameConfig.pillScore + this.currentStreak * 20);
    this.seasonManager.updateTaskProgress(SeasonTaskType.TRAINING_SCORE, GameConfig.pillScore + this.currentStreak * 20);
    this.seasonManager.updateSingleGameMax(SeasonTaskType.PILLS, this.pillsCollected);
    this.seasonManager.updateSingleGameMax(SeasonTaskType.COMBO, this.bestStreak);
    this.seasonManager.updateSingleGameMax(SeasonTaskType.TRAINING_SCORE, this.totalScore);
  }

  private showPillEffect(type: PillType): void {
    const effectNames: Record<PillType, string> = {
      [PillType.SPEED]: '⚡ 加速！',
      [PillType.SLOW]: '🐌 保安减速！',
      [PillType.SHIELD]: '🛡️ 护盾激活！',
      [PillType.SCORE]: '💎 额外得分！'
    };
    const colorHex = '#' + PillColors[type].toString(16).padStart(6, '0');

    this.effectDisplay.setText(effectNames[type]);
    this.effectDisplay.setColor(colorHex);
    this.effectDisplay.setAlpha(1);

    this.tweens.add({
      targets: this.effectDisplay,
      y: 130,
      alpha: 0,
      duration: 1500,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        this.effectDisplay.setY(100);
        this.effectDisplay.setAlpha(0);
      }
    });

    const infoTexts: Record<PillType, string> = {
      [PillType.SPEED]: `移动速度 ×${PillEffects[type].value}`,
      [PillType.SLOW]: `保安速度 ×${PillEffects[type].value}`,
      [PillType.SHIELD]: `免疫一次保安攻击`,
      [PillType.SCORE]: `获得 ${PillEffects[type].value} 额外分数`
    };

    const info = this.add.text(GameConfig.width / 2, 160, infoTexts[type], {
      fontSize: '14px',
      color: '#aaaaaa'
    }).setOrigin(0.5);
    info.setScrollFactor(0);
    info.setDepth(100);

    this.tweens.add({
      targets: info,
      alpha: 0,
      y: 190,
      duration: 2000,
      onComplete: () => info.destroy()
    });
  }

  private createBackground(): void {
    this.add.image(20, GameConfig.height / 2, 'wall').setScrollFactor(0);
    this.add.image(GameConfig.width - 20, GameConfig.height / 2, 'wall').setScrollFactor(0);

    for (let i = 0; i < 25; i++) {
      const x = Phaser.Math.Between(50, GameConfig.width - 50);
      const y = Phaser.Math.Between(0, GameConfig.height);
      const light = this.add.image(x, y, i % 2 === 0 ? 'neon-pink' : 'neon-cyan');
      light.setAlpha(Phaser.Math.FloatBetween(0.2, 0.5));
      light.setScale(Phaser.Math.FloatBetween(0.5, 1.2));
      this.neonLights.push(light);
    }
  }

  private endTraining(): void {
    if (this.isEnded) return;
    this.isEnded = true;

    if (this.spawnTimer) this.spawnTimer.destroy();
    if (this.scoreTimer) this.scoreTimer.destroy();

    this.audioManager.stopMusic();

    this.saveManager.savePillTrainingScore({
      pillsCollected: this.pillsCollected,
      pillsPerType: this.pillsPerType,
      bestStreak: this.bestStreak,
      totalScore: this.totalScore,
      gamesPlayed: 1
    });

    this.seasonManager.updateTaskProgress(SeasonTaskType.GAMES_PLAYED, 1);
    this.seasonManager.updateSingleGameMax(SeasonTaskType.PILLS, this.pillsCollected);
    this.seasonManager.updateSingleGameMax(SeasonTaskType.COMBO, this.bestStreak);
    this.seasonManager.updateTaskProgress(SeasonTaskType.TRAINING_SCORE, this.totalScore);
    this.seasonManager.updateSingleGameMax(SeasonTaskType.TRAINING_SCORE, this.totalScore);
    this.seasonManager.updateSingleGameMax(SeasonTaskType.SCORE, this.totalScore);

    this.cameras.main.fade(400, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start('TrainingScene');
    });
  }

  update(_time: number, delta: number): void {
    if (this.isEnded) return;

    this.player.update(this.keys, delta);
    this.pillManager.update();

    if (this.time.now - this.lastCollectTime > 3000 && this.currentStreak > 0) {
      this.currentStreak = 0;
      this.updateHUD();
    }

    this.player.x = Phaser.Math.Clamp(this.player.x, 50, GameConfig.width - 50);
    if (this.player.y > GameConfig.height - 100) {
      this.player.y = GameConfig.height - 200;
      this.player.setVelocityY(0);
    }

    this.neonLights.forEach((light, index) => {
      const pulse = Math.sin(this.time.now * 0.003 + index) * 0.2 + 0.4;
      light.setAlpha(pulse);
    });
  }
}
