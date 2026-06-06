import Phaser from 'phaser';
import { TimeOfDay, TimeOfDayConfig } from '../types';
import { TimeOfDayConfigs, TimeOfDayOrder } from '../config/GameConfig';

export class TimeManager {
  private scene: Phaser.Scene;
  private currentTimeOfDay: TimeOfDay;
  private timeRemaining: number;
  private cycleCount: number;
  private timeTimer!: Phaser.Time.TimerEvent;
  private onTimeChangeCallback?: (newTime: TimeOfDay, oldTime: TimeOfDay) => void;

  constructor(scene: Phaser.Scene, initialTime?: TimeOfDay) {
    this.scene = scene;
    this.currentTimeOfDay = initialTime || TimeOfDay.DAWN;
    this.cycleCount = 0;
    this.timeRemaining = TimeOfDayConfigs[this.currentTimeOfDay].duration;
  }

  start(onTimeChange?: (newTime: TimeOfDay, oldTime: TimeOfDay) => void): void {
    this.onTimeChangeCallback = onTimeChange;
    this.startTimer();
  }

  private startTimer(): void {
    if (this.timeTimer) {
      this.timeTimer.destroy();
    }

    this.timeTimer = this.scene.time.addEvent({
      delay: 100,
      callback: () => this.updateTime(100),
      callbackScope: this,
      loop: true
    });
  }

  private updateTime(delta: number): void {
    this.timeRemaining -= delta;

    if (this.timeRemaining <= 0) {
      this.advanceTime();
    }
  }

  private advanceTime(): void {
    const oldTime = this.currentTimeOfDay;
    const currentIndex = TimeOfDayOrder.indexOf(this.currentTimeOfDay);
    const nextIndex = (currentIndex + 1) % TimeOfDayOrder.length;

    if (nextIndex === 0) {
      this.cycleCount++;
    }

    this.currentTimeOfDay = TimeOfDayOrder[nextIndex];
    this.timeRemaining = TimeOfDayConfigs[this.currentTimeOfDay].duration;

    if (this.onTimeChangeCallback) {
      this.onTimeChangeCallback(this.currentTimeOfDay, oldTime);
    }
  }

  getCurrentTimeOfDay(): TimeOfDay {
    return this.currentTimeOfDay;
  }

  getConfig(): TimeOfDayConfig {
    return TimeOfDayConfigs[this.currentTimeOfDay];
  }

  getTimeRemaining(): number {
    return this.timeRemaining;
  }

  getCycleCount(): number {
    return this.cycleCount;
  }

  getProgress(): number {
    const totalDuration = TimeOfDayConfigs[this.currentTimeOfDay].duration;
    return 1 - (this.timeRemaining / totalDuration);
  }

  setTimeOfDay(time: TimeOfDay): void {
    const oldTime = this.currentTimeOfDay;
    this.currentTimeOfDay = time;
    this.timeRemaining = TimeOfDayConfigs[time].duration;

    if (this.onTimeChangeCallback && oldTime !== time) {
      this.onTimeChangeCallback(time, oldTime);
    }
  }

  pause(): void {
    if (this.timeTimer) {
      this.timeTimer.paused = true;
    }
  }

  resume(): void {
    if (this.timeTimer) {
      this.timeTimer.paused = false;
    }
  }

  destroy(): void {
    if (this.timeTimer) {
      this.timeTimer.destroy();
    }
  }
}
