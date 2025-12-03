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

// Jumpscare sound - loud chaotic screech
export function playJumpscareSound() {
    const ctx = getAudioContext();
    
    // Create multiple chaotic oscillators
    const freqs = [800, 1200, 2000, 5000, 100];
    const types = ['sawtooth', 'square', 'sawtooth', 'sawtooth', 'square'];
    
    freqs.forEach((f, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = types[i];
        osc.frequency.value = f;
        
        // Aggressive frequency modulation
        osc.frequency.exponentialRampToValueAtTime(f * 0.5, ctx.currentTime + 0.3);
        
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.5);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 1.5);
    });
    
    // Add noise burst
    const bufferSize = ctx.sampleRate * 1.0; // 1 second
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.8, ctx.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.0);
    
    noise.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(ctx.currentTime);
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

// ============================================
// HEARTBEAT & 3D POSITIONAL GHOST AUDIO
// ============================================

let heartbeatInterval = null;
let ghostAudioNodes = new Map(); // Map ghost index to audio nodes

// Start heartbeat system - intensity based on closest ghost distance
export function startHeartbeat() {
    if (heartbeatInterval) return;
    
    const ctx = getAudioContext();
    let lastBeatTime = 0;
    
    heartbeatInterval = setInterval(() => {
        // This will be called from game loop with distance
    }, 50);
}

// Update heartbeat based on closest ghost distance (call this from game loop)
let nextHeartbeatTime = 0;
export function updateHeartbeat(closestGhostDistance) {
    if (!audioContext) return;
    
    const ctx = getAudioContext();
    const now = Date.now();
    
    // Calculate heartbeat intensity (0 = far/calm, 1 = very close/panic)
    const maxDistance = 12;
    const minDistance = 2;
    const intensity = Math.max(0, Math.min(1, 
        1 - (closestGhostDistance - minDistance) / (maxDistance - minDistance)
    ));
    
    // Skip if too far (no heartbeat)
    if (intensity <= 0) return;
    
    // Heartbeat rate: 60 BPM when far, up to 180 BPM when very close
    const bpm = 60 + intensity * 120;
    const beatInterval = 60000 / bpm;
    
    if (now >= nextHeartbeatTime) {
        nextHeartbeatTime = now + beatInterval;
        playHeartbeat(intensity);
    }
}

// Play a single heartbeat (lub-dub) using sine waves with proper envelope
function playHeartbeat(intensity) {
    const ctx = getAudioContext();
    const volume = 0.15 + intensity * 0.5;
    
    // LUB (first beat) - two quick sine pulses
    const lub1 = ctx.createOscillator();
    const lub1Gain = ctx.createGain();
    lub1.type = 'sine';
    lub1.frequency.value = 60;
    lub1.connect(lub1Gain);
    lub1Gain.connect(ctx.destination);
    lub1Gain.gain.setValueAtTime(0, ctx.currentTime);
    lub1Gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.02);
    lub1Gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.1);
    lub1.start(ctx.currentTime);
    lub1.stop(ctx.currentTime + 0.12);
    
    // DUB (second beat) - slightly higher, comes right after
    const dub = ctx.createOscillator();
    const dubGain = ctx.createGain();
    dub.type = 'sine';
    dub.frequency.value = 50;
    dub.connect(dubGain);
    dubGain.connect(ctx.destination);
    dubGain.gain.setValueAtTime(0, ctx.currentTime + 0.15);
    dubGain.gain.linearRampToValueAtTime(volume * 0.7, ctx.currentTime + 0.17);
    dubGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.28);
    dub.start(ctx.currentTime + 0.15);
    dub.stop(ctx.currentTime + 0.3);
}

// Stop heartbeat
export function stopHeartbeat() {
    if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
    }
    nextHeartbeatTime = 0;
}

// ============================================
// 3D POSITIONAL GHOST AUDIO - Spooky whispers/drones
// ============================================

let ghostSoundNodes = [];
let ghostSoundUpdateInterval = null;

// Initialize ghost positional audio system
export function initGhostAudio() {
    // Will be updated each frame
}

// Update ghost 3D audio based on positions (call from game loop)
export function updateGhostAudio(ghosts, pacmanPosition) {
    if (!audioContext) return;
    
    const ctx = getAudioContext();
    
    ghosts.forEach((ghost, index) => {
        const ghostPos = ghost.mesh.position;
        const distance = pacmanPosition.distanceTo(ghostPos);
        
        // Calculate direction for panning (-1 = left, 1 = right)
        const dx = ghostPos.x - pacmanPosition.x;
        const dz = ghostPos.z - pacmanPosition.z;
        // Simple stereo panning based on x difference
        const pan = Math.max(-1, Math.min(1, dx / 10));
        
        // Volume based on distance (louder when closer)
        const maxDist = 15;
        const minDist = 1;
        const volume = Math.max(0, Math.min(1, 
            1 - (distance - minDist) / (maxDist - minDist)
        )) * 0.15;
        
        // Create or update ghost sound
        if (!ghostSoundNodes[index] && volume > 0.01) {
            // Create spooky drone for this ghost
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const panner = ctx.createStereoPanner();
            const filter = ctx.createBiquadFilter();
            
            // Each ghost has slightly different frequency for variety
            const baseFreq = 80 + index * 15;
            osc.type = 'sawtooth';
            osc.frequency.value = baseFreq;
            
            // Low-pass filter for muffled, spooky sound
            filter.type = 'lowpass';
            filter.frequency.value = 200 + index * 50;
            filter.Q.value = 5;
            
            osc.connect(filter);
            filter.connect(gain);
            gain.connect(panner);
            panner.connect(ctx.destination);
            
            gain.gain.value = 0;
            panner.pan.value = pan;
            
            osc.start();
            
            ghostSoundNodes[index] = { osc, gain, panner, filter };
        }
        
        // Update existing sound
        if (ghostSoundNodes[index]) {
            const node = ghostSoundNodes[index];
            // Smooth volume transition
            node.gain.gain.setTargetAtTime(volume, ctx.currentTime, 0.1);
            node.panner.pan.setTargetAtTime(pan, ctx.currentTime, 0.1);
            
            // Modulate filter based on distance (more muffled when far)
            const filterFreq = 100 + (1 - distance / maxDist) * 400;
            node.filter.frequency.setTargetAtTime(filterFreq, ctx.currentTime, 0.1);
            
            // Add slight pitch wobble for creepiness
            const wobble = Math.sin(Date.now() * 0.002 + index) * 5;
            node.osc.frequency.setTargetAtTime(80 + index * 15 + wobble, ctx.currentTime, 0.1);
        }
    });
}

// Stop all ghost audio
export function stopGhostAudio() {
    ghostSoundNodes.forEach(node => {
        if (node) {
            try {
                node.osc.stop();
            } catch(e) {}
        }
    });
    ghostSoundNodes = [];
}
