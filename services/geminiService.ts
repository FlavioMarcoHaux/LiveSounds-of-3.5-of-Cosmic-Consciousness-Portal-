

import { GoogleGenAI, Modality, Type } from "@google/genai";
import { parseGeminiJson } from "../utils/jsonUtils";
import { PlaylistItem, YouTubeSEO } from '../types';
import * as Prompts from "../data/prompts";

const API_KEY = process.env.API_KEY;
if (!API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

export const ai = new GoogleGenAI({ apiKey: API_KEY });

// --- API Call Functions ---

const generateJsonContent = async (prompt: string, schema: any, fallback: any) => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
            }
        });
        
        const parsed = parseGeminiJson(response.text);
        if (!parsed) {
             console.warn("Gemini returned invalid JSON, using fallback.");
             return fallback;
        }
        return parsed;
    } catch (error) {
        console.error("Error during JSON generation:", error);
        return fallback;
    }
};


export const getClassicTarotReading = async (cards: { name: string, position: string }[], intention?: string) => {
    const schema = {
        type: Type.OBJECT,
        properties: {
            past: { type: Type.STRING },
            present: { type: Type.STRING },
            future: { type: Type.STRING },
            synthesis: { type: Type.STRING },
        },
        required: ["past", "present", "future", "synthesis"],
    };
    const fallback = { past: 'Energias do passado se movem...', present: 'O momento presente é de atenção...', future: 'O futuro se desenha com suas escolhas...', synthesis: 'Respire e conecte-se com sua intuição para encontrar a resposta.' };
    return generateJsonContent(Prompts.classicTarotPrompt(cards, intention), schema, fallback);
};

export const getAlchemyReading = async (cards: { name: string, position: string }[], intention?: string) => {
    const schema = {
        type: Type.OBJECT,
        properties: {
            persona: { type: Type.STRING },
            shadow: { type: Type.STRING },
            integration: { type: Type.STRING },
        },
        required: ["persona", "shadow", "integration"],
    };
    const fallback = { persona: 'Sua luz brilha...', shadow: 'Sua sombra guarda poder...', integration: 'Integre os opostos para encontrar o equilíbrio.' };
    return generateJsonContent(Prompts.alchemyPrompt(cards, intention), schema, fallback);
};

export const getLabyrinthReading = async (problem: string, cards: { name: string, position: string }[], intention?: string) => {
    const schema = {
        type: Type.OBJECT,
        properties: {
            heart: { type: Type.STRING },
            minotaur: { type: Type.STRING },
            ariadne: { type: Type.STRING },
            firstStep: { type: Type.STRING },
            exit: { type: Type.STRING },
        },
        required: ["heart", "minotaur", "ariadne", "firstStep", "exit"],
    };
    const fallback = { heart: 'O coração da questão...', minotaur: 'O desafio...', ariadne: 'O fio condutor...', firstStep: 'Primeiro passo...', exit: 'A saída...' };
    return generateJsonContent(Prompts.labyrinthPrompt(problem, cards, intention), schema, fallback);
};


export const getTreeOfLifeReading = async (cards: { name: string, position: string }[], intention?: string): Promise<{ narrative: string; sephiroth: Record<string, string> }> => {
    const fallback = { narrative: "A Árvore da Vida está velada em mistério. Tente novamente.", sephiroth: { Kether: "Luz", Malkuth: "Terra" } };
    const schema = {
        type: Type.OBJECT,
        properties: {
            narrative: { type: Type.STRING },
            sephiroth: {
                type: Type.OBJECT,
                properties: {
                    Kether: { type: Type.STRING }, Chokmah: { type: Type.STRING }, Binah: { type: Type.STRING },
                    Chesed: { type: Type.STRING }, Geburah: { type: Type.STRING }, Tiphareth: { type: Type.STRING },
                    Netzach: { type: Type.STRING }, Hod: { type: Type.STRING }, Yesod: { type: Type.STRING },
                    Malkuth: { type: Type.STRING },
                },
                required: ["Kether", "Chokmah", "Binah", "Chesed", "Geburah", "Tiphareth", "Netzach", "Hod", "Yesod", "Malkuth"],
            },
        },
        required: ["narrative", "sephiroth"],
    };
    return generateJsonContent(Prompts.treeOfLifePrompt(cards, intention), schema, fallback);
};


export const getSingleGeometryInterpretation = async (geometryName: string, duration: number, intention?: string): Promise<{ interpretation: string; meditation: string }> => {
    const schema = {
        type: Type.OBJECT,
        properties: {
            interpretation: { type: Type.STRING },
            meditation: { type: Type.STRING },
        },
        required: ["interpretation", "meditation"],
    };
    // Robust fallback
    const fallback = { 
        interpretation: `A Geometria Sagrada de ${geometryName} ressoa com a estrutura fundamental do universo. Ela traz ordem ao caos e alinha sua frequência com a harmonia cósmica.`, 
        meditation: "Feche os olhos. Respire profundamente. Visualize a forma geométrica à sua frente, pulsando com luz. Sinta a estabilidade e a perfeição desta forma entrando em seu ser. A cada respiração, você se torna mais coerente. Permaneça neste estado de contemplação." 
    };
    
    return generateJsonContent(Prompts.singleGeometryPrompt(geometryName, duration, intention), schema, fallback);
};

export const getGeometricAlchemy = async (geometryNames: string[], duration: number, intention?: string): Promise<{ interpretation: string; meditation: string }> => {
    const schema = {
        type: Type.OBJECT,
        properties: {
            interpretation: { type: Type.STRING },
            meditation: { type: Type.STRING },
        },
        required: ["interpretation", "meditation"],
    };
    const fallback = { 
        interpretation: `A fusão de ${geometryNames.join(' e ')} cria um campo de ressonância único. É a união de forças complementares para acelerar sua evolução.`, 
        meditation: "Respire. Imagine estas geometrias dançando juntas em seu campo visual. Elas se entrelaçam, criando uma nova matriz de luz. Sinta essa complexidade harmoniosa organizando seus pensamentos e emoções." 
    };
    return generateJsonContent(Prompts.geometricAlchemyPrompt(geometryNames, duration, intention), schema, fallback);
};

export const getJournalInsight = async (entries: string[], intention?: string): Promise<PlaylistItem[]> => {
    if (entries.length === 0) {
        return [{ title: "Silêncio", text: "O silêncio do diário aguarda o eco de sua alma. Compartilhe um pensamento, um sentimento, um sonho." }];
    }
    const schema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING },
                text: { type: Type.STRING },
            },
            required: ["title", "text"],
        }
    };
    const fallback = [{ title: "Estática", text: "Houve uma estática na conexão com o Akasha. Sua história está segura. Tente refletir novamente em breve." }];
    return generateJsonContent(Prompts.journalInsightPrompt(entries, intention), schema, fallback);
};


export const getMicroPracticeSuggestion = async (): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: Prompts.microPracticePrompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error getting micro-practice:", error);
        return "Respire fundo. Sinta seus pés no chão. Você está aqui, agora. Isso é tudo.";
    }
};

const getPlaylistContent = async (prompt: string, fallbackTitle: string, fallbackText: string): Promise<PlaylistItem[]> => {
    const schema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING },
                text: { type: Type.STRING },
            },
            required: ["title", "text"],
        }
    };
    const fallback = [{ title: fallbackTitle, text: fallbackText }];
    return generateJsonContent(prompt, schema, fallback);
};

export const getConsciousTouchGuide = async (duration: number): Promise<PlaylistItem[]> => {
    return getPlaylistContent(Prompts.consciousTouchPrompt(duration), "Interrupção", "Seu templo sagrado aguarda. A conexão será restaurada em breve. Respire e sinta seu corpo.");
};

export const getArchetypalTouchGuide = async (cardName: string, duration: number): Promise<PlaylistItem[]> => {
    return getPlaylistContent(Prompts.archetypalTouchPrompt(cardName, duration), "Véu", "A conexão com o arquétipo está velada. Centre-se em sua intenção e tente novamente.");
};

export const getSoulGazingGuide = async (duration: number): Promise<PlaylistItem[]> => {
    return getPlaylistContent(Prompts.soulGazingPrompt(duration), "Silêncio", "A união das almas requer um canal claro. Tente novamente quando a estática diminuir.");
};


export const getArchetypeActivation = async (cardName: string, duration: number): Promise<{ mantra: string; meditation: string }> => {
    const fallback = {
        mantra: "Eu Sou a Presença Divina em Ação.",
        meditation: "Visualize a energia deste arquétipo descendo sobre você como um manto de luz. Respire e integre essa força."
    };
    const schema = {
        type: Type.OBJECT,
        properties: {
            mantra: { type: Type.STRING },
            meditation: { type: Type.STRING },
        },
        required: ["mantra", "meditation"],
    };
    return generateJsonContent(Prompts.archetypeActivationPrompt(cardName, duration), schema, fallback);
};

export const getMedicineRitual = async (medicineName: string, medicineProperty: string, duration: number, intention?: string): Promise<PlaylistItem[]> => {
    return getPlaylistContent(
        Prompts.medicineRitualPrompt(medicineName, medicineProperty, duration, intention), 
        "Floresta Silenciosa", 
        "Os espíritos da floresta estão em silêncio momentâneo. Respire fundo, sinta a medicina e tente conectar-se novamente."
    );
};

// --- Synchronicity ---
export const getSynchronicity = async (): Promise<{ card: string; geometry: string; advice: string }> => {
    const prompt = `
    Gere uma sincronicidade rápida para o usuário agora.
    1. Escolha uma carta de Tarot (ex: O Louco, 3 de Copas).
    2. Escolha uma Geometria Sagrada (ex: Flor da Vida, Metatron).
    3. Dê um conselho curto, enigmático e profundo (máx 15 palavras) unindo os dois.
    Responda APENAS em JSON.
    `;
    const schema = {
        type: Type.OBJECT,
        properties: {
            card: { type: Type.STRING },
            geometry: { type: Type.STRING },
            advice: { type: Type.STRING },
        },
        required: ["card", "geometry", "advice"]
    };
    const fallback = { card: "O Mago", geometry: "Semente da Vida", advice: "O universo se alinha quando você respira." };
    return generateJsonContent(prompt, schema, fallback);
};

// --- Image Generation ---
export const generateVisionImage = async (prompt: string): Promise<string | null> => {
    try {
        // @ts-ignore
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: `Mystical, ethereal, spiritual art style, deep colors, cosmic atmosphere, high quality, divine, detailed. ${prompt}`,
            config: {
                numberOfImages: 1,
                aspectRatio: '16:9', // Changed to landscape for better YouTube thumbnails
                outputMimeType: 'image/jpeg'
            },
        });
        const base64ImageBytes = response.generatedImages[0]?.image?.imageBytes;
        if (base64ImageBytes) {
            return `data:image/jpeg;base64,${base64ImageBytes}`;
        }
        return null;
    } catch (error) {
        console.error("Error generating image:", error);
        return null;
    }
};

// --- YouTube Marketing Agent ---
export const getYouTubeSEO = async (theme: string, focus: string): Promise<YouTubeSEO | null> => {
    const schema = {
        type: Type.OBJECT,
        properties: {
            titles: { type: Type.ARRAY, items: { type: Type.STRING } },
            description: { type: Type.STRING },
            script: { type: Type.STRING },
            tags: { type: Type.STRING },
            hashtags: { type: Type.STRING },
        },
        required: ["titles", "description", "script", "tags", "hashtags"]
    };
    const fallback = null;
    
    return await generateJsonContent(Prompts.youtubeAgentPrompt(theme, focus), schema, fallback);
}

// --- Thumbnail Prompt Generation (New Separate Step) ---
export const getYouTubeThumbnailPrompt = async (title: string, theme: string): Promise<string | null> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: Prompts.thumbnailGenerationPrompt(title, theme),
        });
        return response.text;
    } catch (error) {
        console.error("Error generating thumbnail prompt:", error);
        return null;
    }
}

export const getTextToSpeech = async (text: string): Promise<string | null> => {
    if (!text || text.trim().length === 0) return null;
    
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: text }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Kore' },
                    },
                },
            },
        });

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        
        if (base64Audio) {
            return base64Audio;
        }

        return null;
    } catch (error) {
        console.error("Error generating speech:", error);
        return null;
    }
};

// Exporting for use in VoiceExperience/CoherenceSimulator if needed
export const coherenceSimulatorPrompt = Prompts.coherenceSimulatorPrompt;