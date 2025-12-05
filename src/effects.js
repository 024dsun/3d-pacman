import * as THREE from 'three';
import { scene, camera, ambientLight, directionalLight, pacman, ghosts } from './state.js';


const particles = [];
let shakeIntensity = 0;
let shakeDuration = 0;
const origCam = new THREE.Vector3();
const baseLightIntensity = { 
    ambient: 0.5, 
    directional: 0.6 
};
const minLightIntensity = { 
    ambient: 0.05, 
    directional: 0.05 
};

export function createParticleBurst(position, color, count = 15, speed = 5) {
    const geometry = new THREE.SphereGeometry(0.08, 4, 4);
    const material = new THREE.MeshBasicMaterial({ 
        color,
        transparent: true,
        opacity: 1
    });
    
    for (let i = 0; i < count; i++) {
        const particle = new THREE.Mesh(geometry, material.clone());
        particle.position.copy(position);
        

        const velocity = new THREE.Vector3((Math.random() - 0.5) * speed, Math.random() * speed * 0.5 + 1, (Math.random() - 0.5) * speed);
        
        scene.add(particle);
        particles.push({
            mesh: particle,
            velocity,
            life: 1.0,
            decay: 1.5 + Math.random() * 0.5
        });
    }
}


export function createPelletSparkle(position) {
    createParticleBurst(position, 0xffff00, 5, 2);
}

// big boom
export function createPowerUpBurst(position) {
    createParticleBurst(position, 0xff00ff, 25, 6);

    setTimeout(() => createParticleBurst(position, 0xff88ff, 15, 4), 50);
}


export function createGhostExplosion(position, ghostColor) {
    createParticleBurst(position, ghostColor, 30, 8);
    createParticleBurst(position, 0xffffff, 10, 4);
}


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
        const velocity = new THREE.Vector3(Math.cos(angle) * speed, Math.random() * 2 + 1, Math.sin(angle) * speed);
        scene.add(particle);
        particles.push({
            mesh: particle,
            velocity,
            life: 1.0,
            decay: 0.8
        });
    }
}

export function updateParticles(delta) {
    for (let i = particles.length - 1; i >= 0; i--) {

        particles[i].velocity.y -= 10 * delta;
        particles[i].mesh.position.add(particles[i].velocity.clone().multiplyScalar(delta));
        particles[i].life -= particles[i].decay * delta;

        particles[i].mesh.material.opacity = Math.max(0, particles[i].life);
        particles[i].mesh.scale.setScalar(particles[i].life);

        if (particles[i].life <= 0) {
            scene.remove(particles[i].mesh);
            particles[i].mesh.geometry.dispose();
            particles[i].mesh.material.dispose();
            particles.splice(i, 1);
        }
    }
}

export function screenShake(intensity = 0.3, duration = 0.3) {
    shakeIntensity = intensity;
    shakeDuration = duration;
    origCam.copy(camera.position);
}

export function updateScreenShake(delta) {
    if (shakeDuration > 0) {
        shakeDuration -= delta;
        const s = (Math.random() - 0.5) * shakeIntensity * 2;
        camera.position.x += s;
        camera.position.y += s;
        camera.position.z += s;
        shakeIntensity *= 0.95;
        if (shakeDuration <= 0) {
            shakeIntensity = 0;
        }
    }
}

// dynamic lighting based on distance to ghosts
// credit to claude for the idea and help in implementation
export function updateDynamicLighting() {
    if (!ambientLight || !directionalLight || !pacman || !ghosts) {
        return;
    }
    
    let closestDist = Infinity;
    ghosts.forEach(ghost => {
        const dist = pacman.position.distanceTo(ghost.mesh.position);
        if (dist < closestDist) {
            closestDist = dist;
        }
    });
    
    const maxDist = 8;
    const minDist = 1;
    const d = Math.max(0, Math.min(1, 1 - (closestDist - minDist) / (maxDist - minDist)));
    
    const tarAmb = baseLightIntensity.ambient - d * (baseLightIntensity.ambient - minLightIntensity.ambient);
    const tarDir = baseLightIntensity.directional - d * (baseLightIntensity.directional - minLightIntensity.directional);
    ambientLight.intensity += (tarAmb - ambientLight.intensity) * 0.1;
    directionalLight.intensity += (tarDir - directionalLight.intensity) * 0.1;
    if (d > 0.5) {
        const redShift = (d - 0.5) * 2;
        const r = Math.floor(0x60 + redShift * 0x40);
        const g = Math.floor(0x60 - redShift * 0x30);
        const b = Math.floor(0xa0 - redShift * 0x60);
        ambientLight.color.setRGB(r / 255, g / 255, b / 255);
    } 
    else {
        ambientLight.color.setHex(0x6060a0);
    }
}

export function updateEffects(delta) {
    updateParticles(delta);
    updateScreenShake(delta);
    updateDynamicLighting();
}
