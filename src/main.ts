import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { MenuScene } from './scenes/MenuScene';
import { GameScene } from './scenes/GameScene';
import { DualGameScene } from './scenes/DualGameScene';
import { GameOverScene } from './scenes/GameOverScene';
import { TrainingScene } from './scenes/TrainingScene';
import { JumpTrainingScene } from './scenes/JumpTrainingScene';
import { PillTrainingScene } from './scenes/PillTrainingScene';
import { GuardTrainingScene } from './scenes/GuardTrainingScene';
import { EndlessScene } from './scenes/EndlessScene';
import { EndlessGameOverScene } from './scenes/EndlessGameOverScene';
import { ArchiveScene } from './scenes/ArchiveScene';
import { AchievementScene } from './scenes/AchievementScene';
import { SeasonScene } from './scenes/SeasonScene';
import { ChallengeEditorScene } from './scenes/ChallengeEditorScene';
import { ClubScene } from './scenes/ClubScene';
import { ReplayScene } from './scenes/ReplayScene';
import { ChapterSelectScene } from './scenes/ChapterSelectScene';
import { CutsceneScene } from './scenes/CutsceneScene';
import { StoryGameScene } from './scenes/StoryGameScene';
import { StoryVictoryScene } from './scenes/StoryVictoryScene';
import { StoryGameOverScene } from './scenes/StoryGameOverScene';
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
  scene: [BootScene, MenuScene, GameScene, DualGameScene, GameOverScene, TrainingScene, JumpTrainingScene, PillTrainingScene, GuardTrainingScene, EndlessScene, EndlessGameOverScene, ArchiveScene, AchievementScene, SeasonScene, ChallengeEditorScene, ClubScene, ReplayScene, ChapterSelectScene, CutsceneScene, StoryGameScene, StoryVictoryScene, StoryGameOverScene]
};

new Phaser.Game(config);
