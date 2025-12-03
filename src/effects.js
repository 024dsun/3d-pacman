import * as THREE from 'three';
import { scene, camera } from './state.js';

// Particle systems
const particles = [];

// Screen shake state
let shakeIntensity = 0;
let shakeDuration = 0;
const originalCameraPos = new THREE.Vector3();

// Create particle burst at position
export function createParticleBurst(position, color, count = 15, speed = 5) {
    const geometry = new THREE.SphereGeometry(0.08, 4, 4);
    const material = new THREE.MeshBasicMaterial({ 
        color: color,
        transparent: true,
        opacity: 1
    });
    
    for (let i = 0; i < count; i++) {
        const particle = new THREE.Mesh(geometry, material.clone());
        particle.position.copy(position);
        
        // Random velocity in all directions
        const velocity = new THREE.Vector3(
            (Math.random() - 0.5) * speed,
            Math.random() * speed * 0.5 + 1,
            (Math.random() - 0.5) * speed
        );
        
        scene.add(particle);
        particles.push({
            mesh: particle,
            velocity: velocity,
            life: 1.0,
            decay: 1.5 + Math.random() * 0.5
        });
    }
}

// Pellet collection sparkle (small, quick)
export function createPelletSparkle(position) {
    createParticleBurst(position, 0xffff00, 5, 2);
}

// Power-up collection burst (bigger, more dramatic)
export function createPowerUpBurst(position) {
    createParticleBurst(position, 0xff00ff, 25, 6);
    // Add secondary ring of particles
    setTimeout(() => createParticleBurst(position, 0xff88ff, 15, 4), 50);
}

// Ghost eaten explosion
export function createGhostExplosion(position, ghostColor) {
    createParticleBurst(position, ghostColor, 30, 8);
    createParticleBurst(position, 0xffffff, 10, 4);
}

// Death effect (red particles falling)
export function createDeathEffect(position) {
    const geometry = new THREE.SphereGeometry(0.1, 4, 4);
    
    for (let i = 0; i < 40; i++) {
        const material = new THREE.MeshBasicMaterial({ 
            color: i % 2 === 0 ? 0xff0000 : 0xffff00,
            transparent: true,
            opacity: 1
        });
        const particle = new THREE.Mesh(geometry, material);
        particle.position.copy(position);
        particle.position.y += Math.random() * 0.5;
        
        const angle = (i / 40) * Math.PI * 2;
        const speed = 3 + Math.random() * 2;
        const velocity = new THREE.Vector3(
            Math.cos(angle) * speed,
            Math.random() * 2 + 1,
            Math.sin(angle) * speed
        );
        
        scene.add(particle);
        particles.push({
            mesh: particle,
            velocity: velocity,
            life: 1.0,
            decay: 0.8
        });
    }
}

// Update all particles
export function updateParticles(delta) {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        
        // Apply velocity and gravity
        p.velocity.y -= 10 * delta; // Gravity
        p.mesh.position.add(p.velocity.clone().multiplyScalar(delta));
        
        // Decay life
        p.life -= p.decay * delta;
        p.mesh.material.opacity = Math.max(0, p.life);
        p.mesh.scale.setScalar(p.life);
        
        // Remove dead particles
        if (p.life <= 0) {
            scene.remove(p.mesh);
            p.mesh.geometry.dispose();
            p.mesh.material.dispose();
            particles.splice(i, 1);
        }
    }
}

// Trigger screen shake
export function screenShake(intensity = 0.3, duration = 0.3) {
    shakeIntensity = intensity;
    shakeDuration = duration;
    originalCameraPos.copy(camera.position);
}

// Update screen shake
export function updateScreenShake(delta) {
    if (shakeDuration > 0) {
        shakeDuration -= delta;
        
        // Apply random offset to camera
        const shakeX = (Math.random() - 0.5) * shakeIntensity * 2;
        const shakeY = (Math.random() - 0.5) * shakeIntensity * 2;
        const shakeZ = (Math.random() - 0.5) * shakeIntensity * 2;
        
        camera.position.x += shakeX;
        camera.position.y += shakeY;
        camera.position.z += shakeZ;
        
        // Decay intensity
        shakeIntensity *= 0.95;
        
        if (shakeDuration <= 0) {
            shakeIntensity = 0;
        }
    }
}

// Combined update for all effects
export function updateEffects(delta) {
    updateParticles(delta);
    updateScreenShake(delta);
}
