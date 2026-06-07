import Phaser from 'phaser';
import { GameConfig } from '../config/GameConfig';
import { Chapters } from '../config/StoryConfig';
import { StoryManager } from '../utils/StoryManager';
import { AudioManager } from '../audio/AudioManager';

export class ChapterSelectScene extends Phaser.Scene {
  private storyManager!: StoryManager;
  private audioManager!: AudioManager;

  constructor() {
    super('ChapterSelectScene');
  }

  create(): void {
    this.storyManager = StoryManager.getInstance();
    this.audioManager = AudioManager.getInstance();

    this.cameras.main.setBackgroundColor('#0a0a1a');
    this.createBackground();

    this.add.text(GameConfig.width / 2, 50, '🎬 危机逃生', {
      fontSize: '32px',
      color: '#ff6699',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(GameConfig.width / 2, 85, '剧情模式', {
      fontSize: '16px',
      color: '#66ccff'
    }).setOrigin(0.5);

    this.createChapterList();
    this.createBackButton();
    this.createStatsDisplay();
  }

  private createBackground(): void {
    for (let i = 0; i < 15; i++) {
      const x = Phaser.Math.Between(30, GameConfig.width - 30);
      const y = Phaser.Math.Between(0, GameConfig.height);
      const type = Phaser.Math.Between(0, 1) === 0 ? 'neon-pink' : 'neon-cyan';
      const light = this.add.image(x, y, type);
      light.setAlpha(Phaser.Math.FloatBetween(0.2, 0.5));
      light.setScale(Phaser.Math.FloatBetween(0.4, 1.0));
    }
  }

  private createChapterList(): void {
    const startY = 130;
    const gap = 170;

    Chapters.forEach((chapter, index) => {
      this.createChapterCard(chapter, index, startY + index * gap);
    });
  }

  private createChapterCard(chapter: any, _index: number, y: number): void {
    const unlocked = this.storyManager.isChapterUnlocked(chapter.id);
    const completed = this.storyManager.isChapterCompleted(chapter.id);
    const bestScore = this.storyManager.getChapterScore(chapter.id);
    const bestFloor = this.storyManager.getChapterBestFloor(chapter.id);

    const cardW = GameConfig.width - 60;
    const cardH = 140;

    const card = this.add.graphics();
    const bgColor = unlocked ? (completed ? 0x1a3a2a : 0x1a2a3a) : 0x1a1a1a;
    card.fillStyle(bgColor, 0.9);
    card.fillRoundedRect(30, y, cardW, cardH, 10);

    if (completed) {
      card.lineStyle(3, 0x00ff88, 0.8);
    } else if (unlocked) {
      card.lineStyle(2, 0x6699ff, 0.6);
    } else {
      card.lineStyle(2, 0x444466, 0.5);
    }
    card.strokeRoundedRect(30, y, cardW, cardH, 10);

    this.add.text(60, y + cardH / 2, chapter.icon, {
      fontSize: '42px'
    }).setOrigin(0, 0.5);

    const titleColor = unlocked ? '#ffffff' : '#666666';
    this.add.text(120, y + 25, `${chapter.title} · ${chapter.subtitle}`, {
      fontSize: '18px',
      color: titleColor,
      fontStyle: 'bold'
    }).setOrigin(0, 0.5);

    const descColor = unlocked ? '#aabbcc' : '#555566';
    this.add.text(120, y + 55, chapter.description, {
      fontSize: '11px',
      color: descColor,
      wordWrap: { width: cardW - 110 }
    }).setOrigin(0, 0);

    const targetColor = unlocked ? '#ffcc66' : '#555555';
    this.add.text(120, y + 95, `目标: 到达 ${chapter.targetFloor}F`, {
      fontSize: '12px',
      color: targetColor
    }).setOrigin(0, 0);

    const bossInfo = chapter.bossConfig;
    if (bossInfo) {
      const bossColor = unlocked ? '#ff9999' : '#555555';
      this.add.text(GameConfig.width - 45, y + 25, `${bossInfo.icon} ${bossInfo.name}`, {
        fontSize: '12px',
        color: bossColor
      }).setOrigin(1, 0.5);
    }

    if (unlocked && completed) {
      this.add.text(GameConfig.width - 45, y + 95, `最佳:${bestScore}分 | ${bestFloor}F`, {
        fontSize: '11px',
        color: '#66ff99'
      }).setOrigin(1, 0);
    } else if (!unlocked) {
      this.add.text(GameConfig.width / 2, y + cardH - 25, '🔒 未解锁', {
        fontSize: '13px',
        color: '#888888'
      }).setOrigin(0.5);
    } else {
      this.add.text(GameConfig.width / 2, y + cardH - 25, '▶ 点击开始', {
        fontSize: '13px',
        color: '#66ccff'
      }).setOrigin(0.5);
    }

    if (unlocked) {
      card.setInteractive(new Phaser.Geom.Rectangle(30, y, cardW, cardH), Phaser.Geom.Rectangle.Contains);

      card.on('pointerover', () => {
        card.clear();
        card.fillStyle(completed ? 0x2a4a3a : 0x2a3a4a, 0.9);
        card.fillRoundedRect(30, y, cardW, cardH, 10);
        if (completed) {
          card.lineStyle(3, 0x00ff88, 1);
        } else {
          card.lineStyle(2, 0x6699ff, 1);
        }
        card.strokeRoundedRect(30, y, cardW, cardH, 10);
        this.audioManager.play('hover');
      });

      card.on('pointerout', () => {
        card.clear();
        card.fillStyle(bgColor, 0.9);
        card.fillRoundedRect(30, y, cardW, cardH, 10);
        if (completed) {
          card.lineStyle(3, 0x00ff88, 0.8);
        } else {
          card.lineStyle(2, 0x6699ff, 0.6);
        }
        card.strokeRoundedRect(30, y, cardW, cardH, 10);
      });

      card.on('pointerdown', () => {
        this.audioManager.play('select');
        this.startChapter(chapter.id);
      });
    }
  }

  private startChapter(chapterId: number): void {
    this.storyManager.setCurrentChapter(chapterId);
    const chapter = this.storyManager.getChapterConfig(chapterId);

    if (chapter?.introCutsceneId) {
      this.scene.start('CutsceneScene', {
        cutsceneId: chapter.introCutsceneId,
        nextScene: 'StoryGameScene',
        nextSceneData: { chapterId }
      });
    } else {
      this.scene.start('StoryGameScene', { chapterId });
    }
  }

  private createStatsDisplay(): void {
    const totalScore = this.storyManager.getTotalStoryScore();
    const totalDeaths = this.storyManager.getTotalDeaths();
    const allCompleted = this.storyManager.isAllChaptersCompleted();
    const completedCount = Chapters.filter(c => this.storyManager.isChapterCompleted(c.id)).length;

    const y = GameConfig.height - 75;

    this.add.text(GameConfig.width / 2, y, `进度: ${completedCount}/${Chapters.length} | 总分:${totalScore} | 死亡:${totalDeaths}`, {
      fontSize: '12px',
      color: allCompleted ? '#66ff99' : '#aabbcc'
    }).setOrigin(0.5);

    if (allCompleted) {
      this.add.text(GameConfig.width / 2, y + 20, '🎉 全部通关！', {
        fontSize: '14px',
        color: '#ffcc00',
        fontStyle: 'bold'
      }).setOrigin(0.5);
    }
  }

  private createBackButton(): void {
    const backBtn = this.add.text(20, 20, '← 返回菜单', {
      fontSize: '14px',
      color: '#ffffff',
      backgroundColor: '#444466',
      padding: { left: 12, right: 12, top: 5, bottom: 5 }
    }).setOrigin(0, 0).setInteractive({ useHandCursor: true });

    backBtn.on('pointerover', () => {
      backBtn.setBackgroundColor('#555588');
      this.audioManager.play('hover');
    });
    backBtn.on('pointerout', () => backBtn.setBackgroundColor('#444466'));
    backBtn.on('pointerdown', () => {
      this.audioManager.play('select');
      this.scene.start('MenuScene');
    });

    const resetBtn = this.add.text(GameConfig.width - 20, 20, '重置进度', {
      fontSize: '12px',
      color: '#ff8888',
      backgroundColor: '#442222',
      padding: { left: 10, right: 10, top: 4, bottom: 4 }
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true });

    resetBtn.on('pointerover', () => {
      resetBtn.setBackgroundColor('#663333');
      this.audioManager.play('hover');
    });
    resetBtn.on('pointerout', () => resetBtn.setBackgroundColor('#442222'));
    resetBtn.on('pointerdown', () => {
      this.showResetConfirm();
    });
  }

  private showResetConfirm(): void {
    const overlay = this.add.graphics().setDepth(100);
    overlay.fillStyle(0x000000, 0.85);
    overlay.fillRect(0, 0, GameConfig.width, GameConfig.height);

    const panel = this.add.graphics().setDepth(101);
    const pw = 280, ph = 140;
    const px = (GameConfig.width - pw) / 2, py = (GameConfig.height - ph) / 2;
    panel.fillStyle(0x1a0a0a, 1);
    panel.fillRoundedRect(px, py, pw, ph, 10);
    panel.lineStyle(2, 0xff4444, 0.8);
    panel.strokeRoundedRect(px, py, pw, ph, 10);

    this.add.text(GameConfig.width / 2, py + 35, '确认重置剧情进度?', {
      fontSize: '16px',
      color: '#ff6666',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(102);

    this.add.text(GameConfig.width / 2, py + 65, '所有章节进度将丢失', {
      fontSize: '11px',
      color: '#888888'
    }).setOrigin(0.5).setDepth(102);

    const confirmBtn = this.add.text(GameConfig.width / 2 - 60, py + 105, '确认重置', {
      fontSize: '13px',
      color: '#ffffff',
      backgroundColor: '#aa2222',
      padding: { left: 12, right: 12, top: 5, bottom: 5 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(102);

    const cancelBtn = this.add.text(GameConfig.width / 2 + 60, py + 105, '取消', {
      fontSize: '13px',
      color: '#ffffff',
      backgroundColor: '#444466',
      padding: { left: 16, right: 16, top: 5, bottom: 5 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(102);

    const closeAll = () => {
      overlay.destroy(); panel.destroy(); confirmBtn.destroy(); cancelBtn.destroy();
    };

    confirmBtn.on('pointerover', () => { confirmBtn.setBackgroundColor('#cc3333'); this.audioManager.play('hover'); });
    confirmBtn.on('pointerout', () => confirmBtn.setBackgroundColor('#aa2222'));
    confirmBtn.on('pointerdown', () => {
      this.audioManager.play('select');
      this.storyManager.resetStoryProgress();
      closeAll();
      this.scene.restart();
    });

    cancelBtn.on('pointerover', () => { cancelBtn.setBackgroundColor('#555588'); this.audioManager.play('hover'); });
    cancelBtn.on('pointerout', () => cancelBtn.setBackgroundColor('#444466'));
    cancelBtn.on('pointerdown', () => {
      this.audioManager.play('select');
      closeAll();
    });
  }
}
