import Phaser from 'phaser';
import { GameConfig } from '../config/GameConfig';
import { StoryManager } from '../utils/StoryManager';
import { AudioManager } from '../audio/AudioManager';

export class StoryGameOverScene extends Phaser.Scene {
  private storyManager!: StoryManager;
  private audioManager!: AudioManager;
  private chapterId!: number;
  private score!: number;
  private floor!: number;
  private pills!: number;
  private deathReason!: string;

  constructor() {
    super('StoryGameOverScene');
  }

  init(data: { chapterId: number; score: number; floor: number; pills: number; deathReason: string }): void {
    this.chapterId = data.chapterId;
    this.score = data.score;
    this.floor = data.floor;
    this.pills = data.pills;
    this.deathReason = data.deathReason || '未知原因';
  }

  create(): void {
    this.storyManager = StoryManager.getInstance();
    this.audioManager = AudioManager.getInstance();
    this.cameras.main.setBackgroundColor('#1a0a0a');

    const chapter = this.storyManager.getChapterConfig(this.chapterId);

    this.add.text(GameConfig.width / 2, 80, '💀 任务失败', {
      fontSize: '40px',
      color: '#ff4444',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(GameConfig.width / 2, 130, `${chapter?.title || ''} · ${chapter?.subtitle || ''}`, {
      fontSize: '18px',
      color: '#ff9999'
    }).setOrigin(0.5);

    this.add.text(GameConfig.width / 2, 165, `死因: ${this.deathReason}`, {
      fontSize: '14px',
      color: '#ff6666',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const panel = this.add.graphics();
    const pw = 340, ph = 200;
    const px = (GameConfig.width - pw) / 2, py = 200;
    panel.fillStyle(0x1f0f0f, 0.95);
    panel.fillRoundedRect(px, py, pw, ph, 12);
    panel.lineStyle(2, 0xff4444, 0.8);
    panel.strokeRoundedRect(px, py, pw, ph, 12);

    const bestScore = this.storyManager.getChapterScore(this.chapterId);
    const totalDeaths = this.storyManager.getTotalDeaths();

    const stats = [
      { label: '本次得分', value: `${this.score}分`, color: '#ffcc00' },
      { label: '到达楼层', value: `${this.floor}F`, color: '#66ccff' },
      { label: '持有药片', value: `${this.pills}`, color: '#ff66ff' },
      { label: '章节最高分', value: `${bestScore}分`, color: '#aaffaa' },
      { label: '总死亡次数', value: `${totalDeaths}`, color: '#ff8888' }
    ];

    stats.forEach((s, i) => {
      const y = py + 30 + i * 32;
      this.add.text(px + 30, y, s.label, {
        fontSize: '14px',
        color: '#aabbcc'
      }).setOrigin(0, 0);
      this.add.text(px + pw - 30, y, s.value, {
        fontSize: '14px',
        color: s.color,
        fontStyle: 'bold'
      }).setOrigin(1, 0);
    });

    this.add.text(GameConfig.width / 2, py + ph + 25, '不要放弃，再试一次！', {
      fontSize: '13px',
      color: '#88cccc'
    }).setOrigin(0.5);

    const btnY = py + ph + 65;

    const retryBtn = this.add.text(GameConfig.width / 2 - 90, btnY, '↻ 重新挑战', {
      fontSize: '16px',
      color: '#ffffff',
      backgroundColor: '#cc3333',
      padding: { left: 18, right: 18, top: 10, bottom: 10 },
      fontStyle: 'bold'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    retryBtn.on('pointerover', () => { retryBtn.setBackgroundColor('#ee4444'); this.audioManager.play('hover'); });
    retryBtn.on('pointerout', () => retryBtn.setBackgroundColor('#cc3333'));
    retryBtn.on('pointerdown', () => {
      this.audioManager.play('select');
      const ch = this.storyManager.getChapterConfig(this.chapterId);
      if (ch?.introCutsceneId) {
        this.scene.start('CutsceneScene', {
          cutsceneId: ch.introCutsceneId,
          nextScene: 'StoryGameScene',
          nextSceneData: { chapterId: this.chapterId }
        });
      } else {
        this.scene.start('StoryGameScene', { chapterId: this.chapterId });
      }
    });

    const backBtn = this.add.text(GameConfig.width / 2 + 90, btnY, '← 章节选择', {
      fontSize: '14px',
      color: '#ffffff',
      backgroundColor: '#555577',
      padding: { left: 16, right: 16, top: 9, bottom: 9 }
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
      backgroundColor: '#444466',
      padding: { left: 22, right: 22, top: 8, bottom: 8 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    menuBtn.on('pointerover', () => { menuBtn.setBackgroundColor('#555577'); this.audioManager.play('hover'); });
    menuBtn.on('pointerout', () => menuBtn.setBackgroundColor('#444466'));
    menuBtn.on('pointerdown', () => {
      this.audioManager.play('select');
      this.scene.start('MenuScene');
    });
  }
}
