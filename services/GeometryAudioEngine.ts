
// services/GeometryAudioEngine.ts

class GeometryAudioEngine {
    private ctx: AudioContext | null = null;
    private masterGain: GainNode | null = null;
    private compressor: DynamicsCompressorNode | null = null;

    // --- EQ & BUSES ---
    private bassEQ: BiquadFilterNode | null = null;
    private midEQ: BiquadFilterNode | null = null;
    private trebleEQ: BiquadFilterNode | null = null;

    private baseBus: GainNode | null = null;
    private harmonyBus: GainNode | null = null;
    private melodyBus: GainNode | null = null;

    // --- INSTRUMENT GAINS (Connect to Buses) ---
    private kickGain: GainNode | null = null;
    private bassGain: GainNode | null = null;
    private snareGain: GainNode | null = null;
    private hatGain: GainNode | null = null;
    private shakerGain: GainNode | null = null;
    
    private padGain: GainNode | null = null;
    private atmosGain: GainNode | null = null; 
    private dubGain: GainNode | null = null; // New: Dub Chords

    private arpGain: GainNode | null = null;
    private leadGain: GainNode | null = null;
    private alienGain: GainNode | null = null; // New: Alien FM textures
    private droneGain: GainNode | null = null; 
    
    // --- FX CHAIN ---
    private delayNode: DelayNode | null = null;
    private delayFeedback: GainNode | null = null;
    private delayPan: StereoPannerNode | null = null;
    private reverbNode: ConvolverNode | null = null;

    // --- SEQUENCER STATE ---
    private isPlaying = false;
    private isMuted = false;
    private tempo = 95; // Slightly slower for heavier groove
    private nextNoteTime = 0;
    private current16thNote = 0;
    private currentMeasure = 0; // Track bars for Drops
    private timerID: number | null = null;
    private isInTranceMode = false; 
    
    // --- BUFFER CACHE ---
    private noiseBuffer: AudioBuffer | null = null;

    // --- GENERATIVE STATE ---
    private currentChordIndex = 0;
    // Layers toggled by Sephiroth
    private activeLayers = {
        kick: false, bass: false, drone: false, snare: false, hats: false, shaker: false, 
        pad: false, atmos: false, arp1: false, arp2: false, lead: false
    };
    // Ein Sof State (Master Bus Boost)
    private isEinSofActive = false;
    
    // Psy Chill Harmony: Minor 9ths, Phrygian modes
    private baseFreqs = {
        chordProgression: [
            [138.59, 207.65, 277.18, 329.63], // C#m7
            [123.47, 185.00, 246.94, 293.66], // Bm7
            [110.00, 164.81, 220.00, 261.63], // Am7
            [146.83, 220.00, 293.66, 349.23]  // Dm7
        ],
        scale: [277.18, 293.66, 329.63, 369.99, 415.30, 440.00, 493.88] // C# Minor Scale
    };

    constructor() {}

    public init() {
        if (this.ctx) return;

        try {
            const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
            this.ctx = new AudioContextClass();
            
            // Create shared noise buffer
            this.noiseBuffer = this.createNoiseBuffer();

            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = 0.15; 

            // Master Compressor (The "Glue" for Ein Sof)
            this.compressor = this.ctx.createDynamicsCompressor();
            this.compressor.threshold.value = -24;
            this.compressor.knee.value = 30;
            this.compressor.ratio.value = 12;
            this.compressor.attack.value = 0.003;
            this.compressor.release.value = 0.25;

            // EQ Chain
            this.bassEQ = this.ctx.createBiquadFilter(); this.bassEQ.type = 'lowshelf'; this.bassEQ.frequency.value = 150;
            this.midEQ = this.ctx.createBiquadFilter(); this.midEQ.type = 'peaking'; this.midEQ.frequency.value = 1000;
            this.trebleEQ = this.ctx.createBiquadFilter(); this.trebleEQ.type = 'highshelf'; this.trebleEQ.frequency.value = 3000;

            // Buses
            this.baseBus = this.ctx.createGain(); this.baseBus.gain.value = 1;
            this.harmonyBus = this.ctx.createGain(); this.harmonyBus.gain.value = 0.9;
            this.melodyBus = this.ctx.createGain(); this.melodyBus.gain.value = 0.9;

            // FX
            this.delayNode = this.ctx.createDelay();
            this.delayNode.delayTime.value = 60 / this.tempo * 0.75; // Dotted 8th
            this.delayFeedback = this.ctx.createGain();
            this.delayFeedback.gain.value = 0.55; // High feedback for Dub feel
            this.delayPan = this.ctx.createStereoPanner();
            
            this.reverbNode = this.ctx.createConvolver();
            this.reverbNode.buffer = this.createImpulseResponse(4, 3); // Large Hall

            // Routing
            
            this.baseBus.connect(this.bassEQ);
            this.harmonyBus.connect(this.bassEQ);
            this.melodyBus.connect(this.bassEQ);

            this.bassEQ.connect(this.midEQ);
            this.midEQ.connect(this.trebleEQ);
            this.trebleEQ.connect(this.compressor); 
            this.compressor.connect(this.masterGain);
            this.masterGain.connect(this.ctx.destination);

            // Sends
            this.harmonyBus.connect(this.reverbNode);
            this.melodyBus.connect(this.reverbNode);
            this.melodyBus.connect(this.delayNode); 

            this.reverbNode.connect(this.masterGain); // Reverb returns to master

            // Delay Loop
            this.delayNode.connect(this.delayFeedback);
            this.delayFeedback.connect(this.delayNode);
            this.delayNode.connect(this.delayPan);
            this.delayPan.connect(this.harmonyBus); // Delay creates harmony texture

            // Instruments -> Buses
            this.kickGain = this.ctx.createGain(); this.kickGain.connect(this.baseBus);
            this.bassGain = this.ctx.createGain(); this.bassGain.connect(this.baseBus);
            this.droneGain = this.ctx.createGain(); this.droneGain.connect(this.harmonyBus);

            this.padGain = this.ctx.createGain(); this.padGain.connect(this.harmonyBus);
            this.dubGain = this.ctx.createGain(); this.dubGain.connect(this.harmonyBus);
            this.atmosGain = this.ctx.createGain(); this.atmosGain.connect(this.harmonyBus);
            
            this.snareGain = this.ctx.createGain(); this.snareGain.connect(this.baseBus);
            this.hatGain = this.ctx.createGain(); this.hatGain.connect(this.baseBus);
            this.shakerGain = this.ctx.createGain(); this.shakerGain.connect(this.baseBus);
            
            this.arpGain = this.ctx.createGain(); this.arpGain.connect(this.melodyBus);
            this.leadGain = this.ctx.createGain(); this.leadGain.connect(this.melodyBus);
            this.alienGain = this.ctx.createGain(); this.alienGain.connect(this.melodyBus);

        } catch (e) {
            console.error("Geometry Audio Init Failed", e);
        }
    }

    // ... (Keep Global Controls like setStemVolume, setGlobalEQ, etc.)
    public setStemVolume(stem: string, volume: number) {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        if (stem === 'Base' && this.baseBus) this.baseBus.gain.setTargetAtTime(volume, now, 0.1);
        if (stem === 'Harmonia' && this.harmonyBus) this.harmonyBus.gain.setTargetAtTime(volume, now, 0.1);
        if (stem === 'Melodia' && this.melodyBus) this.melodyBus.gain.setTargetAtTime(volume, now, 0.1);
    }

    public setGlobalEQ(bass: number, mid: number, treble: number) {
        if (!this.ctx || !this.bassEQ || !this.midEQ || !this.trebleEQ) return;
        const mapDB = (val: number) => (val - 0.5) * 20; 
        const now = this.ctx.currentTime;
        this.bassEQ.gain.setTargetAtTime(mapDB(bass), now, 0.1);
        this.midEQ.gain.setTargetAtTime(mapDB(mid), now, 0.1);
        this.trebleEQ.gain.setTargetAtTime(mapDB(treble), now, 0.1);
    }

    private createImpulseResponse(duration: number, decay: number): AudioBuffer | null {
        if (!this.ctx) return null;
        const length = this.ctx.sampleRate * duration;
        const impulse = this.ctx.createBuffer(2, length, this.ctx.sampleRate);
        for (let i = 0; i < 2; i++) {
            const channelData = impulse.getChannelData(i);
            for (let j = 0; j < length; j++) {
                channelData[j] = (Math.random() * 2 - 1) * Math.pow(1 - j / length, decay);
            }
        }
        return impulse;
    }
    
    private createNoiseBuffer(): AudioBuffer | null {
        if (!this.ctx) return null;
        const bufferSize = 2 * this.ctx.sampleRate;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }
        return buffer;
    }

    public resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    public fadeIn() {
        this.init();
        if (!this.ctx || !this.masterGain || this.isMuted) return;
        
        this.resume();

        this.isPlaying = true;
        this.isInTranceMode = false; 
        this.isEinSofActive = false;
        this.nextNoteTime = this.ctx.currentTime + 0.1;
        this.current16thNote = 0;
        this.currentMeasure = 0;
        this.scheduler();

        Object.keys(this.activeLayers).forEach(k => (this.activeLayers as any)[k] = false);

        const now = this.ctx.currentTime;
        this.masterGain.gain.cancelScheduledValues(now);
        this.masterGain.gain.setValueAtTime(0, now);
        this.masterGain.gain.linearRampToValueAtTime(0.15, now + 2);
    }

    public fadeOut() {
        if (!this.ctx || !this.masterGain) return;
        const now = this.ctx.currentTime;
        this.masterGain.gain.cancelScheduledValues(now);
        this.masterGain.gain.exponentialRampToValueAtTime(0.001, now + 2);
        setTimeout(() => this.stopAll(), 2100);
    }

    public setMute(mute: boolean) {
        this.isMuted = mute;
        if (!this.ctx || !this.masterGain) return;
        const now = this.ctx.currentTime;
        const targetVol = this.isEinSofActive ? 0.25 : 0.15; // Louder when infinite
        this.masterGain.gain.setTargetAtTime(mute ? 0 : targetVol, now, 0.2);
    }

    public setVoiceDucking(active: boolean) {
        if (!this.ctx || !this.masterGain || this.isMuted) return;
        const now = this.ctx.currentTime;
        const target = active ? 0.05 : (this.isEinSofActive ? 0.25 : 0.15);
        this.masterGain.gain.setTargetAtTime(target, now, 0.5);
    }

    private scheduler() {
        if (!this.isPlaying || !this.ctx) return;
        const lookahead = 25.0; 
        const scheduleAheadTime = 0.1;

        while (this.nextNoteTime < this.ctx.currentTime + scheduleAheadTime) {
            this.scheduleNote(this.current16thNote, this.nextNoteTime);
            const secondsPerBeat = 60.0 / this.tempo;
            this.nextNoteTime += 0.25 * secondsPerBeat;
            
            this.current16thNote++;
            if (this.current16thNote === 16) {
                this.current16thNote = 0;
                this.currentMeasure++;
            }
        }
        this.timerID = window.setTimeout(() => this.scheduler(), lookahead);
    }

    private scheduleNote(step: number, time: number) {
        // Progression Logic (Every 8 Bars = Drop/Change)
        const isDrop = this.currentMeasure % 8 === 7;
        const isBuildUp = this.currentMeasure % 8 === 6;

        if (step === 0 && Math.random() > 0.7) { 
             this.currentChordIndex = (this.currentChordIndex + 1) % this.baseFreqs.chordProgression.length;
        }

        // --- MALKUTH (Kick) ---
        // Base Drop: Kick gets sparse or double triggered
        if (this.activeLayers.kick) {
            if (isDrop) {
                if (step === 0 || step === 8) this.playKick(time); // Minimal kick on drop
            } else {
                if (step % 4 === 0) this.playKick(time);
            }
        }

        // --- YESOD (Bass) ---
        if (this.activeLayers.bass) {
            if (isDrop) {
                // Glitch/Neuro Bass on Drop
                if (step % 8 === 0) this.playGlitchBass(time);
            } else {
                // Offbeat rolling bass
                if (step % 4 === 2 || step % 4 === 3) { 
                     this.playBass(time, 0.6); 
                }
            }
        }

        // --- GEBURAH (Rimshot/Snare/Zaps) ---
        if (this.activeLayers.snare) {
            if (step === 4 || step === 12) this.playWoodyRim(time);
            
            // Psy Zaps (Base Complexity)
            if (Math.random() > 0.85) this.playPsyZap(time);
        }

        // --- HOD (Hi-Hats) ---
        if (this.activeLayers.hats) {
            if (step % 2 === 0) this.playClosedHat(time, step % 4 === 2 ? 0.2 : 0.1); 
            // Fast rolls on buildup
            if (isBuildUp && step % 2 !== 0 && Math.random() > 0.5) this.playClosedHat(time, 0.05);
        }

        // --- NETZACH (Shakers) ---
        if (this.activeLayers.shaker) {
             const vel = step % 4 === 0 ? 0.15 : 0.08;
             this.playOrganicShaker(time, vel); 
        }

        // --- DAAT (Drone) ---
        if (this.activeLayers.drone && step === 0) {
            this.playThroatDrone(time);
        }

        // --- TIPHARETH (Pad & Dub Stabs) ---
        if (this.activeLayers.pad) {
            if (step === 0) {
                // Trance Gate on drops?
                if (isDrop) {
                    this.playTranceGatePad(time); // More rhythmic
                } else {
                    this.playWarmPad(time); // Smooth
                }
            }
            // Dub Stabs (Harmony Complexity)
            if (step === 10 || step === 14) {
                if (Math.random() > 0.6) this.playDubStab(time);
            }
        }

        // --- CHESED (Atmos) ---
        if (this.activeLayers.atmos && step % 16 === 0) {
            this.playNatureAtmos(time);
        }

        // --- BINAH (Arp 1) & CHOKMAH (Arp 2) & KETHER (Lead) ---
        // Melody Complexity: Alien Talk & Polyrhythms
        if (!this.isInTranceMode) {
            if (this.activeLayers.arp1 && step % 4 === 0) this.playPluckArp(time);
            
            if (this.activeLayers.arp2) {
                // Polyrhythm: Play every 3 steps
                if (step % 3 === 0) this.playSpiralArp(time);
            }
            
            if (this.activeLayers.lead) {
                // Alien FM Talk
                if (Math.random() > 0.9) this.playAlienTalk(time);
                
                if ((step === 0 || step === 7) && Math.random() > 0.4) {
                    this.playFluteLead(time);
                }
            }
        } else {
            // Matrix/Trance mode logic
            if (this.activeLayers.lead && step === 0 && Math.random() > 0.5) {
                 this.playFluteLead(time);
            }
        }
        
        // Dynamic Pan for Delay
        if (step % 8 === 0 && this.delayPan) {
             this.delayPan.pan.setValueAtTime(Math.sin(time), time);
        }
    }

    // --- INSTRUMENT IMPLEMENTATIONS (COMPLEX PSY CHILL) ---

    // BASE: Glitch/Neuro Bass (FM Synthesis for Drop)
    private playGlitchBass(time: number) {
        if (!this.ctx || !this.bassGain) return;
        const modulator = this.ctx.createOscillator();
        const carrier = this.ctx.createOscillator();
        const modGain = this.ctx.createGain();
        const ampGain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        const root = this.baseFreqs.chordProgression[this.currentChordIndex][0] / 4;

        modulator.frequency.value = root * 2; // Harmonic ratio
        carrier.frequency.value = root;

        modGain.gain.setValueAtTime(500, time);
        modGain.gain.exponentialRampToValueAtTime(10, time + 0.5); // FM sweep

        modulator.connect(modGain);
        modGain.connect(carrier.frequency);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, time);
        filter.frequency.exponentialRampToValueAtTime(100, time + 0.4);
        filter.Q.value = 5; // Resonant bite

        ampGain.gain.setValueAtTime(0.5, time);
        ampGain.gain.exponentialRampToValueAtTime(0.001, time + 0.5);

        carrier.connect(filter);
        filter.connect(ampGain);
        ampGain.connect(this.bassGain);

        modulator.start(time);
        carrier.start(time);
        modulator.stop(time + 0.5);
        carrier.stop(time + 0.5);
    }

    // BASE: Psy Zap (Percussive Glitch)
    private playPsyZap(time: number) {
        if (!this.ctx || !this.snareGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.frequency.setValueAtTime(2000, time);
        osc.frequency.exponentialRampToValueAtTime(100, time + 0.1); // Fast pitch drop
        
        gain.gain.setValueAtTime(0.1, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
        
        osc.connect(gain);
        gain.connect(this.snareGain);
        osc.start(time);
        osc.stop(time + 0.1);
    }

    // HARMONY: Dub Stab (Deep Chord with Delay)
    private playDubStab(time: number) {
        if (!this.ctx || !this.dubGain) return;
        const chord = this.baseFreqs.chordProgression[this.currentChordIndex];
        
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(400, time);
        filter.frequency.linearRampToValueAtTime(1200, time + 0.1); // Wah effect
        
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.15, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);

        // Route to Dub Gain which should go to Harmony Bus (with Delay)
        filter.connect(gain);
        gain.connect(this.dubGain);

        // Play 3 notes of chord
        [0, 1, 2].forEach(i => {
            const osc = this.ctx!.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.value = chord[i];
            osc.connect(filter);
            osc.start(time);
            osc.stop(time + 0.3);
        });
    }

    // HARMONY: Trance Gate Pad (Rhythmic Gating)
    private playTranceGatePad(time: number) {
        if (!this.ctx || !this.padGain) return;
        // Base Pad logic similar to warm pad but with volume modulation
        const chord = this.baseFreqs.chordProgression[this.currentChordIndex];
        const subMix = this.ctx.createGain();
        
        // Square LFO for Gating
        const gateLFO = this.ctx.createOscillator();
        gateLFO.type = 'square';
        gateLFO.frequency.value = this.tempo / 15; // Sync to tempo
        const gateGain = this.ctx.createGain();
        gateGain.gain.value = 0.5; // Depth of gate
        
        // Volume Envelope
        subMix.gain.setValueAtTime(0, time);
        subMix.gain.linearRampToValueAtTime(0.04, time + 1);
        subMix.gain.linearRampToValueAtTime(0, time + 7);
        
        // Apply Gate
        const masterGate = this.ctx.createGain();
        gateLFO.connect(gateGain);
        gateGain.connect(masterGate.gain); // AM Modulation
        subMix.connect(masterGate);
        masterGate.connect(this.padGain);

        gateLFO.start(time);
        gateLFO.stop(time + 8);

        chord.forEach((freq) => {
            const osc = this.ctx!.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.value = freq;
            osc.detune.value = (Math.random() - 0.5) * 15; // More detune for trance feel
            const filter = this.ctx!.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = 800;
            osc.connect(filter);
            filter.connect(subMix);
            osc.start(time);
            osc.stop(time + 8);
        });
    }

    // MELODY: Alien Talk (Granular/FM Texture)
    private playAlienTalk(time: number) {
        if (!this.ctx || !this.alienGain) return;
        const mod = this.ctx.createOscillator();
        const car = this.ctx.createOscillator();
        const modGain = this.ctx.createGain();
        const gain = this.ctx.createGain();
        const pan = this.ctx.createStereoPanner();

        car.type = 'sine';
        car.frequency.value = 800 + Math.random() * 500;
        
        mod.type = 'sawtooth';
        mod.frequency.value = 20 + Math.random() * 50; // Fast modulation
        
        modGain.gain.value = 300; 
        
        mod.connect(modGain);
        modGain.connect(car.frequency);
        
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.04, time + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.5);
        
        pan.pan.value = (Math.random() * 2) - 1;
        
        car.connect(gain);
        gain.connect(pan);
        pan.connect(this.alienGain);
        
        mod.start(time);
        car.start(time);
        mod.stop(time + 0.6);
        car.stop(time + 0.6);
    }

    // --- EXISTING INSTRUMENTS (Refined) ---

    private playKick(time: number) {
        if (!this.ctx || !this.kickGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.frequency.setValueAtTime(60, time); 
        osc.frequency.exponentialRampToValueAtTime(30, time + 0.1); 
        
        gain.gain.setValueAtTime(0.7, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.4); 
        
        const clickOsc = this.ctx.createOscillator();
        const clickGain = this.ctx.createGain();
        clickOsc.frequency.setValueAtTime(1500, time);
        clickOsc.frequency.exponentialRampToValueAtTime(100, time + 0.01);
        clickGain.gain.setValueAtTime(0.2, time);
        clickGain.gain.exponentialRampToValueAtTime(0.001, time + 0.01);

        osc.connect(gain);
        gain.connect(this.kickGain);
        clickOsc.connect(clickGain);
        clickGain.connect(this.kickGain);

        osc.start(time);
        osc.stop(time + 0.4);
        clickOsc.start(time);
        clickOsc.stop(time + 0.02);
    }

    private playBass(time: number, velocity: number) {
        if (!this.ctx || !this.bassGain) return;
        const osc = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();
        
        osc.type = 'triangle';
        const rootFreq = this.baseFreqs.chordProgression[this.currentChordIndex][0] / 4; 
        osc.frequency.value = rootFreq;
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(100, time); 
        filter.frequency.linearRampToValueAtTime(400, time + 0.1); 
        filter.frequency.exponentialRampToValueAtTime(80, time + 0.3);
        filter.Q.value = 3;

        gain.gain.setValueAtTime(velocity * 0.4, time); 
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.bassGain);
        osc.start(time);
        osc.stop(time + 0.35);
    }

    private playWoodyRim(time: number) {
        if (!this.ctx || !this.snareGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, time);
        osc.frequency.exponentialRampToValueAtTime(400, time + 0.05);
        gain.gain.setValueAtTime(0.3, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.08); 
        osc.connect(gain);
        gain.connect(this.snareGain);
        osc.start(time);
        osc.stop(time + 0.1);
    }

    private playClosedHat(time: number, vol: number) {
        if (!this.ctx || !this.hatGain || !this.noiseBuffer) return;
        const node = this.ctx.createBufferSource();
        node.buffer = this.noiseBuffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 6000; 
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(vol, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
        node.connect(filter);
        filter.connect(gain);
        gain.connect(this.hatGain);
        node.start(time);
        node.stop(time + 0.1);
    }

    private playOrganicShaker(time: number, vol: number) {
        if (!this.ctx || !this.shakerGain || !this.noiseBuffer) return;
        const node = this.ctx.createBufferSource();
        node.buffer = this.noiseBuffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(2000, time);
        filter.frequency.linearRampToValueAtTime(3000, time + 0.05);
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(vol * 0.6, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
        node.connect(filter);
        filter.connect(gain);
        gain.connect(this.shakerGain);
        node.start(time);
        node.stop(time + 0.15);
    }

    private playThroatDrone(time: number) {
        if (!this.ctx || !this.droneGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();
        osc.type = 'sawtooth';
        osc.frequency.value = this.baseFreqs.chordProgression[this.currentChordIndex][0] / 2; 
        filter.type = 'bandpass';
        filter.frequency.value = 400;
        filter.Q.value = 2;
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.04, time + 2); 
        gain.gain.linearRampToValueAtTime(0, time + 7.5); 
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.droneGain);
        osc.start(time);
        osc.stop(time + 8);
    }

    private playWarmPad(time: number) {
        if (!this.ctx || !this.padGain) return;
        const chord = this.baseFreqs.chordProgression[this.currentChordIndex];
        const subMix = this.ctx.createGain();
        subMix.gain.setValueAtTime(0, time);
        subMix.gain.linearRampToValueAtTime(0.05, time + 2); 
        subMix.gain.linearRampToValueAtTime(0, time + 7);
        subMix.connect(this.padGain);
        chord.forEach((freq, i) => {
            const osc = this.ctx!.createOscillator();
            osc.type = i % 2 === 0 ? 'sine' : 'triangle'; 
            osc.frequency.value = freq;
            osc.detune.value = (Math.random() - 0.5) * 10;
            const oscFilter = this.ctx!.createBiquadFilter();
            oscFilter.type = 'lowpass';
            oscFilter.frequency.value = 600;
            osc.connect(oscFilter);
            oscFilter.connect(subMix);
            osc.start(time);
            osc.stop(time + 8);
        });
    }
    
    private playNatureAtmos(time: number) {
         if (!this.ctx || !this.atmosGain || !this.noiseBuffer) return;
         const node = this.ctx.createBufferSource();
         node.buffer = this.noiseBuffer;
         node.loop = true;
         const filter = this.ctx.createBiquadFilter();
         filter.type = 'lowpass';
         filter.frequency.setValueAtTime(200, time);
         filter.frequency.linearRampToValueAtTime(600, time + 4);
         filter.frequency.linearRampToValueAtTime(200, time + 8);
         const gain = this.ctx.createGain();
         gain.gain.setValueAtTime(0, time);
         gain.gain.linearRampToValueAtTime(0.03, time + 4); 
         gain.gain.linearRampToValueAtTime(0, time + 8);
         node.connect(filter);
         filter.connect(gain);
         gain.connect(this.atmosGain);
         node.start(time);
         node.stop(time + 8);
    }

    private playPluckArp(time: number) {
        if (!this.ctx || !this.arpGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const chord = this.baseFreqs.chordProgression[this.currentChordIndex];
        const note = chord[Math.floor(Math.random() * chord.length)] * 2;
        osc.type = 'sine'; 
        osc.frequency.value = note;
        gain.gain.setValueAtTime(0.05, time); 
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);
        osc.connect(gain);
        gain.connect(this.arpGain);
        osc.start(time);
        osc.stop(time + 0.35);
    }
    
    private playSpiralArp(time: number) {
        if (!this.ctx || !this.arpGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();
        const chord = this.baseFreqs.chordProgression[this.currentChordIndex];
        const note = chord[this.current16thNote % chord.length] * 1.5;
        osc.type = 'triangle';
        osc.frequency.value = note;
        filter.type = 'bandpass';
        filter.frequency.value = 800 + Math.sin(time) * 400; 
        gain.gain.setValueAtTime(0.03, time); 
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.arpGain);
        osc.start(time);
        osc.stop(time + 0.25);
    }

    private playFluteLead(time: number) {
         if (!this.ctx || !this.leadGain) return;
         const osc = this.ctx.createOscillator();
         osc.type = 'sine';
         const note = this.baseFreqs.scale[Math.floor(Math.random() * this.baseFreqs.scale.length)];
         osc.frequency.value = note;
         const vibrato = this.ctx.createOscillator();
         vibrato.frequency.value = 5;
         const vibratoGain = this.ctx.createGain();
         vibratoGain.gain.value = 3;
         vibrato.connect(vibratoGain);
         vibratoGain.connect(osc.frequency);
         const gain = this.ctx.createGain();
         gain.gain.setValueAtTime(0, time);
         gain.gain.linearRampToValueAtTime(0.06, time + 0.5); 
         gain.gain.linearRampToValueAtTime(0, time + 3); 
         osc.connect(gain);
         gain.connect(this.leadGain);
         osc.start(time);
         vibrato.start(time);
         osc.stop(time + 3.5);
         vibrato.stop(time + 3.5);
    }

    public updateScanner(x: number, y: number, active: boolean) {
         if (!this.ctx || !this.masterGain || this.isMuted) return;
         if (this.delayFeedback) {
             const feedback = 0.3 + (y * 0.3); 
             this.delayFeedback.gain.setTargetAtTime(feedback, this.ctx.currentTime, 0.2);
         }
    }

    public triggerSolfeggio(sephiraName: string) {
        const nameMap: {[key:string]: string} = {
            'Fundação do Eu': 'Malkuth', 'Semente da Unidade': 'Yesod', 'Vórtice da Transformação': 'Netzach', 'O Pilar da Glória': 'Hod',
            'Esfera da Beleza': 'Tiphareth', 'O Templo da Compaixão': 'Chesed', 'Pilar da Força': 'Geburah', 'Portal da Coerência': 'Daat',
            'Coroa Cósmica': 'Kether', 'A Fonte da Sabedoria': 'Chokmah', 'O Santuário do Entendimento': 'Binah', 'O Infinito': 'EinSof'
        };
        
        const id = nameMap[sephiraName] || sephiraName;
        const now = this.ctx!.currentTime;

        switch(id) {
            case 'EinSof':
                this.isEinSofActive = !this.isEinSofActive;
                // Engage God Mode (Master Glue)
                if (this.isEinSofActive && this.masterGain) {
                    // Boost Master Volume for full immersion
                    this.masterGain.gain.linearRampToValueAtTime(0.25, now + 1); 
                    // Expand Stereo Width via Delay Pan (subtle trick) or Reverb wetness
                    // Since we can't easily change reverb wet/dry ratio dynamically without more nodes, we assume the volume boost + existing chain creates the effect.
                    // We can play a special sound "The All"
                    this.playOneShot(110, 2.0); // Low deep Om
                } else if (this.masterGain) {
                    this.masterGain.gain.linearRampToValueAtTime(0.15, now + 1);
                }
                break;
            case 'Malkuth': this.activeLayers.kick = !this.activeLayers.kick; break;
            case 'Yesod': this.activeLayers.bass = !this.activeLayers.bass; break;
            case 'Hod': this.activeLayers.hats = !this.activeLayers.hats; break;
            case 'Netzach': this.activeLayers.shaker = !this.activeLayers.shaker; break;
            case 'Tiphareth': this.activeLayers.pad = !this.activeLayers.pad; break;
            case 'Geburah': this.activeLayers.snare = !this.activeLayers.snare; break;
            case 'Chesed': this.activeLayers.atmos = !this.activeLayers.atmos; break;
            case 'Daat': this.activeLayers.drone = !this.activeLayers.drone; break;
            case 'Binah': this.activeLayers.arp1 = !this.activeLayers.arp1; break;
            case 'Chokmah': this.activeLayers.arp2 = !this.activeLayers.arp2; break;
            case 'Kether': this.activeLayers.lead = !this.activeLayers.lead; break;
        }
        
        if (id !== 'EinSof') {
            this.playOneShot(528, 1.6);
        }
    }
    
    private playOneShot(freq: number = 528, duration: number = 1.6) {
        if (!this.ctx || !this.melodyBus) return;
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = freq; 
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.03, this.ctx.currentTime); 
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.melodyBus);
        osc.start();
        osc.stop(this.ctx.currentTime + duration + 0.1);
    }
    
    public triggerHover() {}
    public triggerMatrixStart() {
        if(!this.ctx) return;
        const now = this.ctx.currentTime;
        this.masterGain!.gain.cancelScheduledValues(now);
        this.masterGain!.gain.setValueAtTime(this.masterGain!.gain.value, now);
        this.masterGain!.gain.linearRampToValueAtTime(0.1, now + 2); 
        setTimeout(() => {
            this.isInTranceMode = true;
            this.currentChordIndex = 0;
            this.currentMeasure = 6; // Start close to drop
            const dropTime = this.ctx!.currentTime;
            this.masterGain!.gain.linearRampToValueAtTime(0.15, dropTime + 4); 
        }, 2000);
    }

    public stopAll() {
        this.isPlaying = false;
        if (this.timerID) clearTimeout(this.timerID);
        this.isInTranceMode = false;
        this.isEinSofActive = false;
        Object.keys(this.activeLayers).forEach(k => (this.activeLayers as any)[k] = false);
    }
}

export const geometryAudio = new GeometryAudioEngine();
