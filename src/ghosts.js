import * as THREE from 'three';
import { 
    scene, pacman, ghosts, currentLevel, powerUpActive,
    addGhost, clearGhosts
} from './state.js';
import { checkWallCollision } from './collision.js';
import { createGhostMesh, updateGhostEyes } from './meshes.js';

// Create ghosts
export function createGhosts() {
    const colors = [0xff0000, 0x00ffff, 0xff69b4, 0xffa500];
    const corners = [
        { x: 12, z: -12 },   // Blinky's corner (top-right)
        { x: -12, z: 12 },   // Inky's corner (bottom-left)
        { x: -12, z: -12 },  // Pinky's corner (top-left)
        { x: 12, z: 12 }     // Clyde's corner (bottom-right)
    ];
    
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
        const ghostMesh = createGhostMesh(0.5, color);
        
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
        // Ghost personalities:
        // 0 = Blinky (red): Direct chaser - always takes shortest path
        // 1 = Inky (cyan): Ambusher - targets position ahead of Pac-Man
        // 2 = Pinky (pink): Flanker - tries to cut off Pac-Man
        // 3 = Clyde (orange): Shy - chases when far, scatters when close
        const personalities = ['blinky', 'inky', 'pinky', 'clyde'];
        
        addGhost({
            mesh: ghostMesh,
            velocity: new THREE.Vector3(),
            speed: 3,
            startPosition: spawnPos.slice(),
            color: color,
            respawnTime: 0,
            immuneToPowerUp: false,
            stuckTimer: 0,
            lastPosition: new THREE.Vector3(...spawnPos),
            lastPacmanPos: null,
            preferredDirection: null,
            pathCheckTimer: 0,
            personality: personalities[i],
            scatterTarget: corners[i] // Each ghost has a home corner
        });
    });
}

// Clear all ghosts
export function clearAllGhosts() {
    ghosts.forEach(g => scene.remove(g.mesh));
    clearGhosts();
}

// Get Pac-Man's facing direction based on movement
let lastPacmanPosition = new THREE.Vector3();
let pacmanDirection = new THREE.Vector3(1, 0, 0);

function updatePacmanDirection() {
    const currentPos = pacman.position.clone();
    const movement = currentPos.clone().sub(lastPacmanPosition);
    if (movement.length() > 0.01) {
        pacmanDirection.copy(movement).normalize();
    }
    lastPacmanPosition.copy(currentPos);
}

// Calculate target based on ghost personality (ALL ghosts always chase Pac-Man)
function getPersonalityTarget(ghost) {
    const pacPos = pacman.position;
    
    // All ghosts target Pac-Man's position, with slight variations
    switch (ghost.personality) {
        case 'blinky':
            // Direct chaser - always targets Pac-Man's exact position
            return { x: pacPos.x, z: pacPos.z };
            
        case 'inky': {
            // Targets slightly ahead of Pac-Man (if Pac-Man is moving)
            const ahead = pacPos.clone().add(pacmanDirection.clone().multiplyScalar(2));
            return { x: ahead.x, z: ahead.z };
        }
            
        case 'pinky': {
            // Targets slightly ahead of Pac-Man
            const ahead = pacPos.clone().add(pacmanDirection.clone().multiplyScalar(3));
            return { x: ahead.x, z: ahead.z };
        }
            
        case 'clyde': {
            // Targets Pac-Man directly (simple chase)
            return { x: pacPos.x, z: pacPos.z };
        }
            
        default:
            return { x: pacPos.x, z: pacPos.z };
    }
}

// Calculate flee target - find the corner farthest from Pac-Man
function getFleeTarget(ghost) {
    const pacPos = pacman.position;
    
    // Pick the corner that is farthest from Pac-Man
    const corners = [
        { x: -11, z: -11 },
        { x: 11, z: -11 },
        { x: -11, z: 11 },
        { x: 11, z: 11 }
    ];
    
    let bestCorner = corners[0];
    let bestDist = 0;
    
    for (const corner of corners) {
        const dist = Math.sqrt(
            Math.pow(corner.x - pacPos.x, 2) + 
            Math.pow(corner.z - pacPos.z, 2)
        );
        if (dist > bestDist) {
            bestDist = dist;
            bestCorner = corner;
        }
    }
    
    return bestCorner;
}

// Grid-based A* pathfinding
const GRID_SIZE = 1; // 1 unit per grid cell

function posToGrid(x, z) {
    return { 
        gx: Math.round(x / GRID_SIZE), 
        gz: Math.round(z / GRID_SIZE) 
    };
}

function gridToPos(gx, gz) {
    return { x: gx * GRID_SIZE, z: gz * GRID_SIZE };
}

function isWalkable(gx, gz) {
    const pos = new THREE.Vector3(gx * GRID_SIZE, 0.5, gz * GRID_SIZE);
    return !checkWallCollision(pos, 0.4);
}

function heuristic(ax, az, bx, bz) {
    return Math.abs(ax - bx) + Math.abs(az - bz); // Manhattan distance
}

// A* pathfinding - returns next position to move toward
function findPath(startX, startZ, endX, endZ, maxIterations = 200) {
    const start = posToGrid(startX, startZ);
    const end = posToGrid(endX, endZ);
    
    // If already at goal or goal not walkable, return null
    if (start.gx === end.gx && start.gz === end.gz) return null;
    
    const openSet = [];
    const closedSet = new Set();
    const cameFrom = new Map();
    const gScore = new Map();
    const fScore = new Map();
    
    const startKey = `${start.gx},${start.gz}`;
    openSet.push({ gx: start.gx, gz: start.gz, f: 0 });
    gScore.set(startKey, 0);
    fScore.set(startKey, heuristic(start.gx, start.gz, end.gx, end.gz));
    
    const directions = [
        { dx: 1, dz: 0 },
        { dx: -1, dz: 0 },
        { dx: 0, dz: 1 },
        { dx: 0, dz: -1 }
    ];
    
    let iterations = 0;
    
    while (openSet.length > 0 && iterations < maxIterations) {
        iterations++;
        
        // Get node with lowest fScore
        openSet.sort((a, b) => a.f - b.f);
        const current = openSet.shift();
        const currentKey = `${current.gx},${current.gz}`;
        
        // Reached goal?
        if (current.gx === end.gx && current.gz === end.gz) {
            // Reconstruct path and return first step
            let node = currentKey;
            let prev = null;
            while (cameFrom.has(node)) {
                prev = node;
                node = cameFrom.get(node);
            }
            if (prev) {
                const [gx, gz] = prev.split(',').map(Number);
                return gridToPos(gx, gz);
            }
            return null;
        }
        
        closedSet.add(currentKey);
        
        // Check neighbors
        for (const dir of directions) {
            const nx = current.gx + dir.dx;
            const nz = current.gz + dir.dz;
            const neighborKey = `${nx},${nz}`;
            
            if (closedSet.has(neighborKey)) continue;
            if (!isWalkable(nx, nz)) continue;
            
            const tentativeG = gScore.get(currentKey) + 1;
            
            if (!gScore.has(neighborKey) || tentativeG < gScore.get(neighborKey)) {
                cameFrom.set(neighborKey, currentKey);
                gScore.set(neighborKey, tentativeG);
                const f = tentativeG + heuristic(nx, nz, end.gx, end.gz);
                fScore.set(neighborKey, f);
                
                if (!openSet.find(n => n.gx === nx && n.gz === nz)) {
                    openSet.push({ gx: nx, gz: nz, f });
                }
            }
        }
    }
    
    // No path found - return null
    return null;
}

// Fallback: find best direction - always moves TOWARD targetPos
function findBestDirectionGreedy(ghostPos, targetPos) {
    const dirs = [
        new THREE.Vector3(1, 0, 0),
        new THREE.Vector3(-1, 0, 0),
        new THREE.Vector3(0, 0, 1),
        new THREE.Vector3(0, 0, -1)
    ];
    
    // Shuffle for randomness when scores are equal
    for (let i = dirs.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [dirs[i], dirs[j]] = [dirs[j], dirs[i]];
    }
    
    let bestDir = null;
    let bestScore = Infinity;
    
    for (let dir of dirs) {
        const testPos = ghostPos.clone().add(dir.clone().multiplyScalar(0.5));
        if (!checkWallCollision(testPos, 0.4)) {
            const dist = testPos.distanceTo(targetPos);
            if (dist < bestScore) {
                bestScore = dist;
                bestDir = dir.clone();
            }
        }
    }
    
    return bestDir;
}

// Ghost update - uses A* pathfinding with personality-based targeting
export function updateGhosts(delta) {
    // Update Pac-Man's direction for personality calculations
    updatePacmanDirection();
    
    ghosts.forEach((ghost, index) => {
        // Update respawn timer
        if (ghost.respawnTime) {
            ghost.respawnTime -= delta;
            if (ghost.respawnTime < 0) ghost.respawnTime = 0;
        }
        
        // Visibility based on distance (horror effect)
        const distToPacman = ghost.mesh.position.distanceTo(pacman.position);
        const visibilityRange = 7;
        if (distToPacman > visibilityRange) {
            ghost.mesh.visible = false;
        } else {
            ghost.mesh.visible = true;
            const opacity = 1 - (distToPacman / visibilityRange) * 0.5;
            
            // Handle opacity for Group mesh (apply to all children materials)
            ghost.mesh.traverse((child) => {
                if (child.isMesh && child.material) {
                    child.material.opacity = opacity;
                    child.material.transparent = true;
                }
            });
        }
        
        // Update color based on state
        const mat = ghost.mesh.userData.bodyMaterial;
        if (mat) {
            if (ghost.respawnTime && ghost.respawnTime > 0) {
                const flash = Math.sin(Date.now() * 0.02) > 0;
                mat.color.setHex(flash ? 0xffffff : ghost.color);
                mat.emissive.setHex(flash ? 0xffffff : ghost.color);
            } else if (powerUpActive && !ghost.immuneToPowerUp) {
                mat.color.setHex(0x0000ff);
                mat.emissive.setHex(0x0000ff);
            } else {
                mat.color.setHex(ghost.color);
                mat.emissive.setHex(ghost.color);
            }
        }
        
        // Determine if chasing or fleeing
        // ALL ghosts flee when power-up is active (even immune ones)
        const isChasing = !powerUpActive;
        
        // Skip movement if respawning
        if (ghost.respawnTime && ghost.respawnTime > 0) {
            ghost.mesh.position.y = 0.5 + Math.sin(Date.now() * 0.003 + index) * 0.1;
            return;
        }
        
        let moved = false;
        const ghostPos = ghost.mesh.position;
        
        // Update path periodically (not every frame for performance)
        ghost.pathCheckTimer = (ghost.pathCheckTimer || 0) + delta;
        
        // Update path more frequently when fleeing (0.1s) vs chasing (0.3s)
        const pathUpdateInterval = isChasing ? 0.3 : 0.1;
        if (ghost.pathCheckTimer > pathUpdateInterval || !ghost.nextTarget) {
            ghost.pathCheckTimer = 0;
            
            if (isChasing) {
                // Use personality-based targeting
                const target = getPersonalityTarget(ghost);
                const nextStep = findPath(ghostPos.x, ghostPos.z, target.x, target.z);
                if (nextStep) {
                    ghost.nextTarget = new THREE.Vector3(nextStep.x, 0.5, nextStep.z);
                } else {
                    ghost.nextTarget = null;
                }
            } else {
                // Fleeing: dynamically run away from Pac-Man
                const fleeTarget = getFleeTarget(ghost);
                const nextStep = findPath(ghostPos.x, ghostPos.z, fleeTarget.x, fleeTarget.z);
                if (nextStep) {
                    ghost.nextTarget = new THREE.Vector3(nextStep.x, 0.5, nextStep.z);
                } else {
                    // If no path, just move directly away
                    ghost.nextTarget = new THREE.Vector3(fleeTarget.x, 0.5, fleeTarget.z);
                }
            }
        }
        
        // Move toward next target
        if (ghost.nextTarget) {
            const dir = new THREE.Vector3()
                .subVectors(ghost.nextTarget, ghostPos)
                .normalize();
            
            const movement = dir.multiplyScalar(ghost.speed * delta);
            const newPos = ghostPos.clone().add(movement);
            newPos.y = 0.5;
            
            // Keep within bounds
            newPos.x = Math.max(-13, Math.min(13, newPos.x));
            newPos.z = Math.max(-13, Math.min(13, newPos.z));
            
            if (!checkWallCollision(newPos, 0.4)) {
                ghost.mesh.position.copy(newPos);
                moved = true;
            }
            
            // Clear target if reached
            const distToTarget = Math.sqrt(
                Math.pow(ghostPos.x - ghost.nextTarget.x, 2) + 
                Math.pow(ghostPos.z - ghost.nextTarget.z, 2)
            );
            if (distToTarget < 0.3) {
                ghost.nextTarget = null;
            }
        }
        
        // Fallback: use greedy if A* failed
        if (!moved) {
            const target = isChasing ? getPersonalityTarget(ghost) : getFleeTarget(ghost);
            const targetPos = new THREE.Vector3(target.x, 0.5, target.z);
            const bestDir = findBestDirectionGreedy(ghostPos, targetPos);
            if (bestDir) {
                const movement = bestDir.multiplyScalar(ghost.speed * delta);
                const newPos = ghostPos.clone().add(movement);
                newPos.y = 0.5;
                
                newPos.x = Math.max(-13, Math.min(13, newPos.x));
                newPos.z = Math.max(-13, Math.min(13, newPos.z));
                
                if (!checkWallCollision(newPos, 0.4)) {
                    ghost.mesh.position.copy(newPos);
                }
            }
        }
        
        // Bob animation
        ghost.mesh.position.y = 0.5 + Math.sin(Date.now() * 0.003 + index) * 0.1;
        
        // Look at Pac-Man (Body rotation)
        // We only want to rotate around Y axis so they don't tilt up/down
        const lookTarget = pacman.position.clone();
        lookTarget.y = ghost.mesh.position.y; 
        ghost.mesh.lookAt(lookTarget);
        
        // Update eyes (Independent tracking for extra creepiness)
        updateGhostEyes(ghost.mesh, pacman.position);
    });
}
