

import React, { useState, useEffect, useCallback } from 'react';
import PracticePlayer from './PracticePlayer';
import CosmicCard from './CosmicCard';
import { majorArcana } from '../data/tarotDeck';
import { getArchetypalTouchGuide } from '../services/geminiService';
import { Card, PlaylistItem } from '../types';

interface ArchetypalTouchSessionProps {
    onBack: () => void;
    duration: number;
}

const ArchetypalTouchSession: React.FC<ArchetypalTouchSessionProps> = ({ onBack, duration }) => {
    const [drawnCard, setDrawnCard] = useState<Card | null>(null);
    const [isDrawing, setIsDrawing] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            const cardName = majorArcana[Math.floor(Math.random() * majorArcana.length)];
            setDrawnCard({ name: cardName });
            setIsDrawing(false);
        }, 2000); // 2-second drawing animation

        return () => clearTimeout(timer);
    }, []);

    const fetchGuidanceForCard = useCallback((duration: number): Promise<PlaylistItem[]> => {
        if (!drawnCard) {
            return Promise.resolve([{ title: "Aguardando Arquétipo", text: "O cosmos ainda não revelou seu guia." }]);
        }
        return getArchetypalTouchGuide(drawnCard.name, duration);
    }, [drawnCard]);

    const visual = (
        <div className="w-48 h-auto rounded-lg shadow-lg shadow-purple-500/40 transition-all duration-500">
            {isDrawing ? (
                <div className="animate-pulse">
                    <CosmicCard isBack={true} />
                </div>
            ) : (
                <div className="animate-fadeIn">
                    <CosmicCard name={drawnCard?.name} />
                </div>
            )}
        </div>
    );

    return (
        <PracticePlayer
            title="Toque Arquetípico"
            description={!isDrawing && drawnCard ? `Integrando a energia de ${drawnCard.name}` : 'Sorteando um arquétipo do Tarot...'}
            fetchGuidance={fetchGuidanceForCard}
            onBack={onBack}
            duration={duration}
        >
            {visual}
        </PracticePlayer>
    );
};

export default ArchetypalTouchSession;
