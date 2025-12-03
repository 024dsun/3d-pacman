import * as THREE from 'three';
import { 
    scene, pacman, pacmanSpeed, pacmanLight, keys, cameraMode, camera, cameraYaw,
    setPacman, setPacmanLight
} from './state.js';
import { checkWallCollision } from './collision.js';
import { createPacmanMesh } from './meshes.js';

// Create Pacman
export function createPacman() {
    const pacmanMesh = createPacmanMesh(0.5);
    pacmanMesh.position.set(0,0.5, 0);
    
    // SpotLight attached to pacman (flashlight effect)
    // Intensity 2, Distance 25, Angle 0.6 (~35 deg), Penumbra 0.5 (soft edges)
    const light = new THREE.SpotLight(0xffaa00, 2, 25, 0.6, 0.5, 1);
    light.position.set(0, 0.5, 0.2); // Slightly in front
    light.target.position.set(0, 0.5, 5); // Point forward
    light.castShadow = true;
    light.shadow.mapSize.width = 1024;
    light.shadow.mapSize.height = 1024;
    
    // Add light and its target to Pacman mesh so it rotates with him
    pacmanMesh.add(light);
    pacmanMesh.add(light.target);
    
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
    
    // Light follows Pac-Man automatically since it's a child
}
