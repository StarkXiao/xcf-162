import Phaser from 'phaser';
import { GameConfig, PillType, TimeOfDayConfigs, ShopItemConfigs } from '../config/GameConfig';
import { Player } from '../characters/Player';
import { Guard } from '../enemies/Guard';
import { BossGuard } from '../enemies/BossGuard';
import { PillManager } from '../items/PillManager';
import { HUD } from '../ui/HUD';
import { AudioManager } from '../audio/AudioManager';
import { TimeManager } from '../utils/TimeManager';
import { FloorEventManager } from '../utils/FloorEventManager';
import { PlatformTrapManager } from '../utils/PlatformTrapManager';
import { SaveManager } from '../utils/SaveManager';
import { StoryManager } from '../utils/StoryManager';
import { ChapterConfig, StoryConfig } from '../config/StoryConfig';
import { TimeOfDay, FloorEvent, ShopItemType, ShopPurchaseStats } from '../types';

export class StoryGameScene extends Phaser.Scene {
  private player!: Player;
  private guards: Guard[] = [];
  private boss!: BossGuard | null;
  private pillManager!: PillManager;
  private platforms: Phaser.Physics.Arcade.StaticGroup[] = [];
  private currentFloor: number = 0;
  private score: number = 0;
  private pillCount: number = 0;
  private pillsCollectedTotal: number = 0;
  private worldScrollY: number = 0;
  private cameraTargetY: number = 0;
  private spawnTimer!: Phaser.Time.TimerEvent;
  private pillTimer!: Phaser.Time.TimerEvent;
  private scoreTimer!: Phaser.Time.TimerEvent;
  private neonLights: Phaser.GameObjects.Image[] = [];
  private hud!: HUD;
  private audioManager!: AudioManager;
  private saveManager!: SaveManager;
  private storyManager!: StoryManager;
  private isGameOver: boolean = false;
  private isVictory: boolean = false;
  private keys!: { left: Phaser.Input.Keyboard.Key; right: Phaser.Input.Keyboard.Key; jump: Phaser.Input.Keyboard.Key };
  private timeManager!: TimeManager;
  private floorEventManager!: FloorEventManager;
  private platformTrapManager!: PlatformTrapManager;
  private darkOverlay!: Phaser.GameObjects.Graphics;
  private chapterConfig!: ChapterConfig;
  private chapterId!: number;
  private isBossFight: boolean = false;
  private bossSpawned: boolean = false;
  private pendingBossSpawn: boolean = false;
  private chapterStartTime: number = 0;
  private chapterHudText!: Phaser.GameObjects.Text;
  private shopPurchaseStats: ShopPurchaseStats = {
    shieldsPurchased: 0,
    slowPulsesPurchased: 0,
    emergencyBouncesPurchased: 0,
    totalPillsSpent: 0
  };

  constructor() {
    super('StoryGameScene');
  }

  init(data: { chapterId: number }): void {
    this.chapterId = data.chapterId;
  }

  create(): void {
    this.audioManager = AudioManager.getInstance();
    this.saveManager = SaveManager.getInstance();
    this.storyManager = StoryManager.getInstance();
    this.chapterConfig = this.storyManager.getChapterConfig(this.chapterId)!;

    if (!this.chapterConfig) {
      this.scene.start('ChapterSelectScene');
      return;
    }

    this.chapterStartTime = this.time.now;
    this.isGameOver = false;
    this.isVictory = false;
    this.score = 0;
    this.pillCount = 0;
    this.pillsCollectedTotal = 0;
    this.currentFloor = 0;
    this.worldScrollY = 0;
    this.cameraTargetY = 0;
    this.guards = [];
    this.boss = null;
    this.isBossFight = false;
    this.bossSpawned = false;
    this.pendingBossSpawn = false;
    this.shopPurchaseStats = { shieldsPurchased: 0, slowPulsesPurchased: 0, emergencyBouncesPurchased: 0, totalPillsSpent: 0 };

    const initialTime = this.chapterConfig.startingTimeOfDay;
    this.cameras.main.setBackgroundColor(TimeOfDayConfigs[initialTime].bgColor);
    this.createBackground();
    this.createDarkOverlay();

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

    if (!this.chapterConfig.enableSideEffects) {
      (this.player as any).disableSideEffects?.();
    }

    this.pillManager = new PillManager(this, 8);
    this.timeManager = new TimeManager(this, initialTime);
    this.floorEventManager = new FloorEventManager(this);
    this.platformTrapManager = new PlatformTrapManager(this, this.cameras.main);

    this.hud = new HUD(this);
    this.hud.updateScore(this.score);
    this.hud.updateFloor(this.currentFloor);
    this.hud.updatePills(this.pillCount);
    this.hud.updateTimeOfDay(this.timeManager.getCurrentTimeOfDay(), this.timeManager.getProgress());
    this.hud.updateCombo(0);
    this.hud.updateNoDamageFloors(0);
    this.hud.updateMultiplier(1.0, false);
    this.hud.setShopPurchaseCallback((itemType: ShopItemType) => this.onShopPurchase(itemType));

    this.events.on('playerDoubleJump', this.onPlayerDoubleJump, this);

    this.setupCollisions();
    this.setupTimers();
    this.setupManagers();
    this.applyTimeOfDaySettings();

    this.createChapterHud();

    this.audioManager.playMusic();
  }

  private createChapterHud(): void {
    const container = this.add.container(0, 0).setScrollFactor(0).setDepth(50);
    const bg = this.add.graphics();
    bg.fillStyle(0x221144, 0.85);
    bg.fillRoundedRect(5, 95, GameConfig.width - 10, 28, 6);
    bg.lineStyle(1, 0xff6699, 0.6);
    bg.strokeRoundedRect(5, 95, GameConfig.width - 10, 28, 6);

    this.add.text(15, 109, `📖 ${this.chapterConfig.title}·${this.chapterConfig.subtitle}`, {
      fontSize: '12px',
      color: '#ff99cc',
      fontStyle: 'bold'
    }).setOrigin(0, 0.5);

    this.chapterHudText = this.add.text(GameConfig.width - 15, 109, '', {
      fontSize: '12px',
      color: '#ffff66',
      fontStyle: 'bold'
    }).setOrigin(1, 0.5);

    container.add([bg, this.chapterHudText]);
    this.updateChapterHud();
  }

  private updateChapterHud(): void {
    if (!this.chapterHudText) return;
    const target = this.chapterConfig.targetFloor;
    let status = `进度 ${this.currentFloor}/${target}F`;
    if (this.isBossFight) {
      status = `⚔ BOSS战!`;
    }
    this.chapterHudText.setText(status);
  }

  private createBackground(): void {
    this.add.image(20, GameConfig.height / 2, 'wall').setScrollFactor(0);
    this.add.image(GameConfig.width - 20, GameConfig.height / 2, 'wall').setScrollFactor(0);

    for (let i = 0; i < 25; i++) {
      const x = Phaser.Math.Between(50, GameConfig.width - 50);
      const y = Phaser.Math.Between(-GameConfig.height * 3, GameConfig.height);
      const type = Phaser.Math.Between(0, 1) === 0 ? 'neon-pink' : 'neon-cyan';
      const light = this.add.image(x, y, type);
      light.setAlpha(Phaser.Math.FloatBetween(0.2, 0.6));
      light.setScale(Phaser.Math.FloatBetween(0.5, 1.2));
      this.neonLights.push(light);
    }
  }

  private createDarkOverlay(): void {
    this.darkOverlay = this.add.graphics();
    this.darkOverlay.setScrollFactor(0);
    this.darkOverlay.setDepth(99);
    this.updateDarkOverlay();
  }

  private updateDarkOverlay(): void {
    if (!this.darkOverlay) return;
    const timeConfig = this.timeManager?.getConfig() || TimeOfDayConfigs[TimeOfDay.DAWN];
    let alpha = 1 - timeConfig.lightOpacity;
    if (this.floorEventManager?.isLightsOut()) {
      alpha = Math.max(alpha, 0.75);
    }
    this.darkOverlay.clear();
    this.darkOverlay.fillStyle(0x000000, alpha);
    this.darkOverlay.fillRect(0, 0, GameConfig.width, GameConfig.height);
  }

  private createPlatforms(): void {
    const floorGap = Math.round(GameConfig.floorGap / this.chapterConfig.platformDensity);
    const platMin = 2;
    const platMax = 3;
    const maxFloors = this.chapterConfig.targetFloor + 5;

    for (let floor = 0; floor < maxFloors; floor++) {
      const platformGroup = this.physics.add.staticGroup();
      const y = GameConfig.height - 100 - floor * floorGap;
      const platformCount = Phaser.Math.Between(platMin, platMax);
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
        const platform = platformGroup.create(x + (GameConfig.platformWidth * scale) / 2, y, 'platform') as Phaser.Physics.Arcade.Sprite;
        platform.setDisplaySize(GameConfig.platformWidth * scale, GameConfig.platformHeight);
        platform.refreshBody();
        platform.setData('floor', floor);

        if (floor >= this.chapterConfig.trapStartFloor) {
          const origTrapStart = GameConfig.trapStartFloor;
          (GameConfig as any).trapStartFloor = this.chapterConfig.trapStartFloor;
          const origTrapChance = GameConfig.trapChancePerPlatform;
          (GameConfig as any).trapChancePerPlatform = this.chapterConfig.trapChance;
          this.platformTrapManager?.assignTrapToPlatform(platform, floor);
          (GameConfig as any).trapStartFloor = origTrapStart;
          (GameConfig as any).trapChancePerPlatform = origTrapChance;
        }
      }
      this.platforms.push(platformGroup);
    }
  }

  private setupCollisions(): void {
    this.platforms.forEach(platformGroup => {
      this.physics.add.collider(
        this.player,
        platformGroup,
        this.onPlayerLand,
        this.checkPlatformCollision,
        this
      );
    });
    this.physics.add.overlap(this.player, this.pillManager.getPills(), this.onPillCollect, undefined, this);
  }

  private checkPlatformCollision(_player: unknown, platform: unknown): boolean {
    const platSprite = platform as Phaser.Physics.Arcade.Sprite;
    return this.platformTrapManager?.isPlatformCollidable(platSprite) ?? true;
  }

  private setupTimers(): void {
    this.resetSpawnTimer();
    this.resetPillTimer();

    this.scoreTimer = this.time.addEvent({
      delay: 1000,
      callback: () => {
        const gained = Math.floor(GameConfig.survivalScoreRate);
        this.score += gained;
        this.hud.updateScore(this.score);
      },
      callbackScope: this,
      loop: true
    });
  }

  private setupManagers(): void {
    if (this.chapterConfig.enableDayNightCycle) {
      this.timeManager.start((newTime: TimeOfDay, _oldTime: TimeOfDay) => {
        this.onTimeOfDayChange(newTime);
      });
    }
    if (this.chapterConfig.enableFloorEvents) {
      this.floorEventManager.setCallbacks(
        (event: FloorEvent) => this.onEventStart(event),
        (event: FloorEvent) => this.onEventEnd(event)
      );
    }
  }

  private resetSpawnTimer(): void {
    if (this.spawnTimer) this.spawnTimer.destroy();
    if (this.isBossFight) return;

    const eventMultiplier = this.floorEventManager?.getEventEffect?.('guardSpawn') || 1;
    const cfg = this.chapterConfig.guardDifficulty;
    let delay = GameConfig.guardSpawnInterval / (cfg.spawnMultiplier * eventMultiplier);

    this.spawnTimer = this.time.addEvent({
      delay: delay,
      callback: this.spawnGuard,
      callbackScope: this,
      loop: true,
      startAt: 3000
    });
  }

  private resetPillTimer(): void {
    if (this.pillTimer) this.pillTimer.destroy();
    const eventMultiplier = this.floorEventManager?.getEventEffect?.('pillSpawn') || 1;
    const cfg = this.chapterConfig.pillDifficulty;
    const delay = GameConfig.pillSpawnInterval / (cfg.spawnMultiplier * eventMultiplier);

    this.pillTimer = this.time.addEvent({
      delay: delay,
      callback: this.spawnPill,
      callbackScope: this,
      loop: true
    });
  }

  private applyTimeOfDaySettings(): void {
    if (!this.chapterConfig.enableDayNightCycle) {
      this.pillManager.setPillWeights(this.chapterConfig.pillDifficulty.weights);
      return;
    }
    const timeConfig = this.timeManager.getConfig();
    this.cameras.main.setBackgroundColor(timeConfig.bgColor);
    this.pillManager.setPillWeights(this.chapterConfig.pillDifficulty.weights);

    const cfg = this.chapterConfig.guardDifficulty;
    this.guards.forEach(guard => {
      guard.setTimeMultipliers(
        timeConfig.guardSpeedMultiplier * cfg.speedMultiplier,
        Math.floor(timeConfig.guardDetectionRange * cfg.detectionMultiplier)
      );
    });

    this.updateDarkOverlay();
    this.resetSpawnTimer();
    this.resetPillTimer();
  }

  private onTimeOfDayChange(newTime: TimeOfDay): void {
    this.applyTimeOfDaySettings();
    this.saveManager.setLastTimeOfDay(newTime);
  }

  private onEventStart(event: FloorEvent): void {
    this.hud.showEvent(event);
    this.audioManager.play('guard');
    this.updateDarkOverlay();
    this.resetSpawnTimer();
    this.resetPillTimer();
  }

  private onEventEnd(_event: FloorEvent): void {
    this.hud.hideEvent();
    this.updateDarkOverlay();
    this.resetSpawnTimer();
    this.resetPillTimer();
  }

  private spawnGuard(): void {
    if (this.isGameOver || this.isBossFight) return;

    const spawnY = this.cameraTargetY - 100;
    const spawnX = Phaser.Math.Between(60, GameConfig.width - 60);
    const cfg = this.chapterConfig.guardDifficulty;
    const timeCfg = this.chapterConfig.enableDayNightCycle ? this.timeManager.getConfig() : { guardSpeedMultiplier: 1, guardDetectionRange: 150 };
    const eventDetectionMultiplier = this.floorEventManager.getEventEffect('guardDetection');

    const speedMul = cfg.speedMultiplier * timeCfg.guardSpeedMultiplier;
    const detectRange = Math.floor(timeCfg.guardDetectionRange * cfg.detectionMultiplier * eventDetectionMultiplier);

    const guard = new Guard(this, spawnX, spawnY, this.player, speedMul, detectRange);
    this.guards.push(guard);
    guard.setPlatformTrapManager(this.platformTrapManager);

    const unlockStates = cfg.unlockChaseStates;
    if (unlockStates.length > 0) {
      const elapsed = this.time.now - this.chapterStartTime;
      let state = unlockStates[0];
      for (let i = 0; i < GameConfig.guardChaseUnlockTime.length; i++) {
        const unlock = GameConfig.guardChaseUnlockTime[i];
        if (elapsed >= unlock.timeMs && unlockStates.includes(unlock.state)) {
          state = unlock.state;
        }
      }
      guard.setChaseState(state);
    }

    this.platforms.forEach(platformGroup => {
      this.physics.add.collider(
        guard,
        platformGroup,
        undefined,
        (_guard, platform) => {
          const platSprite = platform as Phaser.Physics.Arcade.Sprite;
          return this.platformTrapManager?.isPlatformCollidable(platSprite) ?? true;
        },
        this
      );
    });

    this.physics.add.overlap(this.player, guard, this.onGuardCollision, undefined, this);
    this.audioManager.play('guard');
  }

  private spawnPill(): void {
    if (this.isGameOver) return;
    const rareMultiplier = this.floorEventManager.getEventEffect('pillRare');
    const type = this.pillManager.getRandomPillType(rareMultiplier);
    const spawnY = this.cameraTargetY - Phaser.Math.Between(50, 200);
    const spawnX = Phaser.Math.Between(60, GameConfig.width - 60);
    this.pillManager.spawnPill(spawnX, spawnY, type);
  }

  private onPlayerLand(_player: unknown, platform: unknown): void {
    const platformSprite = platform as Phaser.Physics.Arcade.Sprite;
    this.platformTrapManager?.onPlayerLand(platformSprite, this.player);
    const vel = this.platformTrapManager?.getPlatformVelocity(platformSprite);
    if (vel && (vel.vx !== 0 || vel.vy !== 0)) {
      this.player.x += vel.vx * 0.016;
    }

    const floor = platformSprite.getData('floor') as number;
    if (floor > this.currentFloor) {
      this.currentFloor = floor;
      this.hud.updateFloor(this.currentFloor);
      this.updateChapterHud();

      if (this.chapterConfig.enableFloorEvents) {
        this.floorEventManager.checkFloorEvent(this.currentFloor);
      }
      this.audioManager.play('jump');
      this.resetSpawnTimer();
      this.resetPillTimer();

      const bonus = GameConfig.noDamageFloorBaseBonus;
      this.score += bonus;
      this.hud.updateScore(this.score);
      this.hud.showNoDamageBonus(bonus, this.currentFloor);

      this.checkBossTrigger();
      this.checkChapterComplete();
    }
  }

  private checkBossTrigger(): void {
    if (this.bossSpawned) return;
    if (this.chapterConfig.bossFloor && this.currentFloor >= this.chapterConfig.bossFloor && this.chapterConfig.bossConfig) {
      this.spawnBoss();
    }
  }

  private spawnBoss(): void {
    if (this.bossSpawned || this.pendingBossSpawn) return;
    this.pendingBossSpawn = true;
    this.isBossFight = true;

    if (this.spawnTimer) this.spawnTimer.destroy();
    this.guards.forEach(g => g.destroy());
    this.guards = [];

    if (this.chapterConfig.preBossCutsceneId) {
      this.scene.pause();
      this.scene.launch('CutsceneScene', {
        cutsceneId: this.chapterConfig.preBossCutsceneId,
        nextScene: 'StoryGameScene',
        nextSceneData: { chapterId: this.chapterId, _resumeBoss: true }
      });
      return;
    }
    this.onBossCutsceneComplete();
  }

  public onBossCutsceneComplete(): void {
    if (this.bossSpawned) return;
    this.pendingBossSpawn = false;
    this.doSpawnBoss();
  }

  private doSpawnBoss(): void {
    const spawnY = this.cameraTargetY - 150;
    const spawnX = GameConfig.width / 2;
    const bossCfg = this.chapterConfig.bossConfig!;

    this.boss = new BossGuard(this, spawnX, spawnY, this.player, bossCfg);
    this.boss.setPlatformTrapManager(this.platformTrapManager);
    this.boss.setCallbacks(
      () => this.onBossDefeated(),
      (_hp, _maxHp) => this.audioManager.play('shield'),
      () => this.onBossSummonGuards(),
      () => this.onBossTriggerHallucination()
    );

    this.platforms.forEach(platformGroup => {
      this.physics.add.collider(
        this.boss!,
        platformGroup,
        undefined,
        (_boss, platform) => {
          const platSprite = platform as Phaser.Physics.Arcade.Sprite;
          return this.platformTrapManager?.isPlatformCollidable(platSprite) ?? true;
        },
        this
      );
    });

    this.physics.add.overlap(this.player, this.boss, this.onBossCollision, undefined, this);
    this.updateChapterHud();
    this.audioManager.play('guard');
  }

  private onBossSummonGuards(): void {
    for (let i = 0; i < 2; i++) {
      this.time.delayedCall(i * 500, () => this.spawnBossMinion());
    }
  }

  private spawnBossMinion(): void {
    if (!this.isBossFight || this.isGameOver) return;
    const spawnY = this.cameraTargetY - 100;
    const spawnX = Phaser.Math.Between(60, GameConfig.width - 60);
    const cfg = this.chapterConfig.guardDifficulty;
    const guard = new Guard(this, spawnX, spawnY, this.player, cfg.speedMultiplier * 0.8, 150);
    this.guards.push(guard);
    guard.setPlatformTrapManager(this.platformTrapManager);

    this.platforms.forEach(platformGroup => {
      this.physics.add.collider(guard, platformGroup);
    });
    this.physics.add.overlap(this.player, guard, this.onGuardCollision, undefined, this);
  }

  private onBossTriggerHallucination(): void {
    (this.player as any).forceHallucination?.();
    this.cameras.main.shake(500, 0.015);
  }

  private onBossCollision(): void {
    if (this.isGameOver || !this.boss) return;
    if (this.player.hasShield) {
      this.player.hasShield = false;
      this.hud.hideShield();
      this.audioManager.play('shield');
      this.boss.hit();
      const dx = this.player.x - this.boss.x;
      this.player.setVelocityX(Math.sign(dx) * 300);
      this.player.setVelocityY(GameConfig.playerJumpForce * 0.8);
      return;
    }
    const reason = `被${this.chapterConfig.bossConfig?.name || 'Boss'}抓住`;
    this.gameOver(reason);
  }

  private onBossDefeated(): void {
    this.boss = null;
    this.isBossFight = false;
    this.guards.forEach(g => g.destroy());
    this.guards = [];
    this.score += 2000;
    this.hud.updateScore(this.score);
    this.showBossDefeatedPopup();
    this.updateChapterHud();
    this.time.delayedCall(1500, () => this.checkChapterComplete(true));
  }

  private showBossDefeatedPopup(): void {
    const overlay = this.add.graphics().setDepth(200);
    overlay.fillStyle(0x000000, 0.6);
    overlay.fillRect(0, 0, GameConfig.width, GameConfig.height);

    const text = this.add.text(GameConfig.width / 2, GameConfig.height / 2, '⚔ BOSS 击败! +2000分', {
      fontSize: '28px',
      color: '#ffcc00',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(201);

    this.tweens.add({
      targets: [overlay, text],
      alpha: 0,
      duration: 800,
      delay: 1200,
      onComplete: () => {
        overlay.destroy();
        text.destroy();
      }
    });
  }

  private checkChapterComplete(bossDefeated: boolean = false): void {
    if (this.isGameOver || this.isVictory) return;
    const needBoss = !!this.chapterConfig.bossConfig;
    const reachedTarget = this.currentFloor >= this.chapterConfig.targetFloor;

    if (needBoss) {
      if (bossDefeated) {
        this.victory();
      }
    } else if (reachedTarget) {
      this.victory();
    }
  }

  private onPlayerDoubleJump(): void {
    const bonus = GameConfig.comboBaseScore;
    this.score += bonus;
    this.hud.updateScore(this.score);
    this.hud.showComboBonus(bonus, 1);
  }

  private onPillCollect(_player: unknown, pill: unknown): void {
    const pillObj = pill as Phaser.GameObjects.GameObject;
    const pillType = pillObj.getData('type') as PillType;
    this.pillManager.collectPill(pillObj);
    this.pillCount++;
    this.pillsCollectedTotal++;
    const pillScore = GameConfig.pillScore;
    this.score += pillScore;
    this.hud.updatePills(this.pillCount);
    this.hud.updateScore(this.score);
    this.hud.showEffect(pillType);
    this.audioManager.play('pill');
  }

  private onShopPurchase(itemType: ShopItemType): boolean {
    const config = ShopItemConfigs[itemType];
    if (this.pillCount < config.cost) return false;
    this.pillCount -= config.cost;
    this.shopPurchaseStats.totalPillsSpent += config.cost;
    this.hud.updatePills(this.pillCount);
    this.audioManager.play('pill');

    switch (itemType) {
      case ShopItemType.SHIELD:
        this.shopPurchaseStats.shieldsPurchased++;
        this.player.activateShopShield(config.duration || 10000);
        this.hud.showShield();
        break;
      case ShopItemType.SLOW_PULSE:
        this.shopPurchaseStats.slowPulsesPurchased++;
        this.player.activateShopSlowPulse(config.duration || 5000);
        break;
      case ShopItemType.EMERGENCY_BOUNCE:
        this.shopPurchaseStats.emergencyBouncesPurchased++;
        this.player.emergencyBounce(GameConfig.shopEmergencyBounceForce);
        break;
    }
    return true;
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
    const reason = '被保安抓住';
    this.gameOver(reason);
  }

  private victory(): void {
    this.isVictory = true;
    this.isGameOver = true;

    if (this.spawnTimer) this.spawnTimer.destroy();
    if (this.pillTimer) this.pillTimer.destroy();
    if (this.scoreTimer) this.scoreTimer.destroy();
    this.events.off('playerDoubleJump', this.onPlayerDoubleJump, this);
    this.timeManager?.pause?.();
    this.audioManager.setDangerState(false);
    this.audioManager.stopMusic();

    const playTime = this.time.now - this.chapterStartTime;
    this.storyManager.completeChapter(this.chapterId, this.score, this.currentFloor);
    this.storyManager.addPlayTime(playTime);

    this.cameras.main.fade(500, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      const isLast = this.chapterId >= StoryConfig.totalChapters;
      const victoryData = {
        chapterId: this.chapterId,
        score: this.score,
        floor: this.currentFloor,
        pills: this.pillsCollectedTotal,
        clearTimeMs: playTime
      };
      if (isLast) {
        this.scene.start('CutsceneScene', {
          cutsceneId: 'story_ending',
          nextScene: 'StoryVictoryScene',
          nextSceneData: victoryData
        });
      } else if (this.chapterConfig.outroCutsceneId) {
        this.scene.start('CutsceneScene', {
          cutsceneId: this.chapterConfig.outroCutsceneId,
          nextScene: 'StoryVictoryScene',
          nextSceneData: victoryData
        });
      } else {
        this.scene.start('StoryVictoryScene', victoryData);
      }
    });
  }

  private gameOver(reason: string): void {
    this.isGameOver = true;

    if (this.spawnTimer) this.spawnTimer.destroy();
    if (this.pillTimer) this.pillTimer.destroy();
    if (this.scoreTimer) this.scoreTimer.destroy();
    this.events.off('playerDoubleJump', this.onPlayerDoubleJump, this);
    this.timeManager?.pause?.();
    this.audioManager.setDangerState(false);
    this.audioManager.stopMusic();
    this.audioManager.play('gameover');

    this.storyManager.addDeath();
    const playTime = this.time.now - this.chapterStartTime;
    this.storyManager.addPlayTime(playTime);

    this.cameras.main.fade(500, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start('StoryGameOverScene', {
        chapterId: this.chapterId,
        score: this.score,
        floor: this.currentFloor,
        pills: this.pillCount,
        deathReason: reason
      });
    });
  }

  update(_time: number, delta: number): void {
    if (this.isGameOver) return;
    this.player.update(this.keys, delta);
    this.platformTrapManager?.update(delta);

    const eventGuardSpeedMultiplier = this.floorEventManager?.getEventEffect?.('guardSpeed') || 1;
    const cfg = this.chapterConfig.guardDifficulty;
    const timeCfg = this.chapterConfig.enableDayNightCycle ? this.timeManager.getConfig() : { guardSpeedMultiplier: 1, guardDetectionRange: 150 };

    this.guards.forEach(guard => {
      guard.setTimeMultipliers(timeCfg.guardSpeedMultiplier * cfg.speedMultiplier, Math.floor(timeCfg.guardDetectionRange * cfg.detectionMultiplier));
      guard.update(delta, this.player.guardSlowMultiplier, eventGuardSpeedMultiplier);
    });

    if (this.boss) {
      this.boss.update(delta, this.player.guardSlowMultiplier, eventGuardSpeedMultiplier);
    }

    this.pillManager.update();

    const targetCamY = this.player.y - GameConfig.height * 0.6;
    this.cameraTargetY = Math.min(this.cameraTargetY, targetCamY);
    this.worldScrollY = this.cameraTargetY;
    this.cameras.main.scrollY = this.cameraTargetY;

    if (this.player.y > this.cameraTargetY + GameConfig.height + 100) {
      if (!this.isGameOver) {
        this.gameOver('掉出屏幕坠落');
      }
    }

    if (this.chapterConfig.enableDayNightCycle) {
      const timeConfig = this.timeManager.getConfig();
      const baseLightAlpha = timeConfig.lightOpacity;
      this.neonLights.forEach((light, index) => {
        const pulse = Math.sin(this.time.now * 0.003 + index) * 0.2 + baseLightAlpha;
        light.setAlpha(pulse * 0.6);
      });
      this.hud.updateTimeOfDay(this.timeManager.getCurrentTimeOfDay(), this.timeManager.getProgress());
    }

    if (this.chapterConfig.enableFloorEvents && this.floorEventManager.hasActiveEvent()) {
      this.hud.updateEventProgress(this.floorEventManager.getEventProgress());
    }
    this.updateDangerState();
    this.hud.update();
  }

  private updateDangerState(): void {
    if (!this.audioManager.isAdaptiveMixingEnabled()) return;
    let isDanger = false;
    if (this.boss) {
      isDanger = true;
    } else {
      for (const guard of this.guards) {
        const dx = Math.abs(guard.x - this.player.x);
        const dy = Math.abs(guard.y - this.player.y);
        if (Math.sqrt(dx * dx + dy * dy) < 120) {
          isDanger = true;
          break;
        }
      }
    }
    if (!isDanger) {
      const sideEffectState = this.player.getSideEffectState();
      if (sideEffectState.addictionLevel >= 70 || sideEffectState.isHallucinating || sideEffectState.isOutOfControl) {
        isDanger = true;
      }
    }
    this.audioManager.setDangerState(isDanger);
  }

  getWorldScrollY(): number {
    return this.worldScrollY;
  }
}
