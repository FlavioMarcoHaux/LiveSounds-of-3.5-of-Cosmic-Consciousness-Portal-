import { useState, useCallback, useEffect } from 'react';

export interface JournalEntry {
    id: number;
    text: string;
    timestamp: number;
}

const JOURNAL_STORAGE_KEY = 'cosmic_consciousness_journal';

export const useJournal = () => {
    const [entries, setEntries] = useState<JournalEntry[]>([]);

    useEffect(() => {
        try {
            const storedEntries = localStorage.getItem(JOURNAL_STORAGE_KEY);
            if (storedEntries) {
                setEntries(JSON.parse(storedEntries));
            }
        } catch (error) {
            console.error("Failed to load journal entries from localStorage:", error);
        }
    }, []);

    const saveEntries = (updatedEntries: JournalEntry[]) => {
         try {
            localStorage.setItem(JOURNAL_STORAGE_KEY, JSON.stringify(updatedEntries));
            setEntries(updatedEntries);
        } catch (error) {
            console.error("Failed to save journal entries to localStorage:", error);
        }
    }

    const addEntry = useCallback((text: string) => {
        const newEntry: JournalEntry = {
            id: Date.now(),
            text,
            timestamp: Date.now(),
        };
        saveEntries([...entries, newEntry]);
    }, [entries]);

    const clearEntries = useCallback(() => {
        saveEntries([]);
    }, []);

    return { entries, addEntry, clearEntries };
};
