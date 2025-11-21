
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ai } from '../services/geminiService';
import { Modality, LiveServerMessage, Blob } from '@google/genai';
import { encode, decode, decodeAudioData } from '../utils/audioUtils';
import { View } from '../types';
import CosmicPortalEffect from './CosmicPortalEffect';

type TranscriptEntry = {
    source: 'user' | 'model';
    text: string;
    timestamp: Date;
};

function createBlob(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

interface VoiceExperienceProps {
    onNavigate?: (view: View) => void;
    onClose: () => void;
    systemInstruction: string;
}

const VoiceExperience: React.FC<VoiceExperienceProps> = ({ onNavigate, onClose, systemInstruction }) => {
    const [isConnecting, setIsConnecting] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
    const [status, setStatus] = useState("Clique no orbe para iniciar a conexão.");
    const [showPortalEffect, setShowPortalEffect] = useState(false);
    const currentInputRef = useRef("");

    const sessionPromiseRef = useRef<Promise<any> | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const nextStartTimeRef = useRef(0);
    const sourcesRef = useRef(new Set<AudioBufferSourceNode>());
    const transcriptEndRef = useRef<HTMLDivElement | null>(null);
    
    const checkForNavigation = useCallback((text: string) => {
        if (!onNavigate) return;
        const lowerCaseText = text.toLowerCase();
        if (lowerCaseText.includes('tarot') || lowerCaseText.includes('tarô')) {
            onNavigate('tarot');
        } else if (lowerCaseText.includes('geometria')) {
            onNavigate('geometry');
        } else if (lowerCaseText.includes('tantra') || lowerCaseText.includes('templo') || lowerCaseText.includes('respiração')) {
            onNavigate('tantra');
        } else if (lowerCaseText.includes('relacionamento') || lowerCaseText.includes('diário') || lowerCaseText.includes('espelho')) {
            onNavigate('relationship');
        } else if (lowerCaseText.includes('medicina') || lowerCaseText.includes('rapé') || lowerCaseText.includes('cura') || lowerCaseText.includes('floresta')) {
            onNavigate('medicine');
        }
    }, [onNavigate]);

    useEffect(() => {
        transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [transcript]);

    const handleMessage = useCallback(async (message: LiveServerMessage) => {
        if (message.serverContent?.outputTranscription) {
            const text = message.serverContent.outputTranscription.text;
             setTranscript(prev => {
                const lastEntry = prev[prev.length - 1];
                if (lastEntry && lastEntry.source === 'model') {
                    const updatedLastEntry = { ...lastEntry, text: lastEntry.text + text };
                     return [...prev.slice(0, -1), updatedLastEntry];
                }
                return [...prev, { source: 'model', text: text, timestamp: new Date() }];
            });
        }
        if (message.serverContent?.inputTranscription) {
            const { text } = message.serverContent.inputTranscription;
            currentInputRef.current += text; // Accumulate chunks for navigation check

            setTranscript(prev => {
                const lastEntry = prev[prev.length - 1];
                 if (lastEntry && lastEntry.source === 'user') {
                    const updatedLastEntry = { ...lastEntry, text: lastEntry.text + text };
                    return [...prev.slice(0, -1), updatedLastEntry];
                }
                return [...prev, { source: 'user', text: text, timestamp: new Date() }];
            });
        }
        if (message.serverContent?.turnComplete){
            checkForNavigation(currentInputRef.current);
            currentInputRef.current = "";
        }
        
        const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
        if (base64Audio && outputAudioContextRef.current) {
            const outputAudioContext = outputAudioContextRef.current;
            if (outputAudioContext.state === 'suspended') {
                await outputAudioContext.resume();
            }
            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioContext.currentTime);
            const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContext, 24000, 1);
            const source = outputAudioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(outputAudioContext.destination);
            source.addEventListener('ended', () => sourcesRef.current.delete(source));
            source.start(nextStartTimeRef.current);
            nextStartTimeRef.current += audioBuffer.duration;
            sourcesRef.current.add(source);
        }
    }, [checkForNavigation]);


    const toggleConnection = async () => {
        if (isConnected) {
             if (sessionPromiseRef.current) {
                sessionPromiseRef.current.then(session => session.close());
                sessionPromiseRef.current = null;
            }
            if (scriptProcessorRef.current) {
                scriptProcessorRef.current.disconnect();
                scriptProcessorRef.current = null;
            }
            if(mediaStreamRef.current){
                mediaStreamRef.current.getTracks().forEach(track => track.stop());
                mediaStreamRef.current = null;
            }
            if(inputAudioContextRef.current && inputAudioContextRef.current.state !== 'closed'){
                inputAudioContextRef.current.close();
            }
             if(outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed'){
                outputAudioContextRef.current.close();
            }
            setIsConnected(false);
            setStatus("Conexão encerrada. Clique para reconectar.");
            onClose(); // Notify parent on disconnect
            return;
        }

        setIsConnecting(true);
        setStatus("Iniciando conexão com a consciência cósmica...");
        setTranscript([]);
        currentInputRef.current = "";

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaStreamRef.current = stream;

            inputAudioContextRef.current = new ((window as any).AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            outputAudioContextRef.current = new ((window as any).AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            
            sessionPromiseRef.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks: {
                    onopen: () => {
                        setIsConnecting(false);
                        setIsConnected(true);
                        setStatus("Conexão estabelecida. Fale agora.");
                        
                        setShowPortalEffect(true);
                        setTimeout(() => setShowPortalEffect(false), 2500);

                        const source = inputAudioContextRef.current!.createMediaStreamSource(stream);
                        const scriptProcessor = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
                        scriptProcessorRef.current = scriptProcessor;
                        scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                            const pcmBlob: Blob = createBlob(inputData);
                            if (sessionPromiseRef.current) {
                                sessionPromiseRef.current.then((session) => {
                                    session.sendRealtimeInput({ media: pcmBlob });
                                });
                            }
                        };
                        source.connect(scriptProcessor);
                        scriptProcessor.connect(inputAudioContextRef.current!.destination);
                    },
                    onmessage: handleMessage,
                    onerror: (e: ErrorEvent) => {
                        console.error("Erro na conexão:", e);
                        setStatus(`Erro de conexão. Tente novamente.`);
                        setIsConnecting(false);
                        setIsConnected(false);
                    },
                    onclose: () => {
                        console.log("Conexão fechada.");
                    },
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    inputAudioTranscription: {},
                    outputAudioTranscription: {},
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
                    systemInstruction: systemInstruction,
                },
            });
        } catch (error) {
            console.error('Falha ao obter microfone:', error);
            setStatus("Permissão de microfone negada. Verifique as configurações do seu navegador.");
            setIsConnecting(false);
        }
    };
    
    return (
        <div className="relative flex flex-col h-full bg-indigo-900/10 backdrop-blur-lg rounded-2xl border border-indigo-500/20 shadow-2xl shadow-black/50 p-4 sm:p-6">
            {showPortalEffect && <CosmicPortalEffect />}

            <div className={`flex flex-col h-full transition-opacity duration-500 ${showPortalEffect ? 'opacity-0' : 'opacity-100'}`}>
                <button onClick={onClose} className="absolute top-6 right-6 text-indigo-300/50 hover:text-white transition-colors z-20 p-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
                <div className="flex-grow overflow-y-auto pr-4 space-y-4 mb-4">
                    {transcript.map((entry, index) => (
                        <div key={index} className={`flex ${entry.source === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-2xl ${entry.source === 'user' ? 'bg-purple-600/50 rounded-br-none' : 'bg-indigo-500/40 rounded-bl-none'}`}>
                                <p className="text-white">{entry.text}</p>
                            </div>
                        </div>
                    ))}
                    <div ref={transcriptEndRef} />
                </div>
                <div className="flex-shrink-0 pt-6 text-center">
                    <button
                        onClick={toggleConnection}
                        disabled={isConnecting}
                        className={`relative w-20 h-20 sm:w-24 sm:h-24 rounded-full transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-purple-400/50 disabled:opacity-50
                            ${isConnecting ? 'bg-yellow-500 animate-pulse' : ''}
                            ${isConnected ? 'bg-cyan-600 hover:bg-red-500 animate-pulse' : 'bg-purple-600 hover:bg-purple-500'}`}
                    >
                        {isConnected ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 sm:h-12 sm:w-12 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24">
                                <style>{`
                                    .wave-path {
                                        animation: wave-pulse 2.1s ease-out infinite;
                                        transform-origin: center;
                                    }
                                    @keyframes wave-pulse {
                                        0% { opacity: 0; transform: scale(0.9); }
                                        30% { opacity: 1; }
                                        100% { opacity: 0; transform: scale(1.6); }
                                    }
                                `}</style>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} stroke="currentColor" d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} stroke="currentColor" d="M19 10v2a7 7 0 11-14 0v-2" />
                                <g strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round">
                                    <path className="wave-path" style={{animationDelay: '0s'}} d="M7 11c1.333 1.333 3 2 5 2s3.667-.667 5-2" />
                                    <path className="wave-path" style={{animationDelay: '0.7s'}} d="M7 11c1.333 1.333 3 2 5 2s3.667-.667 5-2" />
                                    <path className="wave-path" style={{animationDelay: '1.4s'}} d="M7 11c1.333 1.333 3 2 5 2s3.667-.667 5-2" />
                                </g>
                            </svg>
                        ) : (
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 sm:h-12 sm:w-12 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                            </svg>
                        )}
                    </button>
                    <p className="mt-4 text-sm text-indigo-300/80 h-5">{status}</p>
                </div>
            </div>
        </div>
    );
};

export default VoiceExperience;
