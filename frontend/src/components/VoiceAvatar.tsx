import React, { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { AvatarState, VisualContext, ShapeFunction } from '../types';
import { ChevronDown } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { ANIMATION_REGISTRY, animateIdle } from './avatarAnimations'; // Import Registry

interface VoiceAvatarProps {
  state?: AvatarState; 
  visualContext?: VisualContext;
  audioLevel?: number; 
  compact?: boolean;
  visible?: boolean;
  primaryColor?: string; 
  customShapeFn?: ShapeFunction; 
}

const COUNT = 350; // Increased particle count for better visuals
const _tempColor = new THREE.Color();
const _tempObject = new THREE.Object3D();

const VoxelCloud = ({ state, audioLevel, primaryColor }: { state: AvatarState, audioLevel: number, primaryColor: string }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  
  // Static random phase for each particle
  const particleData = useMemo(() => new Array(COUNT).fill(0).map((_, i) => ({ 
      phase: Math.random() * Math.PI * 2,
      speed: 0.02 + Math.random() * 0.05
  })), []);

  // Initialize particles at origin
  const particles = useRef(new Array(COUNT).fill(0).map(() => ({ x: 0, y: 0, z: 0 })));

  useFrame((stateContext) => {
    if (!meshRef.current) return;
    const time = stateContext.clock.getElapsedTime();
    const audioFactor = Math.max(0, audioLevel / 50); 
    
    // 1. SELECT ANIMATION FUNCTION
    // Get the math function from registry based on current state
    const animationFn = ANIMATION_REGISTRY[state] || animateIdle;

    particleData.forEach((data, i) => {
        // 2. CALCULATE TARGET POSITION
        // We delegate the math to the imported function
        const target = animationFn(i, COUNT, time, audioFactor);
        
        let { x: tx, y: ty, z: tz } = target;
        let c = target.color || primaryColor;

        // 3. INTERPOLATION (LERP)
        // Smoothly move current particle position towards target position
        // "0.1" is the smoothing factor (lower = smoother/slower)
        const p = particles.current[i];
        p.x += (tx - p.x) * 0.1;
        p.y += (ty - p.y) * 0.1;
        p.z += (tz - p.z) * 0.1;

        // 4. UPDATE THREE.JS OBJECT
        _tempObject.position.set(p.x, p.y, p.z);
        
        // Rotation adds extra life (slow spin for individual cubes)
        _tempObject.rotation.set(time + data.phase, time, 0); 
        
        // Dynamic scaling (Audio beat effect)
        const scale = 0.05 + (audioFactor * 0.02);
        _tempObject.scale.setScalar(scale);
        
        _tempObject.updateMatrix();
        meshRef.current?.setMatrixAt(i, _tempObject.matrix);
        
        // 5. UPDATE COLOR
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
      <meshPhysicalMaterial 
        color="#ffffff" 
        emissive={primaryColor} // Base glow
        emissiveIntensity={1.5} 
        roughness={0.2}
        metalness={0.8}
        toneMapped={false}
      />
    </instancedMesh>
  );
};

const VoiceAvatar = React.memo((props: VoiceAvatarProps) => {
  const { state: appState, actions } = useAppContext();
  const { agents, activeAgentId, avatarState, audioLevel } = appState;
  const [showSelector, setShowSelector] = useState(false);

  const activePersona = agents.find(a => a.id === activeAgentId) || agents[0];
  
  const currentState = props.state || avatarState;
  const currentAudio = props.audioLevel !== undefined ? props.audioLevel : audioLevel;
  const currentColor = activePersona?.primaryColor || props.primaryColor || '#22d3ee';

  const handlePersonaSelect = (agentId: string) => {
      actions.setActiveAgent(agentId);
      setShowSelector(false);
  };

  if (props.visible === false) return null;

  return (
    <div className={`relative w-full h-full transition-opacity duration-500`}>
      {!props.compact && (
          <div className="absolute top-4 left-4 z-50">
              <button onClick={() => setShowSelector(!showSelector)} className="flex items-center gap-2 px-3 py-2 bg-black/40 backdrop-blur-md border border-white/10 rounded-lg hover:bg-white/10 transition-all group">
                  <div className={`w-2 h-2 rounded-full ${currentState === AvatarState.THINKING ? 'animate-ping' : 'animate-pulse'}`} style={{ backgroundColor: currentState === AvatarState.THINKING ? '#fbbf24' : currentColor }} />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    {activePersona ? activePersona.name : "SYSTEM OFFLINE"}
                  </span>
                  <ChevronDown size={14} className={`text-zinc-400 transition-transform ${showSelector ? 'rotate-180' : ''}`} />
              </button>
              {showSelector && (
                  <div className="absolute top-12 left-0 w-48 bg-[#09090b]/90 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden p-1 space-y-1 animate-in fade-in slide-in-from-top-2 z-50">
                      {agents.map(p => (
                          <button key={p.id} onClick={() => handlePersonaSelect(p.id)} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all ${activePersona?.id === p.id ? 'bg-white/10 text-white' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}>
                              <div className="w-6 h-6 rounded-full flex items-center justify-center border border-white/10 bg-black"><span className="text-[10px] font-bold" style={{ color: p.primaryColor }}>{p.name[0]}</span></div>
                              <span className="text-xs font-medium">{p.name}</span>
                          </button>
                      ))}
                  </div>
              )}
          </div>
      )}
      
      <Canvas camera={{ position: [0, 0, props.compact ? 14 : 11], fov: 30 }} dpr={[1, 1.5]} gl={{ powerPreference: "high-performance", alpha: true }}>
          <ambientLight intensity={0.2} />
          <pointLight 
            position={[10, 10, 10]} 
            intensity={1} 
            color={currentState === AvatarState.THINKING ? '#fbbf24' : currentColor} 
          />
          <pointLight position={[-10, -10, -10]} intensity={0.5} color="blue" />
          
          {!props.compact && <Stars radius={100} depth={50} count={1000} factor={4} saturation={0} fade speed={1} />}
          
          <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
               <VoxelCloud 
                  state={currentState} 
                  audioLevel={currentAudio} 
                  primaryColor={currentColor} 
               />
          </Float>
      </Canvas>
    </div>
  );
});

export { VoiceAvatar };
export default VoiceAvatar;