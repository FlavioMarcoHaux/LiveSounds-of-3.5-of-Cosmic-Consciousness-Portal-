




import React, { useState, useMemo, useRef } from 'react';
import { ActiveReading, CardSpread, TreeOfLifeReading, PlaylistItem, ClassicReading, AlchemyReading, LabyrinthReading } from '../types';
import ArchetypeActivation from './ArchetypeActivation';
import CosmicCard from './CosmicCard';
import AudioPlayer from './AudioPlayer';
import VisualGenerator from './VisualGenerator';
import ConcludeSessionButton from './ConcludeSessionButton';
import { tarotAudio } from '../services/TarotAudioEngine';
import YouTubeAgent from './YouTubeAgent';

const SEPHIROTH_POSITIONS = [
    { name: 'Kether', x: 50, y: 10 }, { name: 'Chokmah', x: 25, y: 25 }, { name: 'Binah', x: 75, y: 25 },
    { name: 'Chesed', x: 25, y: 45 }, { name: 'Geburah', x: 75, y: 45 }, { name: 'Tiphareth', x: 50, y: 60 },
    { name: 'Netzach', x: 25, y: 75 }, { name: 'Hod', x: 75, y: 75 }, { name: 'Yesod', x: 50, y: 90 },
    { name: 'Malkuth', x: 50, y: 110 }
];
const TREE_PATHS = "M50,10 L25,25 M50,10 L75,25 M25,25 L75,25 M25,25 L25,45 M75,25 L75,45 M25,45 L75,45 M25,45 L50,60 M75,45 L50,60 M25,45 L25,75 M75,45 L75,75 M50,60 L25,75 M50,60 L75,75 M50,60 L50,90 M25,75 L75,75 M25,75 L50,90 M75,75 L50,90 M50,90 L50,110";

interface ReadingDisplayProps {
    reading: ActiveReading;
    readingIndex: number;
    isLoadingInterpretation: boolean;
}

const TreeOfLifeSVG: React.FC<{ spread: CardSpread, onActivate: (index: number) => void }> = ({ spread, onActivate }) => {
    
    const handleActivate = (index: number) => {
        tarotAudio.triggerSephira(index);
        onActivate(index);
    }

    return (
        <div className="w-full max-w-[280px] sm:max-w-xs mx-auto">
            <svg viewBox="0 0 100 125">
                <defs>
                     <filter id="tree-glow"><feGaussianBlur stdDeviation="1.5" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                </defs>
                <path d={TREE_PATHS} stroke="rgba(167, 139, 250, 0.2)" strokeWidth="0.5" fill="none" />
                {SEPHIROTH_POSITIONS.map(({ name, x, y }, index) => {
                     const card = spread.find(c => c.position === name);
                     return (
                        <g key={name} onClick={() => handleActivate(index)} className="cursor-pointer group" aria-label={`Ativar ${name}`}>
                            <circle cx={x} cy={y} r="8" fill={'rgba(15,23,42,0.8)'} stroke="#a78bfa" strokeWidth="1" className="transition-all duration-300 group-hover:stroke-cyan-300 group-hover:r-9" filter="url(#tree-glow)" />
                            <circle cx={x} cy={y} r="8" fill="transparent" className="transition-all duration-300 group-hover:fill-white/10" />
                            <text x={x} y={y + 1.5} textAnchor="middle" fontSize="3.5" fill="#fff" className="font-sans pointer-events-none group-hover:font-bold">{card?.name.substring(0,3)}</text>
                        </g>
                     )
                })}
            </svg>
        </div>
    );
}

const TreeOfLifeReadingView: React.FC<{ reading: TreeOfLifeReading; readingIndex: number; isLoadingInterpretation: boolean }> = ({ reading, readingIndex, isLoadingInterpretation }) => {
    const [activationCardIndex, setActivationCardIndex] = useState<number | null>(null);
    const printableRef = useRef<HTMLDivElement>(null);

    const narrative = reading.interpretation?.narrative || '';
    const sephiroth = reading.interpretation?.sephiroth || {};
    const interpretationAvailable = narrative.trim().length > 0 && Object.keys(sephiroth).length > 0;
    
    const playlist: PlaylistItem[] = useMemo(() => {
        if (!interpretationAvailable) return [];
        
        const parts = [
            `### NARRATIVA DO RELÂMPAGO BRILHANTE ###\n\n${narrative}`,
            ...Object.entries(sephiroth).map(([title, text]) => `### ${title.toUpperCase()} ###\n\n${text}`)
        ];
        
        return [{
            title: "Jornada da Árvore da Vida Completa",
            text: parts.join('\n\n***\n\n')
        }];
    }, [interpretationAvailable, narrative, sephiroth]);

     const handlePrint = () => {
        if (printableRef.current) {
            const printWindow = window.open('', '_blank');
            if (printWindow) {
                printWindow.document.write(`
                    <html>
                    <head>
                        <title>Árvore da Vida</title>
                        <style>body { font-family: serif; padding: 40px; }</style>
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

    return (
        <div className="w-full h-full flex flex-col items-center">
            {activationCardIndex !== null && (
                <ArchetypeActivation 
                    readingIndex={readingIndex} 
                    cardIndex={activationCardIndex} 
                    onClose={() => setActivationCardIndex(null)} 
                />
            )}

            <div className="w-full mb-6">
                <TreeOfLifeSVG spread={reading.spread} onActivate={setActivationCardIndex} />
            </div>
             <div className="w-full max-w-3xl mx-auto bg-[#0f0c1d]/80 backdrop-blur-md p-6 sm:p-8 rounded-xl border border-purple-500/20 shadow-2xl">
                <div className="w-full">
                    {isLoadingInterpretation && !interpretationAvailable && (
                         <p className="text-indigo-200 animate-pulse text-center">A Consciência Cósmica está canalizando a narrativa...</p>
                    )}
                    {interpretationAvailable && (
                        <div className="animate-fadeIn">
                             <div className="flex items-center justify-center mb-6 opacity-50">
                                <div className="h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent w-full"></div>
                                <span className="mx-4 text-purple-500 text-xl">❖</span>
                                <div className="h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent w-full"></div>
                            </div>

                            <div ref={printableRef} className="hidden print:block text-black">
                                <h1>Árvore da Vida</h1>
                                {playlist.map(p => <p key={p.title}>{p.text}</p>)}
                            </div>

                             <AudioPlayer playlist={playlist} />
                             
                             <VisualGenerator promptContext={`Arte cabalística mística representando a Árvore da Vida com: ${reading.spread.map(c => c.name).join(', ')}`} />

                            <div className="text-center mt-6 pt-4 border-t border-purple-500/10 flex flex-col items-center gap-4">
                                <p className="text-purple-300/80 text-sm font-semibold animate-pulse">✨ Toque em uma esfera na Árvore da Vida para entrar na Câmara de Ativação ✨</p>
                                <button onClick={handlePrint} className="text-xs text-indigo-400 hover:text-white border border-indigo-500/30 rounded-full px-4 py-1">Salvar Leitura</button>
                            </div>

                            <YouTubeAgent theme="A Árvore da Vida" focus={reading.intention || "Ascensão Espiritual"} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const getPlaylistFromInterpretation = (reading: ActiveReading): PlaylistItem[] => {
    switch(reading.type) {
        case 'classic': {
            const interp = reading.interpretation as ClassicReading['interpretation'];
            return [
                { title: 'Passado', text: interp.past },
                { title: 'Presente', text: interp.present },
                { title: 'Futuro', text: interp.future },
                { title: 'Síntese Cósmica', text: interp.synthesis },
            ];
        }
        case 'alchemy': {
            const interp = reading.interpretation as AlchemyReading['interpretation'];
            return [
                { title: 'Persona (Luz)', text: interp.persona },
                { title: 'Sombra (Escuridão)', text: interp.shadow },
                { title: 'A Grande Obra (Integração)', text: interp.integration },
            ];
        }
        case 'labyrinth': {
            const interp = reading.interpretation as LabyrinthReading['interpretation'];
            return [
                { title: 'O Coração do Labirinto', text: interp.heart },
                { title: 'O Minotauro (Obstáculo)', text: interp.minotaur },
                { title: 'O Fio de Ariadne (A Chave)', text: interp.ariadne },
                { title: 'O Primeiro Passo', text: interp.firstStep },
                { title: 'O Portal de Saída (Resultado)', text: interp.exit },
            ];
        }
        default:
            return [];
    }
}

const ReadingDisplay: React.FC<ReadingDisplayProps> = ({ reading, readingIndex, isLoadingInterpretation }) => {
    const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null);
    const printableRef = useRef<HTMLDivElement>(null);

    if (reading.type === 'treeOfLife') {
        return <TreeOfLifeReadingView reading={reading} readingIndex={readingIndex} isLoadingInterpretation={isLoadingInterpretation} />;
    }
    
    const rawPlaylist = useMemo(() => getPlaylistFromInterpretation(reading), [reading]);
    const interpretationAvailable = rawPlaylist.length > 0 && rawPlaylist.some(item => item.text && item.text.trim() !== '' && item.text.trim() !== '...');

    const playlist: PlaylistItem[] = useMemo(() => {
        if (!interpretationAvailable) return [];
        
        const combinedText = rawPlaylist.map(item => `### ${item.title.toUpperCase()} ###\n\n${item.text}`).join('\n\n***\n\n');
        
        return [{
            title: "Leitura Completa",
            text: combinedText
        }];
    }, [interpretationAvailable, rawPlaylist]);
    
     const handlePrint = () => {
        if (printableRef.current) {
            const printWindow = window.open('', '_blank');
            if (printWindow) {
                printWindow.document.write(`
                    <html>
                    <head>
                        <title>Oráculo do Coração</title>
                        <style>body { font-family: serif; padding: 40px; color: #000; } h1{color: #4338ca;} p {margin-bottom: 10px;}</style>
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

    const handleCardClick = (index: number) => {
        tarotAudio.triggerSelect();
        setSelectedCardIndex(index);
    }


    return (
        <div className="w-full flex flex-col items-center animate-fadeIn relative">
            {selectedCardIndex !== null && (
                <ArchetypeActivation 
                    readingIndex={readingIndex} 
                    cardIndex={selectedCardIndex} 
                    onClose={() => setSelectedCardIndex(null)} 
                />
            )}

            {/* SPREAD DISPLAY */}
            <div className="flex justify-center items-start gap-4 sm:gap-6 mb-8 flex-wrap relative z-10">
                {reading.spread.map((card, index) => (
                    <div key={`${card.name}-${index}`} className="flex flex-col items-center group cursor-pointer" onClick={() => handleCardClick(index)} onMouseEnter={() => tarotAudio.triggerHover()}>
                         <div className="relative w-24 h-auto sm:w-36 lg:w-40 rounded-lg shadow-[0_0_15px_rgba(168,85,247,0.2)] transition-all duration-500 group-hover:shadow-[0_0_25px_rgba(192,132,252,0.5)] group-hover:-translate-y-2 group-hover:scale-105">
                            <CosmicCard name={card.name} />
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-[2px]">
                                <span className="text-white font-bold text-[10px] sm:text-xs uppercase tracking-widest border border-white/30 px-2 py-1 rounded-full">Ativar</span>
                            </div>
                        </div>
                        <div className="mt-3 text-center">
                            <p className="text-[10px] sm:text-xs text-purple-300 uppercase tracking-widest opacity-70 mb-1">{card.position}</p>
                            <p className="text-xs sm:text-sm text-white font-serif">{card.name}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* READING CONTENT (THE ALTAR SCROLL) */}
            <div className="w-full max-w-3xl mx-auto bg-[#0f0c1d]/90 backdrop-blur-md p-6 sm:p-8 rounded-xl border border-purple-500/20 shadow-2xl relative overflow-hidden">
                {/* Top Glow */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-50"></div>
                
                <div className="w-full relative z-10">
                     {isLoadingInterpretation && !interpretationAvailable && (
                        <div className="flex flex-col items-center justify-center py-10">
                            <div className="w-12 h-12 border-2 border-purple-500/30 border-t-purple-400 rounded-full animate-spin mb-4"></div>
                            <p className="text-indigo-200 animate-pulse text-center font-serif">Decifrando a linguagem das estrelas...</p>
                        </div>
                     )}
                     
                     {interpretationAvailable && (
                        <div className="animate-fadeIn">
                             <div className="flex items-center justify-center mb-8 opacity-50">
                                <div className="h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent w-full"></div>
                                <span className="mx-4 text-purple-500 text-xl">❖</span>
                                <div className="h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent w-full"></div>
                            </div>

                             <div ref={printableRef} className="hidden print:block text-black">
                                <h1>Leitura: {reading.type.toUpperCase()}</h1>
                                <p>Intenção: {reading.intention}</p>
                                <hr/>
                                {playlist.map(p => <div key={p.title} style={{whiteSpace: 'pre-wrap'}}>{p.text}</div>)}
                            </div>
                            
                            <div className="mb-8 text-center">
                                <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 to-purple-200 font-serif mb-2">{getReadingTitle(reading.type)}</h3>
                                <p className="text-indigo-300/60 text-sm italic">"{reading.intention}"</p>
                            </div>

                            <AudioPlayer playlist={playlist} />

                            <VisualGenerator 
                                promptContext={`Uma carta de tarot mística e etérea representando a síntese de: ${reading.spread.map(c => c.name).join(', ')}. Estilo onírico, cósmico, sagrado.`} 
                                buttonText="Visualizar o Arcano Oculto"
                            />
                            
                             <div className="flex flex-col gap-4 mt-8">
                                <button 
                                    onClick={handlePrint} 
                                    className="text-indigo-300/70 hover:text-white text-sm flex items-center justify-center gap-2 border border-indigo-500/30 rounded-full py-2 hover:bg-indigo-500/10 transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                    Exportar Revelação
                                </button>
                            </div>
                            
                            <YouTubeAgent theme={`Tarot - ${getReadingTitle(reading.type)}`} focus={reading.intention} />
                        </div>
                     )}
                </div>
            </div>
        </div>
    );
};

const getReadingTitle = (type: string) => {
    switch(type) {
        case 'classic': return "A Jornada do Tempo";
        case 'alchemy': return "Espelho da Alma";
        case 'labyrinth': return "O Caminho de Saída";
        default: return "Revelação Cósmica";
    }
}

export default ReadingDisplay;
