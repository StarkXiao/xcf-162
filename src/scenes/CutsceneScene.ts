import Phaser from 'phaser';
import { GameConfig } from '../config/GameConfig';
import { Cutscenes, CutsceneData } from '../config/StoryConfig';
import { AudioManager } from '../audio/AudioManager';

export class CutsceneScene extends Phaser.Scene {
  private audioManager!: AudioManager;
  private cutsceneId!: string;
  private nextScene!: string;
  private nextSceneData?: any;
  private currentLineIndex: number = 0;
  private isTyping: boolean = false;
  private typewriterTimer!: Phaser.Time.TimerEvent;
  private displayedText: string = '';
  private fullText: string = '';
  private speakerText!: Phaser.GameObjects.Text;
  private dialogueText!: Phaser.GameObjects.Text;
  private continueIndicator!: Phaser.GameObjects.Text;
  private cutsceneData!: CutsceneData;
  private skipBtn!: Phaser.GameObjects.Text;
  private isAutoPlay: boolean = false;

  constructor() {
    super('CutsceneScene');
  }

  init(data: { cutsceneId: string; nextScene: string; nextSceneData?: any }): void {
    this.cutsceneId = data.cutsceneId;
    this.nextScene = data.nextScene;
    this.nextSceneData = data.nextSceneData;
  }

  create(): void {
    this.audioManager = AudioManager.getInstance();
    this.cutsceneData = Cutscenes[this.cutsceneId];

    if (!this.cutsceneData) {
      this.goToNextScene();
      return;
    }

    const bgColor = this.cutsceneData.background || 0x0a0a1a;
    this.cameras.main.setBackgroundColor(bgColor);

    this.createUI();
    this.currentLineIndex = 0;
    this.showLine();

    this.input.keyboard!.on('keydown-SPACE', () => this.onAdvance());
    this.input.keyboard!.on('keydown-ENTER', () => this.onAdvance());
    this.input.on('pointerdown', () => this.onAdvance());
  }

  private createUI(): void {
    const panelY = GameConfig.height - 200;
    const panel = this.add.graphics();
    panel.fillStyle(0x0a0a1a, 0.95);
    panel.fillRoundedRect(15, panelY, GameConfig.width - 30, 185, 12);
    panel.lineStyle(2, 0x6644aa, 0.8);
    panel.strokeRoundedRect(15, panelY, GameConfig.width - 30, 185, 12);
    panel.setScrollFactor(0).setDepth(5);

    this.speakerText = this.add.text(35, panelY + 20, '', {
      fontSize: '18px',
      color: '#ff99cc',
      fontStyle: 'bold'
    }).setOrigin(0, 0).setScrollFactor(0).setDepth(6);

    this.dialogueText = this.add.text(35, panelY + 55, '', {
      fontSize: '16px',
      color: '#ffffff',
      wordWrap: { width: GameConfig.width - 70 }
    }).setOrigin(0, 0).setScrollFactor(0).setDepth(6);

    this.continueIndicator = this.add.text(GameConfig.width - 40, panelY + 165, '▼', {
      fontSize: '14px',
      color: '#ffcc66'
    }).setOrigin(1, 0.5).setScrollFactor(0).setDepth(6);

    this.tweens.add({
      targets: this.continueIndicator,
      y: panelY + 170,
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    this.add.text(GameConfig.width / 2, 30, '点击/空格 继续', {
      fontSize: '11px',
      color: '#888888'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(6);

    this.skipBtn = this.add.text(GameConfig.width - 20, 20, '跳过', {
      fontSize: '13px',
      color: '#aaaaaa',
      backgroundColor: '#333355',
      padding: { left: 10, right: 10, top: 4, bottom: 4 }
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true }).setScrollFactor(0).setDepth(6);

    this.skipBtn.on('pointerover', () => {
      this.skipBtn.setColor('#ffffff');
      this.skipBtn.setBackgroundColor('#555577');
      this.audioManager.play('hover');
    });
    this.skipBtn.on('pointerout', () => {
      this.skipBtn.setColor('#aaaaaa');
      this.skipBtn.setBackgroundColor('#333355');
    });
    this.skipBtn.on('pointerdown', () => {
      this.audioManager.play('select');
      this.goToNextScene();
    });
  }

  private showLine(): void {
    if (this.currentLineIndex >= this.cutsceneData.lines.length) {
      this.goToNextScene();
      return;
    }

    const line = this.cutsceneData.lines[this.currentLineIndex];
    this.speakerText.setText(line.speaker + ':');
    this.speakerText.setColor(line.color || '#ffffff');

    this.fullText = line.text;
    this.displayedText = '';
    this.dialogueText.setText('');
    this.isTyping = true;
    this.continueIndicator.setVisible(false);

    if (this.typewriterTimer) this.typewriterTimer.destroy();

    let charIndex = 0;
    this.typewriterTimer = this.time.addEvent({
      delay: 40,
      callback: () => {
        if (charIndex < this.fullText.length) {
          this.displayedText += this.fullText.charAt(charIndex);
          this.dialogueText.setText(this.displayedText);
          charIndex++;
          if (charIndex % 2 === 0) {
            this.audioManager.play('hover');
          }
        } else {
          this.typewriterTimer.destroy();
          this.isTyping = false;
          this.continueIndicator.setVisible(true);
          const autoDelay = line.delay || 2000;
          if (this.isAutoPlay) {
            this.time.delayedCall(autoDelay, () => {
              if (!this.isTyping) this.onAdvance();
            });
          }
        }
      },
      callbackScope: this,
      loop: true
    });
  }

  private onAdvance(): void {
    if (this.isTyping) {
      this.typewriterTimer?.destroy();
      this.displayedText = this.fullText;
      this.dialogueText.setText(this.displayedText);
      this.isTyping = false;
      this.continueIndicator.setVisible(true);
      return;
    }

    this.audioManager.play('select');
    this.currentLineIndex++;
    this.showLine();
  }

  private goToNextScene(): void {
    if (this.typewriterTimer) this.typewriterTimer.destroy();
    this.cameras.main.fade(400, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start(this.nextScene, this.nextSceneData || {});
    });
  }
}
