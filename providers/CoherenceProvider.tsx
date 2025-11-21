import React, { createContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import { useJournal } from '../hooks/useJournal';
import { getMicroPracticeSuggestion } from '../services/geminiService';

interface CoherenceContextType {
    coherenceScore: number;
    suggestion: string | null;
    clearSuggestion: () => void;
    dissonanceEvent: { practice: string } | null;
    clearDissonanceEvent: () => void;
}

export const CoherenceContext = createContext<CoherenceContextType>({
    coherenceScore: 75,
    suggestion: null,
    clearSuggestion: () => {},
    dissonanceEvent: null,
    clearDissonanceEvent: () => {},
});

interface CoherenceProviderProps {
    children: ReactNode;
}

// Simple sentiment analysis placeholder
const calculateSentiment = (text: string): number => {
    const negativeWords = ['triste', 'raiva', 'medo', 'ansiedade', 'preocupado', 'sozinho', 'confuso', 'dificuldade', 'dor', 'ódio', 'frustrado'];
    const words = text.toLowerCase().split(/\s+/);
    let negativeCount = 0;
    words.forEach(word => {
        if (negativeWords.some(negWord => word.includes(negWord))) {
            negativeCount++;
        }
    });
    // Returns a score from -5 (very negative) to 0 (neutral/positive)
    return -Math.min(negativeCount, 5);
};

export const CoherenceProvider: React.FC<CoherenceProviderProps> = ({ children }) => {
    const { entries } = useJournal();
    const [coherenceScore, setCoherenceScore] = useState(75);
    const prevCoherenceScoreRef = useRef(75);
    const [suggestion, setSuggestion] = useState<string | null>(null);
    const [dissonanceEvent, setDissonanceEvent] = useState<{ practice: string } | null>(null);
    const [lastSuggestionTime, setLastSuggestionTime] = useState(0);

    const clearSuggestion = useCallback(() => {
        setSuggestion(null);
    }, []);

    const clearDissonanceEvent = useCallback(() => {
        setDissonanceEvent(null);
    }, []);

    useEffect(() => {
        const baseScore = 75;
        const recencyWeight = 1.5;
        const totalEntries = entries.length;

        if (totalEntries === 0) {
            setCoherenceScore(baseScore);
            return;
        }

        let sentimentSum = 0;
        entries.forEach((entry, index) => {
            const age = totalEntries - index;
            const weight = Math.pow(recencyWeight, -age);
            sentimentSum += calculateSentiment(entry.text) * weight;
        });

        const newScore = Math.max(0, Math.min(100, baseScore + (sentimentSum * 5)));
        setCoherenceScore(newScore);

        const drop = prevCoherenceScoreRef.current - newScore;
        const now = Date.now();
        const cooldown = 5 * 60 * 1000; // 5 minutes

        // Trigger for sharp drop (Coherence Agent Intervention)
        if (drop >= 20 && !dissonanceEvent && !suggestion && (now - lastSuggestionTime > cooldown)) {
            const fetchPractice = async () => {
                const practice = await getMicroPracticeSuggestion();
                setDissonanceEvent({ practice });
                setLastSuggestionTime(now);
            };
            fetchPractice();
        }
        // Trigger for persistent low score (Subtle Suggestion)
        else if (newScore < 50 && !suggestion && !dissonanceEvent && (now - lastSuggestionTime > cooldown)) {
            const fetchSuggestion = async () => {
                const newSuggestion = await getMicroPracticeSuggestion();
                setSuggestion(newSuggestion);
                setLastSuggestionTime(now);
            };
            fetchSuggestion();
        }
        
        prevCoherenceScoreRef.current = newScore;

    }, [entries, suggestion, dissonanceEvent, lastSuggestionTime]);


    return (
        <CoherenceContext.Provider value={{ coherenceScore, suggestion, clearSuggestion, dissonanceEvent, clearDissonanceEvent }}>
            {children}
        </CoherenceContext.Provider>
    );
};