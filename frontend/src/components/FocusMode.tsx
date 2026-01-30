import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Pause, SkipForward, Headphones, Volume2 } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { AppMode } from '../types';

export const FocusMode: React.FC = () => {
  const { actions } = useAppContext();
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes
  const [isActive, setIsActive] = useState(false);
  const [soundscape, setSoundscape] = useState<'rain' | 'lofi' | 'white'>('rain');

  useEffect(() => {
    let interval: any = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleExit = () => {
      // Could add long-press logic here
      actions.setMode(AppMode.DAILY);
  };

  return (
    <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black text-white flex flex-col items-center justify-center overflow-hidden"
    >
        {/* Dynamic Background */}
        <div className="absolute inset-0 z-0">
            {soundscape === 'rain' && <div className="w-full h-full bg-[url('https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?q=80&w=2000&auto=format&fit=crop')] bg-cover opacity-30 grayscale mix-blend-overlay"></div>}
            {soundscape === 'lofi' && <div className="w-full h-full bg-[url('https://images.unsplash.com/photo-1516280440614-6697288d5d38?q=80&w=2000&auto=format&fit=crop')] bg-cover opacity-30 grayscale mix-blend-overlay"></div>}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 text-center flex flex-col items-center max-w-2xl px-4">
            <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="mb-8"
            >
                <span className="px-3 py-1 rounded-full border border-white/20 text-xs font-mono text-zinc-400 uppercase tracking-widest bg-black/50 backdrop-blur-md">
                    Sanctuary Mode
                </span>
            </motion.div>

            <motion.h1 
                className="text-[120px] md:text-[180px] font-mono font-bold leading-none tracking-tighter tabular-nums text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-600"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
            >
                {formatTime(timeLeft)}
            </motion.h1>

            <motion.div 
                className="mt-12 text-2xl font-light text-zinc-300"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
            >
                Current Focus: <span className="text-white font-medium border-b border-white/20 pb-1">Finish React Component Architecture</span>
            </motion.div>

            {/* Controls */}
            <div className="mt-20 flex items-center gap-8">
                <button 
                    onClick={() => setIsActive(!isActive)}
                    className="w-20 h-20 rounded-full bg-white text-black flex items-center justify-center hover:scale-110 transition-transform shadow-[0_0_40px_rgba(255,255,255,0.3)]"
                >
                    {isActive ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-2" />}
                </button>
            </div>

            {/* Soundscape Selector */}
            <div className="mt-16 flex items-center gap-4 bg-black/40 backdrop-blur-md p-2 rounded-2xl border border-white/10">
                <Headphones size={16} className="text-zinc-500 ml-2" />
                <div className="flex gap-1">
                    {['rain', 'lofi', 'white'].map((s) => (
                        <button 
                            key={s}
                            onClick={() => setSoundscape(s as any)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all ${soundscape === s ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'}`}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </div>
        </div>

        {/* Exit Button */}
        <button 
            onClick={handleExit}
            className="absolute bottom-10 text-zinc-600 hover:text-red-400 transition-colors text-xs font-bold uppercase tracking-widest flex items-center gap-2 group z-20"
        >
            <X size={14} className="group-hover:rotate-90 transition-transform" /> Exit Sanctuary
        </button>

    </motion.div>
  );
};