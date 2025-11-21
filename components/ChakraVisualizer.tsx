

import React from 'react';

const CHAKRAS = [
  { name: 'root', color: '#ef4444', symbol: '■' },
  { name: 'sacral', color: '#f97316', symbol: '▲' },
  { name: 'solarPlexus', color: '#eab308', symbol: '●' },
  { name: 'heart', color: '#22c55e', symbol: '★' },
  { name: 'throat', color: '#3b82f6', symbol: '☽' },
  { name: 'thirdEye', color: '#8b5cf6', symbol: '◎' },
  { name: 'crown', color: '#d946ef', symbol: '❖' }
];

interface ChakraVisualizerProps {
    activeChakraName: string | null;
    chakraStatus: 'guiding' | 'activated' | null;
    breathVolume: number; // Normalized 0-1
}

const ChakraVisualizer: React.FC<ChakraVisualizerProps> = ({ activeChakraName, chakraStatus, breathVolume }) => {

    const activeChakraIndex = activeChakraName ? CHAKRAS.findIndex(c => c.name === activeChakraName) : -1;
    const isIntegration = activeChakraName === 'integration';

    const getSerpentPath = () => {
        if (!isIntegration && chakraStatus === 'activated' && activeChakraIndex > 0 && activeChakraIndex < CHAKRAS.length) {
            // Y positions are from 176 (bottom) to 26 (top), with 25 units between each
            const y_current = 176 - activeChakraIndex * 25;
            const y_previous = 176 - (activeChakraIndex - 1) * 25;
            const y_mid = (y_current + y_previous) / 2;
            
            // Alternate the curve direction for Ida/Pingala effect
            const controlPointX1 = activeChakraIndex % 2 === 1 ? 80 : 20;
            const controlPointX2 = activeChakraIndex % 2 === 1 ? 20 : 80;

            return `M 50 ${y_previous} C ${controlPointX1} ${y_mid}, ${controlPointX2} ${y_mid}, 50 ${y_current}`;
        }
        return '';
    };

    return (
        <div className="relative w-48 h-96 flex justify-center">
            <style>
                {`
                @keyframes pulse-activated {
                    0%, 100% { transform: scale(1); opacity: 0.8; }
                    50% { transform: scale(1.1); opacity: 1; }
                }
                @keyframes glow {
                    0%, 100% { filter: drop-shadow(0 0 10px var(--glow-color)); }
                    50% { filter: drop-shadow(0 0 25px var(--glow-color)); }
                }
                @keyframes serpent-flow {
                    from { stroke-dashoffset: 300; }
                    to { stroke-dashoffset: 0; }
                }
                .serpent {
                    stroke-dasharray: 300;
                    stroke-dashoffset: 300;
                    animation: serpent-flow 2s ease-in-out forwards;
                }
                 @keyframes waterfall-gradient {
                    0% { background-position: 0% 0%; }
                    100% { background-position: 0% 200%; }
                }
                .sushumna-active {
                    stroke: url(#integration-gradient);
                    stroke-width: 3px;
                    filter: drop-shadow(0 0 8px white);
                    background-size: 100% 200%;
                    animation: waterfall-gradient 5s linear infinite;
                }
                @keyframes rainbow-pulse {
                    0%, 100% { transform: scale(1.05); box-shadow: 0 0 15px var(--glow-color); }
                    50% { transform: scale(1.15); box-shadow: 0 0 30px var(--glow-color); }
                }
                `}
            </style>
            
            <svg className="absolute w-full h-full" viewBox="0 0 100 200">
                <defs>
                    <linearGradient id="integration-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor={CHAKRAS[6].color} />
                        <stop offset="16%" stopColor={CHAKRAS[5].color} />
                        <stop offset="33%" stopColor={CHAKRAS[4].color} />
                        <stop offset="50%" stopColor={CHAKRAS[3].color} />
                        <stop offset="67%" stopColor={CHAKRAS[2].color} />
                        <stop offset="84%" stopColor={CHAKRAS[1].color} />
                        <stop offset="100%" stopColor={CHAKRAS[0].color} />
                    </linearGradient>
                </defs>
                {/* Sushumna Nadi (Central Channel) */}
                <path d="M 50 180 V 20" 
                    stroke="rgba(255, 255, 255, 0.1)"
                    strokeWidth="1" 
                    className={`transition-all duration-1000 ${isIntegration ? 'sushumna-active' : ''}`}
                />
            </svg>

            {/* Serpent energy flow */}
            <svg key={activeChakraIndex} className="absolute w-full h-full" viewBox="0 0 100 200">
                <path
                    d={getSerpentPath()}
                    stroke={activeChakraIndex > 0 ? CHAKRAS[activeChakraIndex].color : 'transparent'}
                    fill="none"
                    strokeWidth="2"
                    className="serpent"
                    style={{ filter: `drop-shadow(0 0 5px ${activeChakraIndex > 0 ? CHAKRAS[activeChakraIndex].color : 'transparent'})` }}
                />
            </svg>

            {/* Chakras */}
            <div className="relative w-full h-full">
                {CHAKRAS.map((chakra, index) => {
                    const isGuiding = activeChakraIndex === index && chakraStatus === 'guiding';
                    const isActivated = (activeChakraIndex === index && chakraStatus === 'activated');
                    const isPrevious = activeChakraIndex > index;
                    const topPosition = `${88 - index * 12.5}%`;
                    
                    const breathScale = isGuiding ? 1 + breathVolume * 0.3 : 1;

                    let animation = 'none';
                    if(isActivated) animation = 'pulse-activated 3s infinite ease-in-out, glow 3s infinite ease-in-out';
                    else if (isGuiding) animation = 'glow 3s infinite ease-in-out';
                    else if (isIntegration) {
                        animation = `rainbow-pulse 4s infinite ease-in-out`;
                    }
                    
                    const animationDelay = isIntegration ? `${(6 - index) * 0.2}s` : '0s';

                    return (
                        <div
                            key={chakra.name}
                            className="absolute left-1/2 -translate-x-1/2 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-1000"
                            style={{
                                top: topPosition,
                                backgroundColor: isGuiding || isActivated || isIntegration ? `${chakra.color}40` : 'rgba(255, 255, 255, 0.05)',
                                border: `1px solid ${isGuiding || isActivated || isPrevious || isIntegration ? chakra.color : 'rgba(255,255,255,0.1)'}`,
                                '--glow-color': chakra.color,
                                animation: animation,
                                animationDelay: animationDelay,
                                boxShadow: isActivated ? `0 0 20px ${chakra.color}` : 'none',
                                transform: `translateX(-50%) scale(${breathScale})`,
                            } as React.CSSProperties}
                        >
                             <span
                                className="text-sm transition-all duration-1000"
                                style={{
                                    color: isGuiding || isActivated || isPrevious || isIntegration ? chakra.color : 'rgba(255,255,255,0.2)',
                                    opacity: isGuiding || isActivated || isIntegration ? 1 : 0.8
                                }}
                            >
                                {chakra.symbol}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ChakraVisualizer;
