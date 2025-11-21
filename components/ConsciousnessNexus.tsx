
import React, { useMemo } from 'react';
import { useIntention } from '../hooks/useIntention';
import { View } from '../types';

interface ConsciousnessNexusProps {
    hoveredView: View | null;
}

const INTENTION_KEYWORDS = {
    tarot: ['clareza', 'sabedoria', 'orientação', 'tarot', 'oráculo', 'pergunta', 'futuro'],
    geometry: ['estrutura', 'meditação', 'geometria', 'alinhamento', 'frequência', 'padrão'],
    tantra: ['energia', 'paixão', 'fogo', 'corpo', 'tantra', 'respiração', 'vitalidade'],
    relationship: ['relacionamento', 'amor', 'conexão', 'espelho', 'diário', 'sentimentos', 'cura'],
    medicine: ['cura', 'floresta', 'rapé', 'medicina', 'xamanismo', 'natureza', 'limpeza'],
};

const ConsciousnessNexus: React.FC<ConsciousnessNexusProps> = ({ hoveredView }) => {
    const { intention } = useIntention();

    const activeViews = useMemo(() => {
        const lowerCaseIntention = intention.toLowerCase();
        const views = new Set<View>();
        if (!lowerCaseIntention) return views;
        for (const [view, keywords] of Object.entries(INTENTION_KEYWORDS)) {
            if (keywords.some(keyword => lowerCaseIntention.includes(keyword))) {
                views.add(view as View);
            }
        }
        return views;
    }, [intention]);

    const stars = useMemo(() => Array.from({ length: 200 }, () => ({
        cx: Math.random() * 200,
        cy: Math.random() * 200,
        r: Math.random() * 0.4 + 0.1,
        duration: Math.random() * 8 + 4,
        delay: Math.random() * -12,
    })), []);

    const fibonacciPath = useMemo(() => {
        let path = "M 100 100";
        let a = 0.1, b = 0.1;
        let angle = 0;
        for (let i = 0; i < 200; i++) {
            const x = 100 + Math.cos(angle) * a;
            const y = 100 + Math.sin(angle) * a;
            path += ` L ${x} ${y}`;
            angle += 0.1;
            const temp = a; a += b; b = temp;
        }
        return path;
    }, []);

    const filamentColors: Record<View, string> = {
        tarot: '#a78bfa',
        geometry: '#67e8f9',
        tantra: '#fca5a5',
        relationship: '#fbcfe8',
        medicine: '#34d399',
        marketing: '#ef4444',
        home: '', // Not used
    };
    
    const filaments = [
        { view: 'tarot' as View, angle: -45, path: "M100,100 C140,60 160,80 200,100" },
        { view: 'geometry' as View, angle: 25, path: "M100,100 C140,60 160,80 200,100" },
        { view: 'tantra' as View, angle: 95, path: "M100,100 C140,60 160,80 200,100" },
        { view: 'medicine' as View, angle: 165, path: "M100,100 C140,60 160,80 200,100" },
        { view: 'relationship' as View, angle: 235, path: "M100,100 C140,60 160,80 200,100" },
    ];

    return (
        <div className="w-full h-full relative">
            <style>
                {`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                @keyframes spin-reverse { from { transform: rotate(360deg); } to { transform: rotate(0deg); } }
                @keyframes star-twinkle { 
                    0%, 100% { opacity: 0.2; transform: scale(0.8); } 
                    50% { opacity: 1; transform: scale(1); } 
                }
                @keyframes core-heartbeat {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                }
                @keyframes aura-breath {
                    0%, 100% { transform: scale(0.98); opacity: 0.6; }
                    50% { transform: scale(1.02); opacity: 1; }
                }
                `}
            </style>
            <svg viewBox="0 0 200 200" className="w-full h-full overflow-visible">
                <defs>
                    <filter id="wavy-glow" x="-50%" y="-50%" width="200%" height="200%">
                        <feTurbulence type="fractalNoise" baseFrequency="0.02 0.05" numOctaves="3" result="warp">
                             <animate attributeName="baseFrequency" values="0.02 0.05; 0.025 0.06; 0.02 0.05" dur="10s" repeatCount="indefinite" />
                        </feTurbulence>
                        <feDisplacementMap in="SourceGraphic" in2="warp" scale="5" xChannelSelector="R" yChannelSelector="G" result="displaced" />
                        <feGaussianBlur in="displaced" stdDeviation="3" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                    <radialGradient id="quantum-foam" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="rgba(255, 255, 255, 0.05)" />
                        <stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
                    </radialGradient>
                </defs>

                {/* --- BACKGROUND LAYERS --- */}
                <rect width="200" height="200" fill="url(#quantum-foam)" />
                <g opacity="0.8">
                    {stars.map((star, i) => (
                        <circle key={i} cx={star.cx} cy={star.cy} r={star.r} fill="white" style={{ animation: `star-twinkle ${star.duration}s ease-in-out ${star.delay}s infinite` }} />
                    ))}
                </g>
                <path d={fibonacciPath} stroke="#fde047" strokeWidth="0.2" fill="none" opacity="0.3" style={{ transformOrigin: 'center', animation: 'spin-reverse 240s linear infinite' }}/>
                
                 {/* --- AURA --- */}
                <circle cx="100" cy="100" r="80" fill="none" stroke="rgba(167, 139, 250, 0.5)" strokeWidth="0.5" filter="url(#wavy-glow)" style={{ transformOrigin: 'center', animation: 'aura-breath 12s ease-in-out infinite' }}/>

                {/* --- FILAMENTS --- */}
                <g>
                    {filaments.map(({ view, angle, path }) => {
                        const isActive = activeViews.has(view) || hoveredView === view;
                        const color = filamentColors[view];
                        return (
                             <g key={view} transform={`rotate(${angle} 100 100)`} filter="url(#wavy-glow)">
                                <path
                                    d={path}
                                    stroke={color}
                                    strokeWidth={isActive ? 2 : 0.75}
                                    fill="none"
                                    strokeLinecap="round"
                                    opacity={isActive ? 0.9 : 0.35}
                                    style={{ transition: 'all 0.4s ease-in-out' }}
                                />
                                {isActive && (
                                    <>
                                        <path d={path} stroke="white" strokeWidth="0.5" fill="none" />
                                        {[...Array(5)].map((_, i) => (
                                            <circle key={i} r="1" fill={color}>
                                                <animateMotion dur={`${2 + i*0.5}s`} repeatCount="indefinite" path={path} />
                                                <animate attributeName="r" values="0.5;1.5;0.5" dur="1.5s" begin={`${i*0.3}s`} repeatCount="indefinite" />
                                            </circle>
                                        ))}
                                    </>
                                )}
                            </g>
                        );
                    })}
                </g>
                
                {/* --- CORE STRUCTURE --- */}
                <g style={{ transformOrigin: 'center' }}>
                     {/* Layer 3 (Outer Flower) */}
                     <g style={{ animation: 'spin 120s linear infinite' }} opacity="0.6">
                         {[...Array(6)].map((_, i) => {
                            const a = (i * 60) * Math.PI / 180;
                            const cx = 100 + 22 * Math.cos(a);
                            const cy = 100 + 22 * Math.sin(a);
                            return <circle key={i} cx={cx} cy={cy} r="22" stroke="#a78bfa" strokeWidth="0.2" fill="none" />;
                         })}
                         <circle cx="100" cy="100" r="44" stroke="#a78bfa" strokeWidth="0.15" fill="none" strokeDasharray="1 4"/>
                    </g>
                     {/* Layer 2 (Merkaba) */}
                    <g style={{ animation: 'spin-reverse 80s linear infinite' }} opacity="0.9">
                         <path d="M100 75 L 119.05 106.25 L 80.95 106.25 Z" stroke="#67e8f9" strokeWidth="0.4" fill="none" />
                         <path d="M100 125 L 80.95 93.75 L 119.05 93.75 Z" stroke="#67e8f9" strokeWidth="0.4" fill="none" />
                    </g>
                     {/* Layer 1 (Inner Core) */}
                    <g style={{ animation: 'core-heartbeat 8s infinite ease-in-out' }}>
                        <circle cx="100" cy="100" r="12" fill="url(#quantum-foam)" />
                        <circle cx="100" cy="100" r="12" stroke="#fff" strokeWidth="0.5" fill="none" />
                        <path d="M100 90 L 105.2 98 L 94.8 98 Z M100 110 L 94.8 102 L 105.2 102 Z" stroke="#fff" strokeWidth="0.3" fill="none" />
                    </g>
                    {/* Central Light */}
                    <circle cx="100" cy="100" r="2" fill="white" >
                         <animate attributeName="r" values="1;3;1" dur="4s" repeatCount="indefinite" />
                    </circle>
                </g>
            </svg>
        </div>
    );
};

export default ConsciousnessNexus;
