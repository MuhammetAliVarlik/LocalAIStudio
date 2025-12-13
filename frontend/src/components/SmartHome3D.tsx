import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, PerspectiveCamera } from '@react-three/drei';
import { Lightbulb, Thermometer, Lock, Zap, Fan, Power, Sun } from 'lucide-react';
import * as THREE from 'three';

const Room = () => {
    return (
        <group>
            {/* Floor */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]}>
                <planeGeometry args={[10, 10]} />
                <meshStandardMaterial color="#1a1a1a" roughness={0.5} metalness={0.5} />
            </mesh>
            {/* Back Wall */}
            <mesh position={[0, 0.5, -5]}>
                <boxGeometry args={[10, 5, 0.2]} />
                <meshStandardMaterial color="#27272a" />
            </mesh>
            {/* Left Wall */}
            <mesh position={[-5, 0.5, 0]} rotation={[0, Math.PI / 2, 0]}>
                <boxGeometry args={[10, 5, 0.2]} />
                <meshStandardMaterial color="#27272a" />
            </mesh>
            {/* Platform / Bed */}
            <mesh position={[2, -1.5, -3]}>
                <boxGeometry args={[3, 1, 4]} />
                <meshStandardMaterial color="#3f3f46" />
            </mesh>
        </group>
    );
};

const Hotspot = ({ position, icon: Icon, label, isActive, onClick, color = 'bg-white' }: any) => {
    return (
        <Html position={position} center>
            <div 
                onClick={onClick}
                className={`flex items-center gap-2 px-3 py-2 rounded-full backdrop-blur-md border cursor-pointer transition-all hover:scale-110 shadow-xl ${isActive ? `${color} text-black border-transparent` : 'bg-black/60 border-white/20 text-white'}`}
            >
                <Icon size={14} />
                <span className="text-xs font-bold">{label}</span>
            </div>
        </Html>
    );
};

export const SmartHome3D: React.FC = () => {
  const [lightsOn, setLightsOn] = useState(true);
  const [temp, setTemp] = useState(72);
  const [locked, setLocked] = useState(true);

  return (
    <div className="w-full h-full flex bg-zinc-900 relative">
        
        {/* 3D Viewport */}
        <div className="flex-1 h-full cursor-move">
            <Canvas shadows>
                <PerspectiveCamera makeDefault position={[8, 5, 8]} />
                <OrbitControls enableZoom={true} maxPolarAngle={Math.PI / 2} />
                <ambientLight intensity={0.2} />
                <pointLight position={[0, 4, 0]} intensity={lightsOn ? 1.5 : 0} distance={10} color="#ffaa00" castShadow />
                
                <Room />

                {/* Interactive Elements */}
                <Hotspot 
                    position={[0, 2, 0]} 
                    icon={Lightbulb} 
                    label={lightsOn ? "ON" : "OFF"} 
                    isActive={lightsOn} 
                    onClick={() => setLightsOn(!lightsOn)} 
                    color="bg-amber-400"
                />
                
                <Hotspot 
                    position={[-4.8, 0, 0]} 
                    icon={Thermometer} 
                    label={`${temp}°F`} 
                    isActive={true} 
                    onClick={() => {}} 
                    color="bg-rose-400"
                />

                <Hotspot 
                    position={[0, -1, 4]} 
                    icon={Lock} 
                    label={locked ? "LOCKED" : "OPEN"} 
                    isActive={locked} 
                    onClick={() => setLocked(!locked)} 
                    color="bg-emerald-400"
                />

            </Canvas>
        </div>

        {/* HUD Overlay */}
        <div className="absolute top-6 left-6 pointer-events-none">
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <Zap className="text-amber-400" fill="currentColor" /> Habitat Control
            </h1>
            <p className="text-zinc-400 text-sm">Spatial IoT Management</p>
        </div>

        {/* Sidebar Controls */}
        <div className="w-80 h-full bg-black/40 backdrop-blur-xl border-l border-white/5 p-6 flex flex-col gap-8">
            <div>
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Sun size={14}/> Lighting
                </h3>
                <div className="glass-panel p-4 rounded-xl border border-white/10">
                    <div className="flex justify-between mb-2">
                        <span className="text-sm text-zinc-300">Brightness</span>
                        <span className="text-sm text-white font-mono">80%</span>
                    </div>
                    <input type="range" className="w-full accent-amber-400 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer" />
                </div>
            </div>

            <div>
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Fan size={14}/> Climate
                </h3>
                <div className="glass-panel p-4 rounded-xl border border-white/10 flex items-center justify-between">
                    <button onClick={() => setTemp(temp-1)} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white">-</button>
                    <div className="text-2xl font-bold text-white">{temp}°</div>
                    <button onClick={() => setTemp(temp+1)} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white">+</button>
                </div>
            </div>

            <div className="mt-auto">
                <button className="w-full py-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-red-500/20 transition-all">
                    <Power size={18} /> SYSTEM SHUTDOWN
                </button>
            </div>
        </div>

    </div>
  );
};