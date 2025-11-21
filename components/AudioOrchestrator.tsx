
import React, { useEffect, useRef, useState } from 'react';
import { View } from '../types';
import { audioEngine } from '../services/AudioEngine';
import { medicineAudio } from '../services/MedicineAudioEngine';
import { tarotAudio } from '../services/TarotAudioEngine';
import { geometryAudio } from '../services/GeometryAudioEngine';
import { tantraAudio } from '../services/TantraAudioEngine';
import { relationshipAudio } from '../services/RelationshipAudioEngine';

interface AudioOrchestratorProps {
    activeView: View;
    isMuted: boolean;
}

const AudioOrchestrator: React.FC<AudioOrchestratorProps> = ({ activeView, isMuted }) => {
    const [isInitialized, setIsInitialized] = useState(false);

    // --- GLOBAL INTERACTION LISTENER ---
    // This ensures the AudioContext is resumed on the first click anywhere in the app
    useEffect(() => {
        const handleFirstInteraction = () => {
            const engines = [audioEngine, medicineAudio, tarotAudio, geometryAudio, tantraAudio, relationshipAudio];
            engines.forEach(engine => {
                if (engine && typeof (engine as any).resume === 'function') {
                    (engine as any).resume();
                }
            });
        };

        window.addEventListener('click', handleFirstInteraction, { once: true });
        window.addEventListener('touchstart', handleFirstInteraction, { once: true });
        window.addEventListener('keydown', handleFirstInteraction, { once: true });

        return () => {
            window.removeEventListener('click', handleFirstInteraction);
            window.removeEventListener('touchstart', handleFirstInteraction);
            window.removeEventListener('keydown', handleFirstInteraction);
        };
    }, []);

    // --- ORCHESTRATION LOGIC ---

    // 1. Handle Mute Global
    useEffect(() => {
        // Mute specific engines
        audioEngine.setMute(isMuted);
        medicineAudio.setMute(isMuted);
        tarotAudio.setMute(isMuted);
        geometryAudio.setMute(isMuted);
        tantraAudio.setMute(isMuted);
        relationshipAudio.setMute(isMuted);
        
        // Init Orchestrator context on unmute if needed
        if (!isMuted && !isInitialized) {
            setIsInitialized(true);
        }
    }, [isMuted, isInitialized]);


    // 2. Handle View Transitions
    useEffect(() => {
        console.log(`Orchestrator: Switching to ${activeView}`);

        // Always fade out everything first
        if (activeView !== 'home') audioEngine.fadeOut();
        if (activeView !== 'medicine') medicineAudio.fadeOut();
        if (activeView !== 'tarot') tarotAudio.fadeOut();
        if (activeView !== 'geometry') geometryAudio.fadeOut();
        if (activeView !== 'tantra') tantraAudio.fadeOut();
        
        // Relationship Audio is shared with Marketing
        if (activeView !== 'relationship' && activeView !== 'marketing') {
            relationshipAudio.fadeOut();
        }

        // Now fade in the target
        setTimeout(() => {
            if (activeView === 'home') {
                audioEngine.fadeIn();
            } else if (activeView === 'medicine') {
                medicineAudio.fadeIn();
            } else if (activeView === 'tarot') {
                tarotAudio.fadeIn();
            } else if (activeView === 'geometry') {
                geometryAudio.fadeIn();
            } else if (activeView === 'tantra') {
                tantraAudio.fadeIn();
            } else if (activeView === 'relationship' || activeView === 'marketing') {
                // Use Relationship Audio for Marketing (Communication/Throat Chakra vibes)
                relationshipAudio.fadeIn();
            }
        }, 500);

    }, [activeView]);

    // 3. Handle Voice Ducking (Maestro Control)
    useEffect(() => {
        const handleVoiceChange = (e: Event) => {
            const customEvent = e as CustomEvent;
            const isSpeaking = customEvent.detail?.isPlaying;
            
            // Command the engine active in the current view
            switch(activeView) {
                case 'home':
                    audioEngine.setVoiceDucking(isSpeaking);
                    break;
                case 'medicine':
                    medicineAudio.setVoiceDucking(isSpeaking);
                    break;
                case 'tarot':
                    tarotAudio.setVoiceDucking(isSpeaking);
                    break;
                case 'geometry':
                    geometryAudio.setVoiceDucking(isSpeaking);
                    break;
                case 'tantra':
                    tantraAudio.setVoiceDucking(isSpeaking);
                    break;
                case 'relationship':
                case 'marketing':
                    relationshipAudio.setVoiceDucking(isSpeaking);
                    break;
            }
        };

        window.addEventListener('cosmic-voice-change', handleVoiceChange);
        return () => window.removeEventListener('cosmic-voice-change', handleVoiceChange);
    }, [activeView]);

    return null;
};

export default AudioOrchestrator;