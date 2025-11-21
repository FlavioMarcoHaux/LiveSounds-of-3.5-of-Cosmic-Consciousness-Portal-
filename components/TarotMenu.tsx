import React from 'react';
import { ReadingType } from '../types';

interface TarotMenuProps {
    onSelectReading: (type: ReadingType) => void;
}

const TarotMenu: React.FC<TarotMenuProps> = ({ onSelectReading }) => (
    <div className="text-center flex-grow flex flex-col justify-center items-center h-full w-full max-w-2xl mx-auto animate-fadeIn">
        <p className="text-indigo-300 mb-8">Escolha o portal de sabedoria que sua alma busca neste momento.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
            <div onClick={() => onSelectReading('classic')} className="group bg-black/20 backdrop-blur-sm p-6 rounded-xl border border-purple-500/20 hover:border-purple-400/50 cursor-pointer transition-all duration-300 transform hover:-translate-y-1 text-center">
                <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-indigo-200">Jornada Clássica</h3>
                <p className="text-sm text-indigo-200/60 mt-2">Uma leitura de 3 cartas para Passado, Presente e Futuro.</p>
            </div>
            <div onClick={() => onSelectReading('alchemy')} className="group bg-black/20 backdrop-blur-sm p-6 rounded-xl border border-purple-500/20 hover:border-purple-400/50 cursor-pointer transition-all duration-300 transform hover:-translate-y-1 text-center">
                <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-indigo-200">Espelho da Sombra e Luz</h3>
                <p className="text-sm text-indigo-200/60 mt-2">Uma iniciação de 2 cartas para integrar sua Persona e sua Sombra.</p>
            </div>
            <div onClick={() => onSelectReading('labyrinth')} className="group bg-black/20 backdrop-blur-sm p-6 rounded-xl border border-purple-500/20 hover:border-purple-400/50 cursor-pointer transition-all duration-300 transform hover:-translate-y-1 text-center">
                <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-indigo-200">O Fio de Ariadne</h3>
                <p className="text-sm text-indigo-200/60 mt-2">Uma leitura de 5 cartas para navegar um desafio específico.</p>
            </div>
            <div onClick={() => onSelectReading('treeOfLife')} className="group bg-black/20 backdrop-blur-sm p-6 rounded-xl border border-purple-500/20 hover:border-purple-400/50 cursor-pointer transition-all duration-300 transform hover:-translate-y-1 text-center">
                <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-indigo-200">A Árvore da Vida</h3>
                <p className="text-sm text-indigo-200/60 mt-2">Uma iniciação de 10 cartas mapeando sua questão na arquitetura do cosmos.</p>
            </div>
        </div>
    </div>
);

export default TarotMenu;
