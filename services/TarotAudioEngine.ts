
// services/TarotAudioEngine.ts

type TarotMode = 'menu' | 'altar' | 'reading' | 'none';

class TarotAudioEngine {
    private ctx: AudioContext | null = null;
    private masterGain: GainNode | null = null;
    private reverbNode: ConvolverNode | null = null;

    // --- EQ & BUSES ---
    private bassEQ: BiquadFilterNode | null = null;
    private midEQ: BiquadFilterNode | null = null;
    private trebleEQ: BiquadFilterNode | null = null;

    private crystalsBus: GainNode | null = null;
    private subconsciousBus: GainNode | null = null;
    private effectsBus: GainNode | null = null;

    // --- LAYERS ---
    private crystalPadNodes: OscillatorNode[] = [];
    private crystalGain: GainNode | null = null; // Connects to crystalsBus
    
    private heartbeatGain: GainNode | null = null; // Connects to subconsciousBus

    // --- STATE ---
    private isInitialized = false;
    private isMuted = false;
    private currentMode: TarotMode = 'none';

    // Scale: Lydian Mode (Lowered Octave)
    private scale = [130.81, 146.83, 164.81, 185.00, 220.00, 261.63, 293.66]; 

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
            this.crystalsBus = this.ctx.createGain(); this.crystalsBus.gain.value = 1;
            this.subconsciousBus = this.ctx.createGain(); this.subconsciousBus.gain.value = 1;
            this.effectsBus = this.ctx.createGain(); this.effectsBus.gain.value = 1;

            this.reverbNode = this.ctx.createConvolver();
            this.reverbNode.buffer = this.createImpulseResponse(4, 3); 
            
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = 400; 

            // Routing: Buses -> Filter -> Reverb -> EQ -> Master
            this.crystalsBus.connect(filter);
            this.subconsciousBus.connect(filter);
            this.effectsBus.connect(filter); // FX also filtered for cohesion
            
            filter.connect(this.reverbNode);
            this.reverbNode.connect(this.bassEQ);
            filter.connect(this.bassEQ); // Dry
            
            this.bassEQ.connect(this.midEQ);
            this.midEQ.connect(this.trebleEQ);
            this.trebleEQ.connect(this.masterGain);
            
            this.masterGain.connect(this.ctx.destination);

            this.isInitialized = true;
        } catch (e) {
            console.error("Tarot Audio Init Failed", e);
        }
    }

    public setStemVolume(stem: string, volume: number) {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        if (stem === 'Cristais' && this.crystalsBus) this.crystalsBus.gain.setTargetAtTime(volume, now, 0.1);
        if (stem === 'Subconsciente' && this.subconsciousBus) this.subconsciousBus.gain.setTargetAtTime(volume, now, 0.1);
        if (stem === 'Efeitos' && this.effectsBus) this.effectsBus.gain.setTargetAtTime(volume, now, 0.1);
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
        this.masterGain.gain.setTargetAtTime(mute ? 0 : 0.20, now, 0.5);
    }
    
    public setVoiceDucking(active: boolean) {
        if (!this.ctx || !this.masterGain || this.isMuted) return;
        const now = this.ctx.currentTime;
        const target = active ? 0.05 : 0.20;
        this.masterGain.gain.setTargetAtTime(target, now, 0.5);
    }

    public fadeIn() {
        if (!this.isInitialized) this.init();
        if (!this.ctx || !this.masterGain || this.isMuted) return;
        
        this.resume();

        const now = this.ctx.currentTime;
        this.masterGain.gain.cancelScheduledValues(now);
        this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
        this.masterGain.gain.linearRampToValueAtTime(0.20, now + 2);
        
        this.setMode('menu');
    }

    public fadeOut() {
        if (!this.ctx || !this.masterGain) return;
        const now = this.ctx.currentTime;
        this.masterGain.gain.cancelScheduledValues(now);
        this.masterGain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
        setTimeout(() => this.stopAll(), 1600);
    }

    public setMode(mode: TarotMode) {
        if (!this.ctx) return;
        this.currentMode = mode;
        this.stopHeartbeat(); 

        if (mode === 'menu' || mode === 'reading') {
            this.startCrystalPad();
        } else if (mode === 'altar') {
            this.startCrystalPad(0.01); 
            this.startHeartbeat();
        }
    }
    
    private startCrystalPad(volume = 0.02) { 
        if (!this.ctx || this.crystalPadNodes.length > 0) {
            if(this.crystalGain) {
                this.crystalGain.gain.setTargetAtTime(volume, this.ctx!.currentTime, 1);
            }
            return;
        }

        const now = this.ctx.currentTime;
        this.crystalGain = this.ctx.createGain();
        this.crystalGain.gain.value = 0;
        this.crystalGain.gain.linearRampToValueAtTime(volume, now + 3);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 300; 

        this.crystalGain.connect(filter);
        filter.connect(this.crystalsBus!); // Connect to bus

        const freqs = [92.50, 138.59, 185.00, 207.65];
        
        freqs.forEach(f => {
            const osc = this.ctx!.createOscillator();
            osc.type = 'sine';
            osc.frequency.value = f;
            
            const lfo = this.ctx!.createOscillator();
            lfo.frequency.value = Math.random() * 3 + 1; 
            const lfoGain = this.ctx!.createGain();
            lfoGain.gain.value = 1; 

            lfo.connect(lfoGain);
            lfoGain.connect(osc.frequency);
            
            osc.connect(this.crystalGain!);
            osc.start();
            lfo.start();
            
            this.crystalPadNodes.push(osc);
            this.crystalPadNodes.push(lfo);
        });
    }

    private startHeartbeat() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;

        this.heartbeatGain = this.ctx.createGain();
        this.heartbeatGain.gain.value = 0.4;
        this.heartbeatGain.connect(this.subconsciousBus!);

        const beatTime = 60 / 50; 
        let nextBeat = now;

        const playBeat = () => {
            if (this.currentMode !== 'altar' || !this.ctx) return;
            this.triggerKick(nextBeat, 0.4);
            this.triggerKick(nextBeat + 0.15, 0.2);
            nextBeat += beatTime;
            setTimeout(playBeat, (nextBeat - this.ctx.currentTime) * 1000);
        };
        playBeat();
    }

    private triggerKick(time: number, vol: number) {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.frequency.setValueAtTime(60, time);
        osc.frequency.exponentialRampToValueAtTime(10, time + 0.1);
        gain.gain.setValueAtTime(vol, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
        osc.connect(gain);
        gain.connect(this.subconsciousBus!); 
        osc.start(time);
        osc.stop(time + 0.2);
    }

    private stopHeartbeat() {
    }

    public triggerStardust(velocity: number) {
        if (!this.ctx || !this.effectsBus || this.isMuted) return;
        if (velocity < 0.1) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const pan = this.ctx.createStereoPanner();

        const freq = this.scale[Math.floor(Math.random() * this.scale.length)] * 2;
        osc.type = 'sine';
        osc.frequency.value = freq;

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.015 * velocity, now + 0.01); 
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

        pan.pan.value = (Math.random() * 2) - 1;

        osc.connect(gain);
        gain.connect(pan);
        pan.connect(this.effectsBus); 

        osc.start(now);
        osc.stop(now + 0.2);
    }

    public triggerHover() {}

    public triggerSelect() {
        if (!this.ctx || this.isMuted) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(138.59, now); 
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.04, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.connect(gain);
        gain.connect(this.effectsBus!);
        osc.start(now);
        osc.stop(now + 0.2);
    }

    public triggerMagicSeal() {
        if (!this.ctx || this.isMuted) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(150, now); 
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.5); 
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        osc.connect(gain);
        gain.connect(this.effectsBus!);
        osc.start(now);
        osc.stop(now + 0.5);
    }

    public triggerShuffle() {
        if (!this.ctx || this.isMuted) return;
        const now = this.ctx.currentTime;
        const bufferSize = this.ctx.sampleRate * 0.3;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        const node = this.ctx.createBufferSource();
        node.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 300;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        node.connect(filter);
        filter.connect(gain);
        gain.connect(this.effectsBus!);
        node.start(now);
    }

    public triggerSephira(index: number) {
        if (!this.ctx || this.isMuted) return;
        const now = this.ctx.currentTime;
        const scaleIndex = (index % this.scale.length);
        const freq = this.scale[scaleIndex];
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.08, now + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 2); 
        osc.connect(gain);
        gain.connect(this.effectsBus!);
        osc.start(now);
        osc.stop(now + 2);
    }

    public stopAll() {
        this.currentMode = 'none';
        this.crystalPadNodes.forEach(n => { try{n.stop();}catch(e){} });
        this.crystalPadNodes = [];
        if (this.crystalGain) { try{this.crystalGain.disconnect();}catch(e){} }
    }
}

export const tarotAudio = new TarotAudioEngine();
