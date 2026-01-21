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
      gravity: { x: 0, y: 0 },
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

export const COURT = {
  nearY: GAME_HEIGHT - 80,
  farY: 180,
  leftX: 80,
  rightX: GAME_WIDTH - 80,
  centerX: GAME_WIDTH / 2,
  centerY: (GAME_HEIGHT - 80 + 180) / 2,
  perspectiveScale: 0.6,
};

export const COURT_BOUNDS = {
  left: COURT.leftX,
  right: COURT.rightX,
  top: COURT.farY,
  bottom: COURT.nearY,
};

export const HOOPS = {
  near: {
    x: GAME_WIDTH / 2,
    y: COURT.nearY + 20,
    rimY: COURT.nearY - 40,
    scale: 1.2,
  },
  far: {
    x: GAME_WIDTH / 2,
    y: COURT.farY - 30,
    rimY: COURT.farY - 20,
    scale: 0.7,
  },
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
