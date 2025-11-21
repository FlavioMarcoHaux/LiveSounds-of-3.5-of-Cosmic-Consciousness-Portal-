

import React, { useState, useEffect } from 'react';
import { getYouTubeSEO, generateVisionImage, getYouTubeThumbnailPrompt } from '../services/geminiService';
import { YouTubeSEO } from '../types';

interface YouTubeAgentProps {
    theme: string;
    focus: string;
}

const YouTubeAgent: React.FC<YouTubeAgentProps> = ({ theme, focus }) => {
    const [isSeoLoading, setIsSeoLoading] = useState(false);
    const [isThumbLoading, setIsThumbLoading] = useState(false);
    
    const [data, setData] = useState<YouTubeSEO | null>(null);
    const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        if (isOpen) {
            // Duck audio when the modal is open
            const event = new CustomEvent('cosmic-voice-change', { detail: { isPlaying: true } });
            window.dispatchEvent(event);
        } else {
             const event = new CustomEvent('cosmic-voice-change', { detail: { isPlaying: false } });
             window.dispatchEvent(event);
        }
        return () => {
             const event = new CustomEvent('cosmic-voice-change', { detail: { isPlaying: false } });
             window.dispatchEvent(event);
        }
    }, [isOpen]);

    const handleGenerateSEO = async () => {
        setIsSeoLoading(true);
        setIsOpen(true);
        try {
            // 1. Generate Text SEO (Script, Titles, Description)
            const seoData = await getYouTubeSEO(theme, focus);
            if (seoData) {
                setData(seoData);
                setThumbnailUrl(null); // Reset thumb if regenerating text
            }
        } catch (e) {
            console.error("Marketing Agent Error:", e);
        } finally {
            setIsSeoLoading(false);
        }
    };

    const handleGenerateThumbnail = async () => {
        if (!data || !data.titles || data.titles.length === 0) return;
        
        setIsThumbLoading(true);
        try {
            // Use the best title (first one) for the thumbnail
            const bestTitle = data.titles[0];
            
            // 2. Get the optimized prompt for this specific title
            const imagePrompt = await getYouTubeThumbnailPrompt(bestTitle, theme);
            
            if (imagePrompt) {
                // 3. Generate the image
                const image = await generateVisionImage(imagePrompt);
                setThumbnailUrl(image);
            }
        } catch (e) {
            console.error("Thumbnail Generation Error:", e);
        } finally {
            setIsThumbLoading(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    if (!isOpen) {
        return (
            <div className="w-full flex justify-center mt-8 mb-12">
                <button
                    onClick={handleGenerateSEO}
                    className="group relative px-8 py-3 bg-gradient-to-r from-red-900 to-red-700 text-white rounded-xl font-bold shadow-lg border border-red-500/30 hover:scale-105 transition-all overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-transparent opacity-0 group-hover:opacity-20 transition-opacity"></div>
                    <span className="relative z-10 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                        </svg>
                        Invocar Guardião do Marketing (Estratégia & Roteiro)
                    </span>
                </button>
            </div>
        );
    }

    return (
        <div className="w-full max-w-5xl mx-auto mt-8 mb-12 bg-[#1a1110] border border-red-900/50 rounded-2xl overflow-hidden shadow-2xl animate-fadeIn relative z-50">
             {/* Header */}
             <div className="bg-gradient-to-r from-red-900 to-black p-4 flex justify-between items-center border-b border-red-800/30">
                <h3 className="text-red-100 font-serif font-bold tracking-widest uppercase flex items-center gap-2">
                    <span className="text-2xl">🎥</span> Arquitetura da Alma | YouTube SEO
                </h3>
                <button onClick={() => setIsOpen(false)} className="text-red-300 hover:text-white">✕</button>
             </div>

             <div className="p-6 md:p-8">
                {isSeoLoading ? (
                    <div className="flex flex-col items-center justify-center py-12">
                        <div className="w-16 h-16 border-4 border-red-900 border-t-red-500 rounded-full animate-spin mb-4"></div>
                        <p className="text-red-200 animate-pulse">O Guardião está decodificando os algoritmos místicos...</p>
                    </div>
                ) : data ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Left Column: Visuals & Titles */}
                        <div className="space-y-6">
                            
                            {/* THUMBNAIL SECTION - SEPARATE MANUAL ACTION */}
                            <div className="bg-black/50 rounded-lg p-4 border border-red-900/30 flex flex-col items-center text-center">
                                <p className="text-xs text-red-300 mb-4 uppercase tracking-wider w-full text-left flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                    Capa do Vídeo (Thumbnail)
                                </p>
                                
                                {thumbnailUrl ? (
                                    <div className="relative group w-full">
                                        <img src={thumbnailUrl} alt="Thumbnail" className="w-full rounded shadow-lg" />
                                        <div className="absolute top-2 right-2 flex gap-2">
                                            <a 
                                                href={thumbnailUrl} 
                                                download={`thumb-${focus}.jpg`}
                                                className="bg-black/70 text-white p-2 rounded-full hover:bg-green-600 transition-colors shadow-lg border border-white/20"
                                                title="Baixar"
                                            >
                                                ⬇️
                                            </a>
                                            <button 
                                                onClick={handleGenerateThumbnail}
                                                className="bg-black/70 text-white p-2 rounded-full hover:bg-red-600 transition-colors shadow-lg border border-white/20"
                                                title="Gerar Nova"
                                            >
                                                ↻
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="w-full h-48 bg-red-900/10 flex flex-col items-center justify-center text-red-500/30 gap-4 rounded border border-dashed border-red-900/30 p-4">
                                        <p className="text-sm text-red-400/50 max-w-xs">A capa será gerada usando o título principal: <br/><span className="text-red-300 italic">"{data.titles[0]}"</span></p>
                                        <button 
                                            onClick={handleGenerateThumbnail}
                                            disabled={isThumbLoading}
                                            className="px-6 py-2 bg-red-700 hover:bg-red-600 text-white text-sm rounded-full transition-colors flex items-center gap-2 disabled:opacity-50"
                                        >
                                            {isThumbLoading ? (
                                                <>
                                                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                                    Materializando...
                                                </>
                                            ) : (
                                                'Materializar Capa (Imagen 4)'
                                            )}
                                        </button>
                                    </div>
                                )}
                            </div>
                            
                            <div className="bg-black/30 p-4 rounded-lg border border-red-900/20">
                                <p className="text-xs text-red-300 mb-2 uppercase tracking-wider">Títulos Magnéticos</p>
                                <ul className="space-y-2">
                                    {data.titles.map((t, i) => (
                                        <li key={i} className="text-sm text-gray-300 bg-black/40 p-2 rounded border-l-2 border-red-600 flex justify-between group">
                                            <span>{t}</span>
                                            <button onClick={() => copyToClipboard(t)} className="opacity-0 group-hover:opacity-100 text-xs text-red-400">Copiar</button>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="bg-black/30 p-4 rounded-lg border border-red-900/20">
                                <p className="text-xs text-red-300 mb-2 uppercase tracking-wider">Tags & Hashtags</p>
                                <div className="text-xs text-gray-400 relative group mb-3">
                                    <p className="line-clamp-3">{data.tags}</p>
                                    <button 
                                        onClick={() => copyToClipboard(data.tags)}
                                        className="absolute top-0 right-0 text-xs text-red-400 bg-black/60 px-2 py-1 rounded"
                                    >
                                        Copiar Tags
                                    </button>
                                </div>
                                <div className="text-red-400 text-sm font-mono">{data.hashtags}</div>
                            </div>
                        </div>

                        {/* Right Column: Description & Script */}
                        <div className="space-y-6">
                             {/* Description Box */}
                             <div className="relative">
                                <p className="text-xs text-red-300 mb-2 uppercase tracking-wider">Descrição Ritualística</p>
                                <textarea 
                                    readOnly 
                                    value={data.description}
                                    className="w-full h-32 bg-black/30 text-gray-300 text-sm p-4 rounded-lg border border-red-900/20 focus:border-red-500 focus:outline-none resize-none custom-scrollbar"
                                />
                                <button 
                                    onClick={() => copyToClipboard(data.description)}
                                    className="absolute top-8 right-2 text-xs bg-red-900/50 text-red-200 px-2 py-1 rounded hover:bg-red-700"
                                >
                                    Copiar
                                </button>
                            </div>

                            {/* Script Box (New) */}
                            <div className="relative flex-grow flex flex-col">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-xs text-red-300 uppercase tracking-wider flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        Roteiro do Vídeo
                                    </p>
                                    <button 
                                        onClick={() => copyToClipboard(data.script)}
                                        className="text-xs bg-red-600 text-white px-3 py-1 rounded hover:bg-red-500 transition-colors flex items-center gap-1"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                        </svg>
                                        Copiar Roteiro
                                    </button>
                                </div>
                                <textarea 
                                    readOnly 
                                    value={data.script}
                                    className="w-full h-96 bg-[#0f0808] text-gray-200 text-sm p-6 rounded-lg border border-red-500/30 focus:border-red-500 focus:outline-none resize-none custom-scrollbar font-mono leading-relaxed shadow-inner"
                                    placeholder="O roteiro gerado aparecerá aqui..."
                                />
                            </div>
                        </div>
                    </div>
                ) : (
                    <p className="text-red-400 text-center">Falha ao invocar o guardião. Tente novamente.</p>
                )}
             </div>
        </div>
    );
};

export default YouTubeAgent;