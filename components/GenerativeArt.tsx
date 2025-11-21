import React, { useContext } from 'react';
import { CoherenceContext } from '../providers/CoherenceProvider';

const GenerativeArt: React.FC = () => {
    const { coherenceScore } = useContext(CoherenceContext);

    // Map coherence score (0-100) to a color gradient and animation speed
    const hue = 180 + (coherenceScore / 100) * 120; // 180 (red-ish) to 300 (purple/blue)
    const saturation = 50 + (coherenceScore / 100) * 40; // 50% to 90%
    const lightness = 15 + (coherenceScore / 100) * 15; // 15% to 30%
    const animationDuration = 30 - (coherenceScore / 100) * 20; // 30s (chaotic) to 10s (calm)

    const color1 = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    const color2 = `hsl(${(hue + 60) % 360}, ${saturation}%, ${lightness - 5}%)`;

    return (
        <div className="absolute inset-0 z-[-1] overflow-hidden bg-[#0a0a1a]">
            <style>
                {`
                @keyframes move-gradient {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                `}
            </style>
            <div
                className="absolute inset-[-200%] w-[400%] h-[400%] transition-all duration-[5000ms] ease-in-out"
                style={{
                    background: `radial-gradient(circle, ${color1} 0%, ${color2} 30%, #0a0a1a 70%)`,
                    backgroundSize: '200% 200%',
                    animation: `move-gradient ${animationDuration}s ease infinite`,
                }}
            />
             <div className="absolute inset-0 bg-black/20 backdrop-blur-xl" />
        </div>
    );
};

export default GenerativeArt;