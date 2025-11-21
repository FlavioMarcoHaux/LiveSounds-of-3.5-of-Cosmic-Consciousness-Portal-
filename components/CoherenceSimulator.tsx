import React, { useState } from 'react';
import VoiceExperience from './VoiceExperience';
import { coherenceSimulatorPrompt } from '../services/geminiService';

const CoherenceSimulator: React.FC = () => {
    const [scenario, setScenario] = useState('');
    const [isSessionActive, setIsSessionActive] = useState(false);
    const [systemInstruction, setSystemInstruction] = useState('');

    const startSimulation = () => {
        if (scenario.trim()) {
            setSystemInstruction(coherenceSimulatorPrompt(scenario));
            setIsSessionActive(true);
        }
    };

    if (isSessionActive) {
        return (
            <div className="w-full h-full flex-grow">
                 <VoiceExperience 
                    systemInstruction={systemInstruction}
                    onClose={() => setIsSessionActive(false)} 
                />
            </div>
        );
    }

    return (
        <div className="w-full max-w-3xl flex-grow flex flex-col bg-black/20 backdrop-blur-sm p-6 rounded-lg border border-rose-500/20 animate-fadeIn">
            <h3 className="text-xl font-bold text-rose-300 mb-4">Preparar Simulação</h3>
            <p className="text-rose-200/80 mb-4">
                Descreva a conversa ou situação que você deseja praticar. Seja específico sobre com quem você está falando e qual é o seu objetivo.
            </p>
            <textarea
                value={scenario}
                onChange={(e) => setScenario(e.target.value)}
                placeholder="Ex: Quero praticar como dizer ao meu parceiro que preciso de mais tempo sozinho sem fazê-lo se sentir rejeitado."
                className="w-full flex-grow bg-black/30 border border-rose-400/30 rounded-md p-3 text-white placeholder-rose-200/40 focus:outline-none focus:ring-2 focus:ring-pink-400 resize-none"
            />
            <button
                onClick={startSimulation}
                disabled={!scenario.trim()}
                className="mt-4 px-6 py-3 bg-rose-600 text-white rounded-full hover:bg-rose-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full font-semibold"
            >
                Iniciar Simulação de Coerência
            </button>
        </div>
    );
};

export default CoherenceSimulator;