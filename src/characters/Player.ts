import Phaser from 'phaser';
import { GameConfig, PillType, PillEffects } from '../config/GameConfig';

export class Player extends Phaser.Physics.Arcade.Sprite {
  private isGrounded: boolean = false;
  private jumpCount: number = 0;
  private maxJumps: number = 2;
  private canDoubleJump: boolean = true;
  public speedMultiplier: number = 1;
  public guardSlowMultiplier: number = 1;
  public hasShield: boolean = false;
  private shieldEffect!: Phaser.GameObjects.Graphics;
  private speedTimer!: Phaser.Time.TimerEvent | null;
  private slowTimer!: Phaser.Time.TimerEvent | null;
  private shieldTimer!: Phaser.Time.TimerEvent | null;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'player');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(false);
    this.setBounce(0.1);
    this.setFriction(0.5, 0);

    this.createShieldEffect();

    scene.physics.world.on('worldbounds', () => {
      this.isGrounded = true;
    });
  }

  private createShieldEffect(): void {
    this.shieldEffect = this.scene.add.graphics();
    this.shieldEffect.setVisible(false);
  }

  update(keys: { left: Phaser.Input.Keyboard.Key; right: Phaser.Input.Keyboard.Key; jump: Phaser.Input.Keyboard.Key }, _delta: number): void {
    const speed = GameConfig.playerSpeed * this.speedMultiplier;

    if (keys.left.isDown) {
      this.setVelocityX(-speed);
      this.setFlipX(true);
    } else if (keys.right.isDown) {
      this.setVelocityX(speed);
      this.setFlipX(false);
    } else {
      this.setVelocityX(0);
    }

    if (Phaser.Input.Keyboard.JustDown(keys.jump)) {
      this.tryJump();
    }

    this.isGrounded = this.body!.blocked.down || this.body!.touching.down;
    if (this.isGrounded) {
      this.jumpCount = 0;
      this.canDoubleJump = true;
    }

    this.updateShieldPosition();
    this.clampPosition();
  }

  private tryJump(): void {
    if (this.isGrounded) {
      this.jump();
      this.jumpCount = 1;
    } else if (this.canDoubleJump && this.jumpCount < this.maxJumps) {
      this.jump();
      this.jumpCount++;
      this.canDoubleJump = false;
      this.playDoubleJumpEffect();
    }
  }

  private jump(): void {
    this.setVelocityY(GameConfig.playerJumpForce);
    this.isGrounded = false;
    this.scene.tweens.add({
      targets: this,
      scaleY: { from: 1, to: 1.2 },
      duration: 100,
      yoyo: true
    });
  }

  private playDoubleJumpEffect(): void {
    const particles = this.scene.add.graphics();
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const x = this.x + Math.cos(angle) * 20;
      const y = this.y + Math.sin(angle) * 20;
      particles.fillStyle(0x00ffff, 0.8);
      particles.fillCircle(x, y, 4);
    }
    this.scene.tweens.add({
      targets: particles,
      alpha: 0,
      scale: 2,
      duration: 300,
      onComplete: () => particles.destroy()
    });
  }

  private updateShieldPosition(): void {
    if (this.hasShield) {
      this.shieldEffect.clear();
      this.shieldEffect.setVisible(true);
      this.shieldEffect.lineStyle(3, 0xff00ff, 0.8);
      this.shieldEffect.strokeCircle(this.x, this.y, 35);
      const pulse = Math.sin(this.scene.time.now * 0.01) * 0.3 + 0.7;
      this.shieldEffect.strokeCircle(this.x, this.y, 35 * pulse);
    } else {
      this.shieldEffect.setVisible(false);
    }
  }

  private clampPosition(): void {
    if (this.x < 50) {
      this.x = 50;
      this.setVelocityX(0);
    }
    if (this.x > GameConfig.width - 50) {
      this.x = GameConfig.width - 50;
      this.setVelocityX(0);
    }
  }

  applyPillEffect(type: PillType): void {
    const effect = PillEffects[type];

    switch (type) {
      case PillType.SPEED:
        this.speedMultiplier = effect.value;
        if (this.speedTimer) this.speedTimer.destroy();
        this.speedTimer = this.scene.time.delayedCall(effect.duration, () => {
          this.speedMultiplier = 1;
        });
        break;

      case PillType.SLOW:
        this.guardSlowMultiplier = effect.value;
        if (this.slowTimer) this.slowTimer.destroy();
        this.slowTimer = this.scene.time.delayedCall(effect.duration, () => {
          this.guardSlowMultiplier = 1;
        });
        break;

      case PillType.SHIELD:
        this.hasShield = true;
        if (this.shieldTimer) this.shieldTimer.destroy();
        this.shieldTimer = this.scene.time.delayedCall(effect.duration, () => {
          this.hasShield = false;
        });
        break;

      case PillType.SCORE:
        break;
    }
  }

  destroy(fromScene?: boolean): void {
    if (this.speedTimer) this.speedTimer.destroy();
    if (this.slowTimer) this.slowTimer.destroy();
    if (this.shieldTimer) this.shieldTimer.destroy();
    this.shieldEffect.destroy();
    super.destroy(fromScene);
  }
}
