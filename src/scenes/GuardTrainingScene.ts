import Phaser from 'phaser';
import { GameConfig, PillType } from '../config/GameConfig';
import { Player } from '../characters/Player';
import { Guard } from '../enemies/Guard';
import { PillManager } from '../items/PillManager';
import { SaveManager } from '../utils/SaveManager';
import { AudioManager } from '../audio/AudioManager';

export class GuardTrainingScene extends Phaser.Scene {
  private player!: Player;
  private guards: Guard[] = [];
  private platforms: Phaser.Physics.Arcade.StaticGroup[] = [];
  private pillManager!: PillManager;
  private keys!: { left: Phaser.Input.Keyboard.Key; right: Phaser.Input.Keyboard.Key; jump: Phaser.Input.Keyboard.Key };
  private guardsAvoided: number = 0;
  private guardsTricked: number = 0;
  private survivalTime: number = 0;
  private longestSurvival: number = 0;
  private totalScore: number = 0;
  private lastTrickTime: number = 0;
  private spawnTimer!: Phaser.Time.TimerEvent;
  private scoreTimer!: Phaser.Time.TimerEvent;
  private survivalTimer!: Phaser.Time.TimerEvent;
  private hudTexts: Map<string, Phaser.GameObjects.Text> = new Map();
  private saveManager!: SaveManager;
  private audioManager!: AudioManager;
  private isEnded: boolean = false;
  private neonLights: Phaser.GameObjects.Image[] = [];
  private difficultyLevel: number = 1;
  private difficultyText!: Phaser.GameObjects.Text;
  private guardPositions: Map<Guard, { x: number; y: number; time: number }> = new Map();
  private tutorialShown: boolean = false;
  private tutorialBox!: Phaser.GameObjects.Graphics;
  private tutorialText!: Phaser.GameObjects.Text;

  constructor() {
    super('GuardTrainingScene');
  }

  create(): void {
    this.saveManager = SaveManager.getInstance();
    this.audioManager = AudioManager.getInstance();
    this.guardsAvoided = 0;
    this.guardsTricked = 0;
    this.survivalTime = 0;
    this.longestSurvival = 0;
    this.totalScore = 0;
    this.lastTrickTime = 0;
    this.isEnded = false;
    this.difficultyLevel = 1;
    this.guards = [];
    this.tutorialShown = false;

    this.cameras.main.setBackgroundColor('#1a0a0a');
    this.createBackground();

    this.keys = {
      left: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
      right: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
      jump: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
    };

    this.createArenaPlatforms();
    this.createHUD();
    this.createTutorial();

    const startX = GameConfig.width / 2;
    const startY = GameConfig.height - 250;

    this.player = new Player(this, startX, startY);
    this.pillManager = new PillManager(this);

    this.platforms.forEach(platformGroup => {
      this.physics.add.collider(this.player, platformGroup);
    });

    this.physics.add.overlap(this.player, this.pillManager.getPills(), this.onPillCollect, undefined, this);

    this.setupTimers();

    this.audioManager.playMusic();
  }

  private createArenaPlatforms(): void {
    const groundGroup = this.physics.add.staticGroup();
    const ground = groundGroup.create(GameConfig.width / 2, GameConfig.height - 100, 'platform');
    ground.setDisplaySize(GameConfig.width - 80, GameConfig.platformHeight);
    ground.refreshBody();
    this.platforms.push(groundGroup);

    const positions = [
      { x: 100, y: GameConfig.height - 230 },
      { x: GameConfig.width - 100, y: GameConfig.height - 230 },
      { x: GameConfig.width / 2, y: GameConfig.height - 350 },
      { x: 80, y: GameConfig.height - 460 },
      { x: GameConfig.width - 80, y: GameConfig.height - 460 },
      { x: GameConfig.width / 2, y: GameConfig.height - 570 }
    ];

    const arenaGroup = this.physics.add.staticGroup();
    positions.forEach(pos => {
      const p = arenaGroup.create(pos.x, pos.y, 'platform');
      p.setDisplaySize(90, GameConfig.platformHeight);
      p.refreshBody();
    });
    this.platforms.push(arenaGroup);
  }

  private createHUD(): void {
    const hudBg = this.add.graphics();
    hudBg.fillStyle(0x000000, 0.7);
    hudBg.fillRect(0, 0, GameConfig.width, 80);
    hudBg.setScrollFactor(0);
    hudBg.setDepth(100);

    this.addText('avoided', 20, 15, '躲避: 0', { fontSize: '18px', color: '#ff6600' }, 100);
    this.addText('tricked', 20, 45, '戏耍: 0', { fontSize: '14px', color: '#ffcc00' }, 100);
    this.addText('survival', 140, 15, '生存: 0s', { fontSize: '18px', color: '#00ff88' }, 100);
    this.addText('score', 140, 45, '分数: 0', { fontSize: '14px', color: '#00ffff' }, 100);
    this.addText('guards', 260, 15, '保安: 0', { fontSize: '18px', color: '#ff0066' }, 100);

    this.difficultyText = this.add.text(260, 45, '难度: 1', {
      fontSize: '14px',
      color: '#ff8800'
    });
    this.difficultyText.setScrollFactor(0);
    this.difficultyText.setDepth(100);

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
    this.hudTexts.get('avoided')?.setText(`躲避: ${this.guardsAvoided}`);
    this.hudTexts.get('tricked')?.setText(`戏耍: ${this.guardsTricked}`);
    this.hudTexts.get('survival')?.setText(`生存: ${this.survivalTime}s`);
    this.hudTexts.get('score')?.setText(`分数: ${this.totalScore}`);
    this.hudTexts.get('guards')?.setText(`保安: ${this.guards.length}`);
    this.difficultyText.setText(`难度: ${this.difficultyLevel}`);
  }

  private createTutorial(): void {
    this.tutorialBox = this.add.graphics();
    this.tutorialBox.fillStyle(0x000000, 0.9);
    this.tutorialBox.fillRoundedRect(40, 110, GameConfig.width - 80, 140, 10);
    this.tutorialBox.lineStyle(2, 0xff6600, 1);
    this.tutorialBox.strokeRoundedRect(40, 110, GameConfig.width - 80, 140, 10);
    this.tutorialBox.setScrollFactor(0);
    this.tutorialBox.setDepth(90);

    this.tutorialText = this.add.text(60, 125,
      '保安躲避训练！\n\n' +
      '• 使用 ← → 移动，空格跳跃\n' +
      '• 躲避保安的追捕，保安头上出现"!!"表示被发现\n' +
      '• 利用平台绕开保安算"戏耍"，会有额外加分\n' +
      '• 拾取药片获得加速或护盾效果\n' +
      '• 被保安碰到就结束训练！',
      {
        fontSize: '14px',
        color: '#ffffff',
        lineSpacing: 6
      }
    );
    this.tutorialText.setScrollFactor(0);
    this.tutorialText.setDepth(91);

    const closeBtn = this.add.text(GameConfig.width - 60, 235, '开始训练 →', {
      fontSize: '14px',
      color: '#ff6600'
    }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true });
    closeBtn.setScrollFactor(0);
    closeBtn.setDepth(91);

    closeBtn.on('pointerover', () => {
      closeBtn.setColor('#ffaa44');
      this.audioManager.play('hover');
    });
    closeBtn.on('pointerout', () => closeBtn.setColor('#ff6600'));
    closeBtn.on('pointerdown', () => {
      this.audioManager.play('select');
      this.tutorialBox.setVisible(false);
      this.tutorialText.setVisible(false);
      closeBtn.setVisible(false);
      this.tutorialShown = true;
    });
  }

  private setupTimers(): void {
    this.spawnTimer = this.time.addEvent({
      delay: 4000,
      callback: () => {
        if (!this.isEnded && this.tutorialShown) {
          this.spawnGuard();
        }
      },
      callbackScope: this,
      loop: true,
      startAt: 2000
    });

    this.scoreTimer = this.time.addEvent({
      delay: 1000,
      callback: () => {
        if (!this.isEnded) {
          this.totalScore += 15 * this.difficultyLevel;
          this.updateHUD();
        }
      },
      callbackScope: this,
      loop: true
    });

    this.survivalTimer = this.time.addEvent({
      delay: 1000,
      callback: () => {
        if (!this.isEnded) {
          this.survivalTime++;
          if (this.survivalTime > this.longestSurvival) {
            this.longestSurvival = this.survivalTime;
          }

          if (this.survivalTime % 20 === 0 && this.difficultyLevel < 5) {
            this.difficultyLevel++;
            this.showDifficultyUp();
          }

          this.updateHUD();
        }
      },
      callbackScope: this,
      loop: true
    });

    this.time.addEvent({
      delay: 6000,
      callback: () => {
        if (!this.isEnded && this.tutorialShown) {
          this.spawnRandomPill();
        }
      },
      callbackScope: this,
      loop: true,
      startAt: 4000
    });
  }

  private showDifficultyUp(): void {
    const label = this.add.text(GameConfig.width / 2, GameConfig.height / 2, `难度提升！Lv.${this.difficultyLevel}`, {
      fontSize: '36px',
      color: '#ff6600',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    label.setScrollFactor(0);
    label.setDepth(200);

    this.audioManager.play('guard');

    this.tweens.add({
      targets: label,
      scale: { from: 0.5, to: 1.5 },
      alpha: { from: 0, to: 1 },
      duration: 300,
      yoyo: true,
      onComplete: () => label.destroy()
    });
  }

  private spawnGuard(): void {
    const spawnPoints = [
      { x: 60, y: GameConfig.height - 200 },
      { x: GameConfig.width - 60, y: GameConfig.height - 200 },
      { x: 60, y: GameConfig.height - 500 },
      { x: GameConfig.width - 60, y: GameConfig.height - 500 }
    ];

    const spawn = spawnPoints[Phaser.Math.Between(0, spawnPoints.length - 1)];
    const speedMultiplier = 0.6 + (this.difficultyLevel - 1) * 0.15;
    const detectionRange = 100 + (this.difficultyLevel - 1) * 30;

    const guard = new Guard(
      this,
      spawn.x,
      spawn.y,
      this.player,
      speedMultiplier,
      detectionRange
    );
    this.guards.push(guard);
    this.guardPositions.set(guard, { x: guard.x, y: guard.y, time: this.time.now });

    this.platforms.forEach(platformGroup => {
      this.physics.add.collider(guard, platformGroup);
    });

    this.physics.add.overlap(this.player, guard, this.onGuardCollision, undefined, this);

    this.audioManager.play('guard');
    this.updateHUD();
  }

  private spawnRandomPill(): void {
    const types: PillType[] = [PillType.SPEED, PillType.SHIELD, PillType.SLOW];
    const type = types[Phaser.Math.Between(0, types.length - 1)];
    const spawnX = Phaser.Math.Between(80, GameConfig.width - 80);
    const spawnY = Phaser.Math.Between(140, GameConfig.height - 350);
    this.pillManager.spawnPill(spawnX, spawnY, type);
  }

  private onPillCollect(_player: unknown, pill: unknown): void {
    const pillObj = pill as Phaser.GameObjects.GameObject;
    this.pillManager.collectPill(pillObj);
    this.audioManager.play('pill');
    this.totalScore += 50;
    this.updateHUD();
  }

  private onGuardCollision(): void {
    if (this.isEnded) return;

    if (this.player.hasShield) {
      this.player.hasShield = false;
      this.audioManager.play('shield');
      this.guards.forEach(guard => {
        const pushDir = guard.x < this.player.x ? -1 : 1;
        guard.x += pushDir * 120;
        guard.setVelocityX(pushDir * 200);
      });
      this.guardsTricked++;
      this.totalScore += 200;
      this.showTrickEffect();
      this.updateHUD();
      return;
    }

    this.endTraining();
  }

  private checkTrick(): void {
    this.guards.forEach(guard => {
      const prev = this.guardPositions.get(guard);
      if (!prev) {
        this.guardPositions.set(guard, { x: guard.x, y: guard.y, time: this.time.now });
        return;
      }

      const distance = Phaser.Math.Distance.Between(guard.x, guard.y, this.player.x, this.player.y);

      if (distance > 180 && prev.time && this.time.now - prev.time > 1500) {
        const wasAbove = prev.y < this.player.y - 30;
        const nowBelow = guard.y > this.player.y + 30;
        const wasLeft = prev.x < this.player.x - 50;
        const nowRight = guard.x > this.player.x + 50;

        if ((wasAbove && nowBelow) || (wasLeft && nowRight) || (!wasLeft && !nowRight && wasLeft !== (guard.x < this.player.x))) {
          if (this.time.now - this.lastTrickTime > 2000) {
            this.guardsTricked++;
            this.totalScore += 100;
            this.lastTrickTime = this.time.now;
            this.showTrickEffect();
            this.updateHUD();
          }
        }
      }

      if (distance > 250 && this.time.now - prev.time > 3000) {
        this.guardsAvoided++;
        this.totalScore += 30;
        this.guardPositions.set(guard, { x: guard.x, y: guard.y, time: this.time.now });
        this.updateHUD();
      } else {
        this.guardPositions.set(guard, { x: guard.x, y: guard.y, time: prev.time });
      }
    });
  }

  private showTrickEffect(): void {
    const label = this.add.text(this.player.x, this.player.y - 50, 'TRICKED!', {
      fontSize: '24px',
      color: '#ffcc00',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.tweens.add({
      targets: label,
      y: this.player.y - 100,
      alpha: 0,
      scale: 1.5,
      duration: 600,
      onComplete: () => label.destroy()
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
    if (this.survivalTimer) this.survivalTimer.destroy();

    this.audioManager.stopMusic();
    this.audioManager.play('gameover');

    this.saveManager.saveGuardTrainingScore({
      guardsAvoided: this.guardsAvoided,
      longestSurvival: this.longestSurvival,
      guardsTricked: this.guardsTricked,
      totalScore: this.totalScore,
      gamesPlayed: 1
    });

    this.cameras.main.fade(500, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start('TrainingScene');
    });
  }

  update(_time: number, delta: number): void {
    if (this.isEnded) return;

    this.player.update(this.keys, delta);

    this.guards.forEach(guard => {
      guard.update(delta, this.player.guardSlowMultiplier, 1);
    });

    this.guards = this.guards.filter(g => g.active);

    this.pillManager.update();
    this.checkTrick();

    this.player.x = Phaser.Math.Clamp(this.player.x, 50, GameConfig.width - 50);
    if (this.player.y > GameConfig.height - 80) {
      this.player.y = GameConfig.height - 250;
      this.player.setVelocityY(0);
    }
    if (this.player.y < 100) {
      this.player.y = 100;
      this.player.setVelocityY(100);
    }

    this.neonLights.forEach((light, index) => {
      const pulse = Math.sin(this.time.now * 0.003 + index) * 0.2 + 0.4;
      light.setAlpha(pulse);
    });
  }
}
