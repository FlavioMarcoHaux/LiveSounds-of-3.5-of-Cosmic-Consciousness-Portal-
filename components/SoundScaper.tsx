
import React, { useEffect, useRef, useState } from 'react';
import { View } from '../types';

interface SoundScaperProps {
    activeView: View;
    isMuted: boolean;
}

const SoundScaper: React.FC<SoundScaperProps> = ({ activeView, isMuted }) => {
    const audioCtxRef = useRef<AudioContext | null>(null);
    const gainNodeRef = useRef<GainNode | null>(null);
    const oscillatorsRef = useRef<OscillatorNode[]>([]);
    const [isInitialized, setIsInitialized] = useState(false);

    // Frequency configurations for different rooms (Binaural beats / Drone chords)
    const getFrequencies = (view: View) => {
        switch (view) {
            case 'medicine': return [110, 114, 220]; // Earthy, Theta (4Hz diff)
            case 'tarot': return [200, 207, 400]; // Mystical
            case 'geometry': return [432, 438, 864]; // Clarity, Alpha
            case 'tantra': return [60, 63, 120]; // Deep, Root/Sacral
            case 'relationship': return [300, 304, 600]; // Heart
            default: return [150, 154]; // Neutral
        }
    };

    const stopOscillators = () => {
        oscillatorsRef.current.forEach(osc => {
            try { osc.stop(); osc.disconnect(); } catch (e) {}
        });
        oscillatorsRef.current = [];
    };

    const startOscillators = (view: View) => {
        if (!audioCtxRef.current || !gainNodeRef.current) return;
        
        stopOscillators();

        const freqs = getFrequencies(view);
        const now = audioCtxRef.current.currentTime;

        freqs.forEach(freq => {
            const osc = audioCtxRef.current!.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now);
            osc.connect(gainNodeRef.current!);
            osc.start();
            oscillatorsRef.current.push(osc);
        });
    };

    // Initialize Audio Context on first interaction (handled via prop change usually or mount)
    useEffect(() => {
        if (!isMuted && !audioCtxRef.current) {
            const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
            const ctx = new AudioContextClass();
            const gain = ctx.createGain();
            // Very low volume for ambient background
            gain.gain.value = 0.03; 
            gain.connect(ctx.destination);
            
            audioCtxRef.current = ctx;
            gainNodeRef.current = gain;
            setIsInitialized(true);
        }
    }, [isMuted]);

    // Handle Mute/Unmute
    useEffect(() => {
        if (audioCtxRef.current) {
            if (isMuted) {
                audioCtxRef.current.suspend();
            } else {
                audioCtxRef.current.resume();
            }
        }
    }, [isMuted]);

    // Handle View Change
    useEffect(() => {
        if (!isMuted && isInitialized) {
            // Fade out
            if (gainNodeRef.current && audioCtxRef.current) {
                 const now = audioCtxRef.current.currentTime;
                 gainNodeRef.current.gain.cancelScheduledValues(now);
                 gainNodeRef.current.gain.setValueAtTime(gainNodeRef.current.gain.value, now);
                 gainNodeRef.current.gain.linearRampToValueAtTime(0.001, now + 1);
                 
                 setTimeout(() => {
                     startOscillators(activeView);
                     // Fade in
                     if (gainNodeRef.current && audioCtxRef.current) {
                         const t = audioCtxRef.current.currentTime;
                         gainNodeRef.current.gain.linearRampToValueAtTime(0.03, t + 2);
                     }
                 }, 1000);
            }
        }
    }, [activeView, isInitialized]);

    return null; // Invisible component
};

export default SoundScaper;
