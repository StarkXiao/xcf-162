import Phaser from 'phaser';

type SoundType = 'jump' | 'pill' | 'guard' | 'gameover' | 'hover' | 'select' | 'shield' | 'alert_surround' | 'alert_jump';

export class AudioManager {
  private static instance: AudioManager;
  private scene!: Phaser.Scene;
  private sounds: Map<SoundType, Phaser.Sound.BaseSound> = new Map();
  private music!: Phaser.Sound.BaseSound;
  private musicEnabled: boolean = true;
  private sfxEnabled: boolean = true;

  private constructor() {}

  static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  generateSounds(scene: Phaser.Scene): void {
    this.scene = scene;
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

    this.createMusic(audioContext);
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
      volume: 0.3
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

  play(key: SoundType): void {
    if (!this.sfxEnabled) return;
    const sound = this.sounds.get(key);
    if (sound) {
      sound.play();
    }
  }

  playMusic(): void {
    if (!this.musicEnabled) return;
    if (this.music && !this.music.isPlaying) {
      this.music.play();
    }
  }

  stopMusic(): void {
    if (this.music && this.music.isPlaying) {
      this.music.stop();
    }
  }

  toggleMusic(): boolean {
    this.musicEnabled = !this.musicEnabled;
    if (!this.musicEnabled) {
      this.stopMusic();
    }
    return this.musicEnabled;
  }

  toggleSFX(): boolean {
    this.sfxEnabled = !this.sfxEnabled;
    return this.sfxEnabled;
  }

  isMusicEnabled(): boolean {
    return this.musicEnabled;
  }

  isSFXEnabled(): boolean {
    return this.sfxEnabled;
  }
}
