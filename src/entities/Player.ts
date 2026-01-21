import Phaser from 'phaser';
import { COURT_BOUNDS, COURT, GAME_SETTINGS, HOOPS } from '../config/gameConfig';
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
  public teamId: number;
  public courtY: number;

  private ball: Ball | null = null;
  private moveSpeed = 200;
  private isShooting = false;
  private isJumping = false;
  private jumpHeight = 0;
  private jumpVelocity = 0;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    texture: string,
    playerId: number,
    isControlled: boolean,
    stats: PlayerStats = DEFAULT_STATS,
    teamId: number = 0
  ) {
    super(scene, x, y, texture);

    this.playerId = playerId;
    this.isControlled = isControlled;
    this.stats = stats;
    this.teamId = teamId;
    this.courtY = y;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setCollideWorldBounds(false);
    body.setBounce(0);
    body.setSize(30, 70);
    body.setOffset(5, 10);
    body.setAllowGravity(false);

    this.setOrigin(0.5, 1);
    this.updateDepthAndScale();

    this.moveSpeed = 150 + this.stats.speed * 20;
  }

  public move(directionX: number, directionY: number): void {
    if (this.isShooting) return;

    const body = this.body as Phaser.Physics.Arcade.Body;
    const speed = this.moveSpeed;

    body.setVelocityX(directionX * speed);
    body.setVelocityY(directionY * speed);

    if (directionX < 0) {
      this.setFlipX(true);
    } else if (directionX > 0) {
      this.setFlipX(false);
    }
  }

  private constrainToCourt(): void {
    const body = this.body as Phaser.Physics.Arcade.Body;

    const leftBound = this.getLeftBoundAtY(this.y);
    const rightBound = this.getRightBoundAtY(this.y);

    if (this.x < leftBound) {
      this.x = leftBound;
      body.setVelocityX(0);
    }
    if (this.x > rightBound) {
      this.x = rightBound;
      body.setVelocityX(0);
    }
    if (this.y < COURT_BOUNDS.top) {
      this.y = COURT_BOUNDS.top;
      body.setVelocityY(0);
    }
    if (this.y > COURT_BOUNDS.bottom) {
      this.y = COURT_BOUNDS.bottom;
      body.setVelocityY(0);
    }

    this.courtY = this.y;
  }

  private getLeftBoundAtY(y: number): number {
    const t = (y - COURT.farY) / (COURT.nearY - COURT.farY);
    const nearWidth = COURT.rightX - COURT.leftX;
    const farWidth = nearWidth * COURT.perspectiveScale;
    const width = farWidth + (nearWidth - farWidth) * t;
    const center = COURT.centerX;
    return center - width / 2;
  }

  private getRightBoundAtY(y: number): number {
    const t = (y - COURT.farY) / (COURT.nearY - COURT.farY);
    const nearWidth = COURT.rightX - COURT.leftX;
    const farWidth = nearWidth * COURT.perspectiveScale;
    const width = farWidth + (nearWidth - farWidth) * t;
    const center = COURT.centerX;
    return center + width / 2;
  }

  private updateDepthAndScale(): void {
    const t = (this.courtY - COURT.farY) / (COURT.nearY - COURT.farY);
    const scale = COURT.perspectiveScale + (1 - COURT.perspectiveScale) * t;
    this.setScale(scale);
    this.setDepth(10 + this.courtY + this.jumpHeight);
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
    this.isJumping = true;
    this.jumpVelocity = 8;

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);

    this.scene.time.delayedCall(350, () => {
      if (this.ball) {
        const targetHoop = this.teamId === 0 ? HOOPS.far : HOOPS.near;
        this.ball.release(targetHoop.x, targetHoop.rimY);
        this.hasBall = false;
        this.ball = null;
      }
    });
  }

  public dunk(): void {
    if (!this.hasBall || !this.ball) return;

    this.isShooting = true;
    this.isJumping = true;
    this.jumpVelocity = 12;

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);

    const targetHoop = this.teamId === 0 ? HOOPS.far : HOOPS.near;
    const targetY = targetHoop.y + 30;

    this.scene.tweens.add({
      targets: this,
      x: targetHoop.x,
      y: targetY,
      duration: 600,
      ease: 'Power2',
      onUpdate: () => {
        this.courtY = this.y;
        this.updateDepthAndScale();
      },
      onComplete: () => {
        if (this.ball) {
          this.ball.release(targetHoop.x, targetHoop.rimY);
          this.hasBall = false;
          this.ball = null;
        }
      },
    });
  }

  private updateJump(): void {
    if (!this.isJumping) return;

    this.jumpHeight += this.jumpVelocity;
    this.jumpVelocity -= 0.5;

    if (this.jumpHeight <= 0) {
      this.jumpHeight = 0;
      this.isJumping = false;
      this.isShooting = false;
      this.jumpVelocity = 0;
    }

    this.y = this.courtY - this.jumpHeight;
    this.updateDepthAndScale();
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

  public getJumpHeight(): number {
    return this.jumpHeight;
  }

  public update(): void {
    this.regenTurbo();
    this.constrainToCourt();
    this.updateJump();
    this.updateDepthAndScale();

    if (this.ball && this.hasBall) {
      this.ball.followHolder();
    }
  }
}
