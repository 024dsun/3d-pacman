import * as THREE from 'three';
import { scene, pacman, pacmanSpeed, pacmanLight, keys, cameraMode, camera, cameraYaw, setPacman, setPacmanLight } from './state.js';
import { checkWallCollision } from './collision.js';
import { createPacmanMesh } from './meshes.js';

// let pacmanLigh;

function pacmanGlow(mesh) {
    const light = new THREE.SpotLight(0xffaa00, 2, 25, 0.6, 0.5, 1);
    light.position.set(0, 0.5, 0.2);
    light.target.position.set(0, 0.5, 5); 

    light.castShadow = true;
    light.shadow.mapSize.width = 1024;
    light.shadow.mapSize.height = 1024;
    mesh.add(light);
    mesh.add(light.target);
    return light;
}

export function createPacman() {
    const pacmanMesh = createPacmanMesh(0.5);
    pacmanMesh.position.set(0,0.5, 0);
    
    const light = pacmanGlow(pacmanMesh);

    // pacmanLight = light;
    
    scene.add(pacmanMesh);
    
    setPacman(pacmanMesh);
    setPacmanLight(light);
    
    return pacmanMesh;
}


export function updatePacman(delta) {
    let velocity = new THREE.Vector3(0, 0, 0);

    // lock first person mode 
    if (cameraMode !== 3) {
        if (keys['w'] || keys['arrowup']) {
            velocity.z -= 1;
        }
        if (keys['s'] || keys['arrowdown']) {
            velocity.z += 1;
        }
        if (keys['a'] || keys['arrowleft']) {
            velocity.x -= 1;
        }
        if (keys['d'] || keys['arrowright']) {
            velocity.x += 1;
        }
    } 
    else {
        const forward = new THREE.Vector3();
        camera.getWorldDirection(forward);
        forward.y = 0;
        forward.normalize();
        const right = new THREE.Vector3().crossVectors(camera.up, forward).normalize();
        if (keys['w'] || keys['arrowup']) {
            velocity.add(forward);
        }
        if (keys['s'] || keys['arrowdown']) {
            velocity.sub(forward);
        }
        if (keys['a'] || keys['arrowleft']) {
            velocity.add(right);
        }
        if (keys['d'] || keys['arrowright']) {
            velocity.sub(right);
        }
    }
    
    if (velocity.length() > 0) {
        velocity.normalize().multiplyScalar(pacmanSpeed * delta);
        const newPos = pacman.position.clone().add(velocity);
        if (!checkWallCollision(newPos)) {
            pacman.position.copy(newPos);
        }
        if (cameraMode !== 3) {
            const angle = Math.atan2(velocity.z, velocity.x);
            pacman.rotation.y = -angle;
        }
    }
    
    // camera follows pacman pov
    if (cameraMode === 3) {
        pacman.rotation.y = cameraYaw + Math.PI / 2;
    }
    
}
