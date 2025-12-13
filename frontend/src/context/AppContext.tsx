import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Agent, AppMode, AutomationTask, AvatarState, ChatMessage, Conversation, UserProfile, VisualContext, ShapeFunction } from '../types';

// --- RICH MOCK DATA ---
const MOCK_USER: UserProfile = {
  id: 'u1',
  name: 'Architect',
  role: 'admin',
  avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop'
};

const INITIAL_AGENTS: Agent[] = [
    { 
        id: 'nova', name: 'Nova', type: 'daily', primaryColor: '#22d3ee', 
        systemPrompt: 'You are Nova, a helpful daily assistant.', 
        avatarUrl: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=400&auto=format&fit=crop', isCustom: false
    },
    { 
        id: 'devin', name: 'Devin', type: 'coder', primaryColor: '#34d399', 
        systemPrompt: 'You are Devin, an expert software engineer.', 
        avatarUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=400&auto=format&fit=crop', isCustom: false
    },
    { 
        id: 'sage', name: 'Sage', type: 'creative', primaryColor: '#e879f9', 
        systemPrompt: 'You are Sage, a creative writer and strategist.', 
        avatarUrl: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=400&auto=format&fit=crop', isCustom: false
    }
];

const INITIAL_TASKS: AutomationTask[] = [
    { id: '1', type: 'WEB', name: 'Neural News Scraper', description: 'Aggregates tech news every morning.', status: 'running', lastRun: '2 min ago', efficiency: 98 },
    { id: '2', type: 'WEB', name: 'Inbox Zero Agent', description: 'Drafts email replies based on priority.', status: 'success', lastRun: '4 hours ago', efficiency: 100 },
    { id: '3', type: 'WEB', name: 'Code Refactor Bot', description: 'Optimizes Python scripts in /src.', status: 'idle', lastRun: 'Yesterday', efficiency: 88 },
    { id: '4', type: 'HOME', name: 'Living Room Ambiance', description: 'Adjusts lights based on movie genre.', status: 'running', lastRun: 'Active', efficiency: 95 },
    { id: '5', type: 'HOME', name: 'Security Sentinel', description: 'Monitors perimeter cameras for motion.', status: 'running', lastRun: 'Active', efficiency: 99 },
    { id: '6', type: 'HOME', name: 'Climate Core', description: 'Optimizes HVAC for sleep phases.', status: 'idle', lastRun: '10 hours ago', efficiency: 92 },
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
}

const AppContext = createContext<{ state: AppState; actions: AppActions } | null>(null);

// --- PROVIDER ---
export const AppProvider = ({ children }: { children: ReactNode }) => {
    // State
    const [isAuthenticated, setIsAuthenticated] = useState(true); 
    const [user, setUser] = useState<UserProfile | null>({
        id: 'dev', name: 'Architect', role: 'admin', avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop' 
    });
    
    const [mode, setMode] = useState<AppMode>(AppMode.VOICE);
    const [agents, setAgents] = useState<Agent[]>(INITIAL_AGENTS);
    const [activeAgentId, setActiveAgentId] = useState<string>('nova');
    const [conversations, setConversations] = useState<Conversation[]>([INITIAL_CONVERSATION]);
    const [activeConversationId, setActiveConversationId] = useState<string>('1');
    const [automationTasks, setAutomationTasks] = useState<AutomationTask[]>(INITIAL_TASKS);
    const [avatarState, setAvatarState] = useState<AvatarState>(AvatarState.IDLE);
    const [visualContext, setVisualContext] = useState<VisualContext>(VisualContext.DEFAULT);
    const [audioLevel, setAudioLevel] = useState(0);
    const [audioQueue, setAudioQueue] = useState<string[]>([]);
    const [isProcessingAudio, setIsProcessingAudio] = useState(false);
    
    // Architect State
    const [customShapeFn, setCustomShapeFn] = useState<ShapeFunction | undefined>(undefined);

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

    // --- FIX: AUTO-RESET VISUAL CONTEXT ---
    // If the avatar is stuck in Rain/Code/Custom mode, reset it to IDLE Sphere 
    // 5 seconds after it stops speaking.
    
    useEffect(() => {
        // Condition: We are NOT in default mode AND the avatar is currently IDLE (not speaking/thinking)
        if ((visualContext !== VisualContext.DEFAULT || customShapeFn !== undefined) && avatarState === AvatarState.IDLE) {
            const timer = setTimeout(() => {
                console.log("🔄 Auto-resetting Visuals to Default Sphere");
                setVisualContext(VisualContext.DEFAULT);
                setCustomShapeFn(undefined); // Clear architect code
            }, 5000); // Wait 5 seconds
            
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
    const addAgent = (agent: Agent) => { setAgents(prev => [...prev, { ...agent, id: Date.now().toString(), isCustom: true }]); };
    const updateAgent = (agent: Agent) => { setAgents(prev => prev.map(a => a.id === agent.id ? agent : a)); };
    const deleteAgent = (id: string) => { setAgents(prev => prev.filter(a => a.id !== id)); if (activeAgentId === id) setActiveAgentId(agents[0].id); };

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

        // 1. ARCHITECT MODE CHECK
        if (lowerText.startsWith("make") || lowerText.startsWith("change") || lowerText.startsWith("create")) {
            setAvatarState(AvatarState.THINKING);
            fetch('http://localhost:8000/api/architect', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: text, model: "llama3.2:1b" })
            })
            .then(res => res.json())
            .then(data => {
                if (data.code) {
                    try {
                        console.log("Raw LLM Code:", data.code);
                        let safeCode = data.code;

                        if (safeCode.match(/^(I can't|I cannot|Sorry|As an AI|I am unable)/i)) {
                            console.warn("⚠️ LLM Refused:", safeCode);
                            setAvatarState(AvatarState.IDLE);
                            return; 
                        }

                        safeCode = safeCode
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
                        console.log("✅ Architect Code Applied");

                    } catch (e) {
                        console.error("Compilation Failed:", e);
                        setAvatarState(AvatarState.IDLE);
                    }
                }
            })
            .catch(err => {
                console.error("Network Error:", err);
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

        // 3. CHAT LOGIC
        try {
            const response = await fetch('http://localhost:8000/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text, model: "llama3.2:1b" })
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
                        fetch('http://localhost:8000/api/tts', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ text: sentence, voice: "af_sarah" })
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
                fetch('http://localhost:8000/api/tts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text: sentenceBuffer, voice: "af_sarah" })
                })
                .then(res => res.blob())
                .then(blob => setAudioQueue(prev => [...prev, URL.createObjectURL(blob)]));
            }

            setConversations(prev => prev.map(c => c.id === targetId ? { ...c, messages: c.messages.map(m => m.id === aiMsgId ? { ...m, text: fullText, isTyping: false } : m) } : c));
            
            // This is handled by the audio queue effect, but good to be safe
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
            state: { user, isAuthenticated, mode, agents, activeAgentId, conversations, activeConversationId, automationTasks, avatarState, visualContext, audioLevel, customShapeFn },
            actions: { login, logout, setMode, setActiveAgent: setActiveAgentId, addAgent, updateAgent, deleteAgent, sendMessage, setActiveConversation: setActiveConversationId, createConversation: () => setActiveConversationId(''), addTask, toggleTaskStatus, deleteTask, setAvatarState }
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