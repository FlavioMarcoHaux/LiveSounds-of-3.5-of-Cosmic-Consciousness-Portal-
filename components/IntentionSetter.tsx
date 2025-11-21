
import React, { useState } from 'react';
import { useIntention } from '../hooks/useIntention';

const IntentionSetter: React.FC = () => {
    const { intention, setIntention } = useIntention();
    const [currentText, setCurrentText] = useState(intention);
    const [isEditing, setIsEditing] = useState(!intention);

    const handleSave = () => {
        setIntention(currentText);
        setIsEditing(false);
    };

    const handleEdit = () => {
        setCurrentText(intention);
        setIsEditing(true);
    };

    if (isEditing) {
        return (
            <div className="w-full max-w-2xl mx-auto p-4 bg-indigo-900/20 border border-indigo-500/20 rounded-lg text-center animate-fadeIn">
                <label htmlFor="intention-input" className="block text-lg font-medium text-indigo-200 mb-2">
                    O Grande Atrator
                </label>
                <p className="text-sm text-indigo-300/70 mb-4">Defina sua intenção cósmica. O que você deseja manifestar?</p>
                <div className="flex flex-col sm:flex-row gap-2">
                    <input
                        id="intention-input"
                        type="text"
                        value={currentText}
                        onChange={(e) => setCurrentText(e.target.value)}
                        placeholder="Ex: assertividade, encontrar um parceiro..."
                        className="flex-grow bg-transparent border border-indigo-400/50 rounded-md px-3 py-2 text-white placeholder-indigo-300/40 focus:outline-none focus:ring-2 focus:ring-purple-400"
                    />
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-500 transition-colors"
                    >
                        Sintonizar Intenção
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-2xl mx-auto p-4 bg-indigo-900/10 border border-transparent rounded-lg text-center group cursor-pointer" onClick={handleEdit}>
            <p className="text-sm text-indigo-300/70">Sua Intenção Cósmica Sintonizada:</p>
            <p className="text-xl font-semibold text-purple-300 italic group-hover:text-white transition-colors">"{intention}"</p>
            <p className="text-xs text-indigo-400/50 opacity-0 group-hover:opacity-100 transition-opacity mt-1">Clique para alterar</p>
        </div>
    );
};

export default IntentionSetter;