export interface GameData {
  score: number;
  highScore: number;
  floor: number;
  pills: number;
  hasShield: boolean;
  speedMultiplier: number;
  guardSlowMultiplier: number;
}

export interface SaveData {
  highScore: number;
  totalPills: number;
  gamesPlayed: number;
}

export interface Platform {
  x: number;
  y: number;
  width: number;
}
