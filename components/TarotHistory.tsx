import React, { useState } from 'react';
import { ActiveReading } from '../types';

interface TarotHistoryProps {
    history: ActiveReading[];
    currentIndex: number | null;
    onSelectHistory: (index: number) => void;
    onShowMenu: () => void;
    onClear: () => void;
}

const TarotHistory: React.FC<TarotHistoryProps> = ({ history, currentIndex, onSelectHistory, onShowMenu, onClear }) => {
    const [isOpen, setIsOpen] = useState(false);

    const getReadingTitle = (reading: ActiveReading) => {
        const id = `#${(reading.id % 1000).toString().padStart(3, '0')}`;
        switch (reading.type) {
            case 'classic': return `Jornada Clássica ${id}`;
            case 'alchemy': return `Alquimia ${id}`;
            case 'labyrinth': return `Labirinto ${id}`;
            case 'treeOfLife': return `Árvore da Vida ${id}`;
        }
    }
    
    if (history.length === 0) return null;

    const historyContent = (
         <>
            <h3 className="text-lg font-bold text-purple-200 text-center sm:text-left mb-4">Crônica do Oráculo</h3>
            <div className="flex flex-col gap-2 h-full sm:h-[calc(100%-8rem)] overflow-y-auto">
                {history.map((r, i) => (
                    <button key={r.id} onClick={() => { onSelectHistory(i); setIsOpen(false); }} className={`w-full text-left p-3 sm:p-2 rounded-md transition-colors ${currentIndex === i ? 'bg-purple-500/30 text-white' : 'hover:bg-purple-500/10 text-indigo-200'}`}>
                        {getReadingTitle(r)}
                    </button>
                ))}
            </div>
            <div className="mt-4 sm:absolute sm:bottom-4 sm:left-4 sm:right-4">
                <button onClick={() => { onShowMenu(); setIsOpen(false); }} className="w-full text-center p-3 rounded-md font-semibold text-cyan-300 hover:bg-cyan-500/10 transition-colors">
                    + Nova Leitura
                </button>
                <button onClick={onClear} className="w-full text-center p-2 mt-2 text-xs text-red-400/70 hover:bg-red-500/10 rounded-md">
                    Limpar Histórico
                </button>
            </div>
         </>
    );

    return (
        <>
            {/* Mobile Tray Button */}
            <div className="sm:hidden fixed bottom-4 right-4 z-30">
                <button onClick={() => setIsOpen(!isOpen)} className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center shadow-lg shadow-purple-800/50">
                    <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" /></svg>
                </button>
            </div>
             {/* Mobile Panel */}
            <div className={`sm:hidden fixed inset-0 bg-black/70 backdrop-blur-md z-20 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsOpen(false)}>
                <div className={`fixed bottom-0 left-0 right-0 p-4 bg-gray-800/90 border-t border-purple-500/30 rounded-t-2xl transition-transform duration-300 ${isOpen ? 'translate-y-0' : 'translate-y-full'}`} onClick={e => e.stopPropagation()}>
                    {historyContent}
                </div>
            </div>

            {/* Desktop Sidebar */}
            <div className="hidden sm:block absolute left-4 top-1/2 -translate-y-1/2 h-[calc(100%-8rem)] w-56 bg-black/20 backdrop-blur-sm p-4 rounded-xl border border-purple-500/20 z-20">
                {historyContent}
            </div>
        </>
    );
}

export default TarotHistory;