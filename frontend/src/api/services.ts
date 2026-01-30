import { apiClient } from './client';
import { 
  AuthResponse, 
  LoginCredentials, 
  RegisterData, 
  ChatRequest, 
  PortfolioItem 
} from '../types'; // We will assume types.ts needs updates, but using generic 'any' for now where types are missing

/**
 * Service for handling Authentication and User Management.
 * Communicates with the Auth Service via API Gateway.
 */
export const AuthService = {
  /**
   * Authenticates a user and retrieves a JWT token.
   * @param credentials Username and Password
   * @returns Access Token and Token Type
   */
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    // API expects form-data usually for OAuth2, but our gateway creates a proxy.
    // We send JSON as per our Gateway config.
    const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
    return response.data;
  },

  /**
   * Registers a new user in the system.
   * @param userData User registration details
   */
  register: async (userData: RegisterData): Promise<any> => {
    const response = await apiClient.post('/auth/register', userData);
    return response.data;
  },

  /**
   * Retrieves current authenticated user's profile.
   */
  me: async (): Promise<any> => {
    const response = await apiClient.get('/auth/users/me'); // Adjusted path based on standard FastAPI Auth
    return response.data;
  }
};

/**
 * Service for Cortex Orchestrator interaction.
 * Handles Chat, Memory, and RAG operations.
 */
export const CortexService = {
  /**
   * Sends a blocking message to the LLM (Non-streaming).
   * Useful for simple commands.
   */
  sendMessageBlocking: async (payload: ChatRequest): Promise<any> => {
    const response = await apiClient.post('/cortex/interact', {
      ...payload,
      stream: false
    });
    return response.data;
  },

  /**
   * Searches the Long-Term Memory (Vector DB).
   * @param query The search term
   */
  searchMemory: async (query: string): Promise<string[]> => {
    const response = await apiClient.get('/cortex/memory/search', { 
      params: { query } 
    });
    return response.data;
  }
};

/**
 * Service for Financial Data and Portfolio Management.
 */
export const FinanceService = {
  /**
   * Fetches the user's current portfolio with real-time PnL.
   */
  getPortfolio: async (): Promise<PortfolioItem[]> => {
    const response = await apiClient.get<PortfolioItem[]>('/finance/portfolio');
    return response.data;
  },

  /**
   * Gets the real-time price of a specific asset.
   * @param symbol Ticker symbol (e.g., BTC, AAPL)
   */
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
  
  // YENİ METOD
  getStats: async () => {
    // Gateway üzerinden info servisine gider
    // Gateway'de route: /info/system/stats olarak tanımlı olmalı veya direkt proxy
    // Şimdilik varsayım: API Gateway /info/* isteklerini info_service'e yönlendiriyor.
    const response = await apiClient.get('/info/system/stats');
    return response.data;
  }
};