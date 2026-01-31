import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { 
  UserProfile, 
  AppMode, 
  Agent, 
  AutomationTask, 
  Conversation, 
  ChatMessage, 
  AvatarState, 
  VisualContext, 
  LoginCredentials,
  ShapeFunction
} from '../types';
import { AuthService } from '../api/services';
import { useChatStream } from '../hooks/useChatStream';

/**
 * INITIAL STATE CONSTANTS
 */
const DEFAULT_AGENT: Agent = {
  id: 'nova',
  name: 'Nova',
  type: 'daily',
  primaryColor: '#22d3ee',
  systemPrompt: 'You are Nova, an advanced AI assistant.',
  avatarUrl: 'https://ui-avatars.com/api/?name=Nova&background=22d3ee&color=fff',
  isCustom: false,
  voice: 'af_sarah'
};

interface AppState {
  isAuthenticated: boolean;
  user: UserProfile | null;
  mode: AppMode;
  agents: Agent[];
  activeAgentId: string;
  conversations: Conversation[];
  activeConversationId: string;
  automationTasks: AutomationTask[];
  avatarState: AvatarState;
  visualContext: VisualContext;
  audioLevel: number;
  isListening: boolean;
  customShapeFn?: ShapeFunction;
}

interface AppActions {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  setMode: (mode: AppMode) => void;
  setActiveAgent: (id: string) => void;
  sendMessage: (text: string) => Promise<void>;
  setActiveConversation: (id: string) => void;
  createConversation: () => void;
  setAvatarState: (state: AvatarState) => void;
  setListening: (isListening: boolean) => void;
  // NEW: Action to trigger interruption
  interrupt: () => void;
}

const AppContext = createContext<{ state: AppState; actions: AppActions } | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // --- AUTH STATE ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);

  // --- APP STATE ---
  const [mode, setMode] = useState<AppMode>(AppMode.VOICE);
  const [agents, setAgents] = useState<Agent[]>([DEFAULT_AGENT]);
  const [activeAgentId, setActiveAgentId] = useState<string>('nova');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string>('');
  const [automationTasks, setAutomationTasks] = useState<AutomationTask[]>([]);

  // --- AVATAR & AUDIO STATE ---
  const [avatarState, setAvatarState] = useState<AvatarState>(AvatarState.IDLE);
  const [visualContext, setVisualContext] = useState<VisualContext>(VisualContext.DEFAULT);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [customShapeFn, setCustomShapeFn] = useState<ShapeFunction | undefined>(undefined);

  // --- WEBSOCKET & AUDIO HOOKS ---
  const chatStream = useChatStream();
  
  // Audio Playback Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioQueueRef = useRef<ArrayBuffer[]>([]);
  const isPlayingRef = useRef(false);
  // NEW: Ref to the currently playing source to allow stopping it
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number>();

  // --- INIT EFFECT ---
  useEffect(() => {
    const initApp = async () => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        try {
          const userProfile = await AuthService.me();
          setUser({
            id: userProfile.id,
            name: userProfile.username,
            role: 'admin',
            avatarUrl: `https://ui-avatars.com/api/?name=${userProfile.username}`
          });
          setIsAuthenticated(true);
        } catch (error) {
          console.warn("Session expired or invalid token");
          logout();
        }
      }
    };
    initApp();
    
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  /**
   * AUDIO PLAYER LOGIC
   */
  const processAudioQueue = async () => {
    if (isPlayingRef.current || audioQueueRef.current.length === 0) return;
    
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioContextRef.current;
    if (ctx.state === 'suspended') await ctx.resume();

    isPlayingRef.current = true;
    setAvatarState(AvatarState.SPEAKING);

    try {
      const chunk = audioQueueRef.current.shift()!;
      const audioBuffer = await ctx.decodeAudioData(chunk);
      
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      // Store reference to stop it later if interrupted
      currentSourceRef.current = source;

      if (!analyserRef.current) {
        analyserRef.current = ctx.createAnalyser();
        analyserRef.current.fftSize = 32;
      }
      const analyser = analyserRef.current;
      source.connect(analyser);
      analyser.connect(ctx.destination);

      const updateVisualizer = () => {
        if (!isPlayingRef.current) return;
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b) / dataArray.length;
        setAudioLevel(avg);
        animationFrameRef.current = requestAnimationFrame(updateVisualizer);
      };
      updateVisualizer();

      source.start(0);
      
      source.onended = () => {
        // Only clear if this was the source we were tracking
        if (currentSourceRef.current === source) {
            currentSourceRef.current = null;
        }
        isPlayingRef.current = false;
        
        if (audioQueueRef.current.length > 0) {
          processAudioQueue();
        } else {
          setAvatarState(AvatarState.IDLE);
          setAudioLevel(0);
          if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        }
      };

    } catch (e) {
      console.error("Audio playback error:", e);
      isPlayingRef.current = false;
      setAvatarState(AvatarState.IDLE);
    }
  };

  /**
   * ACTIONS
   */

  // NEW: Interrupt Logic (Barge-In)
  const interrupt = () => {
    // 1. Stop Audio Backend (Simulated via frontend ignore for now)
    // We send a signal so backend stops generating *next* sentences
    if (chatStream.isConnected) {
        // We use the generic send if available, or hack a "user_message" type "interrupt"
        // Ideally useChatStream should expose a generic 'send' method. 
        // Assuming we can send a custom JSON:
        // @ts-ignore - Assuming implementation allows raw send or we add it
        chatStream.send ? chatStream.send({ type: 'interrupt' }) : console.warn("Cannot send interrupt signal");
    }

    // 2. Stop Frontend Audio Immediately
    if (currentSourceRef.current) {
        try { currentSourceRef.current.stop(); } catch(e) {}
        currentSourceRef.current = null;
    }
    // Clear buffer
    audioQueueRef.current = [];
    isPlayingRef.current = false;
    setAvatarState(AvatarState.IDLE);
    setAudioLevel(0);
  };

  const login = async (credentials: LoginCredentials) => {
    const data = await AuthService.login(credentials);
    localStorage.setItem('auth_token', data.access_token);
    const userProfile = await AuthService.me();
    setUser({
      id: userProfile.id,
      name: userProfile.username,
      role: 'admin',
      avatarUrl: `https://ui-avatars.com/api/?name=${userProfile.username}`
    });
    setIsAuthenticated(true);
    createConversation();
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    setIsAuthenticated(false);
    setUser(null);
    setConversations([]);
    chatStream.disconnect();
  };

  const createConversation = () => {
    const newId = Date.now().toString();
    const newConv: Conversation = {
      id: newId,
      agentId: activeAgentId,
      title: 'New Chat',
      messages: [],
      lastActive: new Date()
    };
    setConversations(prev => [newConv, ...prev]);
    setActiveConversationId(newId);
  };

  const setActiveConversation = (id: string) => {
    setActiveConversationId(id);
  };

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    // --- BARGE-IN CHECK ---
    // If AI is speaking, interrupt first
    if (avatarState === AvatarState.SPEAKING || avatarState === AvatarState.THINKING) {
        interrupt();
        // Give a tiny delay for cleanup if needed, but usually instant is fine
    }

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text,
      timestamp: new Date()
    };
    
    const aiPlaceholder: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'ai',
      text: '', 
      timestamp: new Date(),
      isTyping: true
    };

    let targetId = activeConversationId;
    if (!targetId) {
       targetId = Date.now().toString();
       const newConv: Conversation = {
        id: targetId,
        agentId: activeAgentId,
        title: 'New Chat',
        messages: [],
        lastActive: new Date()
      };
      setConversations(prev => [newConv, ...prev]);
      setActiveConversationId(targetId);
    }

    setConversations(prev => prev.map(c => 
      c.id === targetId 
        ? { ...c, messages: [...c.messages, userMsg, aiPlaceholder] } 
        : c
    ));

    setAvatarState(AvatarState.THINKING);

    if (chatStream.isConnected) {
      chatStream.sendMessage(text);
    } else {
      // Reconnect logic
      chatStream.connect(targetId, activeAgentId, {
          onTextChunk: (t) => { 
             setConversations(prev => prev.map(c => {
               if (c.id !== targetId) return c;
               const msgs = [...c.messages];
               const last = msgs[msgs.length-1];
               if(last?.role === 'ai') last.text += t;
               return { ...c, messages: msgs };
             }));
          },
          onAudioChunk: (b) => {
            if (b.byteLength > 0) {
                audioQueueRef.current.push(b.slice(0));
                processAudioQueue();
            }
          },
          onComplete: () => {
             setConversations(prev => prev.map(c => 
               c.id === targetId 
               ? { ...c, messages: c.messages.map((m,i,a) => i===a.length-1 ? {...m, isTyping:false} : m) }
               : c
             ));
          },
          onError: (e) => console.error(e)
      });
      setTimeout(() => chatStream.sendMessage(text), 500);
    }
  };

  // --- WS CONNECTION (Keep this from previous fix) ---
  useEffect(() => {
    if (!activeConversationId || !isAuthenticated) return;
    chatStream.connect(activeConversationId, activeAgentId, {
      onTextChunk: (text) => {
        setConversations(prev => prev.map(c => {
          if (c.id !== activeConversationId) return c;
          const messages = [...c.messages];
          const lastMsg = messages[messages.length - 1];
          if (lastMsg && lastMsg.role === 'ai') {
             return {
               ...c,
               messages: messages.map((m, idx) => 
                 idx === messages.length - 1 ? { ...m, text: m.text + text } : m
               )
             };
          }
          return c;
        }));
      },
      onAudioChunk: (buffer) => {
        if (buffer.byteLength > 0) {
          audioQueueRef.current.push(buffer.slice(0));
          processAudioQueue();
        }
      },
      onComplete: () => {
        setConversations(prev => prev.map(c => 
          c.id === activeConversationId
          ? { 
              ...c, 
              messages: c.messages.map((m, i) => 
                i === c.messages.length - 1 && m.role === 'ai' 
                  ? { ...m, isTyping: false } 
                  : m
              ) 
            }
          : c
        ));
      },
      onError: (err) => {
        console.error("WS Error:", err);
        setAvatarState(AvatarState.IDLE);
      }
    });
    return () => { audioQueueRef.current = []; };
  }, [activeConversationId, activeAgentId, isAuthenticated]);

  return (
    <AppContext.Provider value={{
      state: {
        isAuthenticated, user, mode, agents, activeAgentId,
        conversations, activeConversationId, automationTasks,
        avatarState, visualContext, audioLevel, isListening, customShapeFn
      },
      actions: {
        login, logout, setMode, setActiveAgent: setActiveAgentId,
        sendMessage, setActiveConversation, createConversation,
        setAvatarState, setListening: setIsListening,
        interrupt // Exported
      }
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) throw new Error('useAppContext must be used within an AppProvider');
  return context;
};