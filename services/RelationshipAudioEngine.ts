
// services/RelationshipAudioEngine.ts

class RelationshipAudioEngine {
    private ctx: AudioContext | null = null;
    private masterGain: GainNode | null = null;
    private reverbNode: ConvolverNode | null = null;

    // --- EQ & BUSES ---
    private bassEQ: BiquadFilterNode | null = null;
    private midEQ: BiquadFilterNode | null = null;
    private trebleEQ: BiquadFilterNode | null = null;

    private melodyBus: GainNode | null = null; // Piano, Glass
    private depthBus: GainNode | null = null; // Cello, Bass
    private ambienceBus: GainNode | null = null; // FX

    // --- LAYERS ---
    private glassPadGain: GainNode | null = null;
    private glassPadOscillators: OscillatorNode[] = [];
    private celloGain: GainNode | null = null;
    private celloOscillators: OscillatorNode[] = [];
    private bassGain: GainNode | null = null;
    private bassOsc: OscillatorNode | null = null;

    private delayNode: DelayNode | null = null;
    private feedbackGain: GainNode | null = null;

    private isInitialized = false;
    private isMuted = false;
    private isRecording = false;
    private scale = [220.00, 261.63, 293.66, 329.63, 392.00];

    constructor() {}

    public init() {
        if (this.isInitialized) return;
        try {
            const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
            this.ctx = new AudioContextClass();
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = 0;

            // EQ
            this.bassEQ = this.ctx.createBiquadFilter(); this.bassEQ.type = 'lowshelf'; this.bassEQ.frequency.value = 200;
            this.midEQ = this.ctx.createBiquadFilter(); this.midEQ.type = 'peaking'; this.midEQ.frequency.value = 1000;
            this.trebleEQ = this.ctx.createBiquadFilter(); this.trebleEQ.type = 'highshelf'; this.trebleEQ.frequency.value = 3000;

            // Buses
            this.melodyBus = this.ctx.createGain(); this.melodyBus.gain.value = 1;
            this.depthBus = this.ctx.createGain(); this.depthBus.gain.value = 1;
            this.ambienceBus = this.ctx.createGain(); this.ambienceBus.gain.value = 1;

            this.reverbNode = this.ctx.createConvolver();
            this.reverbNode.buffer = this.createImpulseResponse(3, 2);
            
            this.delayNode = this.ctx.createDelay();
            this.delayNode.delayTime.value = 0.3; 
            this.feedbackGain = this.ctx.createGain();
            this.feedbackGain.gain.value = 0.3;

            // Routing
            this.melodyBus.connect(this.bassEQ);
            this.depthBus.connect(this.bassEQ);
            this.ambienceBus.connect(this.bassEQ);

            this.bassEQ.connect(this.midEQ);
            this.midEQ.connect(this.trebleEQ);
            this.trebleEQ.connect(this.masterGain);

            this.masterGain.connect(this.reverbNode);
            this.reverbNode.connect(this.ctx.destination);
            this.masterGain.connect(this.ctx.destination);

            this.isInitialized = true;
        } catch (e) {
            console.error("Relationship Audio Init Failed", e);
        }
    }
    
    public setStemVolume(stem: string, volume: number) {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        if (stem === 'Melodia' && this.melodyBus) this.melodyBus.gain.setTargetAtTime(volume, now, 0.1);
        if (stem === 'Profundidade' && this.depthBus) this.depthBus.gain.setTargetAtTime(volume, now, 0.1);
        if (stem === 'Ambiente' && this.ambienceBus) this.ambienceBus.gain.setTargetAtTime(volume, now, 0.1);
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
    
    public resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    public setMute(mute: boolean) {
        this.isMuted = mute;
        if (!this.ctx || !this.masterGain) return;
        const now = this.ctx.currentTime;
        const targetVol = this.isRecording ? 0.1 : 0.25;
        this.masterGain.gain.setTargetAtTime(mute ? 0 : targetVol, now, 0.5);
    }

    public setVoiceDucking(active: boolean) {
        if (!this.ctx || !this.masterGain || this.isMuted || this.isRecording) return;
        const now = this.ctx.currentTime;
        const target = active ? 0.1 : 0.25;
        this.masterGain.gain.setTargetAtTime(target, now, 0.5);
    }

    public fadeIn() {
        if (!this.isInitialized) this.init();
        if (!this.ctx || !this.masterGain || this.isMuted) return;
        
        this.resume();
        
        this.startGlassPad();
        this.startCello();
        this.startBass();
        this.startPianoLoop();

        const now = this.ctx.currentTime;
        this.masterGain.gain.cancelScheduledValues(now);
        this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
        this.masterGain.gain.linearRampToValueAtTime(0.25, now + 3);
    }

    public fadeOut() {
        if (!this.ctx || !this.masterGain) return;
        const now = this.ctx.currentTime;
        this.masterGain.gain.cancelScheduledValues(now);
        this.masterGain.gain.exponentialRampToValueAtTime(0.001, now + 2);
        setTimeout(() => this.stopAll(), 2100);
    }

    private startGlassPad() {
        if (!this.ctx) return;
        this.glassPadGain = this.ctx.createGain();
        this.glassPadGain.gain.value = 0.01; 
        
        this.glassPadGain.connect(this.delayNode!);
        this.delayNode!.connect(this.feedbackGain!);
        this.feedbackGain!.connect(this.delayNode!);
        this.delayNode!.connect(this.ambienceBus!); // Connect delay out to ambience

        const freqs = [220.00, 261.63, 329.63, 392.00];

        freqs.forEach(f => {
            const osc = this.ctx!.createOscillator();
            osc.type = 'sine'; 
            osc.frequency.value = f;
            const lfo = this.ctx!.createOscillator();
            lfo.frequency.value = Math.random() * 0.5 + 0.1; 
            const lfoGain = this.ctx!.createGain();
            lfoGain.gain.value = 2; 
            lfo.connect(lfoGain);
            lfoGain.connect(osc.frequency);
            osc.connect(this.glassPadGain!);
            osc.start();
            lfo.start();
            this.glassPadOscillators.push(osc);
            this.glassPadOscillators.push(lfo);
        });
    }
    
    private startCello() {
        if (!this.ctx) return;
        this.celloGain = this.ctx.createGain();
        this.celloGain.gain.value = 0.06;
        this.celloGain.connect(this.depthBus!); // Connect to depth
        
        const freqs = [174.61, 261.63]; 
        
        freqs.forEach(f => {
            const osc = this.ctx!.createOscillator();
            osc.type = 'triangle'; 
            osc.frequency.value = f;
            const filter = this.ctx!.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = 300; 
            osc.connect(filter);
            filter.connect(this.celloGain!);
            osc.start();
            this.celloOscillators.push(osc);
        });
    }
    
    private startBass() {
        if (!this.ctx) return;
        this.bassGain = this.ctx.createGain();
        this.bassGain.gain.value = 0.03; 
        this.bassGain.connect(this.depthBus!); // Connect to depth
        this.bassOsc = this.ctx.createOscillator();
        this.bassOsc.type = 'sine'; 
        this.bassOsc.frequency.value = 55.00; 
        this.bassOsc.connect(this.bassGain);
        this.bassOsc.start();
    }

    private playRhodesNote() {
        if (!this.ctx || !this.melodyBus || this.isMuted) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const pan = this.ctx.createStereoPanner();
        osc.type = 'sine';
        const freq = this.scale[Math.floor(Math.random() * this.scale.length)];
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.08, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 3);
        pan.pan.value = (Math.random() * 1) - 0.5;
        osc.connect(gain);
        gain.connect(pan);
        pan.connect(this.melodyBus); // Connect to Melody Bus
        osc.start(now);
        osc.stop(now + 3.5);
    }

    private pianoInterval: number | null = null;

    private startPianoLoop() {
        if (this.pianoInterval) clearInterval(this.pianoInterval);
        const loop = () => {
            if (Math.random() > 0.3) { 
                this.playRhodesNote();
            }
            const nextTime = Math.random() * 4000 + 2000;
            this.pianoInterval = window.setTimeout(loop, nextTime);
        };
        loop();
    }

    public updateRipples(x: number, y: number) {
        if (!this.ctx || !this.delayNode || this.isMuted) return;
        const now = this.ctx.currentTime;
        const targetDelay = 0.3 + (x * 0.05) + (y * 0.02);
        this.delayNode.delayTime.setTargetAtTime(targetDelay, now, 0.2);
    }

    public triggerTypingSound() {
        if (!this.ctx || !this.ambienceBus || this.isMuted) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = 800 + Math.random() * 200;
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.05, now + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.connect(gain);
        gain.connect(this.ambienceBus);
        osc.start(now);
        osc.stop(now + 0.15);
    }
    
    public setRecordingMode(isRecording: boolean) {
        this.isRecording = isRecording;
        if (!this.ctx || !this.masterGain || this.isMuted) return;
        const now = this.ctx.currentTime;
        const targetVol = isRecording ? 0.05 : 0.25;
        this.masterGain.gain.setTargetAtTime(targetVol, now, 0.5);
    }

    public stopAll() {
        if (this.pianoInterval) clearTimeout(this.pianoInterval);
        this.glassPadOscillators.forEach(o => { try{o.stop();}catch(e){} });
        this.glassPadOscillators = [];
        this.celloOscillators.forEach(o => { try{o.stop();}catch(e){} });
        this.celloOscillators = [];
        if(this.bassOsc) { try{this.bassOsc.stop();}catch(e){} this.bassOsc = null; }
    }
}

export const relationshipAudio = new RelationshipAudioEngine();
