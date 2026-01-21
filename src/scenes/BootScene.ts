import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    this.load.setBaseURL('./');
  }

  create(): void {
    this.scene.start('PreloadScene');
  }
}
