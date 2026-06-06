import Phaser from 'phaser';
import { GameConfig } from '../config/GameConfig';
import { SaveManager } from '../utils/SaveManager';
import { ArchiveManager } from '../utils/ArchiveManager';
import { AudioManager } from '../audio/AudioManager';
import { ArchiveConfig } from '../config/ArchiveConfig';
import { ArchiveCategory, CharacterProfile, NightclubRumor, HiddenFloorRecord } from '../types';

export class ArchiveScene extends Phaser.Scene {
  private saveManager!: SaveManager;
  private archiveManager!: ArchiveManager;
  private audioManager!: AudioManager;

  private currentCategory: ArchiveCategory = ArchiveCategory.CHARACTER;
  private selectedItemId: string | null = null;
  private selectedItemIndex: number = -1;

  private tabButtons: { bg: Phaser.GameObjects.Rectangle; label: Phaser.GameObjects.Text }[] = [];
  private listContainer!: Phaser.GameObjects.Container;
  private detailContainer!: Phaser.GameObjects.Container;
  private listMask!: Phaser.GameObjects.Graphics;
  private scrollBarBg!: Phaser.GameObjects.Graphics;
  private scrollBar!: Phaser.GameObjects.Graphics;

  private listScrollY: number = 0;
  private listMaxScrollY: number = 0;
  private isDraggingList: boolean = false;
  private dragStartY: number = 0;
  private dragStartScrollY: number = 0;

  private readonly TAB_Y = 95;
  private readonly LIST_START_Y = 140;
  private readonly LIST_HEIGHT = 480;
  private readonly ITEM_HEIGHT = 65;

  constructor() {
    super('ArchiveScene');
  }

  create(): void {
    this.saveManager = SaveManager.getInstance();
    this.archiveManager = ArchiveManager.getInstance();
    this.audioManager = AudioManager.getInstance();

    this.cameras.main.setBackgroundColor('#0a0a1a');
    this.createHeader();
    this.createCategoryTabs();
    this.createListArea();
    this.createDetailArea();
    this.createBackButton();
    this.createNewUnlockNotification();
    this.refreshList();
  }

  private createHeader(): void {
    this.add.rectangle(GameConfig.width / 2, 45, GameConfig.width, 90, 0x15152a).setDepth(1);

    this.add.text(GameConfig.width / 2, 30, '剧情档案室', {
      fontSize: '26px',
      color: '#ff0066',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(2);

    const progress = this.archiveManager.getArchiveProgress();
    const total = this.archiveManager.getTotalArchiveCount();
    const totalUnlocked = progress.characters + progress.rumors + progress.floors;
    const totalCount = total.characters + total.rumors + total.floors;

    this.add.text(GameConfig.width / 2, 65, `解锁进度: ${totalUnlocked} / ${totalCount}`, {
      fontSize: '14px',
      color: '#00ffff'
    }).setOrigin(0.5).setDepth(2);

    const barWidth = 200;
    const barHeight = 4;
    const barX = GameConfig.width / 2 - barWidth / 2;
    const barY = 80;

    const bgBar = this.add.graphics();
    bgBar.fillStyle(0x333344, 1);
    bgBar.fillRect(barX, barY, barWidth, barHeight);
    bgBar.setDepth(2);

    if (totalCount > 0) {
      const fillWidth = (totalUnlocked / totalCount) * barWidth;
      const fillBar = this.add.graphics();
      fillBar.fillStyle(0xff0066, 1);
      fillBar.fillRect(barX, barY, fillWidth, barHeight);
      fillBar.setDepth(2);
    }
  }

  private createCategoryTabs(): void {
    const tabs = [
      { category: ArchiveCategory.CHARACTER, label: '人物档案', icon: '👥' },
      { category: ArchiveCategory.RUMOR, label: '夜店传闻', icon: '💬' },
      { category: ArchiveCategory.HIDDEN_FLOOR, label: '隐藏楼层', icon: '🏢' }
    ];

    const tabWidth = 150;
    const tabGap = 6;
    const totalWidth = tabs.length * tabWidth + (tabs.length - 1) * tabGap;
    const startX = GameConfig.width / 2 - totalWidth / 2 + tabWidth / 2;

    tabs.forEach((tab, index) => {
      const x = startX + index * (tabWidth + tabGap);
      const y = this.TAB_Y;

      const bg = this.add.rectangle(x, y, tabWidth, 38, 0x222244)
        .setInteractive({ useHandCursor: true })
        .setDepth(5);

      this.add.text(x - tabWidth / 2 + 15, y, tab.icon, {
        fontSize: '16px'
      }).setOrigin(0, 0.5).setDepth(6);

      const labelText = this.add.text(x + 5, y, tab.label, {
        fontSize: '14px',
        color: '#aaaaaa',
        fontStyle: 'bold'
      }).setOrigin(0, 0.5).setDepth(6);

      bg.on('pointerover', () => {
        if (this.currentCategory !== tab.category) {
          bg.setFillStyle(0x333366);
        }
      });

      bg.on('pointerout', () => {
        if (this.currentCategory !== tab.category) {
          bg.setFillStyle(0x222244);
        }
      });

      bg.on('pointerdown', () => {
        if (this.currentCategory !== tab.category) {
          this.audioManager.play('select');
          this.currentCategory = tab.category;
          this.selectedItemId = null;
          this.selectedItemIndex = -1;
          this.listScrollY = 0;
          this.updateTabStyles();
          this.refreshList();
          this.refreshDetail();
        }
      });

      this.tabButtons.push({ bg, label: labelText });
    });

    this.updateTabStyles();
  }

  private updateTabStyles(): void {
    const categories = [ArchiveCategory.CHARACTER, ArchiveCategory.RUMOR, ArchiveCategory.HIDDEN_FLOOR];
    this.tabButtons.forEach((btn, i) => {
      const isActive = categories[i] === this.currentCategory;
      btn.bg.setFillStyle(isActive ? 0xff0066 : 0x222244);
      btn.label.setColor(isActive ? '#ffffff' : '#aaaaaa');
    });
  }

  private createListArea(): void {
    this.listContainer = this.add.container(0, 0);
    this.listContainer.setDepth(3);

    const listBg = this.add.graphics();
    listBg.fillStyle(0x12122a, 1);
    listBg.fillRect(15, this.LIST_START_Y, GameConfig.width - 30, this.LIST_HEIGHT);
    listBg.lineStyle(1, 0x333355, 0.8);
    listBg.strokeRect(15, this.LIST_START_Y, GameConfig.width - 30, this.LIST_HEIGHT);
    listBg.setDepth(2);

    this.listMask = this.add.graphics();
    this.listMask.fillStyle(0xffffff, 1);
    this.listMask.fillRect(15, this.LIST_START_Y, GameConfig.width - 30, this.LIST_HEIGHT);
    this.listMask.setDepth(2);
    this.listContainer.setMask(new Phaser.Display.Masks.GeometryMask(this, this.listMask));

    this.scrollBarBg = this.add.graphics();
    this.scrollBarBg.setDepth(8);

    this.scrollBar = this.add.graphics();
    this.scrollBar.setDepth(9);

    const listArea = this.add.zone(15, this.LIST_START_Y, GameConfig.width - 30, this.LIST_HEIGHT);
    listArea.setOrigin(0, 0);
    listArea.setInteractive();
    listArea.setDepth(10);

    listArea.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.isDraggingList = true;
      this.dragStartY = pointer.y;
      this.dragStartScrollY = this.listScrollY;
    });

    listArea.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.isDraggingList) {
        const delta = this.dragStartY - pointer.y;
        this.listScrollY = Phaser.Math.Clamp(
          this.dragStartScrollY + delta,
          0,
          this.listMaxScrollY
        );
        this.updateListPositions();
      }
    });

    listArea.on('pointerup', () => {
      this.isDraggingList = false;
    });

    listArea.on('pointerupoutside', () => {
      this.isDraggingList = false;
    });
  }

  private createDetailArea(): void {
    this.detailContainer = this.add.container(0, 0);
    this.detailContainer.setDepth(4);
    this.refreshDetail();
  }

  private getCurrentItems(): (CharacterProfile | NightclubRumor | HiddenFloorRecord)[] {
    switch (this.currentCategory) {
      case ArchiveCategory.CHARACTER:
        return ArchiveConfig.CharacterProfiles;
      case ArchiveCategory.RUMOR:
        return ArchiveConfig.NightclubRumors;
      case ArchiveCategory.HIDDEN_FLOOR:
        return ArchiveConfig.HiddenFloorRecords;
      default:
        return [];
    }
  }

  private isItemUnlocked(item: CharacterProfile | NightclubRumor | HiddenFloorRecord): boolean {
    switch (this.currentCategory) {
      case ArchiveCategory.CHARACTER:
        return this.saveManager.isCharacterUnlocked(item.id);
      case ArchiveCategory.RUMOR:
        return this.saveManager.isRumorUnlocked(item.id);
      case ArchiveCategory.HIDDEN_FLOOR:
        return this.saveManager.isHiddenFloorUnlocked(item.id);
      default:
        return false;
    }
  }

  private refreshList(): void {
    this.listContainer.removeAll(true);

    const items = this.getCurrentItems();
    const totalHeight = items.length * this.ITEM_HEIGHT;
    this.listMaxScrollY = Math.max(0, totalHeight - this.LIST_HEIGHT);
    this.listScrollY = Math.min(this.listScrollY, this.listMaxScrollY);

    items.forEach((item, index) => {
      const isUnlocked = this.isItemUnlocked(item);
      const isSelected = this.selectedItemIndex === index;
      const baseY = this.LIST_START_Y + 10 + index * this.ITEM_HEIGHT;
      const adjustedY = baseY - this.listScrollY;

      const itemBg = this.add.rectangle(
        GameConfig.width / 2,
        adjustedY + this.ITEM_HEIGHT / 2 - 5,
        GameConfig.width - 50,
        this.ITEM_HEIGHT - 10,
        isSelected ? 0x332244 : (isUnlocked ? 0x1a1a3a : 0x181828)
      ).setOrigin(0.5).setInteractive({ useHandCursor: true });

      if (isSelected) {
        itemBg.setStrokeStyle(2, 0xff0066);
      } else if (isUnlocked) {
        itemBg.setStrokeStyle(1, 0x333366);
      } else {
        itemBg.setStrokeStyle(1, 0x222233);
      }

      let iconStr = '🔒';
      let titleStr = '??? 未解锁';
      let subtitleStr = '';
      let titleColor = '#555566';

      if (this.currentCategory === ArchiveCategory.CHARACTER) {
        const char = item as CharacterProfile;
        if (isUnlocked) {
          iconStr = char.icon;
          titleStr = char.name;
          subtitleStr = char.title;
          titleColor = char.rarity === 'legendary' ? '#ffcc00' : char.rarity === 'rare' ? '#00ffff' : '#ffffff';
        } else {
          subtitleStr = char.unlockedHint;
        }
      } else if (this.currentCategory === ArchiveCategory.RUMOR) {
        const rumor = item as NightclubRumor;
        if (isUnlocked) {
          iconStr = '📜';
          titleStr = rumor.title;
          subtitleStr = `来源: ${rumor.source}`;
          titleColor = '#ff99cc';
        } else {
          subtitleStr = rumor.unlockedHint;
        }
      } else if (this.currentCategory === ArchiveCategory.HIDDEN_FLOOR) {
        const floor = item as HiddenFloorRecord;
        if (isUnlocked) {
          iconStr = floor.icon;
          titleStr = floor.floorName;
          subtitleStr = floor.phenomenon.substring(0, 20) + (floor.phenomenon.length > 20 ? '...' : '');
          titleColor = '#66ffcc';
        } else {
          subtitleStr = floor.unlockedHint;
        }
      }

      const icon = this.add.text(35, adjustedY + 15, iconStr, {
        fontSize: isUnlocked ? '22px' : '20px'
      }).setOrigin(0, 0);

      const title = this.add.text(70, adjustedY + 12, titleStr, {
        fontSize: '16px',
        color: titleColor,
        fontStyle: isUnlocked ? 'bold' : 'normal'
      }).setOrigin(0, 0);

      const subtitle = this.add.text(70, adjustedY + 36, subtitleStr, {
        fontSize: '12px',
        color: isUnlocked ? '#888899' : '#555566'
      }).setOrigin(0, 0);

      itemBg.on('pointerover', () => {
        if (!isSelected) {
          itemBg.setFillStyle(isUnlocked ? 0x252550 : 0x202030);
        }
        this.audioManager.play('hover');
      });

      itemBg.on('pointerout', () => {
        if (!isSelected) {
          itemBg.setFillStyle(isUnlocked ? 0x1a1a3a : 0x181828);
        }
      });

      itemBg.on('pointerdown', () => {
        this.audioManager.play('select');
        this.selectedItemId = item.id;
        this.selectedItemIndex = index;
        this.refreshList();
        this.refreshDetail();
      });

      this.listContainer.add([itemBg, icon, title, subtitle]);
    });

    this.updateScrollIndicator();
  }

  private updateListPositions(): void {
    const items = this.getCurrentItems();
    const children = this.listContainer.getAll();
    const itemsPerEntry = 4;

    children.forEach((child, i) => {
      const gameObj = child as Phaser.GameObjects.Sprite | Phaser.GameObjects.Text | Phaser.GameObjects.Rectangle;
      const itemIndex = Math.floor(i / itemsPerEntry);
      if (itemIndex >= items.length) return;

      const baseY = this.LIST_START_Y + 10 + itemIndex * this.ITEM_HEIGHT;
      const adjustedY = baseY - this.listScrollY;
      const inItemIndex = i % itemsPerEntry;

      if (inItemIndex === 0) {
        (gameObj as Phaser.GameObjects.Rectangle).y = adjustedY + this.ITEM_HEIGHT / 2 - 5;
      } else if (inItemIndex === 1) {
        (gameObj as Phaser.GameObjects.Text).y = adjustedY + 15;
      } else if (inItemIndex === 2) {
        (gameObj as Phaser.GameObjects.Text).y = adjustedY + 12;
      } else if (inItemIndex === 3) {
        (gameObj as Phaser.GameObjects.Text).y = adjustedY + 36;
      }
    });

    this.updateScrollIndicator();
  }

  private updateScrollIndicator(): void {
    const barX = GameConfig.width - 22;
    const barY = this.LIST_START_Y;
    const barWidth = 4;
    const barHeight = this.LIST_HEIGHT;

    this.scrollBarBg.clear();
    this.scrollBarBg.fillStyle(0x222244, 0.6);
    this.scrollBarBg.fillRect(barX, barY, barWidth, barHeight);

    this.scrollBar.clear();
    if (this.listMaxScrollY > 0) {
      const visibleRatio = this.LIST_HEIGHT / (this.LIST_HEIGHT + this.listMaxScrollY);
      const thumbHeight = Math.max(30, barHeight * visibleRatio);
      const thumbY = barY + (this.listScrollY / this.listMaxScrollY) * (barHeight - thumbHeight);
      this.scrollBar.fillStyle(0xff0066, 0.8);
      this.scrollBar.fillRect(barX, thumbY, barWidth, thumbHeight);
    } else {
      this.scrollBar.fillStyle(0xff0066, 0.8);
      this.scrollBar.fillRect(barX, barY, barWidth, barHeight);
    }
  }

  private refreshDetail(): void {
    this.detailContainer.removeAll(true);

    const detailX = 25;
    const detailY = this.LIST_START_Y + 20;
    const detailWidth = GameConfig.width - 50;

    if (this.selectedItemId === null || this.selectedItemIndex < 0) {
      const hint = this.add.text(
        GameConfig.width / 2,
        this.LIST_START_Y + this.LIST_HEIGHT / 2,
        this.selectedItemId === null ? '← 选择左侧条目查看详情' : '该条目尚未解锁',
        {
          fontSize: '16px',
          color: '#555577'
        }
      ).setOrigin(0.5);
      this.detailContainer.add(hint);
      return;
    }

    const items = this.getCurrentItems();
    const item = items[this.selectedItemIndex];
    const isUnlocked = this.isItemUnlocked(item);

    if (!isUnlocked) {
      const lock1 = this.add.text(
        GameConfig.width / 2,
        this.LIST_START_Y + this.LIST_HEIGHT / 2 - 20,
        '🔒 未解锁',
        {
          fontSize: '28px',
          color: '#666688',
          fontStyle: 'bold'
        }
      ).setOrigin(0.5);
      this.detailContainer.add(lock1);

      const hint2 = this.add.text(
        GameConfig.width / 2,
        this.LIST_START_Y + this.LIST_HEIGHT / 2 + 20,
        item.unlockedHint,
        {
          fontSize: '14px',
          color: '#888899'
        }
      ).setOrigin(0.5);
      this.detailContainer.add(hint2);
      return;
    }

    let currentY = detailY;

    if (this.currentCategory === ArchiveCategory.CHARACTER) {
      const char = item as CharacterProfile;

      const iconBg = this.add.graphics();
      iconBg.fillStyle(char.rarity === 'legendary' ? 0x332200 : char.rarity === 'rare' ? 0x002233 : 0x1a1a2a, 1);
      iconBg.fillRoundedRect(detailX, currentY, detailWidth, 70, 8);
      iconBg.lineStyle(2, char.rarity === 'legendary' ? 0xffcc00 : char.rarity === 'rare' ? 0x00ffff : 0x444466, 0.8);
      iconBg.strokeRoundedRect(detailX, currentY, detailWidth, 70, 8);
      this.detailContainer.add(iconBg);

      const icon = this.add.text(detailX + 20, currentY + 35, char.icon, {
        fontSize: '36px'
      }).setOrigin(0, 0.5);
      this.detailContainer.add(icon);

      const name = this.add.text(detailX + 75, currentY + 22, char.name, {
        fontSize: '22px',
        color: char.rarity === 'legendary' ? '#ffcc00' : char.rarity === 'rare' ? '#00ffff' : '#ffffff',
        fontStyle: 'bold'
      }).setOrigin(0, 0);
      this.detailContainer.add(name);

      const charTitle = this.add.text(detailX + 75, currentY + 48, char.title, {
        fontSize: '13px',
        color: '#aaaacc'
      }).setOrigin(0, 0);
      this.detailContainer.add(charTitle);

      const rarityLabel = this.add.text(detailX + detailWidth - 15, currentY + 15,
        char.rarity === 'legendary' ? '★★★ 传说' : char.rarity === 'rare' ? '★★ 稀有' : '★ 普通',
        {
          fontSize: '11px',
          color: char.rarity === 'legendary' ? '#ffcc00' : char.rarity === 'rare' ? '#00ffff' : '#888899',
          fontStyle: 'bold'
        }
      ).setOrigin(1, 0);
      this.detailContainer.add(rarityLabel);

      currentY += 85;

      this.detailContainer.add(this.add.text(detailX, currentY, '人物简介', {
        fontSize: '14px',
        color: '#ff6699',
        fontStyle: 'bold'
      }));
      currentY += 22;

      this.detailContainer.add(this.wrapText(char.description, detailX, currentY, detailWidth, 14, '#ccccdd'));
      currentY += this.getTextHeight(char.description, detailWidth, 14) + 10;

      this.detailContainer.add(this.add.text(detailX, currentY, '背景故事', {
        fontSize: '14px',
        color: '#ff6699',
        fontStyle: 'bold'
      }));
      currentY += 22;

      this.detailContainer.add(this.wrapText(char.backstory, detailX, currentY, detailWidth, 13, '#aaaacc'));

    } else if (this.currentCategory === ArchiveCategory.RUMOR) {
      const rumor = item as NightclubRumor;

      const headerBg = this.add.graphics();
      headerBg.fillStyle(0x2a1a2a, 1);
      headerBg.fillRoundedRect(detailX, currentY, detailWidth, 55, 8);
      headerBg.lineStyle(2, 0xff99cc, 0.6);
      headerBg.strokeRoundedRect(detailX, currentY, detailWidth, 55, 8);
      this.detailContainer.add(headerBg);

      const titleIcon = this.add.text(detailX + 15, currentY + 28, '📜', {
        fontSize: '24px'
      }).setOrigin(0, 0.5);
      this.detailContainer.add(titleIcon);

      const title = this.add.text(detailX + 50, currentY + 15, rumor.title, {
        fontSize: '18px',
        color: '#ff99cc',
        fontStyle: 'bold'
      }).setOrigin(0, 0);
      this.detailContainer.add(title);

      const source = this.add.text(detailX + 50, currentY + 38, `来源: ${rumor.source}`, {
        fontSize: '12px',
        color: '#aa8899'
      }).setOrigin(0, 0);
      this.detailContainer.add(source);

      currentY += 70;

      this.detailContainer.add(this.add.text(detailX, currentY, '传闻内容', {
        fontSize: '14px',
        color: '#ff6699',
        fontStyle: 'bold'
      }));
      currentY += 22;

      this.detailContainer.add(this.wrapText(rumor.content, detailX, currentY, detailWidth, 13, '#ccccdd', true));

    } else if (this.currentCategory === ArchiveCategory.HIDDEN_FLOOR) {
      const floor = item as HiddenFloorRecord;

      const headerBg = this.add.graphics();
      headerBg.fillStyle(0x1a2a2a, 1);
      headerBg.fillRoundedRect(detailX, currentY, detailWidth, 60, 8);
      headerBg.lineStyle(2, 0x66ffcc, 0.6);
      headerBg.strokeRoundedRect(detailX, currentY, detailWidth, 60, 8);
      this.detailContainer.add(headerBg);

      const icon = this.add.text(detailX + 15, currentY + 30, floor.icon, {
        fontSize: '28px'
      }).setOrigin(0, 0.5);
      this.detailContainer.add(icon);

      const floorNum = this.add.text(detailX + 55, currentY + 15, `B${floor.floorNumber}F`, {
        fontSize: '14px',
        color: '#66ffcc',
        fontStyle: 'bold'
      }).setOrigin(0, 0);
      this.detailContainer.add(floorNum);

      const name = this.add.text(detailX + 55, currentY + 37, floor.floorName, {
        fontSize: '17px',
        color: '#ffffff',
        fontStyle: 'bold'
      }).setOrigin(0, 0);
      this.detailContainer.add(name);

      currentY += 75;

      this.detailContainer.add(this.add.text(detailX, currentY, '楼层异象', {
        fontSize: '14px',
        color: '#ff6699',
        fontStyle: 'bold'
      }));
      currentY += 22;

      this.detailContainer.add(this.wrapText(floor.phenomenon, detailX, currentY, detailWidth, 13, '#ccccdd'));
      currentY += this.getTextHeight(floor.phenomenon, detailWidth, 13) + 10;

      this.detailContainer.add(this.add.text(detailX, currentY, '调查笔记', {
        fontSize: '14px',
        color: '#ff6699',
        fontStyle: 'bold'
      }));
      currentY += 22;

      this.detailContainer.add(this.wrapText(floor.notes, detailX, currentY, detailWidth, 13, '#88aacc', true));
    }
  }

  private wrapText(text: string, x: number, y: number, maxWidth: number, fontSize: number, color: string, italic: boolean = false): Phaser.GameObjects.Text {
    const style: Phaser.Types.GameObjects.Text.TextStyle = {
      fontSize: `${fontSize}px`,
      color: color,
      wordWrap: { width: maxWidth - 10 }
    };
    if (italic) {
      style.fontStyle = 'italic';
    }
    return this.add.text(x + 5, y, text, style);
  }

  private getTextHeight(text: string, maxWidth: number, fontSize: number): number {
    const approxCharsPerLine = Math.floor(maxWidth / (fontSize * 0.6));
    const lines = Math.ceil(text.length / approxCharsPerLine);
    return lines * (fontSize + 4) + 8;
  }

  private createBackButton(): void {
    const backBtn = this.add.text(GameConfig.width / 2, GameConfig.height - 40, '返回菜单', {
      fontSize: '20px',
      color: '#aaaaaa',
      backgroundColor: '#222233',
      padding: { left: 30, right: 30, top: 10, bottom: 10 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(10);

    backBtn.on('pointerover', () => {
      backBtn.setBackgroundColor('#333355');
      backBtn.setColor('#ffffff');
      this.audioManager.play('hover');
    });

    backBtn.on('pointerout', () => {
      backBtn.setBackgroundColor('#222233');
      backBtn.setColor('#aaaaaa');
    });

    backBtn.on('pointerdown', () => {
      this.audioManager.play('select');
      this.scene.start('MenuScene');
    });
  }

  private createNewUnlockNotification(): void {
    const newlyUnlocked = this.saveManager.getNewlyUnlocked();
    if (newlyUnlocked.length === 0) return;

    this.saveManager.clearNewlyUnlocked();

    const notifBg = this.add.graphics();
    notifBg.fillStyle(0x220033, 0.95);
    notifBg.fillRoundedRect(40, 105, GameConfig.width - 80, 50, 10);
    notifBg.lineStyle(2, 0xff0066, 0.9);
    notifBg.strokeRoundedRect(40, 105, GameConfig.width - 80, 50, 10);
    notifBg.setDepth(20);

    const notifText = this.add.text(
      GameConfig.width / 2,
      130,
      `🎉 新解锁 ${newlyUnlocked.length} 条档案！`,
      {
        fontSize: '16px',
        color: '#ffcc00',
        fontStyle: 'bold'
      }
    ).setOrigin(0.5).setDepth(21);

    this.tweens.add({
      targets: [notifBg, notifText],
      alpha: { from: 0, to: 1 },
      duration: 500,
      ease: 'Sine.easeOut',
      yoyo: true,
      hold: 2500,
      onComplete: () => {
        notifBg.destroy();
        notifText.destroy();
      }
    });
  }
}
