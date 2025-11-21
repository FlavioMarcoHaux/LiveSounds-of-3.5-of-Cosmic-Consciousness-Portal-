
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View } from '../types';
import { getClassicTarotReading, getAlchemyReading, getLabyrinthReading, getTreeOfLifeReading } from '../services/geminiService';
import { useIntention } from '../hooks/useIntention';
import { tarotDeck } from '../data/tarotDeck';
import { useRoomState } from '../providers/RoomStateProvider';
import { ReadingType, ActiveReading, TreeOfLifeReading } from '../types';
import LabyrinthInputModal from './LabyrinthInputModal';
import TarotHistory from './TarotHistory';
import ReadingDisplay from './ReadingDisplay';
import CosmicCard from './CosmicCard';
import RoomLayout from './RoomLayout';
import { tarotAudio } from '../services/TarotAudioEngine';

const SEPHIROTH_NAMES = ["Kether", "Chokmah", "Binah", "Chesed", "Geburah", "Tiphareth", "Netzach", "Hod", "Yesod", "Malkuth"];

const shuffle = <T,>(array: T[]): T[] => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
};

// Definição Visual dos Tipos de Leitura
const READING_TYPES = [
    {
        id: 'classic' as ReadingType,
        title: 'Jornada Clássica',
        subtitle: 'Passado, Presente, Futuro',
        description: 'A tiragem fundamental para entender a linha do tempo da sua questão. Revela as raízes, a situação atual e o desdobramento provável.',
        icon: '🔮',
        gradient: 'from-purple-600 to-indigo-600'
    },
    {
        id: 'alchemy' as ReadingType,
        title: 'Alquimia da Sombra',
        subtitle: 'Luz e Escuridão',
        description: 'Um espelho profundo para integrar sua Persona (o que você mostra) e sua Sombra (o que está oculto). O caminho da individuação.',
        icon: '🌗',
        gradient: 'from-gray-700 to-black'
    },
    {
        id: 'labyrinth' as ReadingType,
        title: 'O Fio de Ariadne',
        subtitle: 'Resolução de Problemas',
        description: 'Uma estratégia espiritual para sair de um labirinto existencial. Identifique o obstáculo (Minotauro) e a saída.',
        icon: '🧶',
        gradient: 'from-red-900 to-orange-800'
    },
    {
        id: 'treeOfLife' as ReadingType,
        title: 'Árvore da Vida',
        subtitle: 'Mapeamento Cabalístico',
        description: 'A leitura suprema. 10 cartas mapeando sua questão através das esferas da criação, do divino (Kether) à terra (Malkuth).',
        icon: '🌳',
        gradient: 'from-emerald-800 to-cyan-900'
    }
];

const getReadingTitle = (reading: ActiveReading | null) => {
    if (!reading) return "Oráculo do Coração";
    const id = `#${(reading.id % 1000).toString().padStart(3, '0')}`;
    switch (reading.type) {
        case 'classic': return `Jornada Clássica ${id}`;
        case 'alchemy': return `Alquimia ${id}`;
        case 'labyrinth': return `Labirinto ${id}`;
        case 'treeOfLife': return `Árvore da Vida ${id}`;
        default: return "Oráculo do Coração";
    }
}

export const TarotRoom: React.FC<{ onNavigate: (view: View) => void }> = ({ onNavigate }) => {
    const { tarotState, setTarotState } = useRoomState();
    const [isLoading, setIsLoading] = useState(false);
    const [loadingStage, setLoadingStage] = useState('');
    const [modal, setModal] = useState<'none' | 'labyrinth_input'>('none');
    const { intention } = useIntention();
    
    // State Machine: Menu -> Detail (Altar) -> Reading
    const [viewState, setViewState] = useState<'menu' | 'detail' | 'reading'>(
        tarotState.currentReadingIndex !== null ? 'reading' : 'menu'
    );
    const [selectedType, setSelectedType] = useState<ReadingType | null>(null);

    const currentReading = tarotState.currentReadingIndex !== null ? tarotState.history[tarotState.currentReadingIndex] : null;
    
    const lastMousePos = useRef<{x: number, y: number} | null>(null);
    const lastNoteTime = useRef<number>(0);

    // Sync Audio Modes based on View State
    useEffect(() => {
        if (viewState === 'menu') {
            tarotAudio.setMode('menu');
        } else if (viewState === 'detail') {
            tarotAudio.setMode('altar');
        } else if (viewState === 'reading') {
            tarotAudio.setMode('reading');
        }
    }, [viewState]);

    // Mouse Move for Stardust Effect
    const handleMouseMove = (e: React.MouseEvent) => {
        const { clientX, clientY } = e;
        const now = Date.now();

        if (lastMousePos.current) {
            const dx = clientX - lastMousePos.current.x;
            const dy = clientY - lastMousePos.current.y;
            const distance = Math.sqrt(dx*dx + dy*dy);
            
            // Trigger Stardust if moving fast enough
            if (distance > 30 && (now - lastNoteTime.current > 100)) {
                 // Velocity 0-1
                 const velocity = Math.min(distance / 100, 1);
                 tarotAudio.triggerStardust(velocity);
                 lastNoteTime.current = now;
            }
        }
        lastMousePos.current = { x: clientX, y: clientY };
    };

    // Sync external state changes (like history selection)
    useEffect(() => {
        if (tarotState.currentReadingIndex !== null) {
            setViewState('reading');
        } else if (viewState === 'reading') {
            setViewState('menu');
        }
    }, [tarotState.currentReadingIndex]);

    const drawAndInterpret = useCallback(async (type: ReadingType, cardCount: number, positions: string[], problem?: string) => {
        tarotAudio.triggerMagicSeal(); // Break seal sound
        
        setViewState('reading');
        setIsLoading(true);
        setLoadingStage('Embaralhando as energias cósmicas...');
        tarotAudio.triggerShuffle();

        // Delay artificial para criar ritual
        await new Promise(r => setTimeout(r, 1500));
        setLoadingStage('Cortando o baralho sagrado...');
        
        const shuffledDeck = shuffle(tarotDeck);
        const newSpread = shuffledDeck.slice(0, cardCount).map((card, index) => ({
            ...card,
            position: positions[index],
            activation: null,
        }));

        setLoadingStage('Revelando os Arcanos...');
        
        const baseReading = { id: Date.now(), spread: newSpread, intention: intention || '' };

        let placeholderReading: ActiveReading;
        switch (type) {
            case 'classic':
                placeholderReading = { type, ...baseReading, interpretation: { past: '', present: '', future: '', synthesis: '' } };
                break;
            case 'alchemy':
                placeholderReading = { type, ...baseReading, interpretation: { persona: '', shadow: '', integration: '' } };
                break;
            case 'labyrinth':
                placeholderReading = { type, ...baseReading, interpretation: { heart: '', minotaur: '', ariadne: '', firstStep: '', exit: '' }, problem: problem! };
                break;
            case 'treeOfLife':
                placeholderReading = { type, ...baseReading, interpretation: { narrative: '', sephiroth: {} } };
                break;
        }
        
        const newReadingIndex = tarotState.history.length;
        setTarotState(prev => ({
            history: [...prev.history, placeholderReading],
            currentReadingIndex: newReadingIndex
        }));
        
        try {
            setLoadingStage('A Consciência Cósmica está interpretando...');
            let interpretation: any;
            switch (type) {
                case 'classic':
                    interpretation = await getClassicTarotReading(newSpread, intention);
                    break;
                case 'alchemy':
                    interpretation = await getAlchemyReading(newSpread, intention);
                    break;
                case 'labyrinth':
                    interpretation = await getLabyrinthReading(problem!, newSpread, intention);
                    break;
                case 'treeOfLife':
                    interpretation = await getTreeOfLifeReading(newSpread, intention);
                    break;
            }

            setTarotState(prev => {
                const newHistory = [...prev.history];
                const readingToUpdate = { ...newHistory[newReadingIndex] };
                if (readingToUpdate) {
                    (readingToUpdate as any).interpretation = interpretation;
                    newHistory[newReadingIndex] = readingToUpdate;
                }
                return { ...prev, history: newHistory };
            });

        } catch (e) {
            console.error("Failed to get reading", e);
            // Error handling remains same
        } finally {
            setIsLoading(false);
            setLoadingStage('');
        }
    }, [intention, setTarotState, tarotState.history.length]);
    
    const handlePreSelect = (type: ReadingType) => {
        tarotAudio.triggerSelect();
        if (type === 'labyrinth') {
            setModal('labyrinth_input');
        } else {
            setSelectedType(type);
            setViewState('detail');
        }
    };

    const handleConfirmReading = () => {
        if (!selectedType) return;
        const config = {
            classic: { count: 3, positions: ["Passado", "Presente", "Futuro"] },
            alchemy: { count: 2, positions: ["Persona (Luz)", "Sombra (Escuridão)"] },
            treeOfLife: { count: 10, positions: SEPHIROTH_NAMES },
            labyrinth: { count: 5, positions: [] } // Handled separately
        };
        const { count, positions } = config[selectedType];
        drawAndInterpret(selectedType, count, positions);
    };

    const handleLabyrinthStart = (problem: string) => {
        setModal('none');
        drawAndInterpret('labyrinth', 5, ["Coração do Labirinto", "O Minotauro", "O Fio de Ariadne", "O Primeiro Passo", "O Portal de Saída"], problem);
    };

    const handleSelectHistory = (index: number) => {
        setTarotState(prev => ({ ...prev, currentReadingIndex: index }));
        setViewState('reading');
    };
    
    const handleShowMenu = () => {
        setViewState('menu');
        setSelectedType(null);
        setTarotState(prev => ({ ...prev, currentReadingIndex: null }));
    }
    
    const handleBackClick = () => {
        if (viewState === 'reading') {
            handleShowMenu();
        } else if (viewState === 'detail') {
            setViewState('menu');
            setSelectedType(null);
        } else {
            onNavigate('home');
        }
    }

    const handleClearHistory = () => {
        setTarotState({ history: [], currentReadingIndex: null });
        setViewState('menu');
    };

    const selectedTypeData = READING_TYPES.find(t => t.id === selectedType);

    // Dynamic Titles/Subtitles
    const title = viewState === 'menu' ? 'Oráculo do Coração' : (viewState === 'detail' && selectedTypeData) ? selectedTypeData.title : '';
    const subtitle = viewState === 'menu' ? 'Escolha o portal para sua consulta.' : '';

    return (
        <div className="w-full h-full" onMouseMove={handleMouseMove}>
            <RoomLayout
                title={title}
                subtitle={subtitle}
                onBack={handleBackClick}
                themeColor="purple"
                backgroundClass="bg-[#0a0a1a]"
            >
                {modal === 'labyrinth_input' && <LabyrinthInputModal onClose={() => setModal('none')} onStart={handleLabyrinthStart} />}
                
                {/* Background Ambience */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(107,33,168,0.15),transparent_70%)] pointer-events-none"></div>

                {/* History Sidebar logic (Custom to Tarot Room) */}
                <TarotHistory 
                    history={tarotState.history} 
                    currentIndex={tarotState.currentReadingIndex} 
                    onSelectHistory={handleSelectHistory} 
                    onShowMenu={handleShowMenu}
                    onClear={handleClearHistory} 
                />
                
                <div className="flex-1 w-full flex flex-col justify-start items-center relative z-10 sm:pl-64">
                    
                    {/* --- VIEW 1: MENU (PORTAL CARDS) --- */}
                    {viewState === 'menu' && (
                        <div className="w-full max-w-5xl grid grid-cols-1 sm:grid-cols-2 gap-6 px-2 pb-24">
                            {READING_TYPES.map((type) => (
                                <div 
                                    key={type.id}
                                    onClick={() => handlePreSelect(type.id)}
                                    onMouseEnter={() => tarotAudio.triggerHover()}
                                    className={`group relative overflow-hidden p-6 rounded-xl cursor-pointer transition-all duration-500 border border-white/10 hover:border-purple-400/50 hover:-translate-y-1 bg-gradient-to-br ${type.gradient} bg-opacity-20`}
                                >
                                    <div className="absolute inset-0 bg-black/60 group-hover:bg-black/40 transition-colors duration-500"></div>
                                    <div className="relative z-10 flex flex-col items-center text-center h-full justify-between">
                                        <div>
                                            <span className="text-5xl mb-4 block filter drop-shadow-lg transform group-hover:scale-110 transition-transform duration-500">{type.icon}</span>
                                            <h3 className="text-xl font-bold text-white mb-1 tracking-wide font-serif">{type.title}</h3>
                                            <p className="text-xs text-purple-200 uppercase tracking-widest mb-3 opacity-70">{type.subtitle}</p>
                                        </div>
                                        <p className="text-sm text-gray-300 font-light leading-relaxed">{type.description}</p>
                                        <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                            <span className="text-xs text-white border-b border-white/30 pb-0.5">Abrir Portal</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* --- VIEW 2: DETAIL (PRE-RITUAL ALTAR) --- */}
                    {viewState === 'detail' && selectedTypeData && (
                        <div className="flex-grow w-full flex flex-col items-center justify-center animate-fadeIn px-4 pb-24">
                            <div className="w-full max-w-md bg-indigo-950/40 backdrop-blur-xl rounded-2xl p-8 border border-purple-500/30 shadow-2xl flex flex-col items-center text-center relative overflow-hidden">
                                {/* Decorative Glows */}
                                <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-64 bg-purple-600/20 blur-3xl rounded-full pointer-events-none"></div>
                                
                                <div className="mb-6 relative">
                                    <div className="absolute inset-0 bg-purple-500 blur-xl opacity-30 animate-pulse"></div>
                                    <div className="relative z-10 transform rotate-3 transition-transform hover:rotate-0 duration-500">
                                        {/* Visual representation of a deck */}
                                        <div className="w-24 h-36 bg-gradient-to-br from-indigo-900 to-purple-900 rounded-lg border border-purple-400/40 shadow-lg flex items-center justify-center">
                                            <div className="text-4xl opacity-50">❖</div>
                                        </div>
                                        <div className="absolute top-0 left-0 w-24 h-36 bg-gradient-to-br from-indigo-900 to-purple-900 rounded-lg border border-purple-400/40 shadow-lg -rotate-6 -z-10"></div>
                                    </div>
                                </div>

                                <h3 className="text-2xl font-bold text-white mb-2 font-serif">{selectedTypeData.title}</h3>
                                <div className="h-px w-24 bg-gradient-to-r from-transparent via-purple-400 to-transparent mb-4"></div>
                                
                                <p className="text-indigo-100/80 mb-8 leading-relaxed font-light text-sm">
                                    {selectedTypeData.description}
                                    <br/><br/>
                                    Concentre-se em sua intenção: <br/>
                                    <span className="text-purple-300 italic">"{intention || 'Clareza e Verdade'}"</span>
                                </p>
                                
                                <button 
                                    onClick={handleConfirmReading}
                                    className="w-full py-4 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white rounded-lg font-bold shadow-lg shadow-purple-900/40 transition-all tracking-widest uppercase text-sm border-t border-purple-400/20 flex items-center justify-center gap-2"
                                >
                                    <span className="text-lg">✦</span> Consagrar e Tirar Cartas
                                </button>
                            </div>
                        </div>
                    )}

                    {/* --- VIEW 3: READING (ACTIVE) --- */}
                    {viewState === 'reading' && (
                            <div className="w-full h-full flex flex-col items-center">
                            {isLoading ? (
                                <div className="flex-grow flex flex-col items-center justify-center text-center py-20">
                                    <div className="w-24 h-24 relative mb-6">
                                        <div className="absolute inset-0 border-4 border-purple-500/20 rounded-full"></div>
                                        <div className="absolute inset-0 border-4 border-t-purple-400 rounded-full animate-spin"></div>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span className="text-2xl animate-pulse">🔮</span>
                                        </div>
                                    </div>
                                    <p className="text-xl text-purple-200 font-serif animate-pulse">{loadingStage}</p>
                                </div>
                            ) : (
                                currentReading && <ReadingDisplay reading={currentReading} readingIndex={tarotState.currentReadingIndex!} isLoadingInterpretation={isLoading} />
                            )}
                            </div>
                    )}

                </div>
            </RoomLayout>
        </div>
    );
};
