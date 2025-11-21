
// services/AudioEngine.ts

class AudioEngine {
    private ctx: AudioContext | null = null;
    private masterGain: GainNode | null = null;
    private filterNode: BiquadFilterNode | null = null; // Old filter (kept for legacy modulation)
    private pannerNode: StereoPannerNode | null = null;
    
    // --- MASTERING CHAIN ---
    private bassEQ: BiquadFilterNode | null = null;
    private midEQ: BiquadFilterNode | null = null;
    private trebleEQ: BiquadFilterNode | null = null;
    
    private saturator: WaveShaperNode | null = null; // Analog Warmth
    private compressor: DynamicsCompressorNode | null = null; // Bus Glue
    private limiter: DynamicsCompressorNode | null = null; // Safety

    // --- BUSES (STEMS) ---
    private ambienceBus: GainNode | null = null;
    private interfaceBus: GainNode | null = null;

    // Effects
    private delayNode: DelayNode | null = null;
    private feedbackGain: GainNode | null = null;

    // Harmony (Pads)
    private padOscillators: OscillatorNode[] = [];
    private padGain: GainNode | null = null; // Connects to ambienceBus
    private currentChordIndex = 0;
    private chordInterval: any = null;
    
    // State
    private isInitialized = false;
    private isPlaying = false;
    private isMuted = false;

    // --- MUSICAL THEORY DATA ---
    private scale = [277.18, 329.63, 369.99, 415.30, 493.88, 554.37, 659.25, 830.61];
    private chords = [
        [138.59, 207.65, 277.18, 329.63], 
        [110.00, 164.81, 220.00, 277.18], 
        [164.81, 246.94, 311.13, 329.63], 
        [123.47, 185.00, 246.94, 369.99]  
    ];

    constructor() {}

    // --- ANALOG SATURATION CURVE ---
    private makeSaturationCurve(amount: number): Float32Array {
        const k = typeof amount === 'number' ? amount : 50;
        const n_samples = 44100;
        const curve = new Float32Array(n_samples);
        const deg = Math.PI / 180;
        for (let i = 0; i < n_samples; ++i) {
            const x = i * 2 / n_samples - 1;
            // Soft clipping sigmoid for "tube" warmth
            curve[i] = (3 + k) * x * 20 * deg / (Math.PI + k * Math.abs(x));
        }
        return curve;
    }

    public init() {
        if (this.isInitialized) return;

        try {
            const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
            this.ctx = new AudioContextClass();
            
            // --- MASTER GAIN (Final Volume) ---
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = 0; 

            // --- MASTERING CHAIN NODES ---

            // 1. EQ (Tonal Balance)
            this.bassEQ = this.ctx.createBiquadFilter();
            this.bassEQ.type = 'lowshelf';
            this.bassEQ.frequency.value = 150; // Slightly lower for deeper sub
            
            this.midEQ = this.ctx.createBiquadFilter();
            this.midEQ.type = 'peaking';
            this.midEQ.frequency.value = 1200;
            this.midEQ.Q.value = 0.8; // Wide Q for musical mid adjustment

            this.trebleEQ = this.ctx.createBiquadFilter();
            this.trebleEQ.type = 'highshelf';
            this.trebleEQ.frequency.value = 4000; // Air frequency

            // 2. Saturation (Warmth)
            this.saturator = this.ctx.createWaveShaper();
            this.saturator.curve = this.makeSaturationCurve(50); // Moderate warmth
            this.saturator.oversample = '4x'; // High quality anti-aliasing

            // 3. Compressor (The Glue)
            // Gentle compression to bind stems together
            this.compressor = this.ctx.createDynamicsCompressor();
            this.compressor.threshold.value = -20;
            this.compressor.knee.value = 30;
            this.compressor.ratio.value = 3; // Soft ratio
            this.compressor.attack.value = 0.05; // Slow attack to let transients through
            this.compressor.release.value = 0.25;

            // 4. Limiter (Safety Ceiling)
            // Fast compression to prevent clipping
            this.limiter = this.ctx.createDynamicsCompressor();
            this.limiter.threshold.value = -1; // Ceiling
            this.limiter.knee.value = 0;
            this.limiter.ratio.value = 20; // Hard limiting
            this.limiter.attack.value = 0.001; // Instant
            this.limiter.release.value = 0.1;

            // Buses
            this.ambienceBus = this.ctx.createGain();
            this.ambienceBus.gain.value = 1.0;
            
            this.interfaceBus = this.ctx.createGain();
            this.interfaceBus.gain.value = 1.0;

            // Legacy FX Chain (Spatial)
            this.pannerNode = this.ctx.createStereoPanner();
            this.filterNode = this.ctx.createBiquadFilter();
            this.filterNode.type = 'lowpass';
            this.filterNode.frequency.value = 400; 
            this.filterNode.Q.value = 0.1; 

            this.delayNode = this.ctx.createDelay();
            this.delayNode.delayTime.value = 0.6; 
            this.feedbackGain = this.ctx.createGain();
            this.feedbackGain.gain.value = 0.4; 

            // --- ROUTING TOPOLOGY ---
            // Sources -> [Buses] -> [Spatial FX] -> [EQ] -> [Saturation] -> [Glue Comp] -> [Limiter] -> [Master Gain] -> Destination
            
            // 1. Connect Buses to Spatial/Processing
            this.ambienceBus.connect(this.filterNode);
            this.interfaceBus.connect(this.pannerNode);

            // Filter -> Panner
            this.filterNode.connect(this.pannerNode);
            
            // Panner -> Delay Chain
            this.pannerNode.connect(this.delayNode);
            this.delayNode.connect(this.feedbackGain);
            this.feedbackGain.connect(this.delayNode);
            this.delayNode.connect(this.bassEQ); // Wet signal enters Mastering Chain at EQ

            // Panner -> Mastering Chain Start (EQ)
            this.pannerNode.connect(this.bassEQ);
            
            // 2. Mastering Chain Series
            // EQ -> Saturator -> Compressor -> Limiter -> Master -> Out
            this.bassEQ.connect(this.midEQ);
            this.midEQ.connect(this.trebleEQ);
            this.trebleEQ.connect(this.saturator);
            this.saturator.connect(this.compressor);
            this.compressor.connect(this.limiter);
            this.limiter.connect(this.masterGain);

            this.masterGain.connect(this.ctx.destination);

            this.isInitialized = true;
        } catch (e) {
            console.error("AudioEngine init failed:", e);
        }
    }

    public resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    // --- GLOBAL MIXER CONTROLS ---
    
    public setGlobalEQ(bass: number, mid: number, treble: number) {
        if (!this.ctx || !this.bassEQ || !this.midEQ || !this.trebleEQ) return;
        // Map 0-1 input to decibels.
        // Bass: -10dB to +12dB (Boost dominant)
        const mapBass = (val: number) => (val - 0.5) * 24; 
        // Mid: -12dB to +6dB (Cut dominant to reduce mud)
        const mapMid = (val: number) => (val - 0.5) * 18; 
        // Treble: -12dB to +12dB
        const mapTreble = (val: number) => (val - 0.5) * 24; 

        const now = this.ctx.currentTime;
        this.bassEQ.gain.setTargetAtTime(mapBass(bass), now, 0.1);
        this.midEQ.gain.setTargetAtTime(mapMid(mid), now, 0.1);
        this.trebleEQ.gain.setTargetAtTime(mapTreble(treble), now, 0.1);
    }

    public setStemVolume(stem: string, volume: number) {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        if (stem === 'Ambiente' && this.ambienceBus) {
            this.ambienceBus.gain.setTargetAtTime(volume, now, 0.1);
        } else if (stem === 'Interface' && this.interfaceBus) {
            this.interfaceBus.gain.setTargetAtTime(volume, now, 0.1);
        }
    }

    public setMute(mute: boolean) {
        this.isMuted = mute;
        if (!this.ctx || !this.masterGain) return;
        
        const now = this.ctx.currentTime;
        if (mute) {
            this.masterGain.gain.setTargetAtTime(0, now, 0.1);
        } else if (this.isPlaying) {
             this.masterGain.gain.setTargetAtTime(0.3, now, 0.5);
        }
    }

    public setVoiceDucking(active: boolean) {
        if (!this.ctx || !this.masterGain || this.isMuted) return;
        const now = this.ctx.currentTime;
        // More aggressive ducking for clarity
        const target = active ? 0.08 : 0.3;
        this.masterGain.gain.setTargetAtTime(target, now, 0.5);
    }

    public fadeIn() {
        if (!this.isInitialized) this.init();
        if (!this.ctx || !this.masterGain || this.isMuted) return;
        
        this.resume();
        this.startAmbient(); 

        const now = this.ctx.currentTime;
        this.masterGain.gain.cancelScheduledValues(now);
        this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
        this.masterGain.gain.linearRampToValueAtTime(0.3, now + 2); 
    }

    public fadeOut() {
        if (!this.ctx || !this.masterGain) return;
        
        const now = this.ctx.currentTime;
        this.masterGain.gain.cancelScheduledValues(now);
        this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
        this.masterGain.gain.exponentialRampToValueAtTime(0.001, now + 1.5); 
        
        setTimeout(() => {
            this.stopAmbient();
        }, 1600);
    }

    public async startAmbient() {
        if (!this.isInitialized) this.init();
        if (!this.ctx || this.isPlaying) return;

        if (this.ctx.state === 'suspended') {
            await this.ctx.resume();
        }

        this.stopAmbient();

        const now = this.ctx.currentTime;
        
        this.padGain = this.ctx.createGain();
        this.padGain.gain.setValueAtTime(0, now);
        this.padGain.gain.linearRampToValueAtTime(0.01, now + 6); 
        
        // Route: PadGain -> AmbienceBus (which goes into master chain)
        this.padGain.connect(this.ambienceBus!);

        this.playChord(this.chords[0]);
        this.isPlaying = true;

        this.currentChordIndex = 0;
        this.chordInterval = setInterval(() => {
            this.currentChordIndex = (this.currentChordIndex + 1) % this.chords.length;
            this.transitionToChord(this.chords[this.currentChordIndex]);
        }, 16000); 
    }

    private playChord(frequencies: number[]) {
        if (!this.ctx || !this.padGain) return;

        frequencies.forEach((freq, i) => {
            const osc = this.ctx!.createOscillator();
            // Use Triangle/Sine for smooth ambient base
            osc.type = i < 2 ? 'triangle' : 'sine'; 
            const detune = (Math.random() - 0.5) * 6; 
            osc.frequency.value = freq;
            osc.detune.value = detune;

            osc.connect(this.padGain!);
            osc.start();
            this.padOscillators.push(osc);
        });
    }

    private transitionToChord(newFrequencies: number[]) {
        if (!this.ctx || !this.padGain) return;
        const now = this.ctx.currentTime;
        const fadeTime = 6; 

        const fadeOutGain = this.ctx.createGain();
        fadeOutGain.gain.setValueAtTime(0.01, now); 
        fadeOutGain.gain.exponentialRampToValueAtTime(0.001, now + fadeTime);
        fadeOutGain.connect(this.ambienceBus!); 

        this.padOscillators.forEach(osc => {
             try {
                osc.disconnect();
                osc.connect(fadeOutGain);
                osc.stop(now + fadeTime);
             } catch(e){}
        });
        this.padOscillators = []; 

        this.playChord(newFrequencies);
    }

    public updateInteraction(x: number, y: number) {
        if (!this.ctx || !this.filterNode || !this.pannerNode || this.isMuted) return;

        const now = this.ctx.currentTime;
        this.pannerNode.pan.setTargetAtTime(x * 0.4, now, 0.5);
        const targetFreq = 200 + (y * 600);
        this.filterNode.frequency.setTargetAtTime(targetFreq, now, 0.5);
    }

    public triggerNote(intensity: number = 0.5) {
         if (!this.ctx || !this.interfaceBus || this.isMuted) return;
         
         const index = Math.floor(Math.random() * this.scale.length);
         let freq = this.scale[index];

         const osc = this.ctx.createOscillator();
         const gain = this.ctx.createGain();
         
         osc.type = 'sine'; 
         osc.frequency.value = freq;
         
         const now = this.ctx.currentTime;
         gain.gain.setValueAtTime(0, now);
         
         gain.gain.linearRampToValueAtTime(0.05 * intensity, now + 0.2); 
         gain.gain.exponentialRampToValueAtTime(0.001, now + 4); 
         
         osc.connect(gain);
         gain.connect(this.interfaceBus); 
         
         osc.start();
         osc.stop(now + 5);
    }

    public triggerRise() {
        if (!this.ctx || !this.interfaceBus || this.isMuted) return;
        const now = this.ctx.currentTime;
        
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'sine'; 
        const baseFreq = this.chords[this.currentChordIndex][0]; 
        osc.frequency.setValueAtTime(baseFreq, now);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 2, now + 2); 
        
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.05, now + 1);
        gain.gain.linearRampToValueAtTime(0, now + 2);
        
        osc.connect(gain);
        gain.connect(this.delayNode!); 
        gain.connect(this.interfaceBus);
        
        osc.start();
        osc.stop(now + 2);
    }

    public triggerDrop() {
        if (!this.ctx || !this.interfaceBus || this.isMuted) return;
        const now = this.ctx.currentTime;

        const kickOsc = this.ctx.createOscillator();
        const kickGain = this.ctx.createGain();
        kickOsc.frequency.setValueAtTime(60, now);
        kickOsc.frequency.exponentialRampToValueAtTime(30, now + 0.5);
        
        kickGain.gain.setValueAtTime(0.3, now);
        kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        
        kickOsc.connect(kickGain);
        kickGain.connect(this.interfaceBus);
        kickOsc.start();
        kickOsc.stop(now + 0.5);
        
        if (this.padGain) {
             this.padGain.gain.setTargetAtTime(0.005, now, 0.1); 
             this.padGain.gain.setTargetAtTime(0.01, now + 0.5, 1); 
        }
    }

    public stopAmbient() {
        if (this.chordInterval) clearInterval(this.chordInterval);
        
        this.padOscillators.forEach(osc => {
            try { osc.stop(); osc.disconnect(); } catch (e) {}
        });
        this.padOscillators = [];
        if (this.padGain) {
            try { this.padGain.disconnect(); } catch (e) {}
        }
        this.isPlaying = false;
    }
}

export const audioEngine = new AudioEngine();
