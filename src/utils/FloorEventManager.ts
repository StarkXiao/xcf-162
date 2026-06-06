import Phaser from 'phaser';
import { FloorEvent, FloorEventType } from '../types';
import { FloorEventConfigs, GameConfig } from '../config/GameConfig';

export class FloorEventManager {
  private scene: Phaser.Scene;
  private currentEvent: FloorEvent | null = null;
  private eventTimer!: Phaser.Time.TimerEvent | null;
  private lastTriggeredFloor: number = -1;
  private eventsTriggeredCount: number = 0;
  private onEventStartCallback?: (event: FloorEvent) => void;
  private onEventEndCallback?: (event: FloorEvent) => void;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  setCallbacks(
    onEventStart?: (event: FloorEvent) => void,
    onEventEnd?: (event: FloorEvent) => void
  ): void {
    this.onEventStartCallback = onEventStart;
    this.onEventEndCallback = onEventEnd;
  }

  checkFloorEvent(currentFloor: number): void {
    if (currentFloor <= this.lastTriggeredFloor) return;
    if (this.currentEvent) return;

    if (currentFloor > 0 && currentFloor % GameConfig.eventTriggerFloorInterval === 0) {
      this.lastTriggeredFloor = currentFloor;
      this.triggerRandomEvent();
    }
  }

  triggerRandomEvent(): void {
    const eventTypes = Object.values(FloorEventType);
    const randomType = Phaser.Utils.Array.GetRandom(eventTypes)!;
    this.triggerEvent(randomType);
  }

  triggerEvent(type: FloorEventType): void {
    if (this.currentEvent) {
      this.endEvent();
    }

    const config = FloorEventConfigs[type];
    const event: FloorEvent = {
      type,
      name: config.name,
      description: config.description,
      duration: config.duration,
      startTime: this.scene.time.now
    };

    this.currentEvent = event;
    this.eventsTriggeredCount++;

    if (this.onEventStartCallback) {
      this.onEventStartCallback(event);
    }

    this.startEventTimer();
  }

  private startEventTimer(): void {
    if (this.eventTimer) {
      this.eventTimer.destroy();
    }

    if (!this.currentEvent) return;

    this.eventTimer = this.scene.time.delayedCall(
      this.currentEvent.duration,
      () => this.endEvent(),
      undefined,
      this
    );
  }

  private endEvent(): void {
    if (!this.currentEvent) return;

    const endedEvent = this.currentEvent;
    this.currentEvent = null;

    if (this.eventTimer) {
      this.eventTimer.destroy();
      this.eventTimer = null;
    }

    if (this.onEventEndCallback) {
      this.onEventEndCallback(endedEvent);
    }
  }

  getCurrentEvent(): FloorEvent | null {
    return this.currentEvent;
  }

  getEventsTriggeredCount(): number {
    return this.eventsTriggeredCount;
  }

  getEventRemainingTime(): number {
    if (!this.currentEvent || !this.eventTimer) return 0;
    return this.eventTimer.getRemaining();
  }

  getEventProgress(): number {
    if (!this.currentEvent) return 0;
    const elapsed = this.scene.time.now - this.currentEvent.startTime;
    return Math.min(1, elapsed / this.currentEvent.duration);
  }

  hasActiveEvent(): boolean {
    return this.currentEvent !== null;
  }

  getEventEffect(key: 'guardSpeed' | 'guardSpawn' | 'pillSpawn' | 'score' | 'pillRare'): number {
    if (!this.currentEvent) return 1;

    switch (this.currentEvent.type) {
      case FloorEventType.GUARD_SURGE:
        if (key === 'guardSpawn') return 3;
        if (key === 'guardSpeed') return 1.2;
        return 1;
      case FloorEventType.PILL_RAIN:
        if (key === 'pillSpawn') return 2.5;
        return 1;
      case FloorEventType.SECURITY_ALERT:
        if (key === 'guardSpeed') return 1.5;
        if (key === 'guardSpawn') return 1.5;
        return 1;
      case FloorEventType.BONUS_FLOOR:
        if (key === 'score') return 2;
        if (key === 'pillRare') return 2;
        if (key === 'pillSpawn') return 1.5;
        return 1;
      default:
        return 1;
    }
  }

  isLightsOut(): boolean {
    return this.currentEvent?.type === FloorEventType.LIGHTS_OUT;
  }

  reset(): void {
    if (this.eventTimer) {
      this.eventTimer.destroy();
      this.eventTimer = null;
    }
    this.currentEvent = null;
    this.lastTriggeredFloor = -1;
    this.eventsTriggeredCount = 0;
  }

  destroy(): void {
    if (this.eventTimer) {
      this.eventTimer.destroy();
    }
  }
}
