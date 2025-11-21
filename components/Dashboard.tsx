
import React, { useContext, useState, useEffect, useRef } from 'react';
import { View, AppMode } from '../types';
import { CoherenceContext } from '../providers/CoherenceProvider';
import IntentionSetter from './IntentionSetter';
import ConsciousnessNexus from './ConsciousnessNexus';
import SynchronicityWidget from './SynchronicityWidget';
import { OracleIcon, GeometryIcon, FireIcon, MirrorIcon, LeafIcon, YouTubeIcon } from '../assets/Icons';
import { audioEngine } from '../services/AudioEngine';
import { useIntention } from '../hooks/useIntention';
import YouTubeAgent from './YouTubeAgent';

interface DashboardProps {
    onNavigate: (view: View) => void;
    appMode: AppMode;
    setAppMode: (mode: AppMode) => void;
}

const NavCard: React.FC<{ 
    title: string; 
    description: string; 
    view: View; 
    onNavigate: (view: View) => void; 
    gradient: string; 
    icon: React.FC; 
    onHover: (view: View | null) => void;
    cardRef?: React.Ref<HTMLDivElement>;
}> = ({ title, description, view, onNavigate, gradient, icon: Icon, onHover, cardRef }) => {
    
    const handleMouseEnter = () => {
        onHover(view);
        audioEngine.triggerRise();
    };

    const handleClick = () => {
        // Drop Effect (Sound + Vibrate)
        audioEngine.triggerDrop();
        if (navigator.vibrate) navigator.vibrate([50, 20, 100]); // Haptic pattern
        
        // Tiny delay to let the drop hit before switching view
        setTimeout(() => {
            onNavigate(view);
        }, 600);
    };

    return (
        <div 
            ref={cardRef}
            className="group relative h-full"
            onClick={handleClick}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={() => onHover(null)}
        >
            {/* Outer Glow / Portal Rim */}
            <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl blur-md -z-10`}></div>
            
            {/* Portal Body */}
            <div className="relative h-full bg-[#0a0a1a]/80 backdrop-blur-md border border-white/10 rounded-2xl p-3 sm:p-6 flex flex-col items-center text-center transition-all duration-300 group-hover:border-white/40 group-hover:-translate-y-2 group-hover:scale-[1.02] shadow-2xl shadow-black/50 overflow-hidden cursor-pointer z-10">
                
                {/* Inner Ethereal Light */}
                <div className={`absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br ${gradient} opacity-10 blur-3xl rounded-full group-hover:opacity-40 transition-opacity duration-700 group-hover:scale-150`}></div>
                
                <div className="mb-3 sm:mb-4 transform transition-transform duration-500 group-hover:scale-125 group-hover:rotate-6 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                    <div className="w-10 h-10 sm:w-16 sm:h-16">
                        <Icon />
                    </div>
                </div>
                
                <h3 className="text-sm sm:text-xl font-bold text-white mb-1 sm:mb-2 tracking-widest font-serif uppercase group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-purple-200 transition-colors">
                    {title}
                </h3>
                
                <p className="text-[10px] sm:text-xs text-indigo-200/60 font-light leading-relaxed group-hover:text-indigo-100 transition-colors line-clamp-2 sm:line-clamp-none tracking-wide">
                    {description}
                </p>

                <div className="mt-auto pt-2 sm:pt-4 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-4 group-hover:translate-y-0">
                    <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-white/60 border-b border-white/20 pb-1">Ativar Portal</span>
                </div>
            </div>
        </div>
    );
};

const Dashboard: React.FC<DashboardProps> = ({ onNavigate, appMode, setAppMode }) => {
    const { coherenceScore } = useContext(CoherenceContext);
    const [hoveredView, setHoveredView] = useState<View | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const { intention } = useIntention();
    
    // Refs to track movement velocity
    const lastMousePos = useRef<{x: number, y: number} | null>(null);
    const lastNoteTime = useRef<number>(0);
    const rafRef = useRef<number | null>(null);

    // Mouse Move Interaction (Desktop) - Optimized with RAF
    const handleMouseMove = (e: React.MouseEvent) => {
        if (rafRef.current) return; // Skip if frame already scheduled

        const { clientX, clientY } = e;
        
        rafRef.current = requestAnimationFrame(() => {
            const { innerWidth, innerHeight } = window;
            const now = Date.now();
            
            // Normalize coordinates
            const x = (clientX / innerWidth) * 2 - 1; // -1 to 1
            const y = 1 - (clientY / innerHeight); // 0 to 1

            audioEngine.updateInteraction(x, y);
            
            // Calculate Velocity for Melodic Trigger
            if (lastMousePos.current) {
                const dx = clientX - lastMousePos.current.x;
                const dy = clientY - lastMousePos.current.y;
                const distance = Math.sqrt(dx*dx + dy*dy);
                
                // Threshold for triggering a note (prevents constant noise)
                // Minimum time between notes creates a rhythm
                if (distance > 20 && (now - lastNoteTime.current > 150)) {
                    // Intensity based on speed (0.3 to 1.0)
                    const intensity = Math.min(Math.max(distance / 50, 0.3), 1.0);
                    audioEngine.triggerNote(intensity);
                    lastNoteTime.current = now;
                }
            }
            
            lastMousePos.current = { x: clientX, y: clientY };
            rafRef.current = null;
        });
    };

    // Gyroscope Interaction (Mobile)
    useEffect(() => {
        const handleOrientation = (event: DeviceOrientationEvent) => {
            const tiltX = event.gamma; // Left/Right tilt (-90 to 90)
            const tiltY = event.beta;  // Front/Back tilt (-180 to 180)

            if (tiltX !== null && tiltY !== null) {
                // Normalize X (-1 to 1)
                const x = Math.min(Math.max(tiltX / 45, -1), 1);
                // Normalize Y (0 to 1) - Upright (90) is high energy, Flat (0) is low
                const y = Math.min(Math.max((tiltY) / 90, 0), 1);
                
                audioEngine.updateInteraction(x, y);
            }
        };

        window.addEventListener('deviceorientation', handleOrientation);
        return () => window.removeEventListener('deviceorientation', handleOrientation);
    }, []);

    // Scroll Trigger for Mobile (Rise Up Effect on visibility)
    const observerRef = useRef<IntersectionObserver | null>(null);
    const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

    useEffect(() => {
        observerRef.current = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting && entry.intersectionRatio > 0.6) {
                    // Card is mostly visible (center screen on mobile)
                    audioEngine.triggerRise();
                    if (navigator.vibrate) navigator.vibrate(10); // Tiny tick
                }
            });
        }, { threshold: 0.6 });

        cardRefs.current.forEach((el) => {
            if (el) observerRef.current?.observe(el);
        });

        return () => observerRef.current?.disconnect();
    }, []);


    return (
        <div 
            className="flex flex-col items-center w-full min-h-full pt-2 pb-24 px-4 animate-fadeIn"
            onMouseMove={handleMouseMove}
            ref={containerRef}
        >
            
            {/* Top Section: Sync - Nexus - Intention */}
            <div className="w-full max-w-7xl flex flex-col lg:flex-row items-center justify-center gap-6 lg:gap-12 mb-12 mt-4">
                
                {/* 1. Left: Synchronicity Widget */}
                <div className="w-full max-w-md order-1 lg:order-1 flex justify-center lg:justify-end">
                    <SynchronicityWidget />
                </div>
                
                {/* 2. Center: Nexus */}
                <div className="w-64 h-64 sm:w-80 sm:h-80 flex-shrink-0 relative order-2 lg:order-2 pointer-events-none">
                    {/* Brilho Central que pulsa com o áudio (simulado por CSS por enquanto, mas o Nexus já é vivo) */}
                    <div className="absolute inset-0 bg-indigo-500/20 blur-[80px] rounded-full animate-pulse"></div>
                    <ConsciousnessNexus hoveredView={hoveredView} />
                </div>
                
                {/* 3. Right: Intention Setter */}
                <div className="w-full max-w-md order-3 lg:order-3 flex justify-center lg:justify-start">
                    <IntentionSetter />
                </div>

            </div>

            {/* Navigation Grid - 2 Columns on Mobile */}
            <div className="w-full max-w-6xl grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8 auto-rows-fr perspective-1000">
                
                <NavCard 
                    title="Medicinas Ancestrais" 
                    description="Rituais guiados de Rapé e sabedoria da floresta." 
                    view="medicine" 
                    onNavigate={onNavigate} 
                    gradient="from-emerald-500 to-green-600" 
                    icon={LeafIcon} 
                    onHover={setHoveredView}
                    cardRef={el => { if (el) cardRefs.current[0] = el; }}
                />

                <NavCard 
                    title="Oráculo do Coração" 
                    description="Tarot Clássico, Alquimia da Sombra e a Árvore da Vida." 
                    view="tarot" 
                    onNavigate={onNavigate} 
                    gradient="from-purple-500 to-indigo-500" 
                    icon={OracleIcon} 
                    onHover={setHoveredView} 
                    cardRef={el => { if (el) cardRefs.current[1] = el; }}
                />
                
                <NavCard 
                    title="Sala das Geometrias" 
                    description="Meditações visuais com geometria sagrada e frequências." 
                    view="geometry" 
                    onNavigate={onNavigate} 
                    gradient="from-cyan-500 to-blue-500" 
                    icon={GeometryIcon} 
                    onHover={setHoveredView}
                    cardRef={el => { if (el) cardRefs.current[2] = el; }}
                />
                
                <NavCard 
                    title="Fogo Sagrado (Tantra)" 
                    description="Respiração, Kundalini e conexão tântrica." 
                    view="tantra" 
                    onNavigate={onNavigate} 
                    gradient="from-red-500 to-orange-500" 
                    icon={FireIcon} 
                    onHover={setHoveredView}
                    cardRef={el => { if (el) cardRefs.current[3] = el; }}
                />

                <NavCard 
                    title="Sala dos Espelhos" 
                    description="Diário de consciência e simulador de coerência." 
                    view="relationship" 
                    onNavigate={onNavigate} 
                    gradient="from-pink-500 to-rose-500" 
                    icon={MirrorIcon} 
                    onHover={setHoveredView}
                    cardRef={el => { if (el) cardRefs.current[4] = el; }}
                />

                <NavCard 
                    title="Guardião do Marketing" 
                    description="SEO Místico e geração de conteúdo para a Era de Ouro." 
                    view="marketing" 
                    onNavigate={onNavigate} 
                    gradient="from-red-900 to-red-600" 
                    icon={YouTubeIcon} 
                    onHover={setHoveredView}
                    cardRef={el => { if (el) cardRefs.current[5] = el; }}
                />
            </div>
        </div>
    );
};

export default Dashboard;