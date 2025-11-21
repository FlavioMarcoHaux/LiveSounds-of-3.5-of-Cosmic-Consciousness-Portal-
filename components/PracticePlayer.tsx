




import React, { useState, useEffect, useRef } from 'react';
import AudioPlayer from './AudioPlayer';
import { PlaylistItem } from '../types';
import VisualGenerator from './VisualGenerator';
import ConcludeSessionButton from './ConcludeSessionButton';
import YouTubeAgent from './YouTubeAgent';

interface PracticePlayerProps {
    title: string;
    description: string;
    fetchGuidance: (duration: number) => Promise<PlaylistItem[]>;
    duration: number; // Passed from parent
    onBack: () => void;
    children?: React.ReactNode; // For optional custom visuals
}

const PracticePlayer: React.FC<PracticePlayerProps> = ({ title, description, fetchGuidance, duration, onBack, children }) => {
    const [playlist, setPlaylist] = useState<PlaylistItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const printableRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const getGuidance = async () => {
            setIsLoading(true);
            setPlaylist([]);
            const items = await fetchGuidance(duration);
            
            if (items.length > 0) {
                const combinedText = items.map(item => `### ${item.title.toUpperCase()} ###\n\n${item.text}`).join('\n\n***\n\n');
                setPlaylist([{ title: title, text: combinedText }]);
            } else {
                setPlaylist([]);
            }
            
            setIsLoading(false);
        };
        getGuidance();
    }, [fetchGuidance, duration, title]);

    const handlePrint = () => {
        if (printableRef.current) {
            const printWindow = window.open('', '_blank');
            if (printWindow) {
                printWindow.document.write(`
                    <html>
                    <head>
                        <title>${title}</title>
                        <style>
                            body { font-family: serif; background: #fff; color: #000; padding: 40px; }
                            h1 { text-align: center; color: #7f1d1d; }
                            h3 { color: #991b1b; margin-top: 20px; }
                            p { line-height: 1.6; }
                        </style>
                    </head>
                    <body>
                        <h1>${title}</h1>
                        <p><em>${description}</em></p>
                        <hr/>
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
        <div className="w-full flex flex-col max-w-3xl relative">
            {isLoading ? (
                <div className="text-center m-auto py-20">
                    <div className="w-24 h-24 mx-auto border-4 border-red-500/20 border-t-amber-400 rounded-full animate-spin mb-6"></div>
                    <p className="text-xl text-amber-200 font-serif animate-pulse">Invocando o Fogo Sagrado...</p>
                    <p className="text-sm text-red-400/50 mt-2 tracking-widest uppercase">Preparando {title}</p>
                </div>
            ) : (
                <div className="w-full bg-gradient-to-b from-red-950/80 to-black/90 backdrop-blur-md p-6 sm:p-8 rounded-lg border border-red-500/20 shadow-2xl animate-fadeIn">
                    <div className="flex items-center justify-center mb-6 opacity-50">
                        <div className="h-px bg-gradient-to-r from-transparent via-red-500 to-transparent w-full"></div>
                        <span className="mx-4 text-red-500 text-xl">❖</span>
                        <div className="h-px bg-gradient-to-r from-transparent via-red-500 to-transparent w-full"></div>
                    </div>

                    {/* Title & Header in Content */}
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-300 to-amber-200">{title}</h2>
                        <p className="text-sm text-red-200/60 mt-1">{description}</p>
                    </div>

                    {children && (
                        <div className="flex justify-center mb-8">
                            {children}
                        </div>
                    )}
                    
                    {/* --- Printable Content Ref --- */}
                    <div ref={printableRef} className="hidden print:block">
                        {playlist && playlist.map((item, idx) => (
                            <div key={idx}>
                                <h3>{item.title}</h3>
                                <p>{item.text.replace(/###/g, '').replace(/\*\*\*/g, '')}</p>
                            </div>
                        ))}
                    </div>

                    <AudioPlayer playlist={playlist} />

                    <VisualGenerator 
                        promptContext={`Arte espiritual mística tântrica representando: ${title}. Energia do fogo, união, êxtase sagrado, kundalini. Cores: Vermelho, Dourado, Laranja.`} 
                        buttonText="Revelar Visão Tântrica"
                    />

                    <div className="flex flex-col gap-4 mt-8">
                        <button 
                        onClick={handlePrint} 
                        className="text-red-300/70 hover:text-white text-sm flex items-center justify-center gap-2 border border-red-500/30 rounded-full py-2 transition-colors hover:bg-red-500/10"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                            Salvar Prática
                        </button>
                        <ConcludeSessionButton onConclude={onBack} text="Encerrar Prática" />
                    </div>
                    
                    <YouTubeAgent theme={`Tantra: ${title}`} focus="Despertar da Energia Vital" />
                </div>
            )}
        </div>
    );
};

export default PracticePlayer;
