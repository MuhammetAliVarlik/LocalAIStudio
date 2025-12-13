import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Fingerprint, Lock, ChevronRight, Hexagon } from 'lucide-react';
import { AuroraBackground } from './AuroraBackground';
import { useApp } from '../context/AppContext';

export const LoginScreen: React.FC = () => {
  const { actions } = useApp();
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await actions.login();
    setLoading(false);
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black font-sans flex items-center justify-center text-white">
      <AuroraBackground />
      
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-0" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative z-10 w-full max-w-md p-8"
      >
        <div className="glass-panel p-8 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden backdrop-blur-3xl bg-black/40">
          {/* Decoration */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-violet-500/20 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col items-center mb-10">
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(0,240,255,0.15)]">
              <Hexagon className="text-cyan-400 animate-pulse" size={32} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-center">Local AI OS <span className="text-cyan-400">.v2</span></h1>
            <p className="text-slate-400 text-sm mt-2 font-mono">Secure Neural Interface</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
             <div className="space-y-2">
               <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Identity</label>
               <div className="relative">
                 <input 
                    type="text" 
                    defaultValue="Architect"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 pl-10 text-sm focus:border-cyan-500/50 outline-none transition-all focus:bg-black/60 text-white placeholder-slate-600 font-mono"
                 />
                 <Fingerprint className="absolute left-3 top-3.5 text-slate-500" size={16} />
               </div>
             </div>
             
             <div className="space-y-2">
               <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Passkey</label>
               <div className="relative">
                 <input 
                    type="password" 
                    defaultValue="password"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 pl-10 text-sm focus:border-cyan-500/50 outline-none transition-all focus:bg-black/60 text-white placeholder-slate-600 font-mono"
                 />
                 <Lock className="absolute left-3 top-3.5 text-slate-500" size={16} />
               </div>
             </div>

             <button 
                type="submit"
                disabled={loading}
                className="w-full group relative overflow-hidden rounded-xl bg-white text-black font-bold py-3.5 px-4 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)]"
             >
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {loading ? 'Authenticating...' : 'Initialize System'} 
                  {!loading && <ChevronRight size={16} />}
                </span>
             </button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/5 text-center">
             <p className="text-[10px] text-slate-600 font-mono">
               SYSTEM STATUS: <span className="text-emerald-500">ONLINE</span> • ENCRYPTION: <span className="text-emerald-500">AES-256</span>
             </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};