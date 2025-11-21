
import React, { useState, useEffect } from 'react';
import Home from './components/Home';
import { TarotRoom } from './components/TarotRoom';
import GeometryRoom from './components/GeometryRoom';
import TantraRoom from './components/TantraRoom';
import RelationshipRoom from './components/RelationshipRoom';
import { MedicineRoom } from './components/MedicineRoom';
import MarketingRoom from './components/MarketingRoom';
import { CoherenceProvider } from './providers/CoherenceProvider';
import { RoomStateProvider } from './providers/RoomStateProvider';
import GenerativeArt from './components/GenerativeArt';
import ProactiveSuggestion from './components/ProactiveSuggestion';
import CoherenceAgent from './components/CoherenceAgent';
import Header from './components/Header';
import AudioOrchestrator from './components/AudioOrchestrator';
import { View, AppMode } from './types';

const App: React.FC = () => {
    const [currentView, setCurrentView] = useState<View>('home');
    const [isVoiceNavOpen, setIsVoiceNavOpen] = useState(false);
    const [appMode, setAppMode] = useState<AppMode>('solo');
    const [isMuted, setIsMuted] = useState(false);
    const [userLevel, setUserLevel] = useState(1);

    // Gamification logic (Simple visit counter simulation)
    useEffect(() => {
        const visits = parseInt(localStorage.getItem('cosmic_visits') || '0');
        const newVisits = visits + 1;
        localStorage.setItem('cosmic_visits', newVisits.toString());
        
        // Level up every 5 interactions
        setUserLevel(Math.floor(newVisits / 5) + 1);
    }, [currentView]);

    const handleNavigate = (view: View) => {
        setCurrentView(view);
    };

    const renderRoom = () => {
        switch (currentView) {
            case 'tarot':
                return <TarotRoom onNavigate={handleNavigate} />;
            case 'geometry':
                return <GeometryRoom onNavigate={handleNavigate} />;
            case 'tantra':
                return <TantraRoom onNavigate={handleNavigate} appMode={appMode} setAppMode={setAppMode} />;
            case 'relationship':
                return <RelationshipRoom onNavigate={handleNavigate} />;
            case 'medicine':
                return <MedicineRoom onNavigate={handleNavigate} />;
            case 'marketing':
                return <MarketingRoom onNavigate={handleNavigate} />;
            default:
                return null;
        }
    };

    const HeaderComponent = (
        <Header 
            onToggleVoice={currentView === 'home' ? () => setIsVoiceNavOpen(!isVoiceNavOpen) : undefined}
            isVoiceActive={currentView === 'home' ? isVoiceNavOpen : false}
            isMuted={isMuted}
            onToggleMute={() => setIsMuted(!isMuted)}
            userLevel={userLevel}
            showHero={currentView === 'home'}
            currentView={currentView} // Pass context to header for Mixer
        />
    );

    return (
        <CoherenceProvider>
            <RoomStateProvider>
                <div className="h-[100dvh] bg-gradient-to-br from-[#0a0a1a] via-[#100f2c] to-[#0a0a1a] flex flex-col items-center font-sans transition-all duration-500 relative isolate overflow-hidden">
                    <GenerativeArt />
                    
                    {/* The Maestro controls all audio */}
                    <AudioOrchestrator activeView={currentView} isMuted={isMuted} />
                    
                    {/* 
                        LAYOUT LOGIC:
                        If Home: Header + Content share the scroll container (Header scrolls away).
                        If Room: Header is Fixed (Top), Content Scrolls independently.
                    */}

                    {currentView === 'home' ? (
                        // Home Layout: Single scroll container for Header + Content
                        <div className="w-full h-full overflow-y-auto custom-scrollbar flex flex-col min-h-0">
                            <div className="w-full max-w-4xl mx-auto flex-shrink-0 p-4 sm:p-6 lg:p-8 pb-0">
                                {HeaderComponent}
                            </div>
                            <div className="w-full max-w-4xl mx-auto flex-grow flex flex-col p-4 sm:p-6 lg:p-8 pt-2">
                                <Home 
                                    onNavigate={handleNavigate} 
                                    isVoiceNavOpen={isVoiceNavOpen} 
                                    setIsVoiceNavOpen={setIsVoiceNavOpen} 
                                    appMode={appMode} 
                                    setAppMode={setAppMode}
                                    renderHeader={false} 
                                />
                            </div>
                        </div>
                    ) : (
                        // Room Layout: Fixed Header, Scrollable Content
                        <>
                            <div className="w-full max-w-4xl mx-auto z-20 flex-shrink-0 p-4 sm:p-6 lg:p-8 pb-0">
                                {HeaderComponent}
                            </div>
                            <div className="w-full max-w-4xl mx-auto flex flex-col h-full flex-grow z-10 mt-4 min-h-0 p-4 sm:p-6 lg:p-8 pt-0">
                                {renderRoom()}
                            </div>
                        </>
                    )}
                    
                     <ProactiveSuggestion />
                     <CoherenceAgent />
                     
                    <footer className="absolute bottom-0 w-full text-center p-2 text-[10px] text-indigo-400/20 pointer-events-none z-0">
                        <p>Consciousness Portal v8.0 - The Cosmic Mixer</p>
                    </footer>
                </div>
            </RoomStateProvider>
        </CoherenceProvider>
    );
};

export default App;