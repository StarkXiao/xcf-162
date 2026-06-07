import Phaser from 'phaser';
import { SaveManager } from '../utils/SaveManager';

type SoundType = 'jump' | 'pill' | 'guard' | 'gameover' | 'hover' | 'select' | 'shield' | 'alert_surround' | 'alert_jump' | 'trap_collapse' | 'trap_respawn' | 'trap_move' | 'trap_toggle' | 'trap_land';

export class AudioManager {
  private static instance: AudioManager;
  private scene!: Phaser.Scene;
  private sounds: Map<SoundType, Phaser.Sound.BaseSound> = new Map();
  private music!: Phaser.Sound.BaseSound;
  private saveManager!: SaveManager;

  private musicVolume: number = 0.7;
  private sfxVolume: number = 0.8;
  private musicMuted: boolean = false;
  private sfxMuted: boolean = false;
  private adaptiveMixing: boolean = true;

  private isDangerState: boolean = false;
  private dangerMusicMultiplier: number = 0.3;
  private dangerSfxMultiplier: number = 1.3;
  private musicFadeTween: Phaser.Tweens.Tween | null = null;

  private initialized: boolean = false;

  private constructor() {}

  static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  generateSounds(scene: Phaser.Scene): void {
    this.scene = scene;
    this.saveManager = SaveManager.getInstance();
    this.loadSettingsFromSave();

    const audioContext = (scene.game.sound as Phaser.Sound.WebAudioSoundManager).context;

    this.createTone('jump', 400, 600, 0.1, 'square', audioContext);
    this.createTone('pill', 800, 1200, 0.15, 'sine', audioContext);
    this.createTone('guard', 150, 100, 0.3, 'sawtooth', audioContext);
    this.createTone('gameover', 400, 100, 0.5, 'sawtooth', audioContext);
    this.createTone('hover', 600, 600, 0.05, 'sine', audioContext);
    this.createTone('select', 800, 1000, 0.1, 'square', audioContext);
    this.createTone('shield', 500, 800, 0.2, 'sine', audioContext);
    this.createAlertTone('alert_surround', 440, 660, 0.6, 'square', audioContext);
    this.createAlertTone('alert_jump', 220, 880, 0.8, 'sawtooth', audioContext);
    this.createTone('trap_collapse', 300, 80, 0.35, 'sawtooth', audioContext);
    this.createTone('trap_respawn', 200, 500, 0.2, 'triangle', audioContext);
    this.createTone('trap_move', 350, 450, 0.08, 'sine', audioContext);
    this.createTone('trap_toggle', 600, 300, 0.15, 'square', audioContext);
    this.createTone('trap_land', 500, 350, 0.12, 'triangle', audioContext);

    this.createMusic(audioContext);
    this.initialized = true;
  }

  private loadSettingsFromSave(): void {
    if (!this.saveManager) return;
    const settings = this.saveManager.getAudioSettings();
    this.musicVolume = settings.musicVolume / 100;
    this.sfxVolume = settings.sfxVolume / 100;
    this.musicMuted = settings.musicMuted;
    this.sfxMuted = settings.sfxMuted;
    this.adaptiveMixing = settings.adaptiveMixing;
  }

  private persistSettings(): void {
    if (!this.saveManager) return;
    this.saveManager.saveAudioSettings({
      musicVolume: Math.round(this.musicVolume * 100),
      sfxVolume: Math.round(this.sfxVolume * 100),
      musicMuted: this.musicMuted,
      sfxMuted: this.sfxMuted,
      adaptiveMixing: this.adaptiveMixing
    });
  }

  private createAlertTone(key: SoundType, startFreq: number, endFreq: number, duration: number, type: OscillatorType, audioContext: AudioContext): void {
    const sampleRate = 44100;
    const samples = sampleRate * duration;
    const buffer = audioContext.createBuffer(1, samples, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < samples; i++) {
      const t = i / sampleRate;
      const beepPhase = (t % 0.15) / 0.15;
      const freq = startFreq + (endFreq - startFreq) * (t / duration);
      const angle = t * freq * Math.PI * 2;

      let sample = 0;
      switch (type) {
        case 'sine':
          sample = Math.sin(angle);
          break;
        case 'square':
          sample = Math.sign(Math.sin(angle));
          break;
        case 'sawtooth':
          sample = 2 * (t * freq - Math.floor(t * freq + 0.5));
          break;
        case 'triangle':
          sample = Math.abs(4 * (t * freq - Math.floor(t * freq + 0.75)) + 1) * 2 - 1;
          break;
      }

      const beepGate = beepPhase < 0.7 ? 1 : 0;
      const envelope = Math.sin((t / duration) * Math.PI);
      data[i] = sample * envelope * beepGate * 0.35;
    }

    const arrayBuffer = this.audioBufferToArrayBuffer(buffer);
    this.scene.game.cache.audio.add(key, arrayBuffer);
    const sound = this.scene.sound.add(key);
    this.sounds.set(key, sound);
  }

  private createTone(key: SoundType, startFreq: number, endFreq: number, duration: number, type: OscillatorType, audioContext: AudioContext): void {
    const sampleRate = 44100;
    const samples = sampleRate * duration;
    const buffer = audioContext.createBuffer(1, samples, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < samples; i++) {
      const t = i / sampleRate;
      const freq = startFreq + (endFreq - startFreq) * (t / duration);
      const angle = t * freq * Math.PI * 2;

      let sample = 0;
      switch (type) {
        case 'sine':
          sample = Math.sin(angle);
          break;
        case 'square':
          sample = Math.sign(Math.sin(angle));
          break;
        case 'sawtooth':
          sample = 2 * (t * freq - Math.floor(t * freq + 0.5));
          break;
        case 'triangle':
          sample = Math.abs(4 * (t * freq - Math.floor(t * freq + 0.75)) + 1) * 2 - 1;
          break;
      }

      const envelope = Math.sin((t / duration) * Math.PI);
      data[i] = sample * envelope * 0.3;
    }

    const arrayBuffer = this.audioBufferToArrayBuffer(buffer);
    this.scene.game.cache.audio.add(key, arrayBuffer);
    const sound = this.scene.sound.add(key);
    this.sounds.set(key, sound);
  }

  private createMusic(audioContext: AudioContext): void {
    const bpm = 120;
    const beatDuration = 60 / bpm;
    const totalBeats = 32;
    const sampleRate = 44100;
    const totalDuration = beatDuration * totalBeats;
    const samples = sampleRate * totalDuration;
    const buffer = audioContext.createBuffer(1, samples, sampleRate);
    const data = buffer.getChannelData(0);

    const bassNotes = [110, 110, 146.83, 110, 130.81, 110, 146.83, 164.81];
    const leadNotes = [440, 523.25, 493.88, 440, 523.25, 587.33, 523.25, 440];

    for (let i = 0; i < samples; i++) {
      const t = i / sampleRate;
      const beatIndex = Math.floor(t / beatDuration) % 8;
      const bassFreq = bassNotes[beatIndex];
      const leadFreq = leadNotes[beatIndex];

      const bassAngle = t * bassFreq * Math.PI * 2;
      const bass = Math.sin(bassAngle) * 0.4;

      const leadAngle = t * leadFreq * Math.PI * 2;
      const lead = Math.sin(leadAngle) * 0.25;

      const beatTime = t % beatDuration;
      const drum = beatTime < 0.1 ? Math.sin(beatTime * 50 * Math.PI * 2) * 0.3 : 0;

      const envelope = Math.min(1, t / 0.5) * Math.min(1, (totalDuration - t) / 0.5);

      data[i] = (bass + lead + drum) * envelope * 0.4;
    }

    const arrayBuffer = this.audioBufferToArrayBuffer(buffer);
    this.scene.game.cache.audio.add('music', arrayBuffer);
    this.music = this.scene.sound.add('music', {
      loop: true,
      volume: this.getEffectiveMusicVolume()
    });
  }

  private audioBufferToArrayBuffer(audioBuffer: AudioBuffer): ArrayBuffer {
    const length = audioBuffer.length * audioBuffer.numberOfChannels * 2;
    const arrayBuffer = new ArrayBuffer(44 + length);
    const view = new DataView(arrayBuffer);

    const writeString = (offset: number, str: string) => {
      for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, audioBuffer.numberOfChannels, true);
    view.setUint32(24, audioBuffer.sampleRate, true);
    view.setUint32(28, audioBuffer.sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, length, true);

    const channelData = audioBuffer.getChannelData(0);
    let offset = 44;
    for (let i = 0; i < channelData.length; i++) {
      const sample = Math.max(-1, Math.min(1, channelData[i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      offset += 2;
    }

    return arrayBuffer;
  }

  private getEffectiveMusicVolume(): number {
    if (this.musicMuted) return 0;
    let vol = this.musicVolume;
    if (this.adaptiveMixing && this.isDangerState) {
      vol *= this.dangerMusicMultiplier;
    }
    return vol;
  }

  private getEffectiveSfxVolume(): number {
    if (this.sfxMuted) return 0;
    let vol = this.sfxVolume;
    if (this.adaptiveMixing && this.isDangerState) {
      vol *= this.dangerSfxMultiplier;
    }
    return Math.min(1, vol);
  }

  private applyMusicVolume(): void {
    if (!this.music) return;
    const targetVol = this.getEffectiveMusicVolume();

    if (this.musicFadeTween) {
      this.musicFadeTween.stop();
      this.musicFadeTween = null;
    }

    if (this.scene && this.scene.tweens) {
      this.musicFadeTween = this.scene.tweens.add({
        targets: this.music,
        volume: targetVol,
        duration: 400,
        ease: 'Linear'
      });
    } else {
      (this.music as any).volume = targetVol;
    }
  }

  play(key: SoundType): void {
    if (!this.sfxMuted) {
      const sound = this.sounds.get(key);
      if (sound) {
        (sound as any).volume = this.getEffectiveSfxVolume();
        sound.play();
      }
    }
  }

  playMusic(): void {
    if (this.musicMuted) return;
    if (this.music && !this.music.isPlaying) {
      (this.music as any).volume = this.getEffectiveMusicVolume();
      this.music.play();
    }
  }

  stopMusic(): void {
    if (this.music && this.music.isPlaying) {
      this.music.stop();
    }
  }

  setDangerState(isDanger: boolean): void {
    if (!this.adaptiveMixing) return;
    if (this.isDangerState === isDanger) return;
    this.isDangerState = isDanger;
    this.applyMusicVolume();
  }

  toggleMusic(): boolean {
    this.musicMuted = !this.musicMuted;
    this.persistSettings();
    if (this.musicMuted) {
      this.stopMusic();
    } else {
      this.playMusic();
    }
    return !this.musicMuted;
  }

  toggleSFX(): boolean {
    this.sfxMuted = !this.sfxMuted;
    this.persistSettings();
    return !this.sfxMuted;
  }

  toggleAdaptiveMixing(): boolean {
    this.adaptiveMixing = !this.adaptiveMixing;
    this.persistSettings();
    if (!this.adaptiveMixing) {
      this.isDangerState = false;
    }
    this.applyMusicVolume();
    return this.adaptiveMixing;
  }

  isMusicEnabled(): boolean {
    return !this.musicMuted;
  }

  isSFXEnabled(): boolean {
    return !this.sfxMuted;
  }

  isAdaptiveMixingEnabled(): boolean {
    return this.adaptiveMixing;
  }

  getMusicVolume(): number {
    return Math.round(this.musicVolume * 100);
  }

  setMusicVolume(percent: number): void {
    this.musicVolume = Math.max(0, Math.min(1, percent / 100));
    this.persistSettings();
    this.applyMusicVolume();
  }

  getSFXVolume(): number {
    return Math.round(this.sfxVolume * 100);
  }

  setSFXVolume(percent: number): void {
    this.sfxVolume = Math.max(0, Math.min(1, percent / 100));
    this.persistSettings();
  }

  setMusicMuted(muted: boolean): void {
    if (this.musicMuted === muted) return;
    this.musicMuted = muted;
    this.persistSettings();
    if (muted) {
      this.stopMusic();
    } else {
      this.playMusic();
    }
  }

  setSFXMuted(muted: boolean): void {
    this.sfxMuted = muted;
    this.persistSettings();
  }

  setAdaptiveMixingEnabled(enabled: boolean): void {
    if (this.adaptiveMixing === enabled) return;
    this.adaptiveMixing = enabled;
    this.persistSettings();
    if (!enabled) {
      this.isDangerState = false;
    }
    this.applyMusicVolume();
  }

  isInitialized(): boolean {
    return this.initialized;
  }
}
