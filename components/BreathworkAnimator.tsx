import React from 'react';

interface BreathworkAnimatorProps {
    phase: 'inhale' | 'hold' | 'exhale' | 'idle';
}

const BreathworkAnimator: React.FC<BreathworkAnimatorProps> = ({ phase }) => {
    const getAnimationState = () => {
        switch (phase) {
            case 'inhale':
                return {
                    scale: 1.2,
                    shadow: 'shadow-[0_0_40px_10px_rgba(252,211,77,0.5)]',
                    borderColor: 'border-amber-300',
                };
            case 'hold':
                return {
                    scale: 1.25,
                    shadow: 'shadow-[0_0_50px_15px_rgba(255,255,255,0.6)]',
                    borderColor: 'border-white',
                };
            case 'exhale':
                return {
                    scale: 1,
                    shadow: 'shadow-[0_0_30px_5px_rgba(239,68,68,0.4)]',
                    borderColor: 'border-red-500',
                };
            case 'idle':
            default:
                return {
                    scale: 1,
                    shadow: 'shadow-[0_0_20px_0px_rgba(129,140,248,0.3)]',
                    borderColor: 'border-indigo-400/50',
                };
        }
    };

    const { scale, shadow, borderColor } = getAnimationState();
    const phaseDurations = {
        inhale: '4s',
        hold: '7s',
        exhale: '8s',
        idle: '5s'
    }

    return (
        <div className="w-48 h-48 sm:w-64 sm:h-64 flex items-center justify-center">
            <div
                className={`relative w-full h-full rounded-full transition-all duration-[2000ms] ease-in-out ${shadow} ${borderColor} border-2`}
                style={{ transform: `scale(${scale})` }}
            >
                <div className={`absolute inset-0 rounded-full bg-gradient-to-br from-red-500/50 via-amber-500/30 to-purple-600/50 opacity-40 animate-pulse`} style={{animationDuration: '5s'}}/>
                <div className="absolute inset-2 rounded-full bg-black/30 backdrop-blur-md"></div>
                 {/* Inner Pulsing Light */}
                <div 
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/2 h-1/2 bg-amber-200 rounded-full blur-2xl transition-opacity duration-[2000ms]"
                    style={{ opacity: phase === 'hold' ? 0.7 : 0.3 }}
                ></div>

            </div>
        </div>
    );
};

export default BreathworkAnimator;
