import * as THREE from 'three';
import { 
    scene, pacman, pacmanSpeed, pacmanLight, keys, cameraMode, camera, cameraYaw,
    setPacman, setPacmanLight
} from './state.js';
import { checkWallCollision } from './collision.js';

// Create Pacman
export function createPacman() {
    const geometry = new THREE.SphereGeometry(0.5, 32, 32);
    const material = new THREE.MeshStandardMaterial({ 
        color: 0xffff00,
        emissive: 0xffff00,
        emissiveIntensity: 0.4
    });
    const pacmanMesh = new THREE.Mesh(geometry, material);
    pacmanMesh.position.set(0, 0.5, 0);
    pacmanMesh.castShadow = true;
    
    // Add eye
    const eyeGeometry = new THREE.SphereGeometry(0.08, 8, 8);
    const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
    const eye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    eye.position.set(0, 0.2, 0.4);
    pacmanMesh.add(eye);
    
    // Point light attached to pacman (flashlight effect)
    const light = new THREE.PointLight(0xffff00, 2, 15);
    light.position.set(0, 0.5, 0);
    scene.add(light);
    
    // Add to scene
    scene.add(pacmanMesh);
    
    setPacman(pacmanMesh);
    setPacmanLight(light);
    
    return pacmanMesh;
}

// Update Pacman movement
export function updatePacman(delta) {
    let velocity = new THREE.Vector3(0, 0, 0);

    if (cameraMode !== 3) {
        // Check valid keys for movement
        if (keys['w'] || keys['arrowup']) velocity.z -= 1;
        if (keys['s'] || keys['arrowdown']) velocity.z += 1;
        if (keys['a'] || keys['arrowleft']) velocity.x -= 1;
        if (keys['d'] || keys['arrowright']) velocity.x += 1;
    } else {
        // First person mode movement
        const forward = new THREE.Vector3();
        camera.getWorldDirection(forward);
        forward.y = 0;
        forward.normalize();
        const right = new THREE.Vector3().crossVectors(camera.up, forward).normalize();
        if (keys['w'] || keys['arrowup']) velocity.add(forward);
        if (keys['s'] || keys['arrowdown']) velocity.sub(forward);
        if (keys['a'] || keys['arrowleft']) velocity.add(right);
        if (keys['d'] || keys['arrowright']) velocity.sub(right);
    }
    
    // Update pacman position
    if (velocity.length() > 0) {
        velocity.normalize().multiplyScalar(pacmanSpeed * delta);
        const newPos = pacman.position.clone().add(velocity);
        if (!checkWallCollision(newPos)) {
            pacman.position.copy(newPos);
        }
        // Rotate to face movement direction (only in non-first-person modes)
        if (cameraMode !== 3) {
            const angle = Math.atan2(velocity.z, velocity.x);
            pacman.rotation.y = -angle;
        }
    }
    
    // In first person mode, pacman faces where the mouse is looking
    if (cameraMode === 3) {
        pacman.rotation.y = cameraYaw + Math.PI / 2;
    }
    
    // Update light position to follow pacman
    pacmanLight.position.set(pacman.position.x, pacman.position.y + 1, pacman.position.z);
}
