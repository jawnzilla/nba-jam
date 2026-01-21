import Phaser from 'phaser';
import { COURT, COURT_BOUNDS, HOOPS } from '../config/gameConfig';
import { Player } from './Player';

type FlightCompleteCallback = () => void;

export class Ball extends Phaser.GameObjects.Sprite {
  private holder: Player | null = null;
  private isInFlight = false;
  private isPassFlight = false;
  private targetX = 0;
  private flightProgress = 0;
  private startX = 0;
  private startCourtY = 0;
  private targetCourtY = 0;
  private arcHeight = 100;
  private flightSpeed = 0.025;
  private onFlightComplete: FlightCompleteCallback | null = null;
  private hoopZones: { near: Phaser.Geom.Rectangle; far: Phaser.Geom.Rectangle } | null = null;
  private bounceCount = 0;
  private maxBounces = 3;
  private shadow!: Phaser.GameObjects.Ellipse;
  private courtY = 0;
  private ballHeight = 0;
  private velocityX = 0;
  private velocityY = 0;
  private velocityZ = 0;
  private isLooseOnCourt = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'ball');

    this.courtY = y;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setCircle(12);
    body.setBounce(0);
    body.setCollideWorldBounds(false);
    body.setDrag(0);
    body.setAllowGravity(false);

    this.setDepth(15);
    this.setScale(1);

    this.shadow = scene.add.ellipse(x, y + 5, 20, 8, 0x000000, 0.3);
    this.shadow.setDepth(5);
  }

  public setHoopZones(zones: { near: Phaser.Geom.Rectangle; far: Phaser.Geom.Rectangle } | null): void {
    this.hoopZones = zones;
  }

  public setHolder(player: Player): void {
    this.holder = player;
    this.isInFlight = false;
    this.isPassFlight = false;
    this.isLooseOnCourt = false;
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);
    this.bounceCount = 0;
    this.ballHeight = 0;
    this.velocityX = 0;
    this.velocityY = 0;
    this.velocityZ = 0;
  }

  public release(targetX: number, targetY: number): void {
    this.holder = null;
    this.isInFlight = true;
    this.isPassFlight = false;
    this.isLooseOnCourt = false;
    this.targetX = targetX;
    this.startX = this.x;
    this.startCourtY = this.courtY;
    this.targetCourtY = targetY;
    this.flightProgress = 0;
    this.bounceCount = 0;

    const distanceX = Math.abs(targetX - this.x);
    const distanceY = Math.abs(targetY - this.courtY);
    const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
    this.arcHeight = Math.min(200, Math.max(80, distance * 0.4));
    this.flightSpeed = 0.015 + (1 / (distance + 100)) * 1.5;

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);
  }

  public passTo(targetX: number, targetY: number, onComplete?: FlightCompleteCallback): void {
    this.holder = null;
    this.isInFlight = true;
    this.isPassFlight = true;
    this.isLooseOnCourt = false;
    this.targetX = targetX;
    this.startX = this.x;
    this.startCourtY = this.courtY;
    this.targetCourtY = targetY;
    this.flightProgress = 0;
    this.onFlightComplete = onComplete || null;

    const distance = Phaser.Math.Distance.Between(this.x, this.courtY, targetX, targetY);
    this.arcHeight = Math.min(40, distance * 0.15);
    this.flightSpeed = 0.04;

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);
  }

  public followHolder(): void {
    if (this.holder) {
      const offsetX = this.holder.flipX ? -20 : 20;
      const jumpHeight = this.holder.getJumpHeight();
      this.x = this.holder.x + offsetX;
      this.courtY = this.holder.courtY;
      this.ballHeight = 50 + jumpHeight;
      this.y = this.courtY - this.ballHeight;
      this.updateDepthAndScale();
    }
  }

  public drop(): void {
    this.holder = null;
    this.isInFlight = false;
    this.isPassFlight = false;
    this.isLooseOnCourt = true;
    this.velocityX = Phaser.Math.Between(-30, 30);
    this.velocityY = Phaser.Math.Between(-20, 20);
    this.velocityZ = 2;
  }

  private updateFlight(): void {
    if (!this.isInFlight) return;

    this.flightProgress += this.flightSpeed;

    if (this.flightProgress >= 1) {
      this.isInFlight = false;

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
    this.courtY = this.startCourtY + (this.targetCourtY - this.startCourtY) * t;

    const arc = 4 * this.arcHeight * t * (1 - t);
    this.ballHeight = arc;
    this.y = this.courtY - this.ballHeight;

    this.rotation += 0.15;
    this.updateDepthAndScale();
  }

  private easeInOutQuad(t: number): number {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  private checkBasket(): void {
    if (!this.hoopZones) {
      this.checkBasketLegacy();
      return;
    }

    const ballPoint = new Phaser.Geom.Point(this.x, this.courtY);

    const nearNear = this.hoopZones.near.contains(ballPoint.x, ballPoint.y);
    const nearFar = this.hoopZones.far.contains(ballPoint.x, ballPoint.y);

    if (nearNear || nearFar) {
      const gameScene = this.scene as unknown as { addScore: (team: 'home' | 'away', points: number) => void };
      if (typeof gameScene.addScore === 'function') {
        const team = nearFar ? 'home' : 'away';
        const points = this.calculatePoints();
        gameScene.addScore(team, points);
      }
      this.createScoringEffect();
    } else {
      this.createMissEffect();
    }

    this.startLooseBounce();
  }

  private checkBasketLegacy(): void {
    const tolerance = 40;

    const nearNearHoop = Math.abs(this.x - HOOPS.near.x) < tolerance && Math.abs(this.courtY - HOOPS.near.y) < tolerance;
    const nearFarHoop = Math.abs(this.x - HOOPS.far.x) < tolerance && Math.abs(this.courtY - HOOPS.far.y) < tolerance;

    if (nearNearHoop || nearFarHoop) {
      const gameScene = this.scene as unknown as { addScore: (team: 'home' | 'away', points: number) => void };
      if (typeof gameScene.addScore === 'function') {
        const team = nearFarHoop ? 'home' : 'away';
        const points = this.calculatePoints();
        gameScene.addScore(team, points);
      }
      this.createScoringEffect();
    } else {
      this.createMissEffect();
    }

    this.startLooseBounce();
  }

  private startLooseBounce(): void {
    this.isLooseOnCourt = true;
    this.velocityX = Phaser.Math.Between(-50, 50);
    this.velocityY = Phaser.Math.Between(-30, 30);
    this.velocityZ = 3;
    this.ballHeight = 20;
  }

  private calculatePoints(): number {
    const courtDepth = COURT.nearY - COURT.farY;
    const midCourtY = COURT.farY + courtDepth / 2;

    const distanceFromHoop = Math.abs(this.startCourtY - (this.targetCourtY < midCourtY ? HOOPS.far.y : HOOPS.near.y));
    if (distanceFromHoop > courtDepth * 0.4) {
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

    const scoreText = this.scene.add.text(this.x, this.y - 30, 'SCORE!', {
      fontFamily: 'Arial Black',
      fontSize: '24px',
      color: '#ffff00',
      stroke: '#000000',
      strokeThickness: 4,
    });
    scoreText.setOrigin(0.5);

    this.scene.tweens.add({
      targets: scoreText,
      y: scoreText.y - 40,
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

  private updateLooseBall(): void {
    if (!this.isLooseOnCourt) return;

    this.x += this.velocityX * 0.016 * 60;
    this.courtY += this.velocityY * 0.016 * 60;

    this.ballHeight += this.velocityZ;
    this.velocityZ -= 0.3;

    if (this.ballHeight <= 0) {
      this.ballHeight = 0;
      this.bounceCount++;

      if (this.bounceCount < this.maxBounces) {
        this.velocityZ = Math.abs(this.velocityZ) * 0.6;
        this.velocityX *= 0.7;
        this.velocityY *= 0.7;
      } else {
        this.velocityX = 0;
        this.velocityY = 0;
        this.velocityZ = 0;
      }
    }

    this.constrainToCourt();

    this.y = this.courtY - this.ballHeight;
    this.rotation += this.velocityX * 0.01;
    this.updateDepthAndScale();
  }

  private constrainToCourt(): void {
    const t = (this.courtY - COURT.farY) / (COURT.nearY - COURT.farY);
    const nearWidth = COURT.rightX - COURT.leftX;
    const farWidth = nearWidth * COURT.perspectiveScale;
    const width = farWidth + (nearWidth - farWidth) * t;
    const leftBound = COURT.centerX - width / 2;
    const rightBound = COURT.centerX + width / 2;

    if (this.x < leftBound) {
      this.x = leftBound;
      this.velocityX = Math.abs(this.velocityX) * 0.5;
    }
    if (this.x > rightBound) {
      this.x = rightBound;
      this.velocityX = -Math.abs(this.velocityX) * 0.5;
    }
    if (this.courtY < COURT_BOUNDS.top) {
      this.courtY = COURT_BOUNDS.top;
      this.velocityY = Math.abs(this.velocityY) * 0.5;
    }
    if (this.courtY > COURT_BOUNDS.bottom) {
      this.courtY = COURT_BOUNDS.bottom;
      this.velocityY = -Math.abs(this.velocityY) * 0.5;
    }
  }

  private updateDepthAndScale(): void {
    const t = (this.courtY - COURT.farY) / (COURT.nearY - COURT.farY);
    const scale = COURT.perspectiveScale + (1 - COURT.perspectiveScale) * t;
    this.setScale(scale * 0.8);
    this.setDepth(15 + this.courtY + this.ballHeight);
  }

  private updateShadow(): void {
    this.shadow.x = this.x;
    this.shadow.y = this.courtY + 5;

    const t = (this.courtY - COURT.farY) / (COURT.nearY - COURT.farY);
    const scale = COURT.perspectiveScale + (1 - COURT.perspectiveScale) * t;

    const shadowScale = scale * Math.max(0.4, 1 - this.ballHeight / 200);
    const shadowAlpha = Math.max(0.1, 0.3 - this.ballHeight / 400);

    this.shadow.setScale(shadowScale, shadowScale * 0.4);
    this.shadow.setAlpha(shadowAlpha);
    this.shadow.setDepth(5 + this.courtY);
  }

  public update(): void {
    if (this.isInFlight) {
      this.updateFlight();
    } else if (this.holder) {
      this.followHolder();
    } else if (this.isLooseOnCourt) {
      this.updateLooseBall();
    }

    this.updateShadow();
  }

  public isLoose(): boolean {
    return !this.holder && !this.isInFlight;
  }

  public getHolder(): Player | null {
    return this.holder;
  }

  public getCourtY(): number {
    return this.courtY;
  }

  public destroy(fromScene?: boolean): void {
    this.shadow?.destroy();
    super.destroy(fromScene);
  }
}
