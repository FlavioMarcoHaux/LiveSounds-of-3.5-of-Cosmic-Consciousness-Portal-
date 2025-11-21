
import React, { useState } from 'react';
import { View } from '../types';
import RoomLayout from './RoomLayout';
import YouTubeAgent from './YouTubeAgent';
import { relationshipAudio } from '../services/RelationshipAudioEngine';
import { OracleIcon, GeometryIcon, FireIcon, MirrorIcon, LeafIcon, PortalIcon } from '../assets/Icons';

interface MarketingRoomProps {
    onNavigate: (view: View) => void;
}

// --- INDEXAÇÃO COMPLETA DAS APLICAÇÕES ---
const APP_INDEX = {
    tarot: {
        title: "Oráculo do Coração",
        icon: <OracleIcon />,
        color: "text-purple-300",
        features: [
            { id: 'tarot-classic', name: 'Jornada Clássica', desc: 'Leitura temporal de 3 cartas.' },
            { id: 'tarot-alchemy', name: 'Alquimia da Sombra', desc: 'Integração de Persona e Sombra (Jung).' },
            { id: 'tarot-labyrinth', name: 'O Fio de Ariadne', desc: 'Resolução estratégica de problemas.' },
            { id: 'tarot-tree', name: 'Árvore da Vida', desc: 'Mapeamento completo das 10 emanações.' },
            { id: 'tarot-activation', name: 'Ativação Arquetípica', desc: 'Ritual de incorporação da energia da carta.' }
        ]
    },
    medicine: {
        title: "Medicinas Ancestrais",
        icon: <LeafIcon />,
        color: "text-emerald-300",
        features: [
            { id: 'med-amanhecer', name: 'Rapés do Amanhecer', desc: 'Murici, Menta, Sansara (Despertar).' },
            { id: 'med-entardecer', name: 'Rapés do Entardecer', desc: 'Cacau, Caneleiro (Gratidão).' },
            { id: 'med-anoitecer', name: 'Rapés do Anoitecer', desc: 'Jurema Preta, Anis (Sonhos).' },
            { id: 'med-forca', name: 'Rapés de Força', desc: 'Veia de Pajé, Samaúma (Guerreiro).' },
            { id: 'med-energia', name: 'Rapés de Energia', desc: 'Tsunu, Mulateiro (Limpeza).' },
            { id: 'med-conexao', name: 'Rapés de Conexão', desc: 'Cumaru, Paricá (Visão).' },
            { id: 'med-sopro', name: 'Ritual do Sopro Virtual', desc: 'Interatividade de segurar o sopro para consagrar.' }
        ]
    },
    geometry: {
        title: "Sala das Geometrias",
        icon: <GeometryIcon />,
        color: "text-cyan-300",
        features: [
            { id: 'geo-single', name: 'Meditação Geométrica', desc: 'Foco em uma única forma sagrada.' },
            { id: 'geo-alchemy', name: 'Alquimia Geométrica', desc: 'Fusão de múltiplas geometrias (Sigilo).' },
            { id: 'geo-tree', name: 'Árvore da Vida Geométrica', desc: 'Navegação visual pelas Sephiroth.' },
            { id: 'geo-solfeggio', name: 'Frequências Solfeggio', desc: 'Tons de cura (432Hz, 528Hz, etc).' },
            { id: 'geo-scanner', name: 'Scanner Dimensional', desc: 'Interação sonora com movimento do mouse.' }
        ]
    },
    tantra: {
        title: "Fogo Sagrado (Tantra)",
        icon: <FireIcon />,
        color: "text-red-300",
        features: [
            { id: 'tantra-breath', name: 'Respiração 4-7-8', desc: 'Práticas de respiração solo e casal.' },
            { id: 'tantra-kundalini', name: 'Ascensão Kundalini', desc: 'Jornada guiada pelos chakras com voz ativa.' },
            { id: 'tantra-touch', name: 'Toque Consciente', desc: 'Guia de auto-amor e sensibilidade.' },
            { id: 'tantra-soul', name: 'Olhar da Alma', desc: 'Prática de conexão profunda para casais.' },
            { id: 'tantra-archetype', name: 'Toque Arquetípico', desc: 'Massagem guiada por arquétipos do Tarot.' }
        ]
    },
    relationship: {
        title: "Sala dos Espelhos",
        icon: <MirrorIcon />,
        color: "text-pink-300",
        features: [
            { id: 'rel-journal', name: 'Diário de Consciência', desc: 'Registro de voz e análise de padrões.' },
            { id: 'rel-simulator', name: 'Simulador de Coerência', desc: 'Role-play com IA para conversas difíceis.' },
            { id: 'rel-reflection', name: 'Reflexão Cósmica', desc: 'Insights gerados a partir das entradas do diário.' }
        ]
    },
    general: {
        title: "Portal Geral",
        icon: <PortalIcon />,
        color: "text-indigo-300",
        features: [
            { id: 'gen-voice', name: 'Navegação por Voz', desc: 'Interação verbal fluida com o sistema.' },
            { id: 'gen-sync', name: 'Widget de Sincronicidade', desc: 'Oráculo rápido de Tarot + Geometria.' },
            { id: 'gen-intention', name: 'Sintonizador de Intenção', desc: 'Definição do foco energético da sessão.' },
            { id: 'gen-art', name: 'Arte Generativa', desc: 'Visuais que respondem à coerência emocional.' }
        ]
    }
};

const MarketingRoom: React.FC<MarketingRoomProps> = ({ onNavigate }) => {
    const [selectedRoom, setSelectedRoom] = useState<keyof typeof APP_INDEX | null>(null);
    const [selectedFeature, setSelectedFeature] = useState<{id: string, name: string, desc: string} | null>(null);
    const [focus, setFocus] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    // Audio Interaction
    const handleMouseMove = (e: React.MouseEvent) => {
        const { clientX, clientY } = e;
        const { innerWidth, innerHeight } = window;
        const x = clientX / innerWidth;
        const y = clientY / innerHeight;
        relationshipAudio.updateRipples(x, y);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        const { clientX, clientY } = e.touches[0];
        const { innerWidth, innerHeight } = window;
        const x = clientX / innerWidth;
        const y = clientY / innerHeight;
        relationshipAudio.updateRipples(x, y);
    }

    const handleBackClick = () => {
        if (isGenerating) {
            setIsGenerating(false);
        } else if (selectedFeature) {
            setSelectedFeature(null);
        } else if (selectedRoom) {
            setSelectedRoom(null);
        } else {
            onNavigate('home');
        }
    };

    // Render Logic
    const getTitle = () => {
        if (isGenerating) return "Guardião do Marketing";
        if (selectedFeature) return selectedFeature.name;
        if (selectedRoom) return APP_INDEX[selectedRoom].title;
        return "Central de Conteúdo";
    };

    const getSubtitle = () => {
        if (isGenerating) return "Geração de Estratégia, Roteiro e Mídia.";
        if (selectedFeature) return selectedFeature.desc;
        if (selectedRoom) return "Selecione uma funcionalidade para promover.";
        return "Escolha uma área do portal para criar conteúdo.";
    };

    return (
        <div className="w-full h-full" onMouseMove={handleMouseMove} onTouchMove={handleTouchMove}>
            <RoomLayout
                title={getTitle()}
                subtitle={getSubtitle()}
                onBack={handleBackClick}
                themeColor="red"
                backgroundClass="bg-[#1a0b0b]"
            >
                <div className="w-full max-w-5xl px-4 pb-24">
                    
                    {/* VIEW 1: ROOM SELECTION */}
                    {!selectedRoom && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-fadeIn">
                            {Object.entries(APP_INDEX).map(([key, room]) => (
                                <div 
                                    key={key}
                                    onClick={() => setSelectedRoom(key as keyof typeof APP_INDEX)}
                                    className={`group relative bg-black/30 backdrop-blur-sm p-6 rounded-xl border border-white/10 hover:border-red-500/50 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-red-900/20 flex flex-col items-center text-center`}
                                >
                                    <div className={`text-4xl mb-4 filter drop-shadow-lg transform group-hover:scale-110 transition-transform duration-300 ${room.color}`}>
                                        {room.icon}
                                    </div>
                                    <h3 className={`text-lg font-bold ${room.color} mb-1`}>{room.title}</h3>
                                    <p className="text-xs text-gray-400">{room.features.length} ferramentas</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* VIEW 2: FEATURE SELECTION */}
                    {selectedRoom && !selectedFeature && (
                        <div className="animate-fadeIn">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {APP_INDEX[selectedRoom].features.map((feature) => (
                                    <div 
                                        key={feature.id}
                                        onClick={() => setSelectedFeature(feature)}
                                        className="bg-black/30 p-5 rounded-lg border border-white/5 hover:bg-white/5 hover:border-red-500/30 cursor-pointer transition-colors flex flex-col"
                                    >
                                        <h4 className="text-red-200 font-bold mb-2">{feature.name}</h4>
                                        <p className="text-sm text-gray-400">{feature.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* VIEW 3: FEATURE DETAIL & GENERATION */}
                    {selectedFeature && !isGenerating && (
                        <div className="flex flex-col items-center justify-center animate-fadeIn max-w-2xl mx-auto">
                            <div className="bg-black/40 p-8 rounded-2xl border border-red-500/30 shadow-2xl text-center w-full">
                                <h3 className="text-2xl font-bold text-red-100 mb-4">Criar Conteúdo: {selectedFeature.name}</h3>
                                <p className="text-red-200/70 mb-6">
                                    Defina o foco específico para este conteúdo. O Guardião irá gerar títulos, roteiro e estratégia de SEO.
                                </p>
                                
                                <input 
                                    type="text" 
                                    value={focus}
                                    onChange={(e) => setFocus(e.target.value)}
                                    placeholder="Ex: Benefícios para ansiedade, Tutorial passo-a-passo..."
                                    className="w-full bg-black/50 border border-red-900/50 rounded-lg px-4 py-3 text-white placeholder-red-300/30 focus:outline-none focus:border-red-500 mb-6 text-center"
                                />

                                <button 
                                    onClick={() => setIsGenerating(true)}
                                    disabled={!focus.trim()}
                                    className="px-8 py-3 bg-gradient-to-r from-red-800 to-red-600 text-white rounded-full font-bold shadow-lg shadow-red-900/40 hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Invocar IA de Marketing
                                </button>
                            </div>
                        </div>
                    )}

                    {/* VIEW 4: AGENT ACTIVE */}
                    {isGenerating && selectedFeature && selectedRoom && (
                        <YouTubeAgent 
                            theme={`${APP_INDEX[selectedRoom].title}: ${selectedFeature.name}`} 
                            focus={focus || selectedFeature.desc} 
                        />
                    )}

                </div>
            </RoomLayout>
        </div>
    );
};

export default MarketingRoom;
