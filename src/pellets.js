import * as THREE from 'three';
import { 
    scene, pacman, pellets, powerUps, score, powerUpActive, powerUpTimer, ghostMultiplier, ghosts,
    setScore, setPowerUpActive, setPowerUpTimer, setGhostMultiplier,
    addPellet, addPowerUp, removePellet, removePowerUp, clearPellets, clearPowerUps
} from './state.js';
import { checkWallCollisionSimple } from './collision.js';
import { updateHUD } from './ui.js';
import { playPelletSound, playPowerUpSound } from './audio.js';
import { createPelletSparkle, createPowerUpBurst, screenShake } from './effects.js';

// Create pellets and power ups
export function createPellets() {
    const pelletGeometry = new THREE.SphereGeometry(0.15, 8, 8);
    const pelletMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xffff00,
        emissive: 0xffff00,
        emissiveIntensity: 0.6
    });
    
    // Create power up geometry
    const powerUpGeometry = new THREE.SphereGeometry(0.3, 16, 16);
    const powerUpMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xff00ff,
        emissive: 0xff00ff,
        emissiveIntensity: 0.8
    });
    
    // Place pellets
    for (let x = -12; x <= 12; x += 2) {
        for (let z = -12; z <= 12; z += 2) {
            if (Math.abs(x) < 2 && Math.abs(z) < 2) continue;
            const pos = new THREE.Vector3(x, 0.5, z);
            if (!checkWallCollisionSimple(pos)) {
                const pellet = new THREE.Mesh(pelletGeometry, pelletMaterial);
                pellet.position.copy(pos);
                scene.add(pellet);
                addPellet(pellet);
            }
        }
    }
    
    // Add power ups in corners
    const powerUpPositions = [
        [-12, 0.5, -12],
        [12, 0.5, -12],
        [-12, 0.5, 12],
        [12, 0.5, 12]
    ];
    
    powerUpPositions.forEach(pos => {
        const testPos = new THREE.Vector3(...pos);
        if (!checkWallCollisionSimple(testPos)) {
            const powerUp = new THREE.Mesh(powerUpGeometry, powerUpMaterial);
            powerUp.position.set(...pos);
            scene.add(powerUp);
            addPowerUp(powerUp);
        }
    });
}

// Clear all pellets and power ups
export function clearAllPellets() {
    pellets.forEach(p => scene.remove(p));
    powerUps.forEach(p => scene.remove(p));
    clearPellets();
    clearPowerUps();
}

// Collect pellets
export function checkPelletCollection() {
    for (let i = pellets.length - 1; i >= 0; i--) {
        const pellet = pellets[i];
        const dist = pacman.position.distanceTo(pellet.position);
        if (dist < 0.6) {
            scene.remove(pellet);
            removePellet(i);
            setScore(score + 10);
            playPelletSound();
            createPelletSparkle(pellet.position.clone());
            updateHUD();
        }
    }
}

// Collect powerups
export function checkPowerUpCollection() {
    for (let i = powerUps.length - 1; i >= 0; i--) {
        const powerUp = powerUps[i];
        const dist = pacman.position.distanceTo(powerUp.position);
        if (dist < 0.8) {
            scene.remove(powerUp);
            removePowerUp(i);
            setScore(score + 50);
            setPowerUpActive(true);
            setPowerUpTimer(10);
            setGhostMultiplier(1); // Reset multiplier for new power-up
            playPowerUpSound();
            createPowerUpBurst(powerUp.position.clone());
            screenShake(0.2, 0.2);
            // Reset ghost immunity
            ghosts.forEach(ghost => {
                ghost.immuneToPowerUp = false;
            });
            updateHUD();
        }
    }
}

// Pellet glow effect
export function animatePellets() {
    const time = Date.now() * 0.003;
    pellets.forEach(pellet => {
        pellet.scale.setScalar(1 + Math.sin(time * 2) * 0.2);
    });
}

// Power up glow effect
export function animatePowerUps(delta) {
    const time = Date.now() * 0.003;
    powerUps.forEach((powerUp, index) => {
        powerUp.scale.setScalar(1 + Math.sin(time * 1.5 + index) * 0.3);
        powerUp.rotation.y += delta * 2;
    });
}
