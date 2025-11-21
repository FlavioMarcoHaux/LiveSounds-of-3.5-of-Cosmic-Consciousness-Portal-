
import React from 'react';

export const OracleIcon = () => (
    <svg viewBox="0 0 100 100" className="w-full h-full">
        <defs>
            <filter id="oracle-glow"><feGaussianBlur stdDeviation="4" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
            <linearGradient id="oracle-grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#a78bfa"/><stop offset="100%" stopColor="#c4b5fd"/></linearGradient>
        </defs>
        <g transform="translate(50 55)" filter="url(#oracle-glow)">
            {/* Cards */}
            <rect x="-12" y="-30" width="24" height="40" rx="3" fill="rgba(15,23,42,0.8)" stroke="#c4b5fd" strokeWidth="1.5" transform="rotate(-15)" />
            <rect x="-12" y="-30" width="24" height="40" rx="3" fill="rgba(15,23,42,0.8)" stroke="#c4b5fd" strokeWidth="1.5" />
            <rect x="-12" y="-30" width="24" height="40" rx="3" fill="rgba(15,23,42,0.8)" stroke="#c4b5fd" strokeWidth="1.5" transform="rotate(15)" />
            {/* Heart */}
            <path d="M 0 10 C -20 -10, -15 -25, 0 -15 C 15 -25, 20 -10, 0 10 Z" fill="none" stroke="url(#oracle-grad)" strokeWidth="2.5" />
        </g>
    </svg>
);

export const GeometryIcon = () => (
    <svg viewBox="0 0 100 100" className="w-full h-full">
        <defs>
            <filter id="geo-glow"><feGaussianBlur stdDeviation="3" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
            <linearGradient id="geo-grad"><stop offset="0%" stopColor="#67e8f9"/><stop offset="100%" stopColor="#a855f7"/></linearGradient>
        </defs>
        <g filter="url(#geo-glow)" stroke="url(#geo-grad)" strokeWidth="2" fill="none">
            {/* Merkaba */}
            <polygon points="50,15 85,75 15,75" />
            <polygon points="50,85 15,25 85,25" />
        </g>
    </svg>
);

export const FireIcon = () => (
    <svg viewBox="0 0 100 100" className="w-full h-full">
        <defs>
            <filter id="fire-glow"><feGaussianBlur stdDeviation="5" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
            <radialGradient id="fire-grad"><stop offset="0%" stopColor="#fca5a5"/><stop offset="50%" stopColor="#f97316"/><stop offset="100%" stopColor="#ef4444"/></radialGradient>
        </defs>
        <g filter="url(#fire-glow)">
            {/* Two intertwined snakes */}
            <path d="M 40 90 C 20 70, 20 30, 40 10" stroke="#fca5a5" fill="none" strokeWidth="2.5" />
            <path d="M 60 90 C 80 70, 80 30, 60 10" stroke="#fca5a5" fill="none" strokeWidth="2.5" />
             {/* Flame */}
            <path d="M 50 60 Q 40 40, 50 20 Q 60 40, 50 60 Z" fill="url(#fire-grad)" />
        </g>
    </svg>
);

export const MirrorIcon = () => (
    <svg viewBox="0 0 100 100" className="w-full h-full">
        <defs>
            <filter id="mirror-glow"><feGaussianBlur stdDeviation="3" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
            <radialGradient id="mirror-grad"><stop offset="0%" stopColor="#fbcfe8"/><stop offset="100%" stopColor="#f472b6"/></radialGradient>
        </defs>
        <g filter="url(#mirror-glow)">
             {/* Mirror Frame */}
            <ellipse cx="50" cy="50" rx="40" ry="35" fill="rgba(10,5,20,0.5)" stroke="url(#mirror-grad)" strokeWidth="2.5" />
             {/* Star Reflection */}
            <path d="M50,45 L52,50 L58,50 L53,54 L55,60 L50,56 L45,60 L47,54 L42,50 L48,50 Z" fill="#fff" />
        </g>
    </svg>
);

export const LeafIcon = () => (
    <svg viewBox="0 0 100 100" className="w-full h-full">
        <defs>
            <filter id="leaf-glow"><feGaussianBlur stdDeviation="3" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
            <linearGradient id="leaf-grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#bef264"/><stop offset="100%" stopColor="#15803d"/></linearGradient>
        </defs>
        <g filter="url(#leaf-glow)">
            <path d="M50 90 Q 50 50, 80 20 Q 50 30, 20 20 Q 50 50, 50 90" fill="none" stroke="url(#leaf-grad)" strokeWidth="2" />
            <path d="M50 90 Q 50 50, 80 20" fill="none" stroke="url(#leaf-grad)" strokeWidth="1" opacity="0.5" />
            <path d="M50 90 Q 50 50, 20 20" fill="none" stroke="url(#leaf-grad)" strokeWidth="1" opacity="0.5" />
            <path d="M50 30 L 50 80" fill="none" stroke="url(#leaf-grad)" strokeWidth="1.5" />
             {/* Feather accent */}
             <path d="M 60 80 Q 80 70, 90 50" stroke="#a3e635" fill="none" strokeWidth="1" opacity="0.6"/>
        </g>
    </svg>
);

export const PortalIcon = () => (
    <svg viewBox="0 0 100 100" className="w-full h-full">
        <defs>
            <filter id="portal-glow"><feGaussianBlur stdDeviation="3" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
            <radialGradient id="portal-grad"><stop offset="0%" stopColor="#ffffff"/><stop offset="100%" stopColor="#6366f1"/></radialGradient>
        </defs>
        <g filter="url(#portal-glow)">
            <circle cx="50" cy="50" r="35" fill="none" stroke="url(#portal-grad)" strokeWidth="2" />
            <circle cx="50" cy="50" r="25" fill="none" stroke="url(#portal-grad)" strokeWidth="1" opacity="0.7" />
            <circle cx="50" cy="50" r="5" fill="#fff" />
            <path d="M 50 15 L 50 85 M 15 50 L 85 50" stroke="url(#portal-grad)" strokeWidth="1" opacity="0.5" />
        </g>
    </svg>
);

export const YouTubeIcon = () => (
    <svg viewBox="0 0 100 100" className="w-full h-full">
        <defs>
            <filter id="yt-glow"><feGaussianBlur stdDeviation="3" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
            <linearGradient id="yt-grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#ef4444"/><stop offset="100%" stopColor="#b91c1c"/></linearGradient>
        </defs>
        <g filter="url(#yt-glow)">
            {/* Play Button Shape */}
            <rect x="15" y="25" width="70" height="50" rx="12" fill="url(#yt-grad)" stroke="#fca5a5" strokeWidth="1.5" />
            {/* Triangle */}
            <path d="M 45 40 L 60 50 L 45 60 Z" fill="white" />
            {/* Signal Waves */}
            <path d="M 85 20 Q 95 30, 85 40" stroke="#ef4444" strokeWidth="2" fill="none" opacity="0.7" />
            <path d="M 90 15 Q 105 30, 90 45" stroke="#ef4444" strokeWidth="2" fill="none" opacity="0.4" />
        </g>
    </svg>
);