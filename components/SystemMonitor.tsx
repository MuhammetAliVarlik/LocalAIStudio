import React, { useState, useEffect } from 'react';
import { Zap, GripHorizontal, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const StatCircle = ({ percentage, color, label, value }: { percentage: number, color: string, label: string, value: string }) => {
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-12 h-12 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90">
          <circle cx="24" cy="24" r={radius} stroke="currentColor" strokeWidth="3" fill="transparent" className="text-white/5" />
          <circle 
            cx="24" 
            cy="24" 
            r={radius} 
            stroke={color} 
            strokeWidth="3" 
            fill="transparent" 
            strokeDasharray={circumference} 
            strokeDashoffset={offset} 
            strokeLinecap="round"
            className="transition-all duration-500 ease-out"
          />
        </svg>
        <div className="absolute text-[9px] font-mono font-bold text-white">{percentage}%</div>
      </div>
      <div className="text-[8px] uppercase tracking-wider text-zinc-500 font-bold">{label}</div>
      <div className="text-[9px] font-mono text-zinc-300">{value}</div>
    </div>
  );
};

export const SystemMonitor: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [stats, setStats] = useState({
    gpu: 45,
    cpu: 12,
    ram: 68,
    tps: 0
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => ({
        gpu: Math.min(99, Math.max(20, prev.gpu + (Math.random() - 0.5) * 10)),
        cpu: Math.min(99, Math.max(5, prev.cpu + (Math.random() - 0.5) * 15)),
        ram: Math.min(90, Math.max(60, prev.ram + (Math.random() - 0.5) * 2)),
        tps: prev.cpu > 50 ? Math.floor(Math.random() * 40 + 80) : 0
      }));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!isVisible) return (
      <button 
        onClick={() => setIsVisible(true)} 
        className="fixed bottom-6 right-6 z-50 p-3 glass-panel rounded-full text-zinc-400 hover:text-white hover:scale-110 transition-all shadow-lg"
        title="Open System Monitor"
      >
          <Zap size={20} />
      </button>
  );

  return (
    <motion.div 
        drag
        dragMomentum={false}
        initial={{ x: 0, y: 0 }}
        className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-auto cursor-grab active:cursor-grabbing"
    >
        {/* Header / Drag Handle */}
        <div className="flex items-center justify-between px-2 group">
             <div className="p-1 rounded bg-black/20 text-zinc-600">
                 <GripHorizontal size={14} />
             </div>
             <button onClick={() => setIsVisible(false)} className="p-1 rounded hover:bg-white/10 text-zinc-500 hover:text-white transition-colors">
                 <X size={14} />
             </button>
        </div>

        {/* Hardware Row */}
        <div className="glass-panel p-3 rounded-2xl flex gap-4 backdrop-blur-md bg-black/60 border border-white/10 shadow-2xl">
            <StatCircle percentage={Math.floor(stats.gpu)} color="#00f0ff" label="GPU VRAM" value="18GB" />
            <div className="w-px bg-white/10 h-10 self-center" />
            <StatCircle percentage={Math.floor(stats.cpu)} color="#f472b6" label="CPU LOAD" value="12 THRD" />
            <div className="w-px bg-white/10 h-10 self-center" />
            <StatCircle percentage={Math.floor(stats.ram)} color="#34d399" label="SYS RAM" value="48GB" />
        </div>

        {/* TPS Meter */}
        <div className="glass-panel px-3 py-2 rounded-xl flex items-center justify-between border border-white/10 bg-black/60">
            <div className="flex items-center gap-2">
                <Zap size={12} className={stats.tps > 0 ? "text-amber-400 animate-pulse" : "text-zinc-600"} />
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Inference</span>
            </div>
            <span className="text-xs font-mono font-bold text-white ml-4">{stats.tps} <span className="text-zinc-600 text-[9px]">T/s</span></span>
        </div>
    </motion.div>
  );
};