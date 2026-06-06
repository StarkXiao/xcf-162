import Phaser from 'phaser';
import { GameConfig } from '../config/GameConfig';
import { AudioManager } from '../audio/AudioManager';
import { ClubManager } from '../utils/ClubManager';
import { ClubUpgradeType, ClubBuff } from '../types';
import { ClubUpgradeConfigs } from '../config/ClubConfig';

export class ClubScene extends Phaser.Scene {
  private audioManager!: AudioManager;
  private clubManager!: ClubManager;
  private coinsText!: Phaser.GameObjects.Text;
  private upgradeCards: Map<ClubUpgradeType, {
    levelText: Phaser.GameObjects.Text;
    costText: Phaser.GameObjects.Text;
    descText: Phaser.GameObjects.Text;
    upgradeBtn: Phaser.GameObjects.Text;
    progressBar: Phaser.GameObjects.Graphics;
  }> = new Map();
  private buffSummaryText!: Phaser.GameObjects.Text;
  private neonLights: Phaser.GameObjects.Image[] = [];

  constructor() {
    super('ClubScene');
  }

  create(): void {
    this.audioManager = AudioManager.getInstance();
    this.clubManager = ClubManager.getInstance();

    this.cameras.main.setBackgroundColor('#0a0a1a');
    this.createBackground();

    this.add.text(GameConfig.width / 2, 50, '🎵 夜店经营 🎵', {
      fontSize: '32px',
      color: '#ff0066',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(GameConfig.width / 2, 80, '用局内分数兑换升级，强化生存能力', {
      fontSize: '14px',
      color: '#888888'
    }).setOrigin(0.5);

    this.createCoinsDisplay();
    this.createUpgradeCards();
    this.createBuffSummary();
    this.createBackButton();

    this.time.addEvent({
      delay: 100,
      callback: this.animateNeonLights,
      callbackScope: this,
      loop: true
    });
  }

  private createBackground(): void {
    for (let i = 0; i < 25; i++) {
      const x = Phaser.Math.Between(0, GameConfig.width);
      const y = Phaser.Math.Between(0, GameConfig.height);
      const type = Phaser.Math.Between(0, 2);
      let lightType = 'neon-pink';
      if (type === 1) lightType = 'neon-cyan';
      if (type === 2) lightType = 'neon-pink';
      const light = this.add.image(x, y, lightType);
      light.setAlpha(Phaser.Math.FloatBetween(0.2, 0.7));
      light.setScale(Phaser.Math.FloatBetween(0.4, 1.2));
      this.neonLights.push(light);
    }

    for (let i = 0; i < 6; i++) {
      const y = i * 120 + 40;
      this.add.rectangle(0, y, GameConfig.width * 2, 2, 0xff0066, 0.08);
      this.add.rectangle(0, y + 60, GameConfig.width * 2, 1, 0x00ffff, 0.08);
    }
  }

  private animateNeonLights(): void {
    this.neonLights.forEach((light, index) => {
      const pulse = Math.sin(this.time.now * 0.004 + index * 0.5) * 0.3 + 0.5;
      light.setAlpha(pulse);
    });
  }

  private createCoinsDisplay(): void {
    const coinBg = this.add.graphics();
    coinBg.fillStyle(0x1a0a2e, 0.9);
    coinBg.fillRoundedRect(GameConfig.width / 2 - 100, 100, 200, 45, 10);
    coinBg.lineStyle(2, 0xffcc00, 0.8);
    coinBg.strokeRoundedRect(GameConfig.width / 2 - 100, 100, 200, 45, 10);

    this.add.text(GameConfig.width / 2 - 70, 122, '💰', {
      fontSize: '24px'
    }).setOrigin(0, 0.5);

    this.coinsText = this.add.text(GameConfig.width / 2 - 30, 122, this.clubManager.getClubCoins().toString(), {
      fontSize: '26px',
      color: '#ffcc00',
      fontStyle: 'bold'
    }).setOrigin(0, 0.5);

    this.add.text(GameConfig.width / 2 + 50, 122, '夜店币', {
      fontSize: '14px',
      color: '#ffcc66'
    }).setOrigin(0, 0.5);
  }

  private createUpgradeCards(): void {
    const types: ClubUpgradeType[] = [
      ClubUpgradeType.DECORATION,
      ClubUpgradeType.LIGHTING,
      ClubUpgradeType.SOUND
    ];

    const startY = 175;
    const cardHeight = 150;
    const cardGap = 15;

    types.forEach((type, index) => {
      const y = startY + index * (cardHeight + cardGap);
      this.createUpgradeCard(type, y, cardHeight);
    });
  }

  private createUpgradeCard(type: ClubUpgradeType, y: number, height: number): void {
    const config = ClubUpgradeConfigs[type];
    const currentLevel = this.clubManager.getUpgradeLevel(type);
    const nextCost = this.clubManager.getNextUpgradeCost(type);

    const cardBg = this.add.graphics();
    cardBg.fillStyle(0x1a1a2e, 0.92);
    cardBg.fillRoundedRect(20, y, GameConfig.width - 40, height, 12);
    cardBg.lineStyle(2, Phaser.Display.Color.HexStringToColor(config.color).color, 0.6);
    cardBg.strokeRoundedRect(20, y, GameConfig.width - 40, height, 12);

    this.add.text(40, y + 20, `${config.icon} ${config.name}`, {
      fontSize: '20px',
      color: config.color,
      fontStyle: 'bold'
    });

    this.add.text(40, y + 45, config.description, {
      fontSize: '12px',
      color: '#888888'
    });

    const levelText = this.add.text(GameConfig.width - 40, y + 20, `Lv.${currentLevel}/${config.maxLevel}`, {
      fontSize: '18px',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    levelText.setOrigin(1, 0);

    const progressBar = this.add.graphics();
    this.drawProgressBar(progressBar, 40, y + 70, GameConfig.width - 80, 8, currentLevel / config.maxLevel, config.color);

    let currentDesc = '尚未升级，立即解锁效果！';
    if (currentLevel > 0) {
      currentDesc = config.levels[currentLevel - 1].description;
    }
    const descText = this.add.text(40, y + 88, `当前效果: ${currentDesc}`, {
      fontSize: '12px',
      color: '#aaaaaa',
      wordWrap: { width: GameConfig.width - 180 }
    });

    let costTextContent = '已满级';
    let btnText = 'MAX';
    let btnEnabled = false;

    if (nextCost !== null) {
      costTextContent = `下一级: ${config.levels[currentLevel].description}`;
      btnText = `升级 ${nextCost}💰`;
      btnEnabled = this.clubManager.canUpgrade(type);
    }

    const costText = this.add.text(40, y + 108, costTextContent, {
      fontSize: '11px',
      color: nextCost !== null ? '#66ffaa' : '#666666',
      wordWrap: { width: GameConfig.width - 180 }
    });

    const btnColor = btnEnabled ? config.color : '#333333';
    const upgradeBtn = this.add.text(GameConfig.width - 30, y + height - 22, btnText, {
      fontSize: '15px',
      color: btnEnabled ? '#000000' : '#666666',
      backgroundColor: btnColor,
      padding: { left: 12, right: 12, top: 6, bottom: 6 },
      fontStyle: 'bold'
    }).setOrigin(1, 0.5);

    if (btnEnabled) {
      upgradeBtn.setInteractive({ useHandCursor: true });
      upgradeBtn.on('pointerover', () => {
        upgradeBtn.setAlpha(0.85);
        this.audioManager.play('hover');
      });
      upgradeBtn.on('pointerout', () => {
        upgradeBtn.setAlpha(1.0);
      });
      upgradeBtn.on('pointerdown', () => {
        this.audioManager.play('select');
        this.performUpgrade(type);
      });
    }

    this.upgradeCards.set(type, { levelText, costText, descText, upgradeBtn, progressBar });
  }

  private drawProgressBar(graphics: Phaser.GameObjects.Graphics, x: number, y: number, width: number, height: number, progress: number, colorHex: string): void {
    graphics.clear();
    graphics.fillStyle(0x0a0a1a, 1);
    graphics.fillRoundedRect(x, y, width, height, 4);
    graphics.lineStyle(1, 0x444444, 0.8);
    graphics.strokeRoundedRect(x, y, width, height, 4);

    const fillWidth = Math.max(0, Math.min(progress, 1)) * (width - 2);
    if (fillWidth > 0) {
      graphics.fillStyle(Phaser.Display.Color.HexStringToColor(colorHex).color, 1);
      graphics.fillRoundedRect(x + 1, y + 1, fillWidth, height - 2, 3);
    }
  }

  private createBuffSummary(): void {
    const buff = this.clubManager.getCurrentBuff();
    const summaryY = 175 + 3 * (150 + 15) + 5;

    const summaryBg = this.add.graphics();
    summaryBg.fillStyle(0x0a0a1a, 0.9);
    summaryBg.fillRoundedRect(20, summaryY, GameConfig.width - 40, 85, 10);
    summaryBg.lineStyle(2, 0x00ffff, 0.4);
    summaryBg.strokeRoundedRect(20, summaryY, GameConfig.width - 40, 85, 10);

    this.add.text(GameConfig.width / 2, summaryY + 15, '🎯 当前增益效果', {
      fontSize: '15px',
      color: '#00ffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.buffSummaryText = this.add.text(GameConfig.width / 2, summaryY + 35, this.formatBuffSummary(buff), {
      fontSize: '12px',
      color: '#cccccc',
      align: 'center'
    }).setOrigin(0.5, 0);
  }

  private formatBuffSummary(buff: ClubBuff): string {
    const parts: string[] = [];
    if (buff.scoreMultiplier > 1.0) {
      parts.push(`得分 x${buff.scoreMultiplier.toFixed(2)}`);
    }
    if (buff.pillSpawnMultiplier > 1.0) {
      parts.push(`药片 x${buff.pillSpawnMultiplier.toFixed(2)}`);
    }
    if (buff.baseTimeBonus > 0) {
      parts.push(`时间 +${(buff.baseTimeBonus / 1000).toFixed(0)}秒`);
    }
    if (buff.comboTimeoutBonus > 0) {
      parts.push(`连击 +${(buff.comboTimeoutBonus / 1000).toFixed(1)}秒`);
    }
    if (buff.guardSpeedReduction > 0) {
      parts.push(`保安 -${(buff.guardSpeedReduction * 100).toFixed(0)}%速度`);
    }
    if (parts.length === 0) {
      return '暂无增益，快去升级吧！';
    }
    return parts.join('    ');
  }

  private createBackButton(): void {
    const backBtn = this.add.text(GameConfig.width / 2, GameConfig.height - 30, '← 返回主菜单', {
      fontSize: '18px',
      color: '#888888',
      backgroundColor: '#222222',
      padding: { left: 30, right: 30, top: 8, bottom: 8 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    backBtn.on('pointerover', () => {
      backBtn.setBackgroundColor('#333333');
      backBtn.setColor('#ffffff');
      this.audioManager.play('hover');
    });

    backBtn.on('pointerout', () => {
      backBtn.setBackgroundColor('#222222');
      backBtn.setColor('#888888');
    });

    backBtn.on('pointerdown', () => {
      this.audioManager.play('select');
      this.scene.start('MenuScene');
    });
  }

  private performUpgrade(type: ClubUpgradeType): void {
    const success = this.clubManager.upgrade(type);
    if (success) {
      this.refreshUI();
      this.cameras.main.flash(200, 255, 255, 255);
      const config = ClubUpgradeConfigs[type];
      const level = this.clubManager.getUpgradeLevel(type);
      this.add.text(
        GameConfig.width / 2,
        GameConfig.height / 2,
        `${config.icon} ${config.name} 升级到 Lv.${level}！`,
        {
          fontSize: '24px',
          color: config.color,
          fontStyle: 'bold',
          backgroundColor: '#000000',
          padding: { left: 20, right: 20, top: 10, bottom: 10 }
        }
      ).setOrigin(0.5).setDepth(100);

      this.time.delayedCall(1200, () => {
        this.children.each(child => {
          if (child instanceof Phaser.GameObjects.Text && child.depth === 100) {
            this.tweens.add({
              targets: child,
              alpha: 0,
              duration: 300,
              onComplete: () => child.destroy()
            });
          }
        });
      });
    }
  }

  private refreshUI(): void {
    this.coinsText.setText(this.clubManager.getClubCoins().toString());

    this.upgradeCards.forEach((card, type) => {
      const config = ClubUpgradeConfigs[type];
      const currentLevel = this.clubManager.getUpgradeLevel(type);
      const nextCost = this.clubManager.getNextUpgradeCost(type);

      card.levelText.setText(`Lv.${currentLevel}/${config.maxLevel}`);
      this.drawProgressBar(card.progressBar, 40, 0, 0, 0, currentLevel / config.maxLevel, config.color);

      if (currentLevel > 0) {
        card.descText.setText(`当前效果: ${config.levels[currentLevel - 1].description}`);
      } else {
        card.descText.setText('当前效果: 尚未升级，立即解锁效果！');
      }

      if (nextCost !== null) {
        card.costText.setText(`下一级: ${config.levels[currentLevel].description}`);
        card.costText.setColor('#66ffaa');
        card.upgradeBtn.setText(`升级 ${nextCost}💰`);
        const canUpgrade = this.clubManager.canUpgrade(type);
        if (canUpgrade) {
          card.upgradeBtn.setBackgroundColor(config.color);
          card.upgradeBtn.setColor('#000000');
          if (!card.upgradeBtn.input) {
            card.upgradeBtn.setInteractive({ useHandCursor: true });
            card.upgradeBtn.on('pointerover', () => {
              card.upgradeBtn.setAlpha(0.85);
              this.audioManager.play('hover');
            });
            card.upgradeBtn.on('pointerout', () => {
              card.upgradeBtn.setAlpha(1.0);
            });
            card.upgradeBtn.on('pointerdown', () => {
              this.audioManager.play('select');
              this.performUpgrade(type);
            });
          }
        } else {
          card.upgradeBtn.setBackgroundColor('#333333');
          card.upgradeBtn.setColor('#666666');
          card.upgradeBtn.removeInteractive();
        }
      } else {
        card.costText.setText('已满级');
        card.costText.setColor('#666666');
        card.upgradeBtn.setText('MAX');
        card.upgradeBtn.setBackgroundColor('#333333');
        card.upgradeBtn.setColor('#666666');
        card.upgradeBtn.removeInteractive();
      }
    });

    this.buffSummaryText.setText(this.formatBuffSummary(this.clubManager.getCurrentBuff()));

    this.time.delayedCall(10, () => {
      this.upgradeCards.forEach((cardData, type) => {
        const config = ClubUpgradeConfigs[type];
        const currentLevel = this.clubManager.getUpgradeLevel(type);
        if (cardData) {
          const cardIndex = [ClubUpgradeType.DECORATION, ClubUpgradeType.LIGHTING, ClubUpgradeType.SOUND].indexOf(type);
          const startY = 175;
          const cardHeight = 150;
          const cardGap = 15;
          const y = startY + cardIndex * (cardHeight + cardGap);
          this.drawProgressBar(cardData.progressBar, 40, y + 70, GameConfig.width - 80, 8, currentLevel / config.maxLevel, config.color);
        }
      });
    });
  }
}
