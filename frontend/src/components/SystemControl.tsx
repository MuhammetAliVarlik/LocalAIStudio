import React, { useState, useEffect } from 'react';
import { Power, Shield, RefreshCw, Activity, Lock } from 'lucide-react';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { useChatStream } from '../hooks/useChatStream'; 

interface SystemControlProps {
    // This callback sends the text to App.tsx
    onTranscription?: (text: string) => void;
}

/**
 * SystemControl Component
 * Provides high-level system management controls and orchestrates the Voice-to-LLM pipeline.
 */
export const SystemControl: React.FC<SystemControlProps> = ({ onTranscription }) => {
  // State for system power status
  const [active, setActive] = useState(false); 
  
  // State for current security protocol level
  const [securityLevel, setSecurityLevel] = useState<'LOW' | 'MED' | 'HIGH'>('HIGH');

  // --- LOGIC INJECTION START ---
  
  // 1. Get the Chat Hook to send messages to LLM
  const { sendMessage } = useChatStream(); 

  // 2. Initialize Recorder Hook with a callback
  // When the backend returns text, this function runs.
  const { startStreaming, stopStreaming } = useAudioRecorder((text) => {
      console.log("⚡ Voice Command Received:", text);
      
      // A. Send text to LLM (Brain)
      sendMessage(text);
      
      // B. Send text to UI (Subtitle)
      if (onTranscription) {
          onTranscription(text);
      }
  });

  // 3. Sync "Power State" with "Microphone State"
  useEffect(() => {
      if (active) {
          startStreaming();
      } else {
          stopStreaming();
      }
  }, [active, startStreaming, stopStreaming]);

  // --- LOGIC INJECTION END ---

  const handleTogglePower = () => {
    setActive(prev => !prev);
  };

  return (
    <div className="glass-panel p-4 rounded-2xl border border-white/10 flex flex-col gap-4">
      
      {/* --- HEADER SECTION --- */}
      <div className="flex items-center justify-between border-b border-white/5 pb-2">
        <div className="flex items-center gap-2">
           <Activity size={16} className="text-cyan-400" />
           <span className="text-xs font-bold text-white tracking-widest uppercase">System Control</span>
        </div>
        
        {/* Status Indicator */}
        <div className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${active ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            <span className="text-[10px] text-zinc-500 font-mono">{active ? 'ONLINE' : 'OFFLINE'}</span>
        </div>
      </div>

      {/* --- MAIN ACTIONS GRID --- */}
      <div className="grid grid-cols-2 gap-2">
        {/* Power Toggle Button */}
        <button 
            onClick={handleTogglePower}
            className={`p-3 rounded-xl flex flex-col items-center gap-2 transition-all border ${
              active 
                ? 'bg-red-500/10 border-red-500/50 text-red-400 hover:bg-red-500/20' 
                : 'bg-green-500/10 border-green-500/50 text-green-400 hover:bg-green-500/20'
            }`}
        >
            <Power size={20} />
            <span className="text-[10px] font-bold">{active ? 'TERMINATE' : 'INITIALIZE'}</span>
        </button>

        {/* Reboot Button (Mock) */}
        <button 
            className="p-3 rounded-xl flex flex-col items-center gap-2 bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10 transition-all"
        >
            <RefreshCw size={20} />
            <span className="text-[10px] font-bold">REBOOT</span>
        </button>
      </div>

      {/* --- SECURITY PROTOCOL SELECTOR --- */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-zinc-500">
            <Shield size={12} />
            <span className="text-[10px] font-bold uppercase">Security Protocol</span>
        </div>
        
        {/* Segmented Control for Security Levels */}
        <div className="flex bg-black/40 rounded-lg p-1 border border-white/5">
            {(['LOW', 'MED', 'HIGH'] as const).map((level) => (
                <button
                    key={level}
                    onClick={() => setSecurityLevel(level)}
                    className={`flex-1 py-1.5 text-[9px] font-bold rounded-md transition-all ${
                        securityLevel === level 
                        ? 'bg-white/10 text-white shadow-sm' 
                        : 'text-zinc-600 hover:text-zinc-400'
                    }`}
                >
                    {level}
                </button>
            ))}
        </div>
      </div>

      {/* --- FOOTER INFO --- */}
      <div className="mt-2 pt-2 border-t border-white/5 flex justify-between items-center text-[9px] text-zinc-600 font-mono">
          <span className="flex items-center gap-1"><Lock size={8} /> ENCRYPTED</span>
          <span>V.2.0.4</span>
      </div>

    </div>
  );
};