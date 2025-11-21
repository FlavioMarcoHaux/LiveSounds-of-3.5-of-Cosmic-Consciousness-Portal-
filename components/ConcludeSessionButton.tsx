import React from 'react';

interface ConcludeSessionButtonProps {
    onConclude: () => void;
    text?: string;
}

const ConcludeSessionButton: React.FC<ConcludeSessionButtonProps> = ({ onConclude, text = "Concluir e Iniciar Novo" }) => {
    return (
        <div className="text-center mt-6">
            <button
                onClick={onConclude}
                className="px-4 py-2 bg-indigo-600/50 text-indigo-200 text-xs rounded-full hover:bg-indigo-600/80 transition-all duration-300 border border-indigo-400/30 shadow-md"
            >
                {text}
            </button>
        </div>
    );
};

export default ConcludeSessionButton;
