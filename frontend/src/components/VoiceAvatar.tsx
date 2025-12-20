import React, { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { AvatarState, VisualContext, ShapeFunction } from '../types';
import { Users, ChevronDown, Brain } from 'lucide-react';

// --- CONFIG ---
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface VoiceAvatarProps {
  state: AvatarState;
  visualContext?: VisualContext;
  audioLevel: number; 
  compact?: boolean;
  primaryColor?: string; // Fallback color
  visible?: boolean;
  customShapeFn?: ShapeFunction; 
  // NEW: Callback to tell the parent (Dashboard) who we are talking to
  onPersonaChange?: (personaId: string) => void;
}

const COUNT = 800; 
const _tempColor = new THREE.Color();
const _tempObject = new THREE.Object3D();

// --- DIGITS MAP (Unchanged) ---
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

// --- VOXEL CLOUD COMPONENT ---
const VoxelCloud = ({ state, visualContext, audioLevel, primaryColor, customShapeFn }: VoiceAvatarProps) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  
  const particles = useMemo(() => {
    return new Array(COUNT).fill(0).map(() => ({
      x: (Math.random()-0.5)*4, y: (Math.random()-0.5)*4, z: (Math.random()-0.5)*4,
      speed: Math.random()*0.05+0.02, phase: Math.random()*Math.PI*2, scale: 1,
      isRainDrop: Math.random() > 0.4, isSteam: Math.random() > 0.7
    }));
  }, []);

  useFrame((stateContext) => {
    if (!meshRef.current) return;
    const time = stateContext.clock.getElapsedTime();
    const audioFactor = Math.max(0, audioLevel / 50); 
    const date = new Date();

    let mode = 'SPHERE';
    if (customShapeFn) mode = 'CUSTOM';
    else if (state === AvatarState.THINKING) mode = 'THINKING';
    else if (state === AvatarState.LISTENING) mode = 'LISTENING';
    else if (visualContext === VisualContext.WEATHER_RAIN) mode = 'RAIN';
    else if (visualContext === VisualContext.WEATHER_SNOW) mode = 'SNOW';
    else if (visualContext === VisualContext.DNA) mode = 'DNA';
    else if (visualContext === VisualContext.HEART) mode = 'HEART';
    else if (visualContext === VisualContext.MOOD_HAPPY) mode = 'HAPPY';
    else if (visualContext === VisualContext.TIME) mode = 'CLOCK';
    else if (visualContext === VisualContext.STORY_ROCKET) mode = 'ROCKET';
    else if (visualContext === VisualContext.STORY_COFFEE) mode = 'COFFEE';

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

    particles.forEach((p, i) => {
        let tx = 0, ty = 0, tz = 0, ts = 0.05, lerpSpeed = 0.1;
        let c = primaryColor || '#22d3ee';

        if (mode === 'COFFEE') {
             const cupH = 2.0; const cupR = 1.0;
             if (p.isSteam && i % 4 === 0) {
                 p.y += p.speed * 2;
                 if (p.y > 3) { p.y = 1; p.x = (Math.random()-0.5)*0.5; p.z = (Math.random()-0.5)*0.5; }
                 tx = p.x + Math.sin(time*2 + p.y)*0.2; ty = p.y; tz = p.z + Math.cos(time*1.5 + p.y)*0.2; ts = 0.03; c = '#cbd5e1'; 
             } else {
                 const angle = (i/COUNT)*Math.PI*20; const h = ((i%100)/100)*cupH - (cupH/2); const r = cupR;
                 let isHandle = i % 10 > 8; 
                 if(isHandle && h > -0.2 && h < 0.6) { tx = (r+0.4+Math.sin(h*5)*0.3)*Math.cos(0); tz = (r+0.4+Math.sin(h*5)*0.3)*Math.sin(0); } 
                 else { tx = r*Math.cos(angle); tz = r*Math.sin(angle); }
                 ty = h; c = (i%5===0) ? '#78350f' : '#ffffff'; 
             }
        }
        else if (mode === 'DNA') {
             const h = 4; const turns = 2; const yPos = ((i/COUNT)*h)-(h/2); 
             const angle = (yPos*turns)+time; const r = 1.0; 
             const isStrand2 = i%2===0; const finalAngle = angle + (isStrand2 ? Math.PI : 0);
             tx = Math.cos(finalAngle)*r; tz = Math.sin(finalAngle)*r; ty = yPos; ts = 0.04; c = isStrand2 ? '#8b5cf6' : '#06b6d4';
        }
        else if (mode === 'RAIN') {
             if (p.isRainDrop) { p.y -= (0.2+p.speed*4); if(p.y < -3) { p.y=3; p.x=(Math.random()-0.5)*4; p.z=(Math.random()-0.5)*1.5; } tx=p.x; ty=p.y; tz=p.z; lerpSpeed=1.0; ts=0.03; c='#2563eb'; } 
             else { tx = Math.cos(p.phase)*2.0+Math.sin(time*0.5+i)*0.3; ty = 2.0+Math.sin(p.phase)*0.3; tz = Math.sin(p.phase)*1.0; ts=0.08; c='#f8fafc'; }
        }
        else if (mode === 'HEART') {
             const angle = (i/COUNT)*Math.PI*2; 
             const x = 16 * Math.pow(Math.sin(angle), 3); 
             const y = 13 * Math.cos(angle) - 5 * Math.cos(2*angle) - 2 * Math.cos(3*angle) - Math.cos(4*angle);
             tx = x*0.08; ty = y*0.08 + 0.5; tz = Math.sin(angle*10+time)*0.5; ts=0.06; c = '#ff0000'; 
        }
        else if (mode === 'THINKING') {
            const r = 1.8; const speed = 4; const offset = i * 0.1;
            if (i%3===0) { tx=Math.cos(time*speed+offset)*r; ty=Math.sin(time*speed+offset)*r; tz=Math.sin(time*speed*0.5+offset)*0.5; }
            else if (i%3===1) { tx=Math.cos(time*speed+offset)*r; tz=Math.sin(time*speed+offset)*r; ty=Math.sin(time*speed*0.5+offset)*0.5; }
            else { ty=Math.cos(time*speed+offset)*r; tz=Math.sin(time*speed+offset)*r; tx=Math.sin(time*speed*0.5+offset)*0.5; }
            ts=0.03; c='#fbbf24';
        }
        else if (mode === 'ROCKET') {
             const h = 4; const yPos = ((i/COUNT)*h)-(h/2); let r = 0;
             if(yPos > 1.0) r = (2.0-yPos)*0.5; else if(yPos < -1.5) r = 0.5+Math.abs(Math.sin(p.phase*3))*(yPos<-1.5?0.8:0); else r = 0.5;
             tx = Math.cos(p.phase)*r; tz = Math.sin(p.phase)*r; ty = yPos;
             if(i%10===0) { ty -= 2+Math.random(); tx *= 0.5; tz *= 0.5; ts = 0.03; c = Math.random()>0.5 ? '#f97316' : '#fbbf24'; } 
             else if(yPos>1.2 || yPos<-1.4) c = '#ef4444'; else c = '#f1f5f9'; 
        }
        else if (mode === 'SNOW') {
             p.y -= 0.02; if (p.y < -3) { p.y = 3; p.x = (Math.random()-0.5)*4; p.z = (Math.random()-0.5)*4; }
             tx = p.x + Math.sin(time + p.y)*0.5; ty = p.y; tz = p.z; ts = 0.03; c='#f1f5f9';
        }
        else if (mode === 'CLOCK') {
            if (i < clockTargets.length) { tx = clockTargets[i].x; ty = clockTargets[i].y; tz = Math.sin(time * 2 + p.phase) * 0.1; c='#60a5fa'; } 
            else { const angle = time + (i * 0.1); tx = Math.cos(angle) * 3; ty = Math.sin(angle) * 0.2; tz = Math.sin(angle) * 3; ts = 0.02; c='#1e293b'; }
        }
        else {
             // Sphere (Default)
             const phi = Math.acos(1 - 2 * (i+0.5)/COUNT); const theta = Math.PI * (1 + Math.sqrt(5)) * i;
             const r = 1.5 + Math.sin(time + i)*0.1;
             tx = r * Math.sin(phi) * Math.cos(theta); ty = r * Math.sin(phi) * Math.sin(theta); tz = r * Math.cos(phi);
             if(state===AvatarState.SPEAKING) { const audioBump = 1 + (audioFactor * 0.2); tx *= audioBump; ty *= audioBump; tz *= audioBump; }
             if(mode === 'HAPPY') { const hue = 0.1 + (i/COUNT)*0.15; _tempColor.setHSL(hue, 1, 0.6); c = '#ffaa00'; }
        }

        p.x += (tx - p.x) * lerpSpeed; p.y += (ty - p.y) * lerpSpeed; p.z += (tz - p.z) * lerpSpeed;
        _tempObject.position.set(p.x, p.y, p.z);
        if(mode === 'RAIN' && p.isRainDrop) { _tempObject.rotation.set(0,0,0); _tempObject.scale.set(0.01,0.2,0.01); }
        else { _tempObject.rotation.set(time+p.phase, time, 0); _tempObject.scale.setScalar(ts); }
        _tempObject.updateMatrix();
        meshRef.current?.setMatrixAt(i, _tempObject.matrix);
        if (mode === 'HEART' || mode === 'HAPPY') { /* HSL set above */ } else { _tempColor.set(c); }
        meshRef.current?.setColorAt(i, _tempColor);
    });

    if (meshRef.current) {
        meshRef.current.instanceMatrix.needsUpdate = true;
        if(meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
    }
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, COUNT]}>
      <boxGeometry args={[1, 1, 1]} /> 
      <meshPhysicalMaterial color="#ffffff" emissive={primaryColor || "#22d3ee"} emissiveIntensity={2} />
    </instancedMesh>
  );
};

// --- WRAPPER WITH PERSONA SWITCHER ---
const VoiceAvatar = React.memo((props: VoiceAvatarProps) => {
  const [personas, setPersonas] = useState<any[]>([]);
  const [activePersona, setActivePersona] = useState<any>(null);
  const [showSelector, setShowSelector] = useState(false);

  // Fetch available personas on mount
  useEffect(() => {
      fetch(`${API_URL}/api/personas`)
        .then(r => r.json())
        .then(data => {
            setPersonas(data);
            if (data.length > 0) setActivePersona(data[0]); // Default to first
        })
        .catch(console.error);
  }, []);

  const handlePersonaSelect = (persona: any) => {
      setActivePersona(persona);
      setShowSelector(false);
      // Notify Parent (Dashboard) to update Chat Backend context
      if (props.onPersonaChange) {
          props.onPersonaChange(persona.id);
      }
  };

  if (props.visible === false) return null;

  return (
    <div className={`relative w-full h-full transition-opacity duration-500`}>
      
      {/* PERSONA SELECTOR OVERLAY */}
      {!props.compact && (
          <div className="absolute top-4 left-4 z-50">
              <button 
                onClick={() => setShowSelector(!showSelector)}
                className="flex items-center gap-2 px-3 py-2 bg-black/40 backdrop-blur-md border border-white/10 rounded-lg hover:bg-white/10 transition-all group"
              >
                  <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: activePersona?.color || '#22d3ee' }} />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                      {activePersona ? activePersona.name : "SYSTEM OFFLINE"}
                  </span>
                  <ChevronDown size={14} className={`text-zinc-400 transition-transform ${showSelector ? 'rotate-180' : ''}`} />
              </button>

              {showSelector && (
                  <div className="absolute top-12 left-0 w-48 bg-[#09090b]/90 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden p-1 space-y-1 animate-in fade-in slide-in-from-top-2">
                      <div className="px-3 py-2 text-[9px] font-bold text-zinc-500 uppercase tracking-widest border-b border-white/5 mb-1">
                          Select Neural Link
                      </div>
                      {personas.map(p => (
                          <button
                            key={p.id}
                            onClick={() => handlePersonaSelect(p)}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all ${activePersona?.id === p.id ? 'bg-white/10 text-white' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
                          >
                              <div className="w-6 h-6 rounded-full flex items-center justify-center border border-white/10 bg-black">
                                  <span className="text-[10px] font-bold" style={{ color: p.color }}>{p.name[0]}</span>
                              </div>
                              <span className="text-xs font-medium">{p.name}</span>
                          </button>
                      ))}
                  </div>
              )}
          </div>
      )}

      <Canvas 
        camera={{ position: [0, 0, props.compact ? 14 : 11], fov: 30 }} 
        dpr={[1, 1]} 
        gl={{ powerPreference: "default" }}
      >
          <ambientLight intensity={0.2} />
          {/* Dynamic Light Color based on Persona */}
          <pointLight position={[10, 10, 10]} intensity={1} color={activePersona?.color || props.primaryColor || '#22d3ee'} />
          {!props.compact && <Stars radius={100} depth={50} count={2000} factor={4} saturation={0} fade speed={1} />}
          <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
               <VoxelCloud 
                    {...props} 
                    // Override primary color with Persona color
                    primaryColor={activePersona?.color || props.primaryColor} 
               />
          </Float>
      </Canvas>
    </div>
  );
});

export { VoiceAvatar };
export default VoiceAvatar;