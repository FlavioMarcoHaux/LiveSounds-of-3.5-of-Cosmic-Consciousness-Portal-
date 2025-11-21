
import React, { useState } from 'react';
import { getSynchronicity } from '../services/geminiService';

const SynchronicityWidget: React.FC = () => {
    const [data, setData] = useState<{ card: string; geometry: string; advice: string } | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSync = async () => {
        setLoading(true);
        const result = await getSynchronicity();
        setData(result);
        setLoading(false);
    };

    if (data) {
        return (
            <div className="w-full max-w-md bg-gradient-to-r from-indigo-900/80 to-purple-900/80 p-6 rounded-2xl border border-purple-500/30 shadow-xl animate-flipIn flex flex-col items-center text-center">
                <p className="text-xs uppercase tracking-widest text-purple-300 mb-2">Sincronicidade Revelada</p>
                <div className="flex gap-4 mb-4">
                    <div className="bg-black/30 p-2 rounded text-sm text-cyan-200 border border-cyan-500/30">{data.card}</div>
                    <div className="bg-black/30 p-2 rounded text-sm text-amber-200 border border-amber-500/30">{data.geometry}</div>
                </div>
                <p className="text-lg text-white font-serif italic">"{data.advice}"</p>
                <button onClick={() => setData(null)} className="mt-4 text-xs text-white/40 hover:text-white">Fechar</button>
            </div>
        );
    }

    return (
        <div className="w-full max-w-md animate-fadeIn">
            <button 
                onClick={handleSync}
                disabled={loading}
                className="w-full group relative overflow-hidden bg-black/20 hover:bg-black/40 border border-purple-500/20 hover:border-purple-500/50 p-4 rounded-2xl transition-all duration-500"
            >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                <div className="flex items-center justify-center gap-3">
                    {loading ? (
                        <svg className="animate-spin h-5 w-5 text-purple-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    ) : (
                        <span className="text-xl">✨</span>
                    )}
                    <span className={`font-medium ${loading ? 'text-purple-400' : 'text-indigo-200 group-hover:text-white'}`}>
                        {loading ? 'Sincronizando...' : 'Sincronicidade do Dia'}
                    </span>
                </div>
            </button>
        </div>
    );
};

export default SynchronicityWidget;
