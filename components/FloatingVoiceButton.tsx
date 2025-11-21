import React from 'react';

interface FloatingVoiceButtonProps {
    onClick: () => void;
}

const FloatingVoiceButton: React.FC<FloatingVoiceButtonProps> = ({ onClick }) => {
    return (
        <button
            onClick={onClick}
            className="relative w-20 h-20 bg-purple-600 rounded-full flex items-center justify-center shadow-lg shadow-purple-500/30 hover:bg-purple-500 transition-all duration-300 transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-purple-400/50"
            aria-label="Ativar navegação por voz"
        >
            <div className="absolute inset-0 bg-purple-400 rounded-full animate-ping opacity-60"></div>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
        </button>
    );
};

export default FloatingVoiceButton;