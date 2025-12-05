import * as THREE from 'three';
import { scene, pacman, ghosts, pellets, powerUps, walls, floor, lives } from './state.js';
import { gameStarted, gameOver, isPaused, powerUpActive, powerUpTimer, ghostMultiplier } from './state.js';
import { gameTime, baseGhostSpeed, currentLevel, score } from './state.js';
import { setGameOver, setIsPaused, setPowerUpActive, setPowerUpTimer, setGhostMultiplier, setGameTime, setCurrentLevel, setScore, setLives, setGameStarted } from './state.js';
import { clearPellets, clearPowerUps, clearWalls, clearGhosts } from './state.js';
import { createMaze, clearMaze } from './maze.js';
import { createTeleportZones, checkTeleportation, animateTeleportZones } from './teleport.js';
import { updatePacman } from './pacman.js';
import { createPellets, clearAllPellets, checkPelletCollection, checkPowerUpCollection, animatePellets, animatePowerUps } from './pellets.js';
import { createGhosts, clearAllGhosts, updateGhosts } from './ghosts.js';
import { checkWallCollision } from './collision.js';
import { updateHUD, showStartScreen, updateMinimap } from './ui.js';
import { updateCamera } from './camera.js';
import { playGhostEatenSound, playDeathSound, playLevelCompleteSound, playJumpscareSound, updateHeartbeat, updateGhostAudio, stopGhostAudio } from './audio.js';
import { createGhostExplosion, createDeathEffect, screenShake, updateEffects } from './effects.js';


let isDeathSequenceActive = false;


function ghostReset() {
    ghosts.forEach(ghost => {
        if (!ghost || !ghost.mesh) return;
        ghost.mesh.position.set(...ghost.startPosition);
        ghost.respawnTime = 0;
        ghost.immuneToPowerUp = false;
        ghost.stuckTimer = 0;
        ghost.lastPosition.set(...ghost.startPosition);
        ghost.lastPacmanPos = null;
        ghost.preferredDirection = null;
        ghost.nextTarget = null;
        ghost.pathCheckTimer = 0;
        ghost.mesh.visible = true;
        if (ghost.mesh.material) {
            if (ghost.mesh.material.color) {
                ghost.mesh.material.color.setHex(ghost.color);
            }
            if (ghost.mesh.material.emissive) {
                ghost.mesh.material.emissive.setHex(ghost.color);
            }
            ghost.mesh.material.opacity = 1;
        }
    });
}
export function resetAfterDeath() {
    setPowerUpActive(false);
    setPowerUpTimer(0);
    setGhostMultiplier(1);
    clearAllPellets();
    createPellets();
    pacman.position.set(0, 0.5, 0);
    pacman.rotation.y = 0;
    pacman.scale.set(1, 1, 1);
    

    ghosts.forEach(ghost => { ghost.speed = baseGhostSpeed; });
    
    ghostReset();

    // ghosts.forEach(ghost => {
    //     if (!ghost || !ghost.mesh) return;
    //     ghost.mesh.position.set(...ghost.startPosition);
    //     ghost.respawnTime = 0;
    //     ghost.immuneToPowerUp = false;
    //     ghost.stuckTimer = 0;
    //     ghost.lastPosition.set(...ghost.startPosition);
    //     ghost.lastPacmanPos = null;
    //     ghost.preferredDirection = null;
    //     ghost.nextTarget = null;
    //     ghost.pathCheckTimer = 0;
    //     ghost.mesh.visible = true;
    //     if (ghost.mesh.material) {
    //         if (ghost.mesh.material.color) ghost.mesh.material.color.setHex(ghost.color);
    //         if (ghost.mesh.material.emissive) ghost.mesh.material.emissive.setHex(ghost.color);
    //         ghost.mesh.material.opacity = 1;
    //     }
    // });
    
    // updateHeartbeat();
    // updateGhostAudio();
    updateHUD();
}

function updateAll(delta) {
    updatePacman(delta);
    checkTeleportation();
    checkPelletCollection();
    checkPowerUpCollection();
    checkGhostCollisions();
    updateGhosts(delta);
    animatePellets();
    animatePowerUps(delta);
    animateTeleportZones(delta);
    updateCamera();
    updateMinimap();
    updateEffects(delta);
}

export function resetLevel() {
    isDeathSequenceActive = false;

    const overlay = document.getElementById('jumpscare-overlay');
    if (overlay) {
        overlay.style.display = '';
        overlay.classList.add('hidden');
    }
    

    setScore(0);
    clearAllPellets();
    createPellets();
    resetAfterDeath();
}

// Advance to next level
export function advanceLevel() {
    playLevelCompleteSound();
    setCurrentLevel(currentLevel + 1);
    setIsPaused(true);
    clearMaze();
    clearAllPellets();
    clearAllGhosts();
    createMaze();
    createTeleportZones();
    createPellets();
    createGhosts();
    pacman.position.set(0, 0.5, 0);
    pacman.rotation.y = 0;
    setPowerUpActive(false);
    setPowerUpTimer(0);
    const baseSpeed = 2 + (currentLevel - 1) * 0.5;
    ghosts.forEach(g => g.speed = baseSpeed);
    const levelColors = [0x2a2a3e, 0x3e2a2a, 0x2a3e2a];
    const fogColors = [0x1a1a2e, 0x2e1a1a, 0x1a2e1a];
    floor.material.color.setHex(levelColors[currentLevel - 1] || 0x2a2a3e);
    scene.fog.color.setHex(fogColors[currentLevel - 1] || 0x1a1a2e);
    scene.background.setHex(fogColors[currentLevel - 1] || 0x1a1a2e);
    updateHUD();
    setTimeout(() => { setIsPaused(false); updateHUD(); }, 3000);
}

// Main game update loop
export function update(delta) {
    if (!gameStarted) return;
    if (gameOver) {
        updateHUD();
        return;
    }
    

    if (isPaused) {
        return;
    }
    

    setGameTime(gameTime + delta);
    const speedMultiplier = Math.pow(1.1, Math.floor(gameTime / 20));
    ghosts.forEach(ghost => { ghost.speed = baseGhostSpeed * speedMultiplier; });
    if (pellets.length === 0 && powerUps.length === 0) {
        if (currentLevel < 3) {
            advanceLevel();
        } 
        else {
            setGameOver(true);
            updateHUD();
        }
        return;
    }
    
    if (powerUpActive) {
        setPowerUpTimer(powerUpTimer - delta);
        if (powerUpTimer <= 0) {
            setPowerUpActive(false);
            setPowerUpTimer(0);
            setGhostMultiplier(1);
        }
        updateHUD();
    }
    updateAll(delta);
    
    let closestGhostDist = Infinity;
    ghosts.forEach(ghost => {
        const dist = pacman.position.distanceTo(ghost.mesh.position);
        if (dist < closestGhostDist) closestGhostDist = dist;
    });
    updateHeartbeat(closestGhostDist);
    updateGhostAudio(ghosts, pacman.position);
    
    if (Math.floor(gameTime) !== Math.floor(gameTime - delta)) {
        updateHUD();
    }
}


function checkGhostCollisions() {
    for (let ghost of ghosts) {
        const dist = pacman.position.distanceTo(ghost.mesh.position);
        if (dist < 1.0) {
            console.log("COLLISION! dist:", dist, "powerUpActive:", powerUpActive, "respawnTime:", ghost.respawnTime, "isDeathSequenceActive:", isDeathSequenceActive);
            const ghostVulnerable = powerUpActive && !ghost.immuneToPowerUp;
            if (ghostVulnerable) {
                const points = 200 * ghostMultiplier;
                setScore(score + points);
                setGhostMultiplier(ghostMultiplier * 2);
                createGhostExplosion(ghost.mesh.position.clone(), ghost.color);
                screenShake(0.4, 0.3);
                ghost.mesh.position.set(...ghost.startPosition);
                ghost.immuneToPowerUp = true;
                ghost.respawnTime = 1.0;
                playGhostEatenSound();
                updateHUD();
            } 
            else {
                if (!ghost.respawnTime || ghost.respawnTime <= 0) {
                    if (isDeathSequenceActive) return;
                    isDeathSequenceActive = true;
                    playJumpscareSound();
                    const overlay = document.getElementById('jumpscare-overlay');
                    if (overlay) {
                        overlay.classList.remove('hidden');
                        const face = overlay.querySelector('.jumpscare-face');
                        if (face) face.classList.add('jumpscare-active');
                    }
                    setIsPaused(true);
                    const deathPos = pacman.position.clone();
                    // console.log("DEATH: Starting jumpscare sequence");
                    window.setTimeout(() => {
                        // console.log("DEATH: Timeout fired, hiding overlay");
                        const overlay = document.getElementById('jumpscare-overlay');
                        if (overlay) {
                            overlay.style.display = '';
                            overlay.classList.add('hidden');
                        }
                        resetAfterDeath();
                        

                        // console.log("DEATH: Current lives before:", lives);
                        const newLives = lives - 1;
                        // console.log("DEATH: New lives:", newLives);
                        setLives(newLives);
                        playDeathSound();
                        
                        if (newLives <= 0) {
                            // console.log("DEATH: Game over!");
                            setGameOver(true);
                            setGameStarted(false);
                            showStartScreen(true);
                        }
                        updateHUD();
                        
                        setIsPaused(false);
                        isDeathSequenceActive = false;
                    }, 1500);
                    return;
                }
            }
        }
    }
}
