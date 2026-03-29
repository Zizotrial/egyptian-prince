export type Theme = 'classic' | 'pyramids' | 'space' | 'volcano' | 'ice' | 'underwater' | 'ruins' | 'sky' | 'palace';

export interface GameObject {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  type: 'platform' | 'enemy' | 'coin' | 'goal' | 'lava' | 'projectile' | 'fish' | 'questionBlock' | 'movingPlatform' | 'spikes' | 'powerup' | 'chaser';
  id: string;
  vx?: number;
  vy?: number;
  range?: number;
  startX?: number;
  startY?: number;
  speed?: number;
  hit?: boolean;
  powerupType?: 'speed' | 'jump' | 'invincible';
  isMoving?: boolean;
  moveRange?: number;
  moveAxis?: 'x' | 'y';
  direction?: 1 | -1;
  isGrounded?: boolean;
}

export interface Player {
  x: number;
  y: number;
  width: number;
  height: number;
  vx: number;
  vy: number;
  isGrounded: boolean;
  lives: number;
  coins: number;
  // Upgrades
  speedMultiplier: number;
  jumpMultiplier: number;
  maxLives: number;
  coinMagnet: boolean;
  shield: boolean;
  hasShield: boolean;
  characterName: string;
  characterColor: string;
}

export interface Level {
  id: number;
  name: string;
  theme: Theme;
  objects: GameObject[];
  gravity: number;
  jumpForce: number;
  startX: number;
  startY: number;
  width: number;
  height: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export type GameState = 'start' | 'characterSelect' | 'playing' | 'gameover' | 'win' | 'levelwin';
