import Phaser from 'phaser';
import { GameConfig } from '../config/GameConfig';
import { AudioManager } from '../audio/AudioManager';

export class BootScene extends Phaser.Scene {
  private audioManager!: AudioManager;

  constructor() {
    super('BootScene');
  }

  preload(): void {
    this.audioManager = AudioManager.getInstance();
    this.audioManager.generateSounds(this);
    this.createGraphics();
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#0a0a1a');
    this.add.text(GameConfig.width / 2, GameConfig.height / 2 - 50, '失控夜店', {
      fontSize: '48px',
      color: '#ff0066',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(GameConfig.width / 2, GameConfig.height / 2 + 20, '电梯井生存', {
      fontSize: '24px',
      color: '#00ffff'
    }).setOrigin(0.5);

    const loadingBar = this.add.graphics();
    loadingBar.fillStyle(0x333333);
    loadingBar.fillRect(GameConfig.width / 2 - 100, GameConfig.height / 2 + 80, 200, 20);

    const progressBar = this.add.graphics();
    let progress = 0;

    this.time.addEvent({
      delay: 30,
      callback: () => {
        progress += 2;
        progressBar.clear();
        progressBar.fillStyle(0xff0066);
        progressBar.fillRect(GameConfig.width / 2 - 100, GameConfig.height / 2 + 80, progress * 2, 20);

        if (progress >= 100) {
          this.scene.start('MenuScene');
        }
      },
      repeat: 50
    });
  }

  private createGraphics(): void {
    const playerGraphics = this.make.graphics();
    playerGraphics.fillStyle(0xff0066);
    playerGraphics.fillRect(0, 0, GameConfig.playerWidth, GameConfig.playerHeight);
    playerGraphics.fillStyle(0xffffff);
    playerGraphics.fillRect(4, 8, 8, 8);
    playerGraphics.fillRect(20, 8, 8, 8);
    playerGraphics.fillStyle(0x000000);
    playerGraphics.fillRect(6, 10, 4, 4);
    playerGraphics.fillRect(22, 10, 4, 4);
    playerGraphics.fillStyle(0xffcc00);
    playerGraphics.fillRect(8, 30, 16, 4);
    playerGraphics.generateTexture('player', GameConfig.playerWidth, GameConfig.playerHeight);
    playerGraphics.destroy();

    const guardGraphics = this.make.graphics();
    guardGraphics.fillStyle(0x1a1a2e);
    guardGraphics.fillRect(0, 0, GameConfig.playerWidth, GameConfig.playerHeight);
    guardGraphics.fillStyle(0x2d3436);
    guardGraphics.fillRect(0, 0, GameConfig.playerWidth, 16);
    guardGraphics.fillStyle(0xffcc00);
    guardGraphics.fillRect(8, 4, 16, 6);
    guardGraphics.fillStyle(0xffffff);
    guardGraphics.fillRect(4, 20, 8, 6);
    guardGraphics.fillRect(20, 20, 8, 6);
    guardGraphics.fillStyle(0xff0000);
    guardGraphics.fillRect(6, 22, 4, 2);
    guardGraphics.fillRect(22, 22, 4, 2);
    guardGraphics.generateTexture('guard', GameConfig.playerWidth, GameConfig.playerHeight);
    guardGraphics.destroy();

    const platformGraphics = this.make.graphics();
    platformGraphics.fillStyle(0x2d3436);
    platformGraphics.fillRect(0, 0, GameConfig.platformWidth, GameConfig.platformHeight);
    platformGraphics.fillStyle(0x636e72);
    platformGraphics.fillRect(0, 0, GameConfig.platformWidth, 3);
    platformGraphics.fillStyle(0x1a1a2e);
    platformGraphics.fillRect(0, GameConfig.platformHeight - 3, GameConfig.platformWidth, 3);
    for (let i = 0; i < GameConfig.platformWidth; i += 20) {
      platformGraphics.fillStyle(0x74b9ff, 0.3);
      platformGraphics.fillRect(i, 5, 2, 5);
    }
    platformGraphics.generateTexture('platform', GameConfig.platformWidth, GameConfig.platformHeight);
    platformGraphics.destroy();

    const elevatorWall = this.make.graphics();
    elevatorWall.fillStyle(0x1a1a2e);
    elevatorWall.fillRect(0, 0, 40, GameConfig.height);
    elevatorWall.fillStyle(0x2d3436);
    elevatorWall.fillRect(0, 0, 40, GameConfig.height);
    for (let i = 0; i < GameConfig.height; i += 30) {
      elevatorWall.fillStyle(0x636e72, 0.5);
      elevatorWall.fillRect(0, i, 40, 2);
    }
    elevatorWall.generateTexture('wall', 40, GameConfig.height);
    elevatorWall.destroy();

    const neonLight = this.make.graphics();
    neonLight.fillStyle(0xff0066);
    neonLight.fillRect(0, 0, 20, 4);
    neonLight.generateTexture('neon-pink', 20, 4);
    neonLight.destroy();

    const neonLight2 = this.make.graphics();
    neonLight2.fillStyle(0x00ffff);
    neonLight2.fillRect(0, 0, 20, 4);
    neonLight2.generateTexture('neon-cyan', 20, 4);
    neonLight2.destroy();
  }
}
