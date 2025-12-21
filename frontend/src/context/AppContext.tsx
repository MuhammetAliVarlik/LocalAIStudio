import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Agent, AppMode, AutomationTask, AvatarState, ChatMessage, Conversation, UserProfile, VisualContext, ShapeFunction } from '../types';

// --- CONFIG ---
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// --- RICH MOCK DATA (User & Tasks Only) ---
const MOCK_USER: UserProfile = {
  id: 'u1',
  name: 'Architect',
  role: 'admin',
  avatarUrl: '[https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop](https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop)'
};

// Initial Agents are now fetched from backend, but we keep a fallback just in case
const FALLBACK_AGENTS: Agent[] = [
    { 
        id: 'nova', name: 'Nova', type: 'daily', primaryColor: '#22d3ee', 
        systemPrompt: 'You are Nova, a helpful daily assistant.', 
        avatarUrl: '[https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=400&auto=format&fit=crop](https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=400&auto=format&fit=crop)', isCustom: false,
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
    login: () => Promise<void>;
    logout: () => void;
    setMode: (mode: AppMode) => void;
    setActiveAgent: (id: string) => void;
    addAgent: (agent: Agent) => void;
    updateAgent: (agent: Agent) => void;
    deleteAgent: (id: string) => void;
    sendMessage: (text: string) => Promise<void>;
    setActiveConversation: (id: string) => void;
    createConversation: () => void;
    addTask: (task: AutomationTask) => void;
    toggleTaskStatus: (id: string) => void;
    deleteTask: (id: string) => void;
    setAvatarState: (state: AvatarState) => void;
    setListening: (listening: boolean) => void;
    speak: (text: string) => Promise<void>;
}

const AppContext = createContext<{ state: AppState; actions: AppActions } | null>(null);

// --- PROVIDER ---
export const AppProvider = ({ children }: { children: ReactNode }) => {
    // State
    const [isAuthenticated, setIsAuthenticated] = useState(true); 
    const [user, setUser] = useState<UserProfile | null>({
        id: 'dev', name: 'Architect', role: 'admin', avatarUrl: '[https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop](https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop)' 
    });
    
    const [mode, setMode] = useState<AppMode>(AppMode.VOICE);
    const [agents, setAgents] = useState<Agent[]>(FALLBACK_AGENTS);
    const [activeAgentId, setActiveAgentId] = useState<string>('nova');
    const [conversations, setConversations] = useState<Conversation[]>([INITIAL_CONVERSATION]);
    const [activeConversationId, setActiveConversationId] = useState<string>('1');
    const [automationTasks, setAutomationTasks] = useState<AutomationTask[]>(INITIAL_TASKS);
    const [avatarState, setAvatarState] = useState<AvatarState>(AvatarState.IDLE);
    const [visualContext, setVisualContext] = useState<VisualContext>(VisualContext.DEFAULT);
    const [audioLevel, setAudioLevel] = useState(0);
    const [audioQueue, setAudioQueue] = useState<string[]>([]);
    const [isProcessingAudio, setIsProcessingAudio] = useState(false);
    const [isListening, setIsListening] = useState(false);
    
    // Architect State
    const [customShapeFn, setCustomShapeFn] = useState<ShapeFunction | undefined>(undefined);

    // --- 1. FETCH AGENTS FROM BACKEND ---
    useEffect(() => {
        fetch(`${API_URL}/api/personas`)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data) && data.length > 0) {
                    // Map backend schema to frontend Agent type
                    const mappedAgents: Agent[] = data.map((p: any) => ({
                        id: p.id,
                        name: p.name,
                        type: 'daily', // Default type if not in backend
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
    }, []);

    // Audio Player
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

    // Auto-Reset Visual Context
    useEffect(() => {
        if ((visualContext !== VisualContext.DEFAULT || customShapeFn !== undefined) && avatarState === AvatarState.IDLE) {
            const timer = setTimeout(() => {
                setVisualContext(VisualContext.DEFAULT);
                setCustomShapeFn(undefined); 
            }, 5000); 
            return () => clearTimeout(timer);
        }
    }, [avatarState, visualContext, customShapeFn]);

    // Simulated Audio Loop
    useEffect(() => {
        const interval = setInterval(() => {
            if (avatarState === AvatarState.SPEAKING) setAudioLevel(Math.random() * 60 + 40);
            else if (avatarState === AvatarState.LISTENING) setAudioLevel(Math.random() * 30 + 10); 
            else setAudioLevel(Math.random() * 2); 
        }, 100);
        return () => clearInterval(interval);
    }, [avatarState]);

    // Actions
    const login = async () => {
        return new Promise<void>((resolve) => {
            setTimeout(() => {
                setUser(MOCK_USER);
                setIsAuthenticated(true);
                resolve();
            }, 800);
        });
    };

    const logout = () => { setUser(null); setIsAuthenticated(false); };
    
    // Agent Management
    const addAgent = (agent: Agent) => { setAgents(prev => [...prev, { ...agent, id: Date.now().toString(), isCustom: true }]); };
    const updateAgent = (agent: Agent) => { setAgents(prev => prev.map(a => a.id === agent.id ? agent : a)); };
    const deleteAgent = (id: string) => { setAgents(prev => prev.filter(a => a.id !== id)); if (activeAgentId === id) setActiveAgentId(agents[0]?.id || 'nova'); };

    // --- SPEAK HELPER ---
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

    // --- MAIN CHAT LOGIC ---
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

        // 1. ARCHITECT MODE CHECK (3D Code Gen)
        if (lowerText.startsWith("make") || lowerText.startsWith("change") || lowerText.startsWith("create")) {
            setAvatarState(AvatarState.THINKING);
            fetch(`${API_URL}/api/architect`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: text, model: "llama3.1" }) // Using llama for architect too
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

        // 2. PRESET VISUALS
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

        // 3. CHAT LOGIC (PERSONA AWARE)
        try {
            // Retrieve dynamic voice
            const currentAgent = agents.find(a => a.id === activeAgentId);
            const voiceId = (currentAgent as any)?.voice || "af_sarah";

            const response = await fetch(`${API_URL}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text, model: "llama3.1", persona_id: activeAgentId })
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

                if (sentenceBuffer.match(/[.!?]/)) {
                    const sentence = sentenceBuffer.trim();
                    if (sentence.length > 0) {
                        fetch(`${API_URL}/api/tts`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ text: sentence, voice: voiceId }) // DYNAMIC VOICE
                        })
                        .then(res => res.blob())
                        .then(blob => {
                            const audioUrl = URL.createObjectURL(blob);
                            setAudioQueue(prev => [...prev, audioUrl]);
                        });
                    }
                    sentenceBuffer = ""; 
                }

                const now = Date.now();
                if (now - lastUiUpdate > 50) {
                    setConversations(prev => prev.map(c => c.id === targetId ? { ...c, messages: c.messages.map(m => m.id === aiMsgId ? { ...m, text: fullText } : m) } : c));
                    lastUiUpdate = now;
                }
                await new Promise(r => setTimeout(r, 20)); 
            }

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
            actions: { login, logout, setMode, setActiveAgent: setActiveAgentId, addAgent, updateAgent, deleteAgent, sendMessage, setActiveConversation: setActiveConversationId, createConversation: () => setActiveConversationId(''), addTask, toggleTaskStatus, deleteTask, setAvatarState, setListening: setIsListening, speak }
        }}>
            {children}
        </AppContext.Provider>
    );
};

export const useApp = () => {
    const context = useContext(AppContext);
    if (!context) throw new Error('useApp must be used within AppProvider');
    return context;
};