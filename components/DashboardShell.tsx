import React, { useState, useEffect, useRef } from 'react';
import { Mic, Code, Network, Send, User, Plus, MessageSquare, Menu, Layout, Play, Settings, ChevronRight, Sparkles, Brain, Zap, LogOut, Sun, Clock, AlertTriangle, Edit2, Check, X, FileCode, Folder, Terminal, Monitor, Volume2, VolumeX, CloudRain, Heart, Dna, Music, Shield, Smile, Frown, BookOpen, Rocket, Ghost, Cloud, CloudSnow, CloudLightning, HelpCircle, Coffee, Moon, Plane, Lightbulb, Flame, AlertCircle, Newspaper, Languages, FileText, ShoppingBag, Activity, Calendar, StickyNote, Smartphone, Grid, Palette, Wallet, Home as HomeIcon, Disc } from 'lucide-react';
import VoiceAvatar from './VoiceAvatar';
import { AgentBuilder } from './AgentBuilder';
import { CodeStudio } from './CodeStudio';
import { DailyDashboard } from './DailyDashboard';
import { ResearchLab } from './ResearchLab';
import { LanguageCenter } from './LanguageCenter';
import { AuroraBackground } from './AuroraBackground';
import { LoginScreen } from './LoginScreen';
import { AutomationPanel } from './AutomationPanel';
import { SystemMonitor } from './SystemMonitor';
import { SubtitleStream } from './SubtitleStream';
import { AgentMarketplace } from './AgentMarketplace';
import { KnowledgeBase } from './KnowledgeBase';
import { BioHub } from './BioHub';
import { CommunicationCenter } from './CommunicationCenter';
import { SystemControl } from './SystemControl';
import { TemporalCalendar } from './TemporalCalendar';
import { HistorySidebar } from './HistorySidebar';
import { Dreamscape } from './Dreamscape';
import { FinanceVault } from './FinanceVault';
import { SmartHome3D } from './SmartHome3D';
import { FocusMode } from './FocusMode';
import { GlobalAssistant } from './GlobalAssistant';
import { Agent, AppMode, AvatarState, VisualContext } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';

const SpecialWidget = ({ context }: { context: VisualContext }) => {
    if (context === VisualContext.DEFAULT) return null;
    let icon = <Sun size={18} />;
    let text = "Sunny 72°F";
    let color = "text-amber-300 border-amber-500/30 bg-amber-950/30";

    if (context === VisualContext.WEATHER_SUN) { icon = <Sun size={18} />; text = "Sunny 72°F"; color = "text-amber-300 border-amber-500/30 bg-amber-950/30"; }
    else if (context === VisualContext.WEATHER_RAIN) { icon = <CloudRain size={18} />; text = "Rain 65°F"; color = "text-blue-300 border-blue-500/30 bg-blue-950/30"; }
    else if (context === VisualContext.ALERT) { icon = <AlertTriangle size={18} />; text = "SYSTEM ALERT"; color = "text-red-300 border-red-500/30 bg-red-950/30"; }

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
  const [isMarketplaceOpen, setIsMarketplaceOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeAgent = agents.find(a => a.id === activeAgentId) || agents[0];
  const activeConversation = conversations.find(c => c.id === activeConversationId);
  const currentMessages = activeConversation?.messages || [];
  const latestMessage = currentMessages.length > 0 ? currentMessages[currentMessages.length - 1] : null;

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

  // Helper for agent status (Mocked for now)
  const getAgentStatus = (id: string) => {
      if (id === activeAgentId) return { color: 'bg-emerald-500', text: 'Active' };
      if (Math.random() > 0.7) return { color: 'bg-amber-500', text: 'Thinking' };
      return { color: 'bg-zinc-600', text: 'Idle' };
  };

  if (!isAuthenticated) return <LoginScreen />;

  return (
    <div className="flex w-full h-screen font-sans overflow-hidden text-zinc-300 bg-space selection:bg-white/20 relative">
      
      {/* === FOCUS MODE OVERLAY (Z-100) === */}
      <AnimatePresence>
          {mode === AppMode.FOCUS && <FocusMode />}
      </AnimatePresence>

      <AuroraBackground />
      <SystemMonitor />
      
      {/* Global Voice Assistant (Visible in non-VOICE modes) */}
      {mode !== AppMode.VOICE && <GlobalAssistant />}

      {/* --- Global History Sidebar (Z-50) --- */}
      <HistorySidebar isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} />

      {/* --- Sidebar (Z-40) --- */}
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

          {/* Nav List */}
          <div className="p-3 space-y-1 flex-1 overflow-y-auto custom-scrollbar">
             {[
                 { m: AppMode.VOICE, icon: Mic, l: 'Voice Link' },
                 { m: AppMode.DAILY, icon: Newspaper, l: 'Daily Feed' },
                 { m: AppMode.CODING, icon: Code, l: 'Code Studio' },
                 { m: AppMode.NOTES, icon: StickyNote, l: 'Second Brain' }, 
                 { m: AppMode.HEALTH, icon: Activity, l: 'Bio-Metric Hub' }, 
                 { m: AppMode.COMMS, icon: Smartphone, l: 'Neural Comms' }, 
                 { m: AppMode.CALENDAR, icon: Calendar, l: 'Temporal Nexus' }, 
                 // Power Utilities
                 { m: AppMode.ART, icon: Palette, l: 'Dreamscape' },
                 { m: AppMode.FINANCE, icon: Wallet, l: 'Finance Vault' },
                 { m: AppMode.HOME, icon: HomeIcon, l: 'Habitat 3D' },
                 { m: AppMode.FOCUS, icon: Disc, l: 'Sanctuary' },
                 { m: AppMode.RESEARCH, icon: FileText, l: 'Research Lab' },
                 { m: AppMode.LANGUAGE, icon: Languages, l: 'Language Coach' },
                 { m: AppMode.SYSTEM, icon: Grid, l: 'System Command' }, 
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

          {/* Bottom Actions */}
          <div className="p-3 border-t border-white/5 bg-black/20">
              <button 
                onClick={() => setIsHistoryOpen(!isHistoryOpen)} 
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-all ${isHistoryOpen ? 'text-cyan-400' : ''}`}
              >
                  <Clock size={14} /> Global History
              </button>
          </div>

          {/* Neural Nodes List with Status */}
          <div className="px-3 pb-3 pt-2">
              <div className="flex items-center justify-between mb-2 mt-1 px-2">
                  <h2 className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest font-mono">Neural Nodes</h2>
                  <div className="flex gap-2">
                      <ShoppingBag size={12} className="text-zinc-600 cursor-pointer hover:text-white transition-colors" onClick={() => setIsMarketplaceOpen(true)} />
                      <Plus size={12} className="text-zinc-600 cursor-pointer hover:text-white transition-colors" onClick={() => setEditingAgent({id: '', name: 'New Node', type: 'daily', primaryColor: '#ffffff', systemPrompt: '', avatarUrl: 'https://source.unsplash.com/random/200x200?tech'})} />
                  </div>
              </div>
              <div className="space-y-0.5 mb-2 max-h-32 overflow-y-auto custom-scrollbar">
                   {agents.map(a => {
                       const status = getAgentStatus(a.id);
                       return (
                           <button
                             key={a.id}
                             onClick={() => actions.setActiveAgent(a.id)}
                             className={`w-full text-left p-2 rounded-md text-xs transition-all flex items-center justify-between ${activeAgentId === a.id ? 'bg-white/10 text-white' : 'text-zinc-500 hover:bg-white/5 hover:text-zinc-300'}`}
                           >
                               <div className="flex items-center gap-2.5 overflow-hidden">
                                   <div className={`w-1.5 h-1.5 rounded-full ${activeAgentId === a.id ? 'bg-white' : 'bg-zinc-700'}`}></div>
                                   <span className="truncate">{a.name}</span>
                               </div>
                               {/* Agent Status Dot */}
                               <div title={status.text} className={`w-2 h-2 rounded-full ${status.color} shadow-lg`} />
                           </button>
                       );
                   })}
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

      {/* --- Main Content Area (Z-10) --- */}
      <div className="flex-1 relative h-full flex flex-col z-10 overflow-hidden bg-black/20">
          
          <AnimatePresence>
             <SpecialWidget context={visualContext} />
          </AnimatePresence>

          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className={`absolute top-5 left-5 z-50 p-2 glass-panel rounded-lg text-zinc-500 hover:text-white transition-all hover:scale-110 active:scale-95 ${!isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
             <Menu size={16} />
          </button>

          {/* === RENDER MODES === */}
          
          {/* Voice Mode */}
          <div className={`absolute inset-0 flex flex-col transition-all duration-700 ${mode === AppMode.VOICE ? 'opacity-100 z-20 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'}`}>
               <div className="absolute top-5 right-5 z-50 flex gap-2">
                   <button onClick={() => actions.setMode(AppMode.CODING)} className="glass-panel px-4 py-2 rounded-full text-xs font-mono text-zinc-400 hover:text-white hover:bg-white/10 transition-all flex items-center gap-2 animate-breath">
                       <Terminal size={12} /> ENTER TERMINAL
                   </button>
               </div>
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
                   {latestMessage && (
                       <SubtitleStream 
                           text={latestMessage.text} 
                           isUser={latestMessage.role === 'user'} 
                           isTyping={latestMessage.isTyping || false}
                       />
                   )}
                   <div className="flex-1"></div>
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

          {/* Standard Modes Container */}
          {[
            { m: AppMode.CODING, c: CodeStudio },
            { m: AppMode.DAILY, c: DailyDashboard },
            { m: AppMode.RESEARCH, c: ResearchLab },
            { m: AppMode.LANGUAGE, c: LanguageCenter },
            { m: AppMode.NOTES, c: KnowledgeBase },
            { m: AppMode.HEALTH, c: BioHub },
            { m: AppMode.COMMS, c: CommunicationCenter },
            { m: AppMode.SYSTEM, c: SystemControl },
            { m: AppMode.CALENDAR, c: TemporalCalendar },
            { m: AppMode.ART, c: Dreamscape },
            { m: AppMode.FINANCE, c: FinanceVault },
            { m: AppMode.HOME, c: SmartHome3D }
          ].map(({m, c: Component}) => (
              <div key={m} className={`absolute inset-0 flex transition-all duration-500 ${mode === m ? 'opacity-100 z-30 pointer-events-auto' : 'opacity-0 pointer-events-none scale-95'}`}>
                   <div className="w-full h-full glass-panel overflow-hidden bg-[#09090b]">
                       <Component />
                   </div>
              </div>
          ))}

          {/* Builder & Automation need padding wrapper */}
          {[
            { m: AppMode.BUILDER, c: AgentBuilder },
            { m: AppMode.AUTOMATION, c: AutomationPanel }
          ].map(({m, c: Component}) => (
              <div key={m} className={`absolute inset-0 p-4 transition-all duration-500 ${mode === m ? 'opacity-100 z-30 pointer-events-auto' : 'opacity-0 pointer-events-none scale-95'}`}>
                  <div className="w-full h-full glass-panel rounded-2xl overflow-hidden border-white/10 shadow-2xl bg-[#09090b]">
                     <Component />
                  </div>
              </div>
          ))}

      </div>

      {/* --- MODALS (Z-70: Fixed Overlay) --- */}
      
      {/* Agent Marketplace */}
      {isMarketplaceOpen && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center">
              <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={() => setIsMarketplaceOpen(false)} />
              <div className="relative z-10 w-full max-w-4xl h-[80vh]">
                  <AgentMarketplace onClose={() => setIsMarketplaceOpen(false)} />
              </div>
          </div>
      )}

      {/* Agent Config Modal */}
      {editingAgent && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-6">
              <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={() => setEditingAgent(null)} />
              <div className="relative z-10 glass-panel w-full max-w-2xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
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