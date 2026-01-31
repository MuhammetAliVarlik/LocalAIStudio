import React, { useState, useEffect, useRef } from 'react';
import { Send, Mic, StopCircle, Sparkles, MoreVertical, Bot, Keyboard, Loader2, X, Maximize2, Minimize2, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppContext } from '../context/AppContext';
import { AvatarState } from '../types';
import { SubtitleStream } from './SubtitleStream';
// Note: Ensure useAudioRecorder is created as per the previous step
import { useAudioRecorder } from '../hooks/useAudioRecorder'; 

// --- WAVEFORM COMPONENT ---
const InputWaveform = () => (
  <div className="flex items-center gap-1 h-8 px-4">
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          className="w-1 bg-red-400 rounded-full"
          animate={{ height: [8, 20, 8] }}
          transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.05 }}
        />
      ))}
  </div>
);

const GlobalAssistant: React.FC = () => {
  const { state, actions } = useAppContext();
  const { conversations, activeConversationId, activeAgentId, agents, avatarState } = state;
  const { startRecording, stopRecording, isRecording, isProcessing } = useAudioRecorder();

  // --- FLOATING WINDOW STATE ---
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false); // For full-screen mode

  // Local UI State
  const [input, setInput] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const currentConversation = conversations.find(c => c.id === activeConversationId);
  const currentAgent = agents.find(a => a.id === activeAgentId) || agents[0];
  const lastMessage = currentConversation?.messages[currentConversation.messages.length - 1];

  // Auto-Open on Voice Activity
  useEffect(() => {
    if (avatarState === AvatarState.SPEAKING || avatarState === AvatarState.LISTENING) {
        setIsOpen(true);
    }
  }, [avatarState]);

  useEffect(() => {
    if (autoScroll && messagesEndRef.current && isOpen) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentConversation?.messages, autoScroll, isOpen]);

  const handleScroll = () => {
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
      setAutoScroll(isAtBottom);
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim()) return;
    
    if (avatarState === AvatarState.SPEAKING) actions.interrupt();

    const textToSend = input;
    setInput(''); 
    setAutoScroll(true);
    await actions.sendMessage(textToSend);
  };

  const toggleListening = async () => {
    if (isRecording) {
      actions.setListening(false);
      actions.setAvatarState(AvatarState.THINKING);
      const transcribedText = await stopRecording();
      if (transcribedText) await actions.sendMessage(transcribedText);
      else actions.setAvatarState(AvatarState.IDLE);
    } else {
      if (avatarState === AvatarState.SPEAKING) actions.interrupt();
      actions.setListening(true);
      actions.setAvatarState(AvatarState.LISTENING);
      await startRecording();
    }
  };

  // --- UI RENDERERS ---

  const renderLauncher = () => (
    <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className={`fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-2xl border border-white/10 backdrop-blur-md transition-all duration-300 ${
            isOpen 
             ? 'bg-zinc-800 text-zinc-400 rotate-45' 
             : 'bg-cyan-500 text-black hover:bg-cyan-400 hover:shadow-cyan-500/50'
        }`}
    >
        {isOpen ? <MoreVertical size={24} /> : (
            <div className="relative">
                <Bot size={28} />
                {/* Notification Dot */}
                {avatarState === AvatarState.SPEAKING && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                )}
            </div>
        )}
    </motion.button>
  );

  const renderWindow = () => (
    <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20, x: 20 }}
        animate={{ 
            opacity: 1, 
            scale: 1, 
            y: 0, 
            x: 0,
            width: isExpanded ? 'calc(100vw - 48px)' : '400px',
            height: isExpanded ? 'calc(100vh - 120px)' : '600px',
        }}
        exit={{ opacity: 0, scale: 0.9, y: 20, x: 20 }}
        transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
        className={`fixed z-50 flex flex-col overflow-hidden bg-[#09090b]/90 backdrop-blur-xl border border-white/10 shadow-2xl ${
            isExpanded ? 'bottom-6 right-6 rounded-2xl' : 'bottom-24 right-6 rounded-3xl'
        }`}
    >
        {/* HEADER */}
        <div className="flex items-center justify-between p-4 border-b border-white/5 bg-white/5 cursor-move">
            <div className="flex items-center gap-3">
                <div className="relative">
                    <img src={currentAgent.avatarUrl} className="w-8 h-8 rounded-full border border-white/10 object-cover"/>
                    <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-black ${
                        avatarState === AvatarState.SPEAKING ? 'bg-green-500 animate-pulse' : 
                        avatarState === AvatarState.THINKING ? 'bg-yellow-500 animate-bounce' : 'bg-zinc-500'
                    }`} />
                </div>
                <div>
                    <h3 className="font-bold text-white text-sm">{currentAgent.name}</h3>
                    <span className="text-[10px] text-cyan-400 font-mono tracking-wider">{avatarState}</span>
                </div>
            </div>
            <div className="flex items-center gap-1">
                <button onClick={() => setIsExpanded(!isExpanded)} className="p-2 hover:bg-white/10 rounded-full text-zinc-400 hover:text-white transition-colors">
                    {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </button>
                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-red-500/20 rounded-full text-zinc-400 hover:text-red-400 transition-colors">
                    <X size={16} />
                </button>
            </div>
        </div>

        {/* CHAT CONTENT */}
        <div ref={chatContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
             {/* Fallback if empty */}
             {!currentConversation || currentConversation.messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-30 select-none text-center p-8">
                    <Sparkles size={48} strokeWidth={1} className="mb-4 text-cyan-500" />
                    <p className="text-sm font-light">How can I assist you today?</p>
                </div>
             ) : (
                currentConversation.messages.map(msg => {
                    const isAI = msg.role === 'ai';
                    return (
                        <motion.div 
                            key={msg.id} 
                            initial={{ opacity: 0, y: 5 }} 
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex ${isAI ? 'justify-start' : 'justify-end'}`}
                        >
                            <div className={`max-w-[85%] rounded-2xl p-3 text-sm shadow-md ${
                                isAI ? 'bg-zinc-800/80 text-zinc-200 rounded-tl-sm' : 'bg-cyan-600 text-white rounded-tr-sm'
                            }`}>
                                {msg.text}
                                {msg.isTyping && <span className="inline-block w-1.5 h-4 ml-1 align-middle bg-cyan-400 animate-pulse" />}
                            </div>
                        </motion.div>
                    )
                })
             )}
             <div ref={messagesEndRef} />
        </div>

        {/* INPUT FOOTER */}
        <div className="p-4 bg-gradient-to-t from-black/50 to-transparent">
            <div className={`relative flex items-center gap-2 bg-zinc-900 border border-white/10 p-1.5 rounded-full shadow-lg transition-all ${isRecording ? 'border-red-500/40' : 'focus-within:border-cyan-500/50'}`}>
                <button 
                    onClick={toggleListening}
                    disabled={isProcessing}
                    className={`p-2.5 rounded-full transition-all ${
                        isRecording ? 'bg-red-500 text-black animate-pulse' : 
                        isProcessing ? 'bg-zinc-700 text-zinc-500' : 
                        'hover:bg-white/10 text-zinc-400 hover:text-white'
                    }`}
                >
                    {isProcessing ? <Loader2 size={18} className="animate-spin"/> : isRecording ? <StopCircle size={18} /> : <Mic size={18} />}
                </button>

                <div className="flex-1">
                    {isRecording ? (
                        <div className="flex items-center justify-center h-full w-full">
                            <InputWaveform />
                        </div>
                    ) : (
                        <form onSubmit={handleSend} className="flex w-full">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Message..."
                                className="w-full bg-transparent border-none focus:ring-0 text-white placeholder-zinc-500 text-sm px-2"
                            />
                            <button type="submit" disabled={!input.trim()} className={`p-2 rounded-full ${input.trim() ? 'bg-cyan-600 text-white' : 'text-zinc-600'}`}>
                                <Send size={16} />
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    </motion.div>
  );

  return (
    <>
      {/* 1. Subtitles (Always visible if active, bottom centered) */}
      <div className="fixed bottom-0 left-0 right-0 z-[40] pointer-events-none flex justify-center pb-8">
         {lastMessage && (
            <div className="pointer-events-auto">
               <SubtitleStream 
                  text={lastMessage.text}
                  isUser={lastMessage.role === 'user'}
                  isTyping={lastMessage.isTyping || false}
               />
            </div>
         )}
      </div>

      {/* 2. Floating Chat Window */}
      <AnimatePresence>
        {isOpen && renderWindow()}
      </AnimatePresence>

      {/* 3. Floating Launcher Button */}
      {renderLauncher()}
    </>
  );
};

export default GlobalAssistant;