
import React from 'react';
import VoiceExperience from './VoiceExperience';
import Dashboard from './Dashboard';
import { View, AppMode } from '../types';
import { COSMIC_CONSCIOUSNESS_PROMPT } from '../data/prompts';

interface HomeProps {
    onNavigate: (view: View) => void;
    isVoiceNavOpen: boolean;
    setIsVoiceNavOpen: (isOpen: boolean) => void;
    appMode: AppMode;
    setAppMode: (mode: AppMode) => void;
    renderHeader?: boolean; 
}

const Home: React.FC<HomeProps> = ({ onNavigate, isVoiceNavOpen, setIsVoiceNavOpen, appMode, setAppMode, renderHeader = true }) => {
    return (
        <div className="flex flex-col flex-grow">
            {/* Removed overflow-y-auto here so App.tsx can control the main scroll */}
            <main className="flex-grow flex flex-col min-h-0">
                {isVoiceNavOpen ? (
                    <VoiceExperience 
                        onNavigate={onNavigate} 
                        onClose={() => setIsVoiceNavOpen(false)} 
                        systemInstruction={COSMIC_CONSCIOUSNESS_PROMPT}
                    />
                ) : (
                    <Dashboard onNavigate={onNavigate} appMode={appMode} setAppMode={setAppMode} />
                )}
            </main>
        </div>
    );
};

export default Home;
