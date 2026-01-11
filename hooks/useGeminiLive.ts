
import { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { createBlob, decode, decodeAudioData } from '../utils/audioUtils';

export interface TranscriptionEntry {
  role: 'user' | 'tutor';
  text: string;
  id: string;
}

interface UseGeminiLiveProps {
  systemInstruction: string;
  voiceName?: string;
}

export const useGeminiLive = ({ systemInstruction, voiceName = 'Zephyr' }: UseGeminiLiveProps) => {
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [volume, setVolume] = useState(0); 
  const [transcriptions, setTranscriptions] = useState<TranscriptionEntry[]>([]);
  
  // Real-time text accumulation
  const currentInputText = useRef('');
  const currentOutputText = useRef('');

  // Audio Contexts and Nodes
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const inputSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const outputNodeRef = useRef<GainNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  // Connection State
  const streamRef = useRef<MediaStream | null>(null);
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const connect = useCallback(async () => {
    setIsConnecting(true);
    setError(null);

    try {
      // API Key Selection Logic for environment
      const win = window as any;
      if (win.aistudio) {
        const hasKey = await win.aistudio.hasSelectedApiKey();
        if (!hasKey) {
            await win.aistudio.openSelectKey();
        }
      }

      // Create fresh instance to ensure latest API key usage
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

      inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      const inputCtx = inputAudioContextRef.current;
      const outputCtx = outputAudioContextRef.current;
      const outputNode = outputCtx.createGain();
      outputNode.connect(outputCtx.destination);
      outputNodeRef.current = outputNode;

      const analyser = outputCtx.createAnalyser();
      analyser.fftSize = 256;
      outputNode.connect(analyser);
      analyserRef.current = analyser;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setIsActive(true);
            setIsConnecting(false);
            
            const source = inputCtx.createMediaStreamSource(stream);
            inputSourceRef.current = source;
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            processorRef.current = scriptProcessor;

            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);
              
              // Local visualization logic for input
              let sum = 0;
              for(let i=0; i<inputData.length; i++) sum += inputData[i] * inputData[i];
              const rms = Math.sqrt(sum / inputData.length);
              if (!nextStartTimeRef.current || outputCtx.currentTime > nextStartTimeRef.current) {
                 setVolume(Math.min(100, rms * 500)); 
              }

              sessionPromise.then((session: any) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };

            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            // 1. Handle Transcriptions
            if (message.serverContent?.inputTranscription) {
              currentInputText.current += message.serverContent.inputTranscription.text;
            }
            if (message.serverContent?.outputTranscription) {
              currentOutputText.current += message.serverContent.outputTranscription.text;
            }
            
            if (message.serverContent?.turnComplete) {
              const userText = currentInputText.current.trim();
              const tutorText = currentOutputText.current.trim();
              
              const newEntries: TranscriptionEntry[] = [];
              if (userText) {
                newEntries.push({ role: 'user', text: userText, id: `u-${Date.now()}` });
              }
              if (tutorText) {
                newEntries.push({ role: 'tutor', text: tutorText, id: `t-${Date.now()}` });
              }
              
              if (newEntries.length > 0) {
                setTranscriptions(prev => [...prev, ...newEntries]);
              }
              
              currentInputText.current = '';
              currentOutputText.current = '';
            }

            // 2. Handle Audio Output
            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
              const ctx = outputAudioContextRef.current;
              if (!ctx || !outputNodeRef.current) return;

              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
              const source = ctx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outputNodeRef.current);
              source.addEventListener('ended', () => {
                activeSourcesRef.current.delete(source);
              });
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              activeSourcesRef.current.add(source);
            }

            if (message.serverContent?.interrupted) {
              activeSourcesRef.current.forEach(src => {
                try { src.stop(); } catch(e) {}
              });
              activeSourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onclose: () => {
            setIsActive(false);
            setIsConnecting(false);
          },
          onerror: (err) => {
            console.error("Gemini Live Error:", err);
            setError("Session ended unexpectedly.");
            disconnect();
          }
        },
        config: {
            responseModalities: [Modality.AUDIO],
            inputAudioTranscription: {},
            outputAudioTranscription: {},
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName } }
            },
            systemInstruction: systemInstruction,
        }
      });
      
      sessionPromiseRef.current = sessionPromise;
      
      // Wait for connection to verify it works (optional, but good for catching immediate auth errors)
      // Note: ai.live.connect returns a promise that resolves when the session is ready. 
      await sessionPromise;

    } catch (err: any) {
      console.error(err);
      
      let errorMessage = "Failed to start conversation";
      
      // Check for permission/auth errors
      if (err.message && (err.message.includes("permission") || err.message.includes("found"))) {
          errorMessage = "Permission denied. Please select a valid API Key.";
          // Try to prompt for key again
          const win = window as any;
          if (win.aistudio) {
            try {
               await win.aistudio.openSelectKey();
            } catch (e) { console.error("Failed to open key selector", e); }
          }
      } else if (err.message) {
          errorMessage = err.message;
      }

      setError(errorMessage);
      setIsConnecting(false);
      disconnect();
    }
  }, [systemInstruction, voiceName]);

  const disconnect = useCallback(async () => {
    if (sessionPromiseRef.current) {
        // We need to handle potential errors if the session wasn't fully established
        try {
            const session = await sessionPromiseRef.current;
            session.close();
        } catch (e) {
            console.log("Error closing session or session not ready", e);
        }
    }
    sessionPromiseRef.current = null;

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (processorRef.current) {
        processorRef.current.disconnect();
        processorRef.current = null;
    }
    if (inputSourceRef.current) {
        inputSourceRef.current.disconnect();
        inputSourceRef.current = null;
    }
    
    if (inputAudioContextRef.current) {
        try { await inputAudioContextRef.current.close(); } catch(e) {}
        inputAudioContextRef.current = null;
    }
    if (outputAudioContextRef.current) {
        try { await outputAudioContextRef.current.close(); } catch(e) {}
        outputAudioContextRef.current = null;
    }
    
    activeSourcesRef.current.clear();
    nextStartTimeRef.current = 0;
    currentInputText.current = '';
    currentOutputText.current = '';
    setIsActive(false);
    setIsConnecting(false);
    setVolume(0);
  }, []);

  useEffect(() => {
    let animationFrameId: number;
    const render = () => {
      if (isActive && analyserRef.current && outputAudioContextRef.current) {
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for(let i=0; i<dataArray.length; i++) sum += dataArray[i];
        const avg = sum / dataArray.length;
        if (avg > 5) setVolume(Math.min(100, avg * 2)); 
      } else if (!isActive) {
        setVolume(0);
      }
      animationFrameId = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [isActive]);

  return {
    isActive,
    isConnecting,
    error,
    connect,
    disconnect,
    volume,
    transcriptions,
    clearTranscriptions: () => setTranscriptions([])
  };
};
