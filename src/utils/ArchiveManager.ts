import { SaveManager } from './SaveManager';
import { ArchiveConfig } from '../config/ArchiveConfig';

export interface UnlockResult {
  newlyUnlocked: {
    type: 'character' | 'rumor' | 'floor';
    id: string;
    name: string;
  }[];
}

export class ArchiveManager {
  private static instance: ArchiveManager;

  private constructor() {}

  static getInstance(): ArchiveManager {
    if (!ArchiveManager.instance) {
      ArchiveManager.instance = new ArchiveManager();
    }
    return ArchiveManager.instance;
  }

  checkAllArchives(): UnlockResult {
    const saveManager = SaveManager.getInstance();
    const result: UnlockResult = { newlyUnlocked: [] };

    for (const profile of ArchiveConfig.CharacterProfiles) {
      if (!saveManager.isCharacterUnlocked(profile.id) && saveManager.isConditionMet(profile.unlockCondition)) {
        if (saveManager.unlockCharacter(profile.id)) {
          result.newlyUnlocked.push({
            type: 'character',
            id: profile.id,
            name: profile.name
          });
        }
      }
    }

    for (const rumor of ArchiveConfig.NightclubRumors) {
      if (!saveManager.isRumorUnlocked(rumor.id) && saveManager.isConditionMet(rumor.unlockCondition)) {
        if (saveManager.unlockRumor(rumor.id)) {
          result.newlyUnlocked.push({
            type: 'rumor',
            id: rumor.id,
            name: rumor.title
          });
        }
      }
    }

    for (const floor of ArchiveConfig.HiddenFloorRecords) {
      if (!saveManager.isHiddenFloorUnlocked(floor.id) && saveManager.isConditionMet(floor.unlockCondition)) {
        if (saveManager.unlockHiddenFloor(floor.id)) {
          result.newlyUnlocked.push({
            type: 'floor',
            id: floor.id,
            name: floor.floorName
          });
        }
      }
    }

    return result;
  }

  getArchiveProgress(): { characters: number; rumors: number; floors: number } {
    const saveManager = SaveManager.getInstance();
    return {
      characters: saveManager.getArchiveData().unlockedCharacters.length,
      rumors: saveManager.getArchiveData().unlockedRumors.length,
      floors: saveManager.getArchiveData().unlockedHiddenFloors.length
    };
  }

  getTotalArchiveCount(): { characters: number; rumors: number; floors: number } {
    return {
      characters: ArchiveConfig.CharacterProfiles.length,
      rumors: ArchiveConfig.NightclubRumors.length,
      floors: ArchiveConfig.HiddenFloorRecords.length
    };
  }
}
