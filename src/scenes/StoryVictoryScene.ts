import Phaser from 'phaser';
import { GameConfig } from '../config/GameConfig';
import { StoryManager } from '../utils/StoryManager';
import { AudioManager } from '../audio/AudioManager';
import { LeaderboardManager } from '../utils/LeaderboardManager';
import { LeaderboardGameMode } from '../types';
import { StoryConfig } from '../config/StoryConfig';

export class StoryVictoryScene extends Phaser.Scene {
  private storyManager!: StoryManager;
  private audioManager!: AudioManager;
  private leaderboardManager!: LeaderboardManager;
  private chapterId!: number;
  private score!: number;
  private floor!: number;
  private pills!: number;
  private clearTimeMs: number = 0;
  private maxCombo: number = 0;
  private maxAddiction: number = 0;
  private hallucinations: number = 0;
  private lossOfControl: number = 0;

  constructor() {
    super('StoryVictoryScene');
  }

  init(data: {
    chapterId: number;
    score: number;
    floor: number;
    pills: number;
    clearTimeMs?: number;
    maxCombo?: number;
    maxAddiction?: number;
    hallucinations?: number;
    lossOfControl?: number;
  }): void {
    this.storyManager = StoryManager.getInstance();
    this.audioManager = AudioManager.getInstance();
    this.leaderboardManager = LeaderboardManager.getInstance();
    this.chapterId = data.chapterId;
    this.score = data.score;
    this.floor = data.floor;
    this.pills = data.pills;
    this.clearTimeMs = data.clearTimeMs || 0;
    this.maxCombo = data.maxCombo || 0;
    this.maxAddiction = data.maxAddiction || 0;
    this.hallucinations = data.hallucinations || 0;
    this.lossOfControl = data.lossOfControl || 0;
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#0a1a1a');

    this.submitToLeaderboard();

    const chapter = this.storyManager.getChapterConfig(this.chapterId);

    this.add.text(GameConfig.width / 2, 80, '🎉 章节通关!', {
      fontSize: '40px',
      color: '#00ff88',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(GameConfig.width / 2, 130, `${chapter?.title || ''} · ${chapter?.subtitle || ''}`, {
      fontSize: '20px',
      color: '#ffcc66',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const panel = this.add.graphics();
    const pw = 360, ph = 280;
    const px = (GameConfig.width - pw) / 2, py = 170;
    panel.fillStyle(0x0f1f1f, 0.95);
    panel.fillRoundedRect(px, py, pw, ph, 12);
    panel.lineStyle(3, 0x00ff88, 0.8);
    panel.strokeRoundedRect(px, py, pw, ph, 12);

    const bestScore = this.storyManager.getChapterScore(this.chapterId);
    const bestFloor = this.storyManager.getChapterBestFloor(this.chapterId);
    const isNewBest = this.score >= bestScore;

    const stats = [
      { label: '最终得分', value: `${this.score}分`, color: '#ffcc00', highlight: isNewBest },
      { label: '到达楼层', value: `${this.floor}F`, color: '#66ccff', highlight: this.floor >= bestFloor },
      { label: '收集药片', value: `${this.pills}`, color: '#ff66ff' },
      { label: '章节最高分', value: `${bestScore}分`, color: '#aaffaa' },
      { label: '章节最高层', value: `${bestFloor}F`, color: '#aaccff' }
    ];

    stats.forEach((s, i) => {
      const y = py + 40 + i * 36;
      this.add.text(px + 30, y, s.label, {
        fontSize: '15px',
        color: '#aabbcc'
      }).setOrigin(0, 0);
      const val = this.add.text(px + pw - 30, y, s.value + (s.highlight ? '  NEW!' : ''), {
        fontSize: '15px',
        color: s.color,
        fontStyle: 'bold'
      }).setOrigin(1, 0);
      if (s.highlight) {
        this.tweens.add({
          targets: val,
          scale: { from: 1, to: 1.1 },
          duration: 600,
          yoyo: true,
          repeat: -1
        });
      }
    });

    const totalScore = this.storyManager.getTotalStoryScore();
    this.add.text(GameConfig.width / 2, py + ph + 25, `剧情总分: ${totalScore}`, {
      fontSize: '16px',
      color: '#ffcc00',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const allCompleted = this.storyManager.isAllChaptersCompleted();
    const isLast = this.chapterId >= StoryConfig.totalChapters;

    if (isLast && allCompleted) {
      this.add.text(GameConfig.width / 2, py + ph + 55, '🏆 恭喜通关全部章节！', {
        fontSize: '18px',
        color: '#ffcc00',
        fontStyle: 'bold'
      }).setOrigin(0.5);
      this.tweens.add({
        targets: this.add.text(GameConfig.width / 2, py + ph + 80, '🎬 你是真正的逃生大师！', {
          fontSize: '14px',
          color: '#ffffff'
        }).setOrigin(0.5),
        alpha: { from: 0.5, to: 1 },
        duration: 800,
        yoyo: true,
        repeat: -1
      });
    }

    const btnY = isLast && allCompleted ? py + ph + 120 : py + ph + 70;

    if (!isLast) {
      const nextBtn = this.add.text(GameConfig.width / 2 - 90, btnY, '▶ 下一章', {
        fontSize: '16px',
        color: '#ffffff',
        backgroundColor: '#00aa66',
        padding: { left: 20, right: 20, top: 10, bottom: 10 },
        fontStyle: 'bold'
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      nextBtn.on('pointerover', () => { nextBtn.setBackgroundColor('#00cc77'); this.audioManager.play('hover'); });
      nextBtn.on('pointerout', () => nextBtn.setBackgroundColor('#00aa66'));
      nextBtn.on('pointerdown', () => {
        this.audioManager.play('select');
        const nextId = this.chapterId + 1;
        this.storyManager.setCurrentChapter(nextId);
        const nextChapter = this.storyManager.getChapterConfig(nextId);
        if (nextChapter?.introCutsceneId) {
          this.scene.start('CutsceneScene', {
            cutsceneId: nextChapter.introCutsceneId,
            nextScene: 'StoryGameScene',
            nextSceneData: { chapterId: nextId }
          });
        } else {
          this.scene.start('StoryGameScene', { chapterId: nextId });
        }
      });

      const retryBtn = this.add.text(GameConfig.width / 2 + 90, btnY, '↻ 重玩', {
        fontSize: '15px',
        color: '#ffffff',
        backgroundColor: '#4466aa',
        padding: { left: 18, right: 18, top: 9, bottom: 9 }
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      retryBtn.on('pointerover', () => { retryBtn.setBackgroundColor('#5577bb'); this.audioManager.play('hover'); });
      retryBtn.on('pointerout', () => retryBtn.setBackgroundColor('#4466aa'));
      retryBtn.on('pointerdown', () => {
        this.audioManager.play('select');
        this.scene.start('StoryGameScene', { chapterId: this.chapterId });
      });

      const backBtn = this.add.text(GameConfig.width / 2, btnY + 55, '← 章节选择', {
        fontSize: '14px',
        color: '#ffffff',
        backgroundColor: '#555577',
        padding: { left: 20, right: 20, top: 8, bottom: 8 }
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      backBtn.on('pointerover', () => { backBtn.setBackgroundColor('#666688'); this.audioManager.play('hover'); });
      backBtn.on('pointerout', () => backBtn.setBackgroundColor('#555577'));
      backBtn.on('pointerdown', () => {
        this.audioManager.play('select');
        this.scene.start('ChapterSelectScene');
      });
    } else {
      const retryBtn = this.add.text(GameConfig.width / 2 - 90, btnY, '↻ 重玩本章', {
        fontSize: '15px',
        color: '#ffffff',
        backgroundColor: '#4466aa',
        padding: { left: 16, right: 16, top: 9, bottom: 9 }
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      retryBtn.on('pointerover', () => { retryBtn.setBackgroundColor('#5577bb'); this.audioManager.play('hover'); });
      retryBtn.on('pointerout', () => retryBtn.setBackgroundColor('#4466aa'));
      retryBtn.on('pointerdown', () => {
        this.audioManager.play('select');
        this.scene.start('StoryGameScene', { chapterId: this.chapterId });
      });

      const backBtn = this.add.text(GameConfig.width / 2 + 90, btnY, '← 章节选择', {
        fontSize: '14px',
        color: '#ffffff',
        backgroundColor: '#555577',
        padding: { left: 16, right: 16, top: 8, bottom: 8 }
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      backBtn.on('pointerover', () => { backBtn.setBackgroundColor('#666688'); this.audioManager.play('hover'); });
      backBtn.on('pointerout', () => backBtn.setBackgroundColor('#555577'));
      backBtn.on('pointerdown', () => {
        this.audioManager.play('select');
        this.scene.start('ChapterSelectScene');
      });

      const menuBtn = this.add.text(GameConfig.width / 2, btnY + 55, '🏠 主菜单', {
        fontSize: '14px',
        color: '#ffffff',
        backgroundColor: '#664488',
        padding: { left: 22, right: 22, top: 8, bottom: 8 }
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      menuBtn.on('pointerover', () => { menuBtn.setBackgroundColor('#775599'); this.audioManager.play('hover'); });
      menuBtn.on('pointerout', () => menuBtn.setBackgroundColor('#664488'));
      menuBtn.on('pointerdown', () => {
        this.audioManager.play('select');
        this.scene.start('MenuScene');
      });
    }
  }

  private submitToLeaderboard(): void {
    this.leaderboardManager.addEntry({
      mode: LeaderboardGameMode.STORY,
      score: this.score,
      floor: this.floor,
      pills: this.pills,
      maxCombo: this.maxCombo,
      clearTimeMs: this.clearTimeMs,
      chapterId: this.chapterId,
      maxAddiction: this.maxAddiction,
      hallucinations: this.hallucinations,
      lossOfControl: this.lossOfControl
    });
  }
}
