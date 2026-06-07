import Phaser from 'phaser';
import { GameConfig, GuardChaseStateConfig } from '../config/GameConfig';
import { BossConfig, StoryConfig } from '../config/StoryConfig';
import { Player } from '../characters/Player';
import { PlatformTrapManager } from '../utils/PlatformTrapManager';

export class BossGuard extends Phaser.Physics.Arcade.Sprite {
  private targetPlayer: Player;
  private bossConfig: BossConfig;
  private currentHp: number;
  private maxHp: number;
  private isInvulnerable: boolean = false;
  private invulnerabilityTimer: number = 0;
  private flashTimer: number = 0;
  private isFlashing: boolean = false;
  private baseSpeed: number = GameConfig.guardSpeed;
  private patrolDirection: number = 1;
  private lastSeenX: number = 0;
  private lastSeenY: number = 0;
  private jumpCooldown: number = 0;
  private platformTrapManager: PlatformTrapManager | null = null;
  private currentStandingPlatform: Phaser.Physics.Arcade.Sprite | null = null;
  private specialAbilityCooldown: number = 0;
  private bossHpBar!: Phaser.GameObjects.Graphics;
  private bossHpBarBg!: Phaser.GameObjects.Graphics;
  private bossNameText!: Phaser.GameObjects.Text;
  private bossIconText!: Phaser.GameObjects.Text;
  private onBossDefeatedCallback: (() => void) | null = null;
  private onBossHitCallback: ((hp: number, maxHp: number) => void) | null = null;
  private summonGuardsCallback: (() => void) | null = null;
  private triggerHallucinationCallback: (() => void) | null = null;
  private isRushing: boolean = false;
  private rushTimer: number = 0;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    player: Player,
    bossConfig: BossConfig
  ) {
    super(scene, x, y, 'guard');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.targetPlayer = player;
    this.bossConfig = bossConfig;
    this.currentHp = bossConfig.hp;
    this.maxHp = bossConfig.hp;
    this.lastSeenX = x;
    this.lastSeenY = y;

    this.setCollideWorldBounds(false);
    this.setBounce(0);
    this.setFriction(0.3, 0);
    this.setTint(bossConfig.color);
    this.setScale(1.4);

    this.createBossUI();
  }

  setCallbacks(
    onDefeated: () => void,
    onHit: (hp: number, maxHp: number) => void,
    onSummonGuards?: () => void,
    onTriggerHallucination?: () => void
  ): void {
    this.onBossDefeatedCallback = onDefeated;
    this.onBossHitCallback = onHit;
    this.summonGuardsCallback = onSummonGuards || null;
    this.triggerHallucinationCallback = onTriggerHallucination || null;
  }

  setPlatformTrapManager(manager: PlatformTrapManager): void {
    this.platformTrapManager = manager;
  }

  private createBossUI(): void {
    const barWidth = 300;
    const barHeight = 18;
    const barX = (GameConfig.width - barWidth) / 2;
    const barY = 60;

    this.bossHpBarBg = this.scene.add.graphics();
    this.bossHpBarBg.setScrollFactor(0);
    this.bossHpBarBg.setDepth(150);
    this.bossHpBarBg.fillStyle(0x220000, 0.9);
    this.bossHpBarBg.fillRoundedRect(barX - 4, barY - 4, barWidth + 8, barHeight + 8, 6);
    this.bossHpBarBg.lineStyle(2, this.bossConfig.color, 1);
    this.bossHpBarBg.strokeRoundedRect(barX - 4, barY - 4, barWidth + 8, barHeight + 8, 6);

    this.bossHpBar = this.scene.add.graphics();
    this.bossHpBar.setScrollFactor(0);
    this.bossHpBar.setDepth(151);

    this.bossIconText = this.scene.add.text(barX - 30, barY + barHeight / 2, this.bossConfig.icon, {
      fontSize: '20px'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(152);

    this.bossNameText = this.scene.add.text(GameConfig.width / 2, barY - 14, this.bossConfig.name, {
      fontSize: '14px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(152);

    this.updateHpBar();
  }

  private updateHpBar(): void {
    if (!this.bossHpBar) return;
    const barWidth = 300;
    const barHeight = 18;
    const barX = (GameConfig.width - barWidth) / 2;
    const barY = 60;
    const hpPercent = Math.max(0, this.currentHp / this.maxHp);

    this.bossHpBar.clear();
    this.bossHpBar.fillStyle(this.bossConfig.color, 1);
    this.bossHpBar.fillRoundedRect(barX, barY, barWidth * hpPercent, barHeight, 4);

    if (this.bossNameText) {
      this.bossNameText.setText(`${this.bossConfig.name}  ${this.currentHp}/${this.maxHp}`);
    }
  }

  getHp(): number {
    return this.currentHp;
  }

  getMaxHp(): number {
    return this.maxHp;
  }

  hit(): boolean {
    if (this.isInvulnerable) return false;

    this.currentHp--;
    this.isInvulnerable = true;
    this.invulnerabilityTimer = StoryConfig.bossInvulnerabilityMs;
    this.isFlashing = true;
    this.flashTimer = StoryConfig.bossHitFlashMs;

    this.scene.cameras.main.shake(200, 0.01);

    this.updateHpBar();
    this.onBossHitCallback?.(this.currentHp, this.maxHp);

    if (this.currentHp <= 0) {
      this.defeated();
      return true;
    }
    return false;
  }

  private defeated(): void {
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scaleX: 2,
      scaleY: 0.1,
      duration: 800,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        this.destroy();
        this.onBossDefeatedCallback?.();
      }
    });

    if (this.bossHpBar) this.bossHpBar.destroy();
    if (this.bossHpBarBg) this.bossHpBarBg.destroy();
    if (this.bossNameText) this.bossNameText.destroy();
    if (this.bossIconText) this.bossIconText.destroy();
  }

  update(delta: number, slowMultiplier: number, eventSpeedMultiplier: number = 1): void {
    if (this.currentHp <= 0) return;

    if (this.isInvulnerable) {
      this.invulnerabilityTimer -= delta;
      if (this.invulnerabilityTimer <= 0) {
        this.isInvulnerable = false;
      }
    }

    if (this.isFlashing) {
      this.flashTimer -= delta;
      if (this.flashTimer <= 0) {
        this.isFlashing = false;
        this.clearTint();
        this.setTint(this.bossConfig.color);
      } else {
        if (Math.floor(this.flashTimer / 50) % 2 === 0) {
          this.clearTint();
        } else {
          this.setTint(this.bossConfig.color);
        }
      }
    }

    if (this.isRushing) {
      this.rushTimer -= delta;
      if (this.rushTimer <= 0) {
        this.isRushing = false;
      }
    }

    if (this.specialAbilityCooldown > 0) {
      this.specialAbilityCooldown -= delta;
    } else {
      this.tryUseSpecialAbility();
    }

    if (this.jumpCooldown > 0) {
      this.jumpCooldown -= delta;
    }

    const stateConfig = GuardChaseStateConfig[this.bossConfig.chaseState];
    let speedMult = this.bossConfig.speedMultiplier * stateConfig.speedMultiplier;
    if (this.isRushing) speedMult *= 2;

    const effectiveSpeed = this.baseSpeed * slowMultiplier * eventSpeedMultiplier * speedMult;
    const effectiveDetectionRange = this.bossConfig.detectionRange * stateConfig.detectionRangeMultiplier;
    const distance = Phaser.Math.Distance.Between(this.x, this.y, this.targetPlayer.x, this.targetPlayer.y);

    this.checkCurrentPlatformDanger();

    if (distance < effectiveDetectionRange) {
      this.lastSeenX = this.targetPlayer.x;
      this.lastSeenY = this.targetPlayer.y;
    }

    const needsEvacuate = this.shouldEvacuateCurrentPlatform();

    if (needsEvacuate) {
      this.evacuatePlatform(effectiveSpeed);
    } else if (stateConfig.jumpChaseEnabled) {
      this.jumpChasePlayer(effectiveSpeed);
    } else if (stateConfig.surroundEnabled) {
      this.surroundPlayer(effectiveSpeed);
    } else {
      this.chasePlayer(effectiveSpeed);
    }

    this.applyMovingPlatformCarry();
    this.updateFacing();
  }

  private tryUseSpecialAbility(): void {
    if (!this.bossConfig.specialAbility) return;

    const distance = Phaser.Math.Distance.Between(this.x, this.y, this.targetPlayer.x, this.targetPlayer.y);
    if (distance > 300) return;

    const ability = this.bossConfig.specialAbility;

    if (ability.includes('冲撞') || ability.includes('速度')) {
      this.isRushing = true;
      this.rushTimer = 2000;
      this.specialAbilityCooldown = 8000;
    } else if (ability.includes('召唤')) {
      this.summonGuardsCallback?.();
      this.specialAbilityCooldown = 10000;
    } else if (ability.includes('迷魂') || ability.includes('幻觉')) {
      this.triggerHallucinationCallback?.();
      this.specialAbilityCooldown = 12000;
    }
  }

  private checkCurrentPlatformDanger(): void {
    if (!this.platformTrapManager || !this.body?.blocked.down) {
      this.currentStandingPlatform = null;
      return;
    }
    const checkY = this.y + this.height / 2 + 5;
    const nearby = this.platformTrapManager.getActivePlatformsNear(this.x, checkY, 80);
    this.currentStandingPlatform = nearby.length > 0 ? nearby[0] : null;
  }

  private shouldEvacuateCurrentPlatform(): boolean {
    if (!this.platformTrapManager || !this.currentStandingPlatform) return false;
    return this.platformTrapManager.shouldGuardAvoid(this.currentStandingPlatform);
  }

  private evacuatePlatform(speed: number): void {
    const platform = this.currentStandingPlatform;
    if (!platform) {
      this.patrol(speed);
      return;
    }
    const toLeft = this.x > platform.x;
    const dir = toLeft ? -1 : 1;
    this.setVelocityX(dir * speed * 1.3);
    const distToEdge = Math.abs(this.x - platform.x);
    if (this.body?.blocked.down && distToEdge < 40 && this.jumpCooldown <= 0) {
      this.setVelocityY(GameConfig.playerJumpForce * 0.9);
      this.jumpCooldown = 400;
    }
  }

  private applyMovingPlatformCarry(): void {
    if (!this.platformTrapManager || !this.currentStandingPlatform || !this.body?.blocked.down) return;
    const vel = this.platformTrapManager.getPlatformVelocity(this.currentStandingPlatform);
    if (vel.vx !== 0 || vel.vy !== 0) {
      this.x += vel.vx * 0.016;
      this.y += vel.vy * 0.016;
    }
  }

  private chasePlayer(speed: number): void {
    const dx = this.lastSeenX - this.x;
    if (Math.abs(dx) > 10) {
      this.setVelocityX(Math.sign(dx) * speed);
    } else {
      this.setVelocityX(0);
    }
    if (this.body!.blocked.down && this.lastSeenY < this.y - 50) {
      this.setVelocityY(GameConfig.playerJumpForce * 0.85);
    }
  }

  private surroundPlayer(speed: number): void {
    const dx = this.lastSeenX - this.x;
    const dy = this.lastSeenY - this.y;
    if (Math.abs(dx) > 80) {
      this.setVelocityX(Math.sign(dx) * speed);
    } else {
      this.setVelocityX(this.patrolDirection * speed * 0.8);
      if (Phaser.Math.Between(0, 100) === 0) {
        this.patrolDirection *= -1;
      }
    }
    if (this.x < 60) this.patrolDirection = 1;
    else if (this.x > GameConfig.width - 60) this.patrolDirection = -1;
    if (this.body!.blocked.down && dy < -30) {
      this.setVelocityY(GameConfig.playerJumpForce * 0.9);
    }
  }

  private jumpChasePlayer(speed: number): void {
    const dx = this.lastSeenX - this.x;
    const dy = this.lastSeenY - this.y;
    if (Math.abs(dx) > 15) {
      this.setVelocityX(Math.sign(dx) * speed);
    } else {
      this.setVelocityX(0);
    }
    if (this.body!.blocked.down && this.jumpCooldown <= 0) {
      const shouldJump = dy < -20 || Phaser.Math.Between(0, 60) === 0;
      if (shouldJump) {
        const jumpForce = dy < -100 ? GameConfig.playerJumpForce * 1.05 : GameConfig.playerJumpForce * 0.95;
        this.setVelocityY(jumpForce);
        this.jumpCooldown = 500;
      }
    }
  }

  private patrol(speed: number): void {
    this.setVelocityX(this.patrolDirection * speed);
    if (this.x < 60) this.patrolDirection = 1;
    else if (this.x > GameConfig.width - 60) this.patrolDirection = -1;
    if (Phaser.Math.Between(0, 150) === 0) this.patrolDirection *= -1;
  }

  private updateFacing(): void {
    if (this.body!.velocity.x > 5) {
      this.setFlipX(false);
    } else if (this.body!.velocity.x < -5) {
      this.setFlipX(true);
    }
  }

  destroy(fromScene?: boolean): void {
    if (this.bossHpBar) this.bossHpBar.destroy();
    if (this.bossHpBarBg) this.bossHpBarBg.destroy();
    if (this.bossNameText) this.bossNameText.destroy();
    if (this.bossIconText) this.bossIconText.destroy();
    super.destroy(fromScene);
  }
}
