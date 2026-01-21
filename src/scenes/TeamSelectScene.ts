import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig';
import { NBA_TEAMS } from '../data/teams';

export class TeamSelectScene extends Phaser.Scene {
  private selectedTeamIndex = 0;
  private teamNameText!: Phaser.GameObjects.Text;
  private teamCityText!: Phaser.GameObjects.Text;
  private teamLogo!: Phaser.GameObjects.Graphics;

  constructor() {
    super({ key: 'TeamSelectScene' });
  }

  create(): void {
    this.createBackground();
    this.createTitle();
    this.createTeamDisplay();
    this.setupInput();
    this.updateTeamDisplay();
  }

  private createBackground(): void {
    const graphics = this.add.graphics();
    graphics.fillGradientStyle(0x0f0f23, 0x0f0f23, 0x1a1a3e, 0x1a1a3e, 1);
    graphics.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  }

  private createTitle(): void {
    const title = this.add.text(GAME_WIDTH / 2, 50, 'SELECT YOUR TEAM', {
      fontFamily: 'Arial Black',
      fontSize: '40px',
      color: '#ff6b35',
      stroke: '#000000',
      strokeThickness: 6,
    });
    title.setOrigin(0.5);
  }

  private createTeamDisplay(): void {
    this.teamLogo = this.add.graphics();

    this.teamCityText = this.add.text(GAME_WIDTH / 2, 280, '', {
      fontFamily: 'Arial',
      fontSize: '24px',
      color: '#888888',
    });
    this.teamCityText.setOrigin(0.5);

    this.teamNameText = this.add.text(GAME_WIDTH / 2, 320, '', {
      fontFamily: 'Arial Black',
      fontSize: '48px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
    });
    this.teamNameText.setOrigin(0.5);

    const leftArrow = this.add.text(100, GAME_HEIGHT / 2, '<', {
      fontFamily: 'Arial Black',
      fontSize: '64px',
      color: '#ff6b35',
    });
    leftArrow.setOrigin(0.5);
    leftArrow.setInteractive({ useHandCursor: true });
    leftArrow.on('pointerdown', () => this.previousTeam());

    const rightArrow = this.add.text(GAME_WIDTH - 100, GAME_HEIGHT / 2, '>', {
      fontFamily: 'Arial Black',
      fontSize: '64px',
      color: '#ff6b35',
    });
    rightArrow.setOrigin(0.5);
    rightArrow.setInteractive({ useHandCursor: true });
    rightArrow.on('pointerdown', () => this.nextTeam());

    const selectButton = this.add.text(GAME_WIDTH / 2, 450, 'PRESS ENTER TO SELECT', {
      fontFamily: 'Arial Black',
      fontSize: '24px',
      color: '#ffffff',
    });
    selectButton.setOrigin(0.5);
    selectButton.setInteractive({ useHandCursor: true });
    selectButton.on('pointerdown', () => this.selectTeam());

    this.tweens.add({
      targets: selectButton,
      alpha: 0.5,
      duration: 500,
      yoyo: true,
      repeat: -1,
    });

    const backText = this.add.text(GAME_WIDTH / 2, 520, 'PRESS ESC TO GO BACK', {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#666666',
    });
    backText.setOrigin(0.5);
  }

  private setupInput(): void {
    if (this.input.keyboard) {
      this.input.keyboard.on('keydown-LEFT', () => this.previousTeam());
      this.input.keyboard.on('keydown-RIGHT', () => this.nextTeam());
      this.input.keyboard.on('keydown-ENTER', () => this.selectTeam());
      this.input.keyboard.on('keydown-SPACE', () => this.selectTeam());
      this.input.keyboard.on('keydown-ESC', () => this.scene.start('MenuScene'));
    }
  }

  private previousTeam(): void {
    this.selectedTeamIndex = (this.selectedTeamIndex - 1 + NBA_TEAMS.length) % NBA_TEAMS.length;
    this.updateTeamDisplay();
  }

  private nextTeam(): void {
    this.selectedTeamIndex = (this.selectedTeamIndex + 1) % NBA_TEAMS.length;
    this.updateTeamDisplay();
  }

  private updateTeamDisplay(): void {
    const team = NBA_TEAMS[this.selectedTeamIndex];
    this.teamCityText.setText(team.city);
    this.teamNameText.setText(team.name);
    this.teamNameText.setColor(`#${team.primaryColor.toString(16).padStart(6, '0')}`);

    this.teamLogo.clear();
    this.teamLogo.fillStyle(team.primaryColor, 1);
    this.teamLogo.fillCircle(GAME_WIDTH / 2, 180, 60);
    this.teamLogo.fillStyle(team.secondaryColor, 1);
    this.teamLogo.fillCircle(GAME_WIDTH / 2, 180, 40);
  }

  private selectTeam(): void {
    const team = NBA_TEAMS[this.selectedTeamIndex];
    this.registry.set('selectedTeam', team);
    this.scene.start('GameScene');
  }
}
