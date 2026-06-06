import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { MenuScene } from './scenes/MenuScene';
import { GameScene } from './scenes/GameScene';
import { GameOverScene } from './scenes/GameOverScene';
import { TrainingScene } from './scenes/TrainingScene';
import { JumpTrainingScene } from './scenes/JumpTrainingScene';
import { PillTrainingScene } from './scenes/PillTrainingScene';
import { GuardTrainingScene } from './scenes/GuardTrainingScene';
import { EndlessScene } from './scenes/EndlessScene';
import { EndlessGameOverScene } from './scenes/EndlessGameOverScene';
import { ArchiveScene } from './scenes/ArchiveScene';
import { AchievementScene } from './scenes/AchievementScene';
import { ChallengeEditorScene } from './scenes/ChallengeEditorScene';
import { GameConfig } from './config/GameConfig';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GameConfig.width,
  height: GameConfig.height,
  parent: 'game',
  backgroundColor: '#0a0a1a',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: GameConfig.gravity },
      debug: false
    }
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GameConfig.width,
    height: GameConfig.height
  },
  scene: [BootScene, MenuScene, GameScene, GameOverScene, TrainingScene, JumpTrainingScene, PillTrainingScene, GuardTrainingScene, EndlessScene, EndlessGameOverScene, ArchiveScene, AchievementScene, ChallengeEditorScene]
};

new Phaser.Game(config);
