import Phaser from 'phaser';
import { GameConfig } from '../config/GameConfig';
import { AudioManager } from '../audio/AudioManager';
import { SaveManager } from '../utils/SaveManager';
import { ReplayData, ReplayEventType } from '../types';

export class ReplayScene extends Phaser.Scene {
  private audioManager!: AudioManager;
  private saveManager!: SaveManager;
  private scrollY: number = 0;
  private contentHeight: number = 0;
  private scrollContainer!: Phaser.GameObjects.Container;
  private scrollMask!: Phaser.GameObjects.Graphics;
  private isDragging: boolean = false;
  private dragStartY: number = 0;
  private dragStartScroll: number = 0;
  private backToHistory: boolean = false;

  constructor() {
    super('ReplayScene');
  }

  init(data: { replayData?: ReplayData; replayIndex?: number; fromHistory?: boolean }): void {
    this.audioManager = AudioManager.getInstance();
    this.saveManager = SaveManager.getInstance();
    this.backToHistory = !!data.fromHistory;

    if (data.replayData) {
      this.showReplayDetail(data.replayData);
    } else if (data.replayIndex !== undefined) {
      const history = this.saveManager.getReplayHistory();
      const replay = history[data.replayIndex];
      if (replay) {
        this.showReplayDetail(replay);
      } else {
        this.showReplayHistory();
      }
    } else {
      this.showReplayHistory();
    }
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#0a0a1a');
  }

  private clearScene(): void {
    this.children.each(c => c.destroy());
    this.scrollY = 0;
    this.contentHeight = 0;
  }

  private showReplayHistory(): void {
    this.clearScene();
    const history = this.saveManager.getReplayHistory();

    this.add.text(GameConfig.width / 2, 50, '📚 历史复盘记录', {
      fontSize: '26px',
      color: '#cc99ff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(GameConfig.width / 2, 80, `共 ${history.length} 条记录`, {
      fontSize: '14px',
      color: '#888888'
    }).setOrigin(0.5);

    const listY = 110;
    const listHeight = GameConfig.height - 180;

    this.createScrollArea(20, listY, GameConfig.width - 40, listHeight);

    if (history.length === 0) {
      this.add.text(GameConfig.width / 2, listY + listHeight / 2, '暂无历史记录', {
        fontSize: '18px',
        color: '#666666'
      }).setOrigin(0.5).setScrollFactor(0);
    } else {
      const itemHeight = 70;
      const gap = 8;
      this.contentHeight = history.length * (itemHeight + gap);

      history.forEach((record, i) => {
        const itemY = i * (itemHeight + gap);
        this.createHistoryItem(record, i, 10, itemY, GameConfig.width - 60, itemHeight);
      });
    }

    this.createBackButton();

    if (history.length > 0) {
      const clearBtn = this.add.text(GameConfig.width - 20, GameConfig.height - 35, '清空记录', {
        fontSize: '13px',
        color: '#ff6666',
        backgroundColor: '#331111',
        padding: { left: 12, right: 12, top: 4, bottom: 4 }
      }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true });

      clearBtn.on('pointerover', () => {
        clearBtn.setBackgroundColor('#552222');
        this.audioManager.play('hover');
      });
      clearBtn.on('pointerout', () => clearBtn.setBackgroundColor('#331111'));
      clearBtn.on('pointerdown', () => {
        this.audioManager.play('select');
        this.showClearConfirm();
      });
    }
  }

  private createHistoryItem(record: ReplayData, index: number, x: number, y: number, w: number, h: number): void {
    const itemBg = this.add.graphics();
    itemBg.fillStyle(0x221133, 0.8);
    itemBg.fillRoundedRect(x, y, w, h, 8);

    const date = new Date(record.date);
    const dateStr = `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    const duration = (record.gameDuration / 1000).toFixed(1);

    const modeLabels: Record<string, string> = {
      'normal': '普通',
      'endless': '无尽',
      'challenge': '挑战',
      'dual': '双人'
    };
    const modeStr = modeLabels[record.gameMode] || record.gameMode;

    this.add.text(x + 12, y + 14, `#${index + 1}  ${dateStr}`, {
      fontSize: '12px',
      color: '#aa88cc'
    }).setOrigin(0, 0.5);

    this.add.text(x + w - 12, y + 14, `⏱ ${duration}s`, {
      fontSize: '11px',
      color: '#888888'
    }).setOrigin(1, 0.5);

    this.add.text(x + 12, y + 34, `${record.deathReason || '未知原因'}`, {
      fontSize: '14px',
      color: '#ff8888',
      fontStyle: 'bold'
    }).setOrigin(0, 0.5);

    this.add.text(x + 12, y + 54, `[${modeStr}] ${record.finalFloor}F`, {
      fontSize: '12px',
      color: '#66ccff'
    }).setOrigin(0, 0.5);

    this.add.text(x + w / 2, y + 54, `💊${record.pillsCollected || 0}  🔥x${record.maxCombo || 0}`, {
      fontSize: '11px',
      color: '#ffaa66'
    }).setOrigin(0.5, 0.5);

    this.add.text(x + w - 12, y + 54, `${record.finalScore}分`, {
      fontSize: '13px',
      color: '#ffcc00',
      fontStyle: 'bold'
    }).setOrigin(1, 0.5);

    itemBg.setInteractive(new Phaser.Geom.Rectangle(x, y, w, h), Phaser.Geom.Rectangle.Contains);
    itemBg.on('pointerover', () => {
      itemBg.fillStyle(0x332255, 0.9);
      itemBg.fillRoundedRect(x, y, w, h, 8);
      this.audioManager.play('hover');
    });
    itemBg.on('pointerout', () => {
      itemBg.fillStyle(0x221133, 0.8);
      itemBg.fillRoundedRect(x, y, w, h, 8);
    });
    itemBg.on('pointerdown', () => {
      this.audioManager.play('select');
      this.showReplayDetail(record);
    });

    this.scrollContainer.add([itemBg]);
  }

  private showReplayDetail(record: ReplayData): void {
    this.clearScene();

    const date = new Date(record.date);
    const dateStr = `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

    this.add.text(GameConfig.width / 2, 30, '📜 复盘详情', {
      fontSize: '24px',
      color: '#66ffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    let infoY = 60;
    this.add.text(20, infoY, dateStr, {
      fontSize: '12px',
      color: '#888888'
    }).setOrigin(0, 0.5);

    const modeLabels: Record<string, string> = {
      'normal': '普通模式',
      'endless': '无尽模式',
      'challenge': '挑战模式',
      'dual': '双角色模式'
    };
    this.add.text(GameConfig.width - 20, infoY, modeLabels[record.gameMode] || record.gameMode, {
      fontSize: '12px',
      color: '#88ccff'
    }).setOrigin(1, 0.5);

    infoY += 22;
    this.add.text(20, infoY, `死亡原因: ${record.deathReason || '未知'}`, {
      fontSize: '15px',
      color: '#ff6666',
      fontStyle: 'bold'
    }).setOrigin(0, 0.5);

    this.add.text(GameConfig.width - 20, infoY, `${record.finalFloor}F | ${record.finalScore}分`, {
      fontSize: '14px',
      color: '#ffcc00',
      fontStyle: 'bold'
    }).setOrigin(1, 0.5);

    infoY += 22;

    const stats = [
      { label: '最高连击', value: `x${record.maxCombo || 0}`, color: '#ffcc66' },
      { label: '无伤连层', value: `${record.maxNoDamageFloors || 0}层`, color: '#aaff66' },
      { label: '收集药片', value: `${record.pillsCollected || 0}`, color: '#ff99ff' },
      { label: '最高成瘾', value: `${Math.floor(record.maxAddiction || 0)}%`, color: record.maxAddiction >= 75 ? '#ff4444' : '#ffaa66' }
    ];

    stats.forEach((s, i) => {
      const sx = 20 + (i * (GameConfig.width - 40)) / 4 + (GameConfig.width - 40) / 8;
      this.add.text(sx, infoY, s.label, {
        fontSize: '10px',
        color: '#888888'
      }).setOrigin(0.5, 0);
      this.add.text(sx, infoY + 14, s.value, {
        fontSize: '14px',
        color: s.color,
        fontStyle: 'bold'
      }).setOrigin(0.5, 0);
    });

    infoY += 40;

    if (record.shopItemsUsed && (record.shopItemsUsed.shield > 0 || record.shopItemsUsed.slowPulse > 0 || record.shopItemsUsed.bounce > 0)) {
      const shopParts: string[] = [];
      if (record.shopItemsUsed.shield > 0) shopParts.push(`🛡${record.shopItemsUsed.shield}`);
      if (record.shopItemsUsed.slowPulse > 0) shopParts.push(`❄${record.shopItemsUsed.slowPulse}`);
      if (record.shopItemsUsed.bounce > 0) shopParts.push(`⬆${record.shopItemsUsed.bounce}`);
      if (record.shopItemsUsed.pillsSpent > 0) shopParts.push(`💊${record.shopItemsUsed.pillsSpent}`);

      this.add.text(GameConfig.width / 2, infoY, `商店道具: ${shopParts.join('  ')}`, {
        fontSize: '12px',
        color: '#ffdd44'
      }).setOrigin(0.5);
      infoY += 20;
    }

    if ((record.hallucinations || 0) > 0 || (record.lossOfControl || 0) > 0) {
      const seParts: string[] = [];
      if ((record.hallucinations || 0) > 0) seParts.push(`👁幻觉x${record.hallucinations}`);
      if ((record.lossOfControl || 0) > 0) seParts.push(`😵失控x${record.lossOfControl}`);
      this.add.text(GameConfig.width / 2, infoY, `副作用: ${seParts.join('  ')}`, {
        fontSize: '11px',
        color: '#ff66ff'
      }).setOrigin(0.5);
      infoY += 18;
    }

    const line = this.add.graphics();
    line.lineStyle(1, 0x444466, 0.8);
    line.lineBetween(15, infoY, GameConfig.width - 15, infoY);
    infoY += 8;

    const listY = infoY;
    const listHeight = GameConfig.height - listY - 60;

    this.createScrollArea(15, listY, GameConfig.width - 30, listHeight);

    const events = record.events || [];
    if (events.length === 0) {
      this.add.text(GameConfig.width / 2, listY + listHeight / 2, '暂无事件记录', {
        fontSize: '16px',
        color: '#666666'
      }).setOrigin(0.5);
    } else {
      const itemH = 26;
      const gap = 2;
      this.contentHeight = events.length * (itemH + gap);

      events.forEach((event, i) => {
        const ey = i * (itemH + gap);
        this.createEventItem(event, 5, ey, GameConfig.width - 40, itemH);
      });
    }

    this.createBackButton(this.backToHistory);
  }

  private createEventItem(event: any, x: number, y: number, w: number, h: number): void {
    const relTime = ((event.relativeTime || 0) / 1000).toFixed(1);
    const icon = this.getEventIcon(event.type);
    const color = this.getEventColor(event.type);

    let text = `${icon} [${relTime}s] ${event.description}`;
    if (event.floorNumber !== undefined) {
      text += ` @${event.floorNumber}F`;
    }

    const bg = this.add.graphics();
    const isDeath = event.type === ReplayEventType.PLAYER_DEATH;
    const isImportant = isDeath || event.type === ReplayEventType.COLLISION_GUARD || event.type === ReplayEventType.COLLISION_FALL;
    if (isDeath) {
      bg.fillStyle(0x330000, 0.6);
    } else if (isImportant) {
      bg.fillStyle(0x220011, 0.4);
    }
    bg.fillRoundedRect(x, y, w, h, 4);

    this.add.text(x + 8, y + h / 2, text, {
      fontSize: '12px',
      color
    }).setOrigin(0, 0.5);

    if (event.scoreGain !== undefined && event.scoreGain > 0) {
      this.add.text(x + w - 8, y + h / 2, `+${event.scoreGain}`, {
        fontSize: '11px',
        color: '#ffff66',
        fontStyle: 'bold'
      }).setOrigin(1, 0.5);
    }
  }

  private createScrollArea(x: number, y: number, w: number, h: number): void {
    this.scrollMask = this.add.graphics();
    this.scrollMask.fillStyle(0xffffff, 1);
    this.scrollMask.fillRect(x, y, w, h);

    this.scrollContainer = this.add.container(x, y);
    this.scrollContainer.setMask(new Phaser.Display.Masks.GeometryMask(this, this.scrollMask));

    const scrollBg = this.add.graphics();
    scrollBg.lineStyle(1, 0x333355, 0.5);
    scrollBg.strokeRect(x, y, w, h);

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.x >= x && pointer.x <= x + w && pointer.y >= y && pointer.y <= y + h) {
        this.isDragging = true;
        this.dragStartY = pointer.y;
        this.dragStartScroll = this.scrollY;
      }
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.isDragging) {
        const delta = this.dragStartY - pointer.y;
        this.setScroll(this.dragStartScroll + delta);
      }
    });

    this.input.on('pointerup', () => {
      this.isDragging = false;
    });

    this.input.on('wheel', (_pointer: Phaser.Input.Pointer, _gameObjects: any, _deltaX: number, deltaY: number) => {
      if (_pointer.x >= x && _pointer.x <= x + w && _pointer.y >= y && _pointer.y <= y + h) {
        this.setScroll(this.scrollY + deltaY * 0.5);
      }
    });
  }

  private setScroll(y: number): void {
    const maxScroll = Math.max(0, this.contentHeight - (this.scrollMask ? (this.scrollMask as any).geometryMask?.geometry?.height || 0 : 0));
    this.scrollY = Phaser.Math.Clamp(y, 0, Math.max(0, maxScroll));
    if (this.scrollContainer) {
      this.scrollContainer.y = (this.scrollMask as any)?.y - this.scrollY || 0;
      const children = this.scrollContainer.list as Phaser.GameObjects.GameObject[];
      children.forEach(child => {
        if ('y' in child) {
          // no-op, container handles positioning
        }
      });
      this.scrollContainer.y = -this.scrollY;
    }
  }

  private createBackButton(toHistory: boolean = false): void {
    const label = toHistory ? '← 返回列表' : '← 返回';
    const backBtn = this.add.text(20, GameConfig.height - 30, label, {
      fontSize: '16px',
      color: '#ffffff',
      backgroundColor: '#444466',
      padding: { left: 16, right: 16, top: 6, bottom: 6 }
    }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true });

    backBtn.on('pointerover', () => {
      backBtn.setBackgroundColor('#555588');
      this.audioManager.play('hover');
    });
    backBtn.on('pointerout', () => backBtn.setBackgroundColor('#444466'));
    backBtn.on('pointerdown', () => {
      this.audioManager.play('select');
      if (toHistory) {
        this.showReplayHistory();
      } else {
        this.scene.start('MenuScene');
      }
    });
  }

  private showClearConfirm(): void {
    const overlay = this.add.graphics().setDepth(100);
    overlay.fillStyle(0x000000, 0.85);
    overlay.fillRect(0, 0, GameConfig.width, GameConfig.height);

    const panel = this.add.graphics().setDepth(101);
    const pw = 300, ph = 150;
    const px = (GameConfig.width - pw) / 2, py = (GameConfig.height - ph) / 2;
    panel.fillStyle(0x1a0a1a, 1);
    panel.fillRoundedRect(px, py, pw, ph, 10);
    panel.lineStyle(2, 0xff4444, 0.8);
    panel.strokeRoundedRect(px, py, pw, ph, 10);

    this.add.text(GameConfig.width / 2, py + 35, '确认清空所有记录?', {
      fontSize: '18px',
      color: '#ff6666',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(102);

    this.add.text(GameConfig.width / 2, py + 65, '此操作无法撤销', {
      fontSize: '12px',
      color: '#888888'
    }).setOrigin(0.5).setDepth(102);

    const confirmBtn = this.add.text(GameConfig.width / 2 - 65, py + 110, '确认清空', {
      fontSize: '14px',
      color: '#ffffff',
      backgroundColor: '#aa2222',
      padding: { left: 16, right: 16, top: 6, bottom: 6 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(102);

    const cancelBtn = this.add.text(GameConfig.width / 2 + 65, py + 110, '取消', {
      fontSize: '14px',
      color: '#ffffff',
      backgroundColor: '#444466',
      padding: { left: 20, right: 20, top: 6, bottom: 6 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(102);

    const closeAll = () => {
      overlay.destroy(); panel.destroy(); confirmBtn.destroy(); cancelBtn.destroy();
    };

    confirmBtn.on('pointerover', () => { confirmBtn.setBackgroundColor('#cc3333'); this.audioManager.play('hover'); });
    confirmBtn.on('pointerout', () => confirmBtn.setBackgroundColor('#aa2222'));
    confirmBtn.on('pointerdown', () => {
      this.audioManager.play('select');
      this.saveManager.clearReplayHistory();
      closeAll();
      this.showReplayHistory();
    });

    cancelBtn.on('pointerover', () => { cancelBtn.setBackgroundColor('#555588'); this.audioManager.play('hover'); });
    cancelBtn.on('pointerout', () => cancelBtn.setBackgroundColor('#444466'));
    cancelBtn.on('pointerdown', () => {
      this.audioManager.play('select');
      closeAll();
    });
  }

  private getEventColor(type: ReplayEventType): string {
    switch (type) {
      case ReplayEventType.FLOOR_CHANGE: return '#66ccff';
      case ReplayEventType.COLLISION_GUARD: return '#ff4444';
      case ReplayEventType.COLLISION_PILL: return '#ff99ff';
      case ReplayEventType.COLLISION_FALL: return '#ff6600';
      case ReplayEventType.COLLISION_TRAP: return '#ffaa00';
      case ReplayEventType.SCORE_SURVIVAL: return '#88ff88';
      case ReplayEventType.SCORE_FLOOR: return '#66ffcc';
      case ReplayEventType.SCORE_COMBO: return '#ffcc66';
      case ReplayEventType.SCORE_PILL: return '#ff99ff';
      case ReplayEventType.SCORE_NODAMAGE: return '#aaff66';
      case ReplayEventType.ITEM_PILL_USE: return '#ff66cc';
      case ReplayEventType.ITEM_SHOP_PURCHASE: return '#ffdd44';
      case ReplayEventType.EVENT_FLOOR_START: return '#ff88ff';
      case ReplayEventType.EVENT_FLOOR_END: return '#aa66ff';
      case ReplayEventType.TIME_OF_DAY_CHANGE: return '#66aaff';
      case ReplayEventType.CHARACTER_SWITCH: return '#44ffaa';
      case ReplayEventType.PLAYER_DEATH: return '#ff2222';
      default: return '#aaaaaa';
    }
  }

  private getEventIcon(type: ReplayEventType): string {
    switch (type) {
      case ReplayEventType.FLOOR_CHANGE: return '⬆';
      case ReplayEventType.COLLISION_GUARD: return '👮';
      case ReplayEventType.COLLISION_PILL: return '💊';
      case ReplayEventType.COLLISION_FALL: return '💥';
      case ReplayEventType.COLLISION_TRAP: return '⚠';
      case ReplayEventType.SCORE_SURVIVAL: return '⏱';
      case ReplayEventType.SCORE_FLOOR: return '🏢';
      case ReplayEventType.SCORE_COMBO: return '🔥';
      case ReplayEventType.SCORE_PILL: return '💎';
      case ReplayEventType.SCORE_NODAMAGE: return '🛡';
      case ReplayEventType.ITEM_PILL_USE: return '💉';
      case ReplayEventType.ITEM_SHOP_PURCHASE: return '🛒';
      case ReplayEventType.EVENT_FLOOR_START: return '📢';
      case ReplayEventType.EVENT_FLOOR_END: return '🔇';
      case ReplayEventType.TIME_OF_DAY_CHANGE: return '🕐';
      case ReplayEventType.CHARACTER_SWITCH: return '🔄';
      case ReplayEventType.PLAYER_DEATH: return '💀';
      default: return '•';
    }
  }
}
