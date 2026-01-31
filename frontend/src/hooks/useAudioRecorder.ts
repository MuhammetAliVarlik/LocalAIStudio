import { useState, useRef, useCallback, useEffect } from 'react';

// Configuration
const WS_URL = 'ws://localhost:8003/ws/transcribe';
const VAD_THRESHOLD = 0.03;   // Volume Threshold (0.0 to 1.0)
const SILENCE_DURATION = 800; // Milliseconds of silence before sending COMMIT

export const useAudioRecorder = (onTranscription?: (text: string) => void) => {
  const [isRecording, setIsRecording] = useState(false);
  
  // Refs
  const socketRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Cleanup Function
  const cleanup = useCallback(() => {
    if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
    }
    if (mediaRecorderRef.current) {
        if (mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }
        mediaRecorderRef.current = null;
    }
    if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
    }
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
  }, []);

  const startStreaming = useCallback(async () => {
    if (isRecording) return;
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // 1. Setup Audio Analysis (VAD)
      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      const analyser = audioContextRef.current.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);
      analyserRef.current = analyser;

      // 2. Connect WebSocket
      const ws = new WebSocket(WS_URL);
      socketRef.current = ws;

      ws.onopen = () => {
        setIsRecording(true);
        console.log("🎙️ Microphone Connected to Backend");
        
        // 3. Start Recording
        const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0 && ws.readyState === WebSocket.OPEN) {
            // Send Audio Chunk
            ws.send(event.data);
          }
        };

        // Send chunks every 100ms
        mediaRecorder.start(100); 

        // 4. Start VAD Loop
        detectSilence();
      };

      ws.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            if (data.type === 'transcription' && data.text) {
              console.log("📝 STT Result:", data.text);
              if (onTranscription) onTranscription(data.text);
            }
        } catch (e) {
            console.error("JSON Parse Error:", e);
        }
      };

      ws.onerror = (e) => console.error("WebSocket Error:", e);

    } catch (err) {
      console.error("Microphone Access Error:", err);
      setIsRecording(false);
    }
  }, [isRecording, onTranscription]);

  // VAD Logic (Runs in a loop)
  const detectSilence = () => {
      if (!analyserRef.current || !socketRef.current) return;

      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyserRef.current.getByteTimeDomainData(dataArray);

      // Calculate Volume (RMS)
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
          const x = (dataArray[i] - 128) / 128.0;
          sum += x * x;
      }
      const rms = Math.sqrt(sum / bufferLength);

      // If user is speaking (Volume > Threshold)
      if (rms > VAD_THRESHOLD) {
          // Clear any pending "Stop" command
          if (silenceTimerRef.current) {
              clearTimeout(silenceTimerRef.current);
              silenceTimerRef.current = null;
          }
      } else {
          // User is silent
          // Start a timer if one isn't already running
          if (!silenceTimerRef.current) {
              silenceTimerRef.current = setTimeout(() => {
                  // Timer Finished: The sentence is over.
                  if (socketRef.current?.readyState === WebSocket.OPEN) {
                      console.log("🛑 Silence detected -> Sending COMMIT");
                      // This triggers the Backend logic
                      socketRef.current.send(JSON.stringify({ text: "COMMIT" }));
                  }
              }, SILENCE_DURATION);
          }
      }

      animationFrameRef.current = requestAnimationFrame(detectSilence);
  };

  const stopStreaming = useCallback(() => {
    cleanup();
    setIsRecording(false);
  }, [cleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return () => cleanup();
  }, []);

  return { startStreaming, stopStreaming };
};