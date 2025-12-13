import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, X, MessageSquare, Maximize2, Minimize2, ChevronUp, GripHorizontal } from 'lucide-react';
import VoiceAvatar from './VoiceAvatar';
import { useApp } from '../context/AppContext';
import { AvatarState, VisualContext } from '../types';

export const GlobalAssistant: React.FC = () => {
  const { state, actions } = useApp();
  const { avatarState, visualContext, audioLevel } = state;
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div 
        drag
        dragMomentum={false}
        initial={{ x: "-50%" }}
        className="fixed bottom-6 left-1/2 z-50 flex flex-col items-center pointer-events-auto cursor-grab active:cursor-grabbing"
    >
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="glass-panel w-96 rounded-2xl overflow-hidden shadow-2xl border border-white/20 backdrop-blur-xl bg-black/80 mb-4 cursor-default"
            onPointerDown={(e) => e.stopPropagation()} // Prevent dragging when interacting with panel content
          >
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-white/10 bg-white/5">
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                    Neural Link Active
                </span>
                <div className="flex items-center gap-2">
                    <button onClick={() => setIsExpanded(false)} className="text-zinc-400 hover:text-white">
                        <Minimize2 size={14} />
                    </button>
                </div>
            </div>

            {/* Avatar Viewport */}
            <div className="h-48 relative bg-gradient-to-b from-black/50 to-transparent">
                <VoiceAvatar 
                    state={avatarState} 
                    visualContext={visualContext} 
                    audioLevel={audioLevel} 
                    primaryColor="#22d3ee" 
                    compact
                />
            </div>

            {/* Controls */}
            <div className="p-4 flex items-center gap-3">
                <button 
                    onClick={() => actions.setAvatarState(avatarState === AvatarState.LISTENING ? AvatarState.IDLE : AvatarState.LISTENING)}
                    className={`p-4 rounded-full transition-all duration-300 ${avatarState === AvatarState.LISTENING ? 'bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)]' : 'bg-white/10 text-white hover:bg-white/20'}`}
                >
                    <Mic size={20} />
                </button>
                <input 
                    type="text" 
                    placeholder="Ask anything..." 
                    className="flex-1 bg-black/40 border border-white/10 rounded-full h-12 px-4 text-sm text-white focus:border-cyan-500/50 outline-none"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            actions.sendMessage((e.target as HTMLInputElement).value);
                            (e.target as HTMLInputElement).value = '';
                        }
                    }}
                    onPointerDown={(e) => e.stopPropagation()} // Allow text selection/focus without dragging
                />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Toggle Pill */}
      <motion.button
        onClick={() => setIsExpanded(!isExpanded)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`glass-panel px-6 py-3 rounded-full flex items-center gap-3 border border-white/20 shadow-[0_0_20px_rgba(0,0,0,0.5)] transition-all ${isExpanded ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' : 'bg-black/60 text-white hover:bg-white/10'}`}
      >
        <div className="relative">
            <div className={`absolute inset-0 rounded-full blur-sm ${avatarState === AvatarState.SPEAKING ? 'bg-cyan-400 animate-pulse' : 'bg-transparent'}`} />
            <BotIcon isActive={isExpanded} />
        </div>
        <span className="text-sm font-bold tracking-wide">ASSISTANT</span>
        {/* Grip Icon to indicate draggable */}
        <GripHorizontal size={16} className="text-zinc-500 ml-1" />
      </motion.button>
    </motion.div>
  );
};

const BotIcon = ({ isActive }: { isActive: boolean }) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="10" rx="2" />
        <circle cx="12" cy="5" r="2" />
        <path d="M12 7v4" />
        <line x1="8" y1="16" x2="8" y2="16" />
        <line x1="16" y1="16" x2="16" y2="16" />
    </svg>
);