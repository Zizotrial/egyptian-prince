import { Level, GameObject } from './types';

const generateId = () => Math.random().toString(36).substr(2, 9);

const createPlatform = (x: number, y: number, width: number, height: number, color: string = '#DAA520'): GameObject => ({
  id: generateId(),
  x, y, width, height, color, type: 'platform'
});

const createEnemy = (x: number, y: number, range: number = 100, speed: number = 2, color: string = '#FF0000'): GameObject => ({
  id: generateId(),
  x, y, width: 30, height: 30, color, type: 'enemy',
  vx: speed, startX: x, range
});

const createCoin = (x: number, y: number): GameObject => ({
  id: generateId(),
  x, y, width: 20, height: 20, color: '#FFD700', type: 'coin'
});

const createGoal = (x: number, y: number): GameObject => ({
  id: generateId(),
  x, y, width: 40, height: 60, color: '#00FF00', type: 'goal'
});

const createLava = (x: number, y: number, width: number, height: number): GameObject => ({
  id: generateId(),
  x, y, width, height, color: '#FF4500', type: 'lava'
});

const createFish = (x: number, y: number): GameObject => ({
  id: generateId(),
  x, y, width: 30, height: 25, color: '#FF0000', type: 'fish',
  vy: -15
});

const createQuestionBlock = (x: number, y: number): GameObject => ({
  id: generateId(),
  x, y, width: 40, height: 40, color: '#FFD700', type: 'questionBlock',
  hit: false
});

const createMovingPlatform = (x: number, y: number, width: number, height: number, range: number, axis: 'x' | 'y' = 'x', speed: number = 2, color: string = '#DAA520'): GameObject => ({
  id: generateId(),
  x, y, width, height, color, type: 'movingPlatform',
  startX: x, startY: y, moveRange: range, moveAxis: axis, vx: axis === 'x' ? speed : 0, vy: axis === 'y' ? speed : 0
});

const createSpikes = (x: number, y: number, width: number = 40): GameObject => ({
  id: generateId(),
  x, y, width, height: 20, color: '#708090', type: 'spikes'
});

const createPowerup = (x: number, y: number, powerupType: 'speed' | 'jump' | 'invincible'): GameObject => ({
  id: generateId(),
  x, y, width: 30, height: 30, color: powerupType === 'speed' ? '#00FF00' : (powerupType === 'jump' ? '#0000FF' : '#FF00FF'), type: 'powerup', powerupType
});

const createChaser = (x: number, y: number, speed: number = 3): GameObject => ({
  id: generateId(),
  x, y, width: 30, height: 40, color: '#CD853F', type: 'chaser', speed
});

export const LEVELS: Level[] = [
  {
    id: 1,
    name: "Nile Delta",
    theme: 'classic',
    startX: 50,
    startY: 400,
    width: 3000,
    height: 600,
    gravity: 0.8,
    jumpForce: -22,
    objects: [
      createPlatform(0, 500, 600, 100),
      createEnemy(300, 470, 200, 2),
      createPlatform(700, 400, 200, 40),
      createChaser(800, 360, 3.5),
      createMovingPlatform(1000, 350, 150, 30, 200, 'x', 3),
      createPlatform(1300, 300, 200, 40),
      createSpikes(1400, 280, 40),
      createQuestionBlock(1500, 150),
      createPlatform(1600, 400, 200, 40),
      createChaser(1700, 360, 3.8),
      createMovingPlatform(1900, 400, 150, 30, 150, 'y', 2),
      createPlatform(2200, 300, 200, 40),
      createPowerup(2300, 250, 'jump'),
      createPlatform(2500, 500, 500, 100),
      createGoal(2800, 440)
    ]
  },
  {
    id: 2,
    name: "Giza Plateau",
    theme: 'pyramids',
    startX: 50,
    startY: 400,
    width: 3000,
    height: 600,
    gravity: 0.9,
    jumpForce: -20,
    objects: [
      createPlatform(0, 500, 400, 100, '#DAA520'),
      createSpikes(200, 480, 80),
      createMovingPlatform(500, 400, 150, 30, 200, 'x', 4, '#DAA520'),
      createPlatform(800, 350, 200, 40, '#DAA520'),
      createEnemy(850, 320, 100, 4, '#8B0000'),
      createChaser(900, 310, 3.5),
      createMovingPlatform(1100, 300, 150, 30, 150, 'y', 3, '#DAA520'),
      createPlatform(1400, 250, 200, 40, '#DAA520'),
      createSpikes(1500, 230, 40),
      createPowerup(1700, 200, 'speed'),
      createMovingPlatform(1900, 400, 200, 30, 300, 'x', 5, '#DAA520'),
      createPlatform(2300, 350, 200, 40, '#DAA520'),
      createChaser(2400, 310, 4),
      createPlatform(2600, 500, 400, 100, '#DAA520'),
      createGoal(2800, 440)
    ]
  },
  {
    id: 3,
    name: "Valley of the Kings",
    theme: 'ruins',
    startX: 50,
    startY: 400,
    width: 3500,
    height: 600,
    gravity: 0.4,
    jumpForce: -12,
    objects: [
      createPlatform(0, 500, 300, 50, '#DAA520'),
      createMovingPlatform(400, 400, 150, 30, 300, 'x', 6, '#DAA520'),
      createEnemy(500, 370, 200, 5, '#00FFFF'),
      createPlatform(800, 300, 200, 30, '#DAA520'),
      createChaser(900, 260, 4),
      createMovingPlatform(1100, 250, 150, 30, 200, 'y', 4, '#DAA520'),
      createSpikes(1200, 230, 40),
      createPlatform(1400, 400, 200, 30, '#DAA520'),
      createPowerup(1500, 350, 'invincible'),
      createMovingPlatform(1700, 300, 150, 30, 400, 'x', 8, '#DAA520'),
      createPlatform(2200, 400, 200, 30, '#DAA520'),
      createChaser(2300, 360, 4.5),
      createEnemy(2300, 370, 100, 7, '#00FFFF'),
      createMovingPlatform(2600, 350, 150, 30, 250, 'y', 5, '#DAA520'),
      createPlatform(3000, 500, 500, 50, '#DAA520'),
      createGoal(3300, 440)
    ]
  },
  {
    id: 4,
    name: "Temple of Karnak",
    theme: 'volcano',
    startX: 50,
    startY: 400,
    width: 3500,
    height: 600,
    gravity: 1.0,
    jumpForce: -22,
    objects: [
      createPlatform(0, 500, 300, 100, '#2F4F4F'),
      createLava(300, 550, 2900, 50),
      createChaser(150, 460, 4.5),
      createMovingPlatform(400, 400, 150, 30, 200, 'x', 5, '#2F4F4F'),
      createSpikes(500, 380, 40),
      createPlatform(700, 350, 150, 30, '#2F4F4F'),
      createEnemy(750, 320, 100, 6, '#FF0000'),
      createMovingPlatform(1000, 300, 150, 30, 150, 'y', 4, '#2F4F4F'),
      createPlatform(1300, 350, 150, 30, '#2F4F4F'),
      createPowerup(1400, 300, 'jump'),
      createMovingPlatform(1600, 400, 150, 30, 300, 'x', 7, '#2F4F4F'),
      createSpikes(1700, 380, 40),
      createPlatform(2000, 350, 150, 30, '#2F4F4F'),
      createChaser(2075, 310, 5),
      createEnemy(2050, 320, 100, 8, '#FF0000'),
      createMovingPlatform(2300, 425, 100, 30, 100, 'y', 3, '#2F4F4F'),
      createPlatform(2600, 350, 150, 30, '#2F4F4F'),
      createPlatform(3000, 500, 500, 100, '#2F4F4F'),
      createGoal(3300, 440)
    ]
  },
  {
    id: 5,
    name: "Luxor Ruins",
    theme: 'ruins',
    startX: 50,
    startY: 400,
    width: 4000,
    height: 600,
    gravity: 0.9,
    jumpForce: -21,
    objects: [
      createPlatform(0, 500, 400, 100, '#DAA520'),
      createSpikes(100, 480, 200),
      createMovingPlatform(500, 400, 100, 30, 300, 'x', 8, '#DAA520'),
      createMovingPlatform(900, 300, 100, 30, 200, 'y', 6, '#DAA520'),
      createPlatform(1200, 400, 200, 40, '#DAA520'),
      createChaser(1300, 360, 5),
      createEnemy(1000, 270, 100, 10, '#8B0000'),
      createSpikes(1250, 380, 100),
      createMovingPlatform(1500, 300, 150, 30, 400, 'x', 10, '#DAA520'),
      createPowerup(1800, 250, 'speed'),
      createMovingPlatform(2100, 400, 100, 30, 250, 'y', 8, '#DAA520'),
      createEnemy(2200, 370, 100, 12, '#8B0000'),
      createPlatform(2500, 300, 300, 40, '#DAA520'),
      createChaser(2650, 260, 5.5),
      createSpikes(2600, 280, 100),
      createMovingPlatform(3000, 400, 200, 30, 500, 'x', 12, '#DAA520'),
      createPlatform(3500, 500, 500, 100, '#DAA520'),
      createEnemy(3600, 470, 300, 15, '#8B0000'), // Mini boss
      createGoal(3800, 440)
    ]
  },
  {
    id: 6,
    name: "The Nile River",
    theme: 'underwater',
    startX: 50,
    startY: 400,
    width: 3500,
    height: 600,
    gravity: 0.8,
    jumpForce: -22,
    objects: [
      createPlatform(0, 500, 400, 100, '#ADD8E6'),
      createMovingPlatform(500, 400, 150, 30, 200, 'x', 4, '#ADD8E6'),
      createSpikes(700, 380, 40),
      createPlatform(900, 350, 200, 40, '#ADD8E6'),
      createChaser(1000, 310, 4),
      createEnemy(1000, 320, 100, 5, '#00008B'),
      createMovingPlatform(1200, 300, 150, 30, 150, 'y', 3, '#ADD8E6'),
      createPlatform(1500, 250, 200, 40, '#ADD8E6'),
      createPowerup(1600, 200, 'invincible'),
      createMovingPlatform(1800, 400, 200, 30, 300, 'x', 6, '#ADD8E6'),
      createPlatform(2200, 350, 200, 40, '#ADD8E6'),
      createChaser(2300, 310, 4.5),
      createEnemy(2300, 320, 100, 7, '#00008B'),
      createPlatform(2600, 500, 600, 100, '#ADD8E6'),
      createGoal(3000, 440)
    ]
  },
  {
    id: 7,
    name: "Abyssal Tomb",
    theme: 'underwater',
    startX: 50,
    startY: 400,
    width: 4000,
    height: 600,
    gravity: 0.3,
    jumpForce: -10,
    objects: [
      createPlatform(0, 500, 500, 100, '#008B8B'),
      createFish(600, 550),
      createMovingPlatform(800, 400, 150, 30, 300, 'x', 3, '#008B8B'),
      createPlatform(1100, 350, 200, 40, '#008B8B'),
      createChaser(1200, 310, 3.5),
      createFish(1300, 550),
      createMovingPlatform(1500, 300, 150, 30, 200, 'y', 2, '#008B8B'),
      createPlatform(1800, 250, 200, 40, '#008B8B'),
      createPowerup(1900, 200, 'speed'),
      createFish(2100, 550),
      createMovingPlatform(2400, 400, 200, 30, 400, 'x', 5, '#008B8B'),
      createPlatform(2800, 350, 200, 40, '#008B8B'),
      createChaser(2900, 310, 4),
      createFish(3000, 550),
      createPlatform(3400, 500, 600, 100, '#008B8B'),
      createGoal(3800, 440)
    ]
  },
  {
    id: 8,
    name: "Alexandria Library",
    theme: 'ruins',
    startX: 50,
    startY: 400,
    width: 4000,
    height: 600,
    gravity: 0.9,
    jumpForce: -21,
    objects: [
      createPlatform(0, 500, 400, 100, '#808000'),
      createSpikes(100, 480, 200),
      createMovingPlatform(500, 400, 120, 30, 250, 'x', 6, '#808000'),
      createPlatform(800, 300, 200, 40, '#808000'),
      createChaser(900, 260, 6),
      createEnemy(900, 270, 100, 8, '#556B2F'),
      createMovingPlatform(1100, 350, 150, 30, 200, 'y', 5, '#808000'),
      createPlatform(1400, 400, 200, 40, '#808000'),
      createSpikes(1500, 380, 100),
      createPowerup(1700, 300, 'jump'),
      createMovingPlatform(2000, 300, 150, 30, 400, 'x', 9, '#808000'),
      createPlatform(2400, 400, 300, 40, '#808000'),
      createChaser(2550, 360, 6.5),
      createEnemy(2500, 370, 100, 10, '#556B2F'),
      createMovingPlatform(2800, 350, 150, 30, 300, 'y', 7, '#808000'),
      createPlatform(3200, 500, 800, 100, '#808000'),
      createGoal(3800, 440)
    ]
  },
  {
    id: 9,
    name: "Sky Temple of Ra",
    theme: 'sky',
    startX: 50,
    startY: 400,
    width: 4500,
    height: 600,
    gravity: 0.7,
    jumpForce: -24,
    objects: [
      createPlatform(0, 500, 300, 50, '#F0F8FF'),
      createMovingPlatform(400, 400, 150, 30, 400, 'x', 10, '#F0F8FF'),
      createMovingPlatform(900, 300, 150, 30, 300, 'y', 8, '#F0F8FF'),
      createPlatform(1200, 400, 200, 30, '#F0F8FF'),
      createChaser(1300, 360, 7),
      createEnemy(1300, 370, 100, 12, '#4682B4'),
      createMovingPlatform(1600, 300, 150, 30, 500, 'x', 15, '#F0F8FF'),
      createPowerup(2000, 250, 'invincible'),
      createMovingPlatform(2300, 400, 150, 30, 400, 'y', 10, '#F0F8FF'),
      createPlatform(2700, 350, 200, 30, '#F0F8FF'),
      createChaser(2800, 310, 7.5),
      createEnemy(2800, 320, 100, 14, '#4682B4'),
      createMovingPlatform(3200, 400, 200, 30, 600, 'x', 18, '#F0F8FF'),
      createPlatform(3800, 500, 700, 50, '#F0F8FF'),
      createGoal(4300, 440)
    ]
  },
  {
    id: 10,
    name: "The Pharaoh's Palace",
    theme: 'palace',
    startX: 50,
    startY: 400,
    width: 5000,
    height: 600,
    gravity: 1.0,
    jumpForce: -23,
    objects: [
      createPlatform(0, 500, 400, 100, '#FFD700'),
      createSpikes(100, 480, 300),
      createMovingPlatform(600, 400, 100, 30, 400, 'x', 12, '#FFD700'),
      createMovingPlatform(1000, 300, 100, 30, 300, 'y', 10, '#FFD700'),
      createEnemy(1100, 270, 100, 15, '#8B0000'),
      createPlatform(1300, 400, 200, 40, '#FFD700'),
      createChaser(1400, 360, 8),
      createSpikes(1350, 380, 150),
      createMovingPlatform(1600, 300, 150, 30, 500, 'x', 15, '#FFD700'),
      createPowerup(2000, 250, 'speed'),
      createMovingPlatform(2300, 400, 100, 30, 400, 'y', 12, '#FFD700'),
      createEnemy(2400, 370, 100, 18, '#8B0000'),
      createPlatform(2700, 300, 300, 40, '#FFD700'),
      createSpikes(2800, 280, 200),
      createMovingPlatform(3200, 400, 200, 30, 600, 'x', 20, '#FFD700'),
      createPowerup(3600, 350, 'jump'),
      createMovingPlatform(3900, 300, 150, 30, 400, 'y', 15, '#FFD700'),
      createEnemy(4000, 270, 100, 20, '#8B0000'),
      createPlatform(4400, 500, 600, 100, '#FFD700'),
      createChaser(4700, 460, 9),
      createEnemy(4500, 470, 400, 25, '#8B0000'), // Final Boss
      createGoal(4800, 440)
    ]
  }
];
