import React from 'react';
import { ranks, suits } from '../data/tarotDeck';

const CardFrame: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <svg viewBox="0 0 100 150" className="w-full h-full rounded-lg bg-gray-900 border-2 border-purple-400/30 shadow-inner shadow-black/50">
        <defs>
            <filter id="cosmic-glow-filter">
                <feGaussianBlur stdDeviation="1" result="blur" />
                <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                </feMerge>
            </filter>
            <radialGradient id="cosmic-glow-bg" cx="50%" cy="50%" r="70%">
                <stop offset="0%" stopColor="rgba(196, 181, 253, 0.1)" />
                <stop offset="100%" stopColor="rgba(196, 181, 253, 0)" />
            </radialGradient>
        </defs>
        <rect width="100" height="150" rx="6" fill="url(#cosmic-glow-bg)" />
        <g filter="url(#cosmic-glow-filter)">
            {children}
        </g>
    </svg>
);

// --- Suit Symbol Components & Backgrounds ---
const Pau = ({ x, y, scale = 1, color = "#fca5a5" }) => <g transform={`translate(${x} ${y}) scale(${scale})`}><path d="M0-15 L0,15 M-5,10 Q0,15 5,10 M-5,-10 Q0,-15 5,-10" stroke={color} strokeWidth="1.5" fill="none" /></g>;
const Copa = ({ x, y, scale = 1, color = "#f472b6" }) => <g transform={`translate(${x} ${y}) scale(${scale})`}><path d="M-6,0 C-10,-20 10,-20 6,0 Q0,5 -6,0 M-4,-10 L4,-10" stroke={color} strokeWidth="1.5" fill="none" /></g>;
const Espada = ({ x, y, scale = 1, color = "#67e8f9" }) => <g transform={`translate(${x} ${y}) scale(${scale})`}><path d="M0,-15 L0,10 M-10,5 L10,5 M-3,15 L3,15 L0,10 Z" stroke={color} strokeWidth="1.5" fill="none" /></g>;
const Ouro = ({ x, y, scale = 1, color = "#fde047" }) => <g transform={`translate(${x} ${y}) scale(${scale})`}><path d="M0-10 L10,0 L0,10 L-10,0 Z" stroke={color} strokeWidth="1.5" fill="none" /><circle cx="0" cy="0" r="11" stroke={color} strokeWidth="0.5" fill="none"/></g>;

const SuitBackground: React.FC<{suit: string}> = ({ suit }) => {
    switch (suit) {
        case 'Paus': // Fire/Energy
            return <g opacity="0.1">{[...Array(16)].map((_, i) => <line key={i} x1="50" y1="75" x2={50 + 100 * Math.cos(i*22.5*Math.PI/180)} y2={75 + 100 * Math.sin(i*22.5*Math.PI/180)} stroke="#fca5a5" strokeWidth="0.5" />)}</g>;
        case 'Copas': // Water/Flow
             return <g opacity="0.1">{[...Array(5)].map((_, i) => <circle key={i} cx="50" cy="75" r={15 + i*15} stroke="#f472b6" strokeWidth="0.5" fill="none"/>)}</g>;
        case 'Espadas': // Air/Structure
             return <g opacity="0.1" stroke="#67e8f9" strokeWidth="0.5">{[...Array(10)].map((_, i) => <line key={i} x1={i*10} y1="0" x2={i*10} y2="150"/>)}{[...Array(15)].map((_, i) => <line key={i} x1="0" y1={i*10} x2="100" y2={i*10}/>)}</g>;
        case 'Ouros': // Earth/Stability
             return <g opacity="0.1" stroke="#fde047" strokeWidth="0.5">{[...Array(10)].map((_,i) => <path key={i} d={`M${i*20-50},0 l30,15 l0,30 l-30,15 l-30,-15 l0,-30 Z`} transform="translate(0, 30)"/>)}</g>;
        default: return null;
    }
}


// --- Major Arcana Components with Sacred Geometry Integration ---
const MajorArcanaArt: { [key: string]: React.FC } = {
    "O Louco": () => <g><path d="M50,75 C 80,75 80,45 50,45 C 20,45 20,75 50,75 C 80,75 80,105 50,105" stroke="#fff" strokeWidth="1" fill="none" strokeDasharray="2 2" /><circle cx="50" cy="40" r="5" fill="#fde047"/></g>,
    "O Mago": () => <g><path d="M50,30 V120" stroke="#fff" strokeWidth="1.5" /><circle cx="50" cy="75" r="15" stroke="#fde047"/><circle cx="50" cy="75" r="1" fill="#fde047"/>{[...Array(6)].map((_, i) => { const a = i*60*Math.PI/180; return <circle key={i} cx={50+15*Math.cos(a)} cy={75+15*Math.sin(a)} r="15" stroke="#fde047" strokeWidth="0.5" fill="none"/>})}</g>,
    "A Sacerdotisa": () => <g><rect x="25" y="30" width="10" height="90" fill="rgba(0,0,0,0.5)" stroke="#ccc"/><rect x="65" y="30" width="10" height="90" fill="rgba(255,255,255,0.5)" stroke="#ccc"/><circle cx="42.5" cy="75" r="25" stroke="#67e8f9" fill="none"/><circle cx="57.5" cy="75" r="25" stroke="#67e8f9" fill="none"/></g>,
    "A Imperatriz": () => <g><circle cx="50" cy="75" r="20" stroke="#f472b6" strokeWidth="1" fill="none"/>{[...Array(6)].map((_, i) => {const a = (i*60)*Math.PI/180; const cx=50+20*Math.cos(a); const cy=75+20*Math.sin(a); return <circle key={i} cx={cx} cy={cy} r="20" stroke="#f472b6" strokeWidth="0.5" fill="none"/>})}<path d="M40,45 h20 m-15,-5 v10" stroke="#fde047"/></g>,
    "O Imperador": () => <g><polygon points="50,40 75,70 50,100 25,70" stroke="#fff" fill="none" strokeWidth="1.5" /><polygon points="50,60 65,75 50,90 35,75" stroke="#fff" fill="none" strokeWidth="1"/></g>,
    "O Hierofante": () => <g><path d="M50,30 V120 M30,75 H70" stroke="#fff" strokeWidth="2" /><path d="M30,55 h40 M30,95 h40" stroke="#fde047" strokeWidth="1" /></g>,
    "Os Amantes": () => <g><g transform="translate(0 -10)"><circle cx="35" cy="75" r="25" stroke="#f472b6" fill="none"/><circle cx="65" cy="75" r="25" stroke="#67e8f9" fill="none"/></g><path d="M50,30 L55,45 L45,45Z" fill="#fde047"/></g>,
    "A Carruagem": () => <g><polygon points="50,45 80,75 20,75" stroke="#fff" fill="none"/><polygon points="50,115 80,85 20,85" stroke="#fff" fill="none"/><rect x="20" y="75" width="60" height="10" stroke="#fff" fill="none"/></g>,
    "A Força": () => <g><path d="M35,75 C25,75 25,45 50,45 C75,45 75,75 65,75 C75,75 75,105 50,105 C25,105 25,75 35,75" stroke="#fde047" fill="none" strokeWidth="2"/><path d="M40,110 Q50,100 60,110" stroke="#fff"/></g>,
    "O Eremita": () => <g><polygon points="50,20 80,120 20,120" stroke="#ccc" fill="none"/><path d="M50,55 L52,60 L58,60 L53,64 L55,70 L50,66 L45,70 L47,64 L42,60 L48,60 Z" fill="#fde047"/></g>,
    "Roda da Fortuna": () => <g>{[...Array(8)].map((_, i) => <path key={i} d="M 50 75 C 50 45, 80 45, 80 75 C 80 105, 50 105, 50 75" transform={`rotate(${i*45} 50 75) scale(0.8)`} opacity={1-i*0.1} stroke="#fde047" fill="none"/>)}</g>,
    "A Justiça": () => <g><polygon points="50,30 75,70 25,70" stroke="#fff" fill="none"/><polygon points="50,120 75,80 25,80" stroke="#fff" fill="none"/><path d="M20,75 H80" stroke="#fff" strokeWidth="1.5"/></g>,
    "O Enforcado": () => <g><path d="M20,30 H80" stroke="#fff"/><path d="M50,30 V100" stroke="#fff" fill="none"/><polygon points="50,120 65,100 35,100" fill="#67e8f9" stroke="none"/></g>,
    "A Morte": () => <g><path d="M25,120 L50,20 L75,120 M25,70 H75" stroke="#ccc" fill="none" strokeWidth="1.5"/></g>,
    "A Temperança": () => <g><path d="M30,50 C 50,20 50,20 70,50" stroke="#67e8f9" fill="none"/><path d="M30,120 C 50,150 50,150 70,120" stroke="#67e8f9" fill="none"/><path d="M32,85 C 50,105 50,65 68,85" stroke="#fff" strokeWidth="1.5" fill="none"/></g>,
    "O Diabo": () => <g><polygon points="50,90 70,60 30,60" stroke="#fca5a5" fill="none" strokeWidth="1.5" /><circle cx="50" cy="40" r="10" stroke="#fca5a5" fill="none"/><path d="M35,120 C40,110 40,100 35,90 M65,120 C60,110 60,100 65,90" stroke="#fff" strokeWidth="1" fill="none"/></g>,
    "A Torre": () => <g><path d="M40,120 V30 H60 V120 H40 M35,30 H65" stroke="#fff" fill="none"/><path d="M75,20 L55,50" stroke="#fde047" strokeWidth="2.5"/></g>,
    "A Estrela": () => <g><path d="M50,20 L55,40 L75,40 L60,55 L65,75 L50,60 L35,75 L40,55 L25,40 L45,40 Z" fill="#fde047" stroke="none"/>{[...Array(7)].map((_,i) => <circle cx={30+i*7} cy={110} r={i*0.5+1} fill="#67e8f9" opacity={0.8}/>)}</g>,
    "A Lua": () => <g><path d="M65,40 A30,30 0 1,0 65,110" stroke="#fff" fill="none"/><path d="M60,45 A25,25 0 1,0 60,105" stroke="#aaa" fill="none"/><path d="M30,120 V80 h10 v40 M60,120 V80 h10 v40" stroke="#ccc" fill="none"/></g>,
    "O Sol": () => <g><circle cx="50" cy="60" r="25" fill="none" stroke="#fde047" strokeWidth="1.5"/>{[...Array(12)].map((_,i) => <line key={i} x1="50" y1="60" x2={50+35*Math.cos(i*30*Math.PI/180)} y2={60+35*Math.sin(i*30*Math.PI/180)} stroke="#fde047" strokeWidth="1"/>)}<path d="M20,120 H80" stroke="#fff" fill="none"/></g>,
    "O Julgamento": () => <g><path d="M40,30 H60 L55,60 H45Z" stroke="#fde047" fill="none"/><path d="M50,60 C30,70 70,70 50,80 C30,90 70,90 50,100" stroke="#fde047" fill="none" strokeWidth="1"/><path d="M45,120 v-20 h10 v20" stroke="#fff" fill="none"/></g>,
    "O Mundo": () => <g><ellipse cx="50" cy="75" rx="40" ry="55" stroke="#a78bfa" fill="none" strokeWidth="1.5"/><path d="M50,55 Q40,75 50,95 Q60,75 50,55" stroke="#fff" fill="none"/></g>,
};

// --- Minor Arcana Rendering Logic ---
const renderMinorArcana = (rank: string, suit: string) => {
    const suitMap = { "Paus": Pau, "Copas": Copa, "Espadas": Espada, "Ouros": Ouro };
    const colorMap = { "Paus": "#fca5a5", "Copas": "#f472b6", "Espadas": "#67e8f9", "Ouros": "#fde047" };
    const Symbol = suitMap[suit];
    const color = colorMap[suit];

    const positions: { [key: string]: { x: number; y: number }[] } = {
        '1': [{ x: 50, y: 75 }],
        '2': [{ x: 50, y: 50 }, { x: 50, y: 100 }],
        '3': [{ x: 50, y: 40 }, { x: 50, y: 75 }, { x: 50, y: 110 }],
        '4': [{ x: 35, y: 50 }, { x: 65, y: 50 }, { x: 35, y: 100 }, { x: 65, y: 100 }],
        '5': [{ x: 35, y: 45 }, { x: 65, y: 45 }, { x: 50, y: 75 }, { x: 35, y: 105 }, { x: 65, y: 105 }],
        '6': [{ x: 35, y: 45 }, { x: 65, y: 45 }, { x: 35, y: 80 }, { x: 65, y: 80 }, { x: 35, y: 115 }, { x: 65, y: 115 }],
        '7': [{ x: 35, y: 45 }, { x: 65, y: 45 }, { x: 50, y: 65 }, { x: 35, y: 85 }, { x: 65, y: 85 }, { x: 35, y: 115 }, { x: 65, y: 115 }],
        '8': [{ x: 35, y: 40 }, { x: 65, y: 40 }, { x: 50, y: 60 }, { x: 35, y: 80 }, { x: 65, y: 80 }, { x: 50, y: 100 }, { x: 35, y: 120 }, { x: 65, y: 120 }],
        '9': [{ x: 33, y: 35 }, { x: 67, y: 35 }, { x: 50, y: 55 }, { x: 33, y: 75 }, { x: 67, y: 75 }, { x: 50, y: 95 }, { x: 33, y: 115 }, { x: 67, y: 115 }, {x: 50, y: 135}],
        '10': [{ x: 33, y: 35 }, { x: 67, y: 35 }, { x: 50, y: 55 }, { x: 33, y: 75 }, { x: 67, y: 75 }, { x: 50, y: 95 }, { x: 33, y: 115 }, { x: 67, y: 115 }, {x: 33, y: 135}, {x: 67, y: 135}],
    };

    const rankIndex = ranks.indexOf(rank);
    if (rankIndex >= 0 && rankIndex < 10) { // Number cards 1-10
        const key = `${rankIndex + 1}`;
        return (
            <g>
                <SuitBackground suit={suit} />
                {(positions[key] || []).map((pos, i) => <Symbol key={i} x={pos.x} y={pos.y} scale={1.2} color={color} />)}
            </g>
        );
    }

    // Court Cards
    switch (rank) {
        case 'Pajem': return <g><SuitBackground suit={suit} /><Symbol x={50} y={75} scale={2} color={color} /><circle cx="50" cy="75" r="20" stroke={color} fill="none"/></g>;
        case 'Cavaleiro': return <g><SuitBackground suit={suit} /><Symbol x={40} y={75} scale={1.5} color={color} /><Symbol x={60} y={75} scale={1.5} color={color} /><path d="M30,60 L70,90 M30,90 L70,60" stroke={color} strokeWidth="0.5"/></g>;
        case 'Rainha': return <g><SuitBackground suit={suit} /><Symbol x={50} y={60} scale={2} color={color} /><path d="M35,90 Q50,110 65,90" stroke={color} strokeWidth="2" fill="none"/></g>;
        case 'Rei': return <g><SuitBackground suit={suit} /><Symbol x={50} y={85} scale={2} color={color} /><path d="M35,50 L65,50 L50,30 Z" stroke={color} strokeWidth="2" fill="none"/></g>;
        default: return null;
    }
};

interface CosmicCardProps {
    name?: string;
    isBack?: boolean;
}

const CosmicCard: React.FC<CosmicCardProps> = ({ name, isBack }) => {
    if (isBack) {
        return (
            <CardFrame>
                 <defs>
                    <linearGradient id="card-back-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#c084fc" />
                        <stop offset="100%" stopColor="#67e8f9" />
                    </linearGradient>
                    <filter id="back-glow"><feGaussianBlur stdDeviation="2" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                </defs>
                <g filter="url(#back-glow)">
                    <circle cx="50" cy="75" r="30" stroke="url(#card-back-grad)" strokeWidth="1.5" fill="none" />
                    <path d="M50,30 L70,55 L30,55 Z" stroke="url(#card-back-grad)" strokeWidth="1.5" fill="none" />
                    <path d="M50,120 L70,95 L30,95 Z" stroke="url(#card-back-grad)" strokeWidth="1.5" fill="none" />
                </g>
            </CardFrame>
        );
    }
    
    if (!name) return <CardFrame>{null}</CardFrame>;

    // Check if it's a Major Arcana
    const ArtComponent = MajorArcanaArt[name];
    if (ArtComponent) {
        return <CardFrame><ArtComponent /></CardFrame>;
    }
    
    // Logic for Minor Arcana
    const parts = name.split(' de ');
    if (parts.length === 2) {
        const [rank, suit] = parts;
        if(ranks.includes(rank) && suits.includes(suit)) {
            return <CardFrame>{renderMinorArcana(rank, suit)}</CardFrame>
        }
    }
    
    // Fallback for any unknown card name
    return <CardFrame>{null}</CardFrame>;
};

export default CosmicCard;