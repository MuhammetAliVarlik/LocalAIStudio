import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
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
import { AuthService, CortexService, FinanceService } from '../api/services';

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
  
  // Audio/Visual State
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
  
  // Agent & Chat
  setActiveAgent: (id: string) => void;
  sendMessage: (text: string) => Promise<void>;
  setActiveConversation: (id: string) => void;
  createConversation: () => void;
  
  // Audio/Visual Control
  setAvatarState: (state: AvatarState) => void;
  setListening: (isListening: boolean) => void;
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

  // --- AVATAR STATE ---
  const [avatarState, setAvatarState] = useState<AvatarState>(AvatarState.IDLE);
  const [visualContext, setVisualContext] = useState<VisualContext>(VisualContext.DEFAULT);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [customShapeFn, setCustomShapeFn] = useState<ShapeFunction | undefined>(undefined);

  // --- INIT EFFECT ---
  useEffect(() => {
    const initApp = async () => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        try {
          // Verify token and get user profile
          const userProfile = await AuthService.me();
          setUser({
            id: userProfile.id,
            name: userProfile.username,
            role: 'admin', // Default role for now
            avatarUrl: `https://ui-avatars.com/api/?name=${userProfile.username}`
          });
          setIsAuthenticated(true);
          
          // Load Agents (Personas)
          // const personas = await CortexService.getPersonas(); 
          // setAgents(personas);
        } catch (error) {
          console.warn("Session expired or invalid token");
          logout();
        }
      }
    };
    initApp();
  }, []);

  // --- ACTIONS ---

  const login = async (credentials: LoginCredentials) => {
    try {
      const data = await AuthService.login(credentials);
      localStorage.setItem('auth_token', data.access_token);
      
      // Get User Details
      const userProfile = await AuthService.me();
      setUser({
        id: userProfile.id,
        name: userProfile.username,
        role: 'admin',
        avatarUrl: `https://ui-avatars.com/api/?name=${userProfile.username}`
      });
      setIsAuthenticated(true);
      
      // Initialize first conversation
      createConversation();

    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    setIsAuthenticated(false);
    setUser(null);
    setConversations([]);
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

  /**
   * Sending a message handles:
   * 1. Updating UI immediately with user message.
   * 2. Creating a placeholder AI message.
   * 3. Streaming response from Cortex (using fetch/reader manually or via service).
   */
  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    // 1. Add User Message
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text,
      timestamp: new Date()
    };

    // Ensure conversation exists
    let targetId = activeConversationId;
    if (!targetId) {
      const newId = Date.now().toString();
      const newConv: Conversation = {
        id: newId,
        agentId: activeAgentId,
        title: text.substring(0, 20) + '...',
        messages: [userMsg],
        lastActive: new Date()
      };
      setConversations(prev => [newConv, ...prev]);
      targetId = newId;
      setActiveConversationId(newId);
    } else {
      setConversations(prev => prev.map(c => 
        c.id === targetId 
          ? { ...c, messages: [...c.messages, userMsg], lastActive: new Date() } 
          : c
      ));
    }

    // 2. Prepare AI Placeholder
    const aiMsgId = (Date.now() + 1).toString();
    const aiPlaceholder: ChatMessage = {
      id: aiMsgId,
      role: 'ai',
      text: '', // Will fill this via stream
      timestamp: new Date(),
      isTyping: true
    };

    setConversations(prev => prev.map(c => 
      c.id === targetId 
        ? { ...c, messages: [...c.messages, aiPlaceholder] } 
        : c
    ));
    setAvatarState(AvatarState.THINKING);

    // 3. Stream Response
    // Note: We use the hook logic inside component usually, but here we do it in Context 
    // to keep global state sync.
    try {
      // Get token for raw fetch
      const token = localStorage.getItem('auth_token');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      
      const response = await fetch(`${API_URL}/cortex/interact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          query: text,
          session_id: targetId,
          enable_memory: true
        })
      });

      if (!response.body) throw new Error("No stream");
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      setAvatarState(AvatarState.SPEAKING);

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        // Parse SSE: data: {"content": "..."}
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonStr = line.slice(6);
            if (jsonStr === '[DONE]') continue;
            try {
              const data = JSON.parse(jsonStr);
              if (data.content) {
                fullText += data.content;
                
                // Update UI incrementally
                setConversations(prev => prev.map(c => 
                  c.id === targetId 
                    ? { 
                        ...c, 
                        messages: c.messages.map(m => 
                          m.id === aiMsgId ? { ...m, text: fullText } : m
                        ) 
                      } 
                    : c
                ));
              }
            } catch (e) { /* ignore parse errors */ }
          }
        }
      }
      
      // Finalize
      setConversations(prev => prev.map(c => 
        c.id === targetId 
          ? { 
              ...c, 
              messages: c.messages.map(m => 
                m.id === aiMsgId ? { ...m, isTyping: false } : m
              ) 
            } 
          : c
      ));
      setAvatarState(AvatarState.IDLE);

    } catch (error) {
      console.error("Stream failed", error);
      setAvatarState(AvatarState.IDLE);
      // Ideally update message to show error
    }
  };

  return (
    <AppContext.Provider value={{
      state: {
        isAuthenticated,
        user,
        mode,
        agents,
        activeAgentId,
        conversations,
        activeConversationId,
        automationTasks,
        avatarState,
        visualContext,
        audioLevel,
        isListening,
        customShapeFn
      },
      actions: {
        login,
        logout,
        setMode,
        setActiveAgent: setActiveAgentId,
        sendMessage,
        setActiveConversation,
        createConversation,
        setAvatarState,
        setListening: setIsListening
      }
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};