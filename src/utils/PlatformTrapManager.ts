import Phaser from 'phaser';
import { PlatformTrapType, PlatformTrapConfig, PlatformTrapState } from '../types';
import { GameConfig, PlatformTrapConfigs } from '../config/GameConfig';
import { AudioManager } from '../audio/AudioManager';

interface TrapPlatformEntry {
  sprite: Phaser.Physics.Arcade.Sprite;
  config: PlatformTrapConfig;
  state: PlatformTrapState;
  warningIndicator?: Phaser.GameObjects.Graphics;
  particles?: Phaser.GameObjects.Graphics;
  lastWarningPlayed: number;
}

export class PlatformTrapManager {
  private scene: Phaser.Scene;
  private audioManager: AudioManager;
  private trapPlatforms: Map<Phaser.Physics.Arcade.Sprite, TrapPlatformEntry> = new Map();
  private camera: Phaser.Cameras.Scene2D.Camera;

  constructor(scene: Phaser.Scene, camera: Phaser.Cameras.Scene2D.Camera) {
    this.scene = scene;
    this.camera = camera;
    this.audioManager = AudioManager.getInstance();
  }

  assignTrapToPlatform(
    platform: Phaser.Physics.Arcade.Sprite,
    floor: number,
    forceType?: PlatformTrapType
  ): boolean {
    if (floor < GameConfig.trapStartFloor) return false;
    if (!forceType && Math.random() > GameConfig.trapChancePerPlatform) return false;

    const trapType = forceType || this.getRandomTrapType();
    const baseConfig = PlatformTrapConfigs[trapType];
    const config: PlatformTrapConfig = { ...baseConfig };

    if (trapType === PlatformTrapType.MOVING) {
      config.moveRangeX = Phaser.Math.Between(40, 90);
      config.moveSpeed = Phaser.Math.FloatBetween(0.002, 0.005);
      if (Math.random() < 0.3) {
        config.moveRangeY = Phaser.Math.Between(20, 40);
      }
    }
    if (trapType === PlatformTrapType.TEMPORARY) {
      config.startPhase = Math.random() * Math.PI * 2;
      config.onDurationMs = Phaser.Math.Between(2000, 3500);
      config.offDurationMs = Phaser.Math.Between(1500, 2800);
    }

    const state: PlatformTrapState = {
      type: trapType,
      isActive: true,
      isCollapsing: false,
      collapseTimer: 0,
      originalX: platform.x,
      originalY: platform.y,
      movePhase: Math.random() * Math.PI * 2,
      moveDirection: 1,
      togglePhase: config.startPhase || 0
    };

    this.applyPlatformVisualTint(platform, trapType);

    const entry: TrapPlatformEntry = {
      sprite: platform,
      config,
      state,
      lastWarningPlayed: 0
    };

    if (trapType === PlatformTrapType.COLLAPSIBLE) {
      entry.warningIndicator = this.createWarningIndicator(platform);
    }

    this.trapPlatforms.set(platform, entry);
    platform.setData('isTrap', true);
    platform.setData('trapType', trapType);

    return true;
  }

  private getRandomTrapType(): PlatformTrapType {
    const types = [PlatformTrapType.COLLAPSIBLE, PlatformTrapType.MOVING, PlatformTrapType.TEMPORARY];
    return Phaser.Utils.Array.GetRandom(types)!;
  }

  private applyPlatformVisualTint(sprite: Phaser.Physics.Arcade.Sprite, type: PlatformTrapType): void {
    switch (type) {
      case PlatformTrapType.COLLAPSIBLE:
        sprite.setTint(0xff6644);
        break;
      case PlatformTrapType.MOVING:
        sprite.setTint(0x44aaff);
        break;
      case PlatformTrapType.TEMPORARY:
        sprite.setTint(0xffaa00);
        break;
    }
  }

  private createWarningIndicator(_platform: Phaser.Physics.Arcade.Sprite): Phaser.GameObjects.Graphics {
    const g = this.scene.add.graphics();
    g.setScrollFactor(0);
    g.setVisible(false);
    return g;
  }

  onPlayerLand(platform: Phaser.Physics.Arcade.Sprite, _player: Phaser.Physics.Arcade.Sprite): void {
    const entry = this.trapPlatforms.get(platform);
    if (!entry) return;

    this.audioManager.play('trap_land');

    if (entry.state.type === PlatformTrapType.COLLAPSIBLE && !entry.state.isCollapsing) {
      this.startCollapseSequence(entry);
    }
  }

  private startCollapseSequence(entry: TrapPlatformEntry): void {
    entry.state.isCollapsing = true;
    entry.state.collapseTimer = entry.config.collapseDelayMs || 800;
    this.audioManager.play('trap_toggle');
  }

  update(delta: number): void {
    const now = this.scene.time.now;

    this.trapPlatforms.forEach((entry) => {
      switch (entry.state.type) {
        case PlatformTrapType.COLLAPSIBLE:
          this.updateCollapsible(entry, delta, now);
          break;
        case PlatformTrapType.MOVING:
          this.updateMoving(entry, delta, now);
          break;
        case PlatformTrapType.TEMPORARY:
          this.updateTemporary(entry, delta, now);
          break;
      }
    });
  }

  private updateCollapsible(entry: TrapPlatformEntry, delta: number, now: number): void {
    const sprite = entry.sprite;

    if (entry.state.isCollapsing && entry.state.isActive) {
      entry.state.collapseTimer -= delta;

      const warningProgress = 1 - entry.state.collapseTimer / (entry.config.collapseDelayMs || 800);
      const shakeX = Math.sin(now * 0.05) * warningProgress * 3;
      const shakeY = Math.cos(now * 0.06) * warningProgress * 2;
      sprite.x = entry.state.originalX + shakeX;
      sprite.y = entry.state.originalY + shakeY;

      const flashAlpha = Math.sin(now * 0.03) * 0.5 + 0.5;
      sprite.setAlpha(0.6 + flashAlpha * warningProgress * 0.4);

      if (entry.state.collapseTimer <= 0) {
        this.collapsePlatform(entry);
      }
    }
  }

  private collapsePlatform(entry: TrapPlatformEntry): void {
    entry.state.isActive = false;
    entry.state.isCollapsing = false;

    const sprite = entry.sprite;
    const body = sprite.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.checkCollision.none = true;
      body.enable = false;
    }
    sprite.setVisible(false);
    sprite.setAlpha(0);

    this.spawnCollapseParticles(entry);
    this.audioManager.play('trap_collapse');
    this.camera.shake(150, 0.008);

    const respawnDelay = entry.config.respawnDelayMs || 4000;
    this.scene.time.delayedCall(respawnDelay, () => {
      this.respawnPlatform(entry);
    });
  }

  private spawnCollapseParticles(entry: TrapPlatformEntry): void {
    const particles = this.scene.add.graphics();
    const sprite = entry.sprite;
    const numParticles = 12;

    for (let i = 0; i < numParticles; i++) {
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const speed = Phaser.Math.FloatBetween(50, 150);
      const px = sprite.x + Phaser.Math.FloatBetween(-20, 20);
      const py = sprite.y + Phaser.Math.FloatBetween(-5, 5);
      const size = Phaser.Math.FloatBetween(3, 7);
      const color = Phaser.Utils.Array.GetRandom([0xff6644, 0xff8844, 0xffaa66, 0x884422])!;

      particles.fillStyle(color, 0.9);
      particles.fillCircle(px, py, size);

      const vx = Math.cos(angle) * speed;
      let vy = Math.sin(angle) * speed - 50;
      let x = px, y = py;
      let life = 1;

      const updateParticle = () => {
        life -= 0.03;
        if (life <= 0) {
          particles.destroy();
          return;
        }
        x += vx * 0.016;
        y += vy * 0.016;
        vy += 400 * 0.016;
        particles.clear();
        particles.fillStyle(color, life * 0.9);
        particles.fillCircle(x, y, size * life);
      };

      this.scene.time.addEvent({
        delay: 16,
        callback: updateParticle,
        loop: true,
        repeat: 35
      });
    }
  }

  private respawnPlatform(entry: TrapPlatformEntry): void {
    entry.state.isActive = true;
    entry.state.collapseTimer = 0;

    const sprite = entry.sprite;
    sprite.x = entry.state.originalX;
    sprite.y = entry.state.originalY;
    sprite.setAlpha(1);
    sprite.setVisible(true);

    const body = sprite.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.checkCollision.none = false;
      body.enable = true;
      body.reset(entry.state.originalX, entry.state.originalY);
    }

    this.scene.tweens.add({
      targets: sprite,
      scale: { from: 0.3, to: 1 },
      alpha: { from: 0, to: 1 },
      duration: 300,
      ease: 'Back.out'
    });

    this.audioManager.play('trap_respawn');
  }

  private updateMoving(entry: TrapPlatformEntry, delta: number, _now: number): void {
    const { config, state } = entry;
    const speed = (config.moveSpeed || 0.003) * delta;
    state.movePhase += speed;

    const rangeX = config.moveRangeX || 0;
    const rangeY = config.moveRangeY || 0;
    const newX = state.originalX + Math.sin(state.movePhase) * rangeX;
    const newY = state.originalY + Math.sin(state.movePhase * 0.7) * rangeY;

    const sprite = entry.sprite;
    const body = sprite.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.reset(newX, newY);
    } else {
      sprite.x = newX;
      sprite.y = newY;
    }

    if (Math.sin(state.movePhase) * Math.sin(state.movePhase - speed) < 0) {
      this.audioManager.play('trap_move');
    }
  }

  private updateTemporary(entry: TrapPlatformEntry, delta: number, now: number): void {
    const { config, state } = entry;
    state.togglePhase += delta;

    const cycleDuration = (config.onDurationMs || 2500) + (config.offDurationMs || 2000);
    const cycleTime = (state.togglePhase + (config.startPhase || 0) * 500) % cycleDuration;
    const isOnPhase = cycleTime < (config.onDurationMs || 2500);

    if (isOnPhase && !state.isActive) {
      this.activateTemporary(entry);
    } else if (!isOnPhase && state.isActive) {
      this.deactivateTemporary(entry);
    }

    if (!isOnPhase) {
      entry.sprite.setAlpha(0.15 + Math.sin(now * 0.02) * 0.1);
    } else if (state.isActive) {
      const warningTime = 500;
      const timeLeft = (config.onDurationMs || 2500) - cycleTime;
      if (timeLeft < warningTime) {
        const flash = Math.sin(now * 0.03) * 0.3 + 0.7;
        entry.sprite.setAlpha(flash);
      } else {
        entry.sprite.setAlpha(1);
      }
    }
  }

  private activateTemporary(entry: TrapPlatformEntry): void {
    entry.state.isActive = true;
    const sprite = entry.sprite;
    const body = sprite.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.checkCollision.none = false;
      body.enable = true;
    }
    sprite.setVisible(true);

    this.scene.tweens.add({
      targets: sprite,
      scale: { from: 0.2, to: 1 },
      alpha: { from: 0, to: 1 },
      duration: 200,
      ease: 'Quad.out'
    });

    this.audioManager.play('trap_respawn');
  }

  private deactivateTemporary(entry: TrapPlatformEntry): void {
    entry.state.isActive = false;
    const sprite = entry.sprite;
    const body = sprite.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.checkCollision.none = true;
      body.enable = false;
    }

    this.scene.tweens.add({
      targets: sprite,
      scale: { from: 1, to: 0.2 },
      alpha: { from: 1, to: 0.15 },
      duration: 150,
      ease: 'Quad.in'
    });

    this.audioManager.play('trap_toggle');
    this.camera.shake(80, 0.004);
  }

  isPlatformCollidable(platform: Phaser.Physics.Arcade.Sprite): boolean {
    const entry = this.trapPlatforms.get(platform);
    if (!entry) return true;
    return entry.state.isActive;
  }

  isPlatformCollapsing(platform: Phaser.Physics.Arcade.Sprite): boolean {
    const entry = this.trapPlatforms.get(platform);
    if (!entry) return false;
    return entry.state.isCollapsing;
  }

  getPlatformTrapType(platform: Phaser.Physics.Arcade.Sprite): PlatformTrapType | null {
    const entry = this.trapPlatforms.get(platform);
    if (!entry) return null;
    return entry.state.type;
  }

  getTrapPlatformsOfType(type: PlatformTrapType): Phaser.Physics.Arcade.Sprite[] {
    const result: Phaser.Physics.Arcade.Sprite[] = [];
    this.trapPlatforms.forEach((entry, sprite) => {
      if (entry.state.type === type) {
        result.push(sprite);
      }
    });
    return result;
  }

  getActivePlatformsNear(x: number, y: number, radius: number): Phaser.Physics.Arcade.Sprite[] {
    const result: Phaser.Physics.Arcade.Sprite[] = [];
    this.trapPlatforms.forEach((entry, sprite) => {
      if (!entry.state.isActive) return;
      const dist = Phaser.Math.Distance.Between(x, y, sprite.x, sprite.y);
      if (dist <= radius) {
        result.push(sprite);
      }
    });
    return result;
  }

  shouldGuardAvoid(platform: Phaser.Physics.Arcade.Sprite): boolean {
    const entry = this.trapPlatforms.get(platform);
    if (!entry) return false;
    if (!entry.state.isActive) return true;
    if (entry.state.type === PlatformTrapType.COLLAPSIBLE && entry.state.isCollapsing) return true;
    if (entry.state.type === PlatformTrapType.TEMPORARY) {
      const { config, state } = entry;
      const cycleDuration = (config.onDurationMs || 2500) + (config.offDurationMs || 2000);
      const cycleTime = (state.togglePhase + (config.startPhase || 0) * 500) % cycleDuration;
      const timeLeft = (config.onDurationMs || 2500) - cycleTime;
      return timeLeft < 800;
    }
    return false;
  }

  getPlatformVelocity(platform: Phaser.Physics.Arcade.Sprite): { vx: number; vy: number } {
    const entry = this.trapPlatforms.get(platform);
    if (!entry || entry.state.type !== PlatformTrapType.MOVING) {
      return { vx: 0, vy: 0 };
    }
    const { config, state } = entry;
    const speed = config.moveSpeed || 0.003;
    const rangeX = config.moveRangeX || 0;
    const rangeY = config.moveRangeY || 0;
    const vx = Math.cos(state.movePhase) * rangeX * speed * 60;
    const vy = Math.cos(state.movePhase * 0.7) * rangeY * speed * 60 * 0.7;
    return { vx, vy };
  }

  destroy(): void {
    this.trapPlatforms.forEach((entry) => {
      entry.warningIndicator?.destroy();
      entry.particles?.destroy();
    });
    this.trapPlatforms.clear();
  }
}
