
export type View = 'home' | 'tarot' | 'geometry' | 'tantra' | 'relationship' | 'medicine' | 'marketing';
export type AppMode = 'solo' | 'couple';
export type RelationshipRoomView = 'menu' | 'journal' | 'simulator';

export interface ArchetypeActivationState {
    mantra: string;
    meditation: string;
    duration: number;
}

export interface Card {
    name: string;
    // Note: 'position' and 'activation' are added dynamically, not part of the base type.
}

// --- Tarot Reading Types ---

export type ReadingType = 'classic' | 'alchemy' | 'labyrinth' | 'treeOfLife';

export type CardSpread = (Card & {
    position: string;
    activation?: ArchetypeActivationState | null;
})[];

export interface ClassicReading {
    type: 'classic';
    id: number;
    spread: CardSpread;
    interpretation: {
        past: string;
        present: string;
        future: string;
        synthesis: string;
    };
    intention: string;
}

export interface AlchemyReading {
    type: 'alchemy';
    id: number;
    spread: CardSpread;
    interpretation: {
        persona: string;
        shadow: string;
        integration: string;
    };
    intention: string;
}

export interface LabyrinthReading {
    type: 'labyrinth';
    id: number;
    problem: string;
    spread: CardSpread;
    interpretation: {
        heart: string;
        minotaur: string;
        ariadne: string;
        firstStep: string;
        exit: string;
    };
    intention: string;
}

export interface TreeOfLifeReading {
    type: 'treeOfLife';
    id: number;
    spread: CardSpread;
    interpretation: {
        narrative: string;
        sephiroth: Record<string, string>;
    };
    intention: string;
}

export type ActiveReading = ClassicReading | AlchemyReading | LabyrinthReading | TreeOfLifeReading;


// --- State Types ---
export interface TarotState {
    history: ActiveReading[];
    currentReadingIndex: number | null;
}

// --- Audio Player Type ---
export interface PlaylistItem {
    title: string;
    text: string;
}

// --- Medicine Types ---
export interface Medicine {
    id: string;
    name: string;
    description: string;
    property: string; // e.g., "Aterramento Profundo", "Visão Astral"
}

// --- Marketing Agent Types ---
export interface YouTubeSEO {
    titles: string[];
    description: string;
    script: string;
    tags: string;
    hashtags: string;
    // thumbnailPrompt removed from here, handled separately
}