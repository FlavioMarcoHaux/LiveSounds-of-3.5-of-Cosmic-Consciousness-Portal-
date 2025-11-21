import React from 'react';

const CardFrame: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <svg viewBox="0 0 100 150" className="w-full h-full rounded-lg bg-gray-800 border-2 border-yellow-400/50 shadow-inner shadow-black">
        {children}
    </svg>
);

export const TheLovers = () => (
    <CardFrame>
        <path d="M 50 20 L 70 50 L 50 80 L 30 50 Z" fill="none" stroke="pink" strokeWidth="2"/>
        <path d="M 50 60 L 60 90 L 40 90 Z" fill="none" stroke="red" strokeWidth="2"/>
        <circle cx="50" cy="55" r="10" fill="none" stroke="white" strokeWidth="1"/>
    </CardFrame>
);

export const TheMagician = () => (
    <CardFrame>
        <path d="M 30 120 L 70 120 L 70 100 L 30 100 Z" fill="none" stroke="yellow" strokeWidth="2"/>
        <path d="M 50 20 L 50 100" fill="none" stroke="white" strokeWidth="2"/>
        <path d="M 20 40 L 80 40" fill="none" stroke="white" strokeWidth="1.5"/>
    </CardFrame>
);

export const TheStar = () => (
    <CardFrame>
        <path d="M50,10 L60,40 L90,40 L65,60 L75,90 L50,70 L25,90 L35,60 L10,40 L40,40 Z" fill="cyan" stroke="white" strokeWidth="1" />
    </CardFrame>
);
export const TheSun = () => (
    <CardFrame>
        <circle cx="50" cy="50" r="30" fill="yellow" stroke="orange" strokeWidth="3" />
        {[...Array(12)].map((_, i) => (
            <line key={i} x1="50" y1="50" x2={50 + 45 * Math.cos(i * 30 * Math.PI / 180)} y2={50 + 45 * Math.sin(i * 30 * Math.PI / 180)} stroke="yellow" strokeWidth="2" />
        ))}
    </CardFrame>
);
export const TheHermit = () => (
    <CardFrame>
        <path d="M 30 130 L 30 30 L 70 30 L 70 90 L 50 110 Z" fill="none" stroke="gray" strokeWidth="2"/>
        <circle cx="60" cy="40" r="5" fill="yellow" />
    </CardFrame>
);
export const TheMoon = () => (
    <CardFrame>
        <path d="M 70 30 A 40 40 0 1 0 70 110 A 30 30 0 1 1 70 30 Z" fill="lightgray" stroke="white" strokeWidth="2"/>
    </CardFrame>
);
export const CardBack = () => (
    <CardFrame>
         <circle cx="50" cy="75" r="30" stroke="purple" strokeWidth="2" fill="none" />
         <path d="M50,20 L65,50 L35,50 Z" stroke="purple" strokeWidth="2" fill="none" />
         <path d="M50,130 L65,100 L35,100 Z" stroke="purple" strokeWidth="2" fill="none" />
    </CardFrame>
);
