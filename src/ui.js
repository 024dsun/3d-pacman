import { 
    score, lives, currentLevel, gameOver, isPaused, gameStarted, powerUpActive, powerUpTimer,
    ghostMultiplier, gameTime, cameraMode, pellets, powerUps, pacman, ghosts, hudElement,
    setHudElement, setGameStarted, setGameOver, setScore, setLives, setCurrentLevel,
    setGameTime, setPowerUpActive, setPowerUpTimer, setGhostMultiplier
} from './state.js';

// Start screen element
let startScreen;

// Create start screen
export function createStartScreen() {
    startScreen = document.createElement('div');
    startScreen.style.position = 'absolute';
    startScreen.style.top = '0';
    startScreen.style.left = '0';
    startScreen.style.width = '100%';
    startScreen.style.height = '100%';
    startScreen.style.display = 'flex';
    startScreen.style.flexDirection = 'column';
    startScreen.style.justifyContent = 'center';
    startScreen.style.alignItems = 'center';
    startScreen.style.background = 'rgba(0, 0, 0, 0.85)';
    startScreen.style.color = 'white';
    startScreen.style.fontFamily = 'monospace';
    startScreen.style.zIndex = '1000';
    startScreen.innerHTML = `
        <h1 style="font-size: 64px; color: #ffff00; text-shadow: 0 0 20px #ffff00; margin-bottom: 20px;">
            👻 3D PAC-MAN 👻
        </h1>
        <p style="font-size: 24px; color: #00ffff; margin-bottom: 10px;">A Horror Experience</p>
        <div style="font-size: 18px; color: #aaa; margin: 30px 0; text-align: center; line-height: 1.8;">
            <p><strong style="color: #fff;">WASD / Arrow Keys</strong> - Move Pac-Man</p>
            <p><strong style="color: #fff;">1-4</strong> - Change Camera Mode</p>
            <p><strong style="color: #fff;">SPACE</strong> - Pause Game</p>
            <p><strong style="color: #fff;">R</strong> - Restart Game</p>
        </div>
        <p style="font-size: 16px; color: #ff00ff; margin-bottom: 30px;">Eat all pellets. Avoid ghosts. Collect power-ups to eat them!</p>
        <button id="startButton" style="
            font-size: 32px;
            padding: 20px 60px;
            background: #ffff00;
            color: #000;
            border: none;
            border-radius: 10px;
            cursor: pointer;
            font-family: monospace;
            font-weight: bold;
            transition: all 0.2s;
        ">START GAME</button>
        <p style="font-size: 14px; color: #666; margin-top: 40px;">Press ENTER or click to start</p>
    `;
    document.body.appendChild(startScreen);
    
    // Button hover effect
    const btn = document.getElementById('startButton');
    btn.onmouseover = () => { btn.style.background = '#00ff00'; btn.style.transform = 'scale(1.1)'; };
    btn.onmouseout = () => { btn.style.background = '#ffff00'; btn.style.transform = 'scale(1)'; };
    btn.onclick = startGame;
    
    // Also start on Enter key
    document.addEventListener('keydown', function onEnter(e) {
        if ((e.key === 'Enter' || e.key === ' ') && !gameStarted) {
            startGame();
        }
    });
}

// Show start screen
export function showStartScreen(isGameOver = false) {
    if (!startScreen) createStartScreen();
    startScreen.style.display = 'flex';
    
    // Update text if game over
    if (isGameOver) {
        startScreen.querySelector('h1').innerHTML = '👻 GAME OVER 👻';
        startScreen.querySelector('h1').style.color = '#ff0000';
        startScreen.querySelector('p').textContent = `Final Score: ${score}`;
        document.getElementById('startButton').textContent = 'PLAY AGAIN';
    } else {
        startScreen.querySelector('h1').innerHTML = '👻 3D PAC-MAN 👻';
        startScreen.querySelector('h1').style.color = '#ffff00';
        document.getElementById('startButton').textContent = 'START GAME';
    }
}

// Hide start screen
export function hideStartScreen() {
    if (startScreen) {
        startScreen.style.display = 'none';
    }
}

// Start game
export function startGame() {
    hideStartScreen();
    setGameStarted(true);
    setGameOver(false);
    setScore(0);
    setLives(3);
    setCurrentLevel(1);
    setGameTime(0);
    setPowerUpActive(false);
    setPowerUpTimer(0);
    setGhostMultiplier(1);
    
    // Reset positions
    pacman.position.set(0, 0.5, 0);
    pacman.rotation.y = 0;
    ghosts.forEach(ghost => {
        ghost.mesh.position.set(...ghost.startPosition);
        ghost.stuckTime = 0;
        ghost.nextWaypoint = null;
        ghost.respawnTime = 0;
        ghost.immuneToPowerUp = false;
    });
    
    updateHUD();
}

// Create HUD
export function createHUD() {
    const hud = document.createElement('div');
    hud.style.position = 'absolute';
    hud.style.top = '20px';
    hud.style.left = '20px';
    hud.style.color = 'white';
    hud.style.fontFamily = 'monospace';
    hud.style.fontSize = '20px';
    hud.style.background = 'rgba(0,0,0,0.5)';
    hud.style.padding = '10px';
    hud.style.borderRadius = '5px';
    document.body.appendChild(hud);
    setHudElement(hud);
    updateHUD();
}

// Update HUD
export function updateHUD() {
    if (!hudElement) return;
    
    const multiplierText = ghostMultiplier > 1 ? ` (x${ghostMultiplier} next ghost!)` : '';
    const powerUpText = powerUpActive ? `<br><span style="color: #ff00ff; font-weight: bold;">POWER UP: ${Math.ceil(powerUpTimer)}s${multiplierText}</span>` : '';
    
    // Level names for flavor
    const levelNames = ['The Beginning', 'Corridor Chaos', 'Winding Nightmare'];
    
    let pauseText = '';
    if (isPaused && pellets.length === 0 && powerUps.length === 0 && !gameOver) {
        // Level transition
        pauseText = `<br><br><span style="color: #00ffff; font-weight: bold; font-size: 24px;">LEVEL ${currentLevel}: ${levelNames[currentLevel - 1]}</span><br><span style="color: #ffff00;">Get ready...</span>`;
    } else if (isPaused) {
        pauseText = '<br><br><span style="color: #ffff00; font-weight: bold;">PAUSED - Press SPACE to resume</span>';
    }
    
    let totalPellets = pellets.length + powerUps.length;
    const gameOverText = gameOver && totalPellets !== 0 ? '<br><br><span style="color: #ff0000;">GAME OVER! Press R to restart</span>' : '';
    const winText = gameOver && totalPellets === 0 ? '<br><br><span style="color: #00ff00; font-size: 24px;">YOU WIN ALL LEVELS! 🎉</span><br>Press R to restart' : '';
    const cameraNames = ['', 'Top-Down', 'Third-Person', 'First-Person', 'Spectator'];
    const cameraText = `<br><span style="color: #888;">Camera: ${cameraNames[cameraMode]} (1-4) | SPACE to pause</span>`;
    const timeText = `<br><span style="color: #888;">Time: ${Math.floor(gameTime)}s</span>`;
    const fpText = cameraMode === 3 ? '<br><span style="color: #88ff88;">Click to enable mouse look | ESC to exit</span>' : '';
    const levelText = `<br><span style="color: #00ffff; font-weight: bold;">Level ${currentLevel}/3: ${levelNames[currentLevel - 1]}</span>`;
    const teleportHint = currentLevel > 1 ? `<br><span style="color: #00ffff; font-size: 12px;">💫 Use cyan portals on sides to teleport!</span>` : '';
    
    hudElement.innerHTML = `
        Score: ${score}<br>
        Lives: ${lives}${levelText}${cameraText}${timeText}<br>
        Pellets: ${pellets.length}<br>
        Power Ups: ${powerUps.length}<br>
        WASD/arrow keys to move${teleportHint}${fpText}${powerUpText}${pauseText}${gameOverText}${winText}
    `;
}
