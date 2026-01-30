import React, { useState, useEffect } from 'react';
import { Zap, GripHorizontal, X, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import { SystemService } from '../api/services';

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
        <div className="absolute text-[9px] font-mono font-bold text-white">{Math.round(percentage)}%</div>
      </div>
      <div className="text-[8px] uppercase tracking-wider text-zinc-500 font-bold">{label}</div>
      <div className="text-[9px] font-mono text-zinc-300">{value}</div>
    </div>
  );
};

export const SystemMonitor: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [stats, setStats] = useState({
    gpu: { percent: 0, used: 0, total: 0 },
    cpu: { percent: 0, threads: 0 },
    ram: { percent: 0, used: 0, total: 0 },
    status: 'offline'
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await SystemService.getStats();
        // API'den gelen veriyi state formatına map ediyoruz
        setStats({
            gpu: { 
                percent: data.gpu.percent, 
                used: data.gpu.used_gb, 
                total: data.gpu.total_gb 
            },
            cpu: { 
                percent: data.cpu.percent, 
                threads: data.cpu.threads 
            },
            ram: { 
                percent: data.ram.percent, 
                used: data.ram.used_gb, 
                total: data.ram.total_gb 
            },
            status: 'online'
        });
      } catch (err) {
        // Hata durumunda (Offline)
        console.warn("System Monitor Connection Failed");
      }
    };

    // İlk açılışta çek
    fetchStats();

    // Her 2 saniyede bir güncelle (Çok sık yaparsak backend yorulur)
    const interval = setInterval(fetchStats, 2000);
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
        {/* Header */}
        <div className="flex items-center justify-between px-2 group">
             <div className="flex items-center gap-2 p-1 rounded bg-black/20 text-zinc-600">
                 <Activity size={12} className={stats.status === 'online' ? "text-green-500 animate-pulse" : "text-red-500"} />
                 <span className="text-[10px] font-bold uppercase">{stats.status}</span>
             </div>
             <button onClick={() => setIsVisible(false)} className="p-1 rounded hover:bg-white/10 text-zinc-500 hover:text-white transition-colors">
                 <X size={14} />
             </button>
        </div>

        {/* Hardware Row */}
        <div className="glass-panel p-3 rounded-2xl flex gap-4 backdrop-blur-md bg-black/60 border border-white/10 shadow-2xl">
            {/* GPU (VRAM) */}
            <StatCircle 
                percentage={stats.gpu.percent} 
                color="#00f0ff" 
                label="GPU VRAM" 
                value={`${stats.gpu.used}GB`} 
            />
            <div className="w-px bg-white/10 h-10 self-center" />
            
            {/* CPU */}
            <StatCircle 
                percentage={stats.cpu.percent} 
                color="#f472b6" 
                label="CPU LOAD" 
                value={`${stats.cpu.threads} THRD`} 
            />
            <div className="w-px bg-white/10 h-10 self-center" />
            
            {/* RAM */}
            <StatCircle 
                percentage={stats.ram.percent} 
                color="#34d399" 
                label="SYS RAM" 
                value={`${stats.ram.used}GB`} 
            />
        </div>
    </motion.div>
  );
};