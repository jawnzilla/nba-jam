import Phaser from 'phaser';
import { COURT_BOUNDS, GAME_SETTINGS, GAME_HEIGHT } from '../config/gameConfig';
import { Ball } from './Ball';

export interface PlayerStats {
  speed: number;
  threePoint: number;
  dunk: number;
  defense: number;
  steal: number;
  block: number;
}

const DEFAULT_STATS: PlayerStats = {
  speed: 5,
  threePoint: 5,
  dunk: 5,
  defense: 5,
  steal: 5,
  block: 5,
};

export class Player extends Phaser.GameObjects.Sprite {
  public playerId: number;
  public isControlled: boolean;
  public hasBall = false;
  public stats: PlayerStats;
  public turbo: number = GAME_SETTINGS.turboMaximum;
  public isOnFire = false;
  public consecutiveScores = 0;

  private ball: Ball | null = null;
  private moveSpeed = 200;
  private isShooting = false;
  private jumpHeight = 150;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    texture: string,
    playerId: number,
    isControlled: boolean,
    stats: PlayerStats = DEFAULT_STATS
  ) {
    super(scene, x, y, texture);

    this.playerId = playerId;
    this.isControlled = isControlled;
    this.stats = stats;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setCollideWorldBounds(true);
    body.setBounce(0.1);
    body.setSize(30, 70);
    body.setOffset(5, 10);

    this.setOrigin(0.5, 1);
    this.setDepth(10);

    this.moveSpeed = 150 + this.stats.speed * 20;
  }

  public move(directionX: number, directionY: number): void {
    const body = this.body as Phaser.Physics.Arcade.Body;

    const speed = this.moveSpeed;

    body.setVelocityX(directionX * speed);

    if (directionY < 0 && body.blocked.down) {
      body.setVelocityY(-this.jumpHeight * 2);
    }

    if (directionX < 0) {
      this.setFlipX(true);
    } else if (directionX > 0) {
      this.setFlipX(false);
    }

    this.constrainToCourt();
  }

  private constrainToCourt(): void {
    if (this.x < COURT_BOUNDS.left + 20) {
      this.x = COURT_BOUNDS.left + 20;
    }
    if (this.x > COURT_BOUNDS.right - 20) {
      this.x = COURT_BOUNDS.right - 20;
    }
  }

  public giveBall(ball: Ball): void {
    this.ball = ball;
    this.hasBall = true;
    ball.setHolder(this);
  }

  public loseBall(): Ball | null {
    const ball = this.ball;
    this.ball = null;
    this.hasBall = false;
    return ball;
  }

  public shoot(): void {
    if (!this.hasBall || this.isShooting || !this.ball) return;

    this.isShooting = true;

    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body.blocked.down) {
      body.setVelocityY(-this.jumpHeight * 3);
    }

    this.scene.time.delayedCall(300, () => {
      if (this.ball) {
        const targetX = this.x < 400 ? COURT_BOUNDS.left + 20 : COURT_BOUNDS.right - 20;
        const targetY = GAME_HEIGHT - 170;

        this.ball.release(targetX, targetY);
        this.hasBall = false;
        this.ball = null;
      }
      this.isShooting = false;
    });
  }

  public dunk(): void {
    if (!this.hasBall || !this.ball) return;

    this.isShooting = true;

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocityY(-this.jumpHeight * 4);

    const targetX = this.x < 400 ? COURT_BOUNDS.left + 20 : COURT_BOUNDS.right - 20;

    this.scene.tweens.add({
      targets: this,
      x: targetX,
      duration: 500,
      ease: 'Power2',
      onComplete: () => {
        if (this.ball) {
          this.ball.release(targetX, GAME_HEIGHT - 170);
          this.hasBall = false;
          this.ball = null;
        }
        this.isShooting = false;
      },
    });
  }

  public useTurbo(amount: number): boolean {
    if (this.turbo >= amount) {
      this.turbo -= amount;
      return true;
    }
    return false;
  }

  public regenTurbo(): void {
    if (this.turbo < GAME_SETTINGS.turboMaximum) {
      this.turbo += GAME_SETTINGS.turboRegenRate;
      if (this.turbo > GAME_SETTINGS.turboMaximum) {
        this.turbo = GAME_SETTINGS.turboMaximum;
      }
    }
  }

  public scoreBasket(_points: number): void {
    this.consecutiveScores++;
    if (this.consecutiveScores >= GAME_SETTINGS.onFireThreshold && !this.isOnFire) {
      this.catchFire();
    }
  }

  public missBasket(): void {
    this.consecutiveScores = 0;
    if (this.isOnFire) {
      this.extinguishFire();
    }
  }

  private catchFire(): void {
    this.isOnFire = true;
    this.setTint(0xff6600);

    this.scene.time.delayedCall(GAME_SETTINGS.onFireDuration * 1000, () => {
      this.extinguishFire();
    });
  }

  private extinguishFire(): void {
    this.isOnFire = false;
    this.clearTint();
  }

  public update(): void {
    this.regenTurbo();
    this.constrainToCourt();

    if (this.ball && this.hasBall) {
      this.ball.followHolder();
    }
  }
}
