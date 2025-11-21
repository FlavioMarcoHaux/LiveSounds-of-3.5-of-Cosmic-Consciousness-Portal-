
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { getTextToSpeech } from '../services/geminiService';
import { decode, decodeAudioData, audioBufferToWav } from '../utils/audioUtils';
import { PlaylistItem } from '../types';

interface AudioPlayerProps {
    playlist: PlaylistItem[];
}

type PlaybackState = 'idle' | 'playing' | 'paused';
type LoadingState = { [index: number]: boolean };
type BufferingProgress = { [index: number]: number };

const chunkText = (text: string, maxLength = 600): string[] => {
    if (!text || typeof text !== 'string') return [""];

    const sentences = text.match(/[^.!?\n]+[.!?\n]+(\s|$)|[^.!?\n]+$/g);
    
    if (!sentences) return [text];

    const chunks: string[] = [];
    let currentChunk = '';

    for (const s of sentences) {
        const sentence = s; 

        if ((currentChunk + sentence).length > maxLength) {
            if (currentChunk.trim()) {
                chunks.push(currentChunk.trim());
                currentChunk = '';
            }

            if (sentence.length > maxLength) {
                const subChunks = sentence.match(new RegExp(`.{1,${maxLength}}`, 'g')) || [sentence];
                subChunks.forEach((sub, index) => {
                    if (index === subChunks.length - 1) {
                        currentChunk = sub;
                    } else {
                        chunks.push(sub.trim());
                    }
                });
            } else {
                currentChunk = sentence;
            }
        } else {
            currentChunk += sentence;
        }
    }
    
    if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
    }
    
    return chunks;
};

const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

const AudioPlayer: React.FC<AudioPlayerProps> = ({ playlist }) => {
    const [playbackState, setPlaybackState] = useState<PlaybackState>('idle');
    const [loadingState, setLoadingState] = useState<LoadingState>({});
    const [bufferingProgress, setBufferingProgress] = useState<BufferingProgress>({});
    const [currentTrackIndex, setCurrentTrackIndex] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    
    // Playback Time State
    const [trackDuration, setTrackDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const currentTimeRef = useRef(0); // Ref to hold current time without triggering re-renders in dependencies
    const [savedTime, setSavedTime] = useState(0); // For pausing/resuming offset

    const audioContextRef = useRef<AudioContext | null>(null);
    const audioBuffersRef = useRef<{ [index: number]: AudioBuffer }>({});
    const activeFetchesRef = useRef<{ [index: number]: Promise<AudioBuffer | null> }>({}); // Promise Cache
    
    const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);
    const startTimeRef = useRef<number>(0); // When the playback started relative to AudioContext time
    const rafRef = useRef<number | null>(null); // Animation Frame ID
    const isMountedRef = useRef(true);
    const playRequestRef = useRef(0);

    // Broadcast Voice Activity for Ducking
    useEffect(() => {
        const isSpeaking = playbackState === 'playing';
        const event = new CustomEvent('cosmic-voice-change', { detail: { isPlaying: isSpeaking } });
        window.dispatchEvent(event);

        return () => {
             if (isSpeaking) {
                 const resetEvent = new CustomEvent('cosmic-voice-change', { detail: { isPlaying: false } });
                 window.dispatchEvent(resetEvent);
             }
        };
    }, [playbackState]);

    // Cleanup logic
    const stopPlayback = useCallback((newState: PlaybackState = 'idle') => {
        playRequestRef.current += 1; // Invalidate playback intent
        
        if (currentSourceRef.current) {
            try {
                currentSourceRef.current.onended = null;
                currentSourceRef.current.stop();
            } catch (e) { /* ignore */ }
            currentSourceRef.current = null;
        }
        
        if (rafRef.current) {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
        }

        if (newState === 'paused') {
            // When pausing, use ref to avoid dependency on state
            setSavedTime(currentTimeRef.current); 
        } else {
            setSavedTime(0);
            setCurrentTime(0);
            currentTimeRef.current = 0;
            setTrackDuration(0);
        }

        setPlaybackState(newState);
        if (newState === 'idle') {
            setCurrentTrackIndex(null);
        }
    }, []); // Dependency array is empty to stabilize reference
    
    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
            stopPlayback();
            if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
                audioContextRef.current.close().catch(console.error);
            }
        };
    }, [stopPlayback]);

    useEffect(() => {
        // Reset if playlist changes entirely
        // Because stopPlayback is now stable, this effect ONLY runs when playlist actually changes identity.
        stopPlayback();
        audioBuffersRef.current = {};
        activeFetchesRef.current = {};
        setLoadingState({});
        setBufferingProgress({});
        setError(null);
    }, [playlist, stopPlayback]);

    // Animation Loop for Progress Bar
    const updateProgress = () => {
        if (audioContextRef.current && playbackState === 'playing') {
            const now = audioContextRef.current.currentTime;
            const elapsed = now - startTimeRef.current;
            
            currentTimeRef.current = elapsed;

            if (elapsed <= trackDuration) {
                setCurrentTime(elapsed);
                rafRef.current = requestAnimationFrame(updateProgress);
            } else {
                setCurrentTime(trackDuration);
            }
        }
    };

    useEffect(() => {
        if (playbackState === 'playing') {
            rafRef.current = requestAnimationFrame(updateProgress);
        } else if (rafRef.current) {
            cancelAnimationFrame(rafRef.current);
        }
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [playbackState, trackDuration]);


    const prepareAudioBuffer = useCallback(async (index: number): Promise<AudioBuffer | null> => {
        // 1. Check Cache (Fully loaded)
        if (audioBuffersRef.current[index]) {
            return audioBuffersRef.current[index];
        }
        // 2. Check Pending Fetch (Deduplication - The Fix)
        // If a fetch is already in progress, return that promise instead of starting a new one.
        if (activeFetchesRef.current[index]) {
            return activeFetchesRef.current[index];
        }

        const textToProcess = playlist[index]?.text;
        if (!textToProcess) return null;

        // Start new fetch
        const fetchPromise = (async () => {
            if (!isMountedRef.current) return null;
            
            setLoadingState(prev => ({ ...prev, [index]: true }));
            setBufferingProgress(prev => ({ ...prev, [index]: 0 }));
            setError(null);
            
            try {
                const textChunks = chunkText(textToProcess);
                if (textChunks.length === 0) throw new Error("Texto vazio para processar.");

                const audioDataChunks: Uint8Array[] = [];

                for (let i = 0; i < textChunks.length; i++) {
                    // Only abort if unmounted. Do NOT abort on pause/play toggle.
                    if (!isMountedRef.current) return null;
                    
                    const base64Audio = await getTextToSpeech(textChunks[i]);
                    if (!base64Audio) throw new Error(`API não retornou áudio para o bloco ${i + 1}.`);
                    
                    audioDataChunks.push(decode(base64Audio));
                    
                    if (isMountedRef.current) {
                        setBufferingProgress(prev => ({ ...prev, [index]: (i + 1) / textChunks.length }));
                    }
                }

                if (!isMountedRef.current) return null;

                // Stitch audio chunks
                const totalLength = audioDataChunks.reduce((acc, chunk) => acc + chunk.length, 0);
                const stitchedAudioData = new Uint8Array(totalLength);
                let offset = 0;
                audioDataChunks.forEach(chunk => {
                    stitchedAudioData.set(chunk, offset);
                    offset += chunk.length;
                });
                
                if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
                    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
                }
                if (audioContextRef.current.state === 'suspended') {
                    await audioContextRef.current.resume();
                }

                const buffer = await decodeAudioData(stitchedAudioData, audioContextRef.current, 24000, 1);
                
                if (isMountedRef.current) {
                    audioBuffersRef.current[index] = buffer;
                }
                
                return buffer;

            } catch (e) {
                console.error(`Error fetching audio for track ${index}:`, e);
                if (isMountedRef.current) {
                    setError(`Falha ao canalizar áudio para "${playlist[index]?.title || 'faixa desconhecida'}".`);
                    // Remove failed fetch so it can be retried
                    delete activeFetchesRef.current[index];
                }
                return null;
            } finally {
                if (isMountedRef.current) {
                    setLoadingState(prev => ({ ...prev, [index]: false }));
                }
            }
        })();

        activeFetchesRef.current[index] = fetchPromise;
        return fetchPromise;
    }, [playlist]);

    const playTrack = useCallback(async (index: number, isContinuousPlay: boolean, startOffset: number = 0) => {
        const currentRequestId = playRequestRef.current;

        if (index >= playlist.length) {
            if (isMountedRef.current) stopPlayback();
            return;
        }
        
        // Stop any current playback immediately when a new request comes in
        if (currentSourceRef.current) {
             try { currentSourceRef.current.stop(); } catch(e) {}
             currentSourceRef.current = null;
        }
        
        if (!isMountedRef.current) return;
        
        setPlaybackState('playing');
        setCurrentTrackIndex(index);

        // Wait for buffer. 
        // With the smart cache, if this is called while fetching, it awaits the existing fetch.
        const buffer = await prepareAudioBuffer(index);

        // Check if user cancelled/paused playback while downloading
        if (playRequestRef.current !== currentRequestId || !isMountedRef.current) {
            // User intention changed (pressed stop or pause).
            // We DO NOT start the source, but the buffer is now safely cached in audioBuffersRef.
            return;
        }

        if (buffer) {
            setTrackDuration(buffer.duration);
            
            const offset = Math.min(Math.max(0, startOffset), buffer.duration);
            setCurrentTime(offset);
            currentTimeRef.current = offset;
            
            if (audioContextRef.current) {
                startTimeRef.current = audioContextRef.current.currentTime - offset;

                const source = audioContextRef.current.createBufferSource();
                source.buffer = buffer;
                source.connect(audioContextRef.current.destination);
                
                source.onended = () => {
                    // Check for race conditions on end
                    if (isMountedRef.current && playRequestRef.current === currentRequestId) {
                        const now = audioContextRef.current?.currentTime || 0;
                        const elapsed = now - startTimeRef.current;
                        
                        // Ensure it actually finished and wasn't just stopped manually
                        if (elapsed >= buffer.duration - 0.5) {
                            currentSourceRef.current = null;
                            if (isContinuousPlay) { 
                                playTrack(index + 1, true, 0);
                            } else {
                                stopPlayback();
                            }
                        }
                    }
                };

                source.start(0, offset);
                currentSourceRef.current = source;
                
                // Pre-buffer next track logic
                if (isContinuousPlay && (index + 1) < playlist.length) {
                     // Trigger fetch for next track if not already there/fetching
                    prepareAudioBuffer(index + 1);
                }
            }
        } else {
             // Error handling - skip to next
             if (isContinuousPlay) {
                playTrack(index + 1, true, 0);
             } else {
                stopPlayback();
             }
        }

    }, [playlist.length, prepareAudioBuffer, stopPlayback]);

    const handleMasterPlay = () => {
        playRequestRef.current += 1;
        if (playbackState === 'playing') {
            stopPlayback('paused');
        } else if (playbackState === 'paused' && currentTrackIndex !== null) {
            playTrack(currentTrackIndex, true, savedTime);
        } else {
            playTrack(0, true, 0);
        }
    };

    const handleTrackClick = (index: number) => {
        playRequestRef.current += 1;
        if (currentTrackIndex === index && playbackState === 'playing') {
            stopPlayback('paused');
        } else if (currentTrackIndex === index && playbackState === 'paused') {
             playTrack(index, false, savedTime);
        } else {
            playTrack(index, false, 0);
        }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newTime = parseFloat(e.target.value);
        setCurrentTime(newTime);
        currentTimeRef.current = newTime;
        setSavedTime(newTime); 

        if (playbackState === 'playing' && currentTrackIndex !== null) {
            playRequestRef.current += 1; 
            if (currentSourceRef.current) {
                try { currentSourceRef.current.stop(); } catch(e) {}
            }
            playTrack(currentTrackIndex, true, newTime);
        }
    };
    
    const handleDownload = async (index: number) => {
        // Must await the buffer if it's not ready
        const buffer = await prepareAudioBuffer(index);
        if (!buffer) return;

        try {
            const wavBlob = audioBufferToWav(buffer);
            const url = URL.createObjectURL(wavBlob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `${playlist[index].title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.wav`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (e) {
            console.error("Download failed:", e);
            setError("Não foi possível preparar o áudio para download.");
        }
    };
    
    const getTrackIcon = (index: number) => {
        const isLoading = loadingState[index];
        const isPlaying = playbackState === 'playing' && currentTrackIndex === index;
        const isPaused = playbackState === 'paused' && currentTrackIndex === index;

        if (isLoading) {
            return (
                 <svg className="h-6 w-6 text-purple-300 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            );
        }
        if (isPlaying) {
            return (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-cyan-300" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
            );
        }
        if (isPaused) {
             return (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-300" viewBox="0 0 20 20" fill="currentColor">
                     <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
            );
        }
        return (
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-300" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
        );
    }

    if (!playlist || !Array.isArray(playlist) || playlist.length === 0) {
        return null;
    }

    return (
        <div className="w-full space-y-4">
            <button
                onClick={handleMasterPlay}
                disabled={playlist.length === 0} 
                className="w-full flex items-center justify-center space-x-3 px-4 py-3 bg-indigo-600/50 text-indigo-100 text-lg rounded-xl hover:bg-indigo-600/80 transition-colors disabled:opacity-60 shadow-lg shadow-indigo-900/20"
            >
                {playbackState === 'playing' ? (
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
                )}
                <span>
                    {playbackState === 'playing' ? 'Pausar Guia' : playbackState === 'paused' ? 'Continuar Guia' : 'Ouvir Guia Completo'}
                </span>
            </button>
            
            <div className="space-y-3 pt-2">
                {playlist.map((item, index) => {
                    const isActive = currentTrackIndex === index;
                    return (
                        <div key={index} 
                            className={`p-4 rounded-xl transition-all duration-300 border shadow-md
                            ${isActive 
                                ? 'bg-purple-900/30 border-purple-400/50 shadow-purple-900/20' 
                                : 'bg-black/20 border-white/5 hover:bg-white/5 cursor-pointer'}`}
                            onClick={() => !isActive && handleTrackClick(index)}
                        >
                            <div className="flex items-start">
                                <button 
                                    className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 transition-colors mr-3"
                                    onClick={(e) => { e.stopPropagation(); handleTrackClick(index); }}
                                >
                                    {getTrackIcon(index)}
                                </button>

                                <div className="flex-grow overflow-hidden">
                                    <div className="flex justify-between items-center">
                                        <h4 className={`font-semibold truncate ${isActive ? 'text-cyan-200' : 'text-purple-200'}`}>{item.title}</h4>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDownload(index); }}
                                            disabled={loadingState[index]}
                                            className="text-purple-300/40 hover:text-purple-200 disabled:opacity-0 transition-colors ml-2"
                                            title="Baixar"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                            </svg>
                                        </button>
                                    </div>

                                    {/* Expanded Controls if Active */}
                                    {isActive && (
                                        <div className="mt-3 animate-fadeIn">
                                            {/* Progress Bar */}
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className="text-xs text-cyan-300/70 font-mono min-w-[35px]">{formatTime(currentTime)}</span>
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max={trackDuration || 100}
                                                    value={currentTime}
                                                    onChange={handleSeek}
                                                    disabled={loadingState[index]}
                                                    className="flex-grow h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-400 hover:accent-cyan-300 focus:outline-none"
                                                />
                                                <span className="text-xs text-purple-300/50 font-mono min-w-[35px]">{formatTime(trackDuration)}</span>
                                            </div>
                                        </div>
                                    )}

                                    <div className="relative mt-1">
                                        <p className={`text-sm text-indigo-200/80 font-serif whitespace-pre-wrap transition-opacity duration-300 ${loadingState[index] ? 'opacity-40' : 'opacity-100'} ${!isActive ? 'line-clamp-2' : ''}`}>
                                            {item.text}
                                        </p>
                                        
                                        {/* Buffering Overlay */}
                                        {loadingState[index] && (
                                            <div className="absolute inset-0 flex flex-col justify-center items-center backdrop-blur-[2px] rounded-md">
                                                <div className="w-3/4 bg-purple-900/50 rounded-full h-1.5 overflow-hidden">
                                                    <div 
                                                        className="bg-cyan-400 h-full rounded-full transition-all duration-300" 
                                                        style={{ width: `${(bufferingProgress[index] || 0) * 100}%` }}
                                                    ></div>
                                                </div>
                                                <p className="text-[10px] text-cyan-200/80 mt-1 uppercase tracking-widest">
                                                    Sintonizando... {Math.round((bufferingProgress[index] || 0) * 100)}%
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
            {error && <p className="text-sm text-red-400 mt-2 text-center bg-red-900/20 py-2 rounded-lg animate-fadeIn">{error}</p>}
        </div>
    );
};

export default AudioPlayer;
