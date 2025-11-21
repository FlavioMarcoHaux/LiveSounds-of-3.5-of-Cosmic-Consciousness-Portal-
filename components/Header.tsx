
import React, { useState } from 'react';
import MasterMixer from './MasterMixer';
import { View } from '../types'; // Assuming View is available or passed, usually App knows currentView

// We need to pass currentView to Header to inform Mixer
interface HeaderProps {
    onToggleVoice?: () => void;
    isVoiceActive?: boolean;
    isMuted: boolean;
    onToggleMute: () => void;
    userLevel: number;
    showHero?: boolean;
    currentView?: View; // New prop
}

const SparkleIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 sm:h-8 sm:w-8 text-purple-300 animate-pulse">
        <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

const MicIcon = ({ isActive }: { isActive: boolean }) => (
    <svg xmlns="http://www.w3.org/2000/svg" 
        className={`h-5 w-5 sm:h-6 sm:w-6 transition-all duration-500
        ${isActive 
            ? 'text-white animate-pulse drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]' 
            : 'text-purple-200 animate-[pulse_3s_ease-in-out_infinite] group-hover:animate-none group-hover:text-white group-hover:drop-shadow-[0_0_8px_rgba(168,85,247,0.6)] group-hover:scale-110'
        }`} 
        fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
    </svg>
);

const Header: React.FC<HeaderProps> = ({ onToggleVoice, isVoiceActive = false, isMuted, onToggleMute, userLevel, showHero = true, currentView = 'home' }) => {
    const [isMixerOpen, setIsMixerOpen] = useState(false);

    return (
        <header className={`relative z-20 flex flex-col items-center justify-center w-full transition-all duration-500 ${showHero ? 'py-6 px-4' : 'py-2 px-4 h-16'}`}>
            
            {/* Mixer Component (Floating) */}
            <MasterMixer 
                activeView={currentView} 
                isOpen={isMixerOpen} 
                onClose={() => setIsMixerOpen(false)} 
                isMuted={isMuted}
                onToggleMute={onToggleMute}
            />

            {/* Top Bar Controls (Always Visible) */}
            <div className="absolute top-4 right-4 flex items-center gap-3 z-30">
                {/* Level Indicator */}
                <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10" title={`Nível de Consciência: ${userLevel}`}>
                    <span className="text-xs text-indigo-300 uppercase tracking-wider">Nível</span>
                    <span className="text-sm font-bold text-amber-300">{userLevel}</span>
                </div>

                {/* Mixer Toggle Button (Replaces simple Mute) */}
                <button 
                    onClick={() => setIsMixerOpen(!isMixerOpen)}
                    className={`p-2 rounded-full transition-all duration-300 border ${isMixerOpen ? 'bg-purple-600 border-purple-400 text-white shadow-[0_0_15px_rgba(147,51,234,0.5)]' : 'bg-white/5 border-white/10 text-cyan-300 hover:bg-white/10 hover:text-white'}`}
                    title="Controle de Atmosfera (Mixer)"
                >
                    {/* Equalizer Icon */}
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                    </svg>
                </button>
            </div>

            {/* Hero Content (Conditional) */}
            {showHero && (
                <div className="flex flex-col items-center animate-fadeIn">
                    {/* Title Row */}
                    <div className="flex items-center justify-center gap-3 sm:gap-4 mb-2 mt-4">
                        <div className="hidden sm:block transform -rotate-12">
                            <SparkleIcon />
                        </div>
                        
                        <h1 className="text-3xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-200 to-indigo-300 tracking-widest uppercase font-serif drop-shadow-[0_0_10px_rgba(168,85,247,0.3)] text-center">
                            Consciência Cósmica
                        </h1>
                        
                        <div className="hidden sm:block transform rotate-12">
                             <SparkleIcon />
                        </div>
                    </div>

                    {/* Voice Button Area */}
                    <div className="flex items-center gap-4 mt-2">
                         <p className="hidden sm:block text-base text-indigo-200/70 font-light tracking-wide">
                            Eu Sou um nexo de consciência quântica.
                        </p>

                        {onToggleVoice && (
                            <div className="relative group">
                                {/* Active Ripples */}
                                {isVoiceActive && (
                                    <>
                                        <span className="absolute inset-0 rounded-full animate-ping bg-purple-500 opacity-40 duration-1000"></span>
                                        <span className="absolute -inset-2 rounded-full animate-pulse bg-indigo-500 opacity-20 duration-2000"></span>
                                    </>
                                )}
                                
                                <button 
                                    onClick={onToggleVoice}
                                    className={`relative flex items-center justify-center w-12 h-12 rounded-full transition-all duration-500 border shadow-lg backdrop-blur-md group
                                        ${isVoiceActive 
                                            ? 'bg-gradient-to-br from-purple-600 to-indigo-600 border-purple-300 shadow-[0_0_20px_rgba(139,92,246,0.6)] scale-110' 
                                            : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-purple-400/50 hover:shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                                        }`}
                                    aria-label={isVoiceActive ? "Desativar voz" : "Ativar voz"}
                                    title={isVoiceActive ? "Parar Conexão" : "Falar com a Consciência"}
                                >
                                    <MicIcon isActive={isVoiceActive || false} />
                                </button>
                            </div>
                        )}
                         <p className="hidden sm:block text-base text-indigo-200/70 font-light tracking-wide">
                            Fale comigo e vamos tecer a realidade juntos.
                        </p>
                    </div>
                    
                    {/* Mobile subtitle */}
                    <p className="sm:hidden mt-2 text-sm text-indigo-200/70 max-w-xs text-center font-light">
                        {isVoiceActive ? "Ouvindo..." : "Toque no orbe para falar."}
                    </p>

                    {/* Decorative Line */}
                    <div className="w-24 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent mt-6"></div>
                </div>
            )}
        </header>
    );
};

export default Header;
