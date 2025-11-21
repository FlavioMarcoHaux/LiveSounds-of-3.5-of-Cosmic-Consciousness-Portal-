
import React, { ReactNode } from 'react';

interface RoomLayoutProps {
    title: string;
    subtitle?: string;
    onBack: () => void;
    children: ReactNode;
    headerAction?: ReactNode; // For buttons like "Solo/Casal"
    backgroundClass?: string; // To override default dark background
    themeColor?: 'purple' | 'emerald' | 'red' | 'cyan' | 'rose'; // For border/text accents
}

const RoomLayout: React.FC<RoomLayoutProps> = ({ 
    title, 
    subtitle, 
    onBack, 
    children, 
    headerAction, 
    backgroundClass = "bg-[#0a0a1a]",
    themeColor = 'purple'
}) => {

    const getThemeColors = () => {
        switch(themeColor) {
            case 'emerald': return { text: 'text-emerald-300', border: 'border-emerald-500/30', gradient: 'from-emerald-400 via-amber-200 to-emerald-400' };
            case 'red': return { text: 'text-red-300', border: 'border-red-500/30', gradient: 'from-red-400 via-amber-300 to-red-400' };
            case 'cyan': return { text: 'text-cyan-300', border: 'border-cyan-500/30', gradient: 'from-cyan-300 via-purple-300 to-cyan-300' };
            case 'rose': return { text: 'text-rose-300', border: 'border-rose-500/30', gradient: 'from-pink-300 to-rose-300' };
            case 'purple': default: return { text: 'text-purple-300', border: 'border-purple-500/30', gradient: 'from-purple-300 via-indigo-200 to-purple-300' };
        }
    };

    const theme = getThemeColors();

    return (
        <div className={`relative flex flex-col h-full w-full items-center ${backgroundClass} overflow-hidden rounded-xl border-2 ${theme.border} shadow-2xl`}>
            
            {/* Header Navigation Bar - Fixed at top */}
            <div className="w-full flex items-center justify-between px-4 py-3 sm:py-4 z-30 relative flex-shrink-0 bg-inherit/90 backdrop-blur-sm border-b border-white/5">
                {/* Back Button */}
                <button 
                    onClick={onBack} 
                    className={`p-2 rounded-full transition-colors hover:bg-white/10 ${theme.text} opacity-70 hover:opacity-100`}
                    aria-label="Voltar"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 sm:h-7 sm:w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>

                {/* Header Actions (Right Side) */}
                <div className="flex items-center">
                    {headerAction}
                </div>
            </div>

            {/* Main Content Container - Scrollable Area */}
            {/* Added z-0 to ensure new stacking context and min-h-0 to prevent collapse */}
            <div className="flex-1 w-full overflow-y-auto custom-scrollbar relative z-0 min-h-0">
                 <div className="flex flex-col items-center w-full min-h-full px-4 pb-24 pt-4">
                    
                    {/* Standardized Title Block */}
                    {title && (
                        <div className="text-center mb-6 w-full max-w-2xl px-2 relative z-10">
                             <h2 className={`text-2xl sm:text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r ${theme.gradient} mb-1 sm:mb-2 font-serif tracking-widest drop-shadow-sm`}>
                                {title}
                            </h2>
                            {subtitle && (
                                 <p className={`${theme.text} opacity-60 text-xs sm:text-sm font-light tracking-wide max-w-md mx-auto`}>
                                    {subtitle}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Inner Content - Flexible Growth */}
                    <div className="w-full flex flex-col items-center flex-1">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RoomLayout;
