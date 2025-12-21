import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Mic, Code, Send, Plus, Menu, Settings, Sparkles, Brain, Zap, LogOut, 
  Sun, Clock, AlertTriangle, X, Terminal, Volume2, CloudRain, ShoppingBag, 
  Activity, Calendar, StickyNote, Smartphone, Grid, Palette, Wallet, 
  Home as HomeIcon, Disc, Newspaper, Languages, FileText 
} from 'lucide-react';
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

export const DashboardShell: React.FC = () => {
  const { state, actions } = useApp();
  const { user, isAuthenticated, mode, agents, activeAgentId, conversations, activeConversationId, avatarState, visualContext, audioLevel, customShapeFn } = state;
  
  const [input, setInput] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [isMarketplaceOpen, setIsMarketplaceOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeAgent = useMemo(() => agents.find(a => a.id === activeAgentId) || agents[0], [agents, activeAgentId]);
  const activeConversation = conversations.find(c => c.id === activeConversationId);
  const currentMessages = activeConversation?.messages || [];
  const latestMessage = currentMessages.length > 0 ? currentMessages[currentMessages.length - 1] : null;

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [currentMessages, mode]);

  const handleSendMessage = () => {
      if (!input.trim()) return;
      actions.sendMessage(input);
      setInput('');
  };

  const handleSaveAgent = () => {
      if(!editingAgent) return;
      if (agents.find(a => a.id === editingAgent.id)) actions.updateAgent(editingAgent);
      else actions.addAgent(editingAgent);
      setEditingAgent(null);
  };

  if (!isAuthenticated) return <LoginScreen />;

  // Component Map
  const COMPONENTS: any = {
    [AppMode.CODING]: CodeStudio, [AppMode.DAILY]: DailyDashboard, [AppMode.RESEARCH]: ResearchLab,
    [AppMode.LANGUAGE]: LanguageCenter, [AppMode.NOTES]: KnowledgeBase, [AppMode.HEALTH]: BioHub,
    [AppMode.COMMS]: CommunicationCenter, [AppMode.SYSTEM]: SystemControl, [AppMode.CALENDAR]: TemporalCalendar,
    [AppMode.ART]: Dreamscape, [AppMode.FINANCE]: FinanceVault, [AppMode.HOME]: SmartHome3D,
    [AppMode.BUILDER]: AgentBuilder, [AppMode.AUTOMATION]: AutomationPanel,
  };
  const ActiveComponent = COMPONENTS[mode] || DailyDashboard;

  return (
    <div className="flex w-full h-screen font-sans overflow-hidden text-zinc-300 bg-space selection:bg-white/20 relative">
      <AnimatePresence>{mode === AppMode.FOCUS && <FocusMode />}</AnimatePresence>
      {mode !== AppMode.HOME && mode !== AppMode.ART && <AuroraBackground />}
      <SystemMonitor />
      {mode !== AppMode.VOICE && <GlobalAssistant />}
      <HistorySidebar isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} />

      {/* SIDEBAR */}
      <motion.div initial={{ width: 280 }} animate={{ width: isSidebarOpen ? 280 : 0 }} className="flex-shrink-0 glass-panel border-r-0 border-r-white/5 flex flex-col z-40 m-3 rounded-2xl relative overflow-hidden shadow-2xl bg-black/80">
          <div className="p-5 border-b border-white/5">
              <div className="flex items-center justify-between mb-6">
                 <div className="flex items-center gap-2 text-white font-bold tracking-wider text-xs uppercase animate-breath"><Sparkles size={12} /> Local OS</div>
                 <button className="text-zinc-500 hover:text-white transition-colors" onClick={actions.logout}><LogOut size={14} /></button>
              </div>
              <div className="flex items-center gap-3 group cursor-pointer hover:bg-white/5 p-2 -mx-2 rounded-xl transition-all">
                  <div className="w-10 h-10 rounded-lg p-0.5 bg-gradient-to-br from-zinc-700 to-black shadow-lg relative overflow-hidden border border-white/10">
                      <img src={activeAgent.avatarUrl} className="w-full h-full rounded-[6px] object-cover grayscale group-hover:grayscale-0 transition-all" alt="agent" />
                  </div>
                  <div>
                      <h3 className="font-bold text-white text-sm tracking-tight group-hover:text-cyan-200 transition-colors">{activeAgent.name}</h3>
                      <div className="flex items-center gap-2 mt-0.5"><span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{backgroundColor: activeAgent.primaryColor}}></span><span className="text-[9px] text-zinc-500 font-mono uppercase">{activeAgent.type}</span></div>
                  </div>
              </div>
          </div>

          <div className="p-3 space-y-1 flex-1 overflow-y-auto custom-scrollbar">
             {[
                 { m: AppMode.VOICE, icon: Mic, l: 'Voice Link' }, { m: AppMode.DAILY, icon: Newspaper, l: 'Daily Feed' },
                 { m: AppMode.CODING, icon: Code, l: 'Code Studio' }, { m: AppMode.NOTES, icon: StickyNote, l: 'Second Brain' }, 
                 { m: AppMode.HEALTH, icon: Activity, l: 'Bio-Metric Hub' }, { m: AppMode.COMMS, icon: Smartphone, l: 'Neural Comms' }, 
                 { m: AppMode.CALENDAR, icon: Calendar, l: 'Temporal Nexus' }, { m: AppMode.ART, icon: Palette, l: 'Dreamscape' },
                 { m: AppMode.FINANCE, icon: Wallet, l: 'Finance Vault' }, { m: AppMode.HOME, icon: HomeIcon, l: 'Habitat 3D' },
                 { m: AppMode.FOCUS, icon: Disc, l: 'Sanctuary' }, { m: AppMode.RESEARCH, icon: FileText, l: 'Research Lab' },
                 { m: AppMode.LANGUAGE, icon: Languages, l: 'Language Coach' }, { m: AppMode.SYSTEM, icon: Grid, l: 'System Command' }, 
                 { m: AppMode.BUILDER, icon: Brain, l: 'Agent Forge' }, { m: AppMode.AUTOMATION, icon: Zap, l: 'Automations' }
             ].map(item => (
                <button key={item.m} onClick={() => actions.setMode(item.m)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-300 ${mode === item.m ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.3)] animate-breath' : 'text-zinc-400 hover:bg-white/10 hover:text-white'}`}>
                    <item.icon size={14} className={mode === item.m ? 'text-black' : 'text-zinc-500'} /> {item.l}
                </button>
             ))}
          </div>

          <div className="p-3 border-t border-white/5 bg-black/20">
              <button onClick={() => setIsHistoryOpen(!isHistoryOpen)} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-all ${isHistoryOpen ? 'text-cyan-400' : ''}`}><Clock size={14} /> Global History</button>
          </div>

          <div className="px-3 pb-3 pt-2">
              <div className="flex items-center justify-between mb-2 mt-1 px-2">
                  <h2 className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest font-mono">Neural Nodes</h2>
                  <div className="flex gap-2">
                      <ShoppingBag size={12} className="text-zinc-600 cursor-pointer hover:text-white transition-colors" onClick={() => setIsMarketplaceOpen(true)} />
                      <Plus size={12} className="text-zinc-600 cursor-pointer hover:text-white transition-colors" onClick={() => setEditingAgent({id: '', name: 'New Node', type: 'daily', primaryColor: '#ffffff', systemPrompt: '', avatarUrl: 'https://source.unsplash.com/random/200x200?tech'} as Agent)} />
                  </div>
              </div>
              <div className="space-y-0.5 mb-2 max-h-32 overflow-y-auto custom-scrollbar">
                   {agents.map(a => (
                       <button key={a.id} onClick={() => actions.setActiveAgent(a.id)} className={`w-full text-left p-2 rounded-md text-xs transition-all flex items-center justify-between ${activeAgentId === a.id ? 'bg-white/10 text-white' : 'text-zinc-500 hover:bg-white/5 hover:text-zinc-300'}`}>
                           <div className="flex items-center gap-2.5 overflow-hidden">
                               <div className={`w-1.5 h-1.5 rounded-full ${activeAgentId === a.id ? 'bg-white' : 'bg-zinc-700'}`}></div><span className="truncate">{a.name}</span>
                           </div>
                           <div className={`w-2 h-2 rounded-full ${activeAgentId === a.id ? 'bg-emerald-500' : 'bg-zinc-600'} shadow-lg`} />
                       </button>
                   ))}
              </div>
          </div>
      </motion.div>

      {/* MAIN CONTENT */}
      <div className="flex-1 relative h-full flex flex-col z-10 overflow-hidden bg-black/20">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className={`absolute top-5 left-5 z-50 p-2 glass-panel rounded-lg text-zinc-500 hover:text-white transition-all hover:scale-110 active:scale-95 ${!isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}><Menu size={16} /></button>

          {/* VOICE MODE */}
          <div className={`absolute inset-0 flex flex-col transition-all duration-700 ${mode === AppMode.VOICE ? 'opacity-100 z-20 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'}`}>
               <div className="absolute top-5 right-5 z-50 flex gap-2">
                   <button onClick={() => actions.setMode(AppMode.CODING)} className="glass-panel px-4 py-2 rounded-full text-xs font-mono text-zinc-400 hover:text-white hover:bg-white/10 transition-all flex items-center gap-2 animate-breath"><Terminal size={12} /> ENTER TERMINAL</button>
               </div>
               <div className="absolute inset-0 flex items-center justify-center z-0">
                   {mode === AppMode.VOICE && (
                       <VoiceAvatar state={avatarState} visualContext={visualContext} audioLevel={audioLevel} primaryColor={activeAgent.primaryColor} visible={true} customShapeFn={customShapeFn} onPersonaChange={(id) => actions.setActiveAgent(id)} />
                   )}
               </div>
               <div className="absolute inset-0 flex flex-col z-10 p-6 md:p-12 pointer-events-none">
                   {latestMessage && <SubtitleStream text={latestMessage.text} isUser={latestMessage.role === 'user'} isTyping={latestMessage.isTyping || false} />}
                   <div className="flex-1"></div>
                   <div className="w-full max-w-2xl mx-auto pointer-events-auto relative">
                       <div className="glass-panel rounded-full p-2 pl-6 flex items-center gap-4 bg-black/80 backdrop-blur-xl border border-white/10 shadow-2xl animate-breath">
                           <button onClick={() => actions.setAvatarState(avatarState === AvatarState.LISTENING ? AvatarState.IDLE : AvatarState.LISTENING)} className={`p-3 rounded-full transition-all duration-300 ${avatarState === AvatarState.LISTENING ? 'bg-red-500/20 text-red-400 animate-pulse' : 'bg-white/5 text-zinc-400 hover:text-white'}`}>{avatarState === AvatarState.LISTENING ? <Volume2 size={20} /> : <Mic size={20} />}</button>
                           <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} placeholder={`Chat with ${activeAgent.name}...`} className="flex-1 bg-transparent border-none outline-none text-white placeholder-zinc-600 px-2 text-base h-12 font-light" />
                           <button onClick={handleSendMessage} className="p-3 bg-white/10 text-white rounded-full hover:bg-white/20 transition-all active:scale-95"><Send size={18} /></button>
                       </div>
                   </div>
               </div>
          </div>

          {/* ACTIVE APP */}
          <div className="relative w-full h-full z-10 pointer-events-auto">
              {mode !== AppMode.VOICE && ActiveComponent ? (
                  mode === AppMode.BUILDER || mode === AppMode.AUTOMATION ? (
                      <div className="p-4 h-full"><div className="w-full h-full glass-panel rounded-2xl overflow-hidden bg-[#09090b]"><ActiveComponent /></div></div>
                  ) : (
                      <div className="w-full h-full glass-panel overflow-hidden bg-[#09090b] rounded-none md:rounded-l-2xl border-l border-white/10"><ActiveComponent /></div>
                  )
              ) : null}
          </div>
      </div>
    </div>
  );
};