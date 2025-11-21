
// services/TantraAudioEngine.ts

export type TantraMode = 'menu' | 'breathwork' | 'kundalini' | 'touch' | 'archetype';
export type BreathPhase = 'inhale' | 'hold' | 'exhale' | 'idle';

class TantraAudioEngine {
    private ctx: AudioContext | null = null;
    private masterGain: GainNode | null = null;
    private compressor: DynamicsCompressorNode | null = null;

    // --- EQ & BUSES ---
    private bassEQ: BiquadFilterNode | null = null;
    private midEQ: BiquadFilterNode | null = null;
    private trebleEQ: BiquadFilterNode | null = null;

    private breathBus: GainNode | null = null;
    private kundaliniBus: GainNode | null = null;
    private ambienceBus: GainNode | null = null;

    // --- LAYERS ---
    private padOscillators: OscillatorNode[] = [];
    private padFilter: BiquadFilterNode | null = null;
    private padGain: GainNode | null = null; // Connects to ambienceBus
    
    private tremoloGain: GainNode | null = null;
    private tremoloLFO: OscillatorNode | null = null;

    private breathNode: AudioBufferSourceNode | null = null;
    private breathGain: GainNode | null = null; // Connects to breathBus
    private breathFilter: BiquadFilterNode | null = null;

    private snakeOsc: OscillatorNode | null = null;
    private snakeGain: GainNode | null = null; // Connects to kundaliniBus

    // Rhythm
    private nextNoteTime: number = 0;
    private timerID: number | null = null;
    private currentTempo: number = 60;
    private rhythmType: 'none' | 'heartbeat' | 'tribal' | 'ceremonial' = 'none';
    private isCoupleMode: boolean = false;

    // State
    private isInitialized = false;
    private isMuted = false;
    private isPlaying = false;
    private currentMode: TantraMode = 'menu';

    constructor() {}

    public init() {
        if (this.isInitialized) return;
        try {
            const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
            this.ctx = new AudioContextClass();
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = 0;

            this.compressor = this.ctx.createDynamicsCompressor();
            this.compressor.threshold.value = -20;
            this.compressor.ratio.value = 8;
            
            // EQ
            this.bassEQ = this.ctx.createBiquadFilter(); this.bassEQ.type = 'lowshelf'; this.bassEQ.frequency.value = 200;
            this.midEQ = this.ctx.createBiquadFilter(); this.midEQ.type = 'peaking'; this.midEQ.frequency.value = 1000;
            this.trebleEQ = this.ctx.createBiquadFilter(); this.trebleEQ.type = 'highshelf'; this.trebleEQ.frequency.value = 3000;

            // Buses
            this.breathBus = this.ctx.createGain(); this.breathBus.gain.value = 1;
            this.kundaliniBus = this.ctx.createGain(); this.kundaliniBus.gain.value = 1;
            this.ambienceBus = this.ctx.createGain(); this.ambienceBus.gain.value = 1;

            // Routing
            this.breathBus.connect(this.bassEQ);
            this.kundaliniBus.connect(this.bassEQ);
            this.ambienceBus.connect(this.bassEQ);

            this.bassEQ.connect(this.midEQ);
            this.midEQ.connect(this.trebleEQ);
            this.trebleEQ.connect(this.masterGain);

            this.masterGain.connect(this.compressor);
            this.compressor.connect(this.ctx.destination);

            this.isInitialized = true;
        } catch (e) {
            console.error("Tantra Audio Init Failed", e);
        }
    }
    
    public setStemVolume(stem: string, volume: number) {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        if (stem === 'Respiração' && this.breathBus) this.breathBus.gain.setTargetAtTime(volume, now, 0.1);
        if (stem === 'Kundalini' && this.kundaliniBus) this.kundaliniBus.gain.setTargetAtTime(volume, now, 0.1);
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

    public resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    // --- ORCHESTRATION ---
    
    public setMute(mute: boolean) {
        this.isMuted = mute;
        if (!this.ctx || !this.masterGain) return;
        const now = this.ctx.currentTime;
        this.masterGain.gain.setTargetAtTime(mute ? 0 : 0.30, now, 0.5);
    }

    public setVoiceDucking(active: boolean) {
        if (!this.ctx || !this.masterGain || this.isMuted) return;
        const now = this.ctx.currentTime;
        const target = active ? 0.08 : 0.30;
        this.masterGain.gain.setTargetAtTime(target, now, 0.5);
    }

    public fadeIn() {
        if (!this.isInitialized) this.init();
        if (!this.ctx || !this.masterGain || this.isMuted) return;
        
        this.resume();

        this.isPlaying = true;
        this.setMode('menu'); 

        const now = this.ctx.currentTime;
        this.masterGain.gain.cancelScheduledValues(now);
        this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
        this.masterGain.gain.linearRampToValueAtTime(0.30, now + 3);
        
        this.nextNoteTime = now + 0.1;
        this.scheduler();
    }

    public fadeOut() {
        if (!this.ctx || !this.masterGain) return;
        const now = this.ctx.currentTime;
        this.masterGain.gain.cancelScheduledValues(now);
        this.masterGain.gain.exponentialRampToValueAtTime(0.001, now + 2);
        setTimeout(() => this.stopAll(), 2100);
    }

    public setMode(mode: TantraMode, isCouple: boolean = false) {
        if (!this.ctx) return;
        this.currentMode = mode;
        this.isCoupleMode = isCouple;

        this.stopSnake();
        
        switch (mode) {
            case 'menu':
                this.rhythmType = 'none';
                this.startAtmosphere('warm');
                this.stopBreath(); 
                break;
            case 'breathwork':
                this.rhythmType = 'none';
                this.startAtmosphere('deep'); 
                this.startBreathNodes(); 
                break;
            case 'kundalini':
                this.rhythmType = 'tribal';
                this.currentTempo = 65; 
                this.startAtmosphere('fire'); 
                this.startSnake();
                this.stopBreath();
                break;
            case 'touch':
                this.rhythmType = 'heartbeat';
                this.currentTempo = 55;
                this.startAtmosphere('liquid'); 
                this.stopBreath();
                break;
            case 'archetype':
                this.rhythmType = 'ceremonial';
                this.currentTempo = 40; 
                this.startAtmosphere('mystic');
                this.stopBreath();
                break;
        }
    }

    private createPinkNoise(): AudioBuffer | null {
        if (!this.ctx) return null;
        const bufferSize = 2 * this.ctx.sampleRate;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = buffer.getChannelData(0);
        let b0=0, b1=0, b2=0, b3=0, b4=0, b5=0, b6=0;
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            b0 = 0.99886 * b0 + white * 0.0555179;
            b1 = 0.99332 * b1 + white * 0.0750759;
            b2 = 0.96900 * b2 + white * 0.1538520;
            b3 = 0.86650 * b3 + white * 0.3104856;
            b4 = 0.55000 * b4 + white * 0.5329522;
            b5 = -0.7616 * b5 - white * 0.0168980;
            output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
            output[i] *= 0.11;
            b6 = white * 0.115926;
        }
        return buffer;
    }

    private startAtmosphere(type: 'warm' | 'deep' | 'fire' | 'liquid' | 'mystic') {
        this.padOscillators.forEach(o => { try{o.stop(); o.disconnect();}catch(e){} });
        this.padOscillators = [];

        this.padGain = this.ctx!.createGain();
        this.padFilter = this.ctx!.createBiquadFilter();
        this.padFilter.type = 'lowpass';
        
        const tremoloVCA = this.ctx!.createGain();
        this.tremoloLFO = this.ctx!.createOscillator();
        this.tremoloGain = this.ctx!.createGain(); 
        
        this.tremoloLFO.connect(this.tremoloGain);
        this.tremoloGain.connect(tremoloVCA.gain);
        
        tremoloVCA.connect(this.padFilter);
        this.padFilter.connect(this.padGain);
        this.padGain.connect(this.ambienceBus!);

        const now = this.ctx!.currentTime;
        this.padGain.gain.setValueAtTime(0, now);
        this.padGain.gain.linearRampToValueAtTime(0.02, now + 2); 

        let freqs: number[] = [];
        
        switch(type) {
            case 'warm': 
                freqs = [69.30, 103.83, 138.59]; 
                this.padFilter.frequency.value = 200;
                this.tremoloLFO.frequency.value = 0.2;
                this.tremoloGain.gain.value = 0.1; 
                tremoloVCA.gain.value = 0.8;
                break;
            case 'deep': 
                freqs = [55.00, 110.00]; 
                this.padFilter.frequency.value = 150;
                this.tremoloLFO.frequency.value = 0.1; 
                this.tremoloGain.gain.value = 0.2;
                tremoloVCA.gain.value = 0.6;
                break;
            case 'fire': 
                freqs = [138.59, 174.61, 207.65]; 
                this.padFilter.frequency.value = 300;
                this.tremoloLFO.frequency.value = 6; 
                this.tremoloGain.gain.value = 0.3;
                tremoloVCA.gain.value = 0.8;
                break;
             case 'liquid': 
                freqs = [98.00, 146.83, 196.00]; 
                this.padFilter.frequency.value = 250;
                this.tremoloLFO.frequency.value = 4;
                this.tremoloGain.gain.value = 0.3; 
                tremoloVCA.gain.value = 0.7;
                break;
             case 'mystic': 
                freqs = [73.42, 110.00, 146.83]; 
                this.padFilter.frequency.value = 180;
                this.tremoloLFO.frequency.value = 2;
                this.tremoloGain.gain.value = 0.1;
                tremoloVCA.gain.value = 0.8;
                break;
        }

        freqs.forEach(f => {
            const osc = this.ctx!.createOscillator();
            osc.type = 'triangle'; 
            osc.frequency.value = f;
            osc.detune.value = (Math.random() - 0.5) * 8;
            osc.connect(tremoloVCA);
            osc.start();
            this.padOscillators.push(osc);
        });
        
        this.tremoloLFO.start();
    }

    private startBreathNodes() {
        if (this.breathNode) { try{this.breathNode.stop();}catch(e){} }

        const buffer = this.createPinkNoise();
        if (!buffer) return;

        this.breathNode = this.ctx!.createBufferSource();
        this.breathNode.buffer = buffer;
        this.breathNode.loop = true;

        this.breathFilter = this.ctx!.createBiquadFilter();
        this.breathFilter.type = 'lowpass'; 
        this.breathFilter.frequency.value = 200;

        this.breathGain = this.ctx!.createGain();
        this.breathGain.gain.value = 0; 

        this.breathNode.connect(this.breathFilter);
        this.breathFilter.connect(this.breathGain);
        this.breathGain.connect(this.breathBus!);
        
        this.breathNode.start();
    }
    
    private stopBreath() {
        if (this.breathGain) {
             const now = this.ctx!.currentTime;
             this.breathGain.gain.setTargetAtTime(0, now, 0.5);
             setTimeout(() => {
                 if(this.breathNode) { try{this.breathNode.stop();}catch(e){} this.breathNode = null; }
             }, 600);
        }
    }

    public triggerBreathPhase(phase: BreathPhase) {
        if (!this.ctx || !this.breathGain || !this.breathFilter || this.currentMode !== 'breathwork' || this.isMuted) return;
        const now = this.ctx.currentTime;
        const maxVol = 0.3;
        switch(phase) {
            case 'inhale':
                this.breathGain.gain.cancelScheduledValues(now);
                this.breathGain.gain.linearRampToValueAtTime(maxVol, now + 4); 
                this.breathFilter.frequency.cancelScheduledValues(now);
                this.breathFilter.frequency.setValueAtTime(200, now);
                this.breathFilter.frequency.exponentialRampToValueAtTime(600, now + 4);
                break;
            case 'hold':
                this.breathGain.gain.cancelScheduledValues(now);
                this.breathGain.gain.setValueAtTime(maxVol, now);
                this.breathFilter.frequency.cancelScheduledValues(now);
                this.breathFilter.frequency.setValueAtTime(600, now);
                this.breathFilter.frequency.linearRampToValueAtTime(650, now + 7); 
                break;
            case 'exhale':
                this.breathGain.gain.cancelScheduledValues(now);
                this.breathGain.gain.exponentialRampToValueAtTime(0.01, now + 8); 
                this.breathFilter.frequency.cancelScheduledValues(now);
                this.breathFilter.frequency.setValueAtTime(650, now);
                this.breathFilter.frequency.exponentialRampToValueAtTime(200, now + 8);
                break;
            case 'idle':
                this.breathGain.gain.setTargetAtTime(0, now, 0.5);
                break;
        }
    }

    private startSnake() {
        if (!this.ctx) return;
        if (this.snakeOsc) return;

        this.snakeGain = this.ctx.createGain();
        this.snakeGain.gain.value = 0;
        this.snakeGain.connect(this.kundaliniBus!);

        this.snakeOsc = this.ctx.createOscillator();
        this.snakeOsc.type = 'sine'; 
        this.snakeOsc.frequency.value = 80; 

        const lfo = this.ctx.createOscillator();
        lfo.frequency.value = 0.1;
        const lfoGain = this.ctx.createGain();
        lfoGain.gain.value = 20;

        lfo.connect(lfoGain);
        lfoGain.connect(this.snakeOsc.frequency);
        
        this.snakeOsc.connect(this.snakeGain);
        
        this.snakeOsc.start();
        lfo.start();

        const now = this.ctx.currentTime;
        this.snakeGain.gain.linearRampToValueAtTime(0.02, now + 2); 
    }

    private stopSnake() {
        if (this.snakeOsc) {
             try { this.snakeOsc.stop(); } catch(e) {}
             this.snakeOsc = null;
        }
        if (this.snakeGain) {
            this.snakeGain.disconnect();
            this.snakeGain = null;
        }
    }

    public updateInteraction(x: number, y: number) {
        if (!this.ctx || !this.snakeOsc || this.isMuted || this.currentMode !== 'kundalini') return;
        const now = this.ctx.currentTime;
        const targetFreq = 80 + (y * 300); 
        this.snakeOsc.frequency.setTargetAtTime(targetFreq, now, 0.2);
    }

    private scheduler() {
        if (!this.isPlaying || !this.ctx) return;
        const lookahead = 25.0;
        const scheduleAheadTime = 0.1;
        while (this.nextNoteTime < this.ctx.currentTime + scheduleAheadTime) {
            this.scheduleRhythm(this.nextNoteTime);
            const secondsPerBeat = 60.0 / this.currentTempo;
            this.nextNoteTime += secondsPerBeat;
        }
        this.timerID = window.setTimeout(() => this.scheduler(), lookahead);
    }

    private scheduleRhythm(time: number) {
        if (this.rhythmType === 'none' || !this.ctx) return;
        if (this.rhythmType === 'heartbeat') {
            this.triggerKick(time, 0.4); 
            this.triggerKick(time + 0.2, 0.25); 
        } 
        else if (this.rhythmType === 'tribal') {
             this.triggerKick(time, 0.5);
             if (Math.random() > 0.5) this.triggerTom(time + (30/this.currentTempo)); 
        }
        else if (this.rhythmType === 'ceremonial') {
            this.triggerGong(time);
        }
    }

    private triggerKick(time: number, vol: number) {
        if (!this.ctx || !this.ambienceBus) return; // Use AmbienceBus for drums here
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.frequency.setValueAtTime(80, time);
        osc.frequency.exponentialRampToValueAtTime(30, time + 0.1);
        gain.gain.setValueAtTime(vol, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
        osc.connect(gain);
        gain.connect(this.ambienceBus);
        osc.start(time);
        osc.stop(time + 0.2);
    }

    private triggerTom(time: number) {
        if (!this.ctx || !this.ambienceBus) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.frequency.setValueAtTime(120, time);
        osc.frequency.exponentialRampToValueAtTime(80, time + 0.1);
        gain.gain.setValueAtTime(0.2, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
        osc.connect(gain);
        gain.connect(this.ambienceBus);
        osc.start(time);
        osc.stop(time + 0.2);
    }
    
    public triggerGong(time?: number) {
        if (!this.ctx || !this.ambienceBus || this.isMuted) return;
        const t = time || this.ctx.currentTime;
        const freqs = [150, 190];
        freqs.forEach(f => {
            const osc = this.ctx!.createOscillator();
            const gain = this.ctx!.createGain();
            osc.type = 'triangle'; 
            osc.frequency.value = f;
            const filter = this.ctx!.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = 400;
            gain.gain.setValueAtTime(0.08, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 3);
            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.ambienceBus!);
            osc.start(t);
            osc.stop(t + 3.1);
        });
    }
    
    public triggerCrackles() {}

    public stopAll() {
        this.isPlaying = false;
        if (this.timerID) clearTimeout(this.timerID);
        this.padOscillators.forEach(o => { try{o.stop();}catch(e){} });
        this.padOscillators = [];
        this.stopSnake();
        this.stopBreath();
    }
}

export const tantraAudio = new TantraAudioEngine();
