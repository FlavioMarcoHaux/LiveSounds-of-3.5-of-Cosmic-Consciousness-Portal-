import React from 'react';

const CosmicPortalEffect: React.FC = () => (
    <div className="absolute inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-30 animate-portal-container">
        <style>{`
            @keyframes portal-container-anim {
                0% { opacity: 0; }
                20% { opacity: 1; }
                80% { opacity: 1; }
                100% { opacity: 0; pointer-events: none; }
            }
            .animate-portal-container {
                animation: portal-container-anim 2500ms forwards;
            }

            @keyframes portal-ring-anim {
                from {
                    transform: scale(0.1);
                    opacity: 1;
                }
                to {
                    transform: scale(1.2);
                    opacity: 0;
                }
            }
            .portal-ring {
                transform-origin: center;
                animation: portal-ring-anim 1800ms cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
            }

             @keyframes portal-text-anim {
                0% { opacity: 0; transform: scale(0.8); }
                30% { opacity: 1; transform: scale(1.1); }
                50% { transform: scale(1); }
                80% { opacity: 1; }
                100% { opacity: 0; }
            }
            .animate-portal-text {
                 animation: portal-text-anim 2500ms forwards;
            }
        `}</style>
        <div className="relative w-96 h-96 flex items-center justify-center">
            <svg className="absolute w-full h-full" viewBox="0 0 200 200">
                <defs>
                    <filter id="portal-glow-effect">
                        <feGaussianBlur stdDeviation="4" />
                    </filter>
                </defs>
                <circle cx="100" cy="100" r="80" className="portal-ring" stroke="#a78bfa" strokeWidth="2" fill="none" filter="url(#portal-glow-effect)" style={{ animationDelay: '0s' }} />
                <circle cx="100" cy="100" r="60" className="portal-ring" stroke="#67e8f9" strokeWidth="3" fill="none" filter="url(#portal-glow-effect)" style={{ animationDelay: '200ms' }} />
                <circle cx="100" cy="100" r="90" className="portal-ring" stroke="white" strokeWidth="1" fill="none" filter="url(#portal-glow-effect)" style={{ animationDelay: '400ms' }} />
            </svg>
            <h2 className="text-2xl font-bold text-white z-10 animate-portal-text" style={{ textShadow: '0 0 15px #a78bfa' }}>
                Conexão Estabelecida
            </h2>
        </div>
    </div>
);

export default CosmicPortalEffect;
