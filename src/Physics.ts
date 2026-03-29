import { GameObject, Player, Level } from './types';

export class Physics {
  static checkCollision(rect1: { x: number, y: number, width: number, height: number }, rect2: { x: number, y: number, width: number, height: number }) {
    return (
      rect1.x < rect2.x + rect2.width &&
      rect1.x + rect1.width > rect2.x &&
      rect1.y < rect2.y + rect2.height &&
      rect1.y + rect1.height > rect2.y
    );
  }

  static resolvePlatformCollision(player: Player, platform: GameObject) {
    const prevY = player.y - player.vy;
    
    // Check if falling onto platform
    if (prevY + player.height <= platform.y) {
      player.y = platform.y - player.height;
      player.vy = 0;
      player.isGrounded = true;
      return true;
    }
    
    // Check if hitting from side or bottom
    if (prevY >= platform.y + platform.height) {
      player.y = platform.y + platform.height;
      player.vy = 0;
    } else if (player.x < platform.x) {
      player.x = platform.x - player.width;
      player.vx = 0;
    } else {
      player.x = platform.x + platform.width;
      player.vx = 0;
    }
    
    return false;
  }
}
