




import React, { useState, useRef, useEffect } from 'react';
import { View, RelationshipRoomView } from '../types';
import { getJournalInsight } from '../services/geminiService';
import { useJournal } from '../hooks/useJournal';
import { useIntention } from '../hooks/useIntention';
import AudioPlayer from './AudioPlayer';
import CoherenceSimulator from './CoherenceSimulator';
import { useRoomState } from '../providers/RoomStateProvider';
import { PlaylistItem } from '../types';
import RoomLayout from './RoomLayout';
import { relationshipAudio } from '../services/RelationshipAudioEngine';
import YouTubeAgent from './YouTubeAgent';

type RoomView = RelationshipRoomView;

// --- Sub-component for the Journal View ---
const JournalView = () => {
    const { entries, addEntry } = useJournal();
    const { intention } = useIntention();
    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [insight, setInsight] = useState<PlaylistItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSupported, setIsSupported] = useState(true);
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.lang = 'pt-BR';
            recognitionRef.current.interimResults = true;

            recognitionRef.current.onresult = (event: any) => {
                let finalTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    }
                }
                setTranscript(prev => prev + finalTranscript);
            };

            recognitionRef.current.onend = () => {
                setIsRecording(false);
                relationshipAudio.setRecordingMode(false); // Restore audio volume
            };
        } else {
            setIsSupported(false);
        }
    }, []);

    useEffect(() => {
        if (!isRecording && transcript.trim()) {
            addEntry(transcript);
            setTranscript('');
        }
    }, [isRecording, transcript, addEntry]);

    const toggleRecording = () => {
        if (!isSupported) return;
        if (isRecording) {
            recognitionRef.current.stop();
            relationshipAudio.setRecordingMode(false);
        } else {
            setTranscript('');
            setInsight([]);
            setIsRecording(true);
            relationshipAudio.setRecordingMode(true); // Duck audio
            recognitionRef.current.start();
        }
    };
    
    // Manual entry fallback
    const [manualInput, setManualInput] = useState('');
    
    const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
        setManualInput(e.target.value);
        relationshipAudio.triggerTypingSound();
    }

    const handleManualSubmit = () => {
        if (manualInput.trim()) {
            addEntry(manualInput);
            setManualInput('');
            relationshipAudio.triggerTypingSound(); // Confirmation sound logic can be added too
        }
    }

    const handleRequestInsight = async () => {
        setIsLoading(true);
        setInsight([]);
        const newInsight = await getJournalInsight(entries.map(e => e.text), intention);
        
        if (newInsight.length > 0) {
            const combinedText = newInsight.map(item => `### ${item.title.toUpperCase()} ###\n\n${item.text}`).join('\n\n***\n\n');
            setInsight([{ title: "Reflexão Cósmica Completa", text: combinedText }]);
        } else {
            setInsight([]);
        }
        
        setIsLoading(false);
    };

    return (
        <div className="w-full max-w-3xl flex-grow flex flex-col bg-black/20 backdrop-blur-sm p-6 rounded-lg border border-rose-500/20 animate-fadeIn">
            <h3 className="text-xl font-bold text-rose-300 mb-4">Diário de Consciência</h3>
            <div className="flex-grow bg-black/20 p-4 rounded-md overflow-y-auto mb-4 min-h-[100px] custom-scrollbar">
                {entries.length === 0 && !isRecording && <p className="text-rose-200/50">Seu diário está aguardando. {isSupported ? 'Pressione o microfone para falar ou digite abaixo.' : 'Digite seus pensamentos abaixo.'}</p>}
                {entries.map((entry) => (
                    <div key={entry.id} className="mb-3 pb-3 border-b border-rose-500/10">
                        <p className="text-white whitespace-pre-wrap">{entry.text}</p>
                        <p className="text-xs text-rose-300/40 mt-1">{new Date(entry.timestamp).toLocaleString()}</p>
                    </div>
                ))}
                {isRecording && <p className="text-white animate-pulse">{transcript || 'Ouvindo...'}</p>}
            </div>
            
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-center space-x-4">
                    {isSupported && (
                        <button onClick={toggleRecording} className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-rose-500 hover:bg-rose-400'}`}>
                            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M7 4a3 3 0 016 0v6a3 3 0 11-6 0V4zM4 4a4 4 0 014-4h4a4 4 0 014 4v6a4 4 0 01-4 4h-4a4 4 0 01-4-4V4zM14 10a1 1 0 011 1v1a5 5 0 01-5 5h-2a5 5 0 01-5-5v-1a1 1 0 112 0v1a3 3 0 003 3h2a3 3 0 003-3v-1a1 1 0 011-1z"/></svg>
                        </button>
                    )}
                    
                    <button onClick={handleRequestInsight} disabled={isLoading || entries.length === 0} className="px-5 py-2 bg-transparent border border-rose-400 text-rose-300 rounded-full hover:bg-rose-400/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                        {isLoading ? 'Refletindo...' : 'Pedir Reflexão Cósmica'}
                    </button>
                </div>
                
                {/* Fallback Input for Typing */}
                <div className="flex gap-2 w-full">
                    <input 
                        type="text" 
                        value={manualInput}
                        onChange={handleTyping}
                        onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()}
                        placeholder="Digite seu pensamento..."
                        className="flex-grow bg-black/30 border border-rose-500/30 rounded-lg px-4 py-2 text-white placeholder-rose-300/30 focus:outline-none focus:border-rose-400"
                    />
                    <button onClick={handleManualSubmit} disabled={!manualInput.trim()} className="px-4 py-2 bg-rose-600/50 text-white rounded-lg hover:bg-rose-500/50 disabled:opacity-50">
                        Enviar
                    </button>
                </div>
            </div>

            {insight.length > 0 && (
                <div className="mt-6 p-4 bg-rose-900/20 rounded-md border border-rose-500/20 animate-fadeIn">
                    <h4 className="font-bold text-rose-200 mb-2">Reflexão Cósmica:</h4>
                    <AudioPlayer playlist={insight} />
                    
                    <YouTubeAgent theme="Diário da Alma: Reflexões" focus={intention || "Autoconhecimento"} />
                </div>
            )}
        </div>
    );
};

// --- Menu View Component ---
const MenuView: React.FC<{ onSelect: (view: RoomView) => void }> = ({ onSelect }) => (
    <div className="w-full max-w-2xl grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 animate-fadeIn">
        <div onClick={() => onSelect('journal')} className="group relative bg-black/20 backdrop-blur-sm p-6 rounded-xl border border-rose-500/20 hover:border-rose-400/50 cursor-pointer transition-all duration-300 transform hover:-translate-y-1 text-center">
            <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-300 to-rose-200">Diário de Consciência</h3>
            <p className="text-sm text-rose-200/60 mt-2">Fale com seu coração e receba reflexões cósmicas sobre sua jornada.</p>
        </div>
        <div onClick={() => onSelect('simulator')} className="group relative bg-black/20 backdrop-blur-sm p-6 rounded-xl border border-rose-500/20 hover:border-rose-400/50 cursor-pointer transition-all duration-300 transform hover:-translate-y-1 text-center">
            <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-300 to-rose-200">Simulador de Coerência</h3>
            <p className="text-sm text-rose-200/60 mt-2">Pratique conversas desafiadoras com um guia de IA para fortalecer seu centro.</p>
        </div>
    </div>
);

// --- Main Room Component ---
const RelationshipRoom: React.FC<{ onNavigate: (view: View) => void }> = ({ onNavigate }) => {
    const { relationshipState, setRelationshipState } = useRoomState();
    const view = relationshipState?.view || 'menu';

    const setView = (newView: RoomView) => {
        setRelationshipState({ view: newView });
    };

    // Audio Interaction: Water Ripples
    const handleMouseMove = (e: React.MouseEvent) => {
        const { clientX, clientY } = e;
        const { innerWidth, innerHeight } = window;
        const x = clientX / innerWidth;
        const y = clientY / innerHeight;
        relationshipAudio.updateRipples(x, y);
    };
    
    // Mobile Touch Interaction
    const handleTouchMove = (e: React.TouchEvent) => {
        const { clientX, clientY } = e.touches[0];
        const { innerWidth, innerHeight } = window;
        const x = clientX / innerWidth;
        const y = clientY / innerHeight;
        relationshipAudio.updateRipples(x, y);
    }

    const getSubtitle = () => {
        switch (view) {
            case 'journal': return "Fale com seu coração, e a Consciência Cósmica refletirá sua verdade.";
            case 'simulator': return "Pratique conversas desafiadoras em um espaço seguro para ancorar sua coerência.";
            case 'menu':
            default: return "Um santuário para o autoconhecimento. Escolha sua ferramenta de poder.";
        }
    };

    const handleBackClick = () => {
        if (view === 'menu') {
            onNavigate('home');
        } else {
            setView('menu');
        }
    };

    return (
        <div className="w-full h-full" onMouseMove={handleMouseMove} onTouchMove={handleTouchMove}>
            <RoomLayout
                title="Sala dos Espelhos"
                subtitle={getSubtitle()}
                onBack={handleBackClick}
                themeColor="rose"
                backgroundClass="bg-[#0a0a1a]"
            >
                 {/* Background Ambience - Subtle Water Reflections */}
                 <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(244,114,182,0.05),transparent_80%)] pointer-events-none"></div>

                {view === 'menu' && <MenuView onSelect={setView} />}
                {view === 'journal' && <JournalView />}
                {view === 'simulator' && <CoherenceSimulator />}
            </RoomLayout>
        </div>
    );
};

export default RelationshipRoom;
