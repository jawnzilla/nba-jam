import Phaser from 'phaser';
import { BootScene } from '../scenes/BootScene';
import { PreloadScene } from '../scenes/PreloadScene';
import { AttractScene } from '../scenes/AttractScene';
import { MenuScene } from '../scenes/MenuScene';
import { TeamSelectScene } from '../scenes/TeamSelectScene';
import { GameScene } from '../scenes/GameScene';

export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 600;

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: 'game-container',
  backgroundColor: '#1a1a2e',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 800 },
      debug: false,
    },
  },
  scene: [BootScene, PreloadScene, AttractScene, MenuScene, TeamSelectScene, GameScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  pixelArt: true,
  antialias: false,
};

export const COURT_BOUNDS = {
  left: 50,
  right: GAME_WIDTH - 50,
  top: 100,
  bottom: GAME_HEIGHT - 50,
};

export const GAME_SETTINGS = {
  quarterLength: 120,
  shotClockTime: 24,
  maxPlayers: 4,
  turboMaximum: 100,
  turboRegenRate: 0.5,
  turboDepletionRate: 2,
  onFireThreshold: 3,
  onFireDuration: 15,
};
