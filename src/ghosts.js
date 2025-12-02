import * as THREE from 'three';
import { 
    scene, pacman, ghosts, currentLevel, powerUpActive,
    addGhost, clearGhosts
} from './state.js';
import { checkWallCollision } from './collision.js';

// Create ghosts
export function createGhosts() {
    const colors = [0xff0000, 0x00ffff, 0xff69b4, 0xffa500];
    
    // Different spawn positions for each level
    let positions;
    if (currentLevel === 1) {
        positions = [
            [-12, 0.5, -8],
            [12, 0.5, -8],
            [-8, 0.5, 12],
            [8, 0.5, 12]
        ];
    } else if (currentLevel === 2) {
        positions = [
            [-11, 0.5, -11],
            [11, 0.5, -11],
            [-11, 0.5, 11],
            [11, 0.5, 11]
        ];
    } else {
        // Level 3
        positions = [
            [-11, 0.5, -12],
            [11, 0.5, -12],
            [-11, 0.5, 12],
            [11, 0.5, 12]
        ];
    }
    
    // Create ghosts
    colors.forEach((color, i) => {
        const geometry = new THREE.SphereGeometry(0.5, 32, 32);
        const material = new THREE.MeshStandardMaterial({ 
            color: color,
            emissive: color,
            emissiveIntensity: 0.3
        });
        const ghostMesh = new THREE.Mesh(geometry, material);
        
        // Validate spawn position
        let spawnPos = positions[i];
        const testPos = new THREE.Vector3(...spawnPos);
        if (checkWallCollision(testPos, 0.5)) {
            // Find alternative safe position
            const alternativePositions = [
                [-11, 0.5, -11], [11, 0.5, -11],
                [-11, 0.5, 11], [11, 0.5, 11],
                [-10, 0.5, -10], [10, 0.5, -10],
                [-10, 0.5, 10], [10, 0.5, 10]
            ];
            
            for (let altPos of alternativePositions) {
                const altTest = new THREE.Vector3(...altPos);
                if (!checkWallCollision(altTest, 0.5)) {
                    spawnPos = altPos;
                    break;
                }
            }
        }
        
        ghostMesh.position.set(...spawnPos);
        ghostMesh.castShadow = true;
        
        // Add to scene
        scene.add(ghostMesh);
        addGhost({
            mesh: ghostMesh,
            velocity: new THREE.Vector3(),
            speed: 2,
            startPosition: spawnPos.slice(),
            color: color,
            respawnTime: 0,
            immuneToPowerUp: false,
            stuckTimer: 0,
            lastPosition: new THREE.Vector3(...spawnPos),
            lastPacmanPos: null,
            preferredDirection: null,
            pathCheckTimer: 0
        });
    });
}

// Clear all ghosts
export function clearAllGhosts() {
    ghosts.forEach(g => scene.remove(g.mesh));
    clearGhosts();
}

// Find best direction for ghost - picks direction that gets closest to target
export function findBestDirection(ghostPos, targetPos, isChasing) {
    const dirs = [
        new THREE.Vector3(1, 0, 0),
        new THREE.Vector3(-1, 0, 0),
        new THREE.Vector3(0, 0, 1),
        new THREE.Vector3(0, 0, -1)
    ];
    
    // Shuffle directions to add randomness when scores are equal
    for (let i = dirs.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [dirs[i], dirs[j]] = [dirs[j], dirs[i]];
    }
    
    let bestDir = null;
    let bestScore = isChasing ? Infinity : -Infinity;
    
    // Calculate direction to target for prioritizing aligned movement
    const toTarget = new THREE.Vector3().subVectors(targetPos, ghostPos);
    const primaryAxis = Math.abs(toTarget.x) > Math.abs(toTarget.z) ? 'x' : 'z';
    
    for (let dir of dirs) {
        const testPos = ghostPos.clone().add(dir.clone().multiplyScalar(0.5));
        if (!checkWallCollision(testPos, 0.4)) {
            const dist = testPos.distanceTo(targetPos);
            
            // Add small bonus for moving along the primary axis toward target
            let score = dist;
            if (primaryAxis === 'x' && dir.x !== 0 && Math.sign(dir.x) === Math.sign(toTarget.x)) {
                score -= 0.1; // Small bonus
            } else if (primaryAxis === 'z' && dir.z !== 0 && Math.sign(dir.z) === Math.sign(toTarget.z)) {
                score -= 0.1;
            }
            
            if (isChasing) {
                // Chasing: prefer closer distance (lower score)
                if (score < bestScore) {
                    bestScore = score;
                    bestDir = dir.clone();
                }
            } else {
                // Fleeing: prefer farther distance (higher score)
                if (dist > bestScore) {
                    bestScore = dist;
                    bestDir = dir.clone();
                }
            }
        }
    }
    
    return bestDir;
}

// Ghost update - simple greedy approach
export function updateGhosts(delta) {
    ghosts.forEach((ghost, index) => {
        // Update respawn timer
        if (ghost.respawnTime) {
            ghost.respawnTime -= delta;
            if (ghost.respawnTime < 0) ghost.respawnTime = 0;
        }
        
        // Visibility based on distance (horror effect)
        const distToPacman = ghost.mesh.position.distanceTo(pacman.position);
        const visibilityRange = 10;
        if (distToPacman > visibilityRange) {
            ghost.mesh.visible = false;
        } else {
            ghost.mesh.visible = true;
            const opacity = 1 - (distToPacman / visibilityRange) * 0.5;
            ghost.mesh.material.opacity = opacity;
            ghost.mesh.material.transparent = true;
        }
        
        // Update color based on state
        if (ghost.respawnTime && ghost.respawnTime > 0) {
            const flash = Math.sin(Date.now() * 0.02) > 0;
            ghost.mesh.material.color.setHex(flash ? 0xffffff : ghost.color);
            ghost.mesh.material.emissive.setHex(flash ? 0xffffff : ghost.color);
        } else if (powerUpActive && !ghost.immuneToPowerUp) {
            ghost.mesh.material.color.setHex(0x0000ff);
            ghost.mesh.material.emissive.setHex(0x0000ff);
        } else {
            ghost.mesh.material.color.setHex(ghost.color);
            ghost.mesh.material.emissive.setHex(ghost.color);
        }
        
        // Determine if chasing or fleeing
        const isVulnerable = powerUpActive && !ghost.immuneToPowerUp;
        const isChasing = !isVulnerable || ghost.respawnTime > 0;
        
        // Find best direction
        const bestDir = findBestDirection(ghost.mesh.position, pacman.position, isChasing);
        
        let moved = false;
        if (bestDir) {
            const movement = bestDir.multiplyScalar(ghost.speed * delta);
            const newPos = ghost.mesh.position.clone().add(movement);
            
            // Keep within bounds
            newPos.x = Math.max(-13, Math.min(13, newPos.x));
            newPos.z = Math.max(-13, Math.min(13, newPos.z));
            
            if (!checkWallCollision(newPos, 0.4)) {
                ghost.mesh.position.copy(newPos);
                moved = true;
            }
        }
        
        // If no best direction found, try any valid direction
        if (!moved) {
            const dirs = [
                new THREE.Vector3(1, 0, 0),
                new THREE.Vector3(-1, 0, 0),
                new THREE.Vector3(0, 0, 1),
                new THREE.Vector3(0, 0, -1)
            ].sort(() => Math.random() - 0.5);
            
            for (let dir of dirs) {
                const testPos = ghost.mesh.position.clone().add(dir.clone().multiplyScalar(ghost.speed * delta));
                if (!checkWallCollision(testPos, 0.4)) {
                    ghost.mesh.position.copy(testPos);
                    moved = true;
                    break;
                }
            }
        }
        
        // Bob animation
        ghost.mesh.position.y = 0.5 + Math.sin(Date.now() * 0.003 + index) * 0.1;
    });
}
