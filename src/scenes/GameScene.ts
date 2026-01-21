import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COURT_BOUNDS, GAME_SETTINGS } from '../config/gameConfig';
import { Player } from '../entities/Player';
import { Ball } from '../entities/Ball';
import { InputManager, InputAction } from '../managers/InputManager';
import { GameStateManager, GameState } from '../managers/GameStateManager';
import { PauseMenu } from '../ui/PauseMenu';

export class GameScene extends Phaser.Scene {
  private players: Player[] = [];
  private ball!: Ball;
  private gameTime = GAME_SETTINGS.quarterLength;
  private shotClock = GAME_SETTINGS.shotClockTime;
  private homeScore = 0;
  private awayScore = 0;
  private quarter = 1;
  private isPaused = false;
  private timerEvent!: Phaser.Time.TimerEvent;
  private scoreText!: Phaser.GameObjects.Text;
  private timeText!: Phaser.GameObjects.Text;
  private shotClockText!: Phaser.GameObjects.Text;
  private quarterText!: Phaser.GameObjects.Text;
  private inputManager!: InputManager;
  private pauseMenu!: PauseMenu;
  private hoopZones: { left: Phaser.Geom.Rectangle; right: Phaser.Geom.Rectangle } | null = null;

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    this.resetGameState();
    this.createCourt();
    this.createHoops();
    this.createPlayers();
    this.createBall();
    this.createUI();
    this.setupInput();
    this.setupPauseMenu();
    this.startGameClock();
    GameStateManager.setState(GameState.GAMEPLAY);
  }

  private resetGameState(): void {
    this.gameTime = GAME_SETTINGS.quarterLength;
    this.shotClock = GAME_SETTINGS.shotClockTime;
    this.homeScore = 0;
    this.awayScore = 0;
    this.quarter = 1;
    this.isPaused = false;
    this.players = [];
    GameStateManager.resetGameData();
  }

  private createCourt(): void {
    const court = this.add.graphics();

    court.fillStyle(0x8b4513, 1);
    court.fillRect(0, GAME_HEIGHT - 200, GAME_WIDTH, 200);

    court.lineStyle(4, 0xffffff, 1);
    court.strokeRect(COURT_BOUNDS.left, GAME_HEIGHT - 180, COURT_BOUNDS.right - COURT_BOUNDS.left, 160);

    court.strokeCircle(GAME_WIDTH / 2, GAME_HEIGHT - 100, 50);

    court.lineBetween(GAME_WIDTH / 2, GAME_HEIGHT - 180, GAME_WIDTH / 2, GAME_HEIGHT - 20);

    court.lineStyle(3, 0xff0000, 1);
    court.strokeRect(COURT_BOUNDS.left, GAME_HEIGHT - 140, 80, 100);
    court.strokeRect(COURT_BOUNDS.right - 80, GAME_HEIGHT - 140, 80, 100);

    court.lineStyle(2, 0xff0000, 0.5);
    const threePointLeft = new Phaser.Curves.Path(COURT_BOUNDS.left, GAME_HEIGHT - 60);
    threePointLeft.ellipseTo(120, 100, 270, 90, false, 0);
    court.strokePoints(threePointLeft.getPoints(32));

    const threePointRight = new Phaser.Curves.Path(COURT_BOUNDS.right, GAME_HEIGHT - 60);
    threePointRight.ellipseTo(120, 100, 90, 270, false, 0);
    court.strokePoints(threePointRight.getPoints(32));
  }

  private createHoops(): void {
    const leftHoopX = COURT_BOUNDS.left + 20;
    const rightHoopX = COURT_BOUNDS.right - 20;
    const hoopY = GAME_HEIGHT - 170;

    const leftHoop = this.add.graphics();
    leftHoop.fillStyle(0xffffff, 1);
    leftHoop.fillRect(COURT_BOUNDS.left - 10, GAME_HEIGHT - 280, 15, 120);
    leftHoop.fillStyle(0xff0000, 1);
    leftHoop.fillRect(COURT_BOUNDS.left, GAME_HEIGHT - 170, 40, 5);
    leftHoop.lineStyle(2, 0xffffff, 0.7);
    for (let i = 0; i < 5; i++) {
      leftHoop.lineBetween(COURT_BOUNDS.left + i * 8, GAME_HEIGHT - 165, COURT_BOUNDS.left + 5 + i * 8, GAME_HEIGHT - 140);
    }

    const rightHoop = this.add.graphics();
    rightHoop.fillStyle(0xffffff, 1);
    rightHoop.fillRect(COURT_BOUNDS.right - 5, GAME_HEIGHT - 280, 15, 120);
    rightHoop.fillStyle(0xff0000, 1);
    rightHoop.fillRect(COURT_BOUNDS.right - 40, GAME_HEIGHT - 170, 40, 5);
    rightHoop.lineStyle(2, 0xffffff, 0.7);
    for (let i = 0; i < 5; i++) {
      rightHoop.lineBetween(COURT_BOUNDS.right - 40 + i * 8, GAME_HEIGHT - 165, COURT_BOUNDS.right - 35 + i * 8, GAME_HEIGHT - 140);
    }

    this.hoopZones = {
      left: new Phaser.Geom.Rectangle(leftHoopX - 25, hoopY - 25, 50, 50),
      right: new Phaser.Geom.Rectangle(rightHoopX - 25, hoopY - 25, 50, 50),
    };
  }

  private createPlayers(): void {
    const player1 = new Player(this, 200, GAME_HEIGHT - 120, 'player_blue', 1, true);
    const player2 = new Player(this, 300, GAME_HEIGHT - 120, 'player_blue', 2, false);
    const player3 = new Player(this, 500, GAME_HEIGHT - 120, 'player_red', 3, false);
    const player4 = new Player(this, 600, GAME_HEIGHT - 120, 'player_red', 4, false);

    this.players = [player1, player2, player3, player4];
  }

  private createBall(): void {
    this.ball = new Ball(this, GAME_WIDTH / 2, GAME_HEIGHT - 200);
    this.ball.setHoopZones(this.hoopZones);
    this.players[0].giveBall(this.ball);
  }

  private createUI(): void {
    const uiBackground = this.add.graphics();
    uiBackground.fillStyle(0x000000, 0.8);
    uiBackground.fillRect(0, 0, GAME_WIDTH, 80);

    this.add.text(100, 20, 'HOME', {
      fontFamily: 'Arial Black',
      fontSize: '16px',
      color: '#3498db',
    });

    this.add.text(GAME_WIDTH - 100, 20, 'AWAY', {
      fontFamily: 'Arial Black',
      fontSize: '16px',
      color: '#e74c3c',
    }).setOrigin(1, 0);

    this.scoreText = this.add.text(GAME_WIDTH / 2, 25, '0 - 0', {
      fontFamily: 'Arial Black',
      fontSize: '36px',
      color: '#ffffff',
    });
    this.scoreText.setOrigin(0.5, 0);

    this.timeText = this.add.text(GAME_WIDTH / 2, 55, this.formatTime(this.gameTime), {
      fontFamily: 'Arial',
      fontSize: '20px',
      color: '#ffff00',
    });
    this.timeText.setOrigin(0.5, 0);

    this.quarterText = this.add.text(GAME_WIDTH / 2 + 80, 55, 'Q' + this.quarter, {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#888888',
    });

    this.shotClockText = this.add.text(GAME_WIDTH - 20, 55, this.shotClock.toString(), {
      fontFamily: 'Arial Black',
      fontSize: '24px',
      color: '#ff6b35',
    });
    this.shotClockText.setOrigin(1, 0);

    const controlsText = this.add.text(20, GAME_HEIGHT - 20, 'ESC: Pause | Arrows/WASD: Move | Space: Shoot | E: Pass | Q: Steal | Shift: Turbo', {
      fontFamily: 'Arial',
      fontSize: '11px',
      color: '#666666',
    });
    controlsText.setOrigin(0, 1);
  }

  private setupInput(): void {
    this.inputManager = new InputManager(this);

    this.inputManager.onAction(InputAction.PAUSE, () => {
      this.togglePause();
    });

    this.inputManager.onAction(InputAction.SHOOT, () => {
      if (!this.isPaused) {
        this.playerAction();
      }
    });

    this.inputManager.onAction(InputAction.PASS, () => {
      if (!this.isPaused) {
        this.playerPass();
      }
    });

    this.inputManager.onAction(InputAction.STEAL, () => {
      if (!this.isPaused) {
        this.playerSteal();
      }
    });
  }

  private setupPauseMenu(): void {
    this.pauseMenu = new PauseMenu(this, {
      onResume: () => {
        this.resumeGame();
      },
      onRestart: () => {
        this.restartGame();
      },
      onMainMenu: () => {
        this.returnToMainMenu();
      },
    });

    this.input.keyboard?.on('keydown-UP', () => {
      if (this.isPaused) {
        this.pauseMenu.navigateUp();
      }
    });

    this.input.keyboard?.on('keydown-DOWN', () => {
      if (this.isPaused) {
        this.pauseMenu.navigateDown();
      }
    });

    this.input.keyboard?.on('keydown-W', () => {
      if (this.isPaused) {
        this.pauseMenu.navigateUp();
      }
    });

    this.input.keyboard?.on('keydown-S', () => {
      if (this.isPaused) {
        this.pauseMenu.navigateDown();
      }
    });

    this.input.keyboard?.on('keydown-ENTER', () => {
      if (this.isPaused) {
        this.pauseMenu.select();
      }
    });

    this.input.keyboard?.on('keydown-SPACE', () => {
      if (this.isPaused) {
        this.pauseMenu.select();
      }
    });
  }

  private startGameClock(): void {
    this.timerEvent = this.time.addEvent({
      delay: 1000,
      callback: this.updateGameClock,
      callbackScope: this,
      loop: true,
    });
  }

  private updateGameClock(): void {
    if (this.isPaused) return;

    this.gameTime--;
    this.shotClock--;

    this.timeText.setText(this.formatTime(this.gameTime));
    this.shotClockText.setText(Math.max(0, this.shotClock).toString());

    GameStateManager.updateGameData({
      homeScore: this.homeScore,
      awayScore: this.awayScore,
      quarter: this.quarter,
      timeRemaining: this.gameTime,
    });

    if (this.shotClock <= 5) {
      this.shotClockText.setColor('#ff0000');
    } else {
      this.shotClockText.setColor('#ff6b35');
    }

    if (this.shotClock <= 0) {
      this.shotClockViolation();
    }

    if (this.gameTime <= 0) {
      this.endQuarter();
    }
  }

  private formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  private togglePause(): void {
    if (this.isPaused) {
      this.resumeGame();
    } else {
      this.pauseGame();
    }
  }

  private pauseGame(): void {
    this.isPaused = true;
    this.physics.pause();
    this.inputManager.setEnabled(false);
    this.pauseMenu.show();
    GameStateManager.setState(GameState.PAUSED);
  }

  private resumeGame(): void {
    this.isPaused = false;
    this.physics.resume();
    this.inputManager.setEnabled(true);
    this.pauseMenu.hide();
    GameStateManager.setState(GameState.GAMEPLAY);
  }

  private restartGame(): void {
    this.pauseMenu.hide();
    this.timerEvent?.destroy();
    this.inputManager?.destroy();
    this.scene.restart();
  }

  private returnToMainMenu(): void {
    this.pauseMenu.hide();
    this.timerEvent?.destroy();
    this.inputManager?.destroy();
    GameStateManager.setState(GameState.MENU);
    GameStateManager.resetGameData();
    this.scene.start('MenuScene');
  }

  private playerAction(): void {
    const controlledPlayer = this.players[0];
    if (controlledPlayer.hasBall) {
      const inputState = this.inputManager.getInputState();
      if (inputState.turbo && controlledPlayer.useTurbo(20)) {
        controlledPlayer.dunk();
      } else {
        controlledPlayer.shoot();
      }
    }
  }

  private playerPass(): void {
    const controlledPlayer = this.players[0];
    if (controlledPlayer.hasBall) {
      const teammate = this.players[1];
      if (teammate) {
        const ball = controlledPlayer.loseBall();
        if (ball) {
          ball.passTo(teammate.x, teammate.y - 40, () => {
            teammate.giveBall(ball);
          });
        }
      }
    }
  }

  private playerSteal(): void {
    const controlledPlayer = this.players[0];
    if (!controlledPlayer.hasBall) {
      const stealRange = 60;
      for (const player of this.players) {
        if (player.playerId !== controlledPlayer.playerId && player.hasBall) {
          const distance = Phaser.Math.Distance.Between(
            controlledPlayer.x, controlledPlayer.y,
            player.x, player.y
          );
          if (distance < stealRange) {
            const stealChance = (controlledPlayer.stats.steal / 10) * 0.4;
            if (Math.random() < stealChance) {
              const ball = player.loseBall();
              if (ball) {
                controlledPlayer.giveBall(ball);
              }
            }
            break;
          }
        }
      }
    }
  }

  private shotClockViolation(): void {
    this.resetShotClock();
  }

  private resetShotClock(): void {
    this.shotClock = GAME_SETTINGS.shotClockTime;
    this.shotClockText.setColor('#ff6b35');
  }

  private endQuarter(): void {
    this.quarter++;
    this.quarterText.setText('Q' + Math.min(this.quarter, 4));

    if (this.quarter > 4) {
      this.endGame();
    } else {
      this.gameTime = GAME_SETTINGS.quarterLength;
      this.resetShotClock();
    }
  }

  private endGame(): void {
    this.timerEvent.destroy();
    GameStateManager.setState(GameState.GAME_OVER);
    this.scene.start('MenuScene');
  }

  public addScore(team: 'home' | 'away', points: number): void {
    if (team === 'home') {
      this.homeScore += points;
    } else {
      this.awayScore += points;
    }
    this.scoreText.setText(`${this.homeScore} - ${this.awayScore}`);
    this.resetShotClock();

    GameStateManager.updateGameData({
      homeScore: this.homeScore,
      awayScore: this.awayScore,
    });
  }

  update(): void {
    if (this.isPaused) return;

    const controlledPlayer = this.players[0];
    const inputState = this.inputManager.getInputState();

    let speed = 1;
    if (inputState.turbo && controlledPlayer.useTurbo(GAME_SETTINGS.turboDepletionRate * 0.016)) {
      speed = 1.5;
    }

    controlledPlayer.move(inputState.moveX * speed, inputState.moveY);

    this.players.forEach(player => player.update());
    this.ball.update();
  }

  shutdown(): void {
    this.inputManager?.destroy();
    this.pauseMenu?.destroy();
    this.timerEvent?.destroy();
  }
}
