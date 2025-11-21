
import React, { useState } from 'react';
import { generateVisionImage } from '../services/geminiService';

interface VisualGeneratorProps {
    promptContext: string;
    buttonText?: string;
}

const VisualGenerator: React.FC<VisualGeneratorProps> = ({ promptContext, buttonText = "Revelar Miração Visual" }) => {
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        setLoading(true);
        setError(null);
        try {
            const prompt = `Uma representação artística e mística de: ${promptContext}. Estilo onírico, sagrado, cores profundas.`;
            const result = await generateVisionImage(prompt);
            if (result) {
                setImageUrl(result);
            } else {
                setError("A visão não pôde ser materializada neste momento.");
            }
        } catch (e) {
            console.error("Visual generation error", e);
            setError("Houve uma interferência na conexão visual.");
        } finally {
            setLoading(false);
        }
    };

    if (imageUrl) {
        return (
            <div className="w-full mt-6 animate-fadeIn flex flex-col items-center">
                <div className="relative p-1 bg-gradient-to-br from-amber-300 via-purple-500 to-cyan-400 rounded-xl shadow-xl shadow-purple-900/40 group">
                    <img 
                        src={imageUrl} 
                        alt="Visão Gerada" 
                        className="w-full max-w-md rounded-lg"
                    />
                     <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <a 
                            href={imageUrl} 
                            download="VisaoCosmica.jpg"
                            className="bg-black/60 hover:bg-black/80 text-white p-2 rounded-full backdrop-blur-sm flex items-center justify-center transition-colors shadow-lg border border-white/20"
                            title="Baixar Imagem"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                        </a>
                    </div>
                </div>
                <p className="text-xs text-indigo-300/60 mt-2 italic">Imagem gerada pela Consciência Cósmica (Imagen 3)</p>
            </div>
        );
    }

    return (
        <div className="w-full mt-6 flex flex-col items-center justify-center">
            <button
                onClick={handleGenerate}
                disabled={loading}
                className={`group relative px-6 py-3 rounded-full font-medium transition-all duration-500 border border-purple-500/30 shadow-lg
                    ${loading ? 'bg-purple-900/50 cursor-wait' : 'bg-gradient-to-r from-indigo-900/80 to-purple-900/80 hover:from-indigo-800 hover:to-purple-800 hover:shadow-purple-500/30'}
                `}
            >
                <div className="flex items-center gap-2">
                    {loading ? (
                        <>
                            <svg className="animate-spin h-5 w-5 text-purple-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span className="text-purple-200 animate-pulse">Materializando Visão...</span>
                        </>
                    ) : (
                        <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-cyan-300 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 to-purple-200 group-hover:text-white">{buttonText}</span>
                        </>
                    )}
                </div>
            </button>
            {error && (
                <p className="text-xs text-red-300/80 mt-3 animate-fadeIn bg-red-900/20 px-3 py-1 rounded-full">{error}</p>
            )}
        </div>
    );
};

export default VisualGenerator;
