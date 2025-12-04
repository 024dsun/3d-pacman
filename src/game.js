import * as THREE from 'three';
import { 
    scene, pacman, ghosts, pellets, powerUps, walls, floor, lives,
    gameStarted, gameOver, isPaused, powerUpActive, powerUpTimer, ghostMultiplier,
    gameTime, baseGhostSpeed, currentLevel, score,
    setGameOver, setIsPaused, setPowerUpActive, setPowerUpTimer, setGhostMultiplier,
    setGameTime, setCurrentLevel, setScore, setLives, setGameStarted,
    clearPellets, clearPowerUps, clearWalls, clearGhosts
} from './state.js';
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

// Flag to prevent multiple death triggers
let isDeathSequenceActive = false;

// Reset positions after losing a life (keeps score and pellets)
export function resetAfterDeath() {
    // Reset power-up state
    setPowerUpActive(false);
    setPowerUpTimer(0);
    setGhostMultiplier(1);
    
    // Reset Pac-Man position
    pacman.position.set(0, 0.5, 0);
    pacman.rotation.y = 0;
    pacman.scale.set(1, 1, 1);
    
    // Reset ghosts to their starting positions
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
        
        // Safely reset material properties
        if (ghost.mesh.material) {
            if (ghost.mesh.material.color) ghost.mesh.material.color.setHex(ghost.color);
            if (ghost.mesh.material.emissive) ghost.mesh.material.emissive.setHex(ghost.color);
            ghost.mesh.material.opacity = 1;
        }
    });
    
    updateHUD();
}

// Full level reset (for new game)
export function resetLevel() {
    // Reset flags
    isDeathSequenceActive = false;
    
    // Make sure jumpscare overlay is hidden and reset
    const overlay = document.getElementById('jumpscare-overlay');
    if (overlay) {
        overlay.style.display = '';  // Clear inline style
        overlay.classList.add('hidden');
    }
    
    // Reset score
    setScore(0);
    
    // Clear and recreate pellets
    clearAllPellets();
    createPellets();
    
    // Reset positions
    resetAfterDeath();
}

// Advance to next level
export function advanceLevel() {
    playLevelCompleteSound();
    setCurrentLevel(currentLevel + 1);
    setIsPaused(true);
    
    // Clear existing level
    clearMaze();
    clearAllPellets();
    clearAllGhosts();
    
    // Recreate level
    createMaze();
    createTeleportZones();
    createPellets();
    createGhosts();
    
    // Reset Pac-Man position
    pacman.position.set(0, 0.5, 0);
    pacman.rotation.y = 0;
    setPowerUpActive(false);
    setPowerUpTimer(0);
    
    // Increase difficulty
    const newBaseSpeed = 2 + (currentLevel - 1) * 0.5;
    ghosts.forEach(g => g.speed = newBaseSpeed);
    
    // Change floor color and fog for each level
    const levelColors = [0x2a2a3e, 0x3e2a2a, 0x2a3e2a];
    const fogColors = [0x1a1a2e, 0x2e1a1a, 0x1a2e1a];
    
    floor.material.color.setHex(levelColors[currentLevel - 1] || 0x2a2a3e);
    scene.fog.color.setHex(fogColors[currentLevel - 1] || 0x1a1a2e);
    scene.background.setHex(fogColors[currentLevel - 1] || 0x1a1a2e);
    
    updateHUD();
    
    // Auto-unpause after 3 seconds
    setTimeout(() => {
        setIsPaused(false);
        updateHUD();
    }, 3000);
}

// Main game update loop
export function update(delta) {
    // Don't update if game hasn't started
    if (!gameStarted) {
        return;
    }
    
    if (gameOver) {
        updateHUD();
        return;
    }
    
    // Handle pause
    if (isPaused) {
        return;
    }
    
    // Track game time and scale difficulty
    setGameTime(gameTime + delta);
    
    // Ghosts speed up by 10% every 20 seconds
    const speedMultiplier = Math.pow(1.1, Math.floor(gameTime / 20));
    ghosts.forEach(ghost => {
        ghost.speed = baseGhostSpeed * speedMultiplier;
    });
    
    // Check win condition - all pellets collected
    if (pellets.length === 0 && powerUps.length === 0) {
        if (currentLevel < 3) {
            advanceLevel();
        } else {
            setGameOver(true);
            updateHUD();
        }
        return;
    }
    
    // Update power-up timer
    if (powerUpActive) {
        setPowerUpTimer(powerUpTimer - delta);
        if (powerUpTimer <= 0) {
            setPowerUpActive(false);
            setPowerUpTimer(0);
            setGhostMultiplier(1);
        }
        updateHUD();
    }
    
    // Update characters and pellets
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
    
    // Update 3D positional audio and heartbeat
    let closestGhostDist = Infinity;
    ghosts.forEach(ghost => {
        const dist = pacman.position.distanceTo(ghost.mesh.position);
        if (dist < closestGhostDist) closestGhostDist = dist;
    });
    updateHeartbeat(closestGhostDist);
    updateGhostAudio(ghosts, pacman.position);
    
    // Update HUD periodically
    if (Math.floor(gameTime) !== Math.floor(gameTime - delta)) {
        updateHUD();
    }
}

// Ghost collisions with Pacman
function checkGhostCollisions() {
    for (let ghost of ghosts) {
        const dist = pacman.position.distanceTo(ghost.mesh.position);
        if (dist < 1.0) {
            console.log("COLLISION! dist:", dist, "powerUpActive:", powerUpActive, "respawnTime:", ghost.respawnTime, "isDeathSequenceActive:", isDeathSequenceActive);
            const ghostVulnerable = powerUpActive && !ghost.immuneToPowerUp;
            // Eat the ghost
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
            // Lose life
            else {
                if (!ghost.respawnTime || ghost.respawnTime <= 0) {
                    // Prevent multiple death triggers
                    if (isDeathSequenceActive) return;
                    isDeathSequenceActive = true;
                    
                    // ALWAYS JUMPSCARE when dying
                    
                    // Play chaotic scream
                    playJumpscareSound();
                    
                    // Show scary overlay
                    const overlay = document.getElementById('jumpscare-overlay');
                    if (overlay) {
                        overlay.classList.remove('hidden');
                        const face = overlay.querySelector('.jumpscare-face');
                        if (face) face.classList.add('jumpscare-active');
                    }
                    
                    // Pause everything
                    setIsPaused(true);
                    
                    // Save death position
                    const deathPos = pacman.position.clone();
                    
                    console.log("DEATH: Starting jumpscare sequence");
                    
                    // Wait 1.5 seconds for jumpscare then continue
                    window.setTimeout(() => {
                        console.log("DEATH: Timeout fired, hiding overlay");
                        
                        // Hide overlay
                        const overlay = document.getElementById('jumpscare-overlay');
                        if (overlay) {
                            overlay.style.display = '';  // Clear inline style
                            overlay.classList.add('hidden');
                        }
                        
                        // Reset positions
                        resetAfterDeath();
                        
                        // Handle death logic
                        console.log("DEATH: Current lives before:", lives);
                        const newLives = lives - 1;
                        console.log("DEATH: New lives:", newLives);
                        setLives(newLives);
                        playDeathSound();
                        
                        if (newLives <= 0) {
                            console.log("DEATH: Game over!");
                            setGameOver(true);
                            setGameStarted(false);
                            showStartScreen(true);
                        }
                        updateHUD();
                        
                        // Unpause and allow new deaths
                        setIsPaused(false);
                        isDeathSequenceActive = false;
                        
                        console.log("DEATH: Sequence complete, isPaused:", isPaused, "isDeathSequenceActive:", isDeathSequenceActive);
                    }, 1500);
                    
                    return; // Stop processing
                }
            }
        }
    }
}
