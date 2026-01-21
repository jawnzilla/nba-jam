import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig';

export class MenuScene extends Phaser.Scene {
  private titleText!: Phaser.GameObjects.Text;
  private menuItems: Phaser.GameObjects.Text[] = [];
  private selectedIndex = 0;

  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    this.createBackground();
    this.createTitle();
    this.createMenuItems();
    this.setupInput();
    this.updateSelection();
  }

  private createBackground(): void {
    const graphics = this.add.graphics();
    graphics.fillGradientStyle(0x1a1a2e, 0x1a1a2e, 0x16213e, 0x16213e, 1);
    graphics.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    for (let i = 0; i < 50; i++) {
      const x = Phaser.Math.Between(0, GAME_WIDTH);
      const y = Phaser.Math.Between(0, GAME_HEIGHT);
      const size = Phaser.Math.Between(1, 3);
      graphics.fillStyle(0xffffff, Phaser.Math.FloatBetween(0.1, 0.5));
      graphics.fillCircle(x, y, size);
    }
  }

  private createTitle(): void {
    this.titleText = this.add.text(GAME_WIDTH / 2, 100, 'NBA HANGTIME', {
      fontFamily: 'Arial Black',
      fontSize: '64px',
      color: '#ff6b35',
      stroke: '#000000',
      strokeThickness: 8,
    });
    this.titleText.setOrigin(0.5);

    this.tweens.add({
      targets: this.titleText,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    const subtitle = this.add.text(GAME_WIDTH / 2, 160, 'WEB EDITION', {
      fontFamily: 'Arial',
      fontSize: '24px',
      color: '#ffffff',
    });
    subtitle.setOrigin(0.5);
  }

  private createMenuItems(): void {
    const items = ['START GAME', 'TEAM SELECT', 'OPTIONS', 'HIGH SCORES'];
    const startY = 280;
    const spacing = 60;

    items.forEach((text, index) => {
      const menuItem = this.add.text(GAME_WIDTH / 2, startY + index * spacing, text, {
        fontFamily: 'Arial Black',
        fontSize: '32px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 4,
      });
      menuItem.setOrigin(0.5);
      menuItem.setInteractive({ useHandCursor: true });

      menuItem.on('pointerover', () => {
        this.selectedIndex = index;
        this.updateSelection();
      });

      menuItem.on('pointerdown', () => {
        this.selectMenuItem();
      });

      this.menuItems.push(menuItem);
    });

    const instructions = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 50, 'PRESS ENTER TO SELECT', {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#888888',
    });
    instructions.setOrigin(0.5);

    this.tweens.add({
      targets: instructions,
      alpha: 0.3,
      duration: 500,
      yoyo: true,
      repeat: -1,
    });
  }

  private setupInput(): void {
    if (this.input.keyboard) {
      this.input.keyboard.on('keydown-UP', () => {
        this.selectedIndex = (this.selectedIndex - 1 + this.menuItems.length) % this.menuItems.length;
        this.updateSelection();
      });

      this.input.keyboard.on('keydown-DOWN', () => {
        this.selectedIndex = (this.selectedIndex + 1) % this.menuItems.length;
        this.updateSelection();
      });

      this.input.keyboard.on('keydown-ENTER', () => {
        this.selectMenuItem();
      });

      this.input.keyboard.on('keydown-SPACE', () => {
        this.selectMenuItem();
      });
    }
  }

  private updateSelection(): void {
    this.menuItems.forEach((item, index) => {
      if (index === this.selectedIndex) {
        item.setColor('#ff6b35');
        item.setScale(1.2);
      } else {
        item.setColor('#ffffff');
        item.setScale(1);
      }
    });
  }

  private selectMenuItem(): void {
    switch (this.selectedIndex) {
      case 0:
        this.scene.start('GameScene');
        break;
      case 1:
        this.scene.start('TeamSelectScene');
        break;
      case 2:
        break;
      case 3:
        break;
    }
  }
}
