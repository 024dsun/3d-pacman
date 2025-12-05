import * as THREE from 'three';

// variables used throughout
export let scene;
export let camera;
export let renderer;
export let clock;
export let floor;
export let walls = [];
export let pacman;
export let ghosts = [];
export let pellets = [];
export let powerUps = [];
export let teleportZones = [];
export let score = 0;
export let lives = 3;
export let currentLevel = 1;
export let gameOver = false;
export let isPaused = false;
export let gameStarted = false;
export let powerUpActive = false;
export let powerUpTimer = 0;
export let ghostMultiplier = 1;
export let gameTime = 0;
export let lastTeleportTime = 0;
export let pacmanSpeed = 5;
export let baseGhostSpeed = 2;
export let keys = {};
export let cameraMode = 3;
export let mouseX = 0;
export let mouseY = 0;
export let cameraYaw = 0;
export let cameraPitch = 0;
export let isPointerLocked = false;
export let hudElement;
export let pacmanLight;
export let ambientLight;
export let directionalLight;
// a whole chain of setter functions for all of these variables
export function setScene(s) { 
    scene = s; 

}
export function setCamera(c) { 
    camera = c; 

}
export function setRenderer(r) { 
    renderer = r; 

}
export function setClock(c) { 
    clock = c; 

}
export function setFloor(f) { 
    floor = f; 

}
export function setPacman(p) { 
    pacman = p; 

}
export function setPacmanLight(l) { 
    pacmanLight = l; 

}
export function setHudElement(h) { 
    hudElement = h; 

}
export function setAmbientLight(l) { 
    ambientLight = l; 

}
export function setDirectionalLight(l) { 
    directionalLight = l; 

}

export function setScore(s) { 
    score = s; 

}
export function setLives(l) { 
    lives = l; 

}
export function setCurrentLevel(l) { 
    currentLevel = l; 

}
export function setGameOver(g) { 
    gameOver = g; 

}
export function setIsPaused(p) { 
    isPaused = p; 

}
export function setGameStarted(g) { 
    gameStarted = g; 

}
export function setPowerUpActive(p) { 
    powerUpActive = p; 

}
export function setPowerUpTimer(t) { 
    powerUpTimer = t; 

}
export function setGhostMultiplier(m) { 
    ghostMultiplier = m; 

}
export function setGameTime(t) { 
    gameTime = t; 

}
export function setLastTeleportTime(t) { 
    lastTeleportTime = t; 

}

export function setCameraMode(m) { 
    cameraMode = m; 

}
export function setCameraYaw(y) { 
    cameraYaw = y; 

}
export function setCameraPitch(p) { 
    cameraPitch = p; 

}
export function setIsPointerLocked(l) { 
    isPointerLocked = l; 

}



export function clearWalls() { 
    walls.length = 0; 

}
export function clearGhosts() { 
    ghosts.length = 0; 

}
export function clearPellets() { 
    pellets.length = 0; 

}
export function clearPowerUps() { 
    powerUps.length = 0; 

}
export function clearTeleportZones() { 
    teleportZones.length = 0; 

}

export function addWall(w) { 
    walls.push(w); 

}
export function addGhost(g) { 
    ghosts.push(g); 

}


export function addPellet(p) { 
    pellets.push(p); 

}
export function addPowerUp(p) { 
    powerUps.push(p); 

}
export function addTeleportZone(t) { 
    teleportZones.push(t); 

}

export function removePellet(index) { 
    pellets.splice(index, 1); 

}
export function removePowerUp(index) { 
    powerUps.splice(index, 1); 

}
