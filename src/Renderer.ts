import { Theme, GameObject, Player, Level, Particle } from './types';

export class Renderer {
  private ctx: CanvasRenderingContext2D;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  drawBackground(theme: Theme, width: number, height: number, cameraX: number) {
    const ctx = this.ctx;
    
    switch (theme) {
      case 'classic':
        // Sky Gradient
        const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
        skyGrad.addColorStop(0, '#5cb3ff');
        skyGrad.addColorStop(1, '#b0e2ff');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, width, height);
        
        // Clouds (Parallax)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        for (let i = 0; i < 10; i++) {
          const x = (i * 400 - cameraX * 0.2) % (width + 400);
          const y = 50 + (i % 3) * 60;
          this.drawCloud(x < 0 ? x + width + 400 : x, y, 60 + (i % 2) * 20);
        }

        // Distant Hills (Parallax)
        ctx.fillStyle = '#7cfc00';
        ctx.globalAlpha = 0.2;
        for (let i = 0; i < 8; i++) {
          const x = (i * 400 - cameraX * 0.3) % (width + 400);
          this.drawHill(x < 0 ? x + width + 400 : x, height, 500, 250);
        }
        
        // Mid Hills
        ctx.fillStyle = '#228B22';
        ctx.globalAlpha = 0.4;
        for (let i = 0; i < 6; i++) {
          const x = (i * 500 - cameraX * 0.5) % (width + 500);
          this.drawHill(x < 0 ? x + width + 500 : x, height, 400, 200);
        }
        ctx.globalAlpha = 1.0;

        // Near Hills
        ctx.fillStyle = '#006400';
        for (let i = 0; i < 5; i++) {
          const x = (i * 600 - cameraX * 0.7) % (width + 600);
          this.drawHill(x < 0 ? x + width + 600 : x, height, 300, 150);
        }
        break;
      case 'pyramids':
        // Desert Sky
        const desertGrad = ctx.createLinearGradient(0, 0, 0, height);
        desertGrad.addColorStop(0, '#FF4500');
        desertGrad.addColorStop(0.5, '#FF8C00');
        desertGrad.addColorStop(1, '#FFD700');
        ctx.fillStyle = desertGrad;
        ctx.fillRect(0, 0, width, height);

        // Sun
        ctx.fillStyle = '#FFFACD';
        ctx.shadowBlur = 50;
        ctx.shadowColor = '#FFD700';
        ctx.beginPath();
        ctx.arc(width - 100, 100, 60, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Distant Pyramids
        ctx.fillStyle = '#5D2E0A';
        for (let i = 0; i < 4; i++) {
          const x = (i * 800 - cameraX * 0.2) % (width + 800);
          this.drawPyramid(x < 0 ? x + width + 800 : x, height, 700, 500);
        }

        // Mid Pyramids
        ctx.fillStyle = '#8B4513';
        for (let i = 0; i < 3; i++) {
          const x = (i * 1000 - cameraX * 0.4) % (width + 1000);
          this.drawPyramid(x < 0 ? x + width + 1000 : x, height, 500, 350);
        }

        // Near Pyramids
        ctx.fillStyle = '#CD853F';
        for (let i = 0; i < 3; i++) {
          const x = (i * 600 - cameraX * 0.6) % (width + 600);
          this.drawPyramid(x < 0 ? x + width + 600 : x, height, 300, 200);
        }

        // Palm Trees
        for (let i = 0; i < 5; i++) {
          const x = (i * 400 - cameraX * 0.8) % (width + 400);
          this.drawPalmTree(x < 0 ? x + width + 400 : x, height - 20);
        }
        break;
      case 'space':
        // Deep Space
        ctx.fillStyle = '#00001a';
        ctx.fillRect(0, 0, width, height);
        
        // Nebula
        const nebula = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, width);
        nebula.addColorStop(0, 'rgba(75, 0, 130, 0.3)');
        nebula.addColorStop(0.5, 'rgba(138, 43, 226, 0.1)');
        nebula.addColorStop(1, 'transparent');
        ctx.fillStyle = nebula;
        ctx.fillRect(0, 0, width, height);

        // Stars (Parallax)
        for (let layer = 1; layer <= 3; layer++) {
          ctx.fillStyle = `rgba(255, 255, 255, ${0.3 * layer})`;
          for (let i = 0; i < 50; i++) {
            const x = (Math.sin(i * 123.45 + layer * 100) * 10000 - cameraX * 0.1 * layer) % width;
            const y = (Math.cos(i * 678.90 + layer * 200) * 10000) % height;
            const size = (Math.sin(Date.now() / 500 + i + layer) + 1) * 0.5 + 0.5;
            ctx.beginPath();
            ctx.arc(x < 0 ? x + width : x, y < 0 ? y + height : y, size * layer, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        break;
      case 'volcano':
        // Dark Sky
        const skyGradVolcano = ctx.createLinearGradient(0, 0, 0, height);
        skyGradVolcano.addColorStop(0, '#0a0000');
        skyGradVolcano.addColorStop(1, '#330000');
        ctx.fillStyle = skyGradVolcano;
        ctx.fillRect(0, 0, width, height);
        
        // Distant Volcanoes
        ctx.fillStyle = '#1a0a0a';
        for (let i = 0; i < 4; i++) {
          const x = (i * 700 - cameraX * 0.3) % (width + 700);
          this.drawPyramid(x < 0 ? x + width + 700 : x, height, 500, 350);
        }

        // Mid Volcanoes
        ctx.fillStyle = '#2a1a1a';
        for (let i = 0; i < 3; i++) {
          const x = (i * 900 - cameraX * 0.5) % (width + 900);
          this.drawPyramid(x < 0 ? x + width + 900 : x, height, 400, 250);
        }

        // Lava Glow
        const lavaGrad = ctx.createLinearGradient(0, height, 0, height - 300);
        lavaGrad.addColorStop(0, 'rgba(255, 0, 0, 0.5)');
        lavaGrad.addColorStop(0.5, 'rgba(255, 69, 0, 0.2)');
        lavaGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = lavaGrad;
        ctx.fillRect(0, height - 300, width, 300);
        
        // Ash particles (simple)
        ctx.fillStyle = 'rgba(100, 100, 100, 0.5)';
        for (let i = 0; i < 30; i++) {
          const x = (Math.sin(i * 123) * 10000 - cameraX * 0.8) % width;
          const y = (Math.cos(i * 456) * 10000 + Date.now() / 20) % height;
          ctx.fillRect(x < 0 ? x + width : x, y, 2, 2);
        }
        break;
      case 'ice':
        // Icy Sky
        const iceGrad = ctx.createLinearGradient(0, 0, 0, height);
        iceGrad.addColorStop(0, '#E0FFFF');
        iceGrad.addColorStop(1, '#B0E0E6');
        ctx.fillStyle = iceGrad;
        ctx.fillRect(0, 0, width, height);
        
        // Snowflakes (Parallax)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        for (let i = 0; i < 50; i++) {
          const x = (Math.sin(i * 123) * 10000 - cameraX * 0.5) % width;
          const y = (Math.cos(i * 456) * 10000 + Date.now() / 10) % height;
          ctx.beginPath();
          ctx.arc(x < 0 ? x + width : x, y, 2, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      case 'underwater':
        // Deep Blue Gradient
        const waterGrad = ctx.createLinearGradient(0, 0, 0, height);
        waterGrad.addColorStop(0, '#00BFFF');
        waterGrad.addColorStop(1, '#00008B');
        ctx.fillStyle = waterGrad;
        ctx.fillRect(0, 0, width, height);
        
        // Bubbles
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        for (let i = 0; i < 20; i++) {
          const x = (Math.sin(i * 789) * 10000 - cameraX * 0.2) % width;
          const y = (Math.cos(i * 321) * 10000 - Date.now() / 15) % height;
          ctx.beginPath();
          ctx.arc(x < 0 ? x + width : x, y < 0 ? y + height : y, 5 + (i % 5), 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      case 'ruins':
        // Overgrown Sky
        const ruinsGrad = ctx.createLinearGradient(0, 0, 0, height);
        ruinsGrad.addColorStop(0, '#556B2F');
        ruinsGrad.addColorStop(1, '#2F4F4F');
        ctx.fillStyle = ruinsGrad;
        ctx.fillRect(0, 0, width, height);
        
        // Distant Pillars
        ctx.fillStyle = '#696969';
        for (let i = 0; i < 6; i++) {
          const x = (i * 600 - cameraX * 0.3) % (width + 600);
          ctx.fillRect(x < 0 ? x + width + 600 : x, height - 400, 60, 400);
        }
        break;
      case 'sky':
        // Bright Sky
        const skyGradHigh = ctx.createLinearGradient(0, 0, 0, height);
        skyGradHigh.addColorStop(0, '#87CEEB');
        skyGradHigh.addColorStop(1, '#E0F6FF');
        ctx.fillStyle = skyGradHigh;
        ctx.fillRect(0, 0, width, height);
        
        // Floating Islands
        ctx.fillStyle = '#8B4513';
        for (let i = 0; i < 5; i++) {
          const x = (i * 800 - cameraX * 0.4) % (width + 800);
          const y = 200 + (i % 3) * 100;
          this.drawHill(x < 0 ? x + width + 800 : x, y, 200, 50);
        }
        break;
      case 'palace':
        // Golden Sky
        const palaceGrad = ctx.createLinearGradient(0, 0, 0, height);
        palaceGrad.addColorStop(0, '#FFD700');
        palaceGrad.addColorStop(1, '#B8860B');
        ctx.fillStyle = palaceGrad;
        ctx.fillRect(0, 0, width, height);
        
        // Royal Pillars
        ctx.fillStyle = '#DAA520';
        for (let i = 0; i < 8; i++) {
          const x = (i * 400 - cameraX * 0.5) % (width + 400);
          ctx.fillRect(x < 0 ? x + width + 400 : x, 0, 40, height);
        }
        break;
    }
  }

  private drawCloud(x: number, y: number, size: number = 40) {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
    ctx.arc(x + size * 0.4, y - size * 0.2, size * 0.4, 0, Math.PI * 2);
    ctx.arc(x + size * 0.8, y, size * 0.5, 0, Math.PI * 2);
    ctx.arc(x + size * 0.4, y + size * 0.2, size * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawHill(x: number, y: number, w: number, h: number) {
    this.ctx.beginPath();
    this.ctx.moveTo(x, y);
    this.ctx.quadraticCurveTo(x + w / 2, y - h, x + w, y);
    this.ctx.fill();
  }

  private drawPyramid(x: number, y: number, w: number, h: number) {
    this.ctx.beginPath();
    this.ctx.moveTo(x, y);
    this.ctx.lineTo(x + w / 2, y - h);
    this.ctx.lineTo(x + w, y);
    this.ctx.closePath();
    this.ctx.fill();
  }

  private drawPalmTree(x: number, y: number) {
    const ctx = this.ctx;
    // Trunk
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(x - 5, y - 60, 10, 60);
    
    // Leaves
    ctx.fillStyle = '#228B22';
    for (let i = 0; i < 6; i++) {
      ctx.save();
      ctx.translate(x, y - 60);
      ctx.rotate((i * 60) * Math.PI / 180);
      ctx.beginPath();
      ctx.ellipse(20, 0, 25, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  drawPlayer(player: Player, cameraX: number, frame: number) {
    const ctx = this.ctx;
    
    // Squash and Stretch
    let dw = player.width;
    let dh = player.height;
    let dx = player.x - cameraX;
    let dy = player.y;

    if (Math.abs(player.vy) > 2) {
      dw *= 0.85;
      dh *= 1.15;
      dx += player.width * 0.075;
      dy -= player.height * 0.075;
    }

    const isMoving = Math.abs(player.vx) > 0.5;
    const direction = player.vx >= 0 ? 1 : -1;
    
    ctx.save();
    ctx.translate(dx + dw / 2, dy + dh / 2);
    
    // Rotation when jumping
    if (!player.isGrounded) {
      ctx.rotate(player.vy * 0.05 * direction);
    } else if (isMoving) {
      // Slight tilt when running
      ctx.rotate(Math.sin(frame * 0.2) * 0.1);
    }

    // Draw Shield if active
    if (player.hasShield) {
      ctx.beginPath();
      ctx.arc(0, 0, Math.max(dw, dh) * 0.8, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(0, 255, 255, 0.6)';
      ctx.lineWidth = 3;
      ctx.setLineDash([5, 5]);
      ctx.lineDashOffset = frame;
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(0, 255, 255, 0.1)';
      ctx.fill();
      
      // Outer glow
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#00FFFF';
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Draw Character (centered)
    const cx = -dw / 2;
    const cy = -dh / 2;

    // Skin (Tan/Golden)
    ctx.fillStyle = '#D2B48C';
    ctx.fillRect(cx + dw * 0.2, cy + dh * 0.2, dw * 0.6, dh * 0.7);

    // Kilt (White Shenti)
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(cx + dw * 0.2, cy + dh * 0.5, dw * 0.6, dh * 0.3);
    
    // Gold Belt
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(cx + dw * 0.2, cy + dh * 0.5, dw * 0.6, dh * 0.08);

    // Nemes Headcloth (Blue and Gold Stripes)
    const nemesHeight = dh * 0.4;
    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = i % 2 === 0 ? player.characterColor : '#FFD700';
      ctx.fillRect(cx + dw * 0.1, cy + (i * nemesHeight / 6), dw * 0.8, nemesHeight / 6);
    }
    // Nemes "Wings"
    ctx.fillStyle = player.characterColor;
    ctx.fillRect(cx, cy + dh * 0.1, dw * 0.2, dh * 0.3);
    ctx.fillRect(cx + dw * 0.8, cy + dh * 0.1, dw * 0.2, dh * 0.3);

    // Gold Collar (Usekh)
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(cx + dw * 0.5, cy + dh * 0.45, dw * 0.25, 0, Math.PI);
    ctx.fill();

    // Kohl-lined Eyes
    ctx.fillStyle = '#000000'; // Kohl outline
    const eyeX = direction > 0 ? 0.55 : 0.15;
    ctx.fillRect(cx + dw * eyeX, cy + dh * 0.2, dw * 0.3, dh * 0.15);
    ctx.fillStyle = '#FFFFFF'; // Eye white
    ctx.fillRect(cx + dw * (eyeX + 0.05), cy + dh * 0.22, dw * 0.2, dh * 0.1);
    ctx.fillStyle = '#000000'; // Pupil
    ctx.fillRect(cx + dw * (eyeX + 0.12), cy + dh * 0.24, dw * 0.08, dh * 0.08);

    // Gold Bracelets
    ctx.fillStyle = '#FFD700';
    const armWobble = isMoving ? Math.sin(frame * 0.2) * 10 : 0;
    // Back arm
    ctx.fillRect(cx - dw * 0.1, cy + dh * 0.4 + armWobble * 0.2, dw * 0.15, dh * 0.1);
    // Front arm
    ctx.fillRect(cx + dw * 0.95, cy + dh * 0.4 - armWobble * 0.2, dw * 0.15, dh * 0.1);

    // Sandals
    ctx.fillStyle = '#4B2500';
    const legWobble = isMoving ? Math.sin(frame * 0.2) * 5 : 0;
    ctx.fillRect(cx + dw * 0.1, cy + dh * 0.9 + legWobble, dw * 0.3, dh * 0.05);
    ctx.fillRect(cx + dw * 0.6, cy + dh * 0.9 - legWobble, dw * 0.3, dh * 0.05);

    // Glow
    ctx.shadowBlur = 15;
    ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.strokeRect(cx, cy, dw, dh);
    
    // Draw character name above player
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(player.characterName, 0, cy - 10);

    ctx.restore();
  }

  drawObject(obj: GameObject, cameraX: number) {
    const ctx = this.ctx;
    ctx.fillStyle = obj.color;
    
    switch (obj.type) {
      case 'platform':
      case 'movingPlatform':
        if (obj.color === '#DAA520' || obj.color === '#B8860B') {
          // Egyptian Sandstone Bricks
          ctx.fillStyle = obj.color;
          ctx.fillRect(obj.x - cameraX, obj.y, obj.width, obj.height);
          
          ctx.strokeStyle = 'rgba(0,0,0,0.2)';
          ctx.lineWidth = 1;
          for (let i = 0; i < obj.width; i += 40) {
            for (let j = 0; j < obj.height; j += 20) {
              const offset = (j / 20) % 2 === 0 ? 0 : 20;
              ctx.strokeRect(obj.x - cameraX + i + offset, obj.y + j, 40, 20);
            }
          }
          
          // Hieroglyph-like marks
          ctx.fillStyle = 'rgba(0,0,0,0.1)';
          for (let i = 0; i < obj.width; i += 80) {
            for (let j = 0; j < obj.height; j += 40) {
              ctx.fillRect(obj.x - cameraX + i + 10, obj.y + j + 10, 5, 5);
              ctx.fillRect(obj.x - cameraX + i + 20, obj.y + j + 15, 10, 2);
            }
          }
          break;
        }

        // Rocky side
        ctx.fillStyle = obj.color;
        ctx.fillRect(obj.x - cameraX, obj.y, obj.width, obj.height);
        
        // Texture detail on rock
        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        for (let i = 0; i < obj.width; i += 20) {
          for (let j = 0; j < obj.height; j += 20) {
            if ((i + j) % 40 === 0) {
              ctx.fillRect(obj.x - cameraX + i + 5, obj.y + j + 5, 10, 10);
            }
          }
        }

        // Grass top
        ctx.fillStyle = '#32CD32';
        ctx.fillRect(obj.x - cameraX, obj.y, obj.width, 10);
        break;
      case 'spikes':
        ctx.fillStyle = obj.color;
        for (let i = 0; i < obj.width; i += 20) {
          ctx.beginPath();
          ctx.moveTo(obj.x - cameraX + i, obj.y + obj.height);
          ctx.lineTo(obj.x - cameraX + i + 10, obj.y);
          ctx.lineTo(obj.x - cameraX + i + 20, obj.y + obj.height);
          ctx.fill();
        }
        break;
      case 'powerup':
        const pulse = Math.sin(Date.now() / 200) * 5;
        ctx.fillStyle = obj.color;
        ctx.beginPath();
        ctx.arc(obj.x - cameraX + obj.width / 2, obj.y + obj.height / 2, obj.width / 2 + pulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Icon inside powerup
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        const icon = obj.powerupType === 'speed' ? 'S' : (obj.powerupType === 'jump' ? 'J' : 'I');
        ctx.fillText(icon, obj.x - cameraX + obj.width / 2, obj.y + obj.height / 2 + 7);
        break;
      case 'fish':
        this.drawCheepCheep(obj.x - cameraX, obj.y, obj.width, obj.height);
        break;
      case 'questionBlock':
        this.drawQuestionBlock(obj.x - cameraX, obj.y, obj.width, obj.height, obj.hit || false);
        break;
      case 'enemy':
        // Mummy appearance
        const wobble = Math.sin(Date.now() / 100) * 5;
        const ex = obj.x - cameraX;
        const ey = obj.y + wobble;
        
        // Body (Bandages)
        ctx.fillStyle = '#F5F5DC'; // Beige/Off-white
        ctx.fillRect(ex, ey, obj.width, obj.height);
        
        // Bandage lines
        ctx.strokeStyle = '#D2B48C';
        ctx.lineWidth = 1;
        for (let i = 0; i < obj.height; i += 5) {
          ctx.beginPath();
          ctx.moveTo(ex, ey + i);
          ctx.lineTo(ex + obj.width, ey + i + (i % 10 === 0 ? 2 : -2));
          ctx.stroke();
        }
        
        // Glowing red eyes
        ctx.fillStyle = '#FF0000';
        ctx.shadowBlur = 5;
        ctx.shadowColor = '#FF0000';
        ctx.fillRect(ex + 5, ey + 8, 4, 4);
        ctx.fillRect(ex + 21, ey + 8, 4, 4);
        ctx.shadowBlur = 0;
        break;
      case 'chaser':
        ctx.save();
        // Egyptian Guard / Police appearance
        const cx = obj.x - cameraX;
        const cy = obj.y;
        const walk = Math.sin(Date.now() / 150) * 5;
        const direction = obj.direction || 1;
        
        ctx.translate(cx + obj.width / 2, cy + obj.height / 2);
        if (direction === -1) ctx.scale(-1, 1);
        const drawX = -obj.width / 2;
        const drawY = -obj.height / 2;

        // Body (Linen tunic)
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(drawX + 5, drawY + 10, obj.width - 10, obj.height - 10);
        
        // Skin (Bronze)
        ctx.fillStyle = '#CD853F';
        ctx.fillRect(drawX + 10, drawY, obj.width - 20, 15); // Head
        
        // Nemes Headdress (Blue and Gold)
        ctx.fillStyle = '#000080'; // Blue
        ctx.fillRect(drawX + 5, drawY, 5, 20);
        ctx.fillRect(drawX + obj.width - 10, drawY, 5, 20);
        ctx.fillStyle = '#FFD700'; // Gold stripes
        ctx.fillRect(drawX + 5, drawY + 5, 5, 2);
        ctx.fillRect(drawX + obj.width - 10, drawY + 5, 5, 2);
        
        // Spear
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(drawX + obj.width, drawY + 5 + walk);
        ctx.lineTo(drawX + obj.width, drawY + obj.height + walk);
        ctx.stroke();
        ctx.fillStyle = '#C0C0C0'; // Silver tip
        ctx.beginPath();
        ctx.moveTo(drawX + obj.width - 5, drawY + 5 + walk);
        ctx.lineTo(drawX + obj.width, drawY - 5 + walk);
        ctx.lineTo(drawX + obj.width + 5, drawY + 5 + walk);
        ctx.fill();
        
        // Eyes
        ctx.fillStyle = '#000000';
        ctx.fillRect(drawX + 12, drawY + 5, 3, 3);
        ctx.fillRect(drawX + obj.width - 15, drawY + 5, 3, 3);
        ctx.restore();
        break;
      case 'coin':
        const coinSize = (Math.sin(Date.now() / 200) * 0.2 + 1) * (obj.width / 2);
        ctx.beginPath();
        ctx.arc(obj.x - cameraX + obj.width / 2, obj.y + obj.height / 2, coinSize, 0, Math.PI * 2);
        ctx.fillStyle = '#FFD700';
        ctx.fill();
        ctx.strokeStyle = '#B8860B';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.lineWidth = 1;
        break;
      case 'goal':
        // Flag pole (Golden)
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(obj.x - cameraX + obj.width / 2 - 5, obj.y, 10, obj.height);
        
        // Flag with wave (Egyptian style)
        const wave = Math.sin(Date.now() / 300) * 10;
        ctx.fillStyle = '#FF0000'; // Red top
        ctx.fillRect(obj.x - cameraX + obj.width / 2, obj.y, obj.width / 2 + wave, 15);
        ctx.fillStyle = '#FFFFFF'; // White middle
        ctx.fillRect(obj.x - cameraX + obj.width / 2, obj.y + 15, obj.width / 2 + wave, 15);
        ctx.fillStyle = '#000000'; // Black bottom
        ctx.fillRect(obj.x - cameraX + obj.width / 2, obj.y + 30, obj.width / 2 + wave, 15);
        
        // Golden Ankh in the middle
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(obj.x - cameraX + obj.width / 2 + 15, obj.y + 22, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(obj.x - cameraX + obj.width / 2 + 14, obj.y + 27, 2, 5);
        ctx.fillRect(obj.x - cameraX + obj.width / 2 + 10, obj.y + 24, 10, 2);
        break;
      case 'lava':
        const lavaGrad = ctx.createLinearGradient(0, obj.y, 0, obj.y + obj.height);
        lavaGrad.addColorStop(0, '#FF4500');
        lavaGrad.addColorStop(1, '#8B0000');
        ctx.fillStyle = lavaGrad;
        ctx.fillRect(obj.x - cameraX, obj.y, obj.width, obj.height);
        
        // Bubbles
        ctx.fillStyle = '#FF6347';
        for (let i = 0; i < 8; i++) {
          const bx = (obj.x + Math.sin(Date.now() / 500 + i) * 50 + i * 150) % obj.width;
          const by = obj.y + 10 + Math.sin(Date.now() / 400 + i) * 10;
          ctx.beginPath();
          ctx.arc(obj.x - cameraX + bx, by, 5, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
    }
  }

  private drawCheepCheep(x: number, y: number, w: number, h: number) {
    const ctx = this.ctx;
    // Body
    ctx.fillStyle = '#FF0000';
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // White belly
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h * 0.7, w / 2.5, h / 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Eye
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(x + w * 0.7, y + h * 0.3, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(x + w * 0.75, y + h * 0.3, 3, 0, Math.PI * 2);
    ctx.fill();

    // Fins
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.moveTo(x + w * 0.2, y + h * 0.2);
    ctx.lineTo(x + w * 0.1, y - h * 0.1);
    ctx.lineTo(x + w * 0.4, y + h * 0.2);
    ctx.fill();
  }

  private drawQuestionBlock(x: number, y: number, w: number, h: number, hit: boolean) {
    const ctx = this.ctx;
    ctx.fillStyle = hit ? '#8B4513' : '#FFD700';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#B8860B';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);

    if (!hit) {
      // Eye of Horus or Ankh markings
      ctx.fillStyle = '#B8860B';
      ctx.beginPath();
      ctx.arc(x + w / 2, y + h / 2 - 5, 8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillRect(x + w / 2 - 1, y + h / 2 + 3, 2, 8);
      ctx.fillRect(x + w / 2 - 5, y + h / 2 + 1, 10, 2);
    }
    
    // Corners
    ctx.fillStyle = '#B8860B';
    ctx.fillRect(x + 2, y + 2, 4, 4);
    ctx.fillRect(x + w - 6, y + 2, 4, 4);
    ctx.fillRect(x + 2, y + h - 6, 4, 4);
    ctx.fillRect(x + w - 6, y + h - 6, 4, 4);
  }

  drawParticles(particles: Particle[], cameraX: number) {
    const ctx = this.ctx;
    particles.forEach(p => {
      ctx.globalAlpha = p.life / p.maxLife;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x - cameraX, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  }

  private shadeColor(color: string, percent: number) {
    let R = parseInt(color.substring(1, 3), 16);
    let G = parseInt(color.substring(3, 5), 16);
    let B = parseInt(color.substring(5, 7), 16);

    R = Math.floor(R * (100 + percent) / 100);
    G = Math.floor(G * (100 + percent) / 100);
    B = Math.floor(B * (100 + percent) / 100);

    R = (R < 255) ? R : 255;
    G = (G < 255) ? G : 255;
    B = (B < 255) ? B : 255;

    const RR = ((R.toString(16).length === 1) ? "0" + R.toString(16) : R.toString(16));
    const GG = ((G.toString(16).length === 1) ? "0" + G.toString(16) : G.toString(16));
    const BB = ((B.toString(16).length === 1) ? "0" + B.toString(16) : B.toString(16));

    return "#" + RR + GG + BB;
  }
}
