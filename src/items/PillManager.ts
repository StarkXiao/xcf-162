import Phaser from 'phaser';
import { PillType, PillColors, PillEffects } from '../config/GameConfig';
import { Player } from '../characters/Player';

export class PillManager {
  private scene: Phaser.Scene;
  private pills: Phaser.Physics.Arcade.Group;
  private maxPills: number = 8;
  private pillWeights: Record<string, number> = {
    speed: 1,
    slow: 1,
    score: 1,
    shield: 1
  };

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.pills = this.scene.physics.add.group({
      allowGravity: false,
      immovable: true
    });
  }

  setPillWeights(weights: Record<string, number>): void {
    this.pillWeights = { ...weights };
  }

  getRandomPillType(rareMultiplier: number = 1): PillType {
    const weights = { ...this.pillWeights };

    if (rareMultiplier !== 1) {
      weights.shield = (weights.shield || 1) * rareMultiplier;
    }

    const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
    let random = Math.random() * totalWeight;

    for (const [type, weight] of Object.entries(weights)) {
      random -= weight;
      if (random <= 0) {
        return type as PillType;
      }
    }

    return PillType.SPEED;
  }

  spawnPill(x: number, y: number, type: PillType): void {
    if (this.pills.getLength() >= this.maxPills) return;

    const pill = this.pills.create(x, y, undefined) as Phaser.Physics.Arcade.Sprite;
    pill.setData('type', type);
    pill.setData('spawnTime', this.scene.time.now);

    const color = PillColors[type];
    const graphics = this.scene.make.graphics();
    graphics.fillStyle(color);
    graphics.fillCircle(12, 12, 12);
    graphics.fillStyle(0xffffff, 0.6);
    graphics.fillCircle(8, 8, 4);
    graphics.generateTexture(`pill-${type}`, 24, 24);
    graphics.destroy();

    pill.setTexture(`pill-${type}`);
    pill.setCircle(12);
    pill.setSize(24, 24);
    pill.setDisplaySize(24, 24);

    this.scene.tweens.add({
      targets: pill,
      y: y - 10,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  collectPill(pill: Phaser.GameObjects.GameObject): void {
    const pillSprite = pill as Phaser.Physics.Arcade.Sprite;
    const type = pill.getData('type') as PillType;
    const effect = PillEffects[type];

    const player = this.scene.children.list.find(c => c instanceof Player) as Player;
    if (player) {
      player.applyPillEffect(type);

      if (type === PillType.SCORE) {
        const gameScene = this.scene.scene.get('GameScene');
        const events = gameScene.events;
        events.emit('scoreBonus', effect.value);
      }
    }

    const particles = this.scene.add.graphics();
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const x = pillSprite.x + Math.cos(angle) * 15;
      const y = pillSprite.y + Math.sin(angle) * 15;
      particles.fillStyle(PillColors[type], 1);
      particles.fillCircle(x, y, 5);
    }

    this.scene.tweens.add({
      targets: particles,
      alpha: 0,
      scale: 1.5,
      duration: 250,
      onComplete: () => particles.destroy()
    });

    this.scene.tweens.add({
      targets: pillSprite,
      scale: 1.5,
      alpha: 0,
      duration: 200,
      onComplete: () => {
        this.pills.remove(pillSprite, true, true);
      }
    });
  }

  update(): void {
    this.pills.getChildren().forEach(pill => {
      const sprite = pill as Phaser.Physics.Arcade.Sprite;
      const spawnTime = sprite.getData('spawnTime') as number;
      const lifeTime = 10000;

      if (this.scene.time.now - spawnTime > lifeTime) {
        this.scene.tweens.add({
          targets: sprite,
          alpha: 0,
          scale: 0.5,
          duration: 300,
          onComplete: () => {
            this.pills.remove(sprite, true, true);
          }
        });
      }

      const pulse = Math.sin(this.scene.time.now * 0.005) * 0.2 + 1;
      sprite.setScale(pulse);
    });
  }

  getPills(): Phaser.Physics.Arcade.Group {
    return this.pills;
  }
}

