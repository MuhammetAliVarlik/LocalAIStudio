import { useState, useCallback } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface StreamOptions {
  onChunk: (content: string) => void;
  onComplete?: () => void;
  onError?: (err: string) => void;
}

/**
 * Custom Hook to handle Streaming Chat Responses (SSE).
 * Uses the native Fetch API because Axios does not support streaming in the browser easily.
 * Refactored to match Cortex V2 API Standards.
 */
export const useChatStream = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Initiates a streaming connection to the Cortex Service.
   * @param message User's input message
   * @param sessionId Current Conversation ID
   * @param personaId The AI persona being talked to (e.g., 'nova', 'jarvis')
   * @param options Callbacks for handling data chunks
   */
  const streamMessage = useCallback(async (
    message: string, 
    sessionId: string,
    personaId: string, // <-- Added persona_id support
    options: StreamOptions
  ) => {
    setIsLoading(true);
    setError(null);
    const token = localStorage.getItem('auth_token');

    try {
      // 1. Initiate Fetch Request
      // NOTE: Updated endpoint from '/interact' to '/api/chat'
      const response = await fetch(`${API_URL}/cortex/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message: message, // <-- Renamed 'query' to 'message' to match Pydantic schema
          session_id: sessionId,
          persona_id: personaId,
          enable_memory: true
        })
      });

      if (!response.ok) {
        // Try to read the error message from JSON if possible
        let errorMsg = response.statusText;
        try {
            const errorBody = await response.json();
            if(errorBody.detail) errorMsg = errorBody.detail;
        } catch(e) { /* ignore json parse error */ }
        
        throw new Error(`Stream Error (${response.status}): ${errorMsg}`);
      }

      if (!response.body) {
        throw new Error('ReadableStream not supported in this browser.');
      }

      // 2. Read the Stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        
        if (done) break;

        // Decode the chunk and append to buffer
        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;

        // Backend doesn't send "data: " prefix anymore if we are using raw bytes generator
        // BUT if we use SSE format (event-stream), we need to handle it.
        // Our new backend proxy just streams chunks directly or JSON chunks.
        // Let's assume standard text stream for now, but handle potential JSON chunks if the LLM service sends them.
        
        // Simple text streaming logic (Update this if backend sends rigorous SSE events)
        options.onChunk(chunk); 
      }

    } catch (err: any) {
      const errorMessage = err.message || 'Unknown streaming error';
      console.error("Chat Stream Error:", err);
      setError(errorMessage);
      if (options.onError) options.onError(errorMessage);
    } finally {
      setIsLoading(false);
      if (options.onComplete) options.onComplete();
    }
  }, []);

  return { streamMessage, isLoading, error };
};