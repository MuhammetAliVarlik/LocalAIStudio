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
 */
export const useChatStream = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Initiates a streaming connection to the Cortex Service.
   * @param message User's input message
   * @param sessionId Current Conversation ID
   * @param options Callbacks for handling data chunks
   */
  const streamMessage = useCallback(async (
    message: string, 
    sessionId: string,
    options: StreamOptions
  ) => {
    setIsLoading(true);
    setError(null);
    const token = localStorage.getItem('auth_token');

    try {
      // 1. Initiate Fetch Request
      const response = await fetch(`${API_URL}/cortex/interact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          query: message,
          session_id: sessionId,
          enable_memory: true
        })
      });

      if (!response.ok) {
        throw new Error(`Stream Error: ${response.statusText}`);
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

        // Process complete lines from buffer (SSE format: "data: ...\n\n")
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine.startsWith('data: ')) continue;

          const jsonStr = trimmedLine.replace('data: ', '').trim();
          
          if (jsonStr === '[DONE]') {
            // End of Stream signal
            continue;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            // Verify content exists and is not empty
            if (parsed.content) {
              options.onChunk(parsed.content);
            }
          } catch (e) {
            console.warn('Failed to parse SSE JSON chunk:', jsonStr);
          }
        }
      }

    } catch (err: any) {
      const errorMessage = err.message || 'Unknown streaming error';
      setError(errorMessage);
      if (options.onError) options.onError(errorMessage);
    } finally {
      setIsLoading(false);
      if (options.onComplete) options.onComplete();
    }
  }, []);

  return { streamMessage, isLoading, error };
};