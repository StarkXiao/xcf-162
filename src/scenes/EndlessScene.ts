import Phaser from 'phaser';
import { GameConfig, PillType, PillEffects, GuardChaseState, GuardChaseStateConfig } from '../config/GameConfig';
import { Player } from '../characters/Player';
import { Guard } from '../enemies/Guard';
import { PillManager } from '../items/PillManager';
import { EndlessHUD } from '../ui/EndlessHUD';
import { AudioManager } from '../audio/AudioManager';
import { SaveManager } from '../utils/SaveManager';
import { PlatformTrapManager } from '../utils/PlatformTrapManager';
import { ArchiveManager } from '../utils/ArchiveManager';
import { AchievementManager } from '../utils/AchievementManager';

export class EndlessScene extends Phaser.Scene {
  private player!: Player;
  private guards: Guard[] = [];
  private pillManager!: PillManager;
  private platforms: Phaser.Physics.Arcade.StaticGroup[] = [];
  private currentFloor: number = 0;
  private rawScore: number = 0;
  private pillCount: number = 0;
  private worldScrollY: number = 0;
  private cameraTargetY: number = 0;
  private spawnTimer!: Phaser.Time.TimerEvent;
  private pillTimer!: Phaser.Time.TimerEvent;
  private scoreTimer!: Phaser.Time.TimerEvent;
  private timerEvent!: Phaser.Time.TimerEvent;
  private neonLights: Phaser.GameObjects.Image[] = [];
  private hud!: EndlessHUD;
  private audioManager!: AudioManager;
  private saveManager!: SaveManager;
  private achievementManager!: AchievementManager;
  private isGameOver: boolean = false;
  private keys!: { left: Phaser.Input.Keyboard.Key; right: Phaser.Input.Keyboard.Key; jump: Phaser.Input.Keyboard.Key };
  private currentCombo: number = 0;
  private maxComboInGame: number = 0;
  private lastComboTime: number = 0;
  private comboCheckTimer!: Phaser.Time.TimerEvent;
  private currentMultiplier: number = 1.0;
  private timeRemaining: number = 0;
  private totalTime: number = 0;
  private highestPlatformFloor: number = 0;
  private survivalStartTime: number = 0;
  private currentChaseState: GuardChaseState = GuardChaseState.PATROL;
  private chaseStateCheckTimer!: Phaser.Time.TimerEvent;
  private platformTrapManager!: PlatformTrapManager;

  constructor() {
    super('EndlessScene');
  }

  create(): void {
    this.audioManager = AudioManager.getInstance();
    this.saveManager = SaveManager.getInstance();
    this.achievementManager = AchievementManager.getInstance();
    this.achievementManager.resetInGameStats();
    this.isGameOver = false;
    this.rawScore = 0;
    this.pillCount = 0;
    this.currentFloor = 0;
    this.worldScrollY = 0;
    this.cameraTargetY = 0;
    this.guards = [];
    this.currentCombo = 0;
    this.maxComboInGame = 0;
    this.lastComboTime = 0;
    this.currentMultiplier = 1.0;
    this.totalTime = GameConfig.endlessBaseTime;
    this.timeRemaining = GameConfig.endlessBaseTime;
    this.highestPlatformFloor = 0;
    this.survivalStartTime = this.time.now;
    this.currentChaseState = GuardChaseState.PATROL;

    this.cameras.main.setBackgroundColor('#1a0a2e');
    this.createBackground();

    this.keys = {
      left: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
      right: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
      jump: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
    };

    this.createInitialPlatforms();

    const startPlatform = this.platforms[0];
    const firstPlatform = startPlatform.getChildren()[0] as Phaser.Physics.Arcade.Sprite;
    const startX = firstPlatform.body!.position.x + GameConfig.platformWidth / 2;
    const startY = firstPlatform.body!.position.y - GameConfig.playerHeight;

    this.player = new Player(this, startX, startY);
    this.pillManager = new PillManager(this);
    this.platformTrapManager = new PlatformTrapManager(this, this.cameras.main);

    this.hud = new EndlessHUD(this);
    this.hud.updateScore(this.getFinalScore());
    this.hud.updateFloor(this.currentFloor);
    this.hud.updatePills(this.pillCount);
    this.hud.updateCombo(0);
    this.hud.updateMultiplier(this.currentMultiplier);
    this.hud.updateTimer(this.timeRemaining, this.totalTime);

    this.events.on('playerDoubleJump', this.onPlayerDoubleJump, this);

    this.setupCollisions();
    this.setupTimers();

    this.audioManager.playMusic();
  }

  private getFinalScore(): number {
    return Math.floor(this.rawScore * this.currentMultiplier);
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

  private createInitialPlatforms(): void {
    const initialFloors = 50;
    for (let floor = 0; floor < initialFloors; floor++) {
      this.createFloorPlatforms(floor);
    }
    this.highestPlatformFloor = initialFloors - 1;
  }

  private createFloorPlatforms(floor: number): void {
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
      const platform = platformGroup.create(x + (GameConfig.platformWidth * scale) / 2, y, 'platform') as Phaser.Physics.Arcade.Sprite;
      platform.setDisplaySize(GameConfig.platformWidth * scale, GameConfig.platformHeight);
      platform.refreshBody();
      platform.setData('floor', floor);

      this.platformTrapManager?.assignTrapToPlatform(platform, floor);
    }

    this.platforms.push(platformGroup);

    if (this.player) {
      this.physics.add.collider(
        this.player,
        platformGroup,
        this.onPlayerLand,
        (_player, platform) => {
          const platSprite = platform as Phaser.Physics.Arcade.Sprite;
          return this.platformTrapManager?.isPlatformCollidable(platSprite) ?? true;
        },
        this
      );
      this.guards.forEach(guard => {
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
    }
  }

  private ensurePlatformsAhead(): void {
    const targetFloor = this.currentFloor + 60;
    while (this.highestPlatformFloor < targetFloor && this.highestPlatformFloor < GameConfig.endlessMaxFloors) {
      this.highestPlatformFloor++;
      this.createFloorPlatforms(this.highestPlatformFloor);
    }
  }

  private setupCollisions(): void {
    this.platforms.forEach(platformGroup => {
      this.physics.add.collider(
        this.player,
        platformGroup,
        this.onPlayerLand,
        (_player, platform) => {
          const platSprite = platform as Phaser.Physics.Arcade.Sprite;
          return this.platformTrapManager?.isPlatformCollidable(platSprite) ?? true;
        },
        this
      );
    });

    this.physics.add.overlap(this.player, this.pillManager.getPills(), this.onPillCollect, undefined, this);
  }

  private setupTimers(): void {
    this.resetSpawnTimer();
    this.resetPillTimer();

    this.scoreTimer = this.time.addEvent({
      delay: 1000,
      callback: () => {
        this.rawScore += GameConfig.endlessBaseScoreRate;
        this.hud.updateScore(this.getFinalScore());
      },
      callbackScope: this,
      loop: true
    });

    this.timerEvent = this.time.addEvent({
      delay: 100,
      callback: () => {
        if (this.isGameOver) return;
        this.timeRemaining -= 100;
        this.hud.updateTimer(this.timeRemaining, this.totalTime);
        if (this.timeRemaining <= 0) {
          this.gameOver();
        }
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

    this.chaseStateCheckTimer = this.time.addEvent({
      delay: 500,
      callback: this.checkChaseStateUpgrade,
      callbackScope: this,
      loop: true
    });
  }

  private checkChaseStateUpgrade(): void {
    if (this.isGameOver) return;

    const survivalTime = this.time.now - this.survivalStartTime;
    let newState = GuardChaseState.PATROL;

    for (const unlock of GameConfig.guardChaseUnlockTime) {
      if (survivalTime >= unlock.timeMs) {
        newState = unlock.state;
      }
    }

    if (newState !== this.currentChaseState) {
      this.currentChaseState = newState;
      this.applyChaseStateToAllGuards();
      this.hud.updateChaseState(newState);

      if (newState === GuardChaseState.SURROUND) {
        this.audioManager.play('alert_surround');
      } else if (newState === GuardChaseState.JUMP_CHASE) {
        this.audioManager.play('alert_jump');
      }

      this.resetSpawnTimer();
    }
  }

  private applyChaseStateToAllGuards(): void {
    this.guards.forEach(guard => {
      guard.setChaseState(this.currentChaseState);
    });
  }

  getCurrentChaseState(): GuardChaseState {
    return this.currentChaseState;
  }

  private getDifficultyConfig(): { guardSpawnMul: number; guardSpeedMul: number; pillSpawnMul: number } {
    const ramp = GameConfig.endlessDifficultyRamp;
    let result = ramp[0];
    for (const config of ramp) {
      if (this.currentFloor + 1 >= config.floor) {
        result = config;
      }
    }
    const chaseConfig = GuardChaseStateConfig[this.currentChaseState];
    return {
      guardSpawnMul: result.guardSpawnMul * chaseConfig.spawnMultiplier,
      guardSpeedMul: result.guardSpeedMul,
      pillSpawnMul: result.pillSpawnMul
    };
  }

  private updateMultiplier(): void {
    const multipliers = GameConfig.endlessFloorMultipliers;
    let newMultiplier = 1.0;
    for (const mul of multipliers) {
      if (this.currentFloor + 1 >= mul.floor) {
        newMultiplier = mul.multiplier;
      }
    }
    if (newMultiplier !== this.currentMultiplier) {
      this.currentMultiplier = newMultiplier;
      this.hud.updateMultiplier(this.currentMultiplier);
      this.hud.updateScore(this.getFinalScore());
    }
  }

  private resetSpawnTimer(): void {
    if (this.spawnTimer) {
      this.spawnTimer.destroy();
    }

    const diffConfig = this.getDifficultyConfig();
    const delay = GameConfig.guardSpawnInterval / diffConfig.guardSpawnMul;

    this.spawnTimer = this.time.addEvent({
      delay: delay,
      callback: this.spawnGuard,
      callbackScope: this,
      loop: true,
      startAt: 2000
    });
  }

  private resetPillTimer(): void {
    if (this.pillTimer) {
      this.pillTimer.destroy();
    }

    const diffConfig = this.getDifficultyConfig();
    const delay = GameConfig.pillSpawnInterval / diffConfig.pillSpawnMul;

    this.pillTimer = this.time.addEvent({
      delay: delay,
      callback: this.spawnPill,
      callbackScope: this,
      loop: true
    });
  }

  private spawnGuard(): void {
    if (this.isGameOver) return;

    const diffConfig = this.getDifficultyConfig();
    const spawnY = this.cameraTargetY - 100;
    const spawnX = Phaser.Math.Between(60, GameConfig.width - 60);
    const guard = new Guard(
      this,
      spawnX,
      spawnY,
      this.player,
      diffConfig.guardSpeedMul,
      Math.floor(150 * diffConfig.guardSpeedMul)
    );
    guard.setChaseState(this.currentChaseState);
    guard.setPlatformTrapManager(this.platformTrapManager);
    this.guards.push(guard);

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

    const type = this.pillManager.getRandomPillType(1.0);
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
      const floorsGained = floor - this.currentFloor;
      this.currentFloor = floor;
      this.hud.updateFloor(this.currentFloor);

      const timeBonus = floorsGained * GameConfig.endlessTimeBonusPerFloor;
      this.timeRemaining += timeBonus;
      this.totalTime += timeBonus;
      this.hud.showTimeBonus(timeBonus);

      this.updateMultiplier();

      const baseBonus = 100 * floorsGained;
      this.rawScore += baseBonus;
      this.hud.updateScore(this.getFinalScore());

      this.ensurePlatformsAhead();
      this.resetSpawnTimer();
      this.resetPillTimer();

      this.audioManager.play('jump');

      this.achievementManager.updateInGameStat('floor', this.currentFloor, true);
      this.achievementManager.updateInGameStat('score', this.getFinalScore(), true);
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

    const baseBonus = GameConfig.comboBaseScore + (this.currentCombo - 1) * GameConfig.comboMultiplierPerCombo;
    const finalBonus = Math.floor(baseBonus * this.currentMultiplier);
    this.rawScore += baseBonus;

    this.hud.updateScore(this.getFinalScore());
    this.hud.updateCombo(this.currentCombo);
    this.hud.showComboBonus(finalBonus, this.currentCombo);

    this.achievementManager.addInGameStat('doubleJumps', 1);
    this.achievementManager.updateInGameStat('maxCombo', this.maxComboInGame, true);
    this.achievementManager.updateInGameStat('score', this.getFinalScore(), true);
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

    let pillScore = GameConfig.pillScore;
    if (pillType === PillType.SCORE) {
      pillScore += PillEffects[PillType.SCORE].value;
    }
    this.rawScore += pillScore;

    this.hud.updatePills(this.pillCount);
    this.hud.updateScore(this.getFinalScore());
    this.hud.showEffect(pillType);
    this.audioManager.play('pill');

    this.achievementManager.updateInGameStat('pills', this.pillCount, true);
    this.achievementManager.updateInGameStat('score', this.getFinalScore(), true);
  }

  private onGuardCollision(): void {
    if (this.isGameOver) return;

    this.achievementManager.addInGameStat('guardHits', 1);

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
    if (this.isGameOver) return;
    this.isGameOver = true;

    if (this.spawnTimer) this.spawnTimer.destroy();
    if (this.pillTimer) this.pillTimer.destroy();
    if (this.scoreTimer) this.scoreTimer.destroy();
    if (this.timerEvent) this.timerEvent.destroy();
    if (this.comboCheckTimer) this.comboCheckTimer.destroy();
    if (this.chaseStateCheckTimer) this.chaseStateCheckTimer.destroy();

    this.events.off('playerDoubleJump', this.onPlayerDoubleJump, this);

    const finalScore = this.getFinalScore();

    const sideEffectState = this.player.getSideEffectState();
    const sideEffectStats = {
      maxAddiction: sideEffectState.maxAddictionInGame,
      hallucinations: sideEffectState.hallucinationsTriggeredInGame,
      lossOfControl: sideEffectState.lossOfControlTriggeredInGame
    };

    this.saveManager.addAddictionStats(
      sideEffectStats.maxAddiction,
      sideEffectStats.hallucinations,
      sideEffectStats.lossOfControl
    );

    this.saveManager.savePillTrainingScore({
      pillsCollected: this.pillCount,
      totalAddictionAccumulated: sideEffectStats.maxAddiction,
      maxAddictionReached: sideEffectStats.maxAddiction,
      totalHallucinations: sideEffectStats.hallucinations,
      totalLossOfControl: sideEffectStats.lossOfControl,
      gamesPlayed: 1
    });

    const saveResult = this.saveManager.addEndlessScore({
      score: finalScore,
      floor: this.currentFloor,
      pills: this.pillCount,
      maxCombo: this.maxComboInGame,
      multiplier: this.currentMultiplier,
      timeRemaining: Math.max(0, this.timeRemaining),
      date: new Date().toISOString(),
      maxAddiction: sideEffectStats.maxAddiction,
      hallucinations: sideEffectStats.hallucinations,
      lossOfControl: sideEffectStats.lossOfControl
    });

    this.achievementManager.updateInGameStat('score', finalScore, true);
    this.achievementManager.updateInGameStat('floor', this.currentFloor, true);
    this.achievementManager.updateInGameStat('pills', this.pillCount, true);
    this.achievementManager.updateInGameStat('maxCombo', this.maxComboInGame, true);
    this.achievementManager.updateInGameStat('maxAddiction', sideEffectStats.maxAddiction, true);
    this.achievementManager.updateInGameStat('hallucinations', sideEffectStats.hallucinations, true);
    this.achievementManager.updateInGameStat('lossOfControl', sideEffectStats.lossOfControl, true);

    const achData = this.achievementManager.getAchievementData();
    const noGuardHits = achData.inGameStats.guardHits === 0;
    this.achievementManager.onGameEnd(noGuardHits);

    const archiveManager = ArchiveManager.getInstance();
    archiveManager.checkAllArchives();

    this.audioManager.stopMusic();
    this.audioManager.play('gameover');

    this.cameras.main.fade(500, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start('EndlessGameOverScene', {
        rawScore: this.rawScore,
        finalScore: finalScore,
        pills: this.pillCount,
        floor: this.currentFloor,
        maxCombo: this.maxComboInGame,
        multiplier: this.currentMultiplier,
        timeRemaining: Math.max(0, this.timeRemaining),
        isNewRecord: saveResult.isNewRecord,
        rank: saveResult.rank,
        leaderboard: saveResult.leaderboard,
        maxAddiction: sideEffectStats.maxAddiction,
        hallucinations: sideEffectStats.hallucinations,
        lossOfControl: sideEffectStats.lossOfControl
      });
    });
  }

  getWorldScrollY(): number {
    return this.worldScrollY;
  }

  update(_time: number, delta: number): void {
    if (this.isGameOver) return;

    this.player.update(this.keys, delta);

    this.platformTrapManager?.update(delta);

    const diffConfig = this.getDifficultyConfig();

    this.guards.forEach(guard => {
      guard.setTimeMultipliers(diffConfig.guardSpeedMul, Math.floor(150 * diffConfig.guardSpeedMul));
      guard.update(delta, this.player.guardSlowMultiplier, 1.0);
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
      light.setAlpha(pulse * 0.6);
    });

    this.hud.update();
  }
}
