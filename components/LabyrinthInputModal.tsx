import React, { useState } from 'react';

interface LabyrinthInputModalProps {
    onClose: () => void;
    onStart: (problem: string) => void;
}

const LabyrinthInputModal: React.FC<LabyrinthInputModalProps> = ({ onClose, onStart }) => {
    const [problem, setProblem] = useState('');

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-40 flex items-center justify-center animate-fadeIn" onClick={onClose}>
            <div className="relative bg-gray-800/80 border border-purple-500/50 rounded-2xl p-8 shadow-2xl shadow-purple-900/50 flex flex-col items-center gap-4 animate-fadeIn w-full max-w-lg mx-4" onClick={e => e.stopPropagation()}>
                <button
                    onClick={onClose}
                    className="absolute top-2 right-2 text-indigo-300/70 hover:text-white transition-colors z-20 p-2 rounded-full hover:bg-white/10"
                    aria-label="Fechar"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
                
                <h3 className="text-2xl font-bold text-purple-200">O Fio de Ariadne</h3>
                <p className="text-indigo-300 text-center">Descreva o labirinto que você enfrenta. Qual é o problema ou desafio para o qual busca clareza?</p>
                <textarea
                    value={problem}
                    onChange={e => setProblem(e.target.value)}
                    placeholder="Ex: Sinto-me perdido em minha carreira e não sei qual o próximo passo..."
                    className="w-full h-32 bg-transparent border border-purple-400/50 rounded-md p-3 mt-2 text-white placeholder-indigo-300/40 focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
                    aria-label="Descrição do problema"
                />
                <button
                    onClick={() => onStart(problem)}
                    disabled={!problem.trim()}
                    className="mt-4 px-6 py-3 bg-purple-600 text-white rounded-full hover:bg-purple-500 transition-colors disabled:opacity-50"
                >
                    Entrar no Labirinto
                </button>
            </div>
        </div>
    );
};

export default LabyrinthInputModal;