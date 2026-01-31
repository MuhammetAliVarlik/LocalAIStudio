import { useState, useCallback, useRef, useEffect } from 'react';

// --- Configuration & Helpers ---

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Converts HTTP/HTTPS URLs to WS/WSS protocols.
 */
const getWebSocketUrl = (path: string): string => {
  const baseUrl = API_URL.replace(/^http/, 'ws'); // http -> ws, https -> wss
  // Ensure we don't have double slashes when joining
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
};

// --- Types ---

export interface WebSocketMessage {
  type: 'text' | 'audio' | 'control' | 'error';
  content?: string; // For text messages
  data?: string;    // For base64 audio or other payloads
  metadata?: any;   // Extra info like latency, session_id
}

export interface StreamOptions {
  onTextChunk?: (text: string) => void;
  onAudioChunk?: (audioBuffer: ArrayBuffer) => void;
  onInterruption?: () => void;
  onComplete?: () => void;
  onError?: (error: string) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

/**
 * Hook to manage a Full-Duplex WebSocket connection for Real-Time AI interaction.
 * Supports text streaming, binary audio reception, and barge-in (interruption).
 */
export const useChatStream = () => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Persistent WebSocket reference across renders
  const socketRef = useRef<WebSocket | null>(null);
  
  // Keep track of the current active callbacks
  const optionsRef = useRef<StreamOptions>({});

  /**
   * Establishes a WebSocket connection to the Cortex Service.
   * @param sessionId The active conversation ID.
   * @param personaId The AI persona ID to load context for.
   * @param options Callbacks for handling incoming real-time events.
   */
  const connect = useCallback((sessionId: string, personaId: string, options: StreamOptions) => {
    // 1. Prevent duplicate connections
    if (socketRef.current?.readyState === WebSocket.OPEN) return;

    optionsRef.current = options;
    setError(null);

    const token = localStorage.getItem('auth_token');
    
    // 2. Construct WebSocket URL with Authentication
    // Note: Standard WebSocket API does not support custom headers. 
    // We pass the token via query parameter or a secure cookie.
    const wsUrl = getWebSocketUrl(`/cortex/ws/chat/${sessionId}?token=${token}&persona_id=${personaId}`);
    
    console.log('[WebSocket] Connecting to:', wsUrl);
    const ws = new WebSocket(wsUrl);
    
    // Set binary type to 'arraybuffer' to handle raw PCM/WAV audio streams efficiently
    ws.binaryType = 'arraybuffer';

    // 3. Event Handlers
    ws.onopen = () => {
      console.log('[WebSocket] Connected');
      setIsConnected(true);
      if (optionsRef.current.onConnect) optionsRef.current.onConnect();
    };

    ws.onmessage = (event: MessageEvent) => {
      handleMessage(event);
    };

    ws.onerror = (event) => {
      console.error('[WebSocket] Error:', event);
      const errMsg = 'Connection error occurred.';
      setError(errMsg);
      if (optionsRef.current.onError) optionsRef.current.onError(errMsg);
    };

    ws.onclose = (event) => {
      console.log(`[WebSocket] Disconnected (Code: ${event.code})`);
      setIsConnected(false);
      socketRef.current = null;
      if (optionsRef.current.onDisconnect) optionsRef.current.onDisconnect();
    };

    socketRef.current = ws;
  }, []);

  /**
   * Internal handler to process incoming WebSocket messages.
   * Distinguishes between JSON (Control/Text) and Binary (Audio).
   */
  const handleMessage = (event: MessageEvent) => {
    const handlers = optionsRef.current;

    // Case A: Binary Data (Audio Stream)
    if (event.data instanceof ArrayBuffer) {
      if (handlers.onAudioChunk) {
        handlers.onAudioChunk(event.data);
      }
      return;
    }

    // Case B: Text/JSON Data (Control signals or Text content)
    try {
      const payload = JSON.parse(event.data);

      switch (payload.type) {
        case 'text_chunk':
          if (handlers.onTextChunk && payload.content) {
            handlers.onTextChunk(payload.content);
          }
          break;
        
        case 'audio_end':
        case 'generation_end':
          if (handlers.onComplete) handlers.onComplete();
          break;
          
        case 'interrupted':
          if (handlers.onInterruption) handlers.onInterruption();
          break;

        case 'error':
          if (handlers.onError) handlers.onError(payload.message || 'Unknown server error');
          break;

        default:
          console.warn('[WebSocket] Unknown message type:', payload.type);
      }
    } catch (e) {
      console.error('[WebSocket] Parse error:', e);
    }
  };

  /**
   * Sends a user message (Text) to the AI.
   */
  const sendMessage = useCallback((text: string) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      const payload = JSON.stringify({
        type: 'user_message',
        content: text,
        timestamp: Date.now()
      });
      socketRef.current.send(payload);
    } else {
      console.warn('[WebSocket] Cannot send message: Socket not open');
      setError('Connection lost. Please reconnect.');
    }
  }, []);

  /**
   * Interrupts the AI (Barge-in).
   * Sends a control signal to stop text generation and audio streaming immediately.
   */
  const interrupt = useCallback(() => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: 'interrupt' }));
      // Optimistically clear local state if needed
      if (optionsRef.current.onInterruption) optionsRef.current.onInterruption();
    }
  }, []);

  /**
   * Closes the connection manually.
   */
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
      setIsConnected(false);
    }
  }, []);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        console.log('[WebSocket] Cleaning up socket on unmount');
        socketRef.current.close();
      }
    };
  }, []);

  return {
    connect,
    disconnect,
    sendMessage,
    interrupt,
    isConnected,
    error
  };
};