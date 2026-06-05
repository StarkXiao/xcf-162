import Phaser from 'phaser';
import { GameConfig, PillType } from '../config/GameConfig';
import { Player } from '../characters/Player';
import { Guard } from '../enemies/Guard';
import { PillManager } from '../items/PillManager';
import { HUD } from '../ui/HUD';
import { AudioManager } from '../audio/AudioManager';

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private guards: Guard[] = [];
  private pillManager!: PillManager;
  private platforms: Phaser.Physics.Arcade.StaticGroup[] = [];
  private currentFloor: number = 0;
  private score: number = 0;
  private pillCount: number = 0;
  private worldScrollY: number = 0;
  private cameraTargetY: number = 0;
  private spawnTimer!: Phaser.Time.TimerEvent;
  private pillTimer!: Phaser.Time.TimerEvent;
  private scoreTimer!: Phaser.Time.TimerEvent;
  private neonLights: Phaser.GameObjects.Image[] = [];
  private hud!: HUD;
  private audioManager!: AudioManager;
  private isGameOver: boolean = false;
  private keys!: { left: Phaser.Input.Keyboard.Key; right: Phaser.Input.Keyboard.Key; jump: Phaser.Input.Keyboard.Key };

  constructor() {
    super('GameScene');
  }

  create(): void {
    this.audioManager = AudioManager.getInstance();
    this.isGameOver = false;
    this.score = 0;
    this.pillCount = 0;
    this.currentFloor = 0;
    this.worldScrollY = 0;
    this.cameraTargetY = 0;
    this.guards = [];

    this.cameras.main.setBackgroundColor('#0a0a1a');
    this.createBackground();

    this.keys = {
      left: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
      right: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
      jump: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
    };

    this.createPlatforms();

    const startPlatform = this.platforms[0];
    const firstPlatform = startPlatform.getChildren()[0] as Phaser.Physics.Arcade.Sprite;
    const startX = firstPlatform.body!.position.x + GameConfig.platformWidth / 2;
    const startY = firstPlatform.body!.position.y - GameConfig.playerHeight;

    this.player = new Player(this, startX, startY);
    this.pillManager = new PillManager(this);

    this.hud = new HUD(this);
    this.hud.updateScore(this.score);
    this.hud.updateFloor(this.currentFloor);
    this.hud.updatePills(this.pillCount);

    this.setupCollisions();
    this.setupTimers();
    this.audioManager.playMusic();
  }

  private createBackground(): void {
    this.add.image(20, GameConfig.height / 2, 'wall').setScrollFactor(0);
    this.add.image(GameConfig.width - 20, GameConfig.height / 2, 'wall').setScrollFactor(0);

    for (let i = 0; i < 30; i++) {
      const x = Phaser.Math.Between(50, GameConfig.width - 50);
      const y = Phaser.Math.Between(-GameConfig.height * 3, GameConfig.height);
      const type = Phaser.Math.Between(0, 1) === 0 ? 'neon-pink' : 'neon-cyan';
      const light = this.add.image(x, y, type);
      light.setAlpha(Phaser.Math.FloatBetween(0.2, 0.6));
      light.setScale(Phaser.Math.FloatBetween(0.5, 1.2));
      this.neonLights.push(light);
    }
  }

  private createPlatforms(): void {
    for (let floor = 0; floor < GameConfig.maxFloors; floor++) {
      const platformGroup = this.physics.add.staticGroup();
      const y = GameConfig.height - 100 - floor * GameConfig.floorGap;

      const platformCount = Phaser.Math.Between(2, 3);
      const positions: number[] = [];
      const minSpacing = GameConfig.platformWidth + 50;

      for (let i = 0; i < platformCount; i++) {
        let x: number;
        let attempts = 0;
        do {
          x = Phaser.Math.Between(50, GameConfig.width - 50 - GameConfig.platformWidth);
          attempts++;
        } while (positions.some(p => Math.abs(p - x) < minSpacing) && attempts < 20);

        positions.push(x);

        const scale = Phaser.Math.FloatBetween(0.8, 1.3);
        const platform = platformGroup.create(x + (GameConfig.platformWidth * scale) / 2, y, 'platform');
        platform.setDisplaySize(GameConfig.platformWidth * scale, GameConfig.platformHeight);
        platform.refreshBody();
        platform.setData('floor', floor);
      }

      this.platforms.push(platformGroup);
    }
  }

  private setupCollisions(): void {
    this.platforms.forEach(platformGroup => {
      this.physics.add.collider(this.player, platformGroup, this.onPlayerLand, undefined, this);
    });

    this.physics.add.overlap(this.player, this.pillManager.getPills(), this.onPillCollect, undefined, this);
  }

  private setupTimers(): void {
    this.spawnTimer = this.time.addEvent({
      delay: GameConfig.guardSpawnInterval,
      callback: this.spawnGuard,
      callbackScope: this,
      loop: true,
      startAt: 3000
    });

    this.pillTimer = this.time.addEvent({
      delay: GameConfig.pillSpawnInterval,
      callback: this.spawnPill,
      callbackScope: this,
      loop: true
    });

    this.scoreTimer = this.time.addEvent({
      delay: 1000,
      callback: () => {
        this.score += GameConfig.survivalScoreRate;
        this.hud.updateScore(this.score);
      },
      callbackScope: this,
      loop: true
    });
  }

  private spawnGuard(): void {
    if (this.isGameOver) return;

    const spawnY = this.cameraTargetY - 100;
    const spawnX = Phaser.Math.Between(60, GameConfig.width - 60);
    const guard = new Guard(this, spawnX, spawnY, this.player);
    this.guards.push(guard);

    this.platforms.forEach(platformGroup => {
      this.physics.add.collider(guard, platformGroup);
    });

    this.physics.add.overlap(this.player, guard, this.onGuardCollision, undefined, this);
    this.audioManager.play('guard');
  }

  private spawnPill(): void {
    if (this.isGameOver) return;

    const types = [PillType.SPEED, PillType.SLOW, PillType.SCORE, PillType.SHIELD];
    const type = Phaser.Utils.Array.GetRandom(types)!;
    const spawnY = this.cameraTargetY - Phaser.Math.Between(50, 200);
    const spawnX = Phaser.Math.Between(60, GameConfig.width - 60);
    this.pillManager.spawnPill(spawnX, spawnY, type);
  }

  private onPlayerLand(_player: unknown, platform: unknown): void {
    const floor = (platform as Phaser.GameObjects.GameObject).getData('floor') as number;
    if (floor > this.currentFloor) {
      this.currentFloor = floor;
      this.hud.updateFloor(this.currentFloor);
      this.audioManager.play('jump');
    }
  }

  private onPillCollect(_player: unknown, pill: unknown): void {
    const pillObj = pill as Phaser.GameObjects.GameObject;
    const pillType = pillObj.getData('type') as PillType;
    this.pillManager.collectPill(pillObj);
    this.pillCount++;
    this.score += GameConfig.pillScore;
    this.hud.updatePills(this.pillCount);
    this.hud.updateScore(this.score);
    this.hud.showEffect(pillType);
    this.audioManager.play('pill');
  }

  private onGuardCollision(): void {
    if (this.isGameOver) return;

    if (this.player.hasShield) {
      this.player.hasShield = false;
      this.hud.hideShield();
      this.audioManager.play('shield');
      this.guards.forEach(guard => {
        guard.x = guard.x < this.player.x ? guard.x - 100 : guard.x + 100;
      });
      return;
    }

    this.gameOver();
  }

  private gameOver(): void {
    this.isGameOver = true;
    this.spawnTimer.destroy();
    this.pillTimer.destroy();
    this.scoreTimer.destroy();
    this.audioManager.stopMusic();
    this.audioManager.play('gameover');

    this.cameras.main.fade(500, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start('GameOverScene', {
        score: this.score,
        pills: this.pillCount,
        floor: this.currentFloor
      });
    });
  }

  update(_time: number, delta: number): void {
    if (this.isGameOver) return;

    this.player.update(this.keys, delta);

    this.guards.forEach(guard => {
      guard.update(delta, this.player.guardSlowMultiplier);
    });

    this.pillManager.update();

    const targetCamY = this.player.y - GameConfig.height * 0.6;
    this.cameraTargetY = Math.min(this.cameraTargetY, targetCamY);
    this.worldScrollY = this.cameraTargetY;
    this.cameras.main.scrollY = this.cameraTargetY;

    if (this.player.y > this.cameraTargetY + GameConfig.height + 100) {
      this.gameOver();
    }

    this.neonLights.forEach((light, index) => {
      const pulse = Math.sin(this.time.now * 0.003 + index) * 0.2 + 0.4;
      light.setAlpha(pulse);
    });

    this.hud.update();
  }

  getWorldScrollY(): number {
    return this.worldScrollY;
  }
}
