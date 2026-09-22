import React, { useEffect, useRef, useState } from 'react';

interface GameEngineProps {
  onScoreUpdate: (score: number) => void;
  onGameOver: (finalScore: number) => void;
  onLevelUpdate?: (level: number) => void;
  selectedDoctor: any;
  clinicAssets: any;
  isPaused?: boolean;
}

export default function GameEngine({ onScoreUpdate, onGameOver, onLevelUpdate, selectedDoctor, clinicAssets, isPaused = false }: GameEngineProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [assetsLoading, setAssetsLoading] = useState(true);
  
  const isPausedRef = useRef(isPaused);
  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);
  
  // Game state constants
  const BASE_W = 480;
  const BASE_H = 853;
  const GROUND_Y = BASE_H - 120;
  const GRAVITY = 0.85;
  const JUMP_V = -16.5;

  const PLAYER_W = 92;
  const PLAYER_H = 106;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Fit canvas dynamically based on parent container while maintaining 9:16 aspect ratio
    const fitCanvas = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      canvas.width = BASE_W;
      canvas.height = BASE_H;
    };
    fitCanvas();
    window.addEventListener('resize', fitCanvas);

    let animationFrameId: number;
    let isRunning = false;
    let score = 0;
    
    // Level & Parallax background state
    let distance = 0;
    let level = 0;
    const BASE_SPEED = 3.0;
    const MAX_SPEED = 8.0;
    const SPEED_STEP = 0.35;
    const LEVEL_DISTANCE = 480;
    
    let bgOffset = 0;
    let bgSpeed = BASE_SPEED;
    
    const player = {
      x: 70, 
      y: GROUND_Y - PLAYER_H, 
      w: PLAYER_W, 
      h: PLAYER_H,
      vy: 0, 
      jumping: false, 
      ducking: false, 
      shielded: false
    };
    
    type ObstacleType = 'ground' | 'air';
    const obstacles: { x: number, y: number, w: number, h: number, img: string, type: ObstacleType }[] = [];
    const collectibles: { x: number, y: number, w: number, h: number, img: string, points: number, collected: boolean }[] = [];
    
    let spawnTimer = 0;
    let runFrame = 0;
    let runFrameTimer = 0;
    
    const OBSTACLE_TYPES = [
      { img:'syringe', w:46, h:70, type:'ground' as ObstacleType },
      { img:'pillStack', w:56, h:42, type:'ground' as ObstacleType },
      { img:'bottle', w:36, h:64, type:'ground' as ObstacleType },
      { img:'virus', w:50, h:50, type:'air' as ObstacleType },
    ];

    const doJump = () => {
      if (!isRunning || isPausedRef.current) return;
      if (!player.jumping && !player.ducking){
        player.jumping = true;
        player.vy = JUMP_V;
      }
    };
    const startDuck = () => {
      if (!isRunning || isPausedRef.current || player.jumping) return;
      player.ducking = true;
    };
    const endDuck = () => { player.ducking = false; };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') doJump();
      if (e.code === 'ArrowDown') startDuck();
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'ArrowDown') endDuck();
    };

    let touchStartY: number | null = null;
    const handlePointerDown = (e: PointerEvent) => { touchStartY = e.clientY; };
    const handlePointerUp = (e: PointerEvent) => {
      if (touchStartY === null) return;
      const dy = e.clientY - touchStartY;
      if (dy > 40){ startDuck(); setTimeout(endDuck, 500); }
      else { doJump(); }
      touchStartY = null;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    canvas.addEventListener('pointerdown', handlePointerDown);
    canvas.addEventListener('pointerup', handlePointerUp);

    // --- Inline SVG Fallback Generators ---
    const svgToImage = (svgMarkup: string, w: number, h: number) => {
      return new Promise<HTMLImageElement>((resolve) => {
        const img = new Image();
        img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgMarkup);
        img.width = w; img.height = h;
        img.onload = () => resolve(img);
        img.onerror = () => resolve(img);
      });
    };

    const doctorSVG = (color: string, legPose: number) => {
      const legA = legPose === 0 ? 'M20,72 L14,90 M32,72 L38,90' : 'M20,72 L26,90 M32,72 L26,90';
      return `
      <svg xmlns="http://www.w3.org/2000/svg" width="52" height="96" viewBox="0 0 52 96">
        <ellipse cx="26" cy="92" rx="14" ry="3" fill="rgba(0,0,0,0.15)"/>
        <rect x="14" y="34" width="24" height="38" rx="8" fill="#ffffff" stroke="${color}" stroke-width="3"/>
        <rect x="14" y="34" width="24" height="10" fill="${color}"/>
        <circle cx="26" cy="18" r="14" fill="#F6C9A0"/>
        <path d="M12,14 a14,14 0 0 1 28,0 v2 h-28z" fill="#3B2A20"/>
        <circle cx="20" cy="18" r="1.6" fill="#2b2b2b"/>
        <circle cx="32" cy="18" r="1.6" fill="#2b2b2b"/>
        <path d="M20,24 q6,4 12,0" stroke="#8a5a3b" stroke-width="1.5" fill="none"/>
        <path d="M20,52 q6,-8 -8,4" stroke="${color}" stroke-width="4" fill="none" stroke-linecap="round"/>
        <path d="M32,52 q-6,-8 8,4" stroke="${color}" stroke-width="4" fill="none" stroke-linecap="round"/>
        <path d="${legA}" stroke="#2b2b2b" stroke-width="5" stroke-linecap="round" fill="none"/>
        <rect x="21" y="40" width="10" height="14" rx="2" fill="#eee" stroke="${color}" stroke-width="1"/>
        <line x1="26" y1="40" x2="26" y2="54" stroke="${color}" stroke-width="1"/>
        <circle cx="10" cy="46" r="2.5" fill="#c94b3f"/>
        <path d="M10,46 q0,-8 6,-10" stroke="#c94b3f" stroke-width="2" fill="none"/>
      </svg>`;
    };
    
    const duckDoctorSVG = (color: string) => `
      <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60">
        <ellipse cx="30" cy="56" rx="18" ry="3" fill="rgba(0,0,0,0.15)"/>
        <rect x="6" y="26" width="42" height="26" rx="10" fill="#ffffff" stroke="${color}" stroke-width="3"/>
        <circle cx="46" cy="24" r="12" fill="#F6C9A0"/>
        <path d="M35,20 a12,12 0 0 1 24,0 v2 h-24z" fill="#3B2A20"/>
        <circle cx="42" cy="24" r="1.4" fill="#2b2b2b"/>
        <circle cx="52" cy="24" r="1.4" fill="#2b2b2b"/>
      </svg>`;

    const syringeSVG = () => `
      <svg xmlns="http://www.w3.org/2000/svg" width="46" height="70" viewBox="0 0 46 70">
        <rect x="18" y="6" width="10" height="40" rx="2" fill="#dfeff0" stroke="#7fb3af" stroke-width="2"/>
        <rect x="16" y="4" width="14" height="8" fill="#b7d9d6"/>
        <line x1="23" y1="46" x2="23" y2="68" stroke="#9aa7ab" stroke-width="3"/>
        <rect x="10" y="0" width="26" height="6" fill="#4d8c86"/>
        <rect x="20" y="14" width="6" height="24" fill="#F0704A" opacity="0.7"/>
      </svg>`;

    const pillStackSVG = () => `
      <svg xmlns="http://www.w3.org/2000/svg" width="56" height="42" viewBox="0 0 56 42">
        <ellipse cx="16" cy="34" rx="14" ry="7" fill="#E0B04A" stroke="#a97e2b" stroke-width="2"/>
        <ellipse cx="34" cy="30" rx="13" ry="6.5" fill="#3E8E8A" stroke="#296a66" stroke-width="2"/>
        <ellipse cx="44" cy="20" rx="10" ry="5" fill="#F0704A" stroke="#b8502e" stroke-width="2"/>
      </svg>`;

    const bottleSVG = () => `
      <svg xmlns="http://www.w3.org/2000/svg" width="36" height="64" viewBox="0 0 36 64">
        <rect x="8" y="18" width="20" height="42" rx="3" fill="#7fb3af" stroke="#3E8E8A" stroke-width="2"/>
        <rect x="12" y="6" width="12" height="14" fill="#c8dedb" stroke="#3E8E8A" stroke-width="2"/>
        <rect x="10" y="2" width="16" height="6" fill="#2a5f5b"/>
        <rect x="10" y="30" width="16" height="14" fill="#fff" opacity="0.85"/>
      </svg>`;

    const virusSVG = () => `
      <svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 50 50">
        <circle cx="25" cy="25" r="14" fill="#c94b3f"/>
        <g stroke="#c94b3f" stroke-width="3">
          <line x1="25" y1="4" x2="25" y2="10"/>
          <line x1="25" y1="40" x2="25" y2="46"/>
          <line x1="4" y1="25" x2="10" y2="25"/>
          <line x1="40" y1="25" x2="46" y2="25"/>
          <line x1="10" y1="10" x2="14" y2="14"/>
          <line x1="36" y1="36" x2="40" y2="40"/>
          <line x1="40" y1="10" x2="36" y2="14"/>
          <line x1="14" y1="36" x2="10" y2="40"/>
        </g>
        <circle cx="20" cy="22" r="2" fill="#7a1f16"/>
        <circle cx="29" cy="27" r="2" fill="#7a1f16"/>
      </svg>`;

    const appleSVG = () => `
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="34" viewBox="0 0 32 34">
        <path d="M16,10 C6,8 4,20 8,27 C11,32 14,32 16,30 C18,32 21,32 24,27 C28,20 26,8 16,10 Z" fill="#D9433A"/>
        <path d="M16,10 C16,6 18,4 20,3" stroke="#5B3A21" stroke-width="2" fill="none"/>
        <ellipse cx="12" cy="16" rx="3" ry="5" fill="#ffffff" opacity="0.3"/>
      </svg>`;

    const vitaminSVG = () => `
      <svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 34 34">
        <circle cx="17" cy="17" r="15" fill="#F5A623" stroke="#c9790f" stroke-width="2"/>
        <text x="17" y="22" font-size="14" text-anchor="middle" fill="#fff" font-family="Arial" font-weight="bold">C</text>
      </svg>`;

    const heartShieldSVG = () => `
      <svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 34 34">
        <path d="M17,30 C4,22 4,10 12,7 C15,6 17,8 17,10 C17,8 19,6 22,7 C30,10 30,22 17,30 Z" fill="#F0704A" stroke="#b8502e" stroke-width="1.5"/>
      </svg>`;

    // Asset Loader
    const loadExternalImage = (src: string | undefined) => {
      return new Promise<HTMLImageElement | null>((resolve) => {
        if (!src) return resolve(null);
        const img = new Image();
        img.src = src;
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null); // Fallback to inline SVG if fails
      });
    };

    let loadedAssets: any = {};
    const docColor = selectedDoctor?.primaryColor || '#0ea5e9';

    const initializeGame = async () => {
      const assets = clinicAssets || {};
      
      // Load fallback SVGs concurrently
      const [
        fallbackRun0, fallbackRun1, fallbackDuck, 
        fallbackSyringe, fallbackPill, fallbackBottle, fallbackVirus, 
        fallbackApple, fallbackVitamin, fallbackShield
      ] = await Promise.all([
        svgToImage(doctorSVG(docColor, 0), PLAYER_W, PLAYER_H),
        svgToImage(doctorSVG(docColor, 1), PLAYER_W, PLAYER_H),
        svgToImage(duckDoctorSVG(docColor), PLAYER_W, PLAYER_H),
        svgToImage(syringeSVG(), 46, 70),
        svgToImage(pillStackSVG(), 56, 42),
        svgToImage(bottleSVG(), 36, 64),
        svgToImage(virusSVG(), 50, 50),
        svgToImage(appleSVG(), 32, 34),
        svgToImage(vitaminSVG(), 34, 34),
        svgToImage(heartShieldSVG(), 34, 34),
      ]);

      // Attempt to load external custom DB assets
      const [extBg, extDoctor, extPill, extBottle, extVirus, extSyringe] = await Promise.all([
        loadExternalImage(assets.bgUrl),
        loadExternalImage(assets.doctorUrl),
        loadExternalImage(assets.pillUrl),
        loadExternalImage(assets.bottleUrl),
        loadExternalImage(assets.virusUrl),
        loadExternalImage(assets.syringeUrl),
      ]);

      loadedAssets = { 
        bgImg: extBg, // If null, we draw procedural clinic bg
        runDoctors: [extDoctor || fallbackRun0, extDoctor || fallbackRun1],
        duckDoctors: extDoctor || fallbackDuck,
        syringe: extSyringe || fallbackSyringe,
        pillStack: extPill || fallbackPill,
        bottle: extBottle || fallbackBottle,
        virus: extVirus || fallbackVirus,
        apple: fallbackApple,
        vitamin: fallbackVitamin,
        shield: fallbackShield
      };
      
      setAssetsLoading(false);
      isRunning = true;
      gameLoop();
    };

    const spawnObstacle = () => {
      const t = OBSTACLE_TYPES[Math.floor(Math.random() * OBSTACLE_TYPES.length)];
      const y = t.type === 'air' ? GROUND_Y - PLAYER_H - 12 : GROUND_Y - t.h;
      obstacles.push({ ...t, x: BASE_W + 20, y });
    };

    const spawnCollectible = () => {
      const roll = Math.random();
      let img = 'apple', w=32, h=34, points=50;
      if (roll > 0.7){ img='vitamin'; w=34; h=34; points=100; }
      else if (roll > 0.55){ img='shield'; w=34; h=34; points=0; }
      const y = GROUND_Y - 130 - Math.random()*60;
      collectibles.push({ img, w, h, points, x: BASE_W + 40, y, collected:false });
    };

    const rectsOverlap = (a: any, b: any) => {
      return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
    };

    const drawBackground = () => {
      if (loadedAssets.bgImg && loadedAssets.bgImg.naturalHeight > 0) {
        const img = loadedAssets.bgImg;
        const drawH = BASE_H;
        // Keep aspect ratio
        const drawW = img.naturalWidth * (BASE_H / img.naturalHeight);
        
        ctx.fillStyle = '#DCEFE9';
        ctx.fillRect(0, 0, BASE_W, BASE_H);
        
        // Loop the image seamlessly
        let x = (bgOffset % drawW);
        if (x > 0) x -= drawW;
        
        while (x < BASE_W) {
          ctx.drawImage(img, x, 0, drawW, drawH);
          x += drawW;
        }
        return;
      }

      // Procedural fallback background
      const grad = ctx.createLinearGradient(0,0,0,GROUND_Y);
      grad.addColorStop(0, '#DCEFE9');
      grad.addColorStop(1, '#F7FBFA');
      ctx.fillStyle = grad;
      ctx.fillRect(0,0,BASE_W,GROUND_Y);

      ctx.fillStyle = '#c9e3dd';
      for (let pass=0; pass<2; pass++){
        const startX = (bgOffset % BASE_W) + pass*BASE_W;
        for (let i=0;i<6;i++){
          const x = startX + i*90;
          ctx.fillRect(x, GROUND_Y-170, 50, 130);
          ctx.fillStyle = '#e8f4f0';
          ctx.fillRect(x+6, GROUND_Y-160, 38, 110);
          ctx.fillStyle = '#c9e3dd';
        }
      }

      ctx.fillStyle = '#EDE7DC';
      ctx.fillRect(0, GROUND_Y, BASE_W, BASE_H-GROUND_Y);
      ctx.strokeStyle = '#d8cfba';
      ctx.lineWidth = 2;
      for (let pass=0; pass<2; pass++){
        const startX = (bgOffset % BASE_W) + pass*BASE_W;
        for (let i=0;i<10;i++){
          const x = startX + i*48;
          ctx.beginPath();
          ctx.moveTo(x, GROUND_Y);
          ctx.lineTo(x-10, BASE_H);
          ctx.stroke();
        }
      }
    };

    const gameLoop = () => {
      if (!isRunning) return;
      
      if (!isPausedRef.current) {
        // Update Logic
        distance += bgSpeed;
        const newLevel = Math.min(15, Math.floor(distance / LEVEL_DISTANCE));
        if (newLevel !== level) {
          level = newLevel;
          if (onLevelUpdate) onLevelUpdate(level + 1);
        }
        
        bgSpeed = Math.min(MAX_SPEED, BASE_SPEED + level * SPEED_STEP);
        bgOffset -= bgSpeed;

        if (player.jumping){
          player.vy += GRAVITY;
          player.y += player.vy;
          if (player.y >= GROUND_Y - player.h){
            player.y = GROUND_Y - player.h;
            player.jumping = false;
            player.vy = 0;
          }
        }

        runFrameTimer++;
        if (runFrameTimer > 6){ runFrame = 1 - runFrame; runFrameTimer = 0; }

        spawnTimer++;
        const spawnEvery = Math.max(48, 95 - level * 5);
        if (spawnTimer > spawnEvery){
          spawnTimer = 0;
          spawnObstacle();
          if (Math.random() > 0.45) spawnCollectible();
        }

        for(let i=obstacles.length-1; i>=0; i--){
          obstacles[i].x -= bgSpeed + 2.2;
          if(obstacles[i].x < -80) obstacles.splice(i, 1);
        }

        for(let i=collectibles.length-1; i>=0; i--){
          collectibles[i].x -= bgSpeed + 2.2;
          if(collectibles[i].x < -60 || collectibles[i].collected) collectibles.splice(i, 1);
        }

        // Collision Detection
        const pBox = player.ducking
          ? { x: player.x, y: GROUND_Y - PLAYER_H * 0.55, w: PLAYER_W, h: PLAYER_H * 0.55 }
          : { x: player.x, y: player.y, w: player.w, h: player.h };

        for (let i=0; i<obstacles.length; i++){
          const o = obstacles[i];
          const oBox = { x:o.x, y:o.y, w:o.w, h:o.h };
          // Hitbox margin logic is integrated into rectsOverlap for fairness
          const margin = 8;
          const strictPBox = { x: pBox.x+margin, y: pBox.y+margin, w: pBox.w-margin*2, h: pBox.h-margin*2 };
          const strictOBox = { x: oBox.x+margin, y: oBox.y+margin, w: oBox.w-margin*2, h: oBox.h-margin*2 };

          if (rectsOverlap(strictPBox, strictOBox)){
            if (player.shielded){
              player.shielded = false;
              obstacles.splice(i, 1);
            } else {
              isRunning = false;
              onGameOver(score);
              return; // Halt game loop instantly
            }
          }
        }

        for (const c of collectibles){
          const cBox = { x:c.x, y:c.y, w:c.w, h:c.h };
          if (!c.collected && rectsOverlap(pBox, cBox)){
            c.collected = true;
            if (c.img === 'shield') player.shielded = true;
            else {
              score += c.points;
              onScoreUpdate(score); // Only broadcast when actual score changes
            }
          }
        }

        score += 1; // Passive score over time
        if (score % 10 === 0) onScoreUpdate(score); // Throttle score updates to React state
      } // End of !isPaused block

      // Render Logic
      ctx.clearRect(0, 0, BASE_W, BASE_H);
      drawBackground();

      obstacles.forEach(o => {
        if (loadedAssets[o.img]) ctx.drawImage(loadedAssets[o.img], o.x, o.y, o.w, o.h);
      });
      collectibles.forEach(c => {
        if (!c.collected && loadedAssets[c.img]) ctx.drawImage(loadedAssets[c.img], c.x, c.y, c.w, c.h);
      });

      // Draw Player
      ctx.save();
      if (player.shielded){
        ctx.beginPath();
        ctx.arc(player.x+player.w/2, player.y+player.h/2, PLAYER_W * 0.75, 0, Math.PI*2);
        ctx.strokeStyle = 'rgba(240,112,74,0.7)';
        ctx.lineWidth = 4;
        ctx.stroke();
      }
      
      if (player.ducking && loadedAssets.duckDoctors){
        // Squash the player visually if using standard uploaded sprites
        ctx.translate(player.x, GROUND_Y - player.h * 0.55);
        ctx.scale(1.05, 0.55);
        ctx.drawImage(loadedAssets.duckDoctors, 0, 0, player.w, player.h);
      } else if (loadedAssets.runDoctors) {
        const frameImg = loadedAssets.runDoctors[player.jumping ? 0 : runFrame];
        ctx.drawImage(frameImg, player.x, player.y, player.w, player.h);
      }
      ctx.restore();

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    initializeGame();

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      canvas.removeEventListener('pointerdown', handlePointerDown);
      canvas.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('resize', fitCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, [selectedDoctor, clinicAssets, onGameOver, onScoreUpdate, onLevelUpdate]);

  return (
    <div className="relative w-full max-w-[480px] aspect-[9/16] mx-auto rounded-xl overflow-hidden shadow-2xl">
      {assetsLoading && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-900 text-white">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <div className="font-bold tracking-widest text-sm uppercase opacity-70 animate-pulse">Loading Assets</div>
        </div>
      )}
      <canvas 
        ref={canvasRef} 
        className="w-full h-full block cursor-pointer bg-slate-50 touch-none object-cover"
        style={{ touchAction: 'none' }}
      />
    </div>
  );
}
