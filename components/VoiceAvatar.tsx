import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { AvatarState, VisualContext } from '../types';

interface VoiceAvatarProps {
  state: AvatarState;
  visualContext?: VisualContext;
  audioLevel: number; 
  compact?: boolean;
  primaryColor?: string;
  visible?: boolean;
}

const COUNT = 1400; // Extra High fidelity

// --- Digit Bitmap Patterns (4x6 Grid) ---
const DIGITS: Record<string, number[]> = {
  '0': [0,1,1,0, 1,0,0,1, 1,0,0,1, 1,0,0,1, 1,0,0,1, 0,1,1,0],
  '1': [0,0,1,0, 0,1,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0, 0,1,1,1],
  '2': [0,1,1,0, 1,0,0,1, 0,0,0,1, 0,0,1,0, 0,1,0,0, 1,1,1,1],
  '3': [0,1,1,0, 1,0,0,1, 0,0,1,0, 0,0,0,1, 1,0,0,1, 0,1,1,0],
  '4': [0,0,1,0, 0,1,1,0, 1,0,1,0, 1,1,1,1, 0,0,1,0, 0,0,1,0],
  '5': [1,1,1,1, 1,0,0,0, 1,1,1,0, 0,0,0,1, 1,0,0,1, 0,1,1,0],
  '6': [0,1,1,0, 1,0,0,0, 1,1,1,0, 1,0,0,1, 1,0,0,1, 0,1,1,0],
  '7': [1,1,1,1, 0,0,0,1, 0,0,1,0, 0,1,0,0, 0,1,0,0, 0,1,0,0],
  '8': [0,1,1,0, 1,0,0,1, 0,1,1,0, 1,0,0,1, 1,0,0,1, 0,1,1,0],
  '9': [0,1,1,0, 1,0,0,1, 1,0,0,1, 0,1,1,1, 0,0,0,1, 0,1,1,0],
  ':': [0,0,0,0, 0,1,1,0, 0,1,1,0, 0,0,0,0, 0,1,1,0, 0,1,1,0]
};

const VoxelCloud = ({ state, visualContext, audioLevel, primaryColor }: { state: AvatarState, visualContext: VisualContext, audioLevel: number, primaryColor: string }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const tempObject = useMemo(() => new THREE.Object3D(), []);
  
  const particles = useMemo(() => {
    return new Array(COUNT).fill(0).map((_, i) => ({
      // Current
      x: (Math.random() - 0.5) * 4,
      y: (Math.random() - 0.5) * 4,
      z: (Math.random() - 0.5) * 4,
      // Meta
      speed: Math.random() * 0.05 + 0.02,
      phase: Math.random() * Math.PI * 2,
      scale: 1,
      // Types
      isRainDrop: Math.random() > 0.4,
      isSteam: Math.random() > 0.7
    }));
  }, []);

  useFrame((stateContext, delta) => {
    if (!meshRef.current) return;

    const time = stateContext.clock.getElapsedTime();
    const audioFactor = Math.max(0, audioLevel / 50); 
    const date = new Date();
    
    // --- Context Mapping ---
    let mode = 'SPHERE';
    if (state === AvatarState.THINKING) mode = 'THINKING';
    else if (state === AvatarState.LISTENING) mode = 'LISTENING';
    // Weather
    else if (visualContext === VisualContext.WEATHER_RAIN) mode = 'RAIN';
    else if (visualContext === VisualContext.WEATHER_SUN) mode = 'SUN';
    else if (visualContext === VisualContext.WEATHER_CLOUDY) mode = 'CLOUDY';
    else if (visualContext === VisualContext.WEATHER_SNOW) mode = 'SNOW';
    else if (visualContext === VisualContext.WEATHER_THUNDER) mode = 'THUNDER';
    // Emotions
    else if (visualContext === VisualContext.MOOD_HAPPY) mode = 'HAPPY';
    else if (visualContext === VisualContext.MOOD_SAD) mode = 'SAD';
    else if (visualContext === VisualContext.MOOD_ANGRY) mode = 'ANGRY';
    else if (visualContext === VisualContext.MOOD_SURPRISED) mode = 'SURPRISED';
    else if (visualContext === VisualContext.MOOD_CONFUSED) mode = 'CONFUSED';
    else if (visualContext === VisualContext.MOOD_EXCITED) mode = 'EXCITED';
    // Story
    else if (visualContext === VisualContext.STORY_BOOK) mode = 'BOOK';
    else if (visualContext === VisualContext.STORY_ROCKET) mode = 'ROCKET';
    else if (visualContext === VisualContext.STORY_GHOST) mode = 'GHOST';
    else if (visualContext === VisualContext.STORY_COFFEE) mode = 'COFFEE';
    else if (visualContext === VisualContext.STORY_SLEEP) mode = 'SLEEP';
    else if (visualContext === VisualContext.STORY_TRAVEL) mode = 'TRAVEL';
    else if (visualContext === VisualContext.STORY_IDEA) mode = 'IDEA';
    // Utility
    else if (visualContext === VisualContext.TIME) mode = 'CLOCK';
    else if (visualContext === VisualContext.HEART) mode = 'HEART';
    else if (visualContext === VisualContext.DNA) mode = 'DNA';
    else if (visualContext === VisualContext.SHIELD || visualContext === VisualContext.ALERT) mode = 'SHIELD';
    else if (visualContext === VisualContext.MUSIC) mode = 'MUSIC';

    // --- Clock Targets Prep ---
    let clockTargets: {x:number, y:number}[] = [];
    if (mode === 'CLOCK') {
        const h = date.getHours().toString().padStart(2,'0');
        const m = date.getMinutes().toString().padStart(2,'0');
        const timeStr = `${h}:${m}`;
        let cursorX = -2.5; 
        timeStr.split('').forEach((char) => {
             const grid = DIGITS[char] || DIGITS[':'];
             const charWidth = char === ':' ? 1.5 : 3;
             grid.forEach((bit, idx) => {
                 if (bit === 1) {
                     const col = idx % 4;
                     const row = Math.floor(idx / 4);
                     clockTargets.push({ x: cursorX + (col * 0.35), y: 1.0 - (row * 0.35) });
                 }
             });
             cursorX += (charWidth * 0.35) + 0.4;
        });
    }

    // --- Main Loop ---
    particles.forEach((p, i) => {
        let targetX = 0, targetY = 0, targetZ = 0;
        let targetScale = 0.05; 
        let lerpSpeed = 0.08;

        // ============================
        // === STORY & DAILY SCENES ===
        // ============================
        
        if (mode === 'COFFEE') {
            const cupHeight = 2.0; const cupRadius = 1.0;
            if (p.isSteam && i % 4 === 0) {
                 p.y += p.speed * 2;
                 if (p.y > 3) { p.y = 1; p.x = (Math.random()-0.5)*0.5; p.z = (Math.random()-0.5)*0.5; }
                 targetX = p.x + Math.sin(time*2 + p.y)*0.2; targetY = p.y; targetZ = p.z + Math.cos(time*1.5 + p.y)*0.2;
                 targetScale = 0.03;
            } else {
                 const angle = (i / COUNT) * Math.PI * 20; const h = ((i % 100) / 100) * cupHeight - (cupHeight/2); const r = cupRadius;
                 let isHandle = i % 10 > 8; 
                 if(isHandle && h > -0.2 && h < 0.6) { targetX = (r + 0.4 + Math.sin(h*5)*0.3) * Math.cos(0); targetZ = (r + 0.4 + Math.sin(h*5)*0.3) * Math.sin(0); } else { targetX = r * Math.cos(angle); targetZ = r * Math.sin(angle); }
                 targetY = h;
            }
        }
        else if (mode === 'SLEEP') {
            const angle = (i / COUNT) * Math.PI * 2; const r = 2.0; const x = r * Math.cos(angle); const y = r * Math.sin(angle);
            if (x > 0.5) { targetX = (Math.random() - 0.5) * 5; targetY = (Math.random() - 0.5) * 5; targetZ = -2; targetScale = 0.02; } 
            else { targetX = x; targetY = y; targetZ = 0; }
            if (i % 50 === 0) { targetX = 1.5 + Math.sin(time + i)*0.5; targetY = 1.0 + (time + i*0.1) % 2; targetZ = 0; if (i%3===0) targetX += 0.2; if (i%3===1) { targetX += 0.1; targetY -= 0.1; } }
        }
        else if (mode === 'TRAVEL') {
            const len = 4; const u = ((i / COUNT) * len) - (len/2); 
            if (i % 3 !== 0) { const r = 0.4 * (1 - Math.abs(u/len)); const angle = i; targetX = u; targetY = Math.sin(angle)*r; targetZ = Math.cos(angle)*r; } 
            else { const wingSpan = 3.0; const w = (Math.random() - 0.5) * wingSpan; targetX = 0 + (Math.random()-0.5); targetY = 0; targetZ = w; targetX += Math.abs(w) * 0.5; }
            targetX += Math.sin(time) * 0.5; targetY += Math.sin(time * 2) * 0.2;
            const bank = Math.sin(time) * 0.3; const oldY = targetY; targetY = targetY * Math.cos(bank) - targetZ * Math.sin(bank); targetZ = oldY * Math.sin(bank) + targetZ * Math.cos(bank);
        }
        else if (mode === 'IDEA') {
            const h = ((i/COUNT) * 4) - 2; let r = 0;
            if (h > -0.5) { r = Math.sqrt(Math.max(0, 1.5*1.5 - (h-1)*(h-1))); } else { r = 0.6; r += Math.sin(h * 20) * 0.05; }
            const angle = i * 0.5; targetX = r * Math.cos(angle); targetZ = r * Math.sin(angle); targetY = h;
            if (i % 20 === 0 && h > 0) { targetX *= 1.5; targetZ *= 1.5; targetY *= 1.5; }
        }
        else if (mode === 'BOOK') {
            const cols = 40; const rows = 35; const gridIdx = i % (cols * rows); const row = Math.floor(gridIdx / cols); const col = gridIdx % cols; const u = (col / cols) * 2 - 1; const v = (row / rows) * 2 - 1; const uAbs = Math.abs(u);
            targetX = u * 2.5; targetY = v * 1.5; targetZ = Math.pow(uAbs, 2) * 1.0; targetZ += Math.sin(time * 2) * uAbs * 0.5; targetScale = 0.04;
        }
        else if (mode === 'ROCKET') {
             const height = 4; const yPos = ((i / COUNT) * height) - (height / 2); let r = 0;
             if (yPos > 1.0) { r = (2.0 - yPos) * 0.5; } else if (yPos < -1.5) { r = 0.5 + Math.abs(Math.sin(p.phase * 3)) * (yPos < -1.5 ? 0.8 : 0); } else { r = 0.5; }
             const angle = p.phase; targetX = Math.cos(angle) * r; targetZ = Math.sin(angle) * r; targetY = yPos;
             if (i % 10 === 0) { targetY -= 2 + Math.random(); targetX *= 0.5; targetZ *= 0.5; targetScale = 0.03; }
             targetX += Math.random() * 0.05;
        }
        else if (mode === 'GHOST') {
             const angle = (i / COUNT) * Math.PI * 20; const yPos = ((i / COUNT) * 4) - 2; let r = 0;
             if (yPos > 1) { r = Math.sqrt(1 - Math.pow(yPos - 1.5, 2)) * 1.0; } else { r = 0.8 + Math.sin(yPos * 2 + time * 3) * 0.2; }
             const wave = Math.sin(yPos * 3 + time * 2) * 0.3;
             targetX = Math.cos(angle) * r + wave; targetZ = Math.sin(angle) * r; targetY = yPos + Math.sin(time) * 0.2; 
        }

        // ==========================
        // === EMOTIONAL STATES ===
        // ==========================
        else if (mode === 'ANGRY') {
            const r = 1.5 + Math.random() * 0.5 * Math.sin(time * 20); const phi = Math.acos(1 - 2 * (i + 0.5) / COUNT); const theta = Math.PI * (1 + Math.sqrt(5)) * i;
            targetX = r * Math.sin(phi) * Math.cos(theta); targetY = r * Math.sin(phi) * Math.sin(theta); targetZ = r * Math.cos(phi); lerpSpeed = 0.3; targetScale = 0.04;
        }
        else if (mode === 'SURPRISED') {
            const yPos = ((i / COUNT) * 5) - 2.5;
            if (yPos > -1) { const taper = Math.max(0, 1 - (yPos+1)*0.3); const angle = i; targetX = Math.cos(angle) * 0.3 * taper; targetZ = Math.sin(angle) * 0.3 * taper; targetY = yPos; } 
            else if (yPos < -1.5) { const angle = i; const r = Math.random() * 0.4; targetX = Math.cos(angle) * r; targetZ = Math.sin(angle) * r; targetY = yPos; } 
            else { targetX = (Math.random()-0.5)*5; targetY = (Math.random()-0.5)*5; targetScale = 0; }
            const pop = 1 + Math.sin(time * 10) * 0.1; targetScale *= pop;
        }
        else if (mode === 'CONFUSED') {
            const t = (i/COUNT) * Math.PI * 1.5; 
            if (i < COUNT * 0.7) { const r = 1.0 + Math.cos(t)*0.5; targetX = Math.cos(t * 2) * 1.5; targetY = Math.sin(t * 2) * 1.5 + 1; targetZ = 0; } 
            else { targetX = 0; targetY = -2 + (Math.random()*0.5); targetZ = 0; }
            const rot = Math.sin(time) * 0.2; const x = targetX * Math.cos(rot) - targetZ * Math.sin(rot); const z = targetX * Math.sin(rot) + targetZ * Math.cos(rot); targetX = x; targetZ = z;
        }
        else if (mode === 'EXCITED') {
            const r = 2.5; targetX = Math.sin(time * 5 + i) * r; targetY = Math.cos(time * 3 + i) * r; targetZ = Math.sin(time * 7 + i) * r; lerpSpeed = 0.2; targetScale = 0.08;
        }
        else if (mode === 'HAPPY') {
            const r = (i / COUNT) * 3; const theta = i * 0.1 + time * 2; const phi = i * 0.05;
            targetX = r * Math.sin(theta) * Math.cos(phi); targetY = r * Math.sin(theta) * Math.sin(phi); targetZ = r * Math.cos(theta);
            const pulse = 1 + Math.sin(time * 5) * 0.2; targetX *= pulse; targetY *= pulse; targetZ *= pulse; targetScale = 0.06;
        }
        else if (mode === 'SAD') {
            const r = 2.0; targetX = (Math.random() - 0.5) * r * 1.5; targetZ = (Math.random() - 0.5) * r; targetY = 1.5 + (Math.random() - 0.5) * 0.5;
            if (i % 3 === 0) { const fallSpeed = (p.speed * 5) + 1; let fallY = 1.5 - ((time * fallSpeed + p.phase) % 4); targetX = p.x; targetZ = p.z; targetY = fallY; targetScale = 0.03; }
        }

        // ==========================
        // === WEATHER PATTERNS ===
        // ==========================
        else if (mode === 'CLOUDY') {
            const cluster = i % 3; const cx = (cluster - 1) * 1.5; const r = 1.2; const theta = Math.random() * Math.PI * 2; const phi = Math.acos(2 * Math.random() - 1);
            targetX = cx + r * Math.sin(phi) * Math.cos(theta); targetY = r * Math.sin(phi) * Math.sin(theta); targetZ = r * Math.cos(phi);
            targetX += Math.sin(time * 0.5 + cluster) * 0.2;
        }
        else if (mode === 'SNOW') {
            p.y -= 0.02; if (p.y < -3) { p.y = 3; p.x = (Math.random()-0.5)*4; p.z = (Math.random()-0.5)*4; }
            targetX = p.x + Math.sin(time + p.y)*0.5; targetY = p.y; targetZ = p.z; targetScale = 0.03; 
        }
        else if (mode === 'THUNDER') {
            const r = 2.0; targetX = (Math.random() - 0.5) * 4; targetY = 1.5 + (Math.random() - 0.5); targetZ = (Math.random() - 0.5) * 2;
            if (Math.random() > 0.99) { targetScale = 0.5; targetY = (Math.random() - 0.5) * 4; } else { targetScale = 0.06; }
        }
        else if (mode === 'RAIN') {
            if (p.isRainDrop) { p.y -= (0.2 + p.speed * 4); if (p.y < -3) { p.y = 3; p.x = (Math.random() - 0.5) * 4; p.z = (Math.random() - 0.5) * 1.5; } targetX = p.x; targetY = p.y; targetZ = p.z; lerpSpeed = 1.0; targetScale = 0.03; } 
            else { targetX = Math.cos(p.phase) * 2.0 + Math.sin(time * 0.5 + i) * 0.3; targetY = 2.0 + Math.sin(p.phase) * 0.3; targetZ = Math.sin(p.phase) * 1.0; targetScale = 0.08; }
        }
        else if (mode === 'SUN') {
            const radius = 1.2; const phi = Math.acos(1 - 2 * (i + 0.5) / COUNT); const theta = Math.PI * (1 + Math.sqrt(5)) * i + time * 0.1;
            targetX = radius * Math.sin(phi) * Math.cos(theta); targetY = radius * Math.sin(phi) * Math.sin(theta); targetZ = radius * Math.cos(phi);
            if (i % 12 === 0) { const rayLen = 2.2 + Math.sin(time * 3 + p.phase) * 0.5; targetX *= (rayLen / radius); targetY *= (rayLen / radius); targetZ *= (rayLen / radius); } 
        }

        // ==========================
        // === UTILITY & DEFAULT ===
        // ==========================
        else if (mode === 'LISTENING') {
            const angle = (i / COUNT) * Math.PI * 4; const radius = 2.0 + Math.sin(angle * 4 + time * 5) * audioFactor * 1.0;
            targetX = Math.cos(angle) * radius; targetY = Math.sin(angle * 3 + time) * 0.5; targetZ = Math.sin(angle) * radius; targetScale = 0.04; lerpSpeed = 0.2;
        }
        else if (mode === 'THINKING') {
            const radius = 1.8; const speed = 4; const offset = i * 0.1;
            if (i % 3 === 0) { targetX = Math.cos(time * speed + offset) * radius; targetY = Math.sin(time * speed + offset) * radius; targetZ = Math.sin(time * speed * 0.5 + offset) * 0.5; }
            else if (i % 3 === 1) { targetX = Math.cos(time * speed + offset) * radius; targetZ = Math.sin(time * speed + offset) * radius; targetY = Math.sin(time * speed * 0.5 + offset) * 0.5; }
            else { targetY = Math.cos(time * speed + offset) * radius; targetZ = Math.sin(time * speed + offset) * radius; targetX = Math.sin(time * speed * 0.5 + offset) * 0.5; }
            targetScale = 0.03;
        }
        else if (mode === 'HEART') {
            const angle = (i / COUNT) * Math.PI * 2; const x = 16 * Math.pow(Math.sin(angle), 3); const y = 13 * Math.cos(angle) - 5 * Math.cos(2*angle) - 2 * Math.cos(3*angle) - Math.cos(4*angle);
            targetX = x * 0.08; targetY = y * 0.08 + 0.5; targetZ = Math.sin(angle * 10 + time) * 0.5; targetScale = 0.06;
        }
        else if (mode === 'DNA') {
            const height = 4; const turns = 2; const yPos = ((i / COUNT) * height) - (height / 2); const angle = (yPos * turns) + time; const radius = 1.0; const isStrand2 = i % 2 === 0; const finalAngle = angle + (isStrand2 ? Math.PI : 0);
            targetX = Math.cos(finalAngle) * radius; targetZ = Math.sin(finalAngle) * radius; targetY = yPos; targetScale = 0.04;
        }
        else if (mode === 'MUSIC') {
             const x = ((i / COUNT) * 6) - 3; const wave = Math.sin(x * 2 + time * 3) * (0.5 + audioFactor);
             targetX = x; targetY = wave; targetZ = Math.cos(x * 3 + time) * 0.5; targetScale = 0.03 + Math.abs(wave) * 0.1;
        }
        else if (mode === 'SHIELD') {
             const radius = 2.0; const phi = Math.acos(1 - 2 * (i + 0.5) / COUNT); const theta = Math.PI * (1 + Math.sqrt(5)) * i;
             targetX = radius * Math.sin(phi) * Math.cos(theta); targetY = radius * Math.sin(phi) * Math.sin(theta); targetZ = (radius * Math.cos(phi)) * 0.2; 
        }
        else if (mode === 'CLOCK') {
            if (i < clockTargets.length) { targetX = clockTargets[i].x; targetY = clockTargets[i].y; targetZ = Math.sin(time * 2 + p.phase) * 0.1; } 
            else { const angle = time + (i * 0.1); targetX = Math.cos(angle) * 3; targetY = Math.sin(angle) * 0.2; targetZ = Math.sin(angle) * 3; targetScale = 0.02; }
        } 
        else {
            // === DEFAULT SPHERE ===
            const radius = 1.5; const phi = Math.acos(1 - 2 * (i + 0.5) / COUNT); const theta = Math.PI * (1 + Math.sqrt(5)) * i;
            const noise = Math.sin(phi * 5 + time) * Math.cos(theta * 5 + time) * 0.3; const breath = 1 + Math.sin(time * 0.8) * 0.05; 
            const r = (radius + noise) * breath;
            targetX = r * Math.sin(phi) * Math.cos(theta); targetY = r * Math.sin(phi) * Math.sin(theta); targetZ = r * Math.cos(phi);
            const rotSpeed = 0.2; const x = targetX * Math.cos(time*rotSpeed) - targetZ * Math.sin(time*rotSpeed); const z = targetX * Math.sin(time*rotSpeed) + targetZ * Math.cos(time*rotSpeed);
            targetX = x; targetZ = z;
        }

        // Speaking/Audio React overrides
        if (state === AvatarState.SPEAKING) {
            if (mode === 'SPHERE' || mode === 'THINKING' || mode === 'HAPPY' || mode === 'IDEA' || mode === 'COFFEE') {
                const expansion = 1 + (audioFactor * 0.3);
                targetX *= expansion; targetY *= expansion; targetZ *= expansion;
            } else {
                targetX += (Math.random()-0.5) * audioFactor * 0.2;
                targetY += (Math.random()-0.5) * audioFactor * 0.2;
                targetZ += (Math.random()-0.5) * audioFactor * 0.2;
            }
        }

        p.x = THREE.MathUtils.lerp(p.x, targetX, lerpSpeed);
        p.y = THREE.MathUtils.lerp(p.y, targetY, lerpSpeed);
        p.z = THREE.MathUtils.lerp(p.z, targetZ, lerpSpeed);
        p.scale = THREE.MathUtils.lerp(p.scale, targetScale, 0.1);

        tempObject.position.set(p.x, p.y, p.z);
        if (mode === 'RAIN' && p.isRainDrop) { tempObject.rotation.set(0, 0, 0); tempObject.scale.set(0.01, 0.2, 0.01); } 
        else if (mode === 'SNOW') { tempObject.rotation.set(time, time, 0); }
        else { tempObject.rotation.set(time + p.phase, time, 0); tempObject.scale.set(p.scale, p.scale, p.scale); }
        
        tempObject.updateMatrix();
        meshRef.current.setMatrixAt(i, tempObject.matrix);

        // --- Color Update ---
        let c = new THREE.Color(primaryColor);
        
        // Multi-Color Logic
        if (mode === 'HEART') {
            // Heart is Red/Pink gradient
            const hue = 0.9 + (i/COUNT) * 0.15; // 0.9 is magenta-ish/red, goes to red-orange
            c.setHSL(hue % 1, 0.9, 0.5); 
        }
        else if (mode === 'ROCKET') {
             const yPos = ((i / COUNT) * 4) - 2;
             if (i % 10 === 0) c.set(Math.random() > 0.5 ? '#f97316' : '#fbbf24'); // Exhaust Fire
             else if (yPos > 1.2) c.set('#ef4444'); // Red Nose
             else if (yPos < -1.4) c.set('#ef4444'); // Red Fins
             else c.set('#f1f5f9'); // Body
             if (yPos > 0.2 && yPos < 0.6 && Math.cos(p.phase) > 0.5) c.set('#0ea5e9'); // Blue Window
        }
        else if (mode === 'COFFEE') {
             if (p.isSteam) c.set('#cbd5e1'); // Steam
             else if (i % 100 > 80 && ((i % 100)/100)*2 -1 > 0.5) c.set('#3f1d0b'); // Liquid near top
             else c.set(i % 5 === 0 ? '#78350f' : '#ffffff'); // Brown/White Cup mix
        }
        else if (mode === 'EXCITED') {
             c.setHSL((i / COUNT + time) % 1, 1, 0.6); // Rainbow
        }
        else if (mode === 'CONFUSED') {
             c.set(i % 2 === 0 ? '#c084fc' : '#60a5fa'); // Purple/Blue mix
        }
        else if (mode === 'DNA') {
             c.set(i % 2 === 0 ? '#8b5cf6' : '#06b6d4'); // Purple/Cyan strands
        }
        else if (mode === 'RAIN') {
             c.set(p.isRainDrop ? '#3b82f6' : '#cbd5e1'); // Blue drops, grey cloud
        }
        else if (mode === 'THUNDER') {
             c.set(Math.random() > 0.95 ? '#facc15' : '#475569'); // Flash Yellow/Grey
        }
        else if (mode === 'HAPPY') {
             c.setHSL(0.1 + (i/COUNT)*0.15, 1, 0.6); // Gold/Orange Gradient
        }
        else if (mode === 'IDEA') {
             const h = ((i/COUNT) * 4) - 2;
             if (h < -0.5) c.set('#94a3b8'); // Grey base
             else c.set(i % 2 === 0 ? '#facc15' : '#fef08a'); // Yellow Bulb
        }
        // Fallbacks for single color modes or defaults
        else if (mode === 'SLEEP') c.set('#818cf8'); 
        else if (mode === 'TRAVEL') c.set('#38bdf8');
        else if (mode === 'BOOK') c.set(i % 2 === 0 ? '#e2e8f0' : '#cbd5e1');
        else if (mode === 'GHOST') c.set('#a5f3fc');
        else if (mode === 'CLOUDY') c.set('#f1f5f9'); // White/Light Grey Clouds
        else if (mode === 'SNOW') c.set('#f1f5f9');
        else if (mode === 'SUN') c.set(i % 10 === 0 ? '#f59e0b' : '#fbbf24');
        else if (mode === 'ANGRY') c.set(Math.random() > 0.5 ? '#ef4444' : '#b91c1c');
        else if (mode === 'SURPRISED') c.set('#f472b6');
        else if (mode === 'SAD') c.set('#475569');
        else if (mode === 'ALERT') c.set('#ef4444');
        else if (mode === 'CLOCK') c.set('#60a5fa');
        else if (mode === 'MUSIC') c.setHSL((i / COUNT), 0.7, 0.6); 
        else if (mode === 'SHIELD') c.set('#10b981'); 
        else if (mode === 'THINKING') c.set('#fbbf24');
        else if (mode === 'LISTENING') c.set('#22d3ee'); 

        if (state === AvatarState.SPEAKING && audioFactor > 0.6 && i % 4 === 0) {
             c.lerp(new THREE.Color('#ffffff'), 0.8);
        }

        meshRef.current.setColorAt(i, c);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;

    // Global Rotations
    if (mode === 'ROCKET' || mode === 'GHOST' || mode === 'BOOK' || mode === 'COFFEE' || mode === 'TRAVEL') {
        meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, time * 0.2, 0.05); 
    } else if (mode === 'SPHERE' || mode === 'HAPPY' || mode === 'CLOUDY') {
        meshRef.current.rotation.y -= delta * 0.1;
    } else {
        meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, 0, 0.1);
    }
  });

  return (
    <group>
        <instancedMesh ref={meshRef} args={[undefined, undefined, COUNT]} renderOrder={1}>
          <boxGeometry args={[1, 1, 1]} /> 
          <meshPhysicalMaterial 
            color="#ffffff" 
            emissive={primaryColor} 
            emissiveIntensity={2} 
            roughness={0.4}         
            metalness={0.8}
            transmission={0.2}      
            thickness={0.5}         
            clearcoat={1}
            clearcoatRoughness={0.1}
            transparent={false} 
            toneMapped={false}
          />
        </instancedMesh>
    </group>
  );
};

const VoiceAvatar: React.FC<VoiceAvatarProps> = ({ 
  state, 
  visualContext = VisualContext.DEFAULT, 
  audioLevel, 
  primaryColor = '#ffffff',
  visible = true 
}) => {
  return (
    <div className={`w-full h-full transition-opacity duration-1000 ${visible ? 'opacity-100' : 'opacity-0'}`}>
        <Canvas camera={{ position: [0, 0, 11], fov: 30 }} gl={{ antialias: true, alpha: true }} dpr={[1, 2]}>
            <ambientLight intensity={0.1} />
            <pointLight position={[10, 10, 10]} intensity={0.5} color={primaryColor} />
            <pointLight position={[-10, -10, -10]} intensity={0.2} color="#ffffff" />
            
            <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5} floatingRange={[-0.2, 0.2]}>
                 <VoxelCloud 
                    state={state} 
                    visualContext={visualContext} 
                    audioLevel={audioLevel} 
                    primaryColor={primaryColor} 
                 />
            </Float>
            
            <Stars radius={80} depth={50} count={2000} factor={3} saturation={0} fade speed={0.5} />
        </Canvas>
    </div>
  );
};

export default React.memo(VoiceAvatar);