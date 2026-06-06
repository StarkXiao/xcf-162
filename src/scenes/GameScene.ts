import Phaser from 'phaser';
import { GameConfig, PillType, TimeOfDayConfigs } from '../config/GameConfig';
import { Player } from '../characters/Player';
import { Guard } from '../enemies/Guard';
import { PillManager } from '../items/PillManager';
import { HUD } from '../ui/HUD';
import { AudioManager } from '../audio/AudioManager';
import { TimeManager } from '../utils/TimeManager';
import { FloorEventManager } from '../utils/FloorEventManager';
import { SaveManager } from '../utils/SaveManager';
import { ArchiveManager } from '../utils/ArchiveManager';
import { ChallengeConfig, TimeOfDay, FloorEvent, WinConditionType } from '../types';

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
  private saveManager!: SaveManager;
  private isGameOver: boolean = false;
  private keys!: { left: Phaser.Input.Keyboard.Key; right: Phaser.Input.Keyboard.Key; jump: Phaser.Input.Keyboard.Key };
  private timeManager!: TimeManager;
  private floorEventManager!: FloorEventManager;
  private darkOverlay!: Phaser.GameObjects.Graphics;
  private previousCycleCount: number = 0;
  private previousEventsTriggered: number = 0;
  private currentCombo: number = 0;
  private maxComboInGame: number = 0;
  private noDamageFloorStreak: number = 0;
  private maxNoDamageFloorsInGame: number = 0;
  private lastComboTime: number = 0;
  private comboCheckTimer!: Phaser.Time.TimerEvent;

  private challengeConfig: ChallengeConfig | null = null;
  private isChallengeMode: boolean = false;
  private challengeStartTime: number = 0;
  private challengeHudText!: Phaser.GameObjects.Text;

  constructor() {
    super('GameScene');
  }

  create(data?: { challengeConfig?: ChallengeConfig }): void {
    this.audioManager = AudioManager.getInstance();
    this.saveManager = SaveManager.getInstance();
    this.isGameOver = false;
    this.score = 0;
    this.pillCount = 0;
    this.currentFloor = 0;
    this.worldScrollY = 0;
    this.cameraTargetY = 0;
    this.guards = [];
    this.previousCycleCount = 0;
    this.previousEventsTriggered = 0;
    this.currentCombo = 0;
    this.maxComboInGame = 0;
    this.noDamageFloorStreak = 0;
    this.maxNoDamageFloorsInGame = 0;
    this.lastComboTime = 0;

    if (data?.challengeConfig) {
      this.challengeConfig = data.challengeConfig;
      this.isChallengeMode = true;
      this.challengeStartTime = this.time.now;
    }

    const initialTime = this.saveManager.getLastTimeOfDay();
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

    if (this.isChallengeMode && !this.challengeConfig?.enableSideEffects) {
      (this.player as any).disableSideEffects?.();
    }

    const pillMax = this.isChallengeMode ? (this.challengeConfig?.maxPills || 8) : 8;
    this.pillManager = new PillManager(this, pillMax);

    this.timeManager = new TimeManager(this, initialTime);
    this.floorEventManager = new FloorEventManager(this);

    this.hud = new HUD(this);
    this.hud.updateScore(this.score);
    this.hud.updateFloor(this.currentFloor);
    this.hud.updatePills(this.pillCount);
    this.hud.updateTimeOfDay(this.timeManager.getCurrentTimeOfDay(), this.timeManager.getProgress());
    this.hud.updateCombo(0);
    this.hud.updateNoDamageFloors(0);

    this.events.on('playerDoubleJump', this.onPlayerDoubleJump, this);

    this.setupCollisions();
    this.setupTimers();
    this.setupManagers();
    this.applyTimeOfDaySettings();

    if (this.isChallengeMode && this.challengeConfig) {
      const initGuardCount = this.challengeConfig.guardCount || 0;
      for (let i = 0; i < initGuardCount; i++) {
        this.time.delayedCall(500 + i * 300, () => this.spawnGuard());
      }
      this.createChallengeHud();
    }

    this.audioManager.playMusic();
  }

  private createChallengeHud(): void {
    if (!this.challengeConfig) return;

    const container = this.add.container(0, 0).setScrollFactor(0).setDepth(50);

    const bg = this.add.graphics();
    bg.fillStyle(0x111133, 0.85);
    bg.fillRoundedRect(5, 95, GameConfig.width - 10, 28, 6);
    bg.lineStyle(1, 0xff6699, 0.6);
    bg.strokeRoundedRect(5, 95, GameConfig.width - 10, 28, 6);

    const label = this.add.text(15, 109, `🎯 ${this.challengeConfig.name}`, {
      fontSize: '12px',
      color: '#ff99cc',
      fontStyle: 'bold'
    }).setOrigin(0, 0.5);

    this.challengeHudText = this.add.text(GameConfig.width - 15, 109, '', {
      fontSize: '12px',
      color: '#ffff66',
      fontStyle: 'bold'
    }).setOrigin(1, 0.5);

    container.add([bg, label, this.challengeHudText]);
    this.updateChallengeHud();
  }

  private updateChallengeHud(): void {
    if (!this.challengeConfig || !this.challengeHudText) return;
    const cfg = this.challengeConfig;
    let status = '';
    switch (cfg.winCondition.type) {
      case WinConditionType.FLOOR_REACHED:
        status = `楼层 ${this.currentFloor}/${cfg.winCondition.value}F`;
        break;
      case WinConditionType.SCORE_REACHED:
        status = `分数 ${this.score}/${cfg.winCondition.value}`;
        break;
      case WinConditionType.PILLS_COLLECTED:
        status = `药片 ${this.pillCount}/${cfg.winCondition.value}`;
        break;
      case WinConditionType.SURVIVAL_TIME:
        const elapsed = this.time.now - this.challengeStartTime;
        const remain = Math.max(0, cfg.winCondition.value - elapsed);
        status = `存活 ${Math.ceil(remain / 1000)}s`;
        break;
      case WinConditionType.GUARDS_AVOIDED:
        status = `甩开保安 ${this.guards.length}/${cfg.winCondition.value}`;
        break;
    }
    if (cfg.timeLimitMs > 0) {
      const timeLeft = Math.max(0, cfg.timeLimitMs - (this.time.now - this.challengeStartTime));
      status += ` | ⏱ ${Math.ceil(timeLeft / 1000)}s`;
    }
    this.challengeHudText.setText(status);
  }

  private checkChallengeWin(): boolean {
    if (!this.isChallengeMode || !this.challengeConfig) return false;
    const cfg = this.challengeConfig;
    switch (cfg.winCondition.type) {
      case WinConditionType.FLOOR_REACHED:
        return this.currentFloor >= cfg.winCondition.value;
      case WinConditionType.SCORE_REACHED:
        return this.score >= cfg.winCondition.value;
      case WinConditionType.PILLS_COLLECTED:
        return this.pillCount >= cfg.winCondition.value;
      case WinConditionType.SURVIVAL_TIME:
        return (this.time.now - this.challengeStartTime) >= cfg.winCondition.value;
      case WinConditionType.GUARDS_AVOIDED:
        return this.guards.length >= cfg.winCondition.value;
      default:
        return false;
    }
  }

  private checkChallengeTimeLimit(): boolean {
    if (!this.isChallengeMode || !this.challengeConfig) return false;
    if (this.challengeConfig.timeLimitMs <= 0) return false;
    return (this.time.now - this.challengeStartTime) >= this.challengeConfig.timeLimitMs;
  }

  private challengeWin(): void {
    if (this.isGameOver) return;
    this.isGameOver = true;

    if (this.spawnTimer) this.spawnTimer.destroy();
    if (this.pillTimer) this.pillTimer.destroy();
    if (this.scoreTimer) this.scoreTimer.destroy();
    if (this.comboCheckTimer) this.comboCheckTimer.destroy();

    this.events.off('playerDoubleJump', this.onPlayerDoubleJump, this);
    this.timeManager?.pause?.();
    this.saveGameState();
    this.audioManager.stopMusic();

    const winOverlay = this.add.graphics().setDepth(200);
    winOverlay.fillStyle(0x000000, 0.85);
    winOverlay.fillRect(0, 0, GameConfig.width, GameConfig.height);

    const panel = this.add.graphics().setDepth(201);
    const pw = 360;
    const ph = 300;
    const px = (GameConfig.width - pw) / 2;
    const py = (GameConfig.height - ph) / 2;
    panel.fillStyle(0x151535, 1);
    panel.fillRoundedRect(px, py, pw, ph, 14);
    panel.lineStyle(3, 0x00ff88, 1);
    panel.strokeRoundedRect(px, py, pw, ph, 14);

    this.add.text(GameConfig.width / 2, py + 45, '🏆 挑战成功！', {
      fontSize: '32px',
      color: '#00ff88',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(202);

    this.add.text(GameConfig.width / 2, py + 90, this.challengeConfig?.name || '', {
      fontSize: '18px',
      color: '#ffcc66',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(202);

    const statY = py + 130;
    const stats = [
      { label: '最终楼层', value: `${this.currentFloor}F`, color: '#66ccff' },
      { label: '最终得分', value: `${this.score}`, color: '#ffcc00' },
      { label: '收集药片', value: `${this.pillCount}`, color: '#ff66ff' },
      { label: '最高连击', value: `${this.maxComboInGame}`, color: '#ff9966' }
    ];
    stats.forEach((s, i) => {
      this.add.text(px + 30, statY + i * 28, s.label, {
        fontSize: '14px',
        color: '#aabbcc'
      }).setOrigin(0, 0).setDepth(202);
      this.add.text(px + pw - 30, statY + i * 28, s.value, {
        fontSize: '14px',
        color: s.color,
        fontStyle: 'bold'
      }).setOrigin(1, 0).setDepth(202);
    });

    const backBtn = this.add.text(GameConfig.width / 2, py + ph - 40, '返回菜单', {
      fontSize: '18px',
      color: '#ffffff',
      backgroundColor: '#00aa66',
      padding: { left: 30, right: 30, top: 10, bottom: 10 },
      fontStyle: 'bold'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(202);

    backBtn.on('pointerover', () => backBtn.setBackgroundColor('#00cc77'));
    backBtn.on('pointerout', () => backBtn.setBackgroundColor('#00aa66'));
    backBtn.on('pointerdown', () => {
      this.scene.start('MenuScene');
    });
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

    const gradient = this.add.graphics();
    gradient.setScrollFactor(0);
    gradient.setDepth(99);
  }

  private createPlatforms(): void {
    const floorGap = this.isChallengeMode
      ? Math.round(GameConfig.floorGap / (this.challengeConfig?.floorDensity || 1))
      : GameConfig.floorGap;

    const platMin = this.isChallengeMode
      ? (this.challengeConfig?.platformCountMin || 2)
      : 2;
    const platMax = this.isChallengeMode
      ? (this.challengeConfig?.platformCountMax || 3)
      : 3;

    for (let floor = 0; floor < GameConfig.maxFloors; floor++) {
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
    this.resetSpawnTimer();
    this.resetPillTimer();

    this.scoreTimer = this.time.addEvent({
      delay: 1000,
      callback: () => {
        const scoreMultiplier = this.floorEventManager.getEventEffect('score');
        this.score += Math.floor(GameConfig.survivalScoreRate * scoreMultiplier);
        this.hud.updateScore(this.score);
      },
      callbackScope: this,
      loop: true
    });

    this.comboCheckTimer = this.time.addEvent({
      delay: 100,
      callback: () => {
        if (this.currentCombo > 0 && this.time.now - this.lastComboTime > GameConfig.comboTimeoutMs) {
          this.resetCombo();
        }
      },
      callbackScope: this,
      loop: true
    });
  }

  private setupManagers(): void {
    if (!this.isChallengeMode || this.challengeConfig?.enableDayNightCycle) {
      this.timeManager.start((newTime: TimeOfDay, _oldTime: TimeOfDay) => {
        this.onTimeOfDayChange(newTime);
      });
    }

    if (!this.isChallengeMode || this.challengeConfig?.enableFloorEvents) {
      this.floorEventManager.setCallbacks(
        (event: FloorEvent) => this.onEventStart(event),
        (event: FloorEvent) => this.onEventEnd(event)
      );
    }
  }

  private resetSpawnTimer(): void {
    if (this.spawnTimer) {
      this.spawnTimer.destroy();
    }

    const eventMultiplier = this.floorEventManager?.getEventEffect?.('guardSpawn') || 1;

    let delay: number;
    if (this.isChallengeMode) {
      delay = this.challengeConfig?.guardSpawnInterval || GameConfig.guardSpawnInterval;
      delay = delay / eventMultiplier;
    } else {
      const timeConfig = this.timeManager.getConfig();
      delay = GameConfig.guardSpawnInterval / (timeConfig.guardSpawnMultiplier * eventMultiplier);
    }

    this.spawnTimer = this.time.addEvent({
      delay: delay,
      callback: this.spawnGuard,
      callbackScope: this,
      loop: true,
      startAt: 3000
    });
  }

  private resetPillTimer(): void {
    if (this.pillTimer) {
      this.pillTimer.destroy();
    }

    const eventMultiplier = this.floorEventManager?.getEventEffect?.('pillSpawn') || 1;

    let delay: number;
    if (this.isChallengeMode) {
      delay = this.challengeConfig?.pillSpawnInterval || GameConfig.pillSpawnInterval;
      delay = delay / eventMultiplier;
    } else {
      const timeConfig = this.timeManager.getConfig();
      delay = GameConfig.pillSpawnInterval / (timeConfig.pillSpawnMultiplier * eventMultiplier);
    }

    this.pillTimer = this.time.addEvent({
      delay: delay,
      callback: this.spawnPill,
      callbackScope: this,
      loop: true
    });
  }

  private applyTimeOfDaySettings(): void {
    if (this.isChallengeMode && !this.challengeConfig?.enableDayNightCycle) {
      if (this.challengeConfig?.pillWeights) {
        this.pillManager.setPillWeights(this.challengeConfig.pillWeights);
      }
      return;
    }

    const timeConfig = this.timeManager.getConfig();
    const eventDetectionMultiplier = this.floorEventManager.getEventEffect('guardDetection');

    this.cameras.main.setBackgroundColor(timeConfig.bgColor);

    if (this.isChallengeMode && this.challengeConfig?.pillWeights) {
      this.pillManager.setPillWeights(this.challengeConfig.pillWeights);
    } else {
      this.pillManager.setPillWeights(timeConfig.pillWeights);
    }

    this.guards.forEach(guard => {
      guard.setTimeMultipliers(
        timeConfig.guardSpeedMultiplier,
        Math.floor(timeConfig.guardDetectionRange * eventDetectionMultiplier)
      );
    });

    this.updateDarkOverlay();
    this.resetSpawnTimer();
    this.resetPillTimer();
  }

  private onTimeOfDayChange(newTime: TimeOfDay): void {
    this.applyTimeOfDaySettings();
    this.saveManager.setLastTimeOfDay(newTime);

    const currentCycles = this.timeManager.getCycleCount();
    if (currentCycles > this.previousCycleCount) {
      this.saveManager.addDayCycles(currentCycles - this.previousCycleCount);
      this.previousCycleCount = currentCycles;
    }
  }

  private onEventStart(event: FloorEvent): void {
    this.hud.showEvent(event);
    this.audioManager.play('guard');
    this.updateDarkOverlay();
    this.resetSpawnTimer();
    this.resetPillTimer();

    const currentEvents = this.floorEventManager.getEventsTriggeredCount();
    if (currentEvents > this.previousEventsTriggered) {
      this.saveManager.addEventsTriggered(currentEvents - this.previousEventsTriggered);
      this.previousEventsTriggered = currentEvents;
    }
  }

  private onEventEnd(_event: FloorEvent): void {
    this.hud.hideEvent();
    this.updateDarkOverlay();
    this.resetSpawnTimer();
    this.resetPillTimer();
  }

  private spawnGuard(): void {
    if (this.isGameOver) return;

    const spawnY = this.cameraTargetY - 100;
    const spawnX = Phaser.Math.Between(60, GameConfig.width - 60);

    let speedMul: number;
    let detectRange: number;

    if (this.isChallengeMode) {
      speedMul = this.challengeConfig?.guardSpeedMultiplier || 1;
      detectRange = this.challengeConfig?.guardDetectionRange || 150;
    } else {
      const timeConfig = this.timeManager.getConfig();
      const eventDetectionMultiplier = this.floorEventManager.getEventEffect('guardDetection');
      speedMul = timeConfig.guardSpeedMultiplier;
      detectRange = Math.floor(timeConfig.guardDetectionRange * eventDetectionMultiplier);
    }

    const guard = new Guard(
      this,
      spawnX,
      spawnY,
      this.player,
      speedMul,
      detectRange
    );
    this.guards.push(guard);

    this.platforms.forEach(platformGroup => {
      this.physics.add.collider(guard, platformGroup);
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
    const floor = (platform as Phaser.GameObjects.GameObject).getData('floor') as number;
    if (floor > this.currentFloor) {
      this.currentFloor = floor;
      this.hud.updateFloor(this.currentFloor);
      this.floorEventManager.checkFloorEvent(this.currentFloor);
      this.audioManager.play('jump');

      this.noDamageFloorStreak++;
      if (this.noDamageFloorStreak > this.maxNoDamageFloorsInGame) {
        this.maxNoDamageFloorsInGame = this.noDamageFloorStreak;
      }
      this.hud.updateNoDamageFloors(this.noDamageFloorStreak);

      const bonus = GameConfig.noDamageFloorBaseBonus + (this.noDamageFloorStreak - 1) * GameConfig.noDamageFloorBonusPerFloor;
      const scoreMultiplier = this.floorEventManager.getEventEffect('score');
      const finalBonus = Math.floor(bonus * scoreMultiplier);
      this.score += finalBonus;
      this.hud.updateScore(this.score);
      this.hud.showNoDamageBonus(finalBonus, this.noDamageFloorStreak);
    }

    if (this.currentCombo > 0) {
      this.resetCombo();
    }
  }

  private onPlayerDoubleJump(): void {
    this.currentCombo++;
    this.lastComboTime = this.time.now;

    if (this.currentCombo > this.maxComboInGame) {
      this.maxComboInGame = this.currentCombo;
    }

    const bonus = GameConfig.comboBaseScore + (this.currentCombo - 1) * GameConfig.comboMultiplierPerCombo;
    const scoreMultiplier = this.floorEventManager.getEventEffect('score');
    const finalBonus = Math.floor(bonus * scoreMultiplier);
    this.score += finalBonus;

    this.hud.updateScore(this.score);
    this.hud.updateCombo(this.currentCombo);
    this.hud.showComboBonus(finalBonus, this.currentCombo);
  }

  private resetCombo(): void {
    this.currentCombo = 0;
    this.hud.updateCombo(0);
  }

  private onPillCollect(_player: unknown, pill: unknown): void {
    const pillObj = pill as Phaser.GameObjects.GameObject;
    const pillType = pillObj.getData('type') as PillType;
    this.pillManager.collectPill(pillObj);
    this.pillCount++;

    const scoreMultiplier = this.floorEventManager.getEventEffect('score');
    this.score += Math.floor(GameConfig.pillScore * scoreMultiplier);

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
      this.noDamageFloorStreak = 0;
      this.hud.updateNoDamageFloors(0);
      return;
    }

    if (this.isChallengeMode && this.challengeConfig && !this.challengeConfig.loseOnGuardCollision) {
      return;
    }

    this.gameOver();
  }

  private gameOver(): void {
    this.isGameOver = true;

    if (this.spawnTimer) this.spawnTimer.destroy();
    if (this.pillTimer) this.pillTimer.destroy();
    if (this.scoreTimer) this.scoreTimer.destroy();
    if (this.comboCheckTimer) this.comboCheckTimer.destroy();

    this.events.off('playerDoubleJump', this.onPlayerDoubleJump, this);

    this.timeManager.pause();

    const recordFlags = this.saveGameState();

    this.audioManager.stopMusic();
    this.audioManager.play('gameover');

    this.cameras.main.fade(500, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start('GameOverScene', {
        score: this.score,
        pills: this.pillCount,
        floor: this.currentFloor,
        maxCombo: this.maxComboInGame,
        maxNoDamageFloors: this.maxNoDamageFloorsInGame,
        isNewHighScore: recordFlags.isNewHighScore,
        isNewMaxCombo: recordFlags.isNewMaxCombo,
        isNewMaxNoDamage: recordFlags.isNewMaxNoDamage,
        savedHighScore: recordFlags.savedHighScore,
        maxAddiction: recordFlags.sideEffectStats.maxAddiction,
        hallucinations: recordFlags.sideEffectStats.hallucinations,
        lossOfControl: recordFlags.sideEffectStats.lossOfControl
      });
    });
  }

  private saveGameState(): {
    isNewHighScore: boolean;
    isNewMaxCombo: boolean;
    isNewMaxNoDamage: boolean;
    savedHighScore: number;
    sideEffectStats: { maxAddiction: number; hallucinations: number; lossOfControl: number };
  } {
    const saveData = this.saveManager.getSaveData();
    const newCycles = this.timeManager.getCycleCount() - this.previousCycleCount;
    const newEvents = this.floorEventManager.getEventsTriggeredCount() - this.previousEventsTriggered;

    const sideEffectState = this.player.getSideEffectState();
    const sideEffectStats = {
      maxAddiction: sideEffectState.maxAddictionInGame,
      hallucinations: sideEffectState.hallucinationsTriggeredInGame,
      lossOfControl: sideEffectState.lossOfControlTriggeredInGame
    };

    const isNewHighScore = this.score > saveData.highScore;
    const isNewMaxCombo = this.maxComboInGame > (saveData.maxCombo || 0);
    const isNewMaxNoDamage = this.maxNoDamageFloorsInGame > (saveData.maxNoDamageFloors || 0);

    const savedHighScore = Math.max(saveData.highScore, this.score);
    const savedMaxCombo = Math.max(saveData.maxCombo || 0, this.maxComboInGame);
    const savedMaxNoDamageFloors = Math.max(saveData.maxNoDamageFloors || 0, this.maxNoDamageFloorsInGame);

    this.saveManager.saveGameData({
      highScore: savedHighScore,
      totalPills: saveData.totalPills + this.pillCount,
      gamesPlayed: saveData.gamesPlayed + 1,
      lastTimeOfDay: this.timeManager.getCurrentTimeOfDay(),
      totalDayCycles: saveData.totalDayCycles + Math.max(0, newCycles),
      eventsTriggered: saveData.eventsTriggered + Math.max(0, newEvents),
      maxCombo: savedMaxCombo,
      maxNoDamageFloors: savedMaxNoDamageFloors,
      totalCombos: (saveData.totalCombos || 0) + this.maxComboInGame,
      totalAddictionLevel: (saveData.totalAddictionLevel || 0) + sideEffectStats.maxAddiction,
      maxAddictionReached: Math.max(saveData.maxAddictionReached || 0, sideEffectStats.maxAddiction),
      totalHallucinationsTriggered: (saveData.totalHallucinationsTriggered || 0) + sideEffectStats.hallucinations,
      totalLossOfControlTriggered: (saveData.totalLossOfControlTriggered || 0) + sideEffectStats.lossOfControl
    });

    this.saveManager.savePillTrainingScore({
      pillsCollected: this.pillCount,
      totalAddictionAccumulated: sideEffectStats.maxAddiction,
      maxAddictionReached: sideEffectStats.maxAddiction,
      totalHallucinations: sideEffectStats.hallucinations,
      totalLossOfControl: sideEffectStats.lossOfControl,
      gamesPlayed: 1
    });

    const archiveManager = ArchiveManager.getInstance();
    archiveManager.checkAllArchives();

    return {
      isNewHighScore,
      isNewMaxCombo,
      isNewMaxNoDamage,
      savedHighScore,
      sideEffectStats
    };
  }

  update(_time: number, delta: number): void {
    if (this.isGameOver) return;

    if (this.isChallengeMode) {
      if (this.checkChallengeWin()) {
        this.challengeWin();
        return;
      }
      if (this.checkChallengeTimeLimit()) {
        this.gameOver();
        return;
      }
      this.updateChallengeHud();
    }

    this.player.update(this.keys, delta);

    const eventGuardSpeedMultiplier = this.floorEventManager?.getEventEffect?.('guardSpeed') || 1;
    const eventDetectionMultiplier = this.floorEventManager?.getEventEffect?.('guardDetection') || 1;

    let guardSpeedMul: number;
    let effectiveDetectionRange: number;
    if (this.isChallengeMode) {
      guardSpeedMul = this.challengeConfig?.guardSpeedMultiplier || 1;
      effectiveDetectionRange = this.challengeConfig?.guardDetectionRange || 150;
    } else {
      const timeConfig = this.timeManager.getConfig();
      guardSpeedMul = timeConfig.guardSpeedMultiplier;
      effectiveDetectionRange = Math.floor(timeConfig.guardDetectionRange * eventDetectionMultiplier);
    }

    this.guards.forEach(guard => {
      guard.setTimeMultipliers(guardSpeedMul, effectiveDetectionRange);
      guard.update(delta, this.player.guardSlowMultiplier, eventGuardSpeedMultiplier);
    });

    this.pillManager.update();

    const targetCamY = this.player.y - GameConfig.height * 0.6;
    this.cameraTargetY = Math.min(this.cameraTargetY, targetCamY);
    this.worldScrollY = this.cameraTargetY;
    this.cameras.main.scrollY = this.cameraTargetY;

    if (this.player.y > this.cameraTargetY + GameConfig.height + 100) {
      if (!this.isChallengeMode || this.challengeConfig?.loseOnFall) {
        this.gameOver();
      }
    }

    if (!this.isChallengeMode || this.challengeConfig?.enableDayNightCycle) {
      const timeConfig = this.timeManager.getConfig();
      const baseLightAlpha = timeConfig.lightOpacity;
      this.neonLights.forEach((light, index) => {
        const pulse = Math.sin(this.time.now * 0.003 + index) * 0.2 + baseLightAlpha;
        light.setAlpha(pulse * 0.6);
      });

      this.hud.updateTimeOfDay(this.timeManager.getCurrentTimeOfDay(), this.timeManager.getProgress());
    }

    if ((!this.isChallengeMode || this.challengeConfig?.enableFloorEvents) && this.floorEventManager.hasActiveEvent()) {
      this.hud.updateEventProgress(this.floorEventManager.getEventProgress());
    }

    this.hud.update();
  }

  getWorldScrollY(): number {
    return this.worldScrollY;
  }
}
