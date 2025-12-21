import React, { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { AvatarState, VisualContext, ShapeFunction } from '../types';
import { Users, ChevronDown, Brain } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface VoiceAvatarProps {
  state: AvatarState;
  visualContext?: VisualContext;
  audioLevel: number; 
  compact?: boolean;
  primaryColor?: string;
  visible?: boolean;
  customShapeFn?: ShapeFunction; 
  onPersonaChange?: (personaId: string) => void;
}

const COUNT = 300; 
const _tempColor = new THREE.Color();
const _tempObject = new THREE.Object3D();

const VoxelCloud = ({ state, visualContext, audioLevel, primaryColor, customShapeFn }: VoiceAvatarProps) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const particles = useMemo(() => new Array(COUNT).fill(0).map(() => ({ x: (Math.random()-0.5)*4, y: (Math.random()-0.5)*4, z: (Math.random()-0.5)*4, speed: Math.random()*0.05+0.02, phase: Math.random()*Math.PI*2 })), []);

  useFrame((stateContext) => {
    if (!meshRef.current) return;
    const time = stateContext.clock.getElapsedTime();
    const audioFactor = Math.max(0, audioLevel / 50); 
    
    particles.forEach((p, i) => {
        let tx = 0, ty = 0, tz = 0, ts = 0.05;
        let c = primaryColor || '#22d3ee';
        
        // Sphere (Default)
        const phi = Math.acos(1 - 2 * (i+0.5)/COUNT); const theta = Math.PI * (1 + Math.sqrt(5)) * i;
        const r = 1.5 + Math.sin(time + i)*0.1;
        tx = r * Math.sin(phi) * Math.cos(theta); ty = r * Math.sin(phi) * Math.sin(theta); tz = r * Math.cos(phi);
        if(state===AvatarState.SPEAKING) { const audioBump = 1 + (audioFactor * 0.2); tx *= audioBump; ty *= audioBump; tz *= audioBump; }

        p.x += (tx - p.x) * 0.1; p.y += (ty - p.y) * 0.1; p.z += (tz - p.z) * 0.1;
        _tempObject.position.set(p.x, p.y, p.z);
        _tempObject.rotation.set(time+p.phase, time, 0); _tempObject.scale.setScalar(ts);
        _tempObject.updateMatrix();
        meshRef.current?.setMatrixAt(i, _tempObject.matrix);
        _tempColor.set(c);
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

const VoiceAvatar = React.memo((props: VoiceAvatarProps) => {
  const [personas, setPersonas] = useState<any[]>([]);
  const [activePersona, setActivePersona] = useState<any>(null);
  const [showSelector, setShowSelector] = useState(false);

  useEffect(() => {
      fetch(`${API_URL}/api/personas`)
        .then(r => r.json())
        .then(data => {
            setPersonas(data);
            if (data.length > 0) setActivePersona(data[0]); 
        })
        .catch(console.error);
  }, []);

  const handlePersonaSelect = (persona: any) => {
      setActivePersona(persona);
      setShowSelector(false);
      if (props.onPersonaChange) props.onPersonaChange(persona.id);
  };

  if (props.visible === false) return null;

  return (
    <div className={`relative w-full h-full transition-opacity duration-500`}>
      {!props.compact && (
          <div className="absolute top-4 left-4 z-50">
              <button onClick={() => setShowSelector(!showSelector)} className="flex items-center gap-2 px-3 py-2 bg-black/40 backdrop-blur-md border border-white/10 rounded-lg hover:bg-white/10 transition-all group">
                  <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: activePersona?.color || '#22d3ee' }} />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">{activePersona ? activePersona.name : "SYSTEM OFFLINE"}</span>
                  <ChevronDown size={14} className={`text-zinc-400 transition-transform ${showSelector ? 'rotate-180' : ''}`} />
              </button>
              {showSelector && (
                  <div className="absolute top-12 left-0 w-48 bg-[#09090b]/90 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden p-1 space-y-1 animate-in fade-in slide-in-from-top-2">
                      <div className="px-3 py-2 text-[9px] font-bold text-zinc-500 uppercase tracking-widest border-b border-white/5 mb-1">Select Neural Link</div>
                      {personas.map(p => (
                          <button key={p.id} onClick={() => handlePersonaSelect(p)} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all ${activePersona?.id === p.id ? 'bg-white/10 text-white' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}>
                              <div className="w-6 h-6 rounded-full flex items-center justify-center border border-white/10 bg-black"><span className="text-[10px] font-bold" style={{ color: p.color }}>{p.name[0]}</span></div>
                              <span className="text-xs font-medium">{p.name}</span>
                          </button>
                      ))}
                  </div>
              )}
          </div>
      )}
      <Canvas camera={{ position: [0, 0, props.compact ? 14 : 11], fov: 30 }} dpr={[1, 1]} gl={{ powerPreference: "default" }}>
          <ambientLight intensity={0.2} />
          <pointLight position={[10, 10, 10]} intensity={1} color={activePersona?.color || props.primaryColor || '#22d3ee'} />
          {!props.compact && <Stars radius={100} depth={50} count={2000} factor={4} saturation={0} fade speed={1} />}
          <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
               <VoxelCloud {...props} primaryColor={activePersona?.color || props.primaryColor} />
          </Float>
      </Canvas>
    </div>
  );
});

export { VoiceAvatar };
export default VoiceAvatar;