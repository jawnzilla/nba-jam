import Phaser from 'phaser';
import { GAME_HEIGHT } from '../config/gameConfig';
import { Player } from './Player';

export class Ball extends Phaser.GameObjects.Sprite {
  private holder: Player | null = null;
  private isInFlight = false;
  private targetX = 0;
  private targetY = 0;
  private flightProgress = 0;
  private startX = 0;
  private startY = 0;
  private arcHeight = 100;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'ball');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setCircle(15);
    body.setBounce(0.7);
    body.setCollideWorldBounds(true);
    body.setDrag(50);

    this.setDepth(15);
    this.setScale(1);
  }

  public setHolder(player: Player): void {
    this.holder = player;
    this.isInFlight = false;
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);
    body.setAllowGravity(false);
  }

  public release(targetX: number, targetY: number): void {
    this.holder = null;
    this.isInFlight = true;
    this.targetX = targetX;
    this.targetY = targetY;
    this.startX = this.x;
    this.startY = this.y;
    this.flightProgress = 0;

    const distance = Phaser.Math.Distance.Between(this.x, this.y, targetX, targetY);
    this.arcHeight = Math.min(200, distance * 0.4);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
  }

  public followHolder(): void {
    if (this.holder) {
      const offsetX = this.holder.flipX ? -25 : 25;
      this.x = this.holder.x + offsetX;
      this.y = this.holder.y - 60;
    }
  }

  public drop(): void {
    this.holder = null;
    this.isInFlight = false;
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(true);
  }

  private updateFlight(): void {
    if (!this.isInFlight) return;

    this.flightProgress += 0.02;

    if (this.flightProgress >= 1) {
      this.isInFlight = false;
      const body = this.body as Phaser.Physics.Arcade.Body;
      body.setAllowGravity(true);
      body.setVelocity(0, 100);

      this.checkBasket();
      return;
    }

    const t = this.flightProgress;
    this.x = this.startX + (this.targetX - this.startX) * t;

    const linearY = this.startY + (this.targetY - this.startY) * t;
    const arc = -4 * this.arcHeight * t * (t - 1);
    this.y = linearY - arc;

    this.rotation += 0.1;
  }

  private checkBasket(): void {
    const hoopLeftX = 70;
    const hoopRightX = 730;
    const hoopY = GAME_HEIGHT - 170;
    const tolerance = 30;

    const nearLeftHoop = Math.abs(this.x - hoopLeftX) < tolerance && Math.abs(this.y - hoopY) < tolerance;
    const nearRightHoop = Math.abs(this.x - hoopRightX) < tolerance && Math.abs(this.y - hoopY) < tolerance;

    if (nearLeftHoop || nearRightHoop) {
      const gameScene = this.scene as unknown as { addScore: (team: 'home' | 'away', points: number) => void };
      if (typeof gameScene.addScore === 'function') {
        const team = nearRightHoop ? 'home' : 'away';
        const points = this.startX > 200 && this.startX < 600 ? 2 : 3;
        gameScene.addScore(team, points);
      }

      this.createScoringEffect();
    }
  }

  private createScoringEffect(): void {
    const particles = this.scene.add.particles(this.x, this.y, 'ball', {
      speed: { min: 50, max: 150 },
      scale: { start: 0.3, end: 0 },
      lifespan: 500,
      quantity: 10,
      tint: 0xffff00,
    });

    this.scene.time.delayedCall(500, () => {
      particles.destroy();
    });
  }

  public update(): void {
    if (this.isInFlight) {
      this.updateFlight();
    } else if (this.holder) {
      this.followHolder();
    }

    if (this.y > GAME_HEIGHT - 30) {
      this.y = GAME_HEIGHT - 30;
      const body = this.body as Phaser.Physics.Arcade.Body;
      body.setVelocityY(-body.velocity.y * 0.5);
    }
  }
}
