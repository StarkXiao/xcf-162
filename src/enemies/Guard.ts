import Phaser from 'phaser';
import { GameConfig } from '../config/GameConfig';
import { Player } from '../characters/Player';

export class Guard extends Phaser.Physics.Arcade.Sprite {
  private targetPlayer: Player;
  private baseSpeed: number = GameConfig.guardSpeed;
  private isAlerted: boolean = false;
  private alertIcon!: Phaser.GameObjects.Text;
  private patrolDirection: number = 1;
  private lastSeenX: number = 0;
  private lastSeenY: number = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, player: Player) {
    super(scene, x, y, 'guard');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.targetPlayer = player;
    this.lastSeenX = x;
    this.lastSeenY = y;

    this.setCollideWorldBounds(false);
    this.setBounce(0);
    this.setFriction(0.3, 0);

    this.createAlertIcon();

    this.patrolDirection = Phaser.Math.Between(0, 1) === 0 ? -1 : 1;
  }

  private createAlertIcon(): void {
    this.alertIcon = this.scene.add.text(0, 0, '!', {
      fontSize: '24px',
      color: '#ff0000',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.alertIcon.setVisible(false);
  }

  update(_delta: number, slowMultiplier: number): void {
    const speed = this.baseSpeed * slowMultiplier;
    const distance = Phaser.Math.Distance.Between(this.x, this.y, this.targetPlayer.x, this.targetPlayer.y);
    const detectionRange = 150;

    if (distance < detectionRange) {
      this.isAlerted = true;
      this.lastSeenX = this.targetPlayer.x;
      this.lastSeenY = this.targetPlayer.y;
      this.alertIcon.setVisible(true);
      this.alertIcon.setText('!!');
    } else if (this.isAlerted) {
      const timeSinceSeen = this.scene.time.now - (this.getData('lastSeenTime') || 0);
      if (timeSinceSeen > 3000) {
        this.isAlerted = false;
        this.alertIcon.setText('?');
        this.scene.time.delayedCall(1000, () => {
          if (!this.isAlerted) this.alertIcon.setVisible(false);
        });
      }
    }

    if (this.isAlerted) {
      this.setData('lastSeenTime', this.scene.time.now);
      this.chasePlayer(speed);
    } else {
      this.patrol(speed * 0.6);
    }

    this.updateAlertPosition();
    this.updateFacing();

    if (this.y > this.targetPlayer.y + GameConfig.height + 200) {
      this.destroy();
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
      this.setVelocityY(GameConfig.playerJumpForce * 0.8);
    }
  }

  private patrol(speed: number): void {
    this.setVelocityX(this.patrolDirection * speed);

    if (this.x < 60) {
      this.patrolDirection = 1;
    } else if (this.x > GameConfig.width - 60) {
      this.patrolDirection = -1;
    }

    if (Phaser.Math.Between(0, 200) === 0) {
      this.patrolDirection *= -1;
    }
  }

  private updateAlertPosition(): void {
    if (this.alertIcon.visible) {
      this.alertIcon.setPosition(this.x, this.y - 40);
      const pulse = Math.sin(this.scene.time.now * 0.02) * 0.3 + 1;
      this.alertIcon.setScale(pulse);
    }
  }

  private updateFacing(): void {
    if (this.body!.velocity.x > 5) {
      this.setFlipX(false);
    } else if (this.body!.velocity.x < -5) {
      this.setFlipX(true);
    }
  }

  destroy(fromScene?: boolean): void {
    this.alertIcon.destroy();
    super.destroy(fromScene);
  }
}
