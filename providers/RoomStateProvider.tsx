
import React, { createContext, useState, ReactNode, useContext, useEffect } from 'react';
import { Card, ActiveReading, ClassicReading, AlchemyReading, LabyrinthReading, TreeOfLifeReading, TarotState, RelationshipRoomView, ArchetypeActivationState } from '../types';

// The TarotReading type from the old structure, kept for migration logic
export interface OldTarotReading {
    spread: (Card & { position: string; activation?: ArchetypeActivationState | null; })[];
    interpretation: string;
    intention: string;
}

export interface GeometryState {
    selectedGeometries: string[]; // Store the names of selected geometries
    interpretation: string; // The JSON string of the result (single or alchemy)
    duration: number;
    intention: string;
    isAlchemy: boolean; // Differentiates the type of interpretation
}


export interface TantraState {
    selectedPractice: string | null;
}

export interface RelationshipState {
    view: RelationshipRoomView;
}

export interface MedicineState {
    selectedMedicineId: string | null;
    duration: number;
}

interface FullRoomState {
    tarot: TarotState;
    geometry: GeometryState | null;
    tantra: TantraState | null;
    relationship: RelationshipState | null;
    medicine: MedicineState | null;
}

interface RoomStateContextType {
    tarotState: TarotState;
    setTarotState: React.Dispatch<React.SetStateAction<TarotState>>;
    geometryState: GeometryState | null;
    setGeometryState: (state: GeometryState | null) => void;
    tantraState: TantraState | null;
    setTantraState: (state: TantraState | null) => void;
    relationshipState: RelationshipState | null;
    setRelationshipState: (state: RelationshipState | null) => void;
    medicineState: MedicineState | null;
    setMedicineState: (state: MedicineState | null) => void;
}

const RoomStateContext = createContext<RoomStateContextType | undefined>(undefined);

const ROOM_STATE_STORAGE_KEY = 'cosmic_consciousness_room_state';

const getInitialState = (): FullRoomState => {
    const defaultState: FullRoomState = {
        tarot: { history: [], currentReadingIndex: null },
        geometry: null,
        tantra: { selectedPractice: null },
        relationship: { view: 'menu' },
        medicine: { selectedMedicineId: null, duration: 15 },
    };
    
    try {
        const storedStateJSON = localStorage.getItem(ROOM_STATE_STORAGE_KEY);
        if (!storedStateJSON) return defaultState;
        
        const parsedState = JSON.parse(storedStateJSON);
        const oldTarotState = parsedState.tarot;

        let migratedTarotState: TarotState = { history: [], currentReadingIndex: null };

        // Migration Logic
        if (oldTarotState) {
            // Case 1: Already new format
            if (oldTarotState.history && typeof oldTarotState.currentReadingIndex !== 'undefined') {
                migratedTarotState = oldTarotState;
            } 
            // Case 2: Old format with `activeReading` property
            else if (oldTarotState.activeReading) {
                 migratedTarotState = {
                    history: [oldTarotState.activeReading],
                    currentReadingIndex: 0
                };
            }
             // Case 3: Very old format with `reading` property (from ArchetypeActivation)
            else if (oldTarotState.reading) {
                const oldReading: OldTarotReading = oldTarotState.reading;
                const classicReading: ClassicReading = {
                    type: 'classic',
                    id: Date.now(),
                    spread: oldReading.spread,
                    // FIX: The old `interpretation` was a string, but ClassicReading expects an object.
                    // This migrates the old string data into the `synthesis` field to preserve it.
                    interpretation: {
                        past: '',
                        present: '',
                        future: '',
                        synthesis: oldReading.interpretation,
                    },
                    intention: oldReading.intention,
                };
                migratedTarotState = {
                    history: [classicReading],
                    currentReadingIndex: 0
                };
            }
        }

        const migratedGeometryState = parsedState.geometry && Array.isArray(parsedState.geometry.selectedGeometries)
            ? parsedState.geometry
            : null;

        return {
            tarot: migratedTarotState,
            geometry: migratedGeometryState,
            tantra: parsedState.tantra || { selectedPractice: null },
            relationship: parsedState.relationship || { view: 'menu' },
            medicine: parsedState.medicine || { selectedMedicineId: null, duration: 15 },
        };

    } catch (error) {
        console.error("Failed to load or migrate room state from localStorage:", error);
        return defaultState;
    }
};

export const RoomStateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [fullRoomState, setFullRoomState] = useState<FullRoomState>(getInitialState);

    useEffect(() => {
        try {
            localStorage.setItem(ROOM_STATE_STORAGE_KEY, JSON.stringify(fullRoomState));
        } catch (error) {
            console.error("Failed to save room state to localStorage:", error);
        }
    }, [fullRoomState]);

    const setTarotState: React.Dispatch<React.SetStateAction<TarotState>> = (updater) => {
        setFullRoomState(prevState => ({
            ...prevState,
            tarot: typeof updater === 'function' ? updater(prevState.tarot) : updater,
        }));
    };

    const setGeometryState = (state: GeometryState | null) => {
        setFullRoomState(prevState => ({ ...prevState, geometry: state }));
    };

    const setTantraState = (state: TantraState | null) => {
        setFullRoomState(prevState => ({ ...prevState, tantra: state }));
    };
    
    const setRelationshipState = (state: RelationshipState | null) => {
        setFullRoomState(prevState => ({ ...prevState, relationship: state }));
    };

    const setMedicineState = (state: MedicineState | null) => {
        setFullRoomState(prevState => ({ ...prevState, medicine: state }));
    };

    return (
        <RoomStateContext.Provider value={{
            tarotState: fullRoomState.tarot,
            setTarotState,
            geometryState: fullRoomState.geometry,
            setGeometryState,
            tantraState: fullRoomState.tantra,
            setTantraState,
            relationshipState: fullRoomState.relationship,
            setRelationshipState,
            medicineState: fullRoomState.medicine,
            setMedicineState,
        }}>
            {children}
        </RoomStateContext.Provider>
    );
};

export const useRoomState = () => {
    const context = useContext(RoomStateContext);
    if (context === undefined) {
        throw new Error('useRoomState must be used within a RoomStateProvider');
    }
    return context;
};
