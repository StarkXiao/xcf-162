import Phaser from 'phaser';
import { GameConfig } from '../config/GameConfig';
import { SaveManager } from '../utils/SaveManager';
import { AudioManager } from '../audio/AudioManager';
import { AchievementManager } from '../utils/AchievementManager';
import { SeasonManager } from '../utils/SeasonManager';
import { ClubManager } from '../utils/ClubManager';

export class MenuScene extends Phaser.Scene {
  private saveManager!: SaveManager;
  private audioManager!: AudioManager;
  private neonLights: Phaser.GameObjects.Image[] = [];

  constructor() {
    super('MenuScene');
  }

  create(): void {
    this.saveManager = SaveManager.getInstance();
    this.audioManager = AudioManager.getInstance();

    this.cameras.main.setBackgroundColor('#0a0a1a');
    this.createBackground();

    this.add.text(GameConfig.width / 2, 120, '失控夜店', {
      fontSize: '56px',
      color: '#ff0066',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(GameConfig.width / 2, 180, '电梯井生存', {
      fontSize: '28px',
      color: '#00ffff'
    }).setOrigin(0.5);

    const startBtn = this.add.text(GameConfig.width / 2, 290, '开始游戏', {
      fontSize: '32px',
      color: '#ffffff',
      backgroundColor: '#ff0066',
      padding: { left: 40, right: 40, top: 15, bottom: 15 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    startBtn.on('pointerover', () => {
      startBtn.setBackgroundColor('#ff3385');
      this.audioManager.play('hover');
    });

    startBtn.on('pointerout', () => {
      startBtn.setBackgroundColor('#ff0066');
    });

    startBtn.on('pointerdown', () => {
      this.audioManager.play('select');
      this.scene.start('GameScene');
    });

    const riskRewardEnabled = this.saveManager.isRiskRewardMode();
    const riskRewardBtn = this.add.text(GameConfig.width / 2, 340, '', {
      fontSize: '15px',
      color: '#ffffff',
      backgroundColor: riskRewardEnabled ? '#ff3300' : '#444466',
      padding: { left: 16, right: 16, top: 6, bottom: 6 },
      fontStyle: 'bold'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    const updateRiskRewardBtn = () => {
      const enabled = this.saveManager.isRiskRewardMode();
      riskRewardBtn.setText(enabled ? '🔥 风险挑战: 开 🔥' : '⚪ 风险挑战: 关');
      riskRewardBtn.setBackgroundColor(enabled ? '#ff3300' : '#444466');
    };
    updateRiskRewardBtn();

    riskRewardBtn.on('pointerover', () => {
      const enabled = this.saveManager.isRiskRewardMode();
      riskRewardBtn.setBackgroundColor(enabled ? '#ff5522' : '#666688');
      this.audioManager.play('hover');
    });

    riskRewardBtn.on('pointerout', () => {
      updateRiskRewardBtn();
    });

    riskRewardBtn.on('pointerdown', () => {
      this.audioManager.play('select');
      const newState = !this.saveManager.isRiskRewardMode();
      this.saveManager.setRiskRewardMode(newState);
      updateRiskRewardBtn();
    });

    this.add.text(GameConfig.width / 2, 362, '楼层越高得分倍率越高，但保安更快药片更少', {
      fontSize: '9px',
      color: '#ff9977'
    }).setOrigin(0.5);

    const dualBtn = this.add.text(GameConfig.width / 2, 390, '🔄 双角色接力 🔄', {
      fontSize: '26px',
      color: '#ffffff',
      backgroundColor: '#00ccaa',
      padding: { left: 28, right: 28, top: 12, bottom: 12 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    this.tweens.add({
      targets: dualBtn,
      scale: { from: 1, to: 1.02 },
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    dualBtn.on('pointerover', () => {
      dualBtn.setBackgroundColor('#00eecc');
      this.audioManager.play('hover');
    });

    dualBtn.on('pointerout', () => {
      dualBtn.setBackgroundColor('#00ccaa');
    });

    dualBtn.on('pointerdown', () => {
      this.audioManager.play('select');
      this.scene.start('DualGameScene');
    });

    const endlessBtn = this.add.text(GameConfig.width / 2, 455, '⚡ 无尽竞速 ⚡', {
      fontSize: '24px',
      color: '#ffffff',
      backgroundColor: '#9933ff',
      padding: { left: 30, right: 30, top: 10, bottom: 10 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    this.tweens.add({
      targets: endlessBtn,
      scale: { from: 1, to: 1.03 },
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    endlessBtn.on('pointerover', () => {
      endlessBtn.setBackgroundColor('#bb55ff');
      this.audioManager.play('hover');
    });

    endlessBtn.on('pointerout', () => {
      endlessBtn.setBackgroundColor('#9933ff');
    });

    endlessBtn.on('pointerdown', () => {
      this.audioManager.play('select');
      this.scene.start('EndlessScene');
    });

    const trainingBtn = this.add.text(GameConfig.width / 2, 510, '番外训练馆', {
      fontSize: '22px',
      color: '#ffffff',
      backgroundColor: '#00aaff',
      padding: { left: 35, right: 35, top: 10, bottom: 10 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    trainingBtn.on('pointerover', () => {
      trainingBtn.setBackgroundColor('#33bbff');
      this.audioManager.play('hover');
    });

    trainingBtn.on('pointerout', () => {
      trainingBtn.setBackgroundColor('#00aaff');
    });

    trainingBtn.on('pointerdown', () => {
      this.audioManager.play('select');
      this.scene.start('TrainingScene');
    });

    const challengeBtn = this.add.text(GameConfig.width / 2, 555, '🎮 自定义挑战', {
      fontSize: '20px',
      color: '#ffffff',
      backgroundColor: '#ff6633',
      padding: { left: 30, right: 30, top: 10, bottom: 10 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    challengeBtn.on('pointerover', () => {
      challengeBtn.setBackgroundColor('#ff8855');
      this.audioManager.play('hover');
    });

    challengeBtn.on('pointerout', () => {
      challengeBtn.setBackgroundColor('#ff6633');
    });

    challengeBtn.on('pointerdown', () => {
      this.audioManager.play('select');
      this.scene.start('ChallengeEditorScene');
    });

    const clubManager = ClubManager.getInstance();
    const clubBtn = this.add.text(GameConfig.width / 2, 598, `🎵 夜店经营 💰${clubManager.getClubCoins()}`, {
      fontSize: '20px',
      color: '#ffffff',
      backgroundColor: '#ff00aa',
      padding: { left: 30, right: 30, top: 10, bottom: 10 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    clubBtn.on('pointerover', () => {
      clubBtn.setBackgroundColor('#ff33bb');
      this.audioManager.play('hover');
    });

    clubBtn.on('pointerout', () => {
      clubBtn.setBackgroundColor('#ff00aa');
    });

    clubBtn.on('pointerdown', () => {
      this.audioManager.play('select');
      this.scene.start('ClubScene');
    });

    const clubBuff = clubManager.getCurrentBuff();
    let clubBuffLabel = '暂无增益';
    const buffParts: string[] = [];
    if (clubBuff.scoreMultiplier > 1.0) buffParts.push(`得分x${clubBuff.scoreMultiplier.toFixed(2)}`);
    if (clubBuff.pillSpawnMultiplier > 1.0) buffParts.push(`药片x${clubBuff.pillSpawnMultiplier.toFixed(2)}`);
    if (clubBuff.baseTimeBonus > 0) buffParts.push(`时间+${Math.floor(clubBuff.baseTimeBonus / 1000)}s`);
    if (buffParts.length > 0) clubBuffLabel = buffParts.join(' ');

    this.add.text(GameConfig.width / 2, 621, clubBuffLabel, {
      fontSize: '10px',
      color: '#ff99dd'
    }).setOrigin(0.5);

    const hasNewUnlocks = this.saveManager.getNewlyUnlocked().length > 0;

    const achievementManager = AchievementManager.getInstance();
    const achUnlocked = achievementManager.getUnlockedCount();
    const achTotal = achievementManager.getTotalCount();
    const hasNewAchievements = achievementManager.getNewlyUnlocked().length > 0;

    const seasonManager = SeasonManager.getInstance();
    seasonManager.checkReset();
    const hasNewSeason = seasonManager.hasClaimableRewards();
    const seasonLevelData = seasonManager.getLevelProgress();

    const achievementBtn = this.add.text(GameConfig.width / 2, 645, `🏆 称号成就 ${hasNewAchievements ? '🔔' : ''}`, {
      fontSize: '17px',
      color: '#ffffff',
      backgroundColor: '#ffaa00',
      padding: { left: 25, right: 25, top: 6, bottom: 6 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    if (hasNewAchievements) {
      this.tweens.add({
        targets: achievementBtn,
        scale: { from: 1, to: 1.04 },
        duration: 1000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }

    achievementBtn.on('pointerover', () => {
      achievementBtn.setBackgroundColor('#ffbb33');
      this.audioManager.play('hover');
    });

    achievementBtn.on('pointerout', () => {
      achievementBtn.setBackgroundColor('#ffaa00');
    });

    achievementBtn.on('pointerdown', () => {
      this.audioManager.play('select');
      this.scene.start('AchievementScene');
    });

    this.add.text(GameConfig.width / 2, 668, `成就: ${achUnlocked}/${achTotal}`, {
      fontSize: '10px',
      color: '#ffcc66'
    }).setOrigin(0.5);

    const seasonBtn = this.add.text(GameConfig.width / 2 - 110, 690, `🏅 Lv.${seasonLevelData.currentLevel} ${hasNewSeason ? '🔔' : ''}`, {
      fontSize: '14px',
      color: '#ffffff',
      backgroundColor: '#00ccaa',
      padding: { left: 15, right: 15, top: 5, bottom: 5 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    if (hasNewSeason) {
      this.tweens.add({
        targets: seasonBtn,
        scale: { from: 1, to: 1.04 },
        duration: 900,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }

    seasonBtn.on('pointerover', () => {
      seasonBtn.setBackgroundColor('#00eecc');
      this.audioManager.play('hover');
    });

    seasonBtn.on('pointerout', () => {
      seasonBtn.setBackgroundColor('#00ccaa');
    });

    seasonBtn.on('pointerdown', () => {
      this.audioManager.play('select');
      this.scene.start('SeasonScene');
    });

    const archiveBtn = this.add.text(GameConfig.width / 2 + 110, 690, `📂 档案 ${hasNewUnlocks ? '🔔' : ''}`, {
      fontSize: '14px',
      color: '#ffffff',
      backgroundColor: '#aa66ff',
      padding: { left: 15, right: 15, top: 5, bottom: 5 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    if (hasNewUnlocks) {
      this.tweens.add({
        targets: archiveBtn,
        scale: { from: 1, to: 1.04 },
        duration: 1000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }

    archiveBtn.on('pointerover', () => {
      archiveBtn.setBackgroundColor('#bb77ff');
      this.audioManager.play('hover');
    });

    archiveBtn.on('pointerout', () => {
      archiveBtn.setBackgroundColor('#aa66ff');
    });

    archiveBtn.on('pointerdown', () => {
      this.audioManager.play('select');
      this.scene.start('ArchiveScene');
    });

    const saveData = this.saveManager.getSaveData();
    const riskBest = this.saveManager.getRiskRewardBestScore();
    this.add.text(GameConfig.width / 2, 715, `最高:${saveData.highScore} | 🔥风险:${riskBest} | 无尽:${this.saveManager.getEndlessBestScore()} | 💰:${clubManager.getClubCoins()}`, {
      fontSize: '10px',
      color: '#ffcc00'
    }).setOrigin(0.5);

    this.createAudioSettings();

    this.add.text(GameConfig.width / 2, 755, '← → 移动 | 空格 跳跃 | Shift 切换角色', {
      fontSize: '9px',
      color: '#666666'
    }).setOrigin(0.5);

    this.time.addEvent({
      delay: 100,
      callback: this.animateNeonLights,
      callbackScope: this,
      loop: true
    });
  }

  private createBackground(): void {
    for (let i = 0; i < 20; i++) {
      const x = Phaser.Math.Between(0, GameConfig.width);
      const y = Phaser.Math.Between(0, GameConfig.height);
      const type = Phaser.Math.Between(0, 1) === 0 ? 'neon-pink' : 'neon-cyan';
      const light = this.add.image(x, y, type);
      light.setAlpha(Phaser.Math.FloatBetween(0.3, 0.8));
      light.setScale(Phaser.Math.FloatBetween(0.5, 1.5));
      this.neonLights.push(light);
    }

    for (let i = 0; i < 5; i++) {
      const y = i * 150 + 50;
      this.add.rectangle(0, y, GameConfig.width * 2, 2, 0xff0066, 0.1);
      this.add.rectangle(0, y + 75, GameConfig.width * 2, 1, 0x00ffff, 0.1);
    }
  }

  private animateNeonLights(): void {
    this.neonLights.forEach((light, index) => {
      const pulse = Math.sin(this.time.now * 0.003 + index) * 0.3 + 0.5;
      light.setAlpha(pulse);
    });
  }

  private createAudioSettings(): void {
    const baseY = 738;

    this.add.text(20, baseY - 14, '🔊 音频设置', {
      fontSize: '11px',
      color: '#66ccff',
      fontStyle: 'bold'
    }).setOrigin(0, 0);

    const musicMuteBtn = this.add.text(20, baseY + 8, '', {
      fontSize: '14px',
      color: '#ffffff',
      backgroundColor: '#333355',
      padding: { left: 6, right: 6, top: 3, bottom: 3 }
    }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true });

    this.add.text(50, baseY + 8, '🎵', {
      fontSize: '12px',
      color: '#ff99cc'
    }).setOrigin(0, 0.5);

    const musicSliderBg = this.add.graphics();
    const musicSliderX = 70;
    const musicSliderY = baseY + 8;
    const musicSliderW = 80;
    const musicSliderH = 6;
    musicSliderBg.fillStyle(0x333344, 1);
    musicSliderBg.fillRoundedRect(musicSliderX, musicSliderY - musicSliderH / 2, musicSliderW, musicSliderH, 3);

    const musicSliderFill = this.add.graphics();
    const musicSliderKnob = this.add.circle(musicSliderX, musicSliderY, 6, 0xff99cc).setInteractive({ useHandCursor: true });

    const musicValueText = this.add.text(musicSliderX + musicSliderW + 8, musicSliderY, '', {
      fontSize: '11px',
      color: '#cccccc'
    }).setOrigin(0, 0.5);

    const sfxMuteBtn = this.add.text(GameConfig.width - 200, baseY + 8, '', {
      fontSize: '14px',
      color: '#ffffff',
      backgroundColor: '#333355',
      padding: { left: 6, right: 6, top: 3, bottom: 3 }
    }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true });

    this.add.text(GameConfig.width - 170, baseY + 8, '🔔', {
      fontSize: '12px',
      color: '#66ff99'
    }).setOrigin(0, 0.5);

    const sfxSliderBg = this.add.graphics();
    const sfxSliderX = GameConfig.width - 150;
    const sfxSliderY = baseY + 8;
    const sfxSliderW = 80;
    const sfxSliderH = 6;
    sfxSliderBg.fillStyle(0x333344, 1);
    sfxSliderBg.fillRoundedRect(sfxSliderX, sfxSliderY - sfxSliderH / 2, sfxSliderW, sfxSliderH, 3);

    const sfxSliderFill = this.add.graphics();
    const sfxSliderKnob = this.add.circle(sfxSliderX, sfxSliderY, 6, 0x66ff99).setInteractive({ useHandCursor: true });

    const sfxValueText = this.add.text(sfxSliderX + sfxSliderW + 8, sfxSliderY, '', {
      fontSize: '11px',
      color: '#cccccc'
    }).setOrigin(0, 0.5);

    const adaptiveBtn = this.add.text(GameConfig.width / 2, baseY - 10, '', {
      fontSize: '10px',
      color: '#ffffff',
      backgroundColor: '#224466',
      padding: { left: 6, right: 6, top: 2, bottom: 2 },
      fontStyle: 'bold'
    }).setOrigin(0.5, 0).setInteractive({ useHandCursor: true });

    const updateMusicSlider = () => {
      const vol = this.audioManager.getMusicVolume();
      const muted = !this.audioManager.isMusicEnabled();
      const posX = musicSliderX + (muted ? 0 : (vol / 100) * musicSliderW);
      musicSliderFill.clear();
      musicSliderFill.fillStyle(muted ? 0x666666 : 0xff99cc, 1);
      musicSliderFill.fillRoundedRect(musicSliderX, musicSliderY - musicSliderH / 2, muted ? 0 : (vol / 100) * musicSliderW, musicSliderH, 3);
      musicSliderKnob.setX(posX);
      musicSliderKnob.setFillStyle(muted ? 0x666666 : 0xff99cc);
      musicValueText.setText(muted ? '静音' : `${vol}%`);
      musicValueText.setColor(muted ? '#666666' : '#cccccc');
      musicMuteBtn.setText(muted ? '🔇' : '🔊');
      musicMuteBtn.setBackgroundColor(muted ? '#553333' : '#333355');
    };

    const updateSfxSlider = () => {
      const vol = this.audioManager.getSFXVolume();
      const muted = !this.audioManager.isSFXEnabled();
      const posX = sfxSliderX + (muted ? 0 : (vol / 100) * sfxSliderW);
      sfxSliderFill.clear();
      sfxSliderFill.fillStyle(muted ? 0x666666 : 0x66ff99, 1);
      sfxSliderFill.fillRoundedRect(sfxSliderX, sfxSliderY - sfxSliderH / 2, muted ? 0 : (vol / 100) * sfxSliderW, sfxSliderH, 3);
      sfxSliderKnob.setX(posX);
      sfxSliderKnob.setFillStyle(muted ? 0x666666 : 0x66ff99);
      sfxValueText.setText(muted ? '静音' : `${vol}%`);
      sfxValueText.setColor(muted ? '#666666' : '#cccccc');
      sfxMuteBtn.setText(muted ? '🔇' : '🔊');
      sfxMuteBtn.setBackgroundColor(muted ? '#553333' : '#333355');
    };

    const updateAdaptiveBtn = () => {
      const enabled = this.audioManager.isAdaptiveMixingEnabled();
      adaptiveBtn.setText(enabled ? '⚠ 危险混音: 开' : '⚠ 危险混音: 关');
      adaptiveBtn.setBackgroundColor(enabled ? '#225588' : '#333344');
      adaptiveBtn.setColor(enabled ? '#aaddff' : '#888888');
    };

    musicMuteBtn.on('pointerover', () => {
      if (!this.audioManager.isMusicEnabled()) return;
      musicMuteBtn.setBackgroundColor('#555577');
    });
    musicMuteBtn.on('pointerout', () => updateMusicSlider());
    musicMuteBtn.on('pointerdown', () => {
      this.audioManager.toggleMusic();
      updateMusicSlider();
    });

    sfxMuteBtn.on('pointerover', () => {
      if (!this.audioManager.isSFXEnabled()) return;
      sfxMuteBtn.setBackgroundColor('#555577');
    });
    sfxMuteBtn.on('pointerout', () => updateSfxSlider());
    sfxMuteBtn.on('pointerdown', () => {
      this.audioManager.toggleSFX();
      updateSfxSlider();
      this.audioManager.play('select');
    });

    adaptiveBtn.on('pointerover', () => {
      if (this.audioManager.isAdaptiveMixingEnabled()) {
        adaptiveBtn.setBackgroundColor('#3366aa');
      }
    });
    adaptiveBtn.on('pointerout', () => updateAdaptiveBtn());
    adaptiveBtn.on('pointerdown', () => {
      this.audioManager.toggleAdaptiveMixing();
      updateAdaptiveBtn();
      this.audioManager.play('select');
    });

    const setupSliderDrag = (
      knob: Phaser.GameObjects.Arc,
      sliderX: number,
      sliderW: number,
      onUpdate: (percent: number) => void
    ) => {
      let dragging = false;

      const updateFromPointer = (pointer: Phaser.Input.Pointer) => {
        const localX = Math.max(sliderX, Math.min(sliderX + sliderW, pointer.x));
        const percent = Math.round(((localX - sliderX) / sliderW) * 100);
        onUpdate(percent);
      };

      knob.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
        dragging = true;
        updateFromPointer(pointer);
      });

      this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
        if (dragging) {
          updateFromPointer(pointer);
        }
      });

      this.input.on('pointerup', () => {
        dragging = false;
      });
    };

    setupSliderDrag(musicSliderKnob, musicSliderX, musicSliderW, (percent: number) => {
      this.audioManager.setMusicVolume(percent);
      if (percent > 0 && !this.audioManager.isMusicEnabled()) {
        this.audioManager.setMusicMuted(false);
      }
      updateMusicSlider();
    });

    setupSliderDrag(sfxSliderKnob, sfxSliderX, sfxSliderW, (percent: number) => {
      this.audioManager.setSFXVolume(percent);
      if (percent > 0 && !this.audioManager.isSFXEnabled()) {
        this.audioManager.setSFXMuted(false);
      }
      updateSfxSlider();
      if (Math.random() < 0.15) this.audioManager.play('hover');
    });

    updateMusicSlider();
    updateSfxSlider();
    updateAdaptiveBtn();
  }
}
