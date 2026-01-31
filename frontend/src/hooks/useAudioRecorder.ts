import { useState, useRef, useCallback } from 'react';
import { STTService } from '../api/services';

interface AudioRecorderState {
  isRecording: boolean;
  isProcessing: boolean;
  error: string | null;
}

export const useAudioRecorder = () => {
  const [recorderState, setRecorderState] = useState<AudioRecorderState>({
    isRecording: false,
    isProcessing: false,
    error: null
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    try {
      // Request Microphone Permissions
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Create Recorder
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // Event Handlers
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start();
      setRecorderState(prev => ({ ...prev, isRecording: true, error: null }));

    } catch (err) {
      console.error("Microphone Access Error:", err);
      setRecorderState(prev => ({ ...prev, error: "Microphone access denied" }));
    }
  }, []);

  const stopRecording = useCallback(async (): Promise<string | null> => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current) {
        resolve(null);
        return;
      }

      const recorder = mediaRecorderRef.current;
      setRecorderState(prev => ({ ...prev, isRecording: false, isProcessing: true }));

      recorder.onstop = async () => {
        // 1. Create Audio Blob
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        
        // 2. Send to STT Service
        try {
          // A. Async Upload (Returns Task ID)
          const { task_id } = await STTService.transcribeAsync(audioBlob);
          
          // B. Poll for Result (Simple Polling)
          // In production, use WebSockets or optimized endpoints for faster response
          const text = await pollForTranscription(task_id);
          resolve(text);
          
        } catch (error) {
          console.error("Transcription Failed:", error);
          setRecorderState(prev => ({ ...prev, error: "Transcription failed" }));
          resolve(null);
        } finally {
          setRecorderState(prev => ({ ...prev, isProcessing: false }));
          
          // Cleanup Tracks
          recorder.stream.getTracks().forEach(track => track.stop());
        }
      };

      recorder.stop();
    });
  }, []);

  return {
    ...recorderState,
    startRecording,
    stopRecording
  };
};

// --- HELPER: Simple Polling Logic ---
async function pollForTranscription(taskId: string, attempts = 10, interval = 500): Promise<string | null> {
  for (let i = 0; i < attempts; i++) {
    await new Promise(r => setTimeout(r, interval));
    try {
      const result = await STTService.getTaskResult(taskId);
      if (result.status === 'SUCCESS') return result.text;
      if (result.status === 'FAILURE') return null;
    } catch (e) {
      console.warn("Polling error:", e);
    }
  }
  return null; // Timed out
}