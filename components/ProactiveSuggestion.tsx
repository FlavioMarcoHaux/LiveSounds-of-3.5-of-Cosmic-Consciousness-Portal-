import React, { useContext, useState, useEffect } from 'react';
import { CoherenceContext } from '../providers/CoherenceProvider';

const ProactiveSuggestion: React.FC = () => {
    const { suggestion, clearSuggestion } = useContext(CoherenceContext);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (suggestion) {
            setIsVisible(true);
            const timer = setTimeout(() => {
                handleClose();
            }, 15000); // Auto-dismiss after 15 seconds
            return () => clearTimeout(timer);
        }
    }, [suggestion]);

    const handleClose = () => {
        setIsVisible(false);
        // Allow time for fade-out animation before clearing content
        setTimeout(() => {
            clearSuggestion();
        }, 500);
    };

    if (!suggestion) {
        return null;
    }

    return (
        <div
            className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 max-w-sm w-full p-4 bg-purple-900/50 backdrop-blur-md border border-purple-400/30 rounded-lg shadow-2xl shadow-black/50 z-50 transition-all duration-500 ease-in-out
                ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}
        >
            <div className="flex items-start">
                <div className="flex-shrink-0">
                    {/* Sparkle Icon */}
                    <svg className="h-6 w-6 text-purple-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
                    </svg>
                </div>
                <div className="ml-3 w-0 flex-1">
                    <p className="text-sm font-medium text-purple-200">
                        Um Sussurro Cósmico
                    </p>
                    <p className="mt-1 text-sm text-purple-300/80">
                        {suggestion}
                    </p>
                </div>
                <div className="ml-4 flex-shrink-0 flex">
                    <button
                        onClick={handleClose}
                        className="inline-flex text-purple-300/70 rounded-md hover:text-purple-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                    >
                        <span className="sr-only">Close</span>
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProactiveSuggestion;
