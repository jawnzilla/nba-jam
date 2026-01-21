import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COURT, HOOPS, GAME_SETTINGS } from '../config/gameConfig';
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
  private hoopZones: { near: Phaser.Geom.Rectangle; far: Phaser.Geom.Rectangle } | null = null;

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

    const gradient = this.add.graphics();
    gradient.fillStyle(0x2a1810, 1);
    gradient.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    gradient.setDepth(0);

    const nearLeft = COURT.leftX;
    const nearRight = COURT.rightX;
    const farLeft = COURT.centerX - (COURT.rightX - COURT.leftX) * COURT.perspectiveScale / 2;
    const farRight = COURT.centerX + (COURT.rightX - COURT.leftX) * COURT.perspectiveScale / 2;

    court.fillStyle(0xcd853f, 1);
    court.beginPath();
    court.moveTo(nearLeft, COURT.nearY);
    court.lineTo(nearRight, COURT.nearY);
    court.lineTo(farRight, COURT.farY);
    court.lineTo(farLeft, COURT.farY);
    court.closePath();
    court.fillPath();
    court.setDepth(1);

    court.lineStyle(4, 0xffffff, 1);
    court.beginPath();
    court.moveTo(nearLeft, COURT.nearY);
    court.lineTo(nearRight, COURT.nearY);
    court.lineTo(farRight, COURT.farY);
    court.lineTo(farLeft, COURT.farY);
    court.closePath();
    court.strokePath();

    const midY = (COURT.nearY + COURT.farY) / 2;
    const midT = 0.5;
    const midWidth = (COURT.rightX - COURT.leftX) * (COURT.perspectiveScale + (1 - COURT.perspectiveScale) * midT);
    const midLeft = COURT.centerX - midWidth / 2;
    const midRight = COURT.centerX + midWidth / 2;

    court.lineStyle(3, 0xffffff, 0.8);
    court.lineBetween(midLeft, midY, midRight, midY);

    const circlePoints: Phaser.Math.Vector2[] = [];
    for (let i = 0; i <= 32; i++) {
      const angle = (i / 32) * Math.PI * 2;
      const cx = Math.cos(angle) * 40;
      const cy = Math.sin(angle) * 25;
      circlePoints.push(new Phaser.Math.Vector2(COURT.centerX + cx, midY + cy));
    }
    court.lineStyle(3, 0xffffff, 0.8);
    court.strokePoints(circlePoints, true);

    this.drawPaintArea(court, COURT.farY, 0.6, 0xff0000);
    this.drawPaintArea(court, COURT.nearY, 1.0, 0xff0000);

    this.drawThreePointLine(court, COURT.farY, -1);
    this.drawThreePointLine(court, COURT.nearY, 1);
  }

  private drawPaintArea(graphics: Phaser.GameObjects.Graphics, baseY: number, scale: number, color: number): void {
    const paintWidth = 80 * scale;
    const paintDepth = 60 * scale;
    const direction = baseY < COURT.centerY ? 1 : -1;

    graphics.lineStyle(3, color, 0.8);
    graphics.strokeRect(
      COURT.centerX - paintWidth / 2,
      baseY + (direction > 0 ? 0 : -paintDepth),
      paintWidth,
      paintDepth
    );
  }

  private drawThreePointLine(graphics: Phaser.GameObjects.Graphics, baseY: number, direction: number): void {
    const arcRadius = 100;
    const scale = baseY < COURT.centerY ? COURT.perspectiveScale : 1;
    const scaledRadius = arcRadius * scale;

    graphics.lineStyle(2, 0xff0000, 0.5);

    const points: Phaser.Math.Vector2[] = [];
    for (let i = 0; i <= 16; i++) {
      const angle = (i / 16) * Math.PI;
      const x = COURT.centerX + Math.cos(angle) * scaledRadius;
      const yOffset = Math.sin(angle) * scaledRadius * 0.5 * direction;
      points.push(new Phaser.Math.Vector2(x, baseY + yOffset));
    }

    graphics.strokePoints(points, false);
  }

  private createHoops(): void {
    const farHoop = this.add.graphics();
    farHoop.setDepth(COURT.farY - 10);

    farHoop.fillStyle(0xffffff, 1);
    farHoop.fillRect(HOOPS.far.x - 5, HOOPS.far.y - 60, 10, 50);

    farHoop.fillStyle(0xffffff, 1);
    farHoop.fillRect(HOOPS.far.x - 30, HOOPS.far.y - 65, 60, 40);

    farHoop.fillStyle(0xff4400, 1);
    farHoop.fillEllipse(HOOPS.far.x, HOOPS.far.rimY, 30 * HOOPS.far.scale, 10 * HOOPS.far.scale);

    const nearHoop = this.add.graphics();
    nearHoop.setDepth(COURT.nearY + 100);

    nearHoop.fillStyle(0xffffff, 1);
    nearHoop.fillRect(HOOPS.near.x - 8, HOOPS.near.y, 16, 80);

    nearHoop.fillStyle(0xffffff, 1);
    nearHoop.fillRect(HOOPS.near.x - 45, HOOPS.near.y - 5, 90, 60);

    nearHoop.fillStyle(0xff4400, 1);
    nearHoop.fillEllipse(HOOPS.near.x, HOOPS.near.rimY, 35 * HOOPS.near.scale, 12 * HOOPS.near.scale);

    this.hoopZones = {
      far: new Phaser.Geom.Rectangle(HOOPS.far.x - 30, HOOPS.far.y - 40, 60, 60),
      near: new Phaser.Geom.Rectangle(HOOPS.near.x - 35, HOOPS.near.rimY - 30, 70, 70),
    };
  }

  private createPlayers(): void {
    const startY = COURT.centerY + 50;

    const player1 = new Player(this, COURT.centerX - 80, startY, 'player_blue', 1, true, undefined, 0);
    const player2 = new Player(this, COURT.centerX - 150, startY + 40, 'player_blue', 2, false, undefined, 0);
    const player3 = new Player(this, COURT.centerX + 80, startY, 'player_red', 3, false, undefined, 1);
    const player4 = new Player(this, COURT.centerX + 150, startY + 40, 'player_red', 4, false, undefined, 1);

    this.players = [player1, player2, player3, player4];
  }

  private createBall(): void {
    this.ball = new Ball(this, COURT.centerX, COURT.centerY);
    this.ball.setHoopZones(this.hoopZones);
    this.players[0].giveBall(this.ball);
  }

  private createUI(): void {
    const uiBackground = this.add.graphics();
    uiBackground.fillStyle(0x000000, 0.8);
    uiBackground.fillRect(0, 0, GAME_WIDTH, 80);
    uiBackground.setDepth(1000);

    const homeText = this.add.text(100, 20, 'HOME', {
      fontFamily: 'Arial Black',
      fontSize: '16px',
      color: '#3498db',
    });
    homeText.setDepth(1001);

    const awayText = this.add.text(GAME_WIDTH - 100, 20, 'AWAY', {
      fontFamily: 'Arial Black',
      fontSize: '16px',
      color: '#e74c3c',
    });
    awayText.setOrigin(1, 0);
    awayText.setDepth(1001);

    this.scoreText = this.add.text(GAME_WIDTH / 2, 25, '0 - 0', {
      fontFamily: 'Arial Black',
      fontSize: '36px',
      color: '#ffffff',
    });
    this.scoreText.setOrigin(0.5, 0);
    this.scoreText.setDepth(1001);

    this.timeText = this.add.text(GAME_WIDTH / 2, 55, this.formatTime(this.gameTime), {
      fontFamily: 'Arial',
      fontSize: '20px',
      color: '#ffff00',
    });
    this.timeText.setOrigin(0.5, 0);
    this.timeText.setDepth(1001);

    this.quarterText = this.add.text(GAME_WIDTH / 2 + 80, 55, 'Q' + this.quarter, {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#888888',
    });
    this.quarterText.setDepth(1001);

    this.shotClockText = this.add.text(GAME_WIDTH - 20, 55, this.shotClock.toString(), {
      fontFamily: 'Arial Black',
      fontSize: '24px',
      color: '#ff6b35',
    });
    this.shotClockText.setOrigin(1, 0);
    this.shotClockText.setDepth(1001);

    const controlsText = this.add.text(20, GAME_HEIGHT - 20, 'ESC: Pause | Arrows/WASD: Move | Space: Shoot | E: Pass | Q: Steal | Shift: Turbo', {
      fontFamily: 'Arial',
      fontSize: '11px',
      color: '#666666',
    });
    controlsText.setOrigin(0, 1);
    controlsText.setDepth(1001);
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
          ball.passTo(teammate.x, teammate.courtY, () => {
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
            controlledPlayer.x, controlledPlayer.courtY,
            player.x, player.courtY
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

    controlledPlayer.move(inputState.moveX * speed, inputState.moveY * speed);

    this.players.forEach(player => player.update());
    this.ball.update();
  }

  shutdown(): void {
    this.inputManager?.destroy();
    this.pauseMenu?.destroy();
    this.timerEvent?.destroy();
  }
}
