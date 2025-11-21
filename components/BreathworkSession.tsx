
import React, { useState, useEffect, useCallback } from 'react';
import { AppMode } from '../types';
import BreathworkAnimator from './BreathworkAnimator';
import { listenToSyncMessages, postSyncMessage, closeChannel } from '../services/syncService';
import { tantraAudio } from '../services/TantraAudioEngine';

interface BreathworkSessionProps {
    appMode: AppMode;
    onBack: () => void;
}

type Phase = 'inhale' | 'hold' | 'exhale' | 'idle';
type SyncEvent = { type: 'start' | 'phaseChange'; phase: Phase; countdown: number; cycle: number };

const PHASES: { name: Phase; duration: number; instruction: string }[] = [
    { name: 'inhale', duration: 4, instruction: 'Inspire profundamente pelo nariz...' },
    { name: 'hold', duration: 7, instruction: 'Sustente a energia...' },
    { name: 'exhale', duration: 8, instruction: 'Expire lentamente pela boca...' },
];

const TOTAL_CYCLES = 7;

const BreathworkSession: React.FC<BreathworkSessionProps> = ({ appMode, onBack }) => {
    const [isSessionActive, setIsSessionActive] = useState(false);
    const [currentPhase, setCurrentPhase] = useState<Phase>('idle');
    const [countdown, setCountdown] = useState(0);
    const [cycleCount, setCycleCount] = useState(0);
    const [isWaiting, setIsWaiting] = useState(false);

    // Audio Sync Wrapper
    const setAudioPhase = (phase: Phase) => {
        tantraAudio.triggerBreathPhase(phase);
    }

    const advancePhase = useCallback((currentCycle: number, phaseIndex: number) => {
        const nextPhaseIndex = (phaseIndex + 1) % PHASES.length;
        const nextPhase = PHASES[nextPhaseIndex];
        const newCycleCount = nextPhase.name === 'inhale' ? currentCycle + 1 : currentCycle;

        if (newCycleCount > TOTAL_CYCLES) {
            setIsSessionActive(false);
            setCurrentPhase('idle');
            setAudioPhase('idle');
            setCycleCount(0);
            return;
        }

        setCurrentPhase(nextPhase.name);
        setAudioPhase(nextPhase.name);
        setCountdown(nextPhase.duration);
        setCycleCount(newCycleCount);

        if (appMode === 'couple') {
            postSyncMessage({ type: 'phaseChange', phase: nextPhase.name, countdown: nextPhase.duration, cycle: newCycleCount });
        }
    }, [appMode]);


    useEffect(() => {
        if (!isSessionActive) return;

        const phaseIndex = PHASES.findIndex(p => p.name === currentPhase);
        const timer = setTimeout(() => {
            advancePhase(cycleCount, phaseIndex);
        }, (PHASES[phaseIndex]?.duration ?? 0) * 1000);

        return () => clearTimeout(timer);
    }, [isSessionActive, currentPhase, cycleCount, advancePhase]);


    useEffect(() => {
        if (!isSessionActive || countdown <= 0) return;
        const interval = setInterval(() => {
            setCountdown(prev => prev - 1);
        }, 1000);
        return () => clearInterval(interval);
    }, [isSessionActive, countdown]);

     useEffect(() => {
        if (appMode !== 'couple') return;

        const unsubscribe = listenToSyncMessages((event: MessageEvent<SyncEvent>) => {
            const { type, phase, countdown, cycle } = event.data;
             if (type === 'start' && !isSessionActive) {
                setIsWaiting(false);
                setIsSessionActive(true);
                setCurrentPhase(PHASES[0].name);
                setAudioPhase(PHASES[0].name);
                setCountdown(PHASES[0].duration);
                setCycleCount(1);
            } else if (type === 'phaseChange') {
                setIsSessionActive(cycle <= TOTAL_CYCLES);
                setCurrentPhase(phase);
                setAudioPhase(phase);
                setCountdown(countdown);
                setCycleCount(cycle);
            }
        });
        
        return () => {
            unsubscribe();
            closeChannel();
        };

    }, [appMode, isSessionActive]);


    const startSession = () => {
        if (appMode === 'couple') {
            postSyncMessage({ type: 'start' });
            setIsWaiting(true);
        }
        setIsSessionActive(true);
        setCurrentPhase('inhale');
        setAudioPhase('inhale');
        setCountdown(PHASES[0].duration);
        setCycleCount(1);
    };
    
    const handleBack = () => {
        setAudioPhase('idle');
        onBack();
    }

    const getInstruction = () => {
        if(isWaiting) return "Aguardando o parceiro se conectar...";
        return PHASES.find(p => p.name === currentPhase)?.instruction || "Prepare-se para esta jornada de respiração.";
    }

    return (
        <div className="relative flex flex-col h-full w-full items-center justify-between p-4 animate-fadeIn bg-gradient-to-br from-red-900/10 via-black/20 to-purple-900/10 rounded-xl">
             <button
                onClick={handleBack}
                className="absolute top-4 left-4 text-indigo-300/70 hover:text-white transition-colors z-20 p-2 rounded-full hover:bg-white/10"
                aria-label="Voltar às práticas"
            >
               <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
            </button>
             <div className="text-center mt-8">
                <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-amber-300 mb-2">Respiração {appMode === 'couple' ? 'Sincronizada' : '4-7-8'}</h3>
                <p className="text-amber-200/70">{appMode === 'couple' ? 'Sincronizem seus corações e respirações.' : 'Ancore sua energia e acalme sua mente.'}</p>
            </div>
            
            <div className="flex flex-col items-center justify-center flex-grow w-full">
                <BreathworkAnimator phase={currentPhase} />
                <div className="h-24 text-center mt-8">
                     <p className="text-xl text-white font-light transition-opacity duration-500">{getInstruction()}</p>
                    {isSessionActive && !isWaiting && (
                        <p className="text-6xl font-thin text-amber-300 mt-2 transition-opacity duration-500">{countdown}</p>
                    )}
                </div>
            </div>
            
            <div className="flex flex-col items-center mb-8">
                {!isSessionActive ? (
                    <button
                        onClick={startSession}
                        className="px-8 py-3 bg-red-600/70 text-white rounded-full hover:bg-red-500/90 transition-all duration-300 border border-red-500/50 shadow-lg shadow-red-500/20"
                    >
                       {appMode === 'couple' ? 'Iniciar Sessão Sincronizada' : 'Iniciar Sessão'}
                    </button>
                ) : (
                     <p className="text-sm text-red-300/70">Ciclo {cycleCount} de {TOTAL_CYCLES}</p>
                )}
            </div>
        </div>
    );
};

export default BreathworkSession;
