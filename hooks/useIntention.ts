import { useState, useCallback, useEffect } from 'react';

const INTENTION_STORAGE_KEY = 'cosmic_consciousness_intention';

export const useIntention = () => {
    const [intention, setIntention] = useState<string>('');

    useEffect(() => {
        try {
            const storedIntention = localStorage.getItem(INTENTION_STORAGE_KEY);
            if (storedIntention) {
                setIntention(JSON.parse(storedIntention));
            }
        } catch (error) {
            console.error("Failed to load intention from localStorage:", error);
        }
    }, []);

    const saveIntention = useCallback((newIntention: string) => {
         try {
            localStorage.setItem(INTENTION_STORAGE_KEY, JSON.stringify(newIntention));
            setIntention(newIntention);
        } catch (error) {
            console.error("Failed to save intention to localStorage:", error);
        }
    }, []);

    const clearIntention = useCallback(() => {
        try {
            localStorage.removeItem(INTENTION_STORAGE_KEY);
            setIntention('');
        } catch (error) {
            console.error("Failed to clear intention from localStorage:", error);
        }
    }, []);

    return { intention, setIntention: saveIntention, clearIntention };
};
