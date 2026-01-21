import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' });
  }

  preload(): void {
    this.createLoadingBar();
    this.loadAssets();
  }

  private createLoadingBar(): void {
    const centerX = GAME_WIDTH / 2;
    const centerY = GAME_HEIGHT / 2;

    const titleText = this.add.text(centerX, centerY - 100, 'NBA HANGTIME', {
      fontFamily: 'Arial Black',
      fontSize: '48px',
      color: '#ff6b35',
      stroke: '#000000',
      strokeThickness: 6,
    });
    titleText.setOrigin(0.5);

    const progressBox = this.add.graphics();
    const progressBar = this.add.graphics();

    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(centerX - 160, centerY - 25, 320, 50);

    const loadingText = this.add.text(centerX, centerY - 50, 'LOADING...', {
      fontFamily: 'Arial',
      fontSize: '20px',
      color: '#ffffff',
    });
    loadingText.setOrigin(0.5);

    const percentText = this.add.text(centerX, centerY, '0%', {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#ffffff',
    });
    percentText.setOrigin(0.5);

    this.load.on('progress', (value: number) => {
      percentText.setText(`${Math.floor(value * 100)}%`);
      progressBar.clear();
      progressBar.fillStyle(0xff6b35, 1);
      progressBar.fillRect(centerX - 150, centerY - 15, 300 * value, 30);
    });

    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
      percentText.destroy();
    });
  }

  private loadAssets(): void {
    this.createPlaceholderGraphics();
  }

  private createPlaceholderGraphics(): void {
    const courtGraphics = this.make.graphics({ x: 0, y: 0 });
    courtGraphics.fillStyle(0x8b4513, 1);
    courtGraphics.fillRect(0, 0, 800, 400);
    courtGraphics.lineStyle(3, 0xffffff, 1);
    courtGraphics.strokeRect(50, 50, 700, 300);
    courtGraphics.strokeCircle(400, 200, 60);
    courtGraphics.generateTexture('court', 800, 400);
    courtGraphics.destroy();

    const playerGraphics = this.make.graphics({ x: 0, y: 0 });
    playerGraphics.fillStyle(0x3498db, 1);
    playerGraphics.fillRect(0, 0, 40, 80);
    playerGraphics.fillStyle(0xf39c12, 1);
    playerGraphics.fillCircle(20, 15, 15);
    playerGraphics.generateTexture('player_blue', 40, 80);
    playerGraphics.clear();
    playerGraphics.fillStyle(0xe74c3c, 1);
    playerGraphics.fillRect(0, 0, 40, 80);
    playerGraphics.fillStyle(0xf39c12, 1);
    playerGraphics.fillCircle(20, 15, 15);
    playerGraphics.generateTexture('player_red', 40, 80);
    playerGraphics.destroy();

    const ballGraphics = this.make.graphics({ x: 0, y: 0 });
    ballGraphics.fillStyle(0xff6b35, 1);
    ballGraphics.fillCircle(15, 15, 15);
    ballGraphics.lineStyle(2, 0x000000, 1);
    ballGraphics.strokeCircle(15, 15, 15);
    ballGraphics.lineBetween(15, 0, 15, 30);
    ballGraphics.lineBetween(0, 15, 30, 15);
    ballGraphics.generateTexture('ball', 30, 30);
    ballGraphics.destroy();

    const hoopGraphics = this.make.graphics({ x: 0, y: 0 });
    hoopGraphics.fillStyle(0xffffff, 1);
    hoopGraphics.fillRect(0, 0, 20, 100);
    hoopGraphics.fillStyle(0xff0000, 1);
    hoopGraphics.fillRect(15, 80, 50, 5);
    hoopGraphics.lineStyle(3, 0xffffff, 0.5);
    hoopGraphics.lineBetween(20, 85, 65, 120);
    hoopGraphics.lineBetween(65, 85, 65, 120);
    hoopGraphics.generateTexture('hoop', 80, 130);
    hoopGraphics.destroy();
  }

  create(): void {
    this.scene.start('AttractScene');
  }
}
