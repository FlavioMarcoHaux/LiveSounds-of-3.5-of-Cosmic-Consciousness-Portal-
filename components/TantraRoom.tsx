
import React, { useState, useEffect } from 'react';
import { View, AppMode } from '../types';
import BreathworkSession from './BreathworkSession';
import PracticePlayer from './PracticePlayer';
import { getConsciousTouchGuide, getSoulGazingGuide } from '../services/geminiService';
import ArchetypalTouchSession from './ArchetypalTouchSession';
import KundaliniSession from './KundaliniSession';
import { useRoomState } from '../providers/RoomStateProvider';
import RoomLayout from './RoomLayout';
import { tantraAudio } from '../services/TantraAudioEngine';

interface TantraRoomProps {
    onNavigate: (view: View) => void;
    appMode: AppMode;
    setAppMode: (mode: AppMode) => void;
}

type PracticeId = 'breathwork' | 'kundalini' | 'conscious-touch' | 'archetypal-touch' | 'soul-gazing';

interface PracticeDef {
    id: PracticeId;
    title: string;
    description: string;
    fullDescription: string; // For the detail card
    icon: string;
}

const DURATIONS = [10, 15, 20, 30, 45];

const DurationSelector: React.FC<{ selected: number; onSelect: (duration: number) => void; }> = ({ selected, onSelect }) => (
    <div className="flex flex-wrap justify-center items-center gap-2 mb-6 relative z-10">
        <span className="text-sm font-medium text-red-100/80 mr-2 font-serif tracking-wide">Duração da Jornada:</span>
        {DURATIONS.map(d => (
            <button key={d} onClick={() => onSelect(d)}
                className={`px-4 py-1 text-xs sm:text-sm rounded-sm transition-all duration-200 border-2 transform rotate-0 hover:rotate-1
                    ${selected === d 
                        ? 'border-amber-400 bg-red-900/80 text-amber-300 font-bold shadow-[0_0_10px_rgba(251,191,36,0.4)]' 
                        : 'border-red-700/50 text-red-200/70 hover:bg-red-800/40 hover:text-white'}`}>
                {d} min
            </button>
        ))}
    </div>
);

const SoulGazingVisual = () => (
     <svg viewBox="0 0 100 100" className="w-48 h-48">
        <defs>
            <filter id="soul-glow"><feGaussianBlur stdDeviation="3" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        </defs>
        <g filter="url(#soul-glow)">
             <circle cx="35" cy="50" r="10" stroke="#fca5a5" fill="none"><animate attributeName="r" values="10;12;10" dur="4s" repeatCount="indefinite"/></circle>
             <circle cx="65" cy="50" r="10" stroke="#fca5a5" fill="none"><animate attributeName="r" values="10;12;10" dur="4s" repeatCount="indefinite" begin="2s"/></circle>
             <path d="M 35 50 C 45 60, 55 60, 65 50" stroke="#fde047" fill="none" strokeWidth="1.5"><animate attributeName="d" values="M 35 50 C 45 60, 55 60, 65 50; M 35 50 C 45 40, 55 40, 65 50; M 35 50 C 45 60, 55 60, 65 50" dur="4s" repeatCount="indefinite"/></path>
        </g>
     </svg>
);

const ConsciousTouchVisual = () => (
    <svg viewBox="0 0 100 100" className="w-48 h-48">
        <defs>
            <filter id="touch-glow"><feGaussianBlur stdDeviation="4" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
             <radialGradient id="touch-grad"><stop offset="0%" stopColor="#fbcfe8"/><stop offset="100%" stopColor="#f472b6"/></radialGradient>
        </defs>
         <g filter="url(#touch-glow)">
             <path d="M 20 80 C 40 40, 60 40, 80 80" fill="none" stroke="url(#touch-grad)" strokeWidth="2" />
             <circle cx="50" cy="50" r="5" fill="#fff">
                 <animateMotion path="M 20 80 C 40 40, 60 40, 80 80" dur="6s" repeatCount="indefinite" />
             </circle>
         </g>
    </svg>
);

const SOLO_PRACTICES: PracticeDef[] = [
    { id: 'breathwork', title: 'Respiração 4-7-8', description: 'Calma e Centro', fullDescription: 'Uma prática ancestral para acalmar o sistema nervoso e centralizar a energia vital, preparando o corpo para estados superiores de consciência.', icon: '🌬️' },
    { id: 'kundalini', title: 'Ascensão Kundalini', description: 'Despertar da Serpente', fullDescription: 'Uma meditação guiada interativa e poderosa para despertar a serpente de fogo interior, guiando a energia da base ao topo.', icon: '🐍' },
    { id: 'conscious-touch', title: 'Toque Consciente', description: 'Auto-amor Sagrado', fullDescription: 'Um ritual de auto-amor para consagrar seu corpo como um templo divino, explorando a sensibilidade e a energia tântrica.', icon: '✨' },
    { id: 'archetypal-touch', title: 'Toque Arquetípico', description: 'Invocação Corporal', fullDescription: 'Uma jornada de auto-toque guiada pela sabedoria de um arquétipo do Tarot, integrando a energia simbólica através da pele.', icon: '🃏' },
];

const COUPLE_PRACTICES: PracticeDef[] = [
    { id: 'breathwork', title: 'Respiração Sincronizada', description: 'União dos Sopros', fullDescription: 'Unam seus corpos e almas através do ritmo sagrado da respiração, criando um campo de ressonância harmônica entre o casal.', icon: '💞' },
    { id: 'soul-gazing', title: 'Olhar da Alma', description: 'Espelho Divino', fullDescription: 'Conectem-se em um nível profundo, testemunhando a divindade um no outro através do silêncio e do olhar, dissolvendo barreiras.', icon: '👁️' },
];

type ViewState = 'menu' | 'detail' | 'active';

const TantraRoom: React.FC<TantraRoomProps> = ({ onNavigate, appMode, setAppMode }) => {
    const { tantraState, setTantraState } = useRoomState();
    const [viewState, setViewState] = useState<ViewState>('menu');
    const [selectedPracticeDef, setSelectedPracticeDef] = useState<PracticeDef | null>(null);
    const [duration, setDuration] = useState(15);

    const practices = appMode === 'solo' ? SOLO_PRACTICES : COUPLE_PRACTICES;
    
    // Audio Mode Switching Logic
    useEffect(() => {
        if (viewState === 'menu') {
            tantraAudio.setMode('menu');
        } else if (viewState === 'active' && selectedPracticeDef) {
            const isCouple = appMode === 'couple';
            switch(selectedPracticeDef.id) {
                case 'breathwork':
                    tantraAudio.setMode('breathwork', isCouple);
                    break;
                case 'kundalini':
                    tantraAudio.setMode('kundalini', isCouple);
                    break;
                case 'conscious-touch':
                case 'soul-gazing':
                    tantraAudio.setMode('touch', isCouple);
                    break;
                case 'archetypal-touch':
                    tantraAudio.setMode('archetype', isCouple);
                    break;
            }
        }
    }, [viewState, selectedPracticeDef, appMode]);

    // Audio Interaction
    const handleMouseMove = (e: React.MouseEvent) => {
        const { clientX, clientY } = e;
        const { innerWidth, innerHeight } = window;
        // Normalize
        const x = clientX / innerWidth; // 0 to 1
        const y = 1 - (clientY / innerHeight); // 0 (Bottom) to 1 (Top) for Ascension
        tantraAudio.updateInteraction(x, y);
    };
    
    // Mobile Gyro
    const handleTouchMove = (e: React.TouchEvent) => {
         const { clientX, clientY } = e.touches[0];
         const { innerWidth, innerHeight } = window;
         const x = clientX / innerWidth;
         const y = 1 - (clientY / innerHeight);
         tantraAudio.updateInteraction(x, y);
    }

    const handleBackClick = () => {
        if (viewState === 'active') {
            setViewState('detail');
            tantraAudio.setMode('menu'); // Revert to menu sound when exiting active state
        } else if (viewState === 'detail') {
            setViewState('menu');
            setSelectedPracticeDef(null);
            setTantraState({ selectedPractice: null });
        } else {
            if (navigator.vibrate) navigator.vibrate(50);
            onNavigate('home');
        }
    };

    const handleSelectPractice = (practice: PracticeDef) => {
        tantraAudio.triggerCrackles();
        setSelectedPracticeDef(practice);
        setViewState('detail');
    };

    const handleStartPractice = () => {
        if (selectedPracticeDef) {
            tantraAudio.triggerGong();
            setTantraState({ selectedPractice: selectedPracticeDef.id });
            setViewState('active');
        }
    };

    // Render the active component based on ID
    const renderActiveSession = () => {
        if (!selectedPracticeDef) return null;

        switch (selectedPracticeDef.id) {
            case 'breathwork':
                return <BreathworkSession appMode={appMode} onBack={handleBackClick} />;
            case 'kundalini':
                return <KundaliniSession onBack={handleBackClick} />;
            case 'conscious-touch':
                return (
                    <PracticePlayer 
                        title={selectedPracticeDef.title} 
                        description={selectedPracticeDef.description} 
                        fetchGuidance={getConsciousTouchGuide} 
                        duration={duration}
                        onBack={handleBackClick}
                    >
                        <ConsciousTouchVisual/>
                    </PracticePlayer>
                );
            case 'archetypal-touch':
                return <ArchetypalTouchSession onBack={handleBackClick} duration={duration} />;
            case 'soul-gazing':
                 return (
                    <PracticePlayer 
                        title={selectedPracticeDef.title} 
                        description={selectedPracticeDef.description} 
                        fetchGuidance={getSoulGazingGuide} 
                        duration={duration}
                        onBack={handleBackClick}
                    >
                        <SoulGazingVisual/>
                    </PracticePlayer>
                );
            default:
                return null;
        }
    };

    const HeaderToggle = (
        <div className="flex items-center bg-black/40 border border-red-500/30 rounded-full p-1 shadow-lg shadow-red-900/20">
            <button 
                onClick={() => { tantraAudio.triggerCrackles(); setAppMode('solo'); }}
                className={`px-3 sm:px-6 py-1 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-500 ${
                    appMode === 'solo' 
                    ? 'bg-gradient-to-r from-red-700 to-red-500 text-white shadow-md shadow-red-500/30' 
                    : 'text-red-200/50 hover:text-red-200'
                }`}
            >
                Solo
            </button>
            <button 
                onClick={() => { tantraAudio.triggerCrackles(); setAppMode('couple'); }}
                className={`px-3 sm:px-6 py-1 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-500 ${
                    appMode === 'couple' 
                    ? 'bg-gradient-to-r from-red-700 to-amber-600 text-white shadow-md shadow-amber-500/30' 
                    : 'text-red-200/50 hover:text-red-200'
                }`}
            >
                Casal
            </button>
        </div>
    );

    return (
        <div className="w-full h-full" onMouseMove={handleMouseMove} onTouchMove={handleTouchMove}>
            <RoomLayout
                title={viewState !== 'active' ? 'Templo do Fogo Sagrado' : ''}
                subtitle={viewState !== 'active' ? 'Desperte a energia vital e a consciência do corpo.' : ''}
                onBack={handleBackClick}
                headerAction={viewState !== 'active' ? HeaderToggle : null}
                themeColor="red"
                backgroundClass="bg-gradient-to-br from-red-950 via-black to-purple-950/50"
            >
                 {/* Background Ambience */}
                 <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(220,38,38,0.1),transparent_70%)] pointer-events-none"></div>
                
                {/* --- VIEW 1: MENU --- */}
                {viewState === 'menu' && (
                    <div className="relative z-10 w-full max-w-5xl grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8 px-2 pb-24">
                        {practices.map(p => (
                            <div 
                                key={p.id}
                                onClick={() => handleSelectPractice(p)}
                                className="group relative bg-black/40 backdrop-blur-sm p-6 rounded-xl border border-red-500/20 hover:border-red-400/60 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-red-900/20 flex flex-col items-center text-center"
                            >
                                <div className="text-5xl mb-4 filter drop-shadow-lg transform group-hover:scale-110 transition-transform duration-300">{p.icon}</div>
                                <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-300 to-amber-200 mb-2">{p.title}</h3>
                                <p className="text-sm text-red-100/60">{p.description}</p>
                            </div>
                        ))}
                    </div>
                )}

                {/* --- VIEW 2: DETAIL (PRE-RITUAL) --- */}
                {viewState === 'detail' && selectedPracticeDef && (
                    <div className="flex-grow w-full flex flex-col items-center justify-center animate-fadeIn z-10 relative px-4 pb-24">
                        <div className="w-full max-w-md bg-red-950/40 backdrop-blur-xl rounded-2xl p-8 border border-red-500/30 shadow-2xl flex flex-col items-center text-center relative overflow-hidden">
                             {/* Decorative Glow */}
                            <div className="absolute -top-10 -right-10 w-40 h-40 bg-red-600/20 blur-3xl rounded-full pointer-events-none"></div>
                            
                            <div className="text-7xl mb-6 transform hover:scale-110 transition-transform duration-500 drop-shadow-lg animate-pulse" style={{animationDuration: '3s'}}>
                                {selectedPracticeDef.icon}
                            </div>
                            
                            <h3 className="text-3xl font-bold text-white mb-2">{selectedPracticeDef.title}</h3>
                            <div className="h-0.5 w-16 bg-gradient-to-r from-transparent via-amber-500 to-transparent mb-6"></div>
                            
                            <p className="text-red-100/80 mb-8 leading-relaxed font-light">
                                {selectedPracticeDef.fullDescription}
                            </p>
                            
                            {/* Only show duration selector for generated practices, not interactive ones like Breath/Kundalini which handle time differently */}
                            {['conscious-touch', 'archetypal-touch', 'soul-gazing'].includes(selectedPracticeDef.id) && (
                                 <DurationSelector selected={duration} onSelect={setDuration} />
                            )}
                            
                            <div className="w-full mt-4">
                                <button 
                                    onClick={handleStartPractice}
                                    className="w-full py-4 bg-gradient-to-r from-red-800 to-red-600 hover:from-red-700 hover:to-red-500 text-white rounded-lg font-bold shadow-lg shadow-red-900/40 transition-all tracking-widest uppercase text-sm border-t border-red-400/20"
                                >
                                    Entrar no Templo
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                 {/* --- VIEW 3: ACTIVE SESSION --- */}
                 {viewState === 'active' && selectedPracticeDef && (
                    <div className="w-full h-full flex flex-col z-20 animate-fadeIn">
                        {renderActiveSession()}
                    </div>
                )}
            </RoomLayout>
        </div>
    );
};

export default TantraRoom;
