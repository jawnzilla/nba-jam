import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COURT, COURT_BOUNDS, HOOPS } from '../config/gameConfig';
import { Player } from '../entities/Player';
import { Ball } from '../entities/Ball';
import { GameStateManager, GameState } from '../managers/GameStateManager';

interface AIPlayer {
  player: Player;
  targetX: number;
  targetY: number;
  decisionTimer: number;
  role: 'offense' | 'defense';
}

export class AttractScene extends Phaser.Scene {
  private players: Player[] = [];
  private aiPlayers: AIPlayer[] = [];
  private ball!: Ball;
  private homeScore = 0;
  private awayScore = 0;
  private scoreText!: Phaser.GameObjects.Text;
  private titleText!: Phaser.GameObjects.Text;
  private pressStartText!: Phaser.GameObjects.Text;
  private demoTimer = 0;
  private maxDemoTime = 60;
  private possession: 'home' | 'away' = 'home';
  private hoopZones: { near: Phaser.Geom.Rectangle; far: Phaser.Geom.Rectangle } | null = null;

  constructor() {
    super({ key: 'AttractScene' });
  }

  create(): void {
    this.homeScore = 0;
    this.awayScore = 0;
    this.demoTimer = 0;
    this.possession = 'home';

    this.createCourt();
    this.createHoops();
    this.createPlayers();
    this.createBall();
    this.createUI();
    this.setupInput();

    GameStateManager.setState(GameState.ATTRACT);
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

    const player1 = new Player(this, COURT.centerX - 80, startY, 'player_blue', 1, false, undefined, 0);
    const player2 = new Player(this, COURT.centerX - 150, startY + 40, 'player_blue', 2, false, undefined, 0);
    const player3 = new Player(this, COURT.centerX + 80, startY, 'player_red', 3, false, undefined, 1);
    const player4 = new Player(this, COURT.centerX + 150, startY + 40, 'player_red', 4, false, undefined, 1);

    this.players = [player1, player2, player3, player4];

    this.aiPlayers = [
      { player: player1, targetX: COURT.centerX - 80, targetY: startY, decisionTimer: 0, role: 'offense' },
      { player: player2, targetX: COURT.centerX - 150, targetY: startY + 40, decisionTimer: 0, role: 'offense' },
      { player: player3, targetX: COURT.centerX + 80, targetY: startY, decisionTimer: 0, role: 'defense' },
      { player: player4, targetX: COURT.centerX + 150, targetY: startY + 40, decisionTimer: 0, role: 'defense' },
    ];
  }

  private createBall(): void {
    this.ball = new Ball(this, COURT.centerX, COURT.centerY);
    this.ball.setHoopZones(this.hoopZones);
    this.players[0].giveBall(this.ball);
  }

  private createUI(): void {
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.3);
    overlay.fillRect(0, 0, GAME_WIDTH, 100);
    overlay.setDepth(1000);

    this.titleText = this.add.text(GAME_WIDTH / 2, 30, 'NBA HANGTIME', {
      fontFamily: 'Arial Black',
      fontSize: '48px',
      color: '#ff6b35',
      stroke: '#000000',
      strokeThickness: 6,
    });
    this.titleText.setOrigin(0.5);
    this.titleText.setDepth(1001);

    this.tweens.add({
      targets: this.titleText,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.scoreText = this.add.text(GAME_WIDTH / 2, 70, '0 - 0', {
      fontFamily: 'Arial Black',
      fontSize: '24px',
      color: '#ffffff',
    });
    this.scoreText.setOrigin(0.5);
    this.scoreText.setDepth(1001);

    this.pressStartText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 50, 'PRESS ANY KEY TO START', {
      fontFamily: 'Arial Black',
      fontSize: '28px',
      color: '#ffff00',
      stroke: '#000000',
      strokeThickness: 4,
    });
    this.pressStartText.setOrigin(0.5);
    this.pressStartText.setDepth(1001);

    this.tweens.add({
      targets: this.pressStartText,
      alpha: 0.3,
      duration: 500,
      yoyo: true,
      repeat: -1,
    });

    const demoText = this.add.text(GAME_WIDTH - 20, GAME_HEIGHT - 20, 'DEMO', {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#888888',
    });
    demoText.setOrigin(1, 1);
    demoText.setDepth(1001);
  }

  private setupInput(): void {
    this.input.keyboard?.on('keydown', () => {
      this.goToMenu();
    });

    this.input.on('pointerdown', () => {
      this.goToMenu();
    });
  }

  private goToMenu(): void {
    this.scene.start('MenuScene');
  }

  private updateAI(delta: number): void {
    const isHomeOffense = this.possession === 'home';

    this.aiPlayers.forEach((ai, index) => {
      const isHomeTeam = index < 2;
      ai.role = (isHomeTeam === isHomeOffense) ? 'offense' : 'defense';

      ai.decisionTimer -= delta;

      if (ai.decisionTimer <= 0) {
        ai.decisionTimer = Phaser.Math.Between(500, 1500);
        this.makeAIDecision(ai);
      }

      this.moveAIToTarget(ai);
    });
  }

  private makeAIDecision(ai: AIPlayer): void {
    const player = ai.player;
    const hasBall = player.hasBall;

    if (ai.role === 'offense') {
      if (hasBall) {
        const targetHoop = player.teamId === 0 ? HOOPS.far : HOOPS.near;
        const distanceToHoop = Math.abs(player.courtY - targetHoop.y);

        if (distanceToHoop < 100 && Math.random() > 0.3) {
          this.aiShoot(player);
        } else {
          ai.targetX = targetHoop.x + Phaser.Math.Between(-80, 80);
          ai.targetY = targetHoop.y + (player.teamId === 0 ? 80 : -80);
        }
      } else {
        if (this.ball.isLoose()) {
          ai.targetX = this.ball.x;
          ai.targetY = this.ball.getCourtY();
        } else {
          const offset = player.teamId === 0 ? -60 : 60;
          ai.targetX = COURT.centerX + offset + Phaser.Math.Between(-30, 30);
          ai.targetY = COURT.centerY + Phaser.Math.Between(-40, 40);
        }
      }
    } else {
      const ballHolder = this.ball.getHolder();
      if (ballHolder && ballHolder.playerId !== player.playerId) {
        ai.targetX = ballHolder.x + Phaser.Math.Between(-30, 30);
        ai.targetY = ballHolder.courtY + Phaser.Math.Between(-20, 20);
      } else if (this.ball.isLoose()) {
        ai.targetX = this.ball.x;
        ai.targetY = this.ball.getCourtY();
      } else {
        const defendHoop = player.teamId === 0 ? HOOPS.near : HOOPS.far;
        ai.targetX = defendHoop.x + Phaser.Math.Between(-50, 50);
        ai.targetY = defendHoop.y + (player.teamId === 0 ? -60 : 60);
      }
    }

    ai.targetY = Phaser.Math.Clamp(ai.targetY, COURT_BOUNDS.top, COURT_BOUNDS.bottom);
  }

  private moveAIToTarget(ai: AIPlayer): void {
    const player = ai.player;
    const dx = ai.targetX - player.x;
    const dy = ai.targetY - player.courtY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 20) {
      const moveX = dx / distance;
      const moveY = dy / distance;
      player.move(moveX, moveY);
    } else {
      player.move(0, 0);
    }

    if (this.ball.isLoose() && distance < 40) {
      player.giveBall(this.ball);
      this.possession = player.teamId === 0 ? 'home' : 'away';
    }
  }

  private aiShoot(player: Player): void {
    if (!player.hasBall) return;

    player.shoot();

    this.time.delayedCall(1500, () => {
      this.resetAfterShot();
    });
  }

  private resetAfterShot(): void {
    if (this.ball.isLoose()) {
      const newPossession = this.possession === 'home' ? 'away' : 'home';
      this.possession = newPossession;

      const receiver = this.players[newPossession === 'home' ? 0 : 2];
      receiver.giveBall(this.ball);
    }
  }

  public addScore(team: 'home' | 'away', points: number): void {
    if (team === 'home') {
      this.homeScore += points;
    } else {
      this.awayScore += points;
    }
    this.scoreText.setText(`${this.homeScore} - ${this.awayScore}`);
  }

  update(_time: number, delta: number): void {
    this.demoTimer += delta / 1000;

    if (this.demoTimer >= this.maxDemoTime) {
      this.homeScore = 0;
      this.awayScore = 0;
      this.demoTimer = 0;
      this.scoreText.setText('0 - 0');
    }

    this.updateAI(delta);

    this.players.forEach(player => player.update());
    this.ball.update();
  }
}
