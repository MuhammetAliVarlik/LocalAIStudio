import React, { useState, useEffect, useRef } from 'react';
import { Mic, Code, Network, Send, User, Plus, MessageSquare, Menu, Layout, Play, Settings, ChevronRight, Sparkles, Brain, Zap, LogOut, Sun, Clock, AlertTriangle, Edit2, Check, X, FileCode, Folder, Terminal, Monitor, Volume2, VolumeX, CloudRain, Heart, Dna, Music, Shield, Smile, Frown, BookOpen, Rocket, Ghost, Cloud, CloudSnow, CloudLightning, HelpCircle, Coffee, Moon, Plane, Lightbulb, Flame, AlertCircle, Newspaper, Languages, FileText } from 'lucide-react';
import VoiceAvatar from './VoiceAvatar';
import { AgentBuilder } from './AgentBuilder';
import { CodeStudio } from './CodeStudio';
import { DailyDashboard } from './DailyDashboard';
import { ResearchLab } from './ResearchLab';
import { LanguageCenter } from './LanguageCenter';
import { AuroraBackground } from './AuroraBackground';
import { LoginScreen } from './LoginScreen';
import { AutomationPanel } from './AutomationPanel';
import { Agent, AppMode, AvatarState, VisualContext } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';

const SpecialWidget = ({ context }: { context: VisualContext }) => {
    if (context === VisualContext.DEFAULT) return null;
    let icon = <Sun size={18} />;
    let text = "Sunny 72°F";
    let color = "text-amber-300 border-amber-500/30 bg-amber-950/30";

    // --- WEATHER ---
    if (context === VisualContext.WEATHER_SUN) {
        icon = <Sun size={18} />; text = "Sunny 72°F"; color = "text-amber-300 border-amber-500/30 bg-amber-950/30";
    }
    else if (context === VisualContext.WEATHER_RAIN) {
        icon = <CloudRain size={18} />; text = "Rain 65°F"; color = "text-blue-300 border-blue-500/30 bg-blue-950/30";
    }
    else if (context === VisualContext.WEATHER_CLOUDY) {
        icon = <Cloud size={18} />; text = "Overcast"; color = "text-slate-300 border-slate-500/30 bg-slate-950/30";
    }
    else if (context === VisualContext.WEATHER_SNOW) {
        icon = <CloudSnow size={18} />; text = "Snow 28°F"; color = "text-white border-white/30 bg-white/10";
    }
    else if (context === VisualContext.WEATHER_THUNDER) {
        icon = <CloudLightning size={18} />; text = "Storm Alert"; color = "text-yellow-400 border-yellow-500/30 bg-yellow-950/30";
    }

    // --- MOODS ---
    else if (context === VisualContext.MOOD_HAPPY) {
        icon = <Smile size={18} />; text = "HAPPY"; color = "text-yellow-300 border-yellow-500/30 bg-yellow-950/30";
    }
    else if (context === VisualContext.MOOD_SAD) {
        icon = <Frown size={18} />; text = "SAD"; color = "text-slate-300 border-slate-500/30 bg-slate-950/30";
    }
    else if (context === VisualContext.MOOD_ANGRY) {
        icon = <AlertCircle size={18} />; text = "HOSTILE"; color = "text-red-500 border-red-500/30 bg-red-950/30";
    }
    else if (context === VisualContext.MOOD_SURPRISED) {
        icon = <Zap size={18} />; text = "SURPRISED"; color = "text-pink-300 border-pink-500/30 bg-pink-950/30";
    }
    else if (context === VisualContext.MOOD_CONFUSED) {
        icon = <HelpCircle size={18} />; text = "CONFUSED"; color = "text-violet-300 border-violet-500/30 bg-violet-950/30";
    }
    else if (context === VisualContext.MOOD_EXCITED) {
        icon = <Flame size={18} />; text = "EXCITED"; color = "text-orange-400 border-orange-500/30 bg-orange-950/30";
    }

    // --- STORY / DAILY ---
    else if (context === VisualContext.STORY_COFFEE) {
        icon = <Coffee size={18} />; text = "MORNING BREW"; color = "text-amber-700 border-amber-700/30 bg-amber-950/30";
    }
    else if (context === VisualContext.STORY_SLEEP) {
        icon = <Moon size={18} />; text = "SLEEP MODE"; color = "text-indigo-400 border-indigo-500/30 bg-indigo-950/30";
    }
    else if (context === VisualContext.STORY_TRAVEL) {
        icon = <Plane size={18} />; text = "TRAVEL PLAN"; color = "text-sky-300 border-sky-500/30 bg-sky-950/30";
    }
    else if (context === VisualContext.STORY_IDEA) {
        icon = <Lightbulb size={18} />; text = "IDEATION"; color = "text-yellow-200 border-yellow-500/30 bg-yellow-950/30";
    }
    else if (context === VisualContext.STORY_BOOK) {
        icon = <BookOpen size={18} />; text = "STORY MODE"; color = "text-indigo-300 border-indigo-500/30 bg-indigo-950/30";
    }
    else if (context === VisualContext.STORY_ROCKET) {
        icon = <Rocket size={18} />; text = "LAUNCH SEQUENCE"; color = "text-orange-300 border-orange-500/30 bg-orange-950/30";
    }
    else if (context === VisualContext.STORY_GHOST) {
        icon = <Ghost size={18} />; text = "SPECTRAL ANALYSIS"; color = "text-teal-300 border-teal-500/30 bg-teal-950/30";
    }

    // --- UTILITY ---
    else if (context === VisualContext.TIME) {
        icon = <Clock size={18} />; text = new Date().toLocaleTimeString(); color = "text-blue-300 border-blue-500/30 bg-blue-950/30";
    }
    else if (context === VisualContext.ALERT) {
        icon = <AlertTriangle size={18} />; text = "SYSTEM ALERT"; color = "text-red-300 border-red-500/30 bg-red-950/30";
    }
    else if (context === VisualContext.HEART) {
        icon = <Heart size={18} />; text = "EMOTION ENGINE"; color = "text-rose-300 border-rose-500/30 bg-rose-950/30";
    }
    else if (context === VisualContext.DNA) {
        icon = <Dna size={18} />; text = "BIO-SCANNING"; color = "text-violet-300 border-violet-500/30 bg-violet-950/30";
    }
    else if (context === VisualContext.MUSIC) {
        icon = <Music size={18} />; text = "NOW PLAYING"; color = "text-cyan-300 border-cyan-500/30 bg-cyan-950/30";
    }
    else if (context === VisualContext.SHIELD) {
        icon = <Shield size={18} />; text = "SECURE PROTOCOL"; color = "text-emerald-300 border-emerald-500/30 bg-emerald-950/30";
    }

    return (
        <motion.div initial={{y: -20, opacity: 0}} animate={{y: 0, opacity: 1}} exit={{y: -20, opacity: 0}} className={`absolute top-20 left-1/2 -translate-x-1/2 flex items-center gap-3 px-6 py-2 rounded-full border backdrop-blur-md z-50 ${color}`}>
            {icon} <span className="font-mono font-bold tracking-widest text-sm">{text}</span>
        </motion.div>
    );
};

export const DashboardShell: React.FC = () => {
  const { state, actions } = useApp();
  const { user, isAuthenticated, mode, agents, activeAgentId, conversations, activeConversationId, avatarState, visualContext, audioLevel } = state;
  
  const [input, setInput] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Derived
  const activeAgent = agents.find(a => a.id === activeAgentId) || agents[0];
  const activeConversation = conversations.find(c => c.id === activeConversationId);
  const currentMessages = activeConversation?.messages || [];

  useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages, mode]);

  const handleSendMessage = () => {
      if (!input.trim()) return;
      actions.sendMessage(input);
      setInput('');
  };

  const handleSaveAgent = () => {
      if(!editingAgent) return;
      if (agents.find(a => a.id === editingAgent.id)) {
          actions.updateAgent(editingAgent);
      } else {
          actions.addAgent(editingAgent);
      }
      setEditingAgent(null);
  };

  if (!isAuthenticated) return <LoginScreen />;

  return (
    <div className="flex w-full h-screen font-sans overflow-hidden text-zinc-300 bg-space selection:bg-white/20">
      <AuroraBackground />

      {/* --- Sidebar --- */}
      <motion.div 
        initial={{ width: 280 }}
        animate={{ width: isSidebarOpen ? 280 : 0 }}
        className="flex-shrink-0 glass-panel border-r-0 border-r-white/5 flex flex-col z-40 m-3 rounded-2xl relative overflow-hidden shadow-2xl bg-black/80"
      >
          {/* Header */}
          <div className="p-5 border-b border-white/5">
              <div className="flex items-center justify-between mb-6">
                 <div className="flex items-center gap-2 text-white font-bold tracking-wider text-xs uppercase animate-breath">
                    <Sparkles size={12} className="text-white" /> Local OS
                 </div>
                 <button className="text-zinc-500 hover:text-white transition-colors" onClick={actions.logout}><LogOut size={14} /></button>
              </div>
              
              <div className="flex items-center gap-3 group cursor-pointer hover:bg-white/5 p-2 -mx-2 rounded-xl transition-all">
                  <div className="w-10 h-10 rounded-lg p-0.5 bg-gradient-to-br from-zinc-700 to-black shadow-lg relative overflow-hidden border border-white/10">
                     <img src={activeAgent.avatarUrl} className="w-full h-full rounded-[6px] object-cover grayscale group-hover:grayscale-0 transition-all" />
                  </div>
                  <div>
                      <h3 className="font-bold text-white text-sm tracking-tight group-hover:text-cyan-200 transition-colors">{activeAgent.name}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{backgroundColor: activeAgent.primaryColor}}></span>
                          <span className="text-[9px] text-zinc-500 font-mono uppercase">{activeAgent.type}</span>
                      </div>
                  </div>
              </div>
          </div>

          {/* Nav */}
          <div className="p-3 space-y-1">
             {[
                 { m: AppMode.VOICE, icon: Mic, l: 'Voice Link' },
                 { m: AppMode.DAILY, icon: Newspaper, l: 'Daily Feed' },
                 { m: AppMode.CODING, icon: Code, l: 'Code Studio' },
                 { m: AppMode.RESEARCH, icon: FileText, l: 'Research Lab' },
                 { m: AppMode.LANGUAGE, icon: Languages, l: 'Language Center' },
                 { m: AppMode.BUILDER, icon: Brain, l: 'Agent Forge' },
                 { m: AppMode.AUTOMATION, icon: Zap, l: 'Automations' }
             ].map(item => (
                <button 
                    key={item.m} 
                    onClick={() => actions.setMode(item.m)} 
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-300 ${mode === item.m ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.3)] animate-breath' : 'text-zinc-400 hover:bg-white/10 hover:text-white'}`}
                >
                    <item.icon size={14} className={mode === item.m ? 'text-black' : 'text-zinc-500'} /> 
                    {item.l}
                </button>
             ))}
          </div>

          {/* Lists */}
          <div className="flex-1 overflow-y-auto px-3 pb-3 custom-scrollbar">
              <div className="flex items-center justify-between mb-2 mt-4 px-2">
                  <h2 className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest font-mono">Neural Nodes</h2>
                  <Plus size={12} className="text-zinc-600 cursor-pointer hover:text-white transition-colors" onClick={() => setEditingAgent({id: '', name: 'New Node', type: 'daily', primaryColor: '#ffffff', systemPrompt: '', avatarUrl: 'https://source.unsplash.com/random/200x200?tech'})} />
              </div>
              <div className="space-y-0.5 mb-6">
                   {agents.map(a => (
                       <button
                         key={a.id}
                         onClick={() => actions.setActiveAgent(a.id)}
                         className={`w-full text-left p-2 rounded-md text-xs transition-all flex items-center gap-2.5 ${activeAgentId === a.id ? 'bg-white/10 text-white' : 'text-zinc-500 hover:bg-white/5 hover:text-zinc-300'}`}
                       >
                           <div className={`w-1.5 h-1.5 rounded-full ${activeAgentId === a.id ? 'bg-white' : 'bg-zinc-700'}`}></div>
                           <span className="truncate">{a.name}</span>
                       </button>
                   ))}
              </div>
          </div>
          
          {/* User Footer */}
          <div className="p-4 border-t border-white/5 bg-black/40 backdrop-blur-xl">
             <div className="flex items-center gap-3">
                 <div className="w-7 h-7 rounded-full bg-zinc-800 border border-white/10 overflow-hidden">
                     {user?.avatarUrl && <img src={user.avatarUrl} className="w-full h-full object-cover" />}
                 </div>
                 <div className="flex-1">
                     <div className="text-xs font-bold text-zinc-300">{user?.name}</div>
                     <div className="text-[9px] text-zinc-600 font-mono uppercase">{user?.role}</div>
                 </div>
                 <Settings size={14} className="text-zinc-600 hover:text-white cursor-pointer animate-spin-slow hover:animate-none" />
             </div>
          </div>
      </motion.div>

      {/* --- Main Content --- */}
      <div className="flex-1 relative h-full flex flex-col z-10 overflow-hidden bg-black/20">
          
          <AnimatePresence>
             <SpecialWidget context={visualContext} />
          </AnimatePresence>

          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className={`absolute top-5 left-5 z-50 p-2 glass-panel rounded-lg text-zinc-500 hover:text-white transition-all hover:scale-110 active:scale-95 ${!isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
             <Menu size={16} />
          </button>

          {/* === VOICE MODE === */}
          <div className={`absolute inset-0 flex flex-col transition-all duration-700 ${mode === AppMode.VOICE ? 'opacity-100 z-20' : 'opacity-0 z-0 pointer-events-none'}`}>
               
               {/* Close Button / Mode Switcher */}
               <div className="absolute top-5 right-5 z-50 flex gap-2">
                   <button onClick={() => actions.setMode(AppMode.CODING)} className="glass-panel px-4 py-2 rounded-full text-xs font-mono text-zinc-400 hover:text-white hover:bg-white/10 transition-all flex items-center gap-2 animate-breath">
                       <Terminal size={12} /> ENTER TERMINAL
                   </button>
               </div>

               {/* Avatar Layer */}
               <div className="absolute inset-0 flex items-center justify-center z-0">
                    <VoiceAvatar 
                        state={avatarState} 
                        visualContext={visualContext}
                        audioLevel={audioLevel} 
                        primaryColor={activeAgent.primaryColor} 
                        visible={mode === AppMode.VOICE} 
                    />
               </div>

               {/* Interaction Layer */}
               <div className="absolute inset-0 flex flex-col z-10 p-6 md:p-12 pointer-events-none">
                   <div className="flex-1 flex flex-col-reverse overflow-y-auto scrollbar-hide pb-24 mask-image-linear-to-t pointer-events-auto">
                       <div ref={messagesEndRef} />
                       <AnimatePresence>
                           {[...currentMessages].reverse().slice(0, 3).map((msg, idx) => (
                               <motion.div 
                                 key={msg.id} 
                                 initial={{ opacity: 0, y: 20, scale: 0.9 }}
                                 animate={{ opacity: 1 - (idx * 0.3), y: 0, scale: 1 - (idx * 0.05) }}
                                 className={`flex gap-4 mb-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} items-end`}
                               >
                                   <div className={`p-4 rounded-2xl max-w-xl text-lg md:text-xl font-light tracking-wide backdrop-blur-md shadow-2xl ${msg.role === 'user' ? 'bg-white/10 text-white rounded-br-none' : 'bg-black/80 border border-white/10 text-zinc-200 rounded-bl-none'}`}>
                                       {msg.text}
                                   </div>
                               </motion.div>
                           ))}
                       </AnimatePresence>
                   </div>
                   
                   {/* Input Bar */}
                   <div className="w-full max-w-2xl mx-auto pointer-events-auto relative">
                       <div className="glass-panel rounded-full p-2 pl-6 flex items-center gap-4 bg-black/80 backdrop-blur-xl border border-white/10 shadow-2xl animate-breath">
                           <button 
                             onClick={() => actions.setAvatarState(avatarState === AvatarState.LISTENING ? AvatarState.IDLE : AvatarState.LISTENING)}
                             className={`p-3 rounded-full transition-all duration-300 ${avatarState === AvatarState.LISTENING ? 'bg-red-500/20 text-red-400 animate-pulse' : 'bg-white/5 text-zinc-400 hover:text-white'}`}
                           >
                               {avatarState === AvatarState.LISTENING ? <Volume2 size={20} /> : <Mic size={20} />}
                           </button>
                           <input 
                               type="text" 
                               value={input}
                               onChange={(e) => setInput(e.target.value)}
                               onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                               placeholder="Communicate with Neural Core..."
                               className="flex-1 bg-transparent border-none outline-none text-white placeholder-zinc-600 px-2 text-base h-12 font-light"
                           />
                           <button onClick={handleSendMessage} className="p-3 bg-white/10 text-white rounded-full hover:bg-white/20 transition-all active:scale-95">
                               <Send size={18} />
                           </button>
                       </div>
                   </div>
               </div>
          </div>

          {/* === CODE STUDIO === */}
          <div className={`absolute inset-0 flex transition-all duration-500 bg-black ${mode === AppMode.CODING ? 'opacity-100 z-30' : 'opacity-0 pointer-events-none scale-95'}`}>
               <div className="w-full h-full glass-panel overflow-hidden bg-[#09090b]">
                   <CodeStudio />
               </div>
          </div>

          {/* === DAILY DASHBOARD === */}
          <div className={`absolute inset-0 flex transition-all duration-500 ${mode === AppMode.DAILY ? 'opacity-100 z-30' : 'opacity-0 pointer-events-none scale-95'}`}>
               <div className="w-full h-full glass-panel overflow-hidden bg-[#09090b]">
                   <DailyDashboard />
               </div>
          </div>

          {/* === RESEARCH LAB === */}
          <div className={`absolute inset-0 flex transition-all duration-500 ${mode === AppMode.RESEARCH ? 'opacity-100 z-30' : 'opacity-0 pointer-events-none scale-95'}`}>
               <div className="w-full h-full glass-panel overflow-hidden bg-[#09090b]">
                   <ResearchLab />
               </div>
          </div>

          {/* === LANGUAGE CENTER === */}
          <div className={`absolute inset-0 flex transition-all duration-500 ${mode === AppMode.LANGUAGE ? 'opacity-100 z-30' : 'opacity-0 pointer-events-none scale-95'}`}>
               <div className="w-full h-full glass-panel overflow-hidden bg-[#09090b]">
                   <LanguageCenter />
               </div>
          </div>

          {/* === BUILDER & AUTOMATION (Wrappers) === */}
          <div className={`absolute inset-0 p-4 transition-all duration-500 ${mode === AppMode.BUILDER ? 'opacity-100 z-30' : 'opacity-0 pointer-events-none scale-95'}`}>
              <div className="w-full h-full glass-panel rounded-2xl overflow-hidden border-white/10 shadow-2xl bg-[#09090b]">
                 <AgentBuilder />
              </div>
          </div>

          <div className={`absolute inset-0 p-4 transition-all duration-500 ${mode === AppMode.AUTOMATION ? 'opacity-100 z-30' : 'opacity-0 pointer-events-none scale-95'}`}>
              <div className="w-full h-full glass-panel rounded-2xl overflow-hidden border-white/10 shadow-2xl bg-[#09090b]">
                 <AutomationPanel />
              </div>
          </div>

      </div>

      {/* --- AGENT CONFIG MODAL --- */}
      {editingAgent && (
          <div className="absolute inset-0 bg-black/90 backdrop-blur-sm z-[60] flex items-center justify-center p-6">
              <div className="glass-panel w-full max-w-2xl rounded-2xl border border-white/10 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
                  <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                          <Settings size={18} className="text-white"/> Agent Configuration
                      </h3>
                      <button onClick={() => setEditingAgent(null)} className="text-zinc-500 hover:text-white"><X size={20}/></button>
                  </div>
                  
                  <div className="p-8 overflow-y-auto space-y-6 flex-1 bg-[#09090b]">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                              <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-2 block">Identity Name</label>
                              <input 
                                type="text" 
                                value={editingAgent.name} 
                                onChange={e => setEditingAgent({...editingAgent, name: e.target.value})}
                                className="glass-input w-full rounded-lg p-3 text-sm font-mono focus:bg-white/5 outline-none"
                              />
                          </div>
                          <div>
                                <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-2 block">Archetype</label>
                                <select 
                                    value={editingAgent.type} 
                                    onChange={e => setEditingAgent({...editingAgent, type: e.target.value as any})}
                                    className="glass-input w-full rounded-lg p-3 text-sm font-mono focus:bg-white/5 outline-none"
                                >
                                    <option value="daily">Daily Assistant</option>
                                    <option value="coder">Code Engineer</option>
                                    <option value="creative">Creative Studio</option>
                                </select>
                          </div>
                      </div>

                      <div>
                          <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-2 block">System Prompt & Personality</label>
                          <textarea 
                            value={editingAgent.systemPrompt} 
                            placeholder="Define the agent's core behavior, tone, and constraints here..."
                            onChange={e => setEditingAgent({...editingAgent, systemPrompt: e.target.value})}
                            className="glass-input w-full h-32 rounded-lg p-4 text-sm font-mono focus:bg-white/5 outline-none resize-none leading-relaxed"
                          />
                          <p className="text-[10px] text-zinc-600 mt-2">Example: "You are a stoic, highly efficient coding architect. Prefer concise Python solutions."</p>
                      </div>

                      <div>
                          <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-2 block">Interface Color</label>
                          <div className="flex gap-3">
                              {['#ffffff', '#00f0ff', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'].map(c => (
                                  <div 
                                    key={c}
                                    onClick={() => setEditingAgent({...editingAgent, primaryColor: c})}
                                    className={`w-8 h-8 rounded-full cursor-pointer transition-all border-2 ${editingAgent.primaryColor === c ? 'border-white scale-110' : 'border-transparent opacity-50 hover:opacity-100'}`}
                                    style={{backgroundColor: c}}
                                  />
                              ))}
                              <input 
                                  type="color" 
                                  value={editingAgent.primaryColor} 
                                  onChange={e => setEditingAgent({...editingAgent, primaryColor: e.target.value})}
                                  className="w-8 h-8 rounded-full bg-transparent border border-white/20 cursor-pointer"
                              />
                          </div>
                      </div>
                  </div>

                  <div className="p-6 border-t border-white/10 bg-black/40 flex justify-end gap-3">
                      {editingAgent.id && (
                          <button 
                            onClick={() => { actions.deleteAgent(editingAgent.id); setEditingAgent(null); }}
                            className="px-6 py-3 rounded-lg border border-red-500/20 text-red-500 hover:bg-red-500/10 text-xs font-bold transition-all"
                          >
                              DELETE NODE
                          </button>
                      )}
                      <button onClick={handleSaveAgent} className="px-8 py-3 rounded-lg bg-white text-black text-xs font-bold hover:bg-zinc-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] animate-breath">
                          SAVE CONFIGURATION
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};