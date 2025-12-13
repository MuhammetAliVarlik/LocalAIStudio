import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Agent, AppMode, AutomationTask, AvatarState, ChatMessage, Conversation, UserProfile, VisualContext } from '../types';

// --- MOCK DATA ---
const MOCK_USER: UserProfile = {
  id: 'u1',
  name: 'Architect',
  role: 'admin',
  avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop'
};

const INITIAL_AGENTS: Agent[] = [
    { 
        id: 'nova', 
        name: 'Nova', 
        type: 'daily', 
        primaryColor: '#22d3ee', // Cyan-400
        systemPrompt: 'You are Nova, a helpful daily assistant.', 
        avatarUrl: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=400&auto=format&fit=crop',
        isCustom: false
    },
    { 
        id: 'devin', 
        name: 'Devin', 
        type: 'coder', 
        primaryColor: '#34d399', // Emerald-400
        systemPrompt: 'You are Devin, an expert software engineer.', 
        avatarUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=400&auto=format&fit=crop',
        isCustom: false
    },
    { 
        id: 'sage', 
        name: 'Sage', 
        type: 'creative', 
        primaryColor: '#e879f9', // Fuchsia-400
        systemPrompt: 'You are Sage, a creative writer and strategist.', 
        avatarUrl: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=400&auto=format&fit=crop',
        isCustom: false
    }
];

const INITIAL_TASKS: AutomationTask[] = [
    // Web/Desktop
    { id: '1', type: 'WEB', name: 'Neural News Scraper', description: 'Aggregates tech news.', status: 'running', lastRun: '2 min ago', efficiency: 98 },
    { id: '2', type: 'WEB', name: 'Inbox Zero Agent', description: 'Drafts email replies.', status: 'success', lastRun: '4 hours ago', efficiency: 100 },
    { id: '3', type: 'WEB', name: 'Code Refactor Bot', description: 'Optimizes Python scripts.', status: 'idle', lastRun: 'Yesterday', efficiency: 88 },
    // Home
    { id: '4', type: 'HOME', name: 'Living Room Ambiance', description: 'Adjusts lights based on movie genre.', status: 'running', lastRun: 'Active', efficiency: 95 },
    { id: '5', type: 'HOME', name: 'Security Sentinel', description: 'Monitors perimeter cameras.', status: 'running', lastRun: 'Active', efficiency: 99 },
    { id: '6', type: 'HOME', name: 'Climate Core', description: 'Optimizes HVAC for sleep.', status: 'idle', lastRun: '10 hours ago', efficiency: 92 },
];

const INITIAL_CONVERSATION: Conversation = { 
    id: '1', 
    agentId: 'nova', 
    title: 'System Initialization', 
    lastActive: new Date(), 
    messages: [
        { id: '1', role: 'system', text: 'Neural Interface v2.4.0 initialized.', timestamp: new Date(Date.now() - 10000) },
        { id: '2', role: 'ai', text: "Systems online. I am ready to assist you, Architect.", timestamp: new Date() }
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
    visualContext: VisualContext; // New for special animations
    audioLevel: number;
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
    const [user, setUser] = useState<UserProfile | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [mode, setMode] = useState<AppMode>(AppMode.VOICE);
    const [agents, setAgents] = useState<Agent[]>(INITIAL_AGENTS);
    const [activeAgentId, setActiveAgentId] = useState<string>('nova');
    const [conversations, setConversations] = useState<Conversation[]>([INITIAL_CONVERSATION]);
    const [activeConversationId, setActiveConversationId] = useState<string>('1');
    const [automationTasks, setAutomationTasks] = useState<AutomationTask[]>(INITIAL_TASKS);
    const [avatarState, setAvatarState] = useState<AvatarState>(AvatarState.IDLE);
    const [visualContext, setVisualContext] = useState<VisualContext>(VisualContext.DEFAULT);
    const [audioLevel, setAudioLevel] = useState(0);

    // Simulated Audio Loop
    useEffect(() => {
        const interval = setInterval(() => {
            if (avatarState === AvatarState.SPEAKING) setAudioLevel(Math.random() * 60 + 40);
            else if (avatarState === AvatarState.LISTENING) setAudioLevel(Math.random() * 30 + 10); // Active listening noise
            else setAudioLevel(Math.random() * 2); // Idle hum
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
            }, 1000);
        });
    };

    const logout = () => {
        setUser(null);
        setIsAuthenticated(false);
    };

    // Agent CRUD
    const addAgent = (agent: Agent) => {
        setAgents(prev => [...prev, { ...agent, id: Date.now().toString(), isCustom: true }]);
    };

    const updateAgent = (agent: Agent) => {
        setAgents(prev => prev.map(a => a.id === agent.id ? agent : a));
    };

    const deleteAgent = (id: string) => {
        setAgents(prev => prev.filter(a => a.id !== id));
        if (activeAgentId === id) setActiveAgentId(agents[0].id);
    };

    // Chat Logic with Context Detection
    const sendMessage = async (text: string) => {
        const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text, timestamp: new Date() };
        
        // 1. Update UI
        let targetId = activeConversationId;
        if (!targetId) {
            const newId = Date.now().toString();
            const newConv: Conversation = { 
                id: newId, 
                agentId: activeAgentId, 
                title: text.length > 20 ? text.slice(0, 20) + '...' : text, 
                messages: [userMsg], 
                lastActive: new Date() 
            };
            setConversations(prev => [newConv, ...prev]);
            targetId = newId;
            setActiveConversationId(newId);
        } else {
            setConversations(prev => prev.map(c => 
                c.id === targetId ? { ...c, messages: [...c.messages, userMsg], lastActive: new Date() } : c
            ));
        }

        setAvatarState(AvatarState.THINKING);

        // 2. Keyword Detection for Special Animations
        const lowerText = text.toLowerCase();
        let detectedContext = VisualContext.DEFAULT;
        let responseText = "I've processed your request.";

        // --- WEATHER ---
        if (lowerText.includes('storm') || lowerText.includes('thunder') || lowerText.includes('lightning')) {
            detectedContext = VisualContext.WEATHER_THUNDER;
            responseText = "Storm front detected. Heavy electrical activity.";
        }
        else if (lowerText.includes('snow') || lowerText.includes('winter') || lowerText.includes('ice') || lowerText.includes('freezing')) {
            detectedContext = VisualContext.WEATHER_SNOW;
            responseText = "Temperature is sub-zero. Expect snowfall.";
        }
        else if (lowerText.includes('cloud') || lowerText.includes('gray') || lowerText.includes('overcast')) {
            detectedContext = VisualContext.WEATHER_CLOUDY;
            responseText = "Skies are currently overcast.";
        }
        else if (lowerText.includes('rain') || lowerText.includes('drizzle')) {
            detectedContext = VisualContext.WEATHER_RAIN;
            responseText = "Precipitation probability is 90%.";
        }
        else if (lowerText.includes('sun') || lowerText.includes('hot') || lowerText.includes('clear')) {
            detectedContext = VisualContext.WEATHER_SUN;
            responseText = "UV index is moderate. Clear skies.";
        }

        // --- EMOTIONS ---
        else if (lowerText.includes('angry') || lowerText.includes('hate') || lowerText.includes('furious') || lowerText.includes('mad')) {
            detectedContext = VisualContext.MOOD_ANGRY;
            responseText = "I sense hostility. Attempting to de-escalate.";
        }
        else if (lowerText.includes('wow') || lowerText.includes('amazing') || lowerText.includes('shock') || lowerText.includes('surprise')) {
            detectedContext = VisualContext.MOOD_SURPRISED;
            responseText = "That is indeed unexpected data.";
        }
        else if (lowerText.includes('confused') || lowerText.includes('what?') || lowerText.includes('huh') || lowerText.includes('understand')) {
            detectedContext = VisualContext.MOOD_CONFUSED;
            responseText = "Query unclear. Please rephrase parameters.";
        }
        else if (lowerText.includes('excited') || lowerText.includes('yay') || lowerText.includes('awesome') || lowerText.includes('let\'s go')) {
            detectedContext = VisualContext.MOOD_EXCITED;
            responseText = "Optimizing energy levels for maximum output!";
        }
        else if (lowerText.includes('happy') || lowerText.includes('good') || lowerText.includes('love')) {
            detectedContext = VisualContext.MOOD_HAPPY;
            responseText = "Positive sentiment acknowledged.";
        }
        else if (lowerText.includes('sad') || lowerText.includes('sorry') || lowerText.includes('bad')) {
            detectedContext = VisualContext.MOOD_SAD;
            responseText = "Logging negative event.";
        }

        // --- DAILY LIFE ---
        else if (lowerText.includes('coffee') || lowerText.includes('tea') || lowerText.includes('morning') || lowerText.includes('wake')) {
            detectedContext = VisualContext.STORY_COFFEE;
            responseText = "Brewing protocol initiated. Good morning.";
        }
        else if (lowerText.includes('sleep') || lowerText.includes('night') || lowerText.includes('bed') || lowerText.includes('dream')) {
            detectedContext = VisualContext.STORY_SLEEP;
            responseText = "Entering low-power mode. Sweet dreams.";
        }
        else if (lowerText.includes('travel') || lowerText.includes('fly') || lowerText.includes('plane') || lowerText.includes('trip') || lowerText.includes('vacation')) {
            detectedContext = VisualContext.STORY_TRAVEL;
            responseText = "Flight telemetry loaded. Where are we going?";
        }
        else if (lowerText.includes('idea') || lowerText.includes('think') || lowerText.includes('smart') || lowerText.includes('eureka')) {
            detectedContext = VisualContext.STORY_IDEA;
            responseText = "New concept generated. Storing in memory.";
        }

        // --- UTILITY ---
        else if (lowerText.includes('time') || lowerText.includes('clock')) {
            detectedContext = VisualContext.TIME;
            responseText = `Current system time: ${new Date().toLocaleTimeString()}`;
        }
        else if (lowerText.includes('alert') || lowerText.includes('warning')) {
            detectedContext = VisualContext.ALERT;
            responseText = "Security alert triggered.";
        }
        else if (lowerText.includes('heart') || lowerText.includes('health')) {
            detectedContext = VisualContext.HEART;
            responseText = "Vital signs stable.";
        }
        else if (lowerText.includes('dna') || lowerText.includes('bio')) {
            detectedContext = VisualContext.DNA;
            responseText = "Genetic scan complete.";
        }
        else if (lowerText.includes('music') || lowerText.includes('song')) {
            detectedContext = VisualContext.MUSIC;
            responseText = "Audio stream active.";
        }
        else if (lowerText.includes('story') || lowerText.includes('book')) {
            detectedContext = VisualContext.STORY_BOOK;
            responseText = "Loading narrative archives...";
        }
        else if (lowerText.includes('space') || lowerText.includes('rocket')) {
            detectedContext = VisualContext.STORY_ROCKET;
            responseText = "Ignition sequence start.";
        }
        else if (lowerText.includes('ghost') || lowerText.includes('spooky')) {
            detectedContext = VisualContext.STORY_GHOST;
            responseText = "Ectoplasm detected.";
        }
        
        setVisualContext(detectedContext);

        // 3. Simulate Response
        setTimeout(() => {
            setAvatarState(AvatarState.SPEAKING);
            
            const aiMsg: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'ai',
                text: responseText,
                timestamp: new Date(),
                isTyping: true
            };

            setConversations(prev => prev.map(c => 
                c.id === targetId ? { ...c, messages: [...c.messages, aiMsg] } : c
            ));

            setTimeout(() => {
                setAvatarState(AvatarState.IDLE);
                setVisualContext(VisualContext.DEFAULT); // Reset context after speaking
                setConversations(prev => prev.map(c => 
                    c.id === targetId ? { ...c, messages: c.messages.map(m => m.id === aiMsg.id ? { ...m, isTyping: false } : m) } : c
                ));
            }, 6000); // Extended Animation duration

        }, 1500); 
    };

    // Task CRUD
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
            state: { user, isAuthenticated, mode, agents, activeAgentId, conversations, activeConversationId, automationTasks, avatarState, visualContext, audioLevel },
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