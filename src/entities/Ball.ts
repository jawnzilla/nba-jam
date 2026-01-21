import Phaser from 'phaser';
import { GAME_HEIGHT, COURT_BOUNDS } from '../config/gameConfig';
import { Player } from './Player';

type FlightCompleteCallback = () => void;

export class Ball extends Phaser.GameObjects.Sprite {
  private holder: Player | null = null;
  private isInFlight = false;
  private isPassFlight = false;
  private targetX = 0;
  private targetY = 0;
  private flightProgress = 0;
  private startX = 0;
  private startY = 0;
  private arcHeight = 100;
  private flightSpeed = 0.025;
  private onFlightComplete: FlightCompleteCallback | null = null;
  private hoopZones: { left: Phaser.Geom.Rectangle; right: Phaser.Geom.Rectangle } | null = null;
  private bounceCount = 0;
  private maxBounces = 3;
  private shadow!: Phaser.GameObjects.Ellipse;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'ball');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setCircle(12);
    body.setBounce(0.6, 0.6);
    body.setCollideWorldBounds(true);
    body.setDrag(100);
    body.setFriction(0.3, 0.3);

    this.setDepth(15);
    this.setScale(1);

    this.shadow = scene.add.ellipse(x, GAME_HEIGHT - 20, 20, 8, 0x000000, 0.3);
    this.shadow.setDepth(5);
  }

  public setHoopZones(zones: { left: Phaser.Geom.Rectangle; right: Phaser.Geom.Rectangle } | null): void {
    this.hoopZones = zones;
  }

  public setHolder(player: Player): void {
    this.holder = player;
    this.isInFlight = false;
    this.isPassFlight = false;
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);
    body.setAllowGravity(false);
    this.bounceCount = 0;
  }

  public release(targetX: number, targetY: number): void {
    this.holder = null;
    this.isInFlight = true;
    this.isPassFlight = false;
    this.targetX = targetX;
    this.targetY = targetY;
    this.startX = this.x;
    this.startY = this.y;
    this.flightProgress = 0;
    this.bounceCount = 0;

    const distance = Phaser.Math.Distance.Between(this.x, this.y, targetX, targetY);
    this.arcHeight = Math.min(250, Math.max(100, distance * 0.5));
    this.flightSpeed = 0.02 + (1 / (distance + 100)) * 2;

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
  }

  public passTo(targetX: number, targetY: number, onComplete?: FlightCompleteCallback): void {
    this.holder = null;
    this.isInFlight = true;
    this.isPassFlight = true;
    this.targetX = targetX;
    this.targetY = targetY;
    this.startX = this.x;
    this.startY = this.y;
    this.flightProgress = 0;
    this.onFlightComplete = onComplete || null;

    const distance = Phaser.Math.Distance.Between(this.x, this.y, targetX, targetY);
    this.arcHeight = Math.min(50, distance * 0.2);
    this.flightSpeed = 0.05;

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
    this.isPassFlight = false;
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(true);
    body.setVelocity(Phaser.Math.Between(-50, 50), -100);
  }

  private updateFlight(): void {
    if (!this.isInFlight) return;

    this.flightProgress += this.flightSpeed;

    if (this.flightProgress >= 1) {
      this.isInFlight = false;
      const body = this.body as Phaser.Physics.Arcade.Body;
      body.setAllowGravity(true);

      const endVelocityX = (this.targetX - this.startX) * 0.3;
      body.setVelocity(endVelocityX, 150);

      if (this.isPassFlight && this.onFlightComplete) {
        this.onFlightComplete();
        this.onFlightComplete = null;
      } else if (!this.isPassFlight) {
        this.checkBasket();
      }
      this.isPassFlight = false;
      return;
    }

    const t = this.flightProgress;
    const easeT = this.easeInOutQuad(t);
    this.x = this.startX + (this.targetX - this.startX) * easeT;

    const linearY = this.startY + (this.targetY - this.startY) * t;
    const arc = -4 * this.arcHeight * t * (t - 1);
    this.y = linearY - arc;

    this.rotation += 0.15;
  }

  private easeInOutQuad(t: number): number {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  private checkBasket(): void {
    if (!this.hoopZones) {
      this.checkBasketLegacy();
      return;
    }

    const ballPoint = new Phaser.Geom.Point(this.x, this.y);

    const nearLeftHoop = this.hoopZones.left.contains(ballPoint.x, ballPoint.y);
    const nearRightHoop = this.hoopZones.right.contains(ballPoint.x, ballPoint.y);

    if (nearLeftHoop || nearRightHoop) {
      const gameScene = this.scene as unknown as { addScore: (team: 'home' | 'away', points: number) => void };
      if (typeof gameScene.addScore === 'function') {
        const team = nearRightHoop ? 'home' : 'away';
        const points = this.calculatePoints();
        gameScene.addScore(team, points);
      }
      this.createScoringEffect();
    } else {
      this.createMissEffect();
    }
  }

  private checkBasketLegacy(): void {
    const hoopLeftX = COURT_BOUNDS.left + 20;
    const hoopRightX = COURT_BOUNDS.right - 20;
    const hoopY = GAME_HEIGHT - 170;
    const tolerance = 35;

    const nearLeftHoop = Math.abs(this.x - hoopLeftX) < tolerance && Math.abs(this.y - hoopY) < tolerance;
    const nearRightHoop = Math.abs(this.x - hoopRightX) < tolerance && Math.abs(this.y - hoopY) < tolerance;

    if (nearLeftHoop || nearRightHoop) {
      const gameScene = this.scene as unknown as { addScore: (team: 'home' | 'away', points: number) => void };
      if (typeof gameScene.addScore === 'function') {
        const team = nearRightHoop ? 'home' : 'away';
        const points = this.calculatePoints();
        gameScene.addScore(team, points);
      }
      this.createScoringEffect();
    } else {
      this.createMissEffect();
    }
  }

  private calculatePoints(): number {
    const threePointLineLeft = COURT_BOUNDS.left + 150;
    const threePointLineRight = COURT_BOUNDS.right - 150;

    if (this.startX < threePointLineLeft || this.startX > threePointLineRight) {
      return 3;
    }
    return 2;
  }

  private createScoringEffect(): void {
    const particles = this.scene.add.particles(this.x, this.y, 'ball', {
      speed: { min: 100, max: 200 },
      scale: { start: 0.4, end: 0 },
      lifespan: 600,
      quantity: 15,
      tint: [0xffff00, 0xff6600, 0xffffff],
      angle: { min: 0, max: 360 },
    });

    this.scene.time.delayedCall(600, () => {
      particles.destroy();
    });

    const scoreText = this.scene.add.text(this.x, this.y - 50, 'SCORE!', {
      fontFamily: 'Arial Black',
      fontSize: '24px',
      color: '#ffff00',
      stroke: '#000000',
      strokeThickness: 4,
    });
    scoreText.setOrigin(0.5);

    this.scene.tweens.add({
      targets: scoreText,
      y: scoreText.y - 50,
      alpha: 0,
      duration: 1000,
      ease: 'Power2',
      onComplete: () => {
        scoreText.destroy();
      },
    });
  }

  private createMissEffect(): void {
    const rimSpark = this.scene.add.particles(this.x, this.y, 'ball', {
      speed: { min: 30, max: 80 },
      scale: { start: 0.2, end: 0 },
      lifespan: 300,
      quantity: 5,
      tint: 0xff6600,
    });

    this.scene.time.delayedCall(300, () => {
      rimSpark.destroy();
    });
  }

  private updateBounce(): void {
    const body = this.body as Phaser.Physics.Arcade.Body;

    if (body.blocked.down && !this.isInFlight && !this.holder) {
      this.bounceCount++;

      if (this.bounceCount >= this.maxBounces) {
        body.setVelocity(0, 0);
        body.setDrag(500);
      }
    }
  }

  private updateShadow(): void {
    this.shadow.x = this.x;
    const groundY = GAME_HEIGHT - 25;
    this.shadow.y = groundY;

    const heightAboveGround = Math.max(0, groundY - this.y);
    const shadowScale = Math.max(0.3, 1 - heightAboveGround / 300);
    const shadowAlpha = Math.max(0.1, 0.3 - heightAboveGround / 500);

    this.shadow.setScale(shadowScale, shadowScale * 0.4);
    this.shadow.setAlpha(shadowAlpha);
  }

  public update(): void {
    if (this.isInFlight) {
      this.updateFlight();
    } else if (this.holder) {
      this.followHolder();
    } else {
      this.updateBounce();
    }

    this.updateShadow();

    if (this.y > GAME_HEIGHT - 30) {
      this.y = GAME_HEIGHT - 30;
      const body = this.body as Phaser.Physics.Arcade.Body;
      if (body.velocity.y > 0) {
        body.setVelocityY(-body.velocity.y * 0.5);
      }
    }

    if (this.x < COURT_BOUNDS.left) {
      this.x = COURT_BOUNDS.left;
      const body = this.body as Phaser.Physics.Arcade.Body;
      body.setVelocityX(Math.abs(body.velocity.x) * 0.5);
    } else if (this.x > COURT_BOUNDS.right) {
      this.x = COURT_BOUNDS.right;
      const body = this.body as Phaser.Physics.Arcade.Body;
      body.setVelocityX(-Math.abs(body.velocity.x) * 0.5);
    }
  }

  public isLoose(): boolean {
    return !this.holder && !this.isInFlight;
  }

  public getHolder(): Player | null {
    return this.holder;
  }

  public destroy(fromScene?: boolean): void {
    this.shadow?.destroy();
    super.destroy(fromScene);
  }
}
