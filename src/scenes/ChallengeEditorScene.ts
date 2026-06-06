import Phaser from 'phaser';
import { GameConfig } from '../config/GameConfig';
import { ChallengeConfig, WinConditionType } from '../types';
import { ChallengePresetManager } from '../utils/ChallengePresetManager';
import { AudioManager } from '../audio/AudioManager';

interface SliderConfig {
  x: number;
  y: number;
  width: number;
  min: number;
  max: number;
  step: number;
  initialValue: number;
  label: string;
  unit?: string;
}

interface ToggleConfig {
  x: number;
  y: number;
  label: string;
  initialValue: boolean;
}

export class ChallengeEditorScene extends Phaser.Scene {
  private presetManager!: ChallengePresetManager;
  private audioManager!: AudioManager;

  private currentConfig!: ChallengeConfig;
  private selectedPresetId: string | null = null;

  private presetListContainer!: Phaser.GameObjects.Container;
  private presetListScrollY: number = 0;
  private presetListMaxScrollY: number = 0;
  private isDraggingPresetList: boolean = false;
  private dragStartY: number = 0;
  private dragStartScrollY: number = 0;
  private presetListMask!: Phaser.GameObjects.Graphics;

  private editorContainer!: Phaser.GameObjects.Container;
  private editorScrollY: number = 0;
  private editorMaxScrollY: number = 0;
  private isDraggingEditor: boolean = false;
  private editorMask!: Phaser.GameObjects.Graphics;

  private sliderHandlers: Map<string, { value: number; onChange: (v: number) => void }> = new Map();
  private toggleHandlers: Map<string, { value: boolean; onChange: (v: boolean) => void }> = new Map();

  private readonly PRESET_LIST_X = 15;
  private readonly PRESET_LIST_Y = 100;
  private readonly PRESET_LIST_WIDTH = 160;
  private readonly PRESET_LIST_HEIGHT = 520;
  private readonly PRESET_ITEM_HEIGHT = 55;

  private readonly EDITOR_X = 185;
  private readonly EDITOR_Y = 100;
  private readonly EDITOR_WIDTH = 280;
  private readonly EDITOR_HEIGHT = 520;

  private toastBg!: Phaser.GameObjects.Graphics;
  private toastText!: Phaser.GameObjects.Text;
  private toastTween!: Phaser.Tweens.Tween;

  constructor() {
    super('ChallengeEditorScene');
  }

  create(): void {
    this.presetManager = ChallengePresetManager.getInstance();
    this.audioManager = AudioManager.getInstance();
    this.currentConfig = this.presetManager.createEmptyConfig();

    this.cameras.main.setBackgroundColor('#0a0a1a');

    this.add.text(GameConfig.width / 2, 35, '自定义挑战编辑器', {
      fontSize: '22px',
      color: '#ff0066',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(GameConfig.width / 2, 62, '配置你的专属挑战体验', {
      fontSize: '13px',
      color: '#8888aa'
    }).setOrigin(0.5);

    this.createPresetListArea();
    this.createEditorArea();
    this.createBottomButtons();
    this.refreshPresetList();
    this.refreshEditor();
  }

  private showToast(message: string, color: string = '#00ff88'): void {
    if (!this.toastBg) {
      this.toastBg = this.add.graphics().setDepth(100);
      this.toastText = this.add.text(GameConfig.width / 2, 75, '', {
        fontSize: '14px',
        color: '#ffffff',
        fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(101);
    }

    this.toastBg.clear();
    this.toastBg.fillStyle(0x111122, 0.95);
    this.toastBg.fillRoundedRect(GameConfig.width / 2 - message.length * 8 - 20, 58, message.length * 16 + 40, 34, 8);
    this.toastBg.lineStyle(2, Phaser.Display.Color.HexStringToColor(color).color, 1);
    this.toastBg.strokeRoundedRect(GameConfig.width / 2 - message.length * 8 - 20, 58, message.length * 16 + 40, 34, 8);

    this.toastText.setText(message);
    this.toastText.setColor(color);
    this.toastBg.setAlpha(1);
    this.toastText.setAlpha(1);

    if (this.toastTween) {
      this.toastTween.remove();
    }

    this.toastTween = this.tweens.add({
      targets: [this.toastBg, this.toastText],
      alpha: 0,
      duration: 2000,
      delay: 1000,
      ease: 'Sine.easeIn'
    });
  }

  private createPresetListArea(): void {
    const headerBg = this.add.graphics();
    headerBg.fillStyle(0x151530, 1);
    headerBg.fillRect(this.PRESET_LIST_X, this.PRESET_LIST_Y - 35, this.PRESET_LIST_WIDTH, 30);
    headerBg.lineStyle(1, 0x333355, 0.8);
    headerBg.strokeRect(this.PRESET_LIST_X, this.PRESET_LIST_Y - 35, this.PRESET_LIST_WIDTH, 30);

    this.add.text(this.PRESET_LIST_X + this.PRESET_LIST_WIDTH / 2, this.PRESET_LIST_Y - 20, '📋 预设列表', {
      fontSize: '13px',
      color: '#ff6699',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const listBg = this.add.graphics();
    listBg.fillStyle(0x101025, 1);
    listBg.fillRect(this.PRESET_LIST_X, this.PRESET_LIST_Y, this.PRESET_LIST_WIDTH, this.PRESET_LIST_HEIGHT);
    listBg.lineStyle(1, 0x333355, 0.8);
    listBg.strokeRect(this.PRESET_LIST_X, this.PRESET_LIST_Y, this.PRESET_LIST_WIDTH, this.PRESET_LIST_HEIGHT);

    this.presetListContainer = this.add.container(0, 0).setDepth(2);

    this.presetListMask = this.add.graphics();
    this.presetListMask.fillStyle(0xffffff, 1);
    this.presetListMask.fillRect(this.PRESET_LIST_X, this.PRESET_LIST_Y, this.PRESET_LIST_WIDTH, this.PRESET_LIST_HEIGHT);
    this.presetListContainer.setMask(new Phaser.Display.Masks.GeometryMask(this, this.presetListMask));

    const listZone = this.add.zone(this.PRESET_LIST_X, this.PRESET_LIST_Y, this.PRESET_LIST_WIDTH, this.PRESET_LIST_HEIGHT);
    listZone.setOrigin(0, 0).setInteractive().setDepth(10);

    listZone.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.isDraggingPresetList = true;
      this.dragStartY = pointer.y;
      this.dragStartScrollY = this.presetListScrollY;
    });
    listZone.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.isDraggingPresetList) {
        const delta = this.dragStartY - pointer.y;
        this.presetListScrollY = Phaser.Math.Clamp(this.dragStartScrollY + delta, 0, this.presetListMaxScrollY);
        this.updatePresetListPositions();
      }
    });
    listZone.on('pointerup', () => { this.isDraggingPresetList = false; });
    listZone.on('pointerupoutside', () => { this.isDraggingPresetList = false; });
  }

  private createEditorArea(): void {
    const headerBg = this.add.graphics();
    headerBg.fillStyle(0x151530, 1);
    headerBg.fillRect(this.EDITOR_X, this.EDITOR_Y - 35, this.EDITOR_WIDTH, 30);
    headerBg.lineStyle(1, 0x333355, 0.8);
    headerBg.strokeRect(this.EDITOR_X, this.EDITOR_Y - 35, this.EDITOR_WIDTH, 30);

    this.add.text(this.EDITOR_X + this.EDITOR_WIDTH / 2, this.EDITOR_Y - 20, '⚙️ 挑战配置', {
      fontSize: '13px',
      color: '#66ccff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const editorBg = this.add.graphics();
    editorBg.fillStyle(0x101025, 1);
    editorBg.fillRect(this.EDITOR_X, this.EDITOR_Y, this.EDITOR_WIDTH, this.EDITOR_HEIGHT);
    editorBg.lineStyle(1, 0x333355, 0.8);
    editorBg.strokeRect(this.EDITOR_X, this.EDITOR_Y, this.EDITOR_WIDTH, this.EDITOR_HEIGHT);

    this.editorContainer = this.add.container(0, 0).setDepth(2);

    this.editorMask = this.add.graphics();
    this.editorMask.fillStyle(0xffffff, 1);
    this.editorMask.fillRect(this.EDITOR_X, this.EDITOR_Y, this.EDITOR_WIDTH, this.EDITOR_HEIGHT);
    this.editorContainer.setMask(new Phaser.Display.Masks.GeometryMask(this, this.editorMask));

    const editorZone = this.add.zone(this.EDITOR_X, this.EDITOR_Y, this.EDITOR_WIDTH, this.EDITOR_HEIGHT);
    editorZone.setOrigin(0, 0).setInteractive().setDepth(10);

    editorZone.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.isDraggingEditor = true;
      this.dragStartY = pointer.y;
      this.dragStartScrollY = this.editorScrollY;
    });
    editorZone.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.isDraggingEditor) {
        const delta = this.dragStartY - pointer.y;
        this.editorScrollY = Phaser.Math.Clamp(this.dragStartScrollY + delta, 0, this.editorMaxScrollY);
        this.updateEditorPositions();
      }
    });
    editorZone.on('pointerup', () => { this.isDraggingEditor = false; });
    editorZone.on('pointerupoutside', () => { this.isDraggingEditor = false; });
  }

  private refreshPresetList(): void {
    this.presetListContainer.removeAll(true);
    const presets = this.presetManager.getAllPresets();
    const totalHeight = presets.length * this.PRESET_ITEM_HEIGHT;
    this.presetListMaxScrollY = Math.max(0, totalHeight - this.PRESET_LIST_HEIGHT);
    this.presetListScrollY = Math.min(this.presetListScrollY, this.presetListMaxScrollY);

    presets.forEach((preset, index) => {
      const baseY = this.PRESET_LIST_Y + 5 + index * this.PRESET_ITEM_HEIGHT;
      const adjustedY = baseY - this.presetListScrollY;
      const isSelected = this.selectedPresetId === preset.id;
      const isDefault = this.presetManager.isDefaultPreset(preset.id);

      const itemBg = this.add.rectangle(
        this.PRESET_LIST_X + this.PRESET_LIST_WIDTH / 2,
        adjustedY + this.PRESET_ITEM_HEIGHT / 2 - 2,
        this.PRESET_LIST_WIDTH - 10,
        this.PRESET_ITEM_HEIGHT - 8,
        isSelected ? 0x332255 : (isDefault ? 0x1a1a3a : 0x15152d)
      ).setOrigin(0.5).setInteractive({ useHandCursor: true });

      if (isSelected) {
        itemBg.setStrokeStyle(2, 0xff0066);
      } else {
        itemBg.setStrokeStyle(1, 0x2a2a4a);
      }

      const tag = this.add.text(this.PRESET_LIST_X + 10, adjustedY + 8, isDefault ? '⭐' : '✏️', {
        fontSize: '12px'
      }).setOrigin(0, 0);

      const name = this.add.text(this.PRESET_LIST_X + 28, adjustedY + 6, preset.name, {
        fontSize: '13px',
        color: isSelected ? '#ffffff' : (isDefault ? '#ffcc88' : '#aaccff'),
        fontStyle: 'bold'
      }).setOrigin(0, 0);

      const condition = this.getWinConditionShortText(preset);
      const condText = this.add.text(this.PRESET_LIST_X + 10, adjustedY + 26, condition, {
        fontSize: '10px',
        color: '#777799'
      }).setOrigin(0, 0);

      itemBg.on('pointerover', () => {
        if (!isSelected) itemBg.setFillStyle(0x252555);
        this.audioManager.play('hover');
      });
      itemBg.on('pointerout', () => {
        if (!isSelected) itemBg.setFillStyle(isDefault ? 0x1a1a3a : 0x15152d);
      });
      itemBg.on('pointerdown', () => {
        this.audioManager.play('select');
        this.selectedPresetId = preset.id;
        this.currentConfig = JSON.parse(JSON.stringify(preset));
        this.currentConfig.id = preset.id;
        this.editorScrollY = 0;
        this.refreshPresetList();
        this.refreshEditor();
      });

      this.presetListContainer.add([itemBg, tag, name, condText]);
    });

    this.updatePresetListScrollBar();
  }

  private updatePresetListPositions(): void {
    const presets = this.presetManager.getAllPresets();
    const children = this.presetListContainer.getAll();
    const perEntry = 4;
    children.forEach((child, i) => {
      const itemIndex = Math.floor(i / perEntry);
      if (itemIndex >= presets.length) return;
      const baseY = this.PRESET_LIST_Y + 5 + itemIndex * this.PRESET_ITEM_HEIGHT;
      const adjustedY = baseY - this.presetListScrollY;
      const inItem = i % perEntry;
      const gameObj = child as Phaser.GameObjects.Rectangle | Phaser.GameObjects.Text;
      if (inItem === 0) {
        (gameObj as Phaser.GameObjects.Rectangle).y = adjustedY + this.PRESET_ITEM_HEIGHT / 2 - 2;
      } else if (inItem === 1) {
        (gameObj as Phaser.GameObjects.Text).y = adjustedY + 8;
      } else if (inItem === 2) {
        (gameObj as Phaser.GameObjects.Text).y = adjustedY + 6;
      } else {
        (gameObj as Phaser.GameObjects.Text).y = adjustedY + 26;
      }
    });
    this.updatePresetListScrollBar();
  }

  private updatePresetListScrollBar(): void {
    const barX = this.PRESET_LIST_X + this.PRESET_LIST_WIDTH - 4;
    const barY = this.PRESET_LIST_Y;
    const barW = 3;
    const barH = this.PRESET_LIST_HEIGHT;
    let thumbH = barH;
    let thumbY = barY;
    if (this.presetListMaxScrollY > 0) {
      const ratio = barH / (barH + this.presetListMaxScrollY);
      thumbH = Math.max(20, barH * ratio);
      thumbY = barY + (this.presetListScrollY / this.presetListMaxScrollY) * (barH - thumbH);
    }
    const graphics = this.presetListContainer.getByName('__scrollbar') as Phaser.GameObjects.Graphics;
    if (!graphics) {
      const newBar = this.add.graphics().setDepth(5);
      newBar.setName('__scrollbar');
      this.presetListContainer.add(newBar);
    }
    const bar = (this.presetListContainer.getByName('__scrollbar') as Phaser.GameObjects.Graphics) || this.add.graphics();
    bar.clear();
    bar.fillStyle(0x222244, 0.5);
    bar.fillRect(barX, barY, barW, barH);
    bar.fillStyle(0xff0066, 0.8);
    bar.fillRect(barX, thumbY, barW, thumbH);
  }

  private getWinConditionShortText(cfg: ChallengeConfig): string {
    const map: Record<WinConditionType, string> = {
      [WinConditionType.FLOOR_REACHED]: `目标楼层 ${cfg.winCondition.value}F`,
      [WinConditionType.SCORE_REACHED]: `目标分数 ${cfg.winCondition.value}`,
      [WinConditionType.PILLS_COLLECTED]: `收集药片 ${cfg.winCondition.value}`,
      [WinConditionType.SURVIVAL_TIME]: `存活 ${Math.floor(cfg.winCondition.value / 1000)}秒`,
      [WinConditionType.GUARDS_AVOIDED]: `甩开保安 ${cfg.winCondition.value}`
    };
    return map[cfg.winCondition.type] || '未知';
  }

  private refreshEditor(): void {
    this.editorContainer.removeAll(true);
    this.sliderHandlers.clear();
    this.toggleHandlers.clear();

    let y = this.EDITOR_Y + 10;
    const startX = this.EDITOR_X + 10;
    const contentW = this.EDITOR_WIDTH - 20;

    y = this.addSectionHeader(startX, y, '📝 基础信息');
    y = this.addNameField(startX, y, contentW);

    y = this.addSectionHeader(startX, y, '🏢 楼层设置');
    y = this.addSlider(startX, y, contentW, {
      x: startX, y, width: contentW, min: 0.3, max: 2.0, step: 0.1,
      initialValue: this.currentConfig.floorDensity, label: '楼层密度', unit: 'x'
    }, 'floorDensity');

    y = this.addSlider(startX, y, contentW, {
      x: startX, y, width: contentW, min: 1, max: 5, step: 1,
      initialValue: this.currentConfig.platformCountMin, label: '最少平台数'
    }, 'platformCountMin');

    y = this.addSlider(startX, y, contentW, {
      x: startX, y, width: contentW, min: 1, max: 6, step: 1,
      initialValue: this.currentConfig.platformCountMax, label: '最多平台数'
    }, 'platformCountMax');

    y = this.addSectionHeader(startX, y, '👮 保安设置');
    y = this.addSlider(startX, y, contentW, {
      x: startX, y, width: contentW, min: 0, max: 5, step: 1,
      initialValue: this.currentConfig.guardCount, label: '初始保安数量'
    }, 'guardCount');

    y = this.addSlider(startX, y, contentW, {
      x: startX, y, width: contentW, min: 0.3, max: 3.0, step: 0.1,
      initialValue: this.currentConfig.guardSpeedMultiplier, label: '保安速度', unit: 'x'
    }, 'guardSpeedMultiplier');

    y = this.addSlider(startX, y, contentW, {
      x: startX, y, width: contentW, min: 50, max: 350, step: 10,
      initialValue: this.currentConfig.guardDetectionRange, label: '侦测范围', unit: 'px'
    }, 'guardDetectionRange');

    y = this.addSlider(startX, y, contentW, {
      x: startX, y, width: contentW, min: 1000, max: 30000, step: 500,
      initialValue: this.currentConfig.guardSpawnInterval, label: '生成间隔', unit: 'ms'
    }, 'guardSpawnInterval');

    y = this.addSectionHeader(startX, y, '💊 药片设置');
    const pillTypes = [
      { key: 'speed', label: '加速', color: '#00ff88' },
      { key: 'slow', label: '减速保安', color: '#00aaff' },
      { key: 'score', label: '分数', color: '#ffcc00' },
      { key: 'shield', label: '护盾', color: '#ff66ff' }
    ];

    pillTypes.forEach(pill => {
      y = this.addSlider(startX, y, contentW, {
        x: startX, y, width: contentW, min: 0, max: 10, step: 1,
        initialValue: this.currentConfig.pillWeights[pill.key] || 0,
        label: `${pill.label}(${pill.color})权重`
      }, `pill_${pill.key}`);
    });

    y = this.addSlider(startX, y, contentW, {
      x: startX, y, width: contentW, min: 500, max: 10000, step: 100,
      initialValue: this.currentConfig.pillSpawnInterval, label: '药片生成间隔', unit: 'ms'
    }, 'pillSpawnInterval');

    y = this.addSlider(startX, y, contentW, {
      x: startX, y, width: contentW, min: 2, max: 30, step: 1,
      initialValue: this.currentConfig.maxPills, label: '场上最大药片数'
    }, 'maxPills');

    y = this.addSectionHeader(startX, y, '🏆 胜负条件');
    y = this.addWinConditionSelector(startX, y, contentW);
    y = this.addSlider(startX, y, contentW, {
      x: startX, y, width: contentW, min: 1, max: 500, step: 1,
      initialValue: this.currentConfig.winCondition.value,
      label: '条件数值'
    }, 'winConditionValue');

    y = this.addSectionHeader(startX, y, '⚡ 特殊规则');
    y = this.addToggle(startX, y, contentW, {
      x: startX, y, label: '碰到保安失败', initialValue: this.currentConfig.loseOnGuardCollision
    }, 'loseOnGuardCollision');
    y = this.addToggle(startX, y, contentW, {
      x: startX, y, label: '掉出屏幕失败', initialValue: this.currentConfig.loseOnFall
    }, 'loseOnFall');
    y = this.addToggle(startX, y, contentW, {
      x: startX, y, label: '启用日夜循环', initialValue: this.currentConfig.enableDayNightCycle
    }, 'enableDayNightCycle');
    y = this.addToggle(startX, y, contentW, {
      x: startX, y, label: '启用楼层事件', initialValue: this.currentConfig.enableFloorEvents
    }, 'enableFloorEvents');
    y = this.addToggle(startX, y, contentW, {
      x: startX, y, label: '启用药片副作用', initialValue: this.currentConfig.enableSideEffects
    }, 'enableSideEffects');

    y = this.addSlider(startX, y, contentW, {
      x: startX, y, width: contentW, min: 0, max: 600000, step: 10000,
      initialValue: this.currentConfig.timeLimitMs, label: '时间限制（0=无限）', unit: 'ms'
    }, 'timeLimitMs');

    y = this.addSectionHeader(startX, y, '📄 描述');
    y = this.addDescriptionField(startX, y, contentW);

    const totalHeight = y - this.EDITOR_Y;
    this.editorMaxScrollY = Math.max(0, totalHeight - this.EDITOR_HEIGHT + 40);
    this.editorScrollY = Math.min(this.editorScrollY, this.editorMaxScrollY);
    this.updateEditorPositions();
  }

  private addSectionHeader(x: number, y: number, text: string): number {
    const label = this.add.text(x + 5, y + 4, text, {
      fontSize: '14px',
      color: '#ff99cc',
      fontStyle: 'bold'
    }).setOrigin(0, 0);
    const line = this.add.graphics();
    line.lineStyle(1, 0x444466, 0.6);
    line.lineBetween(x, y + 24, x + this.EDITOR_WIDTH - 20, y + 24);
    this.editorContainer.add([label, line]);
    return y + 32;
  }

  private addNameField(x: number, y: number, w: number): number {
    const label = this.add.text(x + 5, y, '挑战名称', {
      fontSize: '12px',
      color: '#aabbcc'
    }).setOrigin(0, 0);
    this.editorContainer.add(label);

    const fieldBg = this.add.graphics();
    fieldBg.fillStyle(0x1a1a3a, 1);
    fieldBg.fillRoundedRect(x, y + 18, w, 32, 6);
    fieldBg.lineStyle(1, 0x444477, 0.8);
    fieldBg.strokeRoundedRect(x, y + 18, w, 32, 6);
    this.editorContainer.add(fieldBg);

    const nameText = this.add.text(x + 12, y + 34, this.currentConfig.name, {
      fontSize: '15px',
      color: '#ffffff',
      fontStyle: 'bold',
      wordWrap: { width: w - 24 }
    }).setOrigin(0, 0.5);
    this.editorContainer.add(nameText);

    const editBtn = this.add.text(x + w - 12, y + 34, '✏️', {
      fontSize: '16px'
    }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true });
    this.editorContainer.add(editBtn);

    editBtn.on('pointerover', () => this.audioManager.play('hover'));
    editBtn.on('pointerdown', () => {
      this.audioManager.play('select');
      this.promptText('输入挑战名称', this.currentConfig.name, 20, (val) => {
        if (val && val.trim()) {
          this.currentConfig.name = val.trim();
          nameText.setText(this.currentConfig.name);
        }
      });
    });

    return y + 60;
  }

  private addDescriptionField(x: number, y: number, w: number): number {
    const fieldBg = this.add.graphics();
    fieldBg.fillStyle(0x1a1a3a, 1);
    fieldBg.fillRoundedRect(x, y, w, 55, 6);
    fieldBg.lineStyle(1, 0x444477, 0.8);
    fieldBg.strokeRoundedRect(x, y, w, 55, 6);
    this.editorContainer.add(fieldBg);

    const descText = this.add.text(x + 10, y + 8, this.currentConfig.description || '点击添加描述...', {
      fontSize: '12px',
      color: this.currentConfig.description ? '#ccccdd' : '#555577',
      wordWrap: { width: w - 20 }
    }).setOrigin(0, 0).setInteractive({ useHandCursor: true });
    this.editorContainer.add(descText);

    descText.on('pointerover', () => this.audioManager.play('hover'));
    descText.on('pointerdown', () => {
      this.audioManager.play('select');
      this.promptText('输入描述', this.currentConfig.description, 100, (val) => {
        this.currentConfig.description = val || '';
        descText.setText(this.currentConfig.description || '点击添加描述...');
        descText.setColor(this.currentConfig.description ? '#ccccdd' : '#555577');
      });
    });

    return y + 70;
  }

  private addSlider(_x: number, y: number, w: number, cfg: SliderConfig, key: string): number {
    const sliderX = cfg.x + 5;
    const sliderW = w - 10;

    const label = this.add.text(sliderX, y, cfg.label, {
      fontSize: '12px',
      color: '#aabbcc'
    }).setOrigin(0, 0);

    const valueText = this.add.text(sliderX + sliderW, y,
      cfg.step < 1 ? cfg.initialValue.toFixed(1) + (cfg.unit || '') : cfg.initialValue + (cfg.unit || ''),
      { fontSize: '12px', color: '#00ffff', fontStyle: 'bold' }
    ).setOrigin(1, 0);

    const trackY = y + 22;
    const trackH = 6;

    const trackBg = this.add.graphics();
    trackBg.fillStyle(0x222244, 1);
    trackBg.fillRoundedRect(sliderX, trackY, sliderW, trackH, 3);

    const ratio = (cfg.initialValue - cfg.min) / (cfg.max - cfg.min);
    const fillW = Math.max(0, ratio * sliderW);
    const trackFill = this.add.graphics();
    trackFill.fillStyle(0xff0066, 1);
    trackFill.fillRoundedRect(sliderX, trackY, fillW, trackH, 3);

    const thumbX = sliderX + fillW;
    const thumb = this.add.circle(thumbX, trackY + trackH / 2, 8, 0xffffff)
      .setStrokeStyle(2, 0xff0066)
      .setInteractive({ useHandCursor: true, draggable: true });

    this.sliderHandlers.set(key, {
      value: cfg.initialValue,
      onChange: (v: number) => {
        this.updateSliderValue(key, v, cfg, valueText, trackFill, thumb, sliderX, sliderW, trackY, trackH);
      }
    });

    thumb.on('pointerover', () => this.audioManager.play('hover'));

    this.input.setDraggable(thumb);
    thumb.on('drag', (_pointer: Phaser.Input.Pointer, dragX: number) => {
      const clampedX = Phaser.Math.Clamp(dragX, sliderX, sliderX + sliderW);
      const newRatio = (clampedX - sliderX) / sliderW;
      let newValue = cfg.min + newRatio * (cfg.max - cfg.min);
      if (cfg.step >= 1) {
        newValue = Math.round(newValue / cfg.step) * cfg.step;
      } else {
        newValue = Math.round(newValue / cfg.step) * cfg.step;
        newValue = parseFloat(newValue.toFixed(2));
      }
      newValue = Phaser.Math.Clamp(newValue, cfg.min, cfg.max);

      const handler = this.sliderHandlers.get(key);
      if (handler) {
        handler.value = newValue;
        handler.onChange(newValue);
      }

      this.applySliderValue(key, newValue);
    });

    this.editorContainer.add([label, valueText, trackBg, trackFill, thumb]);
    return y + 42;
  }

  private updateSliderValue(
    _key: string, value: number, cfg: SliderConfig,
    valueText: Phaser.GameObjects.Text, trackFill: Phaser.GameObjects.Graphics,
    thumb: Phaser.GameObjects.Arc, sliderX: number, sliderW: number, trackY: number, trackH: number
  ): void {
    valueText.setText(cfg.step < 1 ? value.toFixed(1) + (cfg.unit || '') : value + (cfg.unit || ''));
    const ratio = (value - cfg.min) / (cfg.max - cfg.min);
    const fillW = Math.max(0, ratio * sliderW);
    trackFill.clear();
    trackFill.fillStyle(0xff0066, 1);
    trackFill.fillRoundedRect(sliderX, trackY, fillW, trackH, 3);
    thumb.x = sliderX + fillW;
  }

  private applySliderValue(key: string, value: number): void {
    switch (key) {
      case 'floorDensity': this.currentConfig.floorDensity = value; break;
      case 'platformCountMin':
        this.currentConfig.platformCountMin = value;
        if (this.currentConfig.platformCountMax < value) {
          this.currentConfig.platformCountMax = value;
        }
        break;
      case 'platformCountMax':
        this.currentConfig.platformCountMax = value;
        if (this.currentConfig.platformCountMin > value) {
          this.currentConfig.platformCountMin = value;
        }
        break;
      case 'guardCount': this.currentConfig.guardCount = value; break;
      case 'guardSpeedMultiplier': this.currentConfig.guardSpeedMultiplier = value; break;
      case 'guardDetectionRange': this.currentConfig.guardDetectionRange = value; break;
      case 'guardSpawnInterval': this.currentConfig.guardSpawnInterval = value; break;
      case 'pillSpawnInterval': this.currentConfig.pillSpawnInterval = value; break;
      case 'maxPills': this.currentConfig.maxPills = value; break;
      case 'winConditionValue': this.currentConfig.winCondition.value = value; break;
      case 'timeLimitMs': this.currentConfig.timeLimitMs = value; break;
      default:
        if (key.startsWith('pill_')) {
          const pillType = key.replace('pill_', '');
          this.currentConfig.pillWeights[pillType] = value;
        }
        break;
    }
  }

  private addToggle(_x: number, y: number, w: number, cfg: ToggleConfig, key: string): number {
    const toggleX = cfg.x + 5;
    const toggleW = w - 10;

    const label = this.add.text(toggleX, y + 2, cfg.label, {
      fontSize: '13px',
      color: '#aabbcc'
    }).setOrigin(0, 0);

    const switchW = 44;
    const switchH = 22;
    const switchX = toggleX + toggleW - switchW;
    const switchY = y;

    const switchBg = this.add.graphics().setInteractive({ useHandCursor: true });
    const drawSwitch = (val: boolean) => {
      switchBg.clear();
      switchBg.fillStyle(val ? 0x00aa66 : 0x444466, 1);
      switchBg.fillRoundedRect(switchX, switchY, switchW, switchH, 11);
      const knobX = val ? switchX + switchW - switchH / 2 - 2 : switchX + switchH / 2 + 2;
      switchBg.fillStyle(0xffffff, 1);
      switchBg.fillCircle(knobX, switchY + switchH / 2, switchH / 2 - 3);
    };
    drawSwitch(cfg.initialValue);

    this.toggleHandlers.set(key, {
      value: cfg.initialValue,
      onChange: (v: boolean) => drawSwitch(v)
    });

    switchBg.on('pointerover', () => this.audioManager.play('hover'));
    switchBg.on('pointerdown', () => {
      this.audioManager.play('select');
      const handler = this.toggleHandlers.get(key);
      if (handler) {
        handler.value = !handler.value;
        handler.onChange(handler.value);
        this.applyToggleValue(key, handler.value);
      }
    });

    this.editorContainer.add([label, switchBg]);
    return y + 32;
  }

  private applyToggleValue(key: string, value: boolean): void {
    switch (key) {
      case 'loseOnGuardCollision': this.currentConfig.loseOnGuardCollision = value; break;
      case 'loseOnFall': this.currentConfig.loseOnFall = value; break;
      case 'enableDayNightCycle': this.currentConfig.enableDayNightCycle = value; break;
      case 'enableFloorEvents': this.currentConfig.enableFloorEvents = value; break;
      case 'enableSideEffects': this.currentConfig.enableSideEffects = value; break;
    }
  }

  private addWinConditionSelector(x: number, y: number, w: number): number {
    const label = this.add.text(x + 5, y, '胜利条件类型', {
      fontSize: '12px',
      color: '#aabbcc'
    }).setOrigin(0, 0);
    this.editorContainer.add(label);

    const conditions = [
      { type: WinConditionType.FLOOR_REACHED, label: '到达楼层', icon: '🏢' },
      { type: WinConditionType.SCORE_REACHED, label: '达到分数', icon: '🏆' },
      { type: WinConditionType.PILLS_COLLECTED, label: '收集药片', icon: '💊' },
      { type: WinConditionType.SURVIVAL_TIME, label: '存活时间', icon: '⏱️' }
    ];

    const btnW = (w - 15) / 2;
    const btnH = 28;

    conditions.forEach((cond, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const bx = x + 5 + col * (btnW + 5);
      const by = y + 20 + row * (btnH + 5);
      const isSelected = this.currentConfig.winCondition.type === cond.type;

      const btnBg = this.add.graphics().setInteractive({ useHandCursor: true });
      const drawBtn = (active: boolean, hover: boolean) => {
        btnBg.clear();
        btnBg.fillStyle(active ? 0xff0066 : (hover ? 0x333366 : 0x1e1e3e), 1);
        btnBg.fillRoundedRect(bx, by, btnW, btnH, 6);
        if (active) btnBg.lineStyle(2, 0xff99cc, 1);
        else btnBg.lineStyle(1, 0x3a3a5a, 0.6);
        btnBg.strokeRoundedRect(bx, by, btnW, btnH, 6);
      };
      drawBtn(isSelected, false);

      const btnText = this.add.text(bx + btnW / 2, by + btnH / 2, `${cond.icon} ${cond.label}`, {
        fontSize: '11px',
        color: isSelected ? '#ffffff' : '#aabbcc',
        fontStyle: 'bold'
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      btnBg.on('pointerover', () => { drawBtn(isSelected, true); btnText.setColor('#ffffff'); this.audioManager.play('hover'); });
      btnBg.on('pointerout', () => { drawBtn(isSelected, false); btnText.setColor(isSelected ? '#ffffff' : '#aabbcc'); });
      btnText.on('pointerover', () => { drawBtn(isSelected, true); btnText.setColor('#ffffff'); this.audioManager.play('hover'); });
      btnText.on('pointerout', () => { drawBtn(isSelected, false); btnText.setColor(isSelected ? '#ffffff' : '#aabbcc'); });

      const selectFn = () => {
        if (this.currentConfig.winCondition.type === cond.type) return;
        this.audioManager.play('select');
        this.currentConfig.winCondition.type = cond.type;
        if (cond.type === WinConditionType.SURVIVAL_TIME) {
          this.currentConfig.winCondition.value = this.currentConfig.winCondition.value * 1000 || 60000;
        }
        this.refreshEditor();
      };
      btnBg.on('pointerdown', selectFn);
      btnText.on('pointerdown', selectFn);

      this.editorContainer.add([btnBg, btnText]);
    });

    return y + 20 + Math.ceil(conditions.length / 2) * (btnH + 5) + 8;
  }

  private updateEditorPositions(): void {
    const children = this.editorContainer.getAll();
    children.forEach((child) => {
      const gameObj = child as Phaser.GameObjects.GameObject;
      const originalY = (gameObj as any)._origY;
      if (originalY === undefined) {
        (gameObj as any)._origY = (gameObj as any).y;
      } else {
        (gameObj as any).y = originalY - this.editorScrollY;
      }
    });

    const barX = this.EDITOR_X + this.EDITOR_WIDTH - 4;
    const barY = this.EDITOR_Y;
    const barW = 3;
    const barH = this.EDITOR_HEIGHT;
    let thumbH = barH;
    let thumbY = barY;
    if (this.editorMaxScrollY > 0) {
      const ratio = barH / (barH + this.editorMaxScrollY);
      thumbH = Math.max(20, barH * ratio);
      thumbY = barY + (this.editorScrollY / this.editorMaxScrollY) * (barH - thumbH);
    }

    let scrollbar = this.editorContainer.getByName('__editorScrollbar') as Phaser.GameObjects.Graphics;
    if (!scrollbar) {
      scrollbar = this.add.graphics().setDepth(5);
      scrollbar.setName('__editorScrollbar');
      this.editorContainer.add(scrollbar);
    }
    scrollbar.clear();
    scrollbar.fillStyle(0x222244, 0.5);
    scrollbar.fillRect(barX, barY, barW, barH);
    scrollbar.fillStyle(0x00aaff, 0.8);
    scrollbar.fillRect(barX, thumbY, barW, thumbH);
  }

  private createBottomButtons(): void {
    const btnY = GameConfig.height - 40;

    const newBtn = this.createBottomButton(60, btnY, '➕ 新建', '#ff9900', () => {
      this.audioManager.play('select');
      this.currentConfig = this.presetManager.createEmptyConfig();
      this.selectedPresetId = null;
      this.editorScrollY = 0;
      this.refreshPresetList();
      this.refreshEditor();
      this.showToast('已创建新预设', '#ff9900');
    });

    const saveBtn = this.createBottomButton(160, btnY, '💾 保存', '#00cc66', () => {
      this.audioManager.play('select');
      this.validateAndSave();
    });

    const delBtn = this.createBottomButton(260, btnY, '🗑️ 删除', '#ff4466', () => {
      this.audioManager.play('select');
      this.deleteCurrentPreset();
    });

    const startBtn = this.createBottomButton(360, btnY, '▶️ 开始', '#ff0066', () => {
      this.audioManager.play('select');
      this.startChallenge();
    });

    const backBtn = this.createBottomButton(430, btnY, '←', '#666688', () => {
      this.audioManager.play('select');
      this.scene.start('MenuScene');
    });

    this.add.existing(newBtn);
    this.add.existing(saveBtn);
    this.add.existing(delBtn);
    this.add.existing(startBtn);
    this.add.existing(backBtn);
  }

  private createBottomButton(x: number, y: number, text: string, color: string, onClick: () => void): Phaser.GameObjects.Text {
    const btn = this.add.text(x, y, text, {
      fontSize: '14px',
      color: '#ffffff',
      backgroundColor: color,
      padding: { left: 12, right: 12, top: 8, bottom: 8 },
      fontStyle: 'bold'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(20);

    const origColor = color;
    btn.on('pointerover', () => {
      btn.setBackgroundColor(this.lightenColor(origColor, 30));
      this.audioManager.play('hover');
    });
    btn.on('pointerout', () => {
      btn.setBackgroundColor(origColor);
    });
    btn.on('pointerdown', onClick);
    return btn;
  }

  private lightenColor(hex: string, percent: number): string {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.min(255, (num >> 16) + percent);
    const g = Math.min(255, ((num >> 8) & 0x00FF) + percent);
    const b = Math.min(255, (num & 0x0000FF) + percent);
    return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
  }

  private validateAndSave(): void {
    if (!this.currentConfig.name || !this.currentConfig.name.trim()) {
      this.showToast('请输入挑战名称', '#ff6666');
      return;
    }
    if (this.currentConfig.platformCountMin > this.currentConfig.platformCountMax) {
      this.showToast('最少平台数不能大于最多', '#ff6666');
      return;
    }
    const totalWeight = Object.values(this.currentConfig.pillWeights).reduce((a, b) => a + b, 0);
    if (totalWeight <= 0) {
      this.showToast('至少需要一种药片权重大于0', '#ff6666');
      return;
    }

    const saved = this.presetManager.savePreset(this.currentConfig);
    this.currentConfig = saved;
    this.selectedPresetId = saved.id;
    this.refreshPresetList();
    this.showToast('预设已保存！', '#00ff88');
  }

  private deleteCurrentPreset(): void {
    if (!this.selectedPresetId) {
      this.showToast('请先选择要删除的预设', '#ff6666');
      return;
    }
    if (this.presetManager.isDefaultPreset(this.selectedPresetId)) {
      this.showToast('默认预设不能删除', '#ff6666');
      return;
    }

    if (this.presetManager.deletePreset(this.selectedPresetId)) {
      this.showToast('预设已删除', '#ff9900');
      this.currentConfig = this.presetManager.createEmptyConfig();
      this.selectedPresetId = null;
      this.editorScrollY = 0;
      this.refreshPresetList();
      this.refreshEditor();
    } else {
      this.showToast('删除失败', '#ff6666');
    }
  }

  private startChallenge(): void {
    const totalWeight = Object.values(this.currentConfig.pillWeights).reduce((a, b) => a + b, 0);
    if (totalWeight <= 0) {
      this.showToast('至少需要一种药片权重大于0', '#ff6666');
      return;
    }
    this.scene.start('GameScene', { challengeConfig: this.currentConfig });
  }

  private promptText(title: string, defaultValue: string, maxLength: number, callback: (value: string) => void): void {
    const overlay = this.add.graphics().setDepth(50);
    overlay.fillStyle(0x000000, 0.7);
    overlay.fillRect(0, 0, GameConfig.width, GameConfig.height);

    const panel = this.add.graphics().setDepth(51);
    const pw = 320;
    const ph = 160;
    const px = (GameConfig.width - pw) / 2;
    const py = (GameConfig.height - ph) / 2;
    panel.fillStyle(0x151530, 1);
    panel.fillRoundedRect(px, py, pw, ph, 12);
    panel.lineStyle(2, 0xff0066, 0.8);
    panel.strokeRoundedRect(px, py, pw, ph, 12);

    const titleText = this.add.text(GameConfig.width / 2, py + 25, title, {
      fontSize: '16px',
      color: '#ff6699',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(52);

    let currentValue = defaultValue || '';

    const inputBg = this.add.graphics().setDepth(51);
    inputBg.fillStyle(0x0a0a20, 1);
    inputBg.fillRoundedRect(px + 20, py + 55, pw - 40, 36, 6);
    inputBg.lineStyle(1, 0x444477, 0.8);
    inputBg.strokeRoundedRect(px + 20, py + 55, pw - 40, 36, 6);

    const inputText = this.add.text(px + 30, py + 73, currentValue, {
      fontSize: '16px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0, 0.5).setDepth(52);

    const hintText = this.add.text(GameConfig.width / 2, py + 110, '使用物理键盘输入，Enter确认，Esc取消', {
      fontSize: '11px',
      color: '#666688'
    }).setOrigin(0.5).setDepth(52);

    const okBtn = this.add.text(px + pw / 2 - 55, py + 135, '✓ 确认', {
      fontSize: '13px',
      color: '#ffffff',
      backgroundColor: '#00cc66',
      padding: { left: 18, right: 18, top: 6, bottom: 6 },
      fontStyle: 'bold'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(52);

    const cancelBtn = this.add.text(px + pw / 2 + 55, py + 135, '✕ 取消', {
      fontSize: '13px',
      color: '#ffffff',
      backgroundColor: '#555577',
      padding: { left: 18, right: 18, top: 6, bottom: 6 },
      fontStyle: 'bold'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(52);

    const cleanup = () => {
      overlay.destroy();
      panel.destroy();
      titleText.destroy();
      inputBg.destroy();
      inputText.destroy();
      hintText.destroy();
      okBtn.destroy();
      cancelBtn.destroy();
      this.input.keyboard!.removeAllListeners();
    };

    const submit = () => {
      callback(currentValue);
      cleanup();
    };
    const cancel = () => cleanup();

    okBtn.on('pointerover', () => { okBtn.setBackgroundColor('#00ee77'); this.audioManager.play('hover'); });
    okBtn.on('pointerout', () => okBtn.setBackgroundColor('#00cc66'));
    okBtn.on('pointerdown', () => { this.audioManager.play('select'); submit(); });

    cancelBtn.on('pointerover', () => { cancelBtn.setBackgroundColor('#666688'); this.audioManager.play('hover'); });
    cancelBtn.on('pointerout', () => cancelBtn.setBackgroundColor('#555577'));
    cancelBtn.on('pointerdown', () => { this.audioManager.play('select'); cancel(); });

    this.input.keyboard!.on('keydown', (event: KeyboardEvent) => {
      if (event.key === 'Enter') { submit(); return; }
      if (event.key === 'Escape') { cancel(); return; }
      if (event.key === 'Backspace') {
        currentValue = currentValue.slice(0, -1);
      } else if (event.key.length === 1 && currentValue.length < maxLength) {
        currentValue += event.key;
      }
      inputText.setText(currentValue);
    });
  }
}
