/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { Trophy, Heart, Coins, Play, RefreshCw, ChevronRight, Volume2, VolumeX, ArrowLeft, ArrowRight, ArrowUp, LogIn } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Player, Level, GameState, GameObject, Particle } from './types';
import { LEVELS } from './levels';
import { Renderer } from './Renderer';
import { Physics } from './Physics';
import { db, auth } from './firebase';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  limit, 
  getDocs, 
  serverTimestamp,
  getDocsFromServer
} from 'firebase/firestore';
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

// Simple Sound Manager using Web Audio API
class SoundManager {
  private ctx: AudioContext | null = null;

  init() {
    if (!this.ctx) this.ctx = new AudioContext();
  }

  playJump() {
    this.playTone(400, 600, 0.1, 'square');
  }

  playCoin() {
    this.playTone(800, 1200, 0.1, 'sine');
  }

  playStomp() {
    this.playTone(200, 100, 0.2, 'sawtooth');
  }

  playDeath() {
    this.playTone(300, 50, 0.5, 'sawtooth');
  }

  playWin() {
    this.playTone(400, 800, 0.1, 'sine');
    setTimeout(() => this.playTone(500, 1000, 0.1, 'sine'), 100);
    setTimeout(() => this.playTone(600, 1200, 0.3, 'sine'), 200);
  }

  private playTone(startFreq: number, endFreq: number, duration: number, type: OscillatorType) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(startFreq, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(endFreq, this.ctx.currentTime + duration);
    
    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }
}

const soundManager = new SoundManager();

const CHARACTERS = [
  { name: 'Sam', color: '#3B82F6' },
  { name: 'Will', color: '#10B981' },
  { name: 'Ben', color: '#F59E0B' },
  { name: 'Elisabeth', color: '#EC4899' },
];

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>('start');
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
  const [coins, setCoins] = useState(0);
  const [lives, setLives] = useState(5);
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(400);
  const [muted, setMuted] = useState(false);
  const [flash, setFlash] = useState(0);
  const flashRef = useRef(0);
  const [transitioning, setTransitioning] = useState(false);
  const [showLevelName, setShowLevelName] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [selectedCharacterIndex, setSelectedCharacterIndex] = useState(0);
  
  // Firebase & Scoring state
  const [user, setUser] = useState<User | null>(null);
  const [highScore, setHighScore] = useState(Number(localStorage.getItem('egyptianPrinceHighScore') || 0));
  const [leaderboard, setLeaderboard] = useState<{ playerName: string, score: number }[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  
  // Upgrades state
  const [upgrades, setUpgrades] = useState({
    speedLevel: 0,
    jumpLevel: 0,
    maxLives: 5,
    coinMagnet: false,
    shield: false
  });
  
  const currentLevel = LEVELS[currentLevelIndex];
  
  const playerRef = useRef<Player>({
    x: currentLevel.startX,
    y: currentLevel.startY,
    width: 40,
    height: 40,
    vx: 0,
    vy: 0,
    isGrounded: false,
    lives: 5,
    coins: 0,
    speedMultiplier: 1,
    jumpMultiplier: 1,
    maxLives: 5,
    coinMagnet: false,
    shield: false,
    hasShield: false,
    characterName: CHARACTERS[0].name,
    characterColor: CHARACTERS[0].color
  });

  const keysRef = useRef<{ [key: string]: boolean }>({});
  const cameraXRef = useRef(0);
  const maxDistanceRef = useRef(0);
  const requestRef = useRef<number>(null);
  const levelObjectsRef = useRef<GameObject[]>([...currentLevel.objects]);
  const particlesRef = useRef<Particle[]>([]);
  const shakeRef = useRef(0);
  const frameRef = useRef(0);

  const createParticles = (x: number, y: number, color: string, count: number = 10) => {
    for (let i = 0; i < count; i++) {
      particlesRef.current.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
        life: 1,
        maxLife: 1,
        color,
        size: Math.random() * 5 + 2
      });
    }
  };

  const resetPlayer = (level: Level) => {
    playerRef.current = {
      ...playerRef.current,
      x: level.startX,
      y: level.startY,
      vx: 0,
      vy: 0,
      isGrounded: false,
      speedMultiplier: 1 + upgrades.speedLevel * 0.1,
      jumpMultiplier: 1 + upgrades.jumpLevel * 0.1,
      maxLives: upgrades.maxLives,
      coinMagnet: upgrades.coinMagnet,
      shield: upgrades.shield,
      hasShield: upgrades.shield, // Reset shield each level if they have the upgrade
      characterName: CHARACTERS[selectedCharacterIndex].name,
      characterColor: CHARACTERS[selectedCharacterIndex].color
    };
    cameraXRef.current = 0;
    levelObjectsRef.current = JSON.parse(JSON.stringify(level.objects)); // Deep copy
    particlesRef.current = [];
    frameRef.current = 0;
    maxDistanceRef.current = level.startX;
    
    setShowLevelName(true);
    setTimeout(() => setShowLevelName(false), 3000);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    keysRef.current[e.code] = true;
    if (gameState === 'start' || gameState === 'gameover' || gameState === 'win' || gameState === 'levelwin') {
      soundManager.init();
    }
  };

  const handleKeyUp = (e: KeyboardEvent) => {
    keysRef.current[e.code] = false;
  };

  const handleTouchStart = (code: string) => {
    keysRef.current[code] = true;
    if (gameState === 'start' || gameState === 'gameover' || gameState === 'win' || gameState === 'levelwin') {
      soundManager.init();
    }
  };

  const handleTouchEnd = (code: string) => {
    keysRef.current[code] = false;
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user) {
        testConnection();
        fetchLeaderboard();
      }
    });
    
    setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      unsubscribe();
    };
  }, [gameState]);

  const testConnection = async () => {
    try {
      await getDocsFromServer(collection(db, 'test'));
    } catch (error) {
      if(error instanceof Error && error.message.includes('the client is offline')) {
        console.error("Please check your Firebase configuration. ");
      }
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const q = query(collection(db, 'scores'), orderBy('score', 'desc'), limit(10));
      const querySnapshot = await getDocs(q);
      const scores = querySnapshot.docs.map(doc => doc.data() as { playerName: string, score: number });
      setLeaderboard(scores);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'scores');
    }
  };

  const submitScore = async (finalScore: number) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'scores'), {
        playerName: user.displayName || 'Anonymous Prince',
        score: finalScore,
        timestamp: serverTimestamp(),
        userId: user.uid
      });
      fetchLeaderboard();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'scores');
    }
  };

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const updateFlash = (val: number) => {
    flashRef.current = val;
    setFlash(val);
  };

  const update = () => {
    // Flash effect decay (runs even when not playing to allow death flash to fade)
    if (flashRef.current > 0) {
      updateFlash(Math.max(0, flashRef.current - 0.05));
    }

    if (gameState !== 'playing') return;

    frameRef.current++;
    const player = playerRef.current;
    const level = LEVELS[currentLevelIndex];

    // Timer
    if (frameRef.current % 60 === 0 && time > 0) {
      setTime(prev => prev - 1);
    }
    if (time <= 0) {
      handleDeath();
      return;
    }

    // Horizontal movement
    const baseSpeed = 6 * player.speedMultiplier;
    const friction = level.theme === 'ice' ? 0.98 : 0.85;

    if (keysRef.current['ArrowLeft'] || keysRef.current['KeyA']) {
      player.vx = -baseSpeed;
    } else if (keysRef.current['ArrowRight'] || keysRef.current['KeyD']) {
      player.vx = baseSpeed;
    } else {
      player.vx *= friction; // Friction
    }

    // Jump
    const canJump = player.isGrounded || (level.theme === 'underwater');
    if ((keysRef.current['ArrowUp'] || keysRef.current['Space'] || keysRef.current['KeyW']) && canJump) {
      player.vy = level.jumpForce * player.jumpMultiplier;
      player.isGrounded = false;
      if (!muted) soundManager.playJump();
      createParticles(player.x + player.width / 2, player.y + player.height, '#FFFFFF', 5);
    }

    // Gravity
    player.vy += level.gravity;
    
    // Update position
    player.x += player.vx;
    player.y += player.vy;

    // Distance scoring
    if (player.x > maxDistanceRef.current) {
      const diff = player.x - maxDistanceRef.current;
      setScore(prev => prev + Math.floor(diff / 10));
      maxDistanceRef.current = player.x;
    }

    // Boundary checks
    if (player.x < 0) player.x = 0;
    if (player.x > level.width - player.width) player.x = level.width - player.width;

    // Fall off level
    if (player.y > level.height) {
      handleDeath();
      return;
    }

    // Collision detection
    const wasGrounded = player.isGrounded;
    player.isGrounded = false;
    const objects = levelObjectsRef.current;
    
    for (let i = objects.length - 1; i >= 0; i--) {
      const obj = objects[i];
      
      // Update moving platforms
      if (obj.type === 'movingPlatform' && obj.startX !== undefined && obj.startY !== undefined && obj.moveRange !== undefined && obj.moveAxis !== undefined && obj.vx !== undefined && obj.vy !== undefined) {
        if (obj.moveAxis === 'x') {
          obj.x += obj.vx;
          if (Math.abs(obj.x - obj.startX) > obj.moveRange) {
            obj.vx *= -1;
          }
        } else {
          obj.y += obj.vy;
          if (Math.abs(obj.y - obj.startY) > obj.moveRange) {
            obj.vy *= -1;
          }
        }
      }

      // Coin Magnet Logic
      if (player.coinMagnet && obj.type === 'coin') {
        const dx = (player.x + player.width / 2) - (obj.x + obj.width / 2);
        const dy = (player.y + player.height / 2) - (obj.y + obj.height / 2);
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 200) {
          obj.x += dx * 0.1;
          obj.y += dy * 0.1;
        }
      }

      if (Physics.checkCollision(player, obj)) {
        if (obj.type === 'platform' || obj.type === 'movingPlatform') {
          const landed = Physics.resolvePlatformCollision(player, obj);
          if (landed && !wasGrounded) {
            createParticles(player.x + player.width / 2, player.y + player.height, '#FFFFFF', 3);
          }
          
          // If on a moving platform, move with it
          if (landed && obj.type === 'movingPlatform' && obj.moveAxis === 'x' && obj.vx !== undefined) {
            player.x += obj.vx;
          }
        } else if (obj.type === 'questionBlock') {
          // Check if hitting from below
          if (player.vy < 0 && player.y >= obj.y + obj.height - 10 && !obj.hit) {
            obj.hit = true;
            player.vy = 0;
            setCoins(prev => prev + 1);
            setScore(prev => prev + 200);
            if (!muted) soundManager.playCoin();
            createParticles(obj.x + obj.width / 2, obj.y, '#FFD700', 10);
          } else {
            Physics.resolvePlatformCollision(player, obj);
          }
        } else if (obj.type === 'enemy' || obj.type === 'fish' || obj.type === 'chaser') {
          // Check if jumping on top
          if (player.vy > 0 && player.y + player.height - player.vy <= obj.y + 10) {
            player.vy = -12;
            createParticles(obj.x + obj.width / 2, obj.y + obj.height / 2, obj.color, 15);
            objects.splice(i, 1); // Kill enemy
            setScore(prev => prev + (obj.type === 'chaser' ? 1000 : 500));
            if (!muted) soundManager.playStomp();
            shakeRef.current = 10;
          } else {
            handleDeath();
            return;
          }
        } else if (obj.type === 'coin') {
          setCoins(prev => prev + 1);
          setScore(prev => prev + 100);
          createParticles(obj.x + obj.width / 2, obj.y + obj.height / 2, obj.color, 8);
          objects.splice(i, 1);
          if (!muted) soundManager.playCoin();
        } else if (obj.type === 'goal') {
          handleLevelWin();
          return;
        } else if (obj.type === 'lava' || obj.type === 'spikes') {
          handleDeath();
          return;
        } else if (obj.type === 'powerup') {
          updateFlash(0.5);
          if (obj.powerupType === 'speed') {
            // Implement speed boost (temporary)
            player.vx *= 2; 
          } else if (obj.powerupType === 'jump') {
            player.vy = -30; // Mega jump
          }
          createParticles(obj.x + obj.width / 2, obj.y + obj.height / 2, obj.color, 20);
          objects.splice(i, 1);
          if (!muted) soundManager.playCoin();
          setScore(prev => prev + 1000);
        }
      }

      // Update enemy movement
      if (obj.type === 'enemy' && obj.startX !== undefined && obj.range !== undefined && obj.vx !== undefined) {
        obj.x += obj.vx;
        if (Math.abs(obj.x - obj.startX) > obj.range) {
          obj.vx *= -1;
        }
      }

      // Update fish movement (jumping)
      if (obj.type === 'fish') {
        if (obj.vy === undefined) obj.vy = -15;
        obj.y += obj.vy;
        obj.vy += 0.4; // Gravity for fish
        if (obj.y > level.height + 100) {
          obj.y = level.height + 100;
          obj.vy = -15 - Math.random() * 10; // Jump back up
        }
      }

      // Update chaser movement (follows player)
      if (obj.type === 'chaser') {
        const speed = (obj.speed || 3) * 0.8; // Slightly slower than player
        const dx = player.x - obj.x;
        const dy = player.y - obj.y;
        const dist = Math.abs(dx);
        
        if (obj.vx === undefined) obj.vx = 0;
        if (obj.vy === undefined) obj.vy = 0;
        if (obj.isGrounded === undefined) obj.isGrounded = false;

        // Only chase if player is within a certain range (e.g., 600px)
        if (dist < 600 && obj.isGrounded) {
          if (dx > 0) {
            obj.vx = speed;
            obj.direction = 1;
          } else {
            obj.vx = -speed;
            obj.direction = -1;
          }

          // Screen shake when close
          if (dist < 200) {
            shakeRef.current = Math.max(shakeRef.current, (200 - dist) / 20);
          }

          // Jumping logic
          // 1. Jump if player is above
          if (obj.isGrounded && dy < -50 && Math.random() < 0.02) {
            obj.vy = level.jumpForce * 0.7;
            obj.isGrounded = false;
          }
        } else {
          obj.vx = 0;
        }

        // Apply gravity
        obj.vy += level.gravity;
        
        // Update position
        obj.x += obj.vx;
        obj.y += obj.vy;

        // Collision with platforms for chaser
        const wasGrounded = obj.isGrounded;
        obj.isGrounded = false;
        
        for (const other of objects) {
          if (other.type === 'platform' || other.type === 'movingPlatform' || other.type === 'questionBlock') {
            if (Physics.checkCollision(obj, other)) {
              const prevY = obj.y - obj.vy;
              
              // Falling onto platform
              if (prevY + obj.height <= other.y + 10) {
                obj.y = other.y - obj.height;
                obj.vy = 0;
                obj.isGrounded = true;
                
                // If on a moving platform, move with it
                if (other.type === 'movingPlatform' && other.moveAxis === 'x' && other.vx !== undefined) {
                  obj.x += other.vx;
                }
              } 
              // Hitting from side - jump if blocked
              else if (prevY < other.y + other.height) {
                if (obj.vx > 0) {
                  obj.x = other.x - obj.width;
                  if (obj.isGrounded) obj.vy = level.jumpForce * 0.7; // Jump over obstacle
                } else if (obj.vx < 0) {
                  obj.x = other.x + other.width;
                  if (obj.isGrounded) obj.vy = level.jumpForce * 0.7; // Jump over obstacle
                }
              }
            }
          }
        }

        // Boundary checks for chaser
        if (obj.x < 0) obj.x = 0;
        if (obj.x > level.width - obj.width) obj.x = level.width - obj.width;
      }
    }

    // Update particles
    for (let i = particlesRef.current.length - 1; i >= 0; i--) {
      const p = particlesRef.current[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.2; // Particle gravity
      p.life -= 0.02;
      if (p.life <= 0) particlesRef.current.splice(i, 1);
    }

    // Camera follow
    const targetCameraX = player.x - CANVAS_WIDTH / 2;
    cameraXRef.current = Math.max(0, Math.min(targetCameraX, level.width - CANVAS_WIDTH));

    // Screen shake
    if (shakeRef.current > 0) shakeRef.current *= 0.9;
  };

  const handleDeath = () => {
    if (playerRef.current.hasShield) {
      playerRef.current.hasShield = false;
      updateFlash(0.5);
      shakeRef.current = 10;
      createParticles(playerRef.current.x, playerRef.current.y, '#00FFFF', 20);
      playerRef.current.vy = -15; // Bounce up
      return;
    }

    shakeRef.current = 20;
    updateFlash(1);
    if (!muted) soundManager.playDeath();
    createParticles(playerRef.current.x, playerRef.current.y, '#FF0000', 30);
    
    setLives(prev => {
      const newLives = prev - 1;
      if (newLives <= 0) {
        setGameState('gameover');
        if (score > highScore) {
          setHighScore(score);
          localStorage.setItem('egyptianPrinceHighScore', score.toString());
        }
        submitScore(score);
      } else {
        setTimeout(() => resetPlayer(LEVELS[currentLevelIndex]), 500);
      }
      return newLives;
    });
  };

  const handleLevelWin = () => {
    if (!muted) soundManager.playWin();
    setTransitioning(true);
    
    // Update high score
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('egyptianPrinceHighScore', score.toString());
    }

    setTimeout(() => {
      if (currentLevelIndex < LEVELS.length - 1) {
        setGameState('levelwin');
      } else {
        setGameState('win');
      }
      setTransitioning(false);
    }, 1000);
  };

  const nextLevel = () => {
    setTransitioning(true);
    setTimeout(() => {
      const nextIdx = currentLevelIndex + 1;
      setCurrentLevelIndex(nextIdx);
      resetPlayer(LEVELS[nextIdx]);
      setGameState('playing');
      setTransitioning(false);
    }, 1000);
  };

  const restartGame = () => {
    setCurrentLevelIndex(0);
    setCoins(0);
    setScore(0);
    setTime(400);
    setLives(5);
    setGameState('characterSelect');
  };

  const buyUpgrade = (type: string, cost: number) => {
    if (coins >= cost) {
      setCoins(prev => prev - cost);
      setUpgrades(prev => {
        const next = { ...prev };
        if (type === 'speed') next.speedLevel++;
        if (type === 'jump') next.jumpLevel++;
        if (type === 'lives') next.maxLives++;
        if (type === 'magnet') next.coinMagnet = true;
        if (type === 'shield') next.shield = true;
        return next;
      });
      if (!muted) soundManager.playCoin();
    }
  };

  const render = (ctx: CanvasRenderingContext2D) => {
    const renderer = new Renderer(ctx);
    const level = LEVELS[currentLevelIndex];
    const cameraX = cameraXRef.current;

    ctx.save();
    // Apply screen shake
    if (shakeRef.current > 0.5) {
      ctx.translate((Math.random() - 0.5) * shakeRef.current, (Math.random() - 0.5) * shakeRef.current);
    }

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    renderer.drawBackground(level.theme, CANVAS_WIDTH, CANVAS_HEIGHT, cameraX);
    
    levelObjectsRef.current.forEach(obj => {
      renderer.drawObject(obj, cameraX);
    });
    
    renderer.drawParticles(particlesRef.current, cameraX);
    
    if (gameState === 'playing') {
      renderer.drawPlayer(playerRef.current, cameraX, frameRef.current);
    }
    
    ctx.restore();
  };

  useEffect(() => {
    const loop = () => {
      if (canvasRef.current) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Handle high DPI screens
          const dpr = window.devicePixelRatio || 1;
          const rect = canvas.getBoundingClientRect();
          
          if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          }
          
          update();
          render(ctx);
        }
      }
      requestRef.current = requestAnimationFrame(loop);
    };

    requestRef.current = requestAnimationFrame(loop);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [gameState, currentLevelIndex, muted, time]);

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-4 font-sans text-white overflow-hidden">
      {/* Background Glow */}
      <div className="fixed inset-0 bg-radial-gradient from-red-900/10 to-transparent pointer-events-none" />

      <div className="relative w-full max-w-[800px] aspect-[4/3] bg-black rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(255,0,0,0.2)] border-2 border-white/10">
        
        {/* HUD */}
        {gameState === 'playing' && (
          <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-10 pointer-events-none font-mono">
            {/* Left side: Lives and Coins */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3 bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm border border-white/10">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: playerRef.current.characterColor }} />
                <span className="text-[10px] font-black tracking-widest text-white/60 uppercase">{playerRef.current.characterName}</span>
              </div>
              <div className="flex items-center gap-2">
                <img 
                  src="https://cdn-icons-png.flaticon.com/512/3105/3105807.png" 
                  alt="Egyptian Prince" 
                  className="w-10 h-10 drop-shadow-lg"
                  referrerPolicy="no-referrer"
                />
                <span className="text-3xl font-black mario-text text-white">×{lives.toString().padStart(2, '0')}</span>
              </div>
              <div className="flex items-center gap-2">
                <img 
                  src="https://cdn-icons-png.flaticon.com/512/3105/3105801.png" 
                  alt="Scarab" 
                  className="w-8 h-8 drop-shadow-lg"
                  referrerPolicy="no-referrer"
                />
                <span className="text-2xl font-black mario-text text-white">{coins.toString().padStart(2, '0')}</span>
              </div>
            </div>

            {/* Right side: Score and Time */}
            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setMuted(!muted)}
                  className="pointer-events-auto p-2 bg-black/40 rounded-full hover:bg-black/60 transition-colors"
                >
                  {muted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                </button>
                <div className="text-4xl font-black mario-text text-white tracking-wider">{score.toString().padStart(8, '0')}</div>
              </div>
              <div className="flex items-center gap-2">
                <img 
                  src="https://cdn-icons-png.flaticon.com/512/1048/1048953.png" 
                  alt="Time" 
                  className="w-6 h-6 drop-shadow-lg invert"
                  referrerPolicy="no-referrer"
                />
                <span className="text-3xl font-black mario-text text-white">{time.toString().padStart(3, '0')}</span>
              </div>
            </div>
          </div>
        )}

        {/* Canvas */}
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="w-full h-full block cursor-none"
        />

        {/* Touch Controls */}
        {isMobile && gameState === 'playing' && (
          <div className="absolute bottom-8 left-8 right-8 flex justify-between items-end z-40 pointer-events-none">
            <div className="flex gap-4 pointer-events-auto">
              <button 
                className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center active:bg-white/40 transition-colors"
                onTouchStart={() => handleTouchStart('ArrowLeft')}
                onTouchEnd={() => handleTouchEnd('ArrowLeft')}
              >
                <ArrowLeft className="w-8 h-8" />
              </button>
              <button 
                className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center active:bg-white/40 transition-colors"
                onTouchStart={() => handleTouchStart('ArrowRight')}
                onTouchEnd={() => handleTouchEnd('ArrowRight')}
              >
                <ArrowRight className="w-8 h-8" />
              </button>
            </div>
            <div className="pointer-events-auto">
              <button 
                className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center active:bg-white/40 transition-colors"
                onTouchStart={() => handleTouchStart('ArrowUp')}
                onTouchEnd={() => handleTouchEnd('ArrowUp')}
              >
                <ArrowUp className="w-10 h-10" />
              </button>
            </div>
          </div>
        )}

        {/* Flash Overlay */}
        {flash > 0 && (
          <div 
            className="absolute inset-0 pointer-events-none z-50" 
            style={{ backgroundColor: `rgba(255, 255, 255, ${flash})` }} 
          />
        )}

        {/* Transition Overlay */}
        <AnimatePresence>
          {transitioning && (
            <motion.div
              key="transition-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black z-[60] flex items-center justify-center"
            >
              <motion.div
                animate={{ 
                  y: [0, -10, 0],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                className="flex flex-col items-center gap-4"
              >
                <img 
                  src="https://cdn-icons-png.flaticon.com/512/3105/3105803.png" 
                  alt="Abu Simbel" 
                  className="w-20 h-20 drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]"
                  referrerPolicy="no-referrer"
                />
                <span className="text-white/40 font-black tracking-[0.3em] text-[10px] uppercase">Restoring History...</span>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Level Name Overlay */}
        <AnimatePresence>
          {showLevelName && gameState === 'playing' && (
            <motion.div
              key="level-name-overlay"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-1/4 left-0 right-0 flex flex-col items-center z-40 pointer-events-none"
            >
              <div className="bg-black/60 backdrop-blur-md px-8 py-4 rounded-2xl border border-white/20">
                <h2 className="text-4xl font-black mario-text text-white tracking-widest uppercase">
                  {currentLevel.name}
                </h2>
                <div className="h-1 bg-yellow-500 mt-2 w-full origin-left animate-scale-x" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Overlays */}
        <AnimatePresence>
          {gameState === 'start' && (
            <motion.div
              key="start-screen"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-20"
            >
              <div className="absolute inset-0 overflow-hidden opacity-20 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[120%] h-[120%] bg-radial-gradient from-red-600/30 to-transparent blur-3xl animate-pulse" />
              </div>

              <motion.div
                initial={{ scale: 0.8, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="relative z-10 text-center"
              >
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 3 }}
                  className="mb-8"
                >
                  <img 
                    src="https://cdn-icons-png.flaticon.com/512/3105/3105807.png" 
                    alt="Egyptian Prince" 
                    className="w-32 h-32 mx-auto drop-shadow-[0_0_30px_rgba(234,179,8,0.5)]"
                    referrerPolicy="no-referrer"
                  />
                </motion.div>
                <h1 className="text-8xl font-black mb-2 tracking-tighter leading-none">
                  EGYPTIAN<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-b from-yellow-400 to-yellow-800">PRINCE</span>
                </h1>
                <p className="text-xl font-bold tracking-[0.5em] text-white/40 mb-8 uppercase">The Pharaoh's Quest</p>
                
                {highScore > 0 && (
                  <div className="mb-8 flex flex-col items-center gap-2">
                    <span className="text-yellow-500 font-black tracking-widest text-sm uppercase">Personal Best</span>
                    <span className="text-4xl font-black mario-text">{highScore.toString().padStart(8, '0')}</span>
                  </div>
                )}

                <div className="flex flex-col gap-4 items-center">
                  {!user ? (
                    <button
                      onClick={handleLogin}
                      className="px-12 py-4 bg-blue-600 text-white rounded-full font-black text-xl hover:scale-105 transition-all flex items-center gap-3"
                    >
                      <LogIn className="w-6 h-6" /> LOGIN FOR LEADERBOARD
                    </button>
                  ) : (
                    <div className="flex items-center gap-3 mb-4">
                      <img src={user.photoURL || ''} alt="" className="w-8 h-8 rounded-full border border-yellow-500" />
                      <span className="font-bold text-yellow-500">{user.displayName}</span>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      soundManager.init();
                      setGameState('characterSelect');
                    }}
                    className="group relative px-16 py-6 bg-white text-black rounded-full font-black text-2xl transition-all hover:scale-105 active:scale-95 overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-red-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className="relative z-10 group-hover:text-white flex items-center gap-3">
                      <Play className="w-8 h-8 fill-current" />
                      START MISSION
                    </span>
                  </button>
                </div>

                {leaderboard.length > 0 && (
                  <div className="mt-12 max-w-md mx-auto bg-white/5 backdrop-blur-sm p-6 rounded-2xl border border-white/10">
                    <h3 className="text-yellow-500 font-black tracking-[0.3em] text-xs uppercase mb-4">Global Top 10</h3>
                    <div className="flex flex-col gap-2">
                      {leaderboard.map((entry, i) => (
                        <div key={i} className="flex justify-between items-center text-sm">
                          <span className="text-white/60 font-mono">{i + 1}. {entry.playerName}</span>
                          <span className="font-black text-white">{entry.score.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={() => setShowShop(true)}
                  className="mt-6 group relative px-12 py-4 bg-yellow-500 text-black rounded-full font-black text-xl transition-all hover:scale-105 active:scale-95 overflow-hidden flex items-center gap-3 mx-auto"
                >
                  <Trophy className="w-6 h-6" />
                  UPGRADES SHOP
                </button>
              </motion.div>

              <div className="absolute bottom-12 flex gap-12 text-white/20 font-black tracking-widest text-xs uppercase">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-1 border border-white/20 rounded">WASD</span>
                  <span>Navigate</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-2 py-1 border border-white/20 rounded">SPACE</span>
                  <span>Ascend</span>
                </div>
              </div>
            </motion.div>
          )}

          {gameState === 'characterSelect' && (
            <motion.div
              key="character-select"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center z-40 p-8"
            >
              <h2 className="text-5xl font-black mb-12 tracking-tighter text-white">CHOOSE YOUR HERO</h2>
              
              <div className="grid grid-cols-2 gap-6 mb-12">
                {CHARACTERS.map((char, index) => (
                  <motion.button
                    key={char.name}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedCharacterIndex(index)}
                    className={`p-6 rounded-3xl border-4 transition-all flex flex-col items-center gap-4 ${
                      selectedCharacterIndex === index 
                        ? 'border-yellow-500 bg-white/10 shadow-[0_0_30px_rgba(234,179,8,0.3)]' 
                        : 'border-white/10 bg-white/5 hover:border-white/30'
                    }`}
                  >
                    <div 
                      className="w-20 h-20 rounded-2xl shadow-lg flex items-center justify-center"
                      style={{ backgroundColor: char.color }}
                    >
                      <span className="text-4xl font-black text-white">{char.name[0]}</span>
                    </div>
                    <span className={`text-xl font-black ${selectedCharacterIndex === index ? 'text-yellow-500' : 'text-white/60'}`}>
                      {char.name}
                    </span>
                  </motion.button>
                ))}
              </div>

              <button
                onClick={() => {
                  setGameState('playing');
                  resetPlayer(LEVELS[0]);
                }}
                className="px-20 py-6 bg-yellow-500 text-black rounded-full font-black text-2xl hover:scale-105 transition-all flex items-center gap-4 shadow-[0_10px_40px_rgba(234,179,8,0.4)]"
              >
                <Play className="w-8 h-8 fill-current" /> CONFIRM HERO
              </button>
            </motion.div>
          )}

          {gameState === 'levelwin' && (
            <motion.div
              key="level-win-screen"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-20"
            >
              <motion.div
                initial={{ y: 20, scale: 0.9 }}
                animate={{ y: 0, scale: 1 }}
                className="text-center"
              >
                <div className="w-32 h-32 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_0_50px_rgba(234,179,8,0.3)]">
                  <img 
                    src="https://cdn-icons-png.flaticon.com/512/3105/3105807.png" 
                    alt="Egyptian Prince" 
                    className="w-20 h-20"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <h2 className="text-5xl font-black mb-4 tracking-tighter">WORLD RESTORED</h2>
                <p className="text-white/40 font-bold tracking-widest mb-12 uppercase">Progressing to next sector</p>
                <button
                  onClick={nextLevel}
                  className="px-12 py-5 bg-white text-black rounded-full font-black text-xl hover:scale-105 transition-all flex items-center gap-3"
                >
                  NEXT WORLD <ChevronRight className="w-6 h-6" />
                </button>
              </motion.div>
            </motion.div>
          )}

          {gameState === 'win' && (
            <motion.div
              key="win-screen"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-black flex flex-col items-center justify-center z-30 text-center p-8"
            >
              <motion.div
                animate={{ 
                  y: [0, -20, 0],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ repeat: Infinity, duration: 4 }}
              >
                <Trophy className="w-48 h-48 text-yellow-500 mb-12 mx-auto drop-shadow-[0_0_30px_rgba(234,179,8,0.5)]" />
              </motion.div>
              <h2 className="text-7xl font-black mb-4 tracking-tighter bg-gradient-to-b from-yellow-200 to-yellow-600 bg-clip-text text-transparent">ULTIMATE VICTORY</h2>
              <p className="text-xl text-white/40 font-bold tracking-[0.3em] mb-16 uppercase">The elements are in harmony</p>
              <button
                onClick={restartGame}
                className="px-16 py-6 bg-white text-black rounded-full font-black text-2xl hover:scale-105 transition-all flex items-center gap-4"
              >
                <RefreshCw className="w-8 h-8" /> REBOOT MISSION
              </button>
            </motion.div>
          )}

          {gameState === 'gameover' && (
            <motion.div
              key="game-over-screen"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center z-30 text-center p-8"
            >
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="mb-8"
              >
                <div className="w-32 h-32 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_0_50px_rgba(220,38,38,0.5)]">
                  <VolumeX className="w-16 h-16 text-white" />
                </div>
                <h2 className="text-7xl font-black tracking-tighter text-red-600">GAME OVER</h2>
                <p className="text-white/40 font-bold tracking-[0.3em] uppercase mt-2">The Prince has fallen</p>
              </motion.div>

              <div className="bg-white/5 backdrop-blur-md p-8 rounded-3xl border border-white/10 mb-12 w-full max-w-sm">
                <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-center">
                    <span className="text-white/40 font-bold uppercase text-xs tracking-widest">Final Score</span>
                    <span className="text-3xl font-black mario-text">{score.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-yellow-500 font-bold uppercase text-xs tracking-widest">Best Score</span>
                    <span className="text-3xl font-black mario-text text-yellow-500">{highScore.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-4 w-full max-w-xs">
                <button
                  onClick={restartGame}
                  className="px-12 py-6 bg-white text-black rounded-full font-black text-xl hover:scale-105 transition-all flex items-center justify-center gap-4 shadow-xl"
                >
                  <RefreshCw className="w-6 h-6" /> TRY AGAIN
                </button>
                <button
                  onClick={() => setGameState('start')}
                  className="px-12 py-4 bg-white/10 text-white rounded-full font-black text-lg hover:bg-white/20 transition-all"
                >
                  MAIN MENU
                </button>
              </div>
            </motion.div>
          )}

          {/* Shop Overlay */}
          <AnimatePresence>
            {showShop && (
              <motion.div
                key="shop-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/95 z-[100] p-8 flex flex-col"
              >
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-4xl font-black mario-text text-yellow-500">UPGRADES SHOP</h2>
                  <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full">
                    <img src="https://cdn-icons-png.flaticon.com/512/3105/3105801.png" className="w-6 h-6" alt="Scarab" />
                    <span className="text-2xl font-black">{coins}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 overflow-y-auto pr-2">
                  <div className="bg-white/5 p-4 rounded-xl border border-white/10 flex justify-between items-center">
                    <div>
                      <h3 className="text-xl font-bold">Speed Boost (Lvl {upgrades.speedLevel})</h3>
                      <p className="text-sm text-white/40">Move faster through the levels</p>
                    </div>
                    <button 
                      onClick={() => buyUpgrade('speed', 50)}
                      disabled={coins < 50}
                      className="px-6 py-2 bg-yellow-500 text-black rounded-lg font-bold disabled:opacity-50"
                    >
                      50 Coins
                    </button>
                  </div>

                  <div className="bg-white/5 p-4 rounded-xl border border-white/10 flex justify-between items-center">
                    <div>
                      <h3 className="text-xl font-bold">Jump Power (Lvl {upgrades.jumpLevel})</h3>
                      <p className="text-sm text-white/40">Jump higher to reach new heights</p>
                    </div>
                    <button 
                      onClick={() => buyUpgrade('jump', 50)}
                      disabled={coins < 50}
                      className="px-6 py-2 bg-yellow-500 text-black rounded-lg font-bold disabled:opacity-50"
                    >
                      50 Coins
                    </button>
                  </div>

                  <div className="bg-white/5 p-4 rounded-xl border border-white/10 flex justify-between items-center">
                    <div>
                      <h3 className="text-xl font-bold">Extra Life</h3>
                      <p className="text-sm text-white/40">Increase your starting lives (Current: {upgrades.maxLives})</p>
                    </div>
                    <button 
                      onClick={() => buyUpgrade('lives', 100)}
                      disabled={coins < 100}
                      className="px-6 py-2 bg-yellow-500 text-black rounded-lg font-bold disabled:opacity-50"
                    >
                      100 Coins
                    </button>
                  </div>

                  <div className="bg-white/5 p-4 rounded-xl border border-white/10 flex justify-between items-center">
                    <div>
                      <h3 className="text-xl font-bold">Coin Magnet</h3>
                      <p className="text-sm text-white/40">Pull nearby coins automatically</p>
                    </div>
                    <button 
                      onClick={() => buyUpgrade('magnet', 250)}
                      disabled={coins < 250 || upgrades.coinMagnet}
                      className="px-6 py-2 bg-yellow-500 text-black rounded-lg font-bold disabled:opacity-50"
                    >
                      {upgrades.coinMagnet ? 'OWNED' : '250 Coins'}
                    </button>
                  </div>

                  <div className="bg-white/5 p-4 rounded-xl border border-white/10 flex justify-between items-center">
                    <div>
                      <h3 className="text-xl font-bold">Royal Shield</h3>
                      <p className="text-sm text-white/40">Survive one hit per level</p>
                    </div>
                    <button 
                      onClick={() => buyUpgrade('shield', 500)}
                      disabled={coins < 500 || upgrades.shield}
                      className="px-6 py-2 bg-yellow-500 text-black rounded-lg font-bold disabled:opacity-50"
                    >
                      {upgrades.shield ? 'OWNED' : '500 Coins'}
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => setShowShop(false)}
                  className="mt-auto w-full py-4 bg-white text-black rounded-xl font-black text-xl"
                >
                  BACK TO MENU
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </AnimatePresence>
      </div>

      {/* Footer Stats */}
      <div className="mt-12 flex flex-wrap justify-center gap-x-12 gap-y-4 text-white/10 font-black tracking-[0.3em] text-[10px] uppercase max-w-4xl mx-auto">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
          <span>S01: Delta</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]" />
          <span>S02: Giza</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_10_rgba(249,115,22,0.5)]" />
          <span>S03: Kings</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
          <span>S04: Karnak</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-700 shadow-[0_0_10px_rgba(4,120,87,0.5)]" />
          <span>S05: Luxor</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-300 shadow-[0_0_10px_rgba(147,197,253,0.5)]" />
          <span>S06: Nile</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-700 shadow-[0_0_10px_rgba(29,78,216,0.5)]" />
          <span>S07: Tomb</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
          <span>S08: Library</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.5)]" />
          <span>S09: Sky</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)]" />
          <span>S10: Palace</span>
        </div>
      </div>
    </div>
  );
}
