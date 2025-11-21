
import React from 'react';

export const KenePattern: React.FC<{ opacity?: number, className?: string }> = ({ opacity = 0.1, className = "" }) => (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`} style={{ opacity }}>
        <svg width="100%" height="100%">
            <defs>
                {/* Padrão Jibóia (Caminho da Cobra) - Inspirado na arte Huni Kuin */}
                <pattern id="kene-jiboia" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
                    <path d="M0 30 L30 0 L60 30 L30 60 Z" fill="none" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M15 45 L30 30 L45 45" fill="none" stroke="currentColor" strokeWidth="1"/>
                    <path d="M15 15 L30 30 L45 15" fill="none" stroke="currentColor" strokeWidth="1"/>
                    <circle cx="30" cy="30" r="4" fill="currentColor" />
                </pattern>
                
                {/* Padrão de Proteção (Malha) */}
                <pattern id="kene-protection" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M0 20 H40 M20 0 V40" stroke="currentColor" strokeWidth="0.5" opacity="0.5"/>
                    <rect x="15" y="15" width="10" height="10" transform="rotate(45 20 20)" stroke="currentColor" fill="none" strokeWidth="1.5"/>
                </pattern>
            </defs>
            
            <rect width="100%" height="100%" fill="url(#kene-jiboia)" className="text-emerald-500/30" />
            <rect width="100%" height="100%" fill="url(#kene-protection)" className="text-amber-500/10" />
        </svg>
        
        {/* Bordas Ornamentais */}
        <div className="absolute top-0 left-0 w-full h-4 bg-repeat-x opacity-50" 
             style={{ backgroundImage: 'linear-gradient(45deg, transparent 25%, #10b981 25%, #10b981 50%, transparent 50%, transparent 75%, #10b981 75%, #10b981 100%)', backgroundSize: '20px 20px' }} />
        <div className="absolute bottom-0 left-0 w-full h-4 bg-repeat-x opacity-50" 
             style={{ backgroundImage: 'linear-gradient(45deg, transparent 25%, #10b981 25%, #10b981 50%, transparent 50%, transparent 75%, #10b981 75%, #10b981 100%)', backgroundSize: '20px 20px' }} />
    </div>
);
