import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COURT_BOUNDS } from '../config/gameConfig';
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

    court.fillStyle(0x8b4513, 1);
    court.fillRect(0, GAME_HEIGHT - 200, GAME_WIDTH, 200);

    court.lineStyle(4, 0xffffff, 1);
    court.strokeRect(COURT_BOUNDS.left, GAME_HEIGHT - 180, COURT_BOUNDS.right - COURT_BOUNDS.left, 160);

    court.strokeCircle(GAME_WIDTH / 2, GAME_HEIGHT - 100, 50);

    court.lineBetween(GAME_WIDTH / 2, GAME_HEIGHT - 180, GAME_WIDTH / 2, GAME_HEIGHT - 20);

    court.lineStyle(3, 0xff0000, 1);
    court.strokeRect(COURT_BOUNDS.left, GAME_HEIGHT - 140, 80, 100);
    court.strokeRect(COURT_BOUNDS.right - 80, GAME_HEIGHT - 140, 80, 100);
  }

  private createHoops(): void {
    const leftHoop = this.add.graphics();
    leftHoop.fillStyle(0xffffff, 1);
    leftHoop.fillRect(COURT_BOUNDS.left - 10, GAME_HEIGHT - 280, 15, 120);
    leftHoop.fillStyle(0xff0000, 1);
    leftHoop.fillRect(COURT_BOUNDS.left, GAME_HEIGHT - 170, 40, 5);

    const rightHoop = this.add.graphics();
    rightHoop.fillStyle(0xffffff, 1);
    rightHoop.fillRect(COURT_BOUNDS.right - 5, GAME_HEIGHT - 280, 15, 120);
    rightHoop.fillStyle(0xff0000, 1);
    rightHoop.fillRect(COURT_BOUNDS.right - 40, GAME_HEIGHT - 170, 40, 5);
  }

  private createPlayers(): void {
    const player1 = new Player(this, 200, GAME_HEIGHT - 120, 'player_blue', 1, false);
    const player2 = new Player(this, 300, GAME_HEIGHT - 120, 'player_blue', 2, false);
    const player3 = new Player(this, 500, GAME_HEIGHT - 120, 'player_red', 3, false);
    const player4 = new Player(this, 600, GAME_HEIGHT - 120, 'player_red', 4, false);

    this.players = [player1, player2, player3, player4];

    this.aiPlayers = [
      { player: player1, targetX: 200, targetY: GAME_HEIGHT - 120, decisionTimer: 0, role: 'offense' },
      { player: player2, targetX: 300, targetY: GAME_HEIGHT - 120, decisionTimer: 0, role: 'offense' },
      { player: player3, targetX: 500, targetY: GAME_HEIGHT - 120, decisionTimer: 0, role: 'defense' },
      { player: player4, targetX: 600, targetY: GAME_HEIGHT - 120, decisionTimer: 0, role: 'defense' },
    ];
  }

  private createBall(): void {
    this.ball = new Ball(this, GAME_WIDTH / 2, GAME_HEIGHT - 200);
    this.players[0].giveBall(this.ball);
  }

  private createUI(): void {
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.3);
    overlay.fillRect(0, 0, GAME_WIDTH, 100);

    this.titleText = this.add.text(GAME_WIDTH / 2, 30, 'NBA HANGTIME', {
      fontFamily: 'Arial Black',
      fontSize: '48px',
      color: '#ff6b35',
      stroke: '#000000',
      strokeThickness: 6,
    });
    this.titleText.setOrigin(0.5);

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

    this.pressStartText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 50, 'PRESS ANY KEY TO START', {
      fontFamily: 'Arial Black',
      fontSize: '28px',
      color: '#ffff00',
      stroke: '#000000',
      strokeThickness: 4,
    });
    this.pressStartText.setOrigin(0.5);

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
        const targetHoopX = player.playerId <= 2 ? COURT_BOUNDS.right - 50 : COURT_BOUNDS.left + 50;
        const distanceToHoop = Math.abs(player.x - targetHoopX);

        if (distanceToHoop < 150 && Math.random() > 0.3) {
          this.aiShoot(player);
        } else {
          ai.targetX = targetHoopX + Phaser.Math.Between(-100, 100);
          ai.targetY = GAME_HEIGHT - Phaser.Math.Between(80, 150);
        }
      } else {
        if (this.ball.isLoose()) {
          ai.targetX = this.ball.x;
          ai.targetY = this.ball.y;
        } else {
          const offsetX = player.playerId <= 2 ? 100 : -100;
          ai.targetX = GAME_WIDTH / 2 + offsetX + Phaser.Math.Between(-50, 50);
          ai.targetY = GAME_HEIGHT - Phaser.Math.Between(80, 150);
        }
      }
    } else {
      const ballHolder = this.ball.getHolder();
      if (ballHolder && ballHolder.playerId !== player.playerId) {
        ai.targetX = ballHolder.x + Phaser.Math.Between(-30, 30);
        ai.targetY = ballHolder.y + Phaser.Math.Between(-20, 20);
      } else if (this.ball.isLoose()) {
        ai.targetX = this.ball.x;
        ai.targetY = this.ball.y;
      } else {
        const defendHoopX = player.playerId <= 2 ? COURT_BOUNDS.left + 100 : COURT_BOUNDS.right - 100;
        ai.targetX = defendHoopX + Phaser.Math.Between(-50, 50);
        ai.targetY = GAME_HEIGHT - Phaser.Math.Between(100, 140);
      }
    }
  }

  private moveAIToTarget(ai: AIPlayer): void {
    const player = ai.player;
    const dx = ai.targetX - player.x;
    const dy = ai.targetY - player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 20) {
      const moveX = dx / distance;
      const moveY = dy > 30 ? -1 : 0;
      player.move(moveX, moveY);
    } else {
      player.move(0, 0);
    }

    if (this.ball.isLoose() && distance < 40) {
      player.giveBall(this.ball);
      this.possession = player.playerId <= 2 ? 'home' : 'away';
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
