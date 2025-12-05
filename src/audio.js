let audioContext = null;

let bgMusicNodes = null;
let mg = null;

let heartbeatInterval = null;

let ghostNodes = new Map();

let nextHeartbeatTime = 0;

let ghostSoundNodes = [];

let ghostSoundUpdateInterval = null;

function getAudioContext() {
    if (!audioContext) audioContext = new window.AudioContext();
    return audioContext;
}

function drone(freq, gain) {
    const context = getAudioContext();
    const osc = context.createOscillator();
    const gainNode = context.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gainNode.gain.value = gain;
    osc.connect(gainNode);
    gainNode.connect(mg);
    osc.start();
    bgMusicNodes.push(osc);
}

// Creepy ambient background music
export function startBackgroundMusic() {
    if (bgMusicNodes) return;
    const context = getAudioContext();
    bgMusicNodes = [];
    mg = context.createGain();
    mg.gain.value = 0.15;
    mg.connect(context.destination);
    drone(55, 0.4);
    drone(55.5, 0.3);
    

    const highTone = context.createOscillator();
    const highGain = context.createGain();
    const highLFO = context.createOscillator();
    const lfoGain = context.createGain();
    highTone.type = 'sine';
    highTone.frequency.value = 880;
    highGain.gain.value = 0.05;
    highLFO.type = 'sine';
    highLFO.frequency.value = 0.1;
    lfoGain.gain.value = 50;
    highLFO.connect(lfoGain);
    lfoGain.connect(highTone.frequency);
    highTone.connect(highGain);
    highGain.connect(mg);
    highTone.start();
    highLFO.start();
    bgMusicNodes.push(highTone, highLFO);
    
    const pulseInterval = setInterval(() => {
        if (!bgMusicNodes) {
            clearInterval(pulseInterval);
            return;
        }
        const ctx = getAudioContext();
        const pulse = ctx.createOscillator();
        const pg = ctx.createGain();
        // const lfo = ctx.createOscillator();
        // const lfoGain = ctx.createGain();
        pulse.type = 'sine';
        pulse.frequency.value = 40;
        pg.gain.setValueAtTime(0.2, ctx.currentTime);
        pg.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

        pulse.connect(pg);
        pg.connect(mg);
        pulse.start();
        pulse.stop(ctx.currentTime + 0.3);
    }, 2000 + Math.random() * 2000);
    bgMusicNodes.pulseInterval = pulseInterval;
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

// pellet sound
export function playPelletSound() {
    const context = getAudioContext();
    const osc = context.createOscillator();
    const gain = context.createGain();
    osc.connect(gain);
    gain.connect(context.destination);
    osc.frequency.value = 880;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.1, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.1);
    osc.start(context.currentTime);
    osc.stop(context.currentTime + 0.1);
}

// power up sound
export function playPowerUpSound() {
    const context = getAudioContext();
    const frequencies = [440, 554, 659, 880];
    frequencies.forEach((freq, index) => {
        const osc = context.createOscillator();
        const gain = context.createGain();
        osc.connect(gain);
        gain.connect(context.destination);
        osc.frequency.value = freq;
        osc.type = 'square';
        gain.gain.setValueAtTime(0.1, context.currentTime + index * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.01, context.currentTime + index * 0.08 + 0.08);
        osc.start(context.currentTime + index * 0.08);
        osc.stop(context.currentTime + index * 0.08 + 0.1);
    });
}

// ghost eaten sound
export function playGhostEatenSound() {
    const context = getAudioContext();
    const osc = context.createOscillator();
    const gain = context.createGain();
    osc.connect(gain);
    gain.connect(context.destination);
    osc.frequency.setValueAtTime(800, context.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, context.currentTime + 0.3);
    osc.type = 'sawtooth';
    gain.gain.setValueAtTime(0.15, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.3);
    osc.start(context.currentTime);
    osc.stop(context.currentTime + 0.3);
}

// death sound
export function playDeathSound() {
    const context = getAudioContext();
    const osc = context.createOscillator();
    const gain = context.createGain();
    osc.connect(gain);
    gain.connect(context.destination);
    osc.frequency.setValueAtTime(400, context.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, context.currentTime + 0.5);
    osc.type = 'sawtooth';
    gain.gain.setValueAtTime(0.2, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.5);
    osc.start(context.currentTime);
    osc.stop(context.currentTime + 0.5);
}

// jumpscare sound
export function playJumpscareSound() {
    const context = getAudioContext();
    const freqs = [800, 1200, 2000, 5000, 100];
    const types = ['sawtooth', 'square', 'sawtooth', 'sawtooth', 'square'];
    freqs.forEach((f, index) => {
        const osc = context.createOscillator();
        const gain = context.createGain();
        osc.type = types[index];
        osc.frequency.value = f;
        osc.frequency.exponentialRampToValueAtTime(f * 0.5, context.currentTime + 0.3);
        gain.gain.setValueAtTime(0.3, context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 1.5);
        osc.connect(gain);
        gain.connect(context.destination);
        osc.start(context.currentTime);
        osc.stop(context.currentTime + 1.5);
    });
    const bufferSize = context.sampleRate * 1.0;
    const buffer = context.createBuffer(1, bufferSize, context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    const noise = context.createBufferSource();
    noise.buffer = buffer;
    const noiseGain = context.createGain();
    noiseGain.gain.setValueAtTime(0.8, context.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 1.0);
    noise.connect(noiseGain);
    noiseGain.connect(context.destination);
    noise.start(context.currentTime);
}

// teleport sound
export function playTeleportSound() {
    const context = getAudioContext();
    const osc = context.createOscillator();
    const gain = context.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, context.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, context.currentTime + 0.1);
    osc.frequency.exponentialRampToValueAtTime(100, context.currentTime + 0.3);
    gain.gain.setValueAtTime(0.3, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(context.destination);
    osc.start(context.currentTime);
    osc.stop(context.currentTime + 0.3);
    const osc2 = context.createOscillator();
    const gain2 = context.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(400, context.currentTime);
    osc2.frequency.exponentialRampToValueAtTime(1200, context.currentTime + 0.15);
    osc2.frequency.exponentialRampToValueAtTime(300, context.currentTime + 0.3);
    gain2.gain.setValueAtTime(0.15, context.currentTime);
    gain2.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.3);
    osc2.connect(gain2);
    gain2.connect(context.destination);
    osc2.start(context.currentTime);
    osc2.stop(context.currentTime + 0.3);
}

// victory sound
export function playLevelCompleteSound() {
    const context = getAudioContext();
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, index) => {
        const osc = context.createOscillator();
        const gain = context.createGain();
        osc.connect(gain);
        gain.connect(context.destination);
        osc.frequency.value = freq;
        osc.type = 'triangle';
        gain.gain.setValueAtTime(0.15, context.currentTime + index * 0.15);
        gain.gain.exponentialRampToValueAtTime(0.01, context.currentTime + index * 0.15 + 0.2);
        osc.start(context.currentTime + index * 0.15);
        osc.stop(context.currentTime + index * 0.15 + 0.25);
    });
}

// Game start sound
export function playStartSound() {
    const ctx = getAudioContext();
    const notes = [262, 330, 392, 523];
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

export function startHeartbeat() {
    if (heartbeatInterval) return;
    heartbeatInterval = setInterval(() => {}, 50);
}

export function updateHeartbeat(closestGhostDistance) {
    if (!audioContext) return;
    const ctx = getAudioContext();
    const now = Date.now();
    const maxDistance = 12;
    const minDistance = 2;
    const intensity = Math.max(0, Math.min(1, 
        1 - (closestGhostDistance - minDistance) / (maxDistance - minDistance)
    ));
    if (intensity <= 0) return;
    const bpm = 60 + intensity * 120;
    const beatInterval = 60000 / bpm;
    if (now >= nextHeartbeatTime) {
        nextHeartbeatTime = now + beatInterval;
        playHeartbeat(intensity);
    }
}

function playHeartbeat(intensity) {
    const ctx = getAudioContext();
    const volume = 0.15 + intensity * 0.5;
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

export function initGhostAudio() {}

export function updateGhostAudio(ghosts, pacmanPosition) {
    if (!audioContext) return;
    const ctx = getAudioContext();
    ghosts.forEach((ghost, index) => {
        const ghostPos = ghost.mesh.position;
        const distance = pacmanPosition.distanceTo(ghostPos);
        const dx = ghostPos.x - pacmanPosition.x;
        const dz = ghostPos.z - pacmanPosition.z;
        const pan = Math.max(-1, Math.min(1, dx / 10));
        const maxDist = 15;
        const minDist = 1;
        const volume = Math.max(0, Math.min(1, 1 - (distance - minDist) / (maxDist - minDist))) * 0.15;
        if (!ghostSoundNodes[index] && volume > 0.01) {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const panner = ctx.createStereoPanner();
            const filter = ctx.createBiquadFilter();
            const baseFreq = 80 + index * 15;
            osc.type = 'sawtooth';
            osc.frequency.value = baseFreq;
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
        if (ghostSoundNodes[index]) {
            const node = ghostSoundNodes[index];
            node.gain.gain.setTargetAtTime(volume, ctx.currentTime, 0.1);
            node.panner.pan.setTargetAtTime(pan, ctx.currentTime, 0.1);
            const filterFreq = 100 + (1 - distance / maxDist) * 400;
            node.filter.frequency.setTargetAtTime(filterFreq, ctx.currentTime, 0.1);
            const wobble = Math.sin(Date.now() * 0.002 + index) * 5;
            node.osc.frequency.setTargetAtTime(80 + index * 15 + wobble, ctx.currentTime, 0.1);
        }
    });
}


export function stopGhostAudio() {
    ghostSoundNodes.forEach(node => {
        if (node) {
            node.osc.stop();
        }
    });
    ghostSoundNodes = [];
}

// audio is attributed to claude