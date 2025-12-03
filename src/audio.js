// Simple sound effects using Web Audio API (no external files needed)

let audioContext = null;
let bgMusicNodes = null;

function getAudioContext() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioContext;
}

// Creepy ambient background music
export function startBackgroundMusic() {
    if (bgMusicNodes) return; // Already playing
    
    const ctx = getAudioContext();
    bgMusicNodes = [];
    
    // Create a dark, ambient drone
    const masterGain = ctx.createGain();
    masterGain.gain.value = 0.15;
    masterGain.connect(ctx.destination);
    
    // Low drone
    const drone = ctx.createOscillator();
    const droneGain = ctx.createGain();
    drone.type = 'sine';
    drone.frequency.value = 55; // Low A
    droneGain.gain.value = 0.4;
    drone.connect(droneGain);
    droneGain.connect(masterGain);
    drone.start();
    bgMusicNodes.push(drone);
    
    // Slightly detuned second drone for unease
    const drone2 = ctx.createOscillator();
    const drone2Gain = ctx.createGain();
    drone2.type = 'sine';
    drone2.frequency.value = 55.5; // Slightly off
    drone2Gain.gain.value = 0.3;
    drone2.connect(drone2Gain);
    drone2Gain.connect(masterGain);
    drone2.start();
    bgMusicNodes.push(drone2);
    
    // Eerie high tone that slowly modulates
    const highTone = ctx.createOscillator();
    const highGain = ctx.createGain();
    const highLFO = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    
    highTone.type = 'sine';
    highTone.frequency.value = 880;
    highGain.gain.value = 0.05;
    
    highLFO.type = 'sine';
    highLFO.frequency.value = 0.1; // Very slow modulation
    lfoGain.gain.value = 50;
    
    highLFO.connect(lfoGain);
    lfoGain.connect(highTone.frequency);
    highTone.connect(highGain);
    highGain.connect(masterGain);
    
    highTone.start();
    highLFO.start();
    bgMusicNodes.push(highTone, highLFO);
    
    // Occasional creepy "heartbeat" pulse
    const pulseInterval = setInterval(() => {
        if (!bgMusicNodes) {
            clearInterval(pulseInterval);
            return;
        }
        const pulse = ctx.createOscillator();
        const pulseGain = ctx.createGain();
        pulse.type = 'sine';
        pulse.frequency.value = 40;
        pulseGain.gain.setValueAtTime(0.2, ctx.currentTime);
        pulseGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        pulse.connect(pulseGain);
        pulseGain.connect(masterGain);
        pulse.start();
        pulse.stop(ctx.currentTime + 0.3);
    }, 2000 + Math.random() * 2000);
    
    bgMusicNodes.pulseInterval = pulseInterval;
    bgMusicNodes.masterGain = masterGain;
}

// Stop background music
export function stopBackgroundMusic() {
    if (bgMusicNodes) {
        bgMusicNodes.forEach(node => {
            try { node.stop(); } catch(e) {}
        });
        if (bgMusicNodes.pulseInterval) {
            clearInterval(bgMusicNodes.pulseInterval);
        }
        bgMusicNodes = null;
    }
}

// Pellet collect sound - short high beep
export function playPelletSound() {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.frequency.value = 880;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.1);
}

// Power-up collect sound - ascending tones
export function playPowerUpSound() {
    const ctx = getAudioContext();
    const frequencies = [440, 554, 659, 880];
    
    frequencies.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.frequency.value = freq;
        osc.type = 'square';
        gain.gain.setValueAtTime(0.1, ctx.currentTime + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.08 + 0.08);
        
        osc.start(ctx.currentTime + i * 0.08);
        osc.stop(ctx.currentTime + i * 0.08 + 0.1);
    });
}

// Ghost eaten sound - descending wah
export function playGhostEatenSound() {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.3);
    osc.type = 'sawtooth';
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);
}

// Death sound - low descending tone
export function playDeathSound() {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.frequency.setValueAtTime(400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.5);
    osc.type = 'sawtooth';
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);
}

// Level complete sound - victory fanfare
export function playLevelCompleteSound() {
    const ctx = getAudioContext();
    const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
    
    notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.frequency.value = freq;
        osc.type = 'triangle';
        gain.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.15);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.15 + 0.2);
        
        osc.start(ctx.currentTime + i * 0.15);
        osc.stop(ctx.currentTime + i * 0.15 + 0.25);
    });
}

// Game start sound
export function playStartSound() {
    const ctx = getAudioContext();
    const notes = [262, 330, 392, 523]; // C4, E4, G4, C5
    
    notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.frequency.value = freq;
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.1, ctx.currentTime + i * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.1 + 0.15);
        
        osc.start(ctx.currentTime + i * 0.1);
        osc.stop(ctx.currentTime + i * 0.1 + 0.2);
    });
}
