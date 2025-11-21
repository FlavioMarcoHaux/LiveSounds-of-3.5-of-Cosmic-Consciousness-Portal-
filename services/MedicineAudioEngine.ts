
// services/MedicineAudioEngine.ts

import { audioEngine } from './AudioEngine'; // We can potentially reuse the global EQ logic if we unified engines, but here we just add local bus control.

export type MedicineType = 'warrior' | 'healer' | 'visionary';

type MedicineCategory = 
    | 'amanhecer' | 'entardecer' | 'anoitecer' 
    | 'relaxantes' | 'conexao' | 'forca' 
    | 'energia' | 'mediunidade';

interface SonicDNA {
    baseFreq: number;       
    wave: OscillatorType;   
    roughness: number;      
    tempo: number;          
    element: 'fire' | 'water' | 'wind' | 'earth' | 'ether' | 'rain'; 
    shamanType: MedicineType; 
}

const MEDICINE_DNA: Record<string, SonicDNA> = {
    'murici':       { baseFreq: 55.00,  wave: 'triangle', roughness: 0.02, tempo: 110, element: 'wind', shamanType: 'healer' }, 
    'menta':        { baseFreq: 61.74,  wave: 'sine',     roughness: 0.0, tempo: 90,  element: 'wind', shamanType: 'visionary' }, 
    'sansara':      { baseFreq: 73.42,  wave: 'sine',     roughness: 0.01, tempo: 80,  element: 'ether', shamanType: 'healer' },   
    'cacau':        { baseFreq: 49.00,  wave: 'triangle', roughness: 0.05, tempo: 70,  element: 'earth', shamanType: 'healer' },   
    'caneleiro':    { baseFreq: 41.20,  wave: 'triangle', roughness: 0.05, tempo: 85,  element: 'fire',  shamanType: 'warrior' },  
    'anis-estrelado': { baseFreq: 65.41, wave: 'sine',   roughness: 0.0, tempo: 60,  element: 'ether', shamanType: 'visionary' }, 
    'jurema-preta':   { baseFreq: 55.00,  wave: 'sine',     roughness: 0.05, tempo: 100, element: 'earth', shamanType: 'warrior' },   
    'veia-paje':    { baseFreq: 48.99,  wave: 'triangle', roughness: 0.1, tempo: 120, element: 'fire',  shamanType: 'warrior' },   
    'paje':         { baseFreq: 65.41,  wave: 'sine',     roughness: 0.15, tempo: 95,  element: 'earth', shamanType: 'warrior' },   
    'india-guerreira':{ baseFreq: 73.42, wave: 'triangle', roughness: 0.05, tempo: 105, element: 'fire',  shamanType: 'warrior' }, 
    'samauma':      { baseFreq: 41.20,  wave: 'triangle', roughness: 0.05, tempo: 60,  element: 'earth', shamanType: 'warrior' },   
    'encanto':      { baseFreq: 61.74,  wave: 'triangle', roughness: 0.1, tempo: 115, element: 'fire',  shamanType: 'warrior' },   
    'tsunu':        { baseFreq: 41.20,  wave: 'sine',     roughness: 0.05, tempo: 100, element: 'earth', shamanType: 'warrior' },   
    'mulateiro':    { baseFreq: 55.00,  wave: 'sine',     roughness: 0.05, tempo: 90,  element: 'wind',  shamanType: 'visionary' }, 
    'canela-velho': { baseFreq: 49.00,  wave: 'sine',     roughness: 0.05, tempo: 80,  element: 'earth', shamanType: 'healer' },    
    'ype-roxo':     { baseFreq: 61.74,  wave: 'sine',     roughness: 0.0, tempo: 75,  element: 'water', shamanType: 'healer' },    
    'copaiba':      { baseFreq: 46.25,  wave: 'triangle', roughness: 0.05, tempo: 85,  element: 'water', shamanType: 'healer' },    
    '7-ervas':      { baseFreq: 73.42,  wave: 'sine',     roughness: 0.02, tempo: 80,  element: 'wind',  shamanType: 'healer' },    
    '7-cinzas':     { baseFreq: 55.00,  wave: 'sine',     roughness: 0.05, tempo: 88,  element: 'ether', shamanType: 'visionary' }, 
    'cumaru':       { baseFreq: 65.41,  wave: 'sine',     roughness: 0.0, tempo: 70,  element: 'wind',  shamanType: 'visionary' }, 
    'parica':       { baseFreq: 43.65,  wave: 'triangle', roughness: 0.05, tempo: 110, element: 'earth', shamanType: 'warrior' },   
    'katssaral':    { baseFreq: 73.42,  wave: 'sine',     roughness: 0.05, tempo: 85,  element: 'ether', shamanType: 'visionary' }, 
    'mae-divina':   { baseFreq: 82.41,  wave: 'sine',     roughness: 0.0, tempo: 60,  element: 'water', shamanType: 'visionary' }, 
    'jurema-branca':{ baseFreq: 73.42,  wave: 'sine',     roughness: 0.02, tempo: 65, element: 'ether', shamanType: 'visionary' }, 
    'artemisia':    { baseFreq: 65.41,  wave: 'sine',     roughness: 0.0, tempo: 55,  element: 'water', shamanType: 'visionary' }, 
    'mulungu':      { baseFreq: 43.65,  wave: 'sine',     roughness: 0.0, tempo: 40,  element: 'rain',  shamanType: 'healer' },    
    'imburana':     { baseFreq: 55.00,  wave: 'sine',     roughness: 0.0, tempo: 50,  element: 'wind',  shamanType: 'healer' },    
    'camomila':     { baseFreq: 61.74,  wave: 'sine',     roughness: 0.0, tempo: 45,  element: 'water', shamanType: 'healer' },    
};

class MedicineAudioEngine {
    private ctx: AudioContext | null = null;
    private masterGain: GainNode | null = null;
    private reverbNode: ConvolverNode | null = null;
    
    // --- EQ & BUSES ---
    private bassEQ: BiquadFilterNode | null = null;
    private midEQ: BiquadFilterNode | null = null;
    private trebleEQ: BiquadFilterNode | null = null;

    private natureBus: GainNode | null = null;
    private lifeBus: GainNode | null = null;
    private spiritBus: GainNode | null = null;
    private instrumentsBus: GainNode | null = null;

    private activeNodes: AudioNode[] = [];
    private intervals: number[] = [];
    private currentMedicineId: string | null = null;
    private isPlaying = false;
    private isMuted = false;
    
    private windGain: GainNode | null = null; // Internal modulation
    private pentatonicScale = [196.00, 220.00, 261.63, 293.66, 329.63, 392.00]; 

    constructor() {}

    public init() {
        if (this.ctx) return;
        try {
            const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
            this.ctx = new AudioContextClass();
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = 0.12; 

            this.reverbNode = this.ctx.createConvolver();
            this.reverbNode.buffer = this.createImpulseResponse(4, 2.5);
            
            const masterFilter = this.ctx.createBiquadFilter();
            masterFilter.type = 'lowpass';
            masterFilter.frequency.value = 400; 
            
            // EQ Chain
            this.bassEQ = this.ctx.createBiquadFilter(); this.bassEQ.type = 'lowshelf'; this.bassEQ.frequency.value = 200;
            this.midEQ = this.ctx.createBiquadFilter(); this.midEQ.type = 'peaking'; this.midEQ.frequency.value = 1000;
            this.trebleEQ = this.ctx.createBiquadFilter(); this.trebleEQ.type = 'highshelf'; this.trebleEQ.frequency.value = 3000;

            // Bus creation
            this.natureBus = this.ctx.createGain(); this.natureBus.gain.value = 1;
            this.lifeBus = this.ctx.createGain(); this.lifeBus.gain.value = 1;
            this.spiritBus = this.ctx.createGain(); this.spiritBus.gain.value = 1;
            this.instrumentsBus = this.ctx.createGain(); this.instrumentsBus.gain.value = 1;

            // Routing
            // Buses -> MasterFilter -> Reverb -> EQ -> Master -> Dest
            // Connecting buses to filter
            this.natureBus.connect(masterFilter);
            this.lifeBus.connect(masterFilter);
            this.spiritBus.connect(masterFilter);
            this.instrumentsBus.connect(masterFilter);

            masterFilter.connect(this.reverbNode);
            this.reverbNode.connect(this.bassEQ);
            masterFilter.connect(this.bassEQ); // Dry mix

            this.bassEQ.connect(this.midEQ);
            this.midEQ.connect(this.trebleEQ);
            this.trebleEQ.connect(this.masterGain);

            this.masterGain.connect(this.ctx.destination);

        } catch (e) {
            console.error("Medicine Audio Init Failed", e);
        }
    }
    
    public setStemVolume(stem: string, volume: number) {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        if (stem === 'Natureza' && this.natureBus) this.natureBus.gain.setTargetAtTime(volume, now, 0.1);
        if (stem === 'Vida' && this.lifeBus) this.lifeBus.gain.setTargetAtTime(volume, now, 0.1);
        if (stem === 'Espírito' && this.spiritBus) this.spiritBus.gain.setTargetAtTime(volume, now, 0.1);
        if (stem === 'Instrumentos' && this.instrumentsBus) this.instrumentsBus.gain.setTargetAtTime(volume, now, 0.1);
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
        let lastOut = 0;
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            output[i] = (lastOut + (0.02 * white)) / 1.02; 
            lastOut = output[i];
            output[i] *= 3.5; 
        }
        return buffer;
    }

    public setMute(mute: boolean) {
        this.isMuted = mute;
        if (!this.ctx || !this.masterGain) return;
        const now = this.ctx.currentTime;
        this.masterGain.gain.setTargetAtTime(mute ? 0 : 0.12, now, 0.5);
    }

    public setVoiceDucking(active: boolean) {
        if (!this.ctx || !this.masterGain || this.isMuted) return;
        const now = this.ctx.currentTime;
        const target = active ? 0.02 : 0.12; 
        this.masterGain.gain.setTargetAtTime(target, now, 0.8);
    }

    public fadeIn() {
        this.init();
        if (!this.ctx || !this.masterGain || this.isMuted) return;
        this.resume();
        const now = this.ctx.currentTime;
        this.masterGain.gain.cancelScheduledValues(now);
        this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
        this.masterGain.gain.linearRampToValueAtTime(0.12, now + 4); 
        this.isPlaying = true;
    }

    public fadeOut() {
        if (!this.ctx || !this.masterGain) return;
        const now = this.ctx.currentTime;
        this.masterGain.gain.cancelScheduledValues(now);
        this.masterGain.gain.exponentialRampToValueAtTime(0.001, now + 2);
        setTimeout(() => this.stopAll(), 2100);
    }
    
    public setBiome(category: MedicineCategory) {
        if (this.currentMedicineId) return;
        this.stopAllNodes(); 
        
        if (!this.ctx) this.init();
        if (!this.ctx) return;

        switch(category) {
            case 'amanhecer': 
                this.createWind(200, 0.04); 
                this.startBirds(5000);
                this.startChimes(0.01); 
                this.createDrone(55.00, 'sine', 0.002, 0); 
                break;
            case 'entardecer': 
                this.createCrickets(); 
                this.createWind(100, 0.03);
                this.createDrone(49.00, 'sine', 0.002, 0); 
                break;
            case 'anoitecer': 
                this.createWind(60, 0.08); 
                this.startOwls(); 
                this.createDrone(41.20, 'sine', 0.003, 0); 
                break;
            case 'forca': 
                this.createFire(); 
                this.createDrumHeartbeat(1500, 'kick');
                this.createDrone(48.99, 'triangle', 0.002, 0.05); 
                break;
            case 'energia': 
                this.createRiver(); 
                this.createShakerLoop(250);
                this.createDrone(61.74, 'sine', 0.002, 0); 
                break;
            case 'conexao': 
                this.createWind(150, 0.04);
                this.startFlute(); 
                this.createDrone(55.00, 'sine', 0.002, 0); 
                break;
            case 'mediunidade': 
                this.createBinaural(55.00, 59.00); 
                this.startChimes(0.01);
                break;
            case 'relaxantes': 
                this.createRain(); 
                this.createDrone(49.00, 'sine', 0.003, 0); 
                break;
        }
    }

    public startRitual(medicineId: string) {
        this.stopAllNodes();
        this.currentMedicineId = medicineId;
        this.isPlaying = true;
        const dna = MEDICINE_DNA[medicineId] || MEDICINE_DNA['tsunu']; 
        if (!this.ctx) this.init();
        if (!this.ctx) return;

        switch(dna.element) {
            case 'fire': this.createFire(); break;
            case 'water': this.createRiver(); break;
            case 'rain': this.createRain(); break;
            case 'wind': this.createWind(dna.baseFreq, 0.06); break;
            case 'earth': this.createCrickets(); break;
            case 'ether': this.createWind(150, 0.05); break; 
        }

        if (dna.shamanType === 'healer' && dna.element === 'wind') {
             this.createOrganicPad(dna.baseFreq, 0.003); 
        } else {
             this.createDrone(dna.baseFreq, dna.wave, 0.003, dna.roughness); 
        }
        
        if (dna.tempo > 0) {
            const interval = 60000 / dna.tempo;
            if (dna.tempo < 70) {
                this.createDrumHeartbeat(interval, 'kick');
            } else {
                this.createDrumHeartbeat(interval, 'kick');
                if (dna.shamanType === 'warrior') {
                     this.createShakerLoop(interval / 2);
                }
            }
        }

        if (dna.shamanType === 'visionary') {
            this.startChimes(0.015);
            this.createBinaural(dna.baseFreq, dna.baseFreq + 4); 
        } else if (dna.shamanType === 'healer') {
            this.startFlute();
        }
    }
    
    private createOrganicPad(freq: number, vol: number) {
        if (!this.ctx || !this.spiritBus) return;

        const osc = this.ctx.createOscillator();
        osc.type = 'triangle'; 
        osc.frequency.value = freq;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 120; 

        const gain = this.ctx.createGain();
        gain.gain.value = 0; 
        gain.gain.linearRampToValueAtTime(vol, this.ctx.currentTime + 5);

        const breathLFO = this.ctx.createOscillator();
        breathLFO.frequency.value = 0.15; 
        const breathGain = this.ctx.createGain();
        breathGain.gain.value = vol * 0.5; 
        
        breathLFO.connect(breathGain);
        breathGain.connect(gain.gain);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.spiritBus);

        osc.start();
        breathLFO.start();
        this.activeNodes.push(osc, breathLFO);
    }

    private createWind(freqCenter: number, vol: number) {
        if (!this.ctx || !this.natureBus) return;
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.createNoiseBuffer();
        noise.loop = true;
        
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = Math.min(freqCenter, 200); 
        filter.Q.value = 0.5;

        this.windGain = this.ctx.createGain();
        this.windGain.gain.value = vol;
        
        const lfo = this.ctx.createOscillator();
        lfo.frequency.value = 0.08; 
        const lfoGain = this.ctx.createGain();
        lfoGain.gain.value = 50; 
        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);

        noise.connect(filter);
        filter.connect(this.windGain);
        this.windGain.connect(this.natureBus);
        
        noise.start();
        lfo.start();
        this.activeNodes.push(noise, lfo);
    }

    private createFire() {
        if (!this.ctx || !this.natureBus) return;
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.createNoiseBuffer();
        noise.loop = true;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 80; 
        const gain = this.ctx.createGain();
        gain.gain.value = 0.15; 
        
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.natureBus);
        noise.start();
        this.activeNodes.push(noise);

        const crackleId = window.setInterval(() => {
            if (Math.random() > 0.7) this.playCrackle(); 
        }, 200); 
        this.intervals.push(crackleId);
    }

    private createRiver() {
        if (!this.ctx || !this.natureBus) return;
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.createNoiseBuffer();
        noise.loop = true;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 180; 
        const gain = this.ctx.createGain();
        gain.gain.value = 0.12; 
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.natureBus);
        noise.start();
        this.activeNodes.push(noise);
    }

    private createRain() {
        if (!this.ctx || !this.natureBus) return;
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.createNoiseBuffer();
        noise.loop = true;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass'; 
        filter.frequency.value = 300; 
        const gain = this.ctx.createGain();
        gain.gain.value = 0.08; 
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.natureBus);
        noise.start();
        this.activeNodes.push(noise);
    }
    
    private createDrone(freq: number, type: OscillatorType, vol: number, roughness: number) {
        if (!this.ctx || !this.spiritBus) return;
        const safeType = (type === 'sawtooth' || type === 'square') ? 'triangle' : type;
        const osc = this.ctx.createOscillator();
        osc.type = safeType;
        osc.frequency.value = freq;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 100; 
        const gain = this.ctx.createGain();
        gain.gain.value = vol;
        const lfo = this.ctx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.value = 0.12; 
        const lfoGain = this.ctx.createGain();
        lfoGain.gain.value = vol * 0.5; 
        lfo.connect(lfoGain);
        lfoGain.connect(gain.gain);
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.spiritBus); 
        osc.start();
        lfo.start();
        this.activeNodes.push(osc, lfo);
    }
    
    private createBinaural(freqL: number, freqR: number) {
        if (!this.ctx || !this.spiritBus) return;
        const filterL = this.ctx.createBiquadFilter();
        filterL.type = 'lowpass';
        filterL.frequency.value = 100; 
        const filterR = this.ctx.createBiquadFilter();
        filterR.type = 'lowpass';
        filterR.frequency.value = 100;
        const breathLFO = this.ctx.createOscillator();
        breathLFO.frequency.value = 0.08; 
        const breathGain = this.ctx.createGain();
        breathGain.gain.value = 0.001; 

        const oscL = this.ctx.createOscillator();
        oscL.type = 'sine';
        oscL.frequency.value = freqL;
        const panL = this.ctx.createStereoPanner();
        panL.pan.value = -0.6; 
        const gainL = this.ctx.createGain();
        gainL.gain.value = 0.002; 
        
        oscL.connect(filterL);
        filterL.connect(gainL);
        gainL.connect(panL);
        panL.connect(this.spiritBus);

        const oscR = this.ctx.createOscillator();
        oscR.type = 'sine';
        oscR.frequency.value = freqR;
        const panR = this.ctx.createStereoPanner();
        panR.pan.value = 0.6;
        const gainR = this.ctx.createGain();
        gainR.gain.value = 0.002; 

        oscR.connect(filterR);
        filterR.connect(gainR);
        gainR.connect(panR);
        panR.connect(this.spiritBus);

        breathLFO.connect(breathGain);
        breathGain.connect(gainL.gain);
        breathGain.connect(gainR.gain);

        oscL.start();
        oscR.start();
        breathLFO.start();
        this.activeNodes.push(oscL, oscR, breathLFO);
    }

    private createCrickets() {
        if (!this.ctx || !this.lifeBus) return;
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.createNoiseBuffer();
        noise.loop = true;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 600; 
        filter.Q.value = 4; 
        const gain = this.ctx.createGain();
        const lfo = this.ctx.createOscillator();
        lfo.type = 'sine'; 
        lfo.frequency.value = 3; 
        const lfoGain = this.ctx.createGain();
        lfoGain.gain.value = 0.01; 
        gain.gain.value = 0;
        lfo.connect(gain.gain); 
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.lifeBus);
        noise.start();
        lfo.start();
        this.activeNodes.push(noise, lfo);
    }

    private playBird() {
        if (!this.ctx || !this.lifeBus) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const now = this.ctx.currentTime;
        const startFreq = 600 + Math.random() * 200; 
        osc.type = 'sine';
        osc.frequency.setValueAtTime(startFreq, now);
        osc.frequency.linearRampToValueAtTime(startFreq + 50, now + 0.15);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.02, now + 0.05); 
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.connect(gain);
        gain.connect(this.lifeBus);
        osc.start(now);
        osc.stop(now + 0.3);
    }
    
    private playOwl() {
        if (!this.ctx || !this.lifeBus) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const now = this.ctx.currentTime;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.linearRampToValueAtTime(160, now + 0.4);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.06, now + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
        osc.connect(gain);
        gain.connect(this.lifeBus);
        osc.start(now);
        osc.stop(now + 1);
    }
    
    private playFluteNote() {
        if (!this.ctx || !this.instrumentsBus) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();
        osc.type = 'triangle';
        const note = this.pentatonicScale[Math.floor(Math.random() * this.pentatonicScale.length)];
        osc.frequency.value = note;
        filter.type = 'lowpass';
        filter.frequency.value = 250; 
        const now = this.ctx.currentTime;
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.04, now + 1); 
        gain.gain.linearRampToValueAtTime(0, now + 5);
        const lfo = this.ctx.createOscillator();
        lfo.frequency.value = 4; 
        const lfoGain = this.ctx.createGain();
        lfoGain.gain.value = 2;
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        lfo.start(now);
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.instrumentsBus);
        osc.start(now);
        osc.stop(now + 6);
        lfo.stop(now + 6);
    }
    
    private playChime(maxVol: number = 0.015) {
        if (!this.ctx || !this.instrumentsBus) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        const note = this.pentatonicScale[Math.floor(Math.random() * this.pentatonicScale.length)]; 
        osc.frequency.value = note; 
        const now = this.ctx.currentTime;
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(maxVol, now + 0.1); 
        gain.gain.exponentialRampToValueAtTime(0.001, now + 3);
        osc.connect(gain);
        gain.connect(this.instrumentsBus);
        osc.start(now);
        osc.stop(now + 3);
    }

    private playCrackle() {
         if (!this.ctx || !this.natureBus) return;
         const noise = this.ctx.createBufferSource();
         noise.buffer = this.createNoiseBuffer();
         const filter = this.ctx.createBiquadFilter();
         filter.type = 'highpass';
         filter.frequency.value = 500;
         const gain = this.ctx.createGain();
         const now = this.ctx.currentTime;
         gain.gain.setValueAtTime(0.08, now);
         gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
         noise.connect(filter);
         filter.connect(gain);
         gain.connect(this.natureBus);
         noise.start(now);
         noise.stop(now + 0.1);
    }

    private triggerDrumHit(type: 'kick'|'tom') {
        if (!this.ctx || !this.instrumentsBus) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const now = this.ctx.currentTime;
        osc.frequency.setValueAtTime(60, now); 
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.2);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.connect(gain);
        gain.connect(this.instrumentsBus);
        osc.start(now);
        osc.stop(now + 0.3);
    }
    
    private createDrumHeartbeat(intervalMs: number, type: 'kick'|'tom') {
        const id = window.setInterval(() => { this.triggerDrumHit(type); }, intervalMs);
        this.intervals.push(id);
    }
    private createShakerLoop(intervalMs: number) {
         const id = window.setInterval(() => { this.playShakerHit(); }, intervalMs);
         this.intervals.push(id);
    }
    
    private playShakerHit() {
        if (!this.ctx || !this.instrumentsBus) return;
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.createNoiseBuffer();
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1000; 
        const gain = this.ctx.createGain();
        const now = this.ctx.currentTime;
        gain.gain.setValueAtTime(0.03, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.instrumentsBus);
        noise.start(now);
        noise.stop(now + 0.1);
    }
    
    public triggerShaker() { this.playShakerHit(); }
    
    public triggerSoproImpact() {
        if (!this.ctx || !this.natureBus) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        osc.frequency.setValueAtTime(80, now);
        osc.frequency.exponentialRampToValueAtTime(20, now + 1);
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 2);
        osc.connect(gain);
        gain.connect(this.natureBus);
        osc.start(now);
        osc.stop(now + 2);
    }

    public startInhale() {}
    public triggerExhale() {}
    public triggerLeaves() {}

    public startBirds(interval: number = 2000) {
        const id = window.setInterval(() => { if (Math.random() > 0.6) this.playBird(); }, interval);
        this.intervals.push(id);
    }
    public startOwls() {
        const id = window.setInterval(() => { if (Math.random() > 0.85) this.playOwl(); }, 7000);
        this.intervals.push(id);
    }
    public startFlute() {
        const id = window.setInterval(() => { if (Math.random() > 0.6) this.playFluteNote(); }, 5000);
        this.intervals.push(id);
    }
    public startChimes(vol: number = 0.015) {
        const id = window.setInterval(() => { if (Math.random() > 0.6) this.playChime(vol); }, 3000);
        this.intervals.push(id);
    }

    public updateInteraction(velocity: number) {
        if (this.windGain && this.ctx) {
            const target = 0.04 + (velocity * 0.02);
            this.windGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.1);
        }
    }

    private stopAllNodes() {
        this.isPlaying = false;
        this.currentMedicineId = null;
        this.activeNodes.forEach(node => {
            try { 
                if (node instanceof AudioBufferSourceNode || node instanceof OscillatorNode) node.stop(); 
                node.disconnect(); 
            } catch(e) {}
        });
        this.activeNodes = [];
        this.intervals.forEach(id => clearInterval(id));
        this.intervals = [];
        if (this.windGain) { try{this.windGain.disconnect();}catch(e){} this.windGain = null; }
    }

    public stopAll() {
        this.stopAllNodes();
    }
}

export const medicineAudio = new MedicineAudioEngine();
