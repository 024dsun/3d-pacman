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
import { playGhostEatenSound, playDeathSound, playLevelCompleteSound, updateHeartbeat, updateGhostAudio, stopGhostAudio } from './audio.js';
import { createGhostExplosion, createDeathEffect, screenShake, updateEffects } from './effects.js';

// Reset level (lose life)
export function resetLevel() {
    // Reset state
    setScore(0);
    setPowerUpActive(false);
    setPowerUpTimer(0);
    pacman.position.set(0, 0.5, 0);
    pacman.rotation.y = 0;
    pacman.scale.set(1, 1, 1);
    
    // Clear and recreate pellets
    clearAllPellets();
    createPellets();
    
    // Reset ghosts
    ghosts.forEach(ghost => {
        ghost.mesh.position.set(...ghost.startPosition);
        ghost.respawnTime = 0;
        ghost.immuneToPowerUp = false;
        ghost.stuckTimer = 0;
        ghost.lastPosition.set(...ghost.startPosition);
        ghost.lastPacmanPos = null;
        ghost.preferredDirection = null;
        ghost.mesh.material.color.setHex(ghost.color);
        ghost.mesh.material.emissive.setHex(ghost.color);
        
        // Ensure spawn position is valid
        if (checkWallCollision(ghost.mesh.position, 0.5)) {
            const safePositions = [
                [-11, 0.5, -11], [11, 0.5, -11],
                [-11, 0.5, 11], [11, 0.5, 11],
                [0, 0.5, 0]
            ];
            
            for (let pos of safePositions) {
                const testPos = new THREE.Vector3(...pos);
                if (!checkWallCollision(testPos, 0.5)) {
                    ghost.mesh.position.copy(testPos);
                    ghost.startPosition = pos.slice();
                    break;
                }
            }
        }
    });
    
    updateHUD();
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
                    setLives(lives - 1);
                    createDeathEffect(pacman.position.clone());
                    screenShake(0.6, 0.5);
                    playDeathSound();
                    if (lives <= 0) {
                        setGameOver(true);
                        setGameStarted(false);
                        showStartScreen(true);
                        updateHUD();
                    } else {
                        resetLevel();
                    }
                }
            }
        }
    }
}
