import * as THREE from 'three';
import { scene, pacman, ghosts, currentLevel, powerUpActive, addGhost, clearGhosts } from './state.js';
import { checkWallCollision } from './collision.js';
import { createGhostMesh, updateGhostEyes } from './meshes.js';

let lastPacmanPosition = new THREE.Vector3();
let pacmanDirection = new THREE.Vector3(1, 0, 0);

export function createGhosts() {
    const colors = [0xff0000, 0x00ffff, 0xff69b4, 0xffa500];
    // ghosts start at corners
    const corners = [
        { x: 12, z: -12 },
        { x: -12, z: 12 },
        { x: -12, z: -12 },
        { x: 12, z: 12 }
    ];
    

    let positions;
    if (currentLevel === 1) {
        positions = [
            [-12, 0.5, -8],
            [12, 0.5, -8],
            [-8, 0.5, 12],
            [8, 0.5, 12]
        ];
    } 
    else if (currentLevel === 2) {
        positions = [
            [-11, 0.5, -11],
            [11, 0.5, -11],
            [-11, 0.5, 11],
            [11, 0.5, 11]
        ];
    } 
    else {

        positions = [
            [-11, 0.5, -12],
            [11, 0.5, -12],
            [-11, 0.5, 12],
            [11, 0.5, 12],
            [-8, 0.5, 0],
            [8, 0.5, 0],
            [0, 0.5, -8],
            [0, 0.5, 8]
        ];
    }
    

    positions.forEach((spawnPos, i) => {
        i = i % colors.length
        let color = colors[i];
        const ghostMesh = createGhostMesh(0.5, color);
        const testPos = new THREE.Vector3(...spawnPos);
        // test that position doesn't hit walls
        if (checkWallCollision(testPos, 0.5)) {
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
        scene.add(ghostMesh);

        // advanced feature: personalities for ghosts so chasing is different
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
            scatterTarget: corners[i]
        });
    });
}


export function clearAllGhosts() {
    ghosts.forEach(g => scene.remove(g.mesh));
    clearGhosts();
}




function updatePacmanDirection() {
    const currentPos = pacman.position.clone();
    const movement = currentPos.clone().sub(lastPacmanPosition);
    if (movement.length() > 0.01) {
        pacmanDirection.copy(movement).normalize();
    }
    lastPacmanPosition.copy(currentPos);
}

// personality per ghost
function getPersonalityTarget(ghost) {
    const pacPos = pacman.position;
    

    switch (ghost.personality) {
        // predict movement
        case 'inky': {
            const ahead = pacPos.clone().add(pacmanDirection.clone().multiplyScalar(2));
            return { 
                x: ahead.x, 
                z: ahead.z 
            };
        }
            
        // cut off
        case 'pinky': {
            const ahead = pacPos.clone().add(pacmanDirection.clone().multiplyScalar(3));
            return { 
                x: ahead.x, 
                z: ahead.z 
            };
        }
        default:
            return {x: pacPos.x, z: pacPos.z};
    }
}

// run away to corner
function getFleeTarget(ghost) {
    const pacPos = pacman.position;
    

    const corners = [
        { x: -11, z: -11 },
        { x: 11, z: -11 },
        { x: -11, z: 11 },
        { x: 11, z: 11 }
    ];
    
    let farthestCorner = corners[0];
    let farthestDist = 0;
    
    for (const corner of corners) {
        const dist = Math.sqrt(
            Math.pow(corner.x - pacPos.x, 2) + 
            Math.pow(corner.z - pacPos.z, 2)
        );
        if (dist > farthestDist) {
            farthestDist = dist;
            farthestCorner = corner;
        }
    }
    
    return farthestCorner;
}


function posToGrid(x, z) {
    return { 
        gx: Math.round(x), 
        gz: Math.round(z) 
    };
}

function gridToPos(gx, gz) {
    return { x: gx, z: gz };
}

function isWalkable(gx, gz) {
    const pos = new THREE.Vector3(gx, 0.5, gz);
    return !checkWallCollision(pos, 0.4);
}

function manhatten(ax, az, bx, bz) {
    return Math.abs(ax - bx) + Math.abs(az - bz);
}

// use A* to go towards pacman or run
// claude helped with the A* algorithm and some syntax
// david implemented with competitive programming setup 
function findPath(startX, startZ, endX, endZ) {
    const start = posToGrid(startX, startZ);
    const end = posToGrid(endX, endZ);
    

    if (start.gx === end.gx && start.gz === end.gz) {
        return null;
    }
    const open = [];
    const closed = new Set();
    const cameFrom = new Map();
    const gs = new Map();
    const fs = new Map();

    const startKey = `${start.gx},${start.gz}`;

    open.push({ gx: start.gx, gz: start.gz, f: 0 });
    gs.set(startKey, 0);
    fs.set(startKey, manhatten(start.gx, start.gz, end.gx, end.gz));
    // competitive programming setup heh
    const directions = [
        { dx: 1, dz: 0 },
        { dx: -1, dz: 0 },
        { dx: 0, dz: 1 },
        { dx: 0, dz: -1 }
    ];

    
    for (let i = 0; i < 200 && open.length > 0; i++) {

        open.sort((a, b) => a.f - b.f);
        const current = open.shift();
        const currentKey = `${current.gx},${current.gz}`;
        if (current.gx === end.gx && current.gz === end.gz) {
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
        
        closed.add(currentKey);
        
        for (let j = 0; j < directions.length; j++) {
            const nx = current.gx + directions[j].dx;
            const nz = current.gz + directions[j].dz;
            const neighborKey = `${nx},${nz}`;
            
            if (closed.has(neighborKey)) {
                continue;
            }
            if (!isWalkable(nx, nz)) {
                continue;
            }
            const tg = gs.get(currentKey) + 1;
            
            if (!gs.has(neighborKey) || tg < gs.get(neighborKey)) {
                cameFrom.set(neighborKey, currentKey);
                gs.set(neighborKey, tg);
                const f = tg + manhatten(nx, nz, end.gx, end.gz);
                fs.set(neighborKey, f);
                
                if (!open.find(n => n.gx === nx && n.gz === nz)) {
                    open.push({ gx: nx, gz: nz, f });
                }
            }
        }
    }
    
    return null;
}

function findBestDirectionGreedy(ghostPos, targetPos) {
    const dirs = [
        new THREE.Vector3(1, 0, 0),
        new THREE.Vector3(-1, 0, 0),
        new THREE.Vector3(0, 0, 1),
        new THREE.Vector3(0, 0, -1)
    ];
    
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

// ghost update
export function updateGhosts(delta) {
    updatePacmanDirection();
    
    ghosts.forEach((ghost, index) => {
        if (ghost.respawnTime) {
            ghost.respawnTime -= delta;
            if (ghost.respawnTime < 0) ghost.respawnTime = 0;
        }
        
        // advanced feature: visibility based on distance
        const distToPacman = ghost.mesh.position.distanceTo(pacman.position);
        const visibilityRange = 7;
        if (distToPacman > visibilityRange) {
            ghost.mesh.visible = false;
        } 
        else {
            ghost.mesh.visible = true;
            const opacity = 1 - (distToPacman / visibilityRange) * 0.5;
            

            ghost.mesh.traverse((child) => {
                if (child.isMesh && child.material) {
                    child.material.opacity = opacity;
                    child.material.transparent = true;
                }
            });
        }
        

        const mat = ghost.mesh.userData.bodyMaterial;
        if (mat) {
            if (ghost.respawnTime && ghost.respawnTime > 0) {
                const flash = Math.sin(Date.now() * 0.02) > 0;
                mat.color.setHex(flash ? 0xffffff : ghost.color);
                mat.emissive.setHex(flash ? 0xffffff : ghost.color);
            } 
            else if (powerUpActive && !ghost.immuneToPowerUp) {
                mat.color.setHex(0x0000ff);
                mat.emissive.setHex(0x0000ff);
            } 
            else {
                mat.color.setHex(ghost.color);
                mat.emissive.setHex(ghost.color);
            }
        }
        const isChasing = !powerUpActive;
        if (ghost.respawnTime && ghost.respawnTime > 0) {
            ghost.mesh.position.y = 0.5 + Math.sin(Date.now() * 0.003 + index) * 0.1;
            return;
        }
        
        let moved = false;
        const ghostPos = ghost.mesh.position;
        ghost.pathCheckTimer = (ghost.pathCheckTimer || 0) + delta;
        const pathUpdateInterval = isChasing ? 0.3 : 0.1;
        if (ghost.pathCheckTimer > pathUpdateInterval || !ghost.nextTarget) {
            ghost.pathCheckTimer = 0;
            
            if (isChasing) {
                const target = getPersonalityTarget(ghost);
                const nextStep = findPath(ghostPos.x, ghostPos.z, target.x, target.z);
                if (nextStep) {
                    ghost.nextTarget = new THREE.Vector3(nextStep.x, 0.5, nextStep.z);
                } 
                else {
                    ghost.nextTarget = null;
                }
            } 
            else {
                const fleeTarget = getFleeTarget(ghost);
                const nextStep = findPath(ghostPos.x, ghostPos.z, fleeTarget.x, fleeTarget.z);
                if (nextStep) {
                    ghost.nextTarget = new THREE.Vector3(nextStep.x, 0.5, nextStep.z);
                } 
                else {
                    ghost.nextTarget = new THREE.Vector3(fleeTarget.x, 0.5, fleeTarget.z);
                }
            }
        }
        
        if (ghost.nextTarget) {
            const dir = new THREE.Vector3().subVectors(ghost.nextTarget, ghostPos).normalize();
            const movement = dir.multiplyScalar(ghost.speed * delta);
            const newPos = ghostPos.clone().add(movement);
            newPos.y = 0.5;
            newPos.x = Math.max(-13, Math.min(13, newPos.x));
            newPos.z = Math.max(-13, Math.min(13, newPos.z));
            if (!checkWallCollision(newPos, 0.4)) {
                ghost.mesh.position.copy(newPos);
                moved = true;
            }
            const distToTarget = Math.sqrt(
                Math.pow(ghostPos.x - ghost.nextTarget.x, 2) + 
                Math.pow(ghostPos.z - ghost.nextTarget.z, 2)
            );
            if (distToTarget < 0.3) {
                ghost.nextTarget = null;
            }
        }
        
        // fallback to greedy if A* broken
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
        
        ghost.mesh.position.y = 0.5 + Math.sin(Date.now() * 0.003 + index) * 0.1;
        const lookTarget = pacman.position.clone();
        lookTarget.y = ghost.mesh.position.y; 
        ghost.mesh.lookAt(lookTarget);
        updateGhostEyes(ghost.mesh, pacman.position);
    });
}
