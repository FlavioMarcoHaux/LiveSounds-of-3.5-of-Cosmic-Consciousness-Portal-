import React, { useState, useEffect } from 'react';
import { View } from '../types';
import { audioEngine } from '../services/AudioEngine';
import { medicineAudio } from '../services/MedicineAudioEngine';
import { geometryAudio } from '../services/GeometryAudioEngine';
import { tarotAudio } from '../services/TarotAudioEngine';
import { tantraAudio } from '../services/TantraAudioEngine';
import { relationshipAudio } from '../services/RelationshipAudioEngine';

interface MasterMixerProps {
    activeView: View;
    isOpen: boolean;
    onClose: () => void;
    isMuted: boolean;
    onToggleMute: () => void;
}

type EQState = { bass: number; mid: number; treble: number };

const MasterMixer: React.FC<MasterMixerProps> = ({ activeView, isOpen, onClose, isMuted, onToggleMute }) => {
    const [eq, setEq] = useState<EQState>({ bass: 0.5, mid: 0.5, treble: 0.5 });
    // Track stem volumes: 0 to 1
    const [stems, setStems] = useState<Record<string, number>>({});

    // Define channel map based on view
    const getChannelConfig = (view: View) => {
        switch (view) {
            case 'home': return ['Ambiente', 'Interface'];
            case 'medicine': return ['Natureza', 'Vida', 'Espírito', 'Instrumentos'];
            case 'geometry': return ['Base', 'Harmonia', 'Melodia'];
            case 'tarot': return ['Cristais', 'Subconsciente', 'Efeitos'];
            case 'tantra': return ['Respiração', 'Kundalini', 'Ambiente'];
            case 'relationship': return ['Melodia', 'Profundidade', 'Ambiente'];
            case 'marketing': return ['Melodia', 'Profundidade', 'Ambiente']; // Uses Relationship Audio Engine
            default: return [];
        }
    };

    // Initialize stems when view changes
    useEffect(() => {
        const channels = getChannelConfig(activeView);
        const initialStems: Record<string, number> = {};
        channels.forEach(c => initialStems[c] = 1.0);
        setStems(initialStems);
    }, [activeView]);

    // Apply Audio Updates
    useEffect(() => {
        // Apply Global EQ to ALL engines
        [audioEngine, medicineAudio, geometryAudio, tarotAudio, tantraAudio, relationshipAudio].forEach(eng => {
             if ((eng as any).setGlobalEQ) {
                 (eng as any).setGlobalEQ(eq.bass, eq.mid, eq.treble);
             }
        });

        // Apply Stem Volumes to ACTIVE engine
        let activeEngine: any = null;
        if (activeView === 'home') activeEngine = audioEngine;
        else if (activeView === 'medicine') activeEngine = medicineAudio;
        else if (activeView === 'geometry') activeEngine = geometryAudio;
        else if (activeView === 'tarot') activeEngine = tarotAudio;
        else if (activeView === 'tantra') activeEngine = tantraAudio;
        else if (activeView === 'relationship') activeEngine = relationshipAudio;
        else if (activeView === 'marketing') activeEngine = relationshipAudio; // Reuse engine

        if (activeEngine && activeEngine.setStemVolume) {
             Object.entries(stems).forEach(([stem, vol]) => {
                 activeEngine.setStemVolume(stem, vol);
             });
        }
    }, [eq, stems, activeView]);


    const handleStemChange = (stem: string, val: number) => {
        setStems(prev => ({ ...prev, [stem]: val }));
    };
    
    if (!isOpen) return null;

    const eqBands: { label: string; key: keyof EQState }[] = [
        { label: 'Grave', key: 'bass' },
        { label: 'Médio', key: 'mid' },
        { label: 'Agudo', key: 'treble' }
    ];

    return (
        <div className="fixed top-20 right-4 z-50 w-80 bg-black/80 backdrop-blur-xl border border-white/20 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] animate-fadeIn overflow-hidden">
            
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-white/10 bg-white/5">
                <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                    <span className="text-sm font-bold text-white tracking-wider uppercase text-shadow-sm">Master Mixer</span>
                </div>
                <div className="flex items-center gap-2">
                     {/* Master Switch */}
                    <button 
                        onClick={onToggleMute}
                        className={`w-10 h-5 rounded-full flex items-center transition-colors duration-300 px-1 ${!isMuted ? 'bg-green-500' : 'bg-gray-600'}`}
                        title={!isMuted ? "Áudio Ligado" : "Áudio Mudo"}
                    >
                        <div className={`w-3 h-3 bg-white rounded-full shadow-md transform transition-transform duration-300 ${!isMuted ? 'translate-x-5' : 'translate-x-0'}`}></div>
                    </button>
                    <button onClick={onClose} className="text-white/50 hover:text-white ml-2 text-xl font-light">×</button>
                </div>
            </div>

            <div className="p-5 space-y-6">
                
                {/* Global EQ Section */}
                <div>
                    <p className="text-xs text-indigo-300 font-semibold mb-4 uppercase tracking-widest flex justify-between items-center">
                        <span>Master EQ</span>
                        <span className="text-[9px] px-2 py-0.5 bg-white/10 rounded text-white/70">Analog Saturation Active</span>
                    </p>
                    <div className="flex justify-between gap-3">
                        {eqBands.map(({ label, key }) => {
                             const val = eq[key];
                             return (
                                <div key={label} className="flex flex-col items-center flex-1 group">
                                    <div className="h-32 w-10 bg-black/40 rounded-full relative border border-white/10 overflow-hidden shadow-inner">
                                         {/* Fill Bar with Gradient */}
                                         <div 
                                            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-cyan-600 via-purple-500 to-pink-500 opacity-80 pointer-events-none transition-all duration-100 group-hover:opacity-100"
                                            style={{ height: `${val * 100}%` }}
                                         ></div>
                                         
                                         {/* Interactive Slider */}
                                         <input 
                                            type="range" min="0" max="1" step="0.01"
                                            value={val}
                                            onChange={(e) => setEq(prev => ({ ...prev, [key]: parseFloat(e.target.value) }))}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-ns-resize z-10"
                                            title={`${label}: ${Math.round((val - 0.5) * 20)}dB`}
                                         />
                                         
                                         {/* Center Line (0dB) */}
                                         <div className="absolute top-1/2 left-0 right-0 h-px bg-white/30 pointer-events-none"></div>

                                         {/* Thumb Indicator */}
                                         <div 
                                            className="absolute left-0 right-0 h-0.5 bg-white shadow-[0_0_8px_white] pointer-events-none transition-all duration-100"
                                            style={{ bottom: `${val * 100}%` }}
                                         ></div>
                                    </div>
                                    <span className="text-[10px] text-white/60 mt-2 uppercase font-medium tracking-wide">{label}</span>
                                </div>
                             );
                        })}
                    </div>
                </div>

                <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>

                {/* Contextual Stems Section */}
                <div>
                    <p className="text-xs text-indigo-300 font-semibold mb-3 uppercase tracking-widest flex justify-between items-center">
                        <span>Mixagem da Sala: {activeView.charAt(0).toUpperCase() + activeView.slice(1)}</span>
                    </p>
                    <div className="space-y-4">
                        {Object.entries(stems).map(([name, vol]) => (
                            <div key={name} className="group">
                                <div className="flex justify-between text-[10px] text-white/90 mb-1.5 font-medium">
                                    <span className="uppercase tracking-wider">{name}</span>
                                    <span className="font-mono text-cyan-300">{Math.round(vol * 100)}%</span>
                                </div>
                                <div className="relative h-3 bg-black/50 rounded-full overflow-hidden border border-white/10 group-hover:border-white/30 transition-colors shadow-inner">
                                    <div 
                                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-600 to-purple-500 transition-all duration-150 shadow-[0_0_10px_rgba(168,85,247,0.5)]"
                                        style={{ width: `${vol * 100}%` }}
                                    ></div>
                                    <input 
                                        type="range" min="0" max="1" step="0.01"
                                        value={vol}
                                        onChange={(e) => handleStemChange(name, parseFloat(e.target.value))}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                </div>
                            </div>
                        ))}
                        {Object.keys(stems).length === 0 && (
                            <p className="text-xs text-white/30 italic text-center py-2">Controles indisponíveis nesta área.</p>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default MasterMixer;