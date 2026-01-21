import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig';

export interface PauseMenuCallbacks {
  onResume: () => void;
  onRestart: () => void;
  onMainMenu: () => void;
}

export class PauseMenu {
  private scene: Phaser.Scene;
  private container!: Phaser.GameObjects.Container;
  private menuItems: Phaser.GameObjects.Text[] = [];
  private selectedIndex = 0;
  private callbacks: PauseMenuCallbacks;
  private confirmDialog: Phaser.GameObjects.Container | null = null;
  private isShowingConfirmDialog = false;
  private confirmSelectedIndex = 0;

  constructor(scene: Phaser.Scene, callbacks: PauseMenuCallbacks) {
    this.scene = scene;
    this.callbacks = callbacks;
    this.create();
  }

  private create(): void {
    this.container = this.scene.add.container(0, 0);
    this.container.setDepth(100);

    const overlay = this.scene.add.graphics();
    overlay.fillStyle(0x000000, 0.85);
    overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.container.add(overlay);

    const titleText = this.scene.add.text(GAME_WIDTH / 2, 150, 'PAUSED', {
      fontFamily: 'Arial Black',
      fontSize: '64px',
      color: '#ff6b35',
      stroke: '#000000',
      strokeThickness: 8,
    });
    titleText.setOrigin(0.5);
    this.container.add(titleText);

    const items = ['RESUME', 'RESTART GAME', 'MAIN MENU'];
    const startY = 280;
    const spacing = 70;

    items.forEach((text, index) => {
      const menuItem = this.scene.add.text(GAME_WIDTH / 2, startY + index * spacing, text, {
        fontFamily: 'Arial Black',
        fontSize: '36px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 4,
      });
      menuItem.setOrigin(0.5);
      this.container.add(menuItem);
      this.menuItems.push(menuItem);
    });

    const instructions = this.scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 60, 'ARROWS: Navigate | ENTER: Select | ESC: Resume', {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#888888',
    });
    instructions.setOrigin(0.5);
    this.container.add(instructions);

    this.updateSelection();
    this.container.setVisible(false);
  }

  public show(): void {
    this.selectedIndex = 0;
    this.updateSelection();
    this.container.setVisible(true);
    this.isShowingConfirmDialog = false;
    this.hideConfirmDialog();
  }

  public hide(): void {
    this.container.setVisible(false);
    this.hideConfirmDialog();
  }

  public isVisible(): boolean {
    return this.container.visible;
  }

  public navigateUp(): void {
    if (this.isShowingConfirmDialog) {
      this.confirmSelectedIndex = this.confirmSelectedIndex === 0 ? 1 : 0;
      this.updateConfirmSelection();
    } else {
      this.selectedIndex = (this.selectedIndex - 1 + this.menuItems.length) % this.menuItems.length;
      this.updateSelection();
    }
  }

  public navigateDown(): void {
    if (this.isShowingConfirmDialog) {
      this.confirmSelectedIndex = this.confirmSelectedIndex === 0 ? 1 : 0;
      this.updateConfirmSelection();
    } else {
      this.selectedIndex = (this.selectedIndex + 1) % this.menuItems.length;
      this.updateSelection();
    }
  }

  public select(): void {
    if (this.isShowingConfirmDialog) {
      this.handleConfirmSelection();
      return;
    }

    switch (this.selectedIndex) {
      case 0:
        this.callbacks.onResume();
        break;
      case 1:
        this.showConfirmDialog('RESTART GAME?', () => {
          this.callbacks.onRestart();
        });
        break;
      case 2:
        this.showConfirmDialog('RETURN TO MAIN MENU?', () => {
          this.callbacks.onMainMenu();
        });
        break;
    }
  }

  public cancel(): void {
    if (this.isShowingConfirmDialog) {
      this.hideConfirmDialog();
    } else {
      this.callbacks.onResume();
    }
  }

  private showConfirmDialog(message: string, onConfirm: () => void): void {
    this.isShowingConfirmDialog = true;
    this.confirmSelectedIndex = 0;

    this.confirmDialog = this.scene.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2);
    this.confirmDialog.setDepth(110);

    const dialogBg = this.scene.add.graphics();
    dialogBg.fillStyle(0x1a1a2e, 0.98);
    dialogBg.fillRoundedRect(-200, -120, 400, 240, 16);
    dialogBg.lineStyle(3, 0xff6b35, 1);
    dialogBg.strokeRoundedRect(-200, -120, 400, 240, 16);
    this.confirmDialog.add(dialogBg);

    const messageText = this.scene.add.text(0, -60, message, {
      fontFamily: 'Arial Black',
      fontSize: '24px',
      color: '#ffffff',
      align: 'center',
    });
    messageText.setOrigin(0.5);
    this.confirmDialog.add(messageText);

    const warningText = this.scene.add.text(0, -20, 'Progress will be lost!', {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#ff6b35',
      align: 'center',
    });
    warningText.setOrigin(0.5);
    this.confirmDialog.add(warningText);

    const yesBtn = this.scene.add.text(-70, 50, 'YES', {
      fontFamily: 'Arial Black',
      fontSize: '28px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
    });
    yesBtn.setOrigin(0.5);
    yesBtn.setName('yesBtn');
    yesBtn.setData('onConfirm', onConfirm);
    this.confirmDialog.add(yesBtn);

    const noBtn = this.scene.add.text(70, 50, 'NO', {
      fontFamily: 'Arial Black',
      fontSize: '28px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
    });
    noBtn.setOrigin(0.5);
    noBtn.setName('noBtn');
    this.confirmDialog.add(noBtn);

    this.container.add(this.confirmDialog);
    this.updateConfirmSelection();
  }

  private hideConfirmDialog(): void {
    if (this.confirmDialog) {
      this.confirmDialog.destroy();
      this.confirmDialog = null;
    }
    this.isShowingConfirmDialog = false;
  }

  private handleConfirmSelection(): void {
    if (this.confirmSelectedIndex === 0) {
      const yesBtn = this.confirmDialog?.getByName('yesBtn') as Phaser.GameObjects.Text;
      const onConfirm = yesBtn?.getData('onConfirm') as (() => void) | undefined;
      if (onConfirm) {
        onConfirm();
      }
    } else {
      this.hideConfirmDialog();
    }
  }

  private updateSelection(): void {
    this.menuItems.forEach((item, index) => {
      if (index === this.selectedIndex) {
        item.setColor('#ff6b35');
        item.setScale(1.15);
      } else {
        item.setColor('#ffffff');
        item.setScale(1);
      }
    });
  }

  private updateConfirmSelection(): void {
    if (!this.confirmDialog) return;

    const yesBtn = this.confirmDialog.getByName('yesBtn') as Phaser.GameObjects.Text;
    const noBtn = this.confirmDialog.getByName('noBtn') as Phaser.GameObjects.Text;

    if (yesBtn && noBtn) {
      if (this.confirmSelectedIndex === 0) {
        yesBtn.setColor('#ff6b35');
        yesBtn.setScale(1.15);
        noBtn.setColor('#ffffff');
        noBtn.setScale(1);
      } else {
        yesBtn.setColor('#ffffff');
        yesBtn.setScale(1);
        noBtn.setColor('#ff6b35');
        noBtn.setScale(1.15);
      }
    }
  }

  public destroy(): void {
    this.hideConfirmDialog();
    this.container.destroy();
  }
}
