export enum AppMode {
  VOICE = 'VOICE',
  CODING = 'CODING',
  BUILDER = 'BUILDER',
  AUTOMATION = 'AUTOMATION',
  DAILY = 'DAILY',
  RESEARCH = 'RESEARCH',
  LANGUAGE = 'LANGUAGE',
  NOTES = 'NOTES',
  HEALTH = 'HEALTH',
  COMMS = 'COMMS',
  SYSTEM = 'SYSTEM',
  CALENDAR = 'CALENDAR',
  ART = 'ART',
  FINANCE = 'FINANCE',
  HOME = 'HOME',
  FOCUS = 'FOCUS'
}

export enum AvatarState {
  IDLE = 'IDLE',
  LISTENING = 'LISTENING',
  THINKING = 'THINKING',
  SPEAKING = 'SPEAKING'
}

export enum VisualContext {
  DEFAULT = 'DEFAULT',
  WEATHER_SUN = 'WEATHER_SUN',
  WEATHER_RAIN = 'WEATHER_RAIN',
  WEATHER_CLOUDY = 'WEATHER_CLOUDY',
  WEATHER_SNOW = 'WEATHER_SNOW',
  WEATHER_THUNDER = 'WEATHER_THUNDER',
  TIME = 'TIME',
  NOTE = 'NOTE',
  ALERT = 'ALERT',
  HEART = 'HEART',
  DNA = 'DNA',
  MUSIC = 'MUSIC',
  SHIELD = 'SHIELD',
  MOOD_HAPPY = 'MOOD_HAPPY',
  MOOD_SAD = 'MOOD_SAD',
  MOOD_ANGRY = 'MOOD_ANGRY',
  MOOD_SURPRISED = 'MOOD_SURPRISED',
  MOOD_CONFUSED = 'MOOD_CONFUSED',
  MOOD_EXCITED = 'MOOD_EXCITED',
  STORY_BOOK = 'STORY_BOOK',
  STORY_ROCKET = 'STORY_ROCKET',
  STORY_GHOST = 'STORY_GHOST',
  STORY_COFFEE = 'STORY_COFFEE',
  STORY_SLEEP = 'STORY_SLEEP',
  STORY_TRAVEL = 'STORY_TRAVEL',
  STORY_IDEA = 'STORY_IDEA',
  CUSTOM = 'CUSTOM'
}

// --- ADDED THIS TYPE DEFINITION ---
export type ShapeFunction = (i: number, count: number, time: number) => { 
  x: number; 
  y: number; 
  z: number; 
  scale?: number; 
  color?: string; 
};

export interface UserProfile {
  id: string;
  name: string;
  role: 'admin' | 'viewer';
  avatarUrl?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai' | 'system';
  text: string;
  timestamp: Date;
  isTyping?: boolean;
}

export interface Agent {
  id: string;
  name: string;
  type: 'daily' | 'coder' | 'creative';
  primaryColor: string;
  systemPrompt?: string;
  avatarUrl?: string;
  isCustom?: boolean;
}

export interface Conversation {
  id: string;
  agentId: string;
  title: string;
  messages: ChatMessage[];
  lastActive: Date;
  mode?: AppMode;
}

export type AutomationType = 'HOME' | 'WEB';

export interface AutomationTask {
  id: string;
  name: string;
  description: string;
  type: AutomationType;
  status: 'running' | 'idle' | 'failed' | 'success';
  lastRun: string;
  efficiency: number;
  icon?: string;
}