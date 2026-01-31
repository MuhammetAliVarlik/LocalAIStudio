import { apiClient } from './client';
import { 
  AuthResponse, 
  LoginCredentials, 
  RegisterData, 
  ChatRequest, 
  PortfolioItem 
} from '../types'; 

/**
 * Service for handling Authentication and User Management.
 */
export const AuthService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
    return response.data;
  },

  register: async (userData: RegisterData): Promise<any> => {
    const response = await apiClient.post('/auth/register', userData);
    return response.data;
  },

  me: async (): Promise<any> => {
    const response = await apiClient.get('/auth/users/me'); 
    return response.data;
  }
};

/**
 * Service for Cortex Orchestrator interaction.
 */
export const CortexService = {
  sendMessageBlocking: async (payload: ChatRequest): Promise<any> => {
    const response = await apiClient.post('/cortex/interact', {
      ...payload,
      stream: false
    });
    return response.data;
  },

  searchMemory: async (query: string): Promise<string[]> => {
    const response = await apiClient.get('/cortex/memory/search', { 
      params: { query } 
    });
    return response.data;
  }
};

/**
 * NEW: STT Service to handle Audio Transcription
 * Maps to the new /stt route in API Gateway
 */
export const STTService = {
  /**
   * Uploads an audio file for asynchronous transcription.
   * @param audioBlob The recorded audio file (WAV/MP3)
   */
  transcribeAsync: async (audioBlob: Blob): Promise<{ task_id: string; status: string }> => {
    const formData = new FormData();
    // 'file' matches the parameter name in backend/stt_service/main.py
    formData.append('file', audioBlob, 'recording.wav'); 
    
    const response = await apiClient.post('/stt/transcribe/async', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Checks the status of a transcription task.
   */
  getTaskResult: async (taskId: string): Promise<any> => {
    const response = await apiClient.get(`/stt/transcribe/result/${taskId}`);
    return response.data;
  }
};

/**
 * Service for Financial Data.
 */
export const FinanceService = {
  getPortfolio: async (): Promise<PortfolioItem[]> => {
    const response = await apiClient.get<PortfolioItem[]>('/finance/portfolio');
    return response.data;
  },

  getPrice: async (symbol: string): Promise<any> => {
    const response = await apiClient.get(`/finance/market/price/${symbol}`);
    return response.data;
  }
};

export const SystemService = {
  getHealth: async () => {
    const response = await apiClient.get('/health'); 
    return response.data;
  },
  
  getStats: async () => {
    // Gateway route: /info/system/stats -> Info Service
    const response = await apiClient.get('/info/system/stats');
    return response.data;
  }
};