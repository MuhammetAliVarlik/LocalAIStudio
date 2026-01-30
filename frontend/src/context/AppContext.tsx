import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Agent, AppMode, AutomationTask, AvatarState, ChatMessage, Conversation, UserProfile, VisualContext, ShapeFunction } from '../types';

/**
 * CONFIGURATION
 * Retrieves API URL from environment variables or defaults to localhost.
 */
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// --- MOCK DATA (Fallback & UI Testing) ---
const MOCK_USER: UserProfile = {
  id: 'u1',
  name: 'Architect',
  role: 'admin',
  avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop'
};

const FALLBACK_AGENTS: Agent[] = [
    { 
        id: 'nova', name: 'Nova', type: 'daily', primaryColor: '#22d3ee', 
        systemPrompt: 'You are Nova, a helpful daily assistant.', 
        avatarUrl: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=400&auto=format&fit=crop', isCustom: false,
        voice: 'af_sarah'
    }
];

const INITIAL_TASKS: AutomationTask[] = [
    { id: '1', type: 'WEB', name: 'Neural News Scraper', description: 'Aggregates tech news every morning.', status: 'running', lastRun: '2 min ago', efficiency: 98 },
    { id: '2', type: 'WEB', name: 'Inbox Zero Agent', description: 'Drafts email replies based on priority.', status: 'success', lastRun: '4 hours ago', efficiency: 100 },
    { id: '3', type: 'WEB', name: 'Code Refactor Bot', description: 'Optimizes Python scripts in /src.', status: 'idle', lastRun: 'Yesterday', efficiency: 88 },
];

const INITIAL_CONVERSATION: Conversation = { 
    id: '1', agentId: 'nova', title: 'System Initialization', lastActive: new Date(), 
    messages: [
        { id: '1', role: 'system', text: 'Neural Interface v2.4.0 initialized.', timestamp: new Date(Date.now() - 10000) },
        { id: '2', role: 'ai', text: "Systems online. I am ready to assist you, Architect. What is our focus today?", timestamp: new Date() }
    ] 
};

// --- TYPES ---
interface AppState {
    user: UserProfile | null;
    isAuthenticated: boolean;
    mode: AppMode;
    agents: Agent[];
    activeAgentId: string;
    conversations: Conversation[];
    activeConversationId: string;
    automationTasks: AutomationTask[];
    avatarState: AvatarState;
    visualContext: VisualContext; 
    audioLevel: number;
    customShapeFn?: ShapeFunction;
    isListening?: boolean; 
}

interface AppActions {
    // Authenticate user with backend (Modified to support Remember Me)
    login: (username?: string, password?: string, rememberMe?: boolean) => Promise<void>;
    register: (username: string, password: string, fullName: string) => Promise<string>; // Returns Recovery Key
    resetPassword: (username: string, recoveryKey: string, newPass: string) => Promise<string>; // Returns New Key
    logout: () => void;
    
    // Mode & Navigation
    setMode: (mode: AppMode) => void;
    
    // Agent Management
    setActiveAgent: (id: string) => void;
    addAgent: (agent: Agent) => void;
    updateAgent: (agent: Agent) => void;
    deleteAgent: (id: string) => void;
    
    // Chat & Communications
    sendMessage: (text: string) => Promise<void>;
    setActiveConversation: (id: string) => void;
    createConversation: () => void;
    
    // Task Automation
    addTask: (task: AutomationTask) => void;
    toggleTaskStatus: (id: string) => void;
    deleteTask: (id: string) => void;
    
    // Voice & Avatar Control
    setAvatarState: (state: AvatarState) => void;
    setListening: (listening: boolean) => void;
    speak: (text: string) => Promise<void>;
}

// Create Context
const AppContext = createContext<{ state: AppState; actions: AppActions } | null>(null);

/**
 * AppProvider
 * Main state container for the application. Handles Authentication, 
 * Agent synchronization, and Real-time Voice/Chat interactions.
 */
export const AppProvider = ({ children }: { children: ReactNode }) => {
    
    // --- AUTH STATE ---
    const [isAuthenticated, setIsAuthenticated] = useState(false); 
    const [user, setUser] = useState<UserProfile | null>(null);
    
    // --- APP STATE ---
    const [mode, setMode] = useState<AppMode>(AppMode.VOICE);
    const [agents, setAgents] = useState<Agent[]>(FALLBACK_AGENTS);
    const [activeAgentId, setActiveAgentId] = useState<string>('nova');
    const [conversations, setConversations] = useState<Conversation[]>([INITIAL_CONVERSATION]);
    const [activeConversationId, setActiveConversationId] = useState<string>('1');
    const [automationTasks, setAutomationTasks] = useState<AutomationTask[]>(INITIAL_TASKS);
    
    // --- AVATAR & AUDIO STATE ---
    const [avatarState, setAvatarState] = useState<AvatarState>(AvatarState.IDLE);
    const [visualContext, setVisualContext] = useState<VisualContext>(VisualContext.DEFAULT);
    const [audioLevel, setAudioLevel] = useState(0);
    const [audioQueue, setAudioQueue] = useState<string[]>([]);
    const [isProcessingAudio, setIsProcessingAudio] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [customShapeFn, setCustomShapeFn] = useState<ShapeFunction | undefined>(undefined);

    /**
     * INITIALIZATION EFFECT
     * Checks both LocalStorage (Persistent) and SessionStorage (Temporary)
     * to restore the user session on app load.
     */
    useEffect(() => {
        // Priority: Check Persistent first, then Session
        const token = localStorage.getItem('neural_token') || sessionStorage.getItem('neural_token');
        
        if (token) {
            console.log("🔹 Restoring session...");
            // In a production app, verify token validity here via /api/users/me
            setIsAuthenticated(true);
            setUser(MOCK_USER);
        }
    }, []);

    /**
     * FETCH AGENTS EFFECT
     * Syncs available personas from the Python backend.
     */
    useEffect(() => {
        if (!isAuthenticated) return;

        fetch(`${API_URL}/api/personas`)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data) && data.length > 0) {
                    const mappedAgents: Agent[] = data.map((p: any) => ({
                        id: p.id,
                        name: p.name,
                        type: 'daily',
                        primaryColor: p.color || '#22d3ee',
                        systemPrompt: p.system_prompt,
                        avatarUrl: `https://ui-avatars.com/api/?name=${p.name}&background=random`, 
                        isCustom: p.id !== 'nova',
                        voice: p.voice || 'af_sarah'
                    }));
                    setAgents(mappedAgents);
                }
            })
            .catch(err => console.error("Failed to load agents:", err));
    }, [isAuthenticated]);

    // --- AUDIO PLAYER LOGIC ---
    useEffect(() => {
        if (audioQueue.length > 0 && !isProcessingAudio) {
            setIsProcessingAudio(true);
            const playNext = async () => {
                const nextAudioUrl = audioQueue[0];
                const audio = new Audio(nextAudioUrl);
                
                audio.onended = () => {
                    setAudioQueue(prev => prev.slice(1)); 
                    setIsProcessingAudio(false);
                };
                
                try {
                    await audio.play();
                    setAvatarState(AvatarState.SPEAKING); 
                } catch (e) {
                    console.error("Audio playback failed", e);
                    setIsProcessingAudio(false);
                }
                
                audio.addEventListener('ended', () => {
                    if (audioQueue.length <= 1) setAvatarState(AvatarState.IDLE);
                });
            };
            playNext();
        }
    }, [audioQueue, isProcessingAudio]);

    // --- VISUAL CONTEXT RESET ---
    useEffect(() => {
        if ((visualContext !== VisualContext.DEFAULT || customShapeFn !== undefined) && avatarState === AvatarState.IDLE) {
            const timer = setTimeout(() => {
                setVisualContext(VisualContext.DEFAULT);
                setCustomShapeFn(undefined); 
            }, 5000); 
            return () => clearTimeout(timer);
        }
    }, [avatarState, visualContext, customShapeFn]);

    // --- MOCK AUDIO VISUALIZER ---
    useEffect(() => {
        const interval = setInterval(() => {
            if (avatarState === AvatarState.SPEAKING) setAudioLevel(Math.random() * 60 + 40);
            else if (avatarState === AvatarState.LISTENING) setAudioLevel(Math.random() * 30 + 10); 
            else setAudioLevel(Math.random() * 2); 
        }, 100);
        return () => clearInterval(interval);
    }, [avatarState]);

    // ---------------- AUTH ACTIONS ----------------

    /**
     * Login Action
     * Authenticates user and stores token based on 'rememberMe' preference.
     */
    const login = async (username = "Architect", password = "password", rememberMe = false) => {
        try {
            const formData = new FormData();
            formData.append('username', username);
            formData.append('password', password);

            // Pass remember_me to backend query param
            const res = await fetch(`${API_URL}/api/token?remember_me=${rememberMe}`, {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.detail || 'Authentication failed');
            }

            const data = await res.json();
            
            // STORAGE STRATEGY:
            // Remember Me -> LocalStorage (Persistent)
            // Normal      -> SessionStorage (Temporary)
            if (rememberMe) {
                localStorage.setItem('neural_token', data.access_token);
                sessionStorage.removeItem('neural_token'); // Clear opposing storage
            } else {
                sessionStorage.setItem('neural_token', data.access_token);
                localStorage.removeItem('neural_token'); // Clear opposing storage
            }
            
            // Set User Profile
            setUser({
                id: username,
                name: username,
                role: 'admin',
                avatarUrl: `https://ui-avatars.com/api/?name=${username}&background=random`
            });
            setIsAuthenticated(true);
        } catch (e) {
            console.error("Login Error:", e);
            throw e;
        }
    };

    const register = async (username: string, password: string, fullName: string) => {
        try {
            const res = await fetch(`${API_URL}/api/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password, full_name: fullName })
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.detail || 'Registration failed');
            }

            const data = await res.json();
            
            // Auto-login after successful registration (Default: Remember Me = True)
            await login(username, password, true);
            
            return data.recovery_key; 
        } catch (e) {
            console.error("Registration Error:", e);
            throw e; 
        }
    };

    const resetPassword = async (username: string, recoveryKey: string, newPass: string) => {
        const res = await fetch(`${API_URL}/api/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, recovery_key: recoveryKey, new_password: newPass })
        });

        if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.detail || "Reset failed");
        }
        
        const data = await res.json();
        return data.new_recovery_key;
    };

    /**
     * Logout Action
     * Clears ALL storage types to ensure complete session termination.
     */
    const logout = () => { 
        localStorage.removeItem('neural_token');
        sessionStorage.removeItem('neural_token');
        setUser(null); 
        setIsAuthenticated(false); 
    };
    
    // ---------------- APP HELPERS ----------------

    const addAgent = (agent: Agent) => { setAgents(prev => [...prev, { ...agent, id: Date.now().toString(), isCustom: true }]); };
    const updateAgent = (agent: Agent) => { setAgents(prev => prev.map(a => a.id === agent.id ? agent : a)); };
    const deleteAgent = (id: string) => { setAgents(prev => prev.filter(a => a.id !== id)); if (activeAgentId === id) setActiveAgentId(agents[0]?.id || 'nova'); };

    const speak = async (text: string) => {
        const currentAgent = agents.find(a => a.id === activeAgentId);
        const voiceId = (currentAgent as any)?.voice || "af_sarah";
        try {
            const res = await fetch(`${API_URL}/api/tts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, voice: voiceId }) 
            });
            const blob = await res.blob();
            setAudioQueue(prev => [...prev, URL.createObjectURL(blob)]);
        } catch (e) {
            console.error(e);
        }
    };

    // ---------------- MAIN CHAT LOGIC ----------------
    
    const sendMessage = async (text: string) => {
        const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text, timestamp: new Date() };
        
        let targetId = activeConversationId;
        if (!targetId) {
            const newId = Date.now().toString();
            const newConv: Conversation = { 
                id: newId, agentId: activeAgentId, title: text.length > 20 ? text.slice(0, 20) + '...' : text, messages: [userMsg], lastActive: new Date() 
            };
            setConversations(prev => [newConv, ...prev]);
            targetId = newId;
            setActiveConversationId(newId);
        } else {
            setConversations(prev => prev.map(c => c.id === targetId ? { ...c, messages: [...c.messages, userMsg], lastActive: new Date() } : c));
        }

        const lowerText = text.toLowerCase().trim();

        // 1. ARCHITECT MODE (Code Generation)
        if (lowerText.startsWith("make") || lowerText.startsWith("change") || lowerText.startsWith("create")) {
            setAvatarState(AvatarState.THINKING);
            fetch(`${API_URL}/api/architect`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: text, model: "llama3.2:1b" }) 
            })
            .then(res => res.json())
            .then(data => {
                if (data.code) {
                    try {
                        let safeCode = data.code
                            .replace(/(const|let|var)\s+count\s*=/gi, '// count redeclared')
                            .replace(/(const|let|var)\s+time\s*=/gi, '// time redeclared')
                            .replace(/(const|let|var)\s+i\s*=/gi, '// i redeclared');

                        if (!safeCode.includes("return")) {
                             safeCode = "return { x: (i/count)*10, y: 0, z: 0, color: 'white' };";
                        }

                        const fn = new Function('i', 'count', 'time', safeCode);
                        // @ts-ignore
                        setCustomShapeFn(() => fn); 
                        setVisualContext(VisualContext.CUSTOM);
                        setAvatarState(AvatarState.IDLE);
                    } catch (e) {
                        setAvatarState(AvatarState.IDLE);
                    }
                }
            })
            .catch(err => {
                setAvatarState(AvatarState.IDLE);
            });
            return; 
        }

        // 2. VISUAL CONTEXT TRIGGER
        let detectedContext = VisualContext.DEFAULT;
        if (lowerText.includes('storm')) detectedContext = VisualContext.WEATHER_THUNDER;
        else if (lowerText.includes('rain')) detectedContext = VisualContext.WEATHER_RAIN;
        else if (lowerText.includes('sun')) detectedContext = VisualContext.WEATHER_SUN;
        else if (lowerText.includes('angry')) detectedContext = VisualContext.MOOD_ANGRY;
        else if (lowerText.includes('happy')) detectedContext = VisualContext.MOOD_HAPPY;
        else if (lowerText.includes('coffee')) detectedContext = VisualContext.STORY_COFFEE;
        else if (lowerText.includes('rocket')) detectedContext = VisualContext.STORY_ROCKET;
        else if (lowerText.includes('dna')) detectedContext = VisualContext.DNA;
        else if (lowerText.includes('clock')) detectedContext = VisualContext.TIME;
        
        if (detectedContext !== VisualContext.DEFAULT) {
            setVisualContext(detectedContext);
            setCustomShapeFn(undefined); 
        }

        // 3. LLM INTERACTION
        try {
            const currentAgent = agents.find(a => a.id === activeAgentId);
            const voiceId = (currentAgent as any)?.voice || "af_sarah";

            const response = await fetch(`${API_URL}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text, model: "llama3.2:1b", persona_id: activeAgentId })
            });

            if (!response.body) throw new Error("No response body");

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            setAvatarState(AvatarState.SPEAKING);

            const aiMsgId = (Date.now() + 1).toString();
            const aiMsg: ChatMessage = { id: aiMsgId, role: 'ai', text: '', timestamp: new Date(), isTyping: true };

            setConversations(prev => prev.map(c => c.id === targetId ? { ...c, messages: [...c.messages, aiMsg] } : c));

            let fullText = '';
            let sentenceBuffer = '';
            let lastUiUpdate = 0;

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                fullText += chunk;
                sentenceBuffer += chunk;

                // TTS Processing per sentence
                if (sentenceBuffer.match(/[.!?]/)) {
                    const sentence = sentenceBuffer.trim();
                    if (sentence.length > 0) {
                        fetch(`${API_URL}/api/tts`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ text: sentence, voice: voiceId }) 
                        })
                        .then(res => res.blob())
                        .then(blob => {
                            const audioUrl = URL.createObjectURL(blob);
                            setAudioQueue(prev => [...prev, audioUrl]);
                        });
                    }
                    sentenceBuffer = ""; 
                }

                // Throttle UI updates to prevent lag
                const now = Date.now();
                if (now - lastUiUpdate > 50) {
                    setConversations(prev => prev.map(c => c.id === targetId ? { ...c, messages: c.messages.map(m => m.id === aiMsgId ? { ...m, text: fullText } : m) } : c));
                    lastUiUpdate = now;
                }
                await new Promise(r => setTimeout(r, 20)); 
            }

            // Flush remaining TTS buffer
            if (sentenceBuffer.trim().length > 0) {
                fetch(`${API_URL}/api/tts`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text: sentenceBuffer, voice: voiceId })
                })
                .then(res => res.blob())
                .then(blob => setAudioQueue(prev => [...prev, URL.createObjectURL(blob)]));
            }

            setConversations(prev => prev.map(c => c.id === targetId ? { ...c, messages: c.messages.map(m => m.id === aiMsgId ? { ...m, text: fullText, isTyping: false } : m) } : c));
            
            if (audioQueue.length === 0 && sentenceBuffer.length === 0) setAvatarState(AvatarState.IDLE);

        } catch (error) {
            console.error("Neural Link Failed:", error);
            setAvatarState(AvatarState.IDLE);
        }
    };

    const addTask = (task: AutomationTask) => setAutomationTasks(prev => [...prev, task]);
    const deleteTask = (id: string) => setAutomationTasks(prev => prev.filter(t => t.id !== id));
    const toggleTaskStatus = (id: string) => {
        setAutomationTasks(prev => prev.map(t => {
            if (t.id !== id) return t;
            const newStatus = t.status === 'running' ? 'idle' : 'running';
            return { ...t, status: newStatus };
        }));
    };

    return (
        <AppContext.Provider value={{
            state: { user, isAuthenticated, mode, agents, activeAgentId, conversations, activeConversationId, automationTasks, avatarState, visualContext, audioLevel, customShapeFn, isListening },
            actions: { login, register, resetPassword, logout, setMode, setActiveAgent: setActiveAgentId, addAgent, updateAgent, deleteAgent, sendMessage, setActiveConversation: setActiveConversationId, createConversation: () => setActiveConversationId(''), addTask, toggleTaskStatus, deleteTask, setAvatarState, setListening: setIsListening, speak }
        }}>
            {children}
        </AppContext.Provider>
    );
};

/**
 * HOOK: useApp
 * Exposes the AppContext to components.
 * CRITICAL: Must be exported separately to allow import in other files.
 */
export const useApp = () => {
    const context = useContext(AppContext);
    if (!context) throw new Error('useApp must be used within AppProvider');
    return context;
};