import React, { useState, useEffect, useRef } from 'react';
import { Send, Mic, StopCircle, Sparkles, MoreVertical, Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppContext } from '../context/AppContext';
import { AvatarState } from '../types';

/**
 * GlobalAssistant Component
 * -------------------------
 * The main chat interface connecting the user to the Cortex Orchestrator.
 * It renders the conversation history and handles text/voice input.
 */
const GlobalAssistant: React.FC = () => {
  const { state, actions } = useAppContext();
  const { conversations, activeConversationId, activeAgentId, agents, avatarState } = state;

  // Local UI State
  const [input, setInput] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  
  // Refs for scrolling
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Derive current conversation and agent data
  const currentConversation = conversations.find(c => c.id === activeConversationId);
  const currentAgent = agents.find(a => a.id === activeAgentId) || agents[0];

  /**
   * Auto-scroll to bottom when new messages arrive.
   * Only scrolls if the user hasn't manually scrolled up significantly.
   */
  useEffect(() => {
    if (autoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentConversation?.messages, autoScroll]);

  /**
   * Handle scroll events to toggle auto-scroll.
   */
  const handleScroll = () => {
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
      setAutoScroll(isAtBottom);
    }
  };

  /**
   * Send Message Handler.
   */
  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim()) return;

    const textToSend = input;
    setInput(''); // Clear immediately for UX
    setAutoScroll(true);

    try {
      // Trigger the centralized logic in AppContext
      // This will handles UI updates and Backend Streaming
      await actions.sendMessage(textToSend);
    } catch (error) {
      console.error("Failed to send message:", error);
      // Ideally show a toast notification here
    }
  };

  /**
   * Voice Input Handler (Toggle).
   */
  const toggleListening = () => {
    const newState = !state.isListening;
    actions.setListening(newState);
    
    if (newState) {
      actions.setAvatarState(AvatarState.LISTENING);
      // In a real app, this would start the Web Speech API or AudioRecorder
      // For now, we simulate listening state visually.
    } else {
      actions.setAvatarState(AvatarState.IDLE);
    }
  };

  // --- RENDER HELPERS ---

  if (!currentConversation) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-zinc-500">
        <Bot size={48} className="mb-4 opacity-50" />
        <p>No active conversation.</p>
        <button 
          onClick={actions.createConversation}
          className="mt-4 px-4 py-2 bg-zinc-800 rounded-full text-sm text-zinc-300 hover:bg-zinc-700 transition-colors"
        >
          Start New Chat
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full relative overflow-hidden bg-black/20 backdrop-blur-sm rounded-3xl border border-white/5">
      
      {/* 1. HEADER */}
      <div className="flex items-center justify-between p-4 border-b border-white/5 bg-black/20 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10">
              <img 
                src={currentAgent.avatarUrl} 
                alt={currentAgent.name} 
                className="w-full h-full object-cover"
              />
            </div>
            {/* Status Indicator */}
            <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-black ${
              avatarState === AvatarState.SPEAKING ? 'bg-green-500 animate-pulse' : 
              avatarState === AvatarState.THINKING ? 'bg-yellow-500 animate-bounce' : 'bg-zinc-500'
            }`} />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm">{currentAgent.name}</h3>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase tracking-wider text-cyan-400 bg-cyan-950/30 px-1.5 py-0.5 rounded">
                {currentAgent.type}
              </span>
              {avatarState === AvatarState.THINKING && (
                <span className="text-xs text-zinc-500 animate-pulse">Thinking...</span>
              )}
            </div>
          </div>
        </div>
        
        <button className="p-2 hover:bg-white/5 rounded-full text-zinc-400 hover:text-white transition-colors">
          <MoreVertical size={18} />
        </button>
      </div>

      {/* 2. CHAT AREA (Scrollable) */}
      <div 
        ref={chatContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent"
      >
        {currentConversation.messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center opacity-30 select-none">
            <Sparkles size={64} strokeWidth={1} />
            <p className="mt-4 text-sm font-light">System Ready. Awaiting Input.</p>
          </div>
        ) : (
          currentConversation.messages.map((msg) => {
            const isAI = msg.role === 'ai' || msg.role === 'system';
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${isAI ? 'justify-start' : 'justify-end'}`}
              >
                <div 
                  className={`max-w-[80%] rounded-2xl p-4 shadow-lg ${
                    isAI 
                      ? 'bg-zinc-900/80 border border-white/5 text-zinc-200 rounded-tl-sm' 
                      : 'bg-gradient-to-br from-cyan-600 to-blue-700 text-white rounded-tr-sm'
                  }`}
                >
                  {/* Message Text */}
                  <div className="text-sm leading-relaxed whitespace-pre-wrap">
                    {msg.text}
                    {msg.isTyping && (
                      <span className="inline-block w-1.5 h-4 ml-1 align-middle bg-cyan-400 animate-pulse" />
                    )}
                  </div>
                  
                  {/* Metadata */}
                  <div className={`text-[10px] mt-2 opacity-40 flex items-center gap-2 ${isAI ? 'justify-start' : 'justify-end'}`}>
                    <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {isAI && msg.text.length > 0 && (
                      <span className="bg-white/10 px-1 rounded">{(msg.text.length / 500).toFixed(2)}s</span>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 3. INPUT AREA */}
      <div className="p-4 pt-2 bg-gradient-to-t from-black via-black/80 to-transparent z-20">
        <div className="relative flex items-center gap-2 bg-zinc-900/90 border border-white/10 p-1.5 rounded-full shadow-2xl focus-within:border-cyan-500/50 focus-within:ring-1 focus-within:ring-cyan-500/20 transition-all">
          
          {/* Voice Button */}
          <button 
            onClick={toggleListening}
            className={`p-3 rounded-full transition-all duration-300 ${
              state.isListening 
                ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 animate-pulse' 
                : 'hover:bg-white/10 text-zinc-400 hover:text-white'
            }`}
          >
            {state.isListening ? <StopCircle size={20} /> : <Mic size={20} />}
          </button>

          {/* Text Input */}
          <form onSubmit={handleSend} className="flex-1 flex">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={state.isListening ? "Listening..." : "Message Cortex..."}
              className="w-full bg-transparent border-none focus:ring-0 text-white placeholder-zinc-500 text-sm px-2"
              disabled={state.isListening || avatarState === AvatarState.THINKING}
            />
            
            {/* Send Button */}
            <button 
              type="submit"
              disabled={!input.trim() || avatarState === AvatarState.THINKING}
              className={`p-2.5 rounded-full ml-1 transition-all ${
                input.trim() 
                  ? 'bg-cyan-500 text-black hover:bg-cyan-400 hover:scale-105' 
                  : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
              }`}
            >
              <Send size={18} />
            </button>
          </form>
        </div>
        
        {/* Footer Hint */}
        <div className="text-center mt-2">
          <p className="text-[10px] text-zinc-600">
            Powered by <b>LocalAI Neural Engine v2.0</b>. Data is processed locally.
          </p>
        </div>
      </div>
    </div>
  );
};

export default GlobalAssistant;