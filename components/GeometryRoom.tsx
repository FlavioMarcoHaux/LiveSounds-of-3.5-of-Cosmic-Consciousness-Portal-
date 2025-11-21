
import React, { useState, useEffect, useContext, useCallback, useMemo, useRef } from 'react';
import { View } from '../types';
import { getSingleGeometryInterpretation, getGeometricAlchemy } from '../services/geminiService';
import AudioPlayer from './AudioPlayer';
import { useIntention } from '../hooks/useIntention';
import { useRoomState } from '../providers/RoomStateProvider';
import { CoherenceContext } from '../providers/CoherenceProvider';
import ConcludeSessionButton from './ConcludeSessionButton';
import { PlaylistItem } from '../types';
import VisualGenerator from './VisualGenerator';
import { 
    KetherVisual, ChokmahVisual, BinahVisual, DaatVisual, ChesedVisual, 
    GeburahVisual, TipharethVisual, NetzachVisual, HodVisual, YesodVisual, MalkuthVisual 
} from '../assets/SacredGeometry';
import RoomLayout from './RoomLayout';
import { geometryAudio } from '../services/GeometryAudioEngine';
import YouTubeAgent from './YouTubeAgent';

// --- Ein Sof Visual (Inline for specific placement) ---
const EinSofVisual = () => (
    <svg viewBox="0 0 100 100" className="w-full h-full">
        <defs>
            <radialGradient id="grad-einsof" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="white" stopOpacity="1" />
                <stop offset="40%" stopColor="white" stopOpacity="0.8" />
                <stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </radialGradient>
            <filter id="glow-einsof">
                <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                </feMerge>
            </filter>
        </defs>
        <g filter="url(#glow-einsof)">
            <circle cx="50" cy="50" r="15" fill="url(#grad-einsof)" />
            <circle cx="50" cy="50" r="35" stroke="white" strokeWidth="0.5" strokeDasharray="1 4" fill="none" opacity="0.5">
                <animateTransform attributeName="transform" type="rotate" from="0 50 50" to="360 50 50" dur="20s" repeatCount="indefinite"/>
            </circle>
             <circle cx="50" cy="50" r="45" stroke="white" strokeWidth="0.2" strokeDasharray="2 8" fill="none" opacity="0.3">
                <animateTransform attributeName="transform" type="rotate" from="360 50 50" to="0 50 50" dur="30s" repeatCount="indefinite"/>
            </circle>
        </g>
    </svg>
);

// --- Tree of Life Coordinates (Adjusted for 12 Nodes) ---
// Squeezed vertical space to fit Ein Sof at top
const SEPHIROTH_POSITIONS: { [key: string]: { x: string; y: string } } = {
    EinSof: { x: '50%', y: '4%' }, // The Infinite (Top)
    Kether: { x: '50%', y: '13%' }, 
    Binah: { x: '15%', y: '20%' }, Chokmah: { x: '85%', y: '20%' },
    Daat: { x: '50%', y: '30%' }, 
    Geburah: { x: '15%', y: '40%' }, Chesed: { x: '85%', y: '40%' },
    Tiphareth: { x: '50%', y: '50%' }, 
    Hod: { x: '15%', y: '62%' }, Netzach: { x: '85%', y: '62%' },
    Yesod: { x: '50%', y: '75%' }, 
    Malkuth: { x: '50%', y: '90%' },
};

const TREE_OF_LIFE_PATHS = [
    { from: 'EinSof', to: 'Kether', isHidden: true }, // Connection to the source
    { from: 'Kether', to: 'Tiphareth' }, { from: 'Kether', to: 'Binah' }, { from: 'Kether', to: 'Chokmah' },
    { from: 'Binah', to: 'Tiphareth' }, { from: 'Binah', to: 'Geburah' }, { from: 'Binah', to: 'Chokmah', isCross: true },
    { from: 'Chokmah', to: 'Tiphareth' }, { from: 'Chokmah', to: 'Chesed' },
    { from: 'Geburah', to: 'Tiphareth' }, { from: 'Geburah', to: 'Hod' }, { from: 'Geburah', to: 'Chesed', isCross: true },
    { from: 'Chesed', to: 'Tiphareth' }, { from: 'Chesed', to: 'Netzach' },
    { from: 'Tiphareth', to: 'Yesod' }, { from: 'Tiphareth', to: 'Hod' }, { from: 'Tiphareth', to: 'Netzach' },
    { from: 'Hod', to: 'Yesod' }, { from: 'Hod', to: 'Netzach', isCross: true },
    { from: 'Netzach', to: 'Yesod' },
    { from: 'Yesod', to: 'Malkuth' },
    { from: 'Binah', to: 'Daat', isHidden: true }, { from: 'Chokmah', to: 'Daat', isHidden: true },
    { from: 'Kether', to: 'Daat', isHidden: true }, { from: 'Geburah', to: 'Daat', isHidden: true },
    { from: 'Chesed', to: 'Daat', isHidden: true }, { from: 'Tiphareth', to: 'Daat', isHidden: true }
];

const GEOMETRY_TO_SEPHIRAH: { [key: string]: string } = {
    'O Infinito': 'EinSof',
    'Coroa Cósmica': 'Kether',
    'O Santuário do Entendimento': 'Binah',
    'A Fonte da Sabedoria': 'Chokmah',
    'Portal da Coerência': 'Daat',
    'Pilar da Força': 'Geburah',
    'O Templo da Compaixão': 'Chesed',
    'Esfera da Beleza': 'Tiphareth',
    'O Pilar da Glória': 'Hod',
    'Vórtice da Transformação': 'Netzach',
    'Semente da Unidade': 'Yesod',
    'Fundação do Eu': 'Malkuth'
};

const TreeOfLifePaths: React.FC<{ selected: string[] }> = ({ selected }) => {
    const selectedSephiroth = selected.map(name => GEOMETRY_TO_SEPHIRAH[name]);
    return (
        <svg className="absolute inset-0 w-full h-full z-0" preserveAspectRatio="xMidYMid meet">
             <style>{`
                @keyframes flow { to { stroke-dashoffset: -1000; } }
                @keyframes subtle-flow { to { stroke-dashoffset: -200; } }
            `}</style>
            <defs>
                <filter id="glow-line"><feGaussianBlur stdDeviation="1.5" result="coloredBlur" /><feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
                <linearGradient id="path-gradient" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="100%">
                    <stop offset="0%" stopColor="#67e8f9" />
                    <stop offset="100%" stopColor="#c084fc" />
                </linearGradient>
            </defs>
            <g stroke="rgba(110, 231, 255, 0.2)" strokeWidth="0.5" fill="none">
                {TREE_OF_LIFE_PATHS.map(path => (
                    <line key={`${path.from}-${path.to}`}
                        x1={SEPHIROTH_POSITIONS[path.from]?.x} y1={SEPHIROTH_POSITIONS[path.from]?.y}
                        x2={SEPHIROTH_POSITIONS[path.to]?.x} y2={SEPHIROTH_POSITIONS[path.to]?.y}
                        strokeDasharray={path.isHidden ? "2 2" : "2 8"}
                        style={{ animation: 'subtle-flow 5s linear infinite' }}
                    />
                ))}
            </g>
            {selected.length > 1 && (
                <g fill="none" filter="url(#glow-line)">
                    {TREE_OF_LIFE_PATHS
                        .filter(path => selectedSephiroth.includes(path.from) && selectedSephiroth.includes(path.to))
                        .map(path => (
                            <line key={`sel-${path.from}-${path.to}`}
                                x1={SEPHIROTH_POSITIONS[path.from]?.x} y1={SEPHIROTH_POSITIONS[path.from]?.y}
                                x2={SEPHIROTH_POSITIONS[path.to]?.x} y2={SEPHIROTH_POSITIONS[path.to]?.y}
                                stroke="url(#path-gradient)" strokeWidth="1.5" strokeDasharray="10"
                                style={{ animation: 'flow 40s linear infinite' }}
                            />
                        ))}
                </g>
            )}
        </svg>
    );
};


const sephirothMap = [
    { poeticName: 'O Infinito', sephirah: 'EinSof', component: EinSofVisual },
    { poeticName: 'Coroa Cósmica', sephirah: 'Kether', component: KetherVisual },
    { poeticName: 'O Santuário do Entendimento', sephirah: 'Binah', component: BinahVisual },
    { poeticName: 'A Fonte da Sabedoria', sephirah: 'Chokmah', component: ChokmahVisual },
    { poeticName: 'Portal da Coerência', sephirah: 'Daat', component: DaatVisual },
    { poeticName: 'Pilar da Força', sephirah: 'Geburah', component: GeburahVisual },
    { poeticName: 'O Templo da Compaixão', sephirah: 'Chesed', component: ChesedVisual },
    { poeticName: 'Esfera da Beleza', sephirah: 'Tiphareth', component: TipharethVisual },
    { poeticName: 'O Pilar da Glória', sephirah: 'Hod', component: HodVisual },
    { poeticName: 'Vórtice da Transformação', sephirah: 'Netzach', component: NetzachVisual },
    { poeticName: 'Semente da Unidade', sephirah: 'Yesod', component: YesodVisual },
    { poeticName: 'Fundação do Eu', sephirah: 'Malkuth', component: MalkuthVisual },
];

const DURATIONS = [5, 10, 15, 20, 30, 45];

const DurationSelector: React.FC<{ selected: number; onSelect: (duration: number) => void; }> = ({ selected, onSelect }) => (
    <div className="flex flex-wrap justify-center items-center gap-2 mb-4 relative z-10">
        <span className="text-sm font-medium text-cyan-200/80 mr-2 font-serif tracking-wide">Duração da Meditação:</span>
        {DURATIONS.map(d => (
            <button key={d} onClick={() => onSelect(d)}
                className={`px-4 py-1 text-xs sm:text-sm rounded-sm transition-all duration-200 border-2 transform rotate-0 hover:rotate-1
                    ${selected === d 
                        ? 'border-cyan-300 bg-cyan-900/80 text-cyan-200 font-bold shadow-[0_0_10px_rgba(103,232,249,0.4)]' 
                        : 'border-cyan-400/30 text-cyan-200/70 hover:bg-cyan-500/10 hover:text-white'}`}>
                {d} min
            </button>
        ))}
    </div>
);

type ViewState = 'selection' | 'detail' | 'ritual';

const GeometryRoom: React.FC<{ onNavigate: (view: View) => void }> = ({ onNavigate }) => {
    const { geometryState, setGeometryState } = useRoomState();
    const { coherenceScore } = useContext(CoherenceContext);
    const [isLoading, setIsLoading] = useState(false);
    const { intention } = useIntention();
    const printableRef = useRef<HTMLDivElement>(null);

    const [viewState, setViewState] = useState<ViewState>('selection');
    const [selectedGeometries, setSelectedGeometries] = useState<string[]>(geometryState?.selectedGeometries || []);
    const [meditationDuration, setMeditationDuration] = useState(geometryState?.duration || 10);

    // Audio: Mouse Interaction for Dimensional Scanner
    const handleMouseMove = (e: React.MouseEvent) => {
        if (viewState === 'selection') {
            const { clientX, clientY } = e;
            const { innerWidth, innerHeight } = window;
            const x = clientX / innerWidth;
            const y = clientY / innerHeight;
            geometryAudio.updateScanner(x, y, true);
        }
    };
    
    const handleMouseLeave = () => {
        geometryAudio.updateScanner(0, 0, false);
    }

    // Handle geometry selection logic
    const handleSelect = (name: string) => {
        // Trigger Audio: This now layers the music parts
        geometryAudio.triggerSolfeggio(name);

        setSelectedGeometries(prev => {
            const isSelected = prev.includes(name);
            if (isSelected) {
                return prev.filter(g => g !== name);
            }
            if (prev.length < 12) { // Increased limit to 12
                return [...prev, name];
            }
            return prev; 
        });
    };

    // Transition to Detail/Confirm View
    const handleConfirmSelection = () => {
        if (selectedGeometries.length > 0) {
            setViewState('detail');
        }
    };

    // Initiate Ritual
    const handleStartRitual = useCallback(async () => {
        if (selectedGeometries.length === 0) return;
        
        // Audio: Matrix Start Effect (Drop)
        geometryAudio.triggerMatrixStart();

        setIsLoading(true);
        setViewState('ritual');
        
        // Determine if it's single or alchemy
        const isAlchemy = selectedGeometries.length > 1;
        let result;

        try {
            if (isAlchemy) {
                result = await getGeometricAlchemy(selectedGeometries, meditationDuration, intention);
            } else {
                result = await getSingleGeometryInterpretation(selectedGeometries[0], meditationDuration, intention);
            }

            if (result) {
                setGeometryState({
                    selectedGeometries: selectedGeometries,
                    interpretation: JSON.stringify(result),
                    duration: meditationDuration,
                    intention: intention || '',
                    isAlchemy: isAlchemy
                });
            }
        } catch (e) {
            console.error("Ritual generation error:", e);
            // Even if error, we stop loading to show UI (audio player will handle empty playlist safely)
        } finally {
            setIsLoading(false);
        }
    }, [selectedGeometries, meditationDuration, intention, setGeometryState]);

    const handleConclude = () => {
        setGeometryState(null);
        setSelectedGeometries([]);
        setViewState('selection');
    };

    const handleBackClick = () => {
        if (viewState === 'ritual') {
             handleConclude();
        } else if (viewState === 'detail') {
            setViewState('selection');
        } else {
            onNavigate('home');
        }
    }

    const handlePrint = () => {
        if (printableRef.current) {
            const printWindow = window.open('', '_blank');
            if (printWindow) {
                printWindow.document.write(`
                    <html>
                    <head>
                        <title>Geometria Sagrada</title>
                        <style>body { font-family: serif; padding: 40px; color: #000; }</style>
                    </head>
                    <body>
                        ${printableRef.current.innerHTML}
                        <div style="position: fixed; bottom: 0; left: 0; width: 100%; text-align: center; padding: 20px; color: #666; font-family: sans-serif; font-size: 12px; border-top: 1px solid #eee;">
                            <span style="display:flex; align-items:center; justify-content:center; gap: 10px;">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="red"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>
                                <strong>Fé em 10 minutos</strong> (youtube.com/@fe10minutos)
                            </span>
                        </div>
                    </body>
                    </html>
                `);
                printWindow.document.close();
                printWindow.print();
            }
        }
    }

    // --- Memoized Data ---
    const parsedInterpretation = useMemo(() => {
        try {
            if (geometryState?.interpretation) {
                const parsed = JSON.parse(geometryState.interpretation);
                // Safety check for required fields
                if (parsed && (parsed.interpretation || parsed.meditation)) {
                    return parsed;
                }
            }
            return null;
        } catch (e) {
            console.error("Failed to parse geometry interpretation:", e);
            return null;
        }
    }, [geometryState?.interpretation]);

    const playlist: PlaylistItem[] = useMemo(() => {
        // Defensive programming
        const titleName = (geometryState?.selectedGeometries && geometryState.selectedGeometries.length > 0) 
            ? geometryState.selectedGeometries[0] 
            : (selectedGeometries[0] || "Geometria Sagrada");

        if (!parsedInterpretation) {
             // If we are in ritual mode but no data yet (should be loading, but just in case)
             return [{ title: titleName, text: "Sintonizando frequência..." }];
        }
        
        const interpText = parsedInterpretation.interpretation || "Interpretação não disponível.";
        const medText = parsedInterpretation.meditation || "Meditação não disponível.";

        const interpTitle = geometryState?.isAlchemy ? 'INTERPRETAÇÃO ALQUÍMICA' : 'INTERPRETAÇÃO MÍSTICA';
        const combinedText = `### ${interpTitle} ###\n\n${interpText}\n\n***\n\n### MEDITAÇÃO GUIADA ###\n\n${medText}`;
        
        return [{ 
            title: geometryState?.isAlchemy ? 'Jornada Alquímica' : titleName, 
            text: combinedText 
        }];
    }, [parsedInterpretation, geometryState, selectedGeometries]);

    const isLowCoherence = coherenceScore < 40;

    // Dynamic Title logic
    const title = viewState !== 'ritual' ? 'Árvore da Vida Geométrica' : '';
    const subtitle = viewState !== 'ritual' ? 'Toque nas esferas para ativar as camadas sonoras e visuais.' : '';
    
    // Used for visual generator prompt
    const promptGeometries = (geometryState?.selectedGeometries && geometryState.selectedGeometries.length > 0) 
        ? geometryState.selectedGeometries.join(' + ') 
        : selectedGeometries.join(' + ') || "Geometria Cósmica";

    return (
        <div className="w-full h-full" onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
            <RoomLayout
                title={title}
                subtitle={subtitle}
                onBack={handleBackClick}
                themeColor="cyan"
                backgroundClass="bg-[#0c1220]"
            >
                {/* Background Grid */}
                <div className="absolute inset-0 pointer-events-none opacity-20" 
                     style={{ backgroundImage: 'linear-gradient(rgba(103, 232, 249, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(103, 232, 249, 0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
                </div>

                {/* --- VIEW 1: SELECTION (TREE) --- */}
                {viewState === 'selection' && (
                    <div className="w-full flex flex-col items-center justify-center relative z-10 pb-24">
                        <div className="relative w-full max-w-lg mx-auto h-[550px] sm:h-[600px] mt-4 flex-shrink-0">
                            <TreeOfLifePaths selected={selectedGeometries} />
                            {Object.values(SEPHIROTH_POSITIONS).map(pos => {
                                const sephirahEntry = sephirothMap.find(s => s.sephirah === Object.keys(SEPHIROTH_POSITIONS).find(key => SEPHIROTH_POSITIONS[key] === pos));
                                if (!sephirahEntry) return null;
                                
                                const { poeticName, sephirah, component: Component } = sephirahEntry;
                                const isSelected = selectedGeometries.includes(poeticName);
                                const isPulsing = sephirah === 'Malkuth' && isLowCoherence && !isSelected;
                                const isEinSof = sephirah === 'EinSof';

                                return (
                                    <div 
                                        key={sephirah} 
                                        className="absolute z-10 flex flex-col items-center justify-center group cursor-pointer" 
                                        style={{ top: pos.y, left: pos.x, transform: 'translate(-50%, -50%)' }} 
                                        onClick={() => handleSelect(poeticName)}
                                        onMouseEnter={() => geometryAudio.triggerHover()}
                                    >
                                        <div className={`
                                            ${isEinSof ? 'w-16 h-16 sm:w-20 sm:h-20' : 'w-14 h-14 sm:w-16 sm:h-16'} 
                                            p-2 rounded-full transition-all duration-300 flex items-center justify-center 
                                            ${isEinSof ? 'bg-transparent' : 'bg-[#0c1220] border-2'} 
                                            ${isSelected 
                                                ? (isEinSof ? 'scale-125 drop-shadow-[0_0_30px_white]' : 'border-cyan-400 scale-110 shadow-[0_0_15px_rgba(34,211,238,0.5)]') 
                                                : (isEinSof ? 'opacity-70 hover:opacity-100' : 'border-cyan-900 group-hover:border-cyan-400/50')
                                            } 
                                            ${isPulsing && 'animate-pulse border-red-500'}
                                        `}>
                                            <div className={`w-full h-full transition-transform duration-500 group-hover:scale-110 ${!isEinSof && 'group-hover:rotate-[360deg]'}`}>
                                                <Component />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        
                        <div className="mt-8 text-center h-24 flex flex-col items-center justify-center flex-shrink-0">
                             {selectedGeometries.length > 0 ? (
                                 <div className="animate-fadeIn">
                                     <p className="text-cyan-200 mb-4 text-sm">{selectedGeometries.length} geometria(s) selecionada(s)</p>
                                     <button onClick={handleConfirmSelection} className="px-8 py-3 bg-gradient-to-r from-cyan-700 to-purple-700 text-white rounded-full hover:scale-105 transition-transform font-semibold shadow-lg shadow-cyan-500/20 border border-cyan-400/30">
                                         Continuar
                                     </button>
                                 </div>
                             ) : (
                                 <p className="text-cyan-200/40 text-sm">Toque nas esferas para construir a música e a geometria</p>
                             )}
                        </div>
                    </div>
                )}

                {/* --- VIEW 2: DETAIL (PRE-RITUAL) --- */}
                {viewState === 'detail' && (
                     <div className="flex-grow w-full flex flex-col items-center justify-center animate-fadeIn z-10 relative px-4 pb-24">
                         <div className="w-full max-w-md bg-[#111827]/80 backdrop-blur-xl rounded-2xl p-8 border border-cyan-500/30 shadow-2xl flex flex-col items-center text-center relative overflow-hidden">
                            {/* Glows */}
                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-40 h-40 bg-cyan-500/20 blur-3xl rounded-full pointer-events-none"></div>

                            <h3 className="text-2xl font-bold text-white mb-2">
                                {selectedGeometries.length > 1 ? 'Alquimia Geométrica' : selectedGeometries[0]}
                            </h3>
                            <div className="h-0.5 w-16 bg-gradient-to-r from-transparent via-purple-400 to-transparent mb-6"></div>

                            <p className="text-cyan-100/80 mb-8 leading-relaxed font-light text-sm">
                                {selectedGeometries.length > 1 
                                    ? `Você está prestes a fundir as energias de: ${selectedGeometries.join(', ')}. Uma matriz complexa de vibração.` 
                                    : `Você está prestes a entrar na frequência única de ${selectedGeometries[0]}.`}
                            </p>

                            <DurationSelector selected={meditationDuration} onSelect={setMeditationDuration} />

                            <div className="w-full mt-4">
                                <button 
                                    onClick={handleStartRitual}
                                    className="w-full py-4 bg-gradient-to-r from-cyan-800 to-purple-800 hover:from-cyan-700 hover:to-purple-700 text-white rounded-lg font-bold shadow-lg shadow-cyan-900/40 transition-all tracking-widest uppercase text-sm border-t border-cyan-400/20"
                                >
                                    Iniciar Meditação
                                </button>
                            </div>
                         </div>
                     </div>
                )}

                {/* --- VIEW 3: RITUAL ACTIVE --- */}
                {viewState === 'ritual' && (
                    <div className="w-full flex-1 flex flex-col max-w-3xl relative z-20 animate-fadeIn min-h-0">
                         {isLoading ? (
                            <div className="flex-grow flex flex-col items-center justify-center text-center py-20">
                                <div className="w-24 h-24 border-4 border-cyan-500/20 border-t-purple-400 rounded-full animate-spin mb-6"></div>
                                <p className="text-xl text-cyan-200 font-serif animate-pulse">Calculando geometria sagrada...</p>
                            </div>
                         ) : (
                             // Content Container - Optimized for Mobile (No heavy blur, solid bg)
                             <div className="w-full h-full flex flex-col bg-[#0c1220] rounded-lg border border-cyan-500/10 shadow-2xl overflow-hidden">
                                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-8 pb-24">
                                     <div className="flex items-center justify-center mb-6 opacity-50">
                                        <div className="h-px bg-gradient-to-r from-transparent via-cyan-500 to-transparent w-full"></div>
                                        <span className="mx-4 text-cyan-500 text-xl">❖</span>
                                        <div className="h-px bg-gradient-to-r from-transparent via-cyan-500 to-transparent w-full"></div>
                                    </div>

                                     <div ref={printableRef} className="hidden print:block">
                                        <h1>Geometria Sagrada</h1>
                                        {playlist && playlist.map((item, idx) => (
                                            <div key={idx}>
                                                <h3>{item.title}</h3>
                                                <p>{item.text.replace(/###/g, '').replace(/\*\*\*/g, '')}</p>
                                            </div>
                                        ))}
                                     </div>

                                     <AudioPlayer playlist={playlist} />
                                     
                                     <VisualGenerator 
                                        promptContext={`Mandala de Geometria Sagrada complexa e brilhante representando: ${promptGeometries}. Fundo cósmico escuro, linhas de luz neon ciano e roxo. Alta resolução.`} 
                                        buttonText="Visualizar a Matriz"
                                    />

                                     <div className="flex flex-col gap-4 mt-8">
                                        <button onClick={handlePrint} className="text-cyan-300/70 hover:text-white text-sm flex items-center justify-center gap-2 border border-cyan-500/30 rounded-full py-2 transition-colors">
                                             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                             Salvar Frequência
                                         </button>
                                         <ConcludeSessionButton onConclude={handleConclude} text="Encerrar Meditação" />
                                     </div>

                                     <YouTubeAgent theme={promptGeometries} focus={geometryState?.intention || "Alinhamento Vibracional"} />
                                 </div>
                             </div>
                         )}
                    </div>
                )}
            </RoomLayout>
        </div>
    );
};

export default GeometryRoom;
