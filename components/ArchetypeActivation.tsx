
import React, { useState, useCallback, useEffect } from 'react';
import { PlaylistItem } from '../types';
import CosmicCard from './CosmicCard';
import { getArchetypeActivation } from '../services/geminiService';
import AudioPlayer from './AudioPlayer';
import { useRoomState } from '../providers/RoomStateProvider';

const DURATIONS = [2, 5, 10, 15];

const DurationSelector: React.FC<{ selected: number; onSelect: (duration: number) => void; disabled?: boolean; }> = ({ selected, onSelect, disabled }) => (
    <div className="flex flex-wrap justify-center gap-2 mb-6">
        {DURATIONS.map(d => (
            <button
                key={d}
                onClick={() => onSelect(d)}
                disabled={disabled}
                className={`px-3 py-1 text-xs rounded-full transition-all duration-300 border
                    ${selected === d
                        ? 'border-purple-400 bg-purple-500/30 text-white shadow-[0_0_10px_rgba(168,85,247,0.4)]'
                        : 'border-white/10 text-indigo-300/60 hover:bg-white/5 hover:text-indigo-200'}
                    ${disabled ? 'opacity-30 cursor-not-allowed' : ''}
                `}
            >
                {d} min
            </button>
        ))}
    </div>
);

interface ArchetypeActivationProps {
    readingIndex: number;
    cardIndex: number;
    onClose: () => void;
}

const ArchetypeActivation: React.FC<ArchetypeActivationProps> = ({ readingIndex, cardIndex, onClose }) => {
    const { tarotState, setTarotState } = useRoomState();
    
    // Safe access to data
    const reading = tarotState.history[readingIndex];
    const cardData = reading?.spread[cardIndex];
    const activationData = cardData?.activation;

    const [status, setStatus] = useState<'idle' | 'invoking' | 'active' | 'error'>('idle');
    const [duration, setDuration] = useState(activationData?.duration || 5);

    // Initialize state based on existing data
    useEffect(() => {
        if (activationData) {
            setStatus('active');
            setDuration(activationData.duration);
        } else {
            setStatus('idle');
        }
    }, [activationData]);

    const handleInvoke = useCallback(async () => {
        if (!cardData) return;
        setStatus('invoking');

        try {
            const result = await getArchetypeActivation(cardData.name, duration);

            if (!result || !result.mantra || result.mantra.includes("interrompida")) {
                throw new Error("Falha na conexão cósmica.");
            }

            // Save to global state
            setTarotState(prev => {
                const newHistory = [...prev.history];
                const targetReading = { ...newHistory[readingIndex] };
                const newSpread = [...targetReading.spread];
                
                newSpread[cardIndex] = {
                    ...newSpread[cardIndex],
                    activation: {
                        ...result,
                        duration: duration
                    }
                };

                targetReading.spread = newSpread;
                newHistory[readingIndex] = targetReading;
                return { ...prev, history: newHistory };
            });

            setStatus('active');
        } catch (error) {
            console.error("Activation failed:", error);
            setStatus('error');
        }
    }, [cardData, duration, readingIndex, cardIndex, setTarotState]);

    if (!cardData) return null;

    // Construct Playlist for AudioPlayer
    const playlist: PlaylistItem[] = activationData ? [{
        title: `Ritual: ${cardData.name}`,
        text: `### MANTRA DE PODER ###\n\n"${activationData.mantra}"\n\n***\n\n### MEDITAÇÃO DE ATIVAÇÃO ###\n\n${activationData.meditation}`
    }] : [];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
            {/* Backdrop with blur */}
            <div 
                className="absolute inset-0 bg-gray-900/90 backdrop-blur-xl transition-opacity duration-500 animate-fadeIn" 
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-5xl h-full max-h-[600px] bg-black/40 border border-purple-500/20 rounded-2xl shadow-2xl shadow-purple-900/40 flex flex-col md:flex-row overflow-hidden animate-scaleIn">
                
                {/* Close Button */}
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 z-20 text-white/50 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                {/* Left Panel: The Card & Visuals */}
                <div className="w-full md:w-5/12 h-1/3 md:h-full bg-gradient-to-b from-purple-900/20 to-black/60 flex flex-col items-center justify-center p-6 relative overflow-hidden border-b md:border-b-0 md:border-r border-purple-500/10">
                    {/* Background Effects */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-500/10 via-transparent to-transparent animate-pulse" style={{animationDuration: '4s'}}></div>
                    
                    <div className={`relative w-40 sm:w-56 transition-all duration-700 transform ${status === 'invoking' ? 'scale-110 animate-pulse' : 'scale-100'}`}>
                         <div className={`absolute inset-0 bg-purple-400 blur-2xl opacity-20 transition-opacity duration-1000 ${status === 'active' ? 'opacity-40' : ''}`}></div>
                        <CosmicCard name={cardData.name} />
                    </div>
                    
                    <h3 className="mt-6 text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-200 to-indigo-100 text-center z-10">
                        {cardData.name}
                    </h3>
                    <p className="text-indigo-300/60 text-sm font-serif italic mt-1 text-center z-10">
                        {cardData.position}
                    </p>
                </div>

                {/* Right Panel: The Ritual Controls */}
                <div className="w-full md:w-7/12 h-2/3 md:h-full p-6 md:p-10 flex flex-col items-center justify-center overflow-y-auto">
                    
                    {status === 'idle' && (
                        <div className="text-center animate-fadeIn max-w-md">
                            <h4 className="text-xl text-purple-200 font-light mb-2">Câmara de Ativação</h4>
                            <p className="text-indigo-200/70 mb-8 leading-relaxed">
                                Você está prestes a invocar o arquétipo de <strong>{cardData.name}</strong>. 
                                Esta meditação guiada irá integrar essa energia em sua psique.
                            </p>
                            
                            <DurationSelector selected={duration} onSelect={setDuration} />

                            <button
                                onClick={handleInvoke}
                                className="group relative px-8 py-4 bg-purple-600 text-white rounded-full font-semibold tracking-wide overflow-hidden transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(147,51,234,0.5)]"
                            >
                                <span className="relative z-10 flex items-center gap-2">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                    Invocar Arquétipo
                                </span>
                                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-fuchsia-500 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            </button>
                        </div>
                    )}

                    {status === 'invoking' && (
                        <div className="text-center animate-fadeIn">
                            <div className="w-20 h-20 mx-auto mb-6 relative">
                                <div className="absolute inset-0 border-4 border-purple-500/30 rounded-full"></div>
                                <div className="absolute inset-0 border-4 border-t-purple-400 rounded-full animate-spin"></div>
                                <div className="absolute inset-4 border-4 border-indigo-400/30 rounded-full"></div>
                                <div className="absolute inset-4 border-4 border-b-indigo-300 rounded-full animate-spin-reverse"></div>
                            </div>
                            <p className="text-lg text-purple-200 font-medium animate-pulse">Sintonizando frequências...</p>
                            <p className="text-sm text-indigo-300/60 mt-2">Canalizando a sabedoria cósmica</p>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="text-center animate-fadeIn">
                            <div className="text-red-400 text-5xl mb-4">❖</div>
                            <p className="text-red-200 text-lg mb-2">A conexão foi interrompida.</p>
                            <p className="text-white/50 text-sm mb-6">As energias estão turbulentas neste momento.</p>
                            <button
                                onClick={handleInvoke}
                                className="px-6 py-2 border border-red-500/50 text-red-300 rounded-full hover:bg-red-500/20 transition-colors"
                            >
                                Tentar Novamente
                            </button>
                        </div>
                    )}

                    {status === 'active' && activationData && (
                        <div className="w-full animate-fadeIn flex flex-col h-full">
                            <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar">
                                <div className="text-center mb-6">
                                    <p className="text-xs text-indigo-400 uppercase tracking-widest mb-2">Mantra de Poder</p>
                                    <h2 className="text-2xl md:text-3xl font-serif text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-200 to-white italic leading-tight">
                                        "{activationData.mantra}"
                                    </h2>
                                </div>
                                
                                <div className="bg-purple-900/20 rounded-xl p-4 border border-purple-500/10">
                                    <AudioPlayer playlist={playlist} />
                                </div>
                            </div>
                            
                            <div className="mt-4 pt-4 border-t border-white/5 text-center">
                                <button 
                                    onClick={() => { setStatus('idle'); setDuration(5); }}
                                    className="text-xs text-indigo-300/50 hover:text-indigo-200 transition-colors"
                                >
                                    Reiniciar Ritual
                                </button>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default ArchetypeActivation;
