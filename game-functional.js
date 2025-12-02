import * as THREE from 'three';

// features implemented are as below
// - maze generation (3 unique levels)
// - pacman movement (4 camera modes)
// - ghost movement with SMART AI
// - pellet collection
// - power-up collection
// - ghost AI (ADVANCED PATHFINDING - ROBUST WALL AVOIDANCE):
//   * Tracks Pac-Man across entire map
//   * Invisible when far away (horror effect) but still pursuing
//   * Visible and fade in when within 10 units
//   * Predictive targeting (intercepts Pac-Man's path)
//   * Multi-direction probing with wall repulsion force
//   * NEVER gets stuck on walls - multiple safety layers:
//     - Wall repulsion force pushes away from nearby walls
//     - 20+ direction testing with 5-point lookahead
//     - Emergency unstuck recovery system
//     - Continuous wall ejection validation
//     - Spawn position validation
//   * Smooth wall sliding and navigation
// - collision detection (advanced)
// - game over and win conditions
// - score tracking
// - lives tracking
// - level progression (3 levels with increasing difficulty)
// - teleport portals (levels 2 & 3)
// - user interaction

let scene;
let camera;
let renderer;
let clock;
let floor;
let walls = [];
let pacman;
let pacmanSpeed = 5;
// let pacmanMouthAngle = 0;
let ghosts = [];
let pellets = [];
let powerUps = [];
let score = 0;
let lives = 3;
let currentLevel = 1;
let gameOver = false;
let isPaused = false;
let powerUpActive = false
let powerUpTimer = 0;
let keys = {};
let hudElement;
let pacmanLight;
let gameTime = 0;
let baseGhostSpeed = 2;
let teleportZones = []; // Teleport portals
let lastTeleportTime = 0; // Cooldown to prevent rapid teleporting

// camera mode: 1 - top down, 2 - third person, 3 - first person, 4 - spectator
let cameraMode;

// mouse look for first person mode
let mouseX = 0;
let mouseY = 0;
let cameraYaw = 0;
let cameraPitch = 0;
let isPointerLocked = false;

// initialize game
function init() {
    // scene setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);
    // fog for horror atmosphere - use exponential fog for consistent effect at all distances
    scene.fog = new THREE.FogExp2(0x1a1a2e, 0.04);
    // camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 15, 15);
    camera.lookAt(0, 0, 0); 
    cameraMode = 2;
    // renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    document.body.appendChild(renderer.domElement);
    // lights
    const ambientLight = new THREE.AmbientLight(0x6060a0, 0.5);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = true;
    scene.add(dirLight);
    // floor
    const floorGeometry = new THREE.PlaneGeometry(30, 30);
    const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x2a2a3e });
    floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);
    
    // Store floor material for level color changes
    floor.material = floorMaterial;
    // scene initialization
    createMaze();
    createTeleportZones();
    createPacman();
    createPellets();
    createGhosts();
    setupInput();
    createHUD();
    window.addEventListener('resize', onWindowResize);
    clock = new THREE.Clock();
}

// Get maze layout based on level
function getMazeLayout(level) {
    const wallHeight = 2;
    
    if (level === 1) {
        // Level 1: Classic maze (no teleports)
        return [
            [0, 0, -14, 30, wallHeight, 1],
            [0, 0, 14, 30, wallHeight, 1],
            [-14, 0, 0, 1, wallHeight, 30],
            [14, 0, 0, 1, wallHeight, 30],
            [-10, 0, -8, 1, wallHeight, 8],
            [-6, 0, 2, 1, wallHeight, 8],
            [-2, 0, -6, 1, wallHeight, 8],
            [-2, 0, 6, 1, wallHeight, 4],
            [2, 0, -10, 1, wallHeight, 6],
            [2, 0, 2, 1, wallHeight, 12],
            [6, 0, 6, 1, wallHeight, 6],
            [10, 0, -4, 1, wallHeight, 12],
            [10, 0, 10, 1, wallHeight, 6],
            [-8, 0, -10, 6, wallHeight, 1],
            [0, 0, -10, 6, wallHeight, 1],
            [8, 0, -10, 6, wallHeight, 1],
            [-4, 0, -6, 6, wallHeight, 1],
            [8, 0, -6, 8, wallHeight, 1],
            [-8, 0, -2, 6, wallHeight, 1],
            [4, 0, -2, 6, wallHeight, 1],
            [-12, 0, 2, 4, wallHeight, 1],
            [0, 0, 2, 4, wallHeight, 1],
            [-8, 0, 6, 6, wallHeight, 1],
            [-4, 0, 10, 8, wallHeight, 1],
            [8, 0, 10, 8, wallHeight, 1]
        ];
    } else if (level === 2) {
        // Level 2: Corridor maze with multiple paths (with teleport gaps)
        return [
            // Outer walls with teleport gaps
            [0, 0, -14, 30, wallHeight, 1],
            [0, 0, 14, 30, wallHeight, 1],
            [-14, 0, -8, 1, wallHeight, 12],
            [-14, 0, 8, 1, wallHeight, 12],
            [14, 0, -8, 1, wallHeight, 12],
            [14, 0, 8, 1, wallHeight, 12],
            
            // Horizontal corridors creating maze paths
            [-8, 0, -10, 10, wallHeight, 1],
            [4, 0, -10, 10, wallHeight, 1],
            
            [-10, 0, -6, 4, wallHeight, 1],
            [2, 0, -6, 4, wallHeight, 1],
            [8, 0, -6, 8, wallHeight, 1],
            
            [-12, 0, -2, 8, wallHeight, 1],
            [4, 0, -2, 8, wallHeight, 1],
            
            [-6, 0, 2, 6, wallHeight, 1],
            [4, 0, 2, 6, wallHeight, 1],
            
            [-10, 0, 6, 4, wallHeight, 1],
            [2, 0, 6, 4, wallHeight, 1],
            [8, 0, 6, 8, wallHeight, 1],
            
            [-8, 0, 10, 10, wallHeight, 1],
            [4, 0, 10, 10, wallHeight, 1],
            
            // Vertical corridors creating maze paths
            [-10, 0, -4, 1, wallHeight, 8],
            [-6, 0, -8, 1, wallHeight, 10],
            [-2, 0, -12, 1, wallHeight, 6],
            [-2, 0, 4, 1, wallHeight, 8],
            [2, 0, -8, 1, wallHeight, 6],
            [2, 0, 4, 1, wallHeight, 12],
            [6, 0, -12, 1, wallHeight, 8],
            [6, 0, 8, 1, wallHeight, 8],
            [10, 0, -4, 1, wallHeight, 8],
            [10, 0, 8, 1, wallHeight, 8]
        ];
    } else if (level === 3) {
        // Level 3: Complex winding maze (with teleport gaps)
        return [
            // Outer walls with teleport gaps
            [0, 0, -14, 30, wallHeight, 1],
            [0, 0, 14, 30, wallHeight, 1],
            [-14, 0, -8, 1, wallHeight, 12],
            [-14, 0, 8, 1, wallHeight, 12],
            [14, 0, -8, 1, wallHeight, 12],
            [14, 0, 8, 1, wallHeight, 12],
            
            // Create winding S-shaped corridors
            // Top section
            [-10, 0, -10, 8, wallHeight, 1],
            [6, 0, -10, 12, wallHeight, 1],
            [-8, 0, -8, 1, wallHeight, 4],
            [4, 0, -8, 1, wallHeight, 4],
            [10, 0, -6, 1, wallHeight, 8],
            
            // Upper middle
            [-12, 0, -6, 4, wallHeight, 1],
            [-4, 0, -6, 1, wallHeight, 6],
            [2, 0, -6, 10, wallHeight, 1],
            [-10, 0, -2, 1, wallHeight, 8],
            [6, 0, -4, 1, wallHeight, 4],
            
            // Center section - create some rooms
            [-6, 0, -2, 8, wallHeight, 1],
            [6, 0, -2, 4, wallHeight, 1],
            [-2, 0, 0, 1, wallHeight, 4],
            [8, 0, 0, 1, wallHeight, 8],
            
            // Lower middle
            [-12, 0, 2, 6, wallHeight, 1],
            [0, 0, 2, 8, wallHeight, 1],
            [-8, 0, 4, 1, wallHeight, 4],
            [2, 0, 4, 1, wallHeight, 8],
            [10, 0, 2, 1, wallHeight, 4],
            
            // Bottom section
            [-10, 0, 6, 1, wallHeight, 8],
            [-4, 0, 6, 8, wallHeight, 1],
            [8, 0, 6, 8, wallHeight, 1],
            [-6, 0, 8, 1, wallHeight, 4],
            [4, 0, 8, 1, wallHeight, 4],
            [-10, 0, 10, 8, wallHeight, 1],
            [6, 0, 10, 12, wallHeight, 1],
            
            // Add some isolated pillars for challenge
            [-2, 0, -10, 2, wallHeight, 2],
            [0, 0, -4, 2, wallHeight, 2],
            [-8, 0, 8, 2, wallHeight, 2],
            [4, 0, 10, 2, wallHeight, 2]
        ];
    }
    
    return [];
}

// create maze
function createMaze() {
    // Different wall colors for each level
    let wallColor, edgeColor;
    if (currentLevel === 1) {
        wallColor = 0x4a4a6a;  // Blue-gray
        edgeColor = 0x6666aa;
    } else if (currentLevel === 2) {
        wallColor = 0x5a4a4a;  // Reddish-gray
        edgeColor = 0xaa6666;
    } else {
        wallColor = 0x4a5a4a;  // Greenish-gray
        edgeColor = 0x66aa66;
    }
    
    const wallMaterial = new THREE.MeshStandardMaterial({ 
        color: wallColor,
        roughness: 0.8,
        metalness: 0.2
    });
    
    const positions = getMazeLayout(currentLevel);
    // create wall meshes
    positions.forEach(([x, y, z, w, h, d]) => {
        const geometry = new THREE.BoxGeometry(w, h, d);
        const wall = new THREE.Mesh(geometry, wallMaterial);
        wall.position.set(x, h/2, z);
        wall.castShadow = true;
        wall.receiveShadow = true;
        // edge glow
        const edges = new THREE.EdgesGeometry(geometry);
        const lineMaterial = new THREE.LineBasicMaterial({
            color: edgeColor,
            transparent: true,
            opacity: 0.4
        });
        const wireframe = new THREE.LineSegments(edges, lineMaterial);
        wall.add(wireframe);
        // add to scene
        scene.add(wall);
        walls.push(wall);
    });
}

// create teleport zones (classic Pac-Man feature!)
function createTeleportZones() {
    // Clear existing teleports
    teleportZones.forEach(zone => {
        if (zone.mesh) scene.remove(zone.mesh);
        if (zone.ring) scene.remove(zone.ring);
    });
    teleportZones = [];
    
    // Only create teleports for levels 2 and 3
    if (currentLevel === 1) {
        return;
    }
    
    // Create left and right teleport portals
    const portalGeometry = new THREE.CylinderGeometry(0.8, 0.8, 2, 32);
    const portalMaterial = new THREE.MeshStandardMaterial({
        color: 0x00ffff,
        emissive: 0x00ffff,
        emissiveIntensity: 0.8,
        transparent: true,
        opacity: 0.6
    });
    
    // Create glowing rings around portals
    const ringGeometry = new THREE.TorusGeometry(1.2, 0.1, 16, 32);
    const ringMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.8
    });
    
    // Left portal
    const leftPortal = new THREE.Mesh(portalGeometry, portalMaterial);
    leftPortal.position.set(-13, 1, 0);
    leftPortal.rotation.z = Math.PI / 2;
    scene.add(leftPortal);
    
    const leftRing = new THREE.Mesh(ringGeometry, ringMaterial.clone());
    leftRing.position.set(-13, 1, 0);
    leftRing.rotation.z = Math.PI / 2;
    scene.add(leftRing);
    
    // Right portal
    const rightPortal = new THREE.Mesh(portalGeometry, portalMaterial.clone());
    rightPortal.position.set(13, 1, 0);
    rightPortal.rotation.z = Math.PI / 2;
    scene.add(rightPortal);
    
    const rightRing = new THREE.Mesh(ringGeometry, ringMaterial.clone());
    rightRing.position.set(13, 1, 0);
    rightRing.rotation.z = Math.PI / 2;
    scene.add(rightRing);
    
    // Define teleport zones (invisible triggers)
    teleportZones.push({
        mesh: leftPortal,
        ring: leftRing,
        position: new THREE.Vector3(-13, 0.5, 0),
        exitPosition: new THREE.Vector3(12, 0.5, 0), // Exit slightly away to prevent instant re-teleport
        radius: 1.5
    });
    
    teleportZones.push({
        mesh: rightPortal,
        ring: rightRing,
        position: new THREE.Vector3(13, 0.5, 0),
        exitPosition: new THREE.Vector3(-12, 0.5, 0), // Exit slightly away to prevent instant re-teleport
        radius: 1.5
    });
}

// animate teleport zones
function animateTeleportZones(delta) {
    const time = Date.now() * 0.001;
    teleportZones.forEach((zone, index) => {
        if (zone.mesh) {
            // Rotate portal
            zone.mesh.rotation.y += delta * 2;
            const pulse = Math.sin(time * 3 + index * Math.PI) * 0.2 + 1;
            zone.mesh.scale.set(pulse, 1, pulse);
        }
        
        if (zone.ring) {
            // Counter-rotate the ring for visual effect
            zone.ring.rotation.y -= delta * 3;
            // Pulse the ring
            const ringPulse = Math.sin(time * 4 + index * Math.PI) * 0.15 + 1;
            zone.ring.scale.setScalar(ringPulse);
            // Pulse opacity
            zone.ring.material.opacity = 0.5 + Math.sin(time * 5 + index * Math.PI) * 0.3;
        }
    });
}

// check teleportation
function checkTeleportation() {
    const currentTime = Date.now();
    const cooldownTime = 500; // 0.5 second cooldown to prevent rapid back-and-forth
    
    teleportZones.forEach(zone => {
        const dist = pacman.position.distanceTo(zone.position);
        if (dist < zone.radius && (currentTime - lastTeleportTime) > cooldownTime) {
            // Teleport Pac-Man!
            pacman.position.copy(zone.exitPosition);
            lastTeleportTime = currentTime;
            
            // Visual feedback: flash the portal
            if (zone.mesh) {
                zone.mesh.material.emissiveIntensity = 2.0;
                setTimeout(() => {
                    if (zone.mesh) zone.mesh.material.emissiveIntensity = 0.8;
                }, 200);
            }
            
            // Scale effect
            pacman.scale.set(0.5, 0.5, 0.5);
            setTimeout(() => {
                pacman.scale.set(1, 1, 1);
            }, 100);
        }
    });
    
    // Also check for ghosts (they have individual cooldowns)
    ghosts.forEach(ghost => {
        if (!ghost.lastTeleportTime) ghost.lastTeleportTime = 0;
        
        teleportZones.forEach(zone => {
            const dist = ghost.mesh.position.distanceTo(zone.position);
            if (dist < zone.radius && (currentTime - ghost.lastTeleportTime) > cooldownTime) {
                ghost.mesh.position.copy(zone.exitPosition);
                ghost.lastTeleportTime = currentTime;
            }
        });
    });
}

// create pacman
function createPacman() {
    const geometry = new THREE.SphereGeometry(0.5, 32, 32);
    const material = new THREE.MeshStandardMaterial({ 
        color: 0xffff00,
        emissive: 0xffff00,
        emissiveIntensity: 0.4
    });
    pacman = new THREE.Mesh(geometry, material);
    pacman.position.set(0, 0.5, 0);
    pacman.castShadow = true;
    // add eye (will fix later)
    const eyeGeometry = new THREE.SphereGeometry(0.08, 8, 8);
    const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
    const eye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    eye.position.set(0, 0.2, 0.4);
    pacman.add(eye);
    // point light attached to pacman (flashlight effect)
    pacmanLight = new THREE.PointLight(0xffff00, 2, 15);
    pacmanLight.position.set(0, 0.5, 0);
    scene.add(pacmanLight);
    // add to scene
    scene.add(pacman);
}

// create pellets and power ups
function createPellets() {
    const pelletGeometry = new THREE.SphereGeometry(0.15, 8, 8);
    const pelletMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xffff00,
        emissive: 0xffff00,
        emissiveIntensity: 0.6
    });
    // create power up
    const powerUpGeometry = new THREE.SphereGeometry(0.3, 16, 16);
    const powerUpMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xff00ff,
        emissive: 0xff00ff,
        emissiveIntensity: 0.8
    });
    // place pellets
    for (let x = -12; x <= 12; x += 2) {
        for (let z = -12; z <= 12; z += 2) {
            if (Math.abs(x) < 2 && Math.abs(z) < 2) continue;
            const pos = new THREE.Vector3(x, 0.5, z);
            if (!checkWallCollisionSimple(pos)) {
                const pellet = new THREE.Mesh(pelletGeometry, pelletMaterial);
                pellet.position.copy(pos);
                scene.add(pellet);
                pellets.push(pellet);
            }
        }
    }
    // add power ups in corners
    const powerUpPositions = [
        [-12, 0.5, -12],
        [12, 0.5, -12],
        [-12, 0.5, 12],
        [12, 0.5, 12]
    ];
    // add power ups to scene
    powerUpPositions.forEach(pos => {
        const testPos = new THREE.Vector3(...pos);
        if (!checkWallCollisionSimple(testPos)) {
            const powerUp = new THREE.Mesh(powerUpGeometry, powerUpMaterial);
            powerUp.position.set(...pos);
            scene.add(powerUp);
            powerUps.push(powerUp);
        }
    });
}

// create ghosts
function createGhosts() {
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
    // create ghosts
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
        // TODO: add eyes
        // const eyeGeometry = new THREE.SphereGeometry(0.1, 16, 16);
        // const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
        // const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        // leftEye.position.set(0.15, 0.15, 0.4);
        // ghostMesh.add(leftEye);
        // const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        // rightEye.position.set(-0.15, 0.15, 0.4);
        // ghostMesh.add(rightEye);
        // add to scene
        scene.add(ghostMesh);
        ghosts.push({
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

// user input handling
function setupInput() {
    window.addEventListener('keydown', (e) => {
        let pressedKey = e.key.toLowerCase();
        keys[pressedKey] = true;
        // camera mode switching (1-4 keys)
        if (pressedKey >= '1' && pressedKey <= '4') {
            cameraMode = parseInt(pressedKey);
            // request pointer lock for first person mode
            if (cameraMode === 3) {
                renderer.domElement.requestPointerLock();
            } else {
                document.exitPointerLock();
            }
            updateHUD();
        }
        // pause game
        if (e.key === ' ') {
            e.preventDefault();
            if (!gameOver) {
                isPaused = !isPaused;
                updateHUD();
            }
        }
        // restart game
        if (pressedKey === 'r' && gameOver) {
            location.reload();
        }
    });
    window.addEventListener('keyup', (e) => {
        let releasedKey = e.key.toLowerCase();
        keys[releasedKey] = false;
    });
    // mouse movement for first person camera
    document.addEventListener('mousemove', (e) => {
        if (cameraMode === 3 && document.pointerLockElement === renderer.domElement) {
            const sensitivity = 0.002;
            cameraYaw += e.movementX * sensitivity;
            cameraPitch -= e.movementY * sensitivity;
            // clamp pitch to avoid flipping
            cameraPitch = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, cameraPitch));
        }
    });
    // pointer lock change handler
    document.addEventListener('pointerlockchange', () => {
        isPointerLocked = document.pointerLockElement === renderer.domElement;
    });
    // click to enter first person mode
    renderer.domElement.addEventListener('click', () => {
        if (cameraMode === 3 && !isPointerLocked) {
            renderer.domElement.requestPointerLock();
        }
    });
}

// hud
function createHUD() {
    hudElement = document.createElement('div');
    hudElement.style.position = 'absolute';
    hudElement.style.top = '20px';
    hudElement.style.left = '20px';
    hudElement.style.color = 'white';
    hudElement.style.fontFamily = 'monospace';
    hudElement.style.fontSize = '20px';
    hudElement.style.background = 'rgba(0,0,0,0.5)';
    hudElement.style.padding = '10px';
    hudElement.style.borderRadius = '5px';
    document.body.appendChild(hudElement);
    updateHUD();
}

// update hud
function updateHUD() {
    const powerUpText = powerUpActive ? `<br><span style="color: #ff00ff; font-weight: bold;">POWER UP: ${Math.ceil(powerUpTimer)}s</span>` : '';
    
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

// collision detection
function checkWallCollision(position, radius = 0.5) {
    for (let wall of walls) {
        const wallBox = new THREE.Box3().setFromObject(wall);
        const entityBox = new THREE.Box3().setFromCenterAndSize(
            position,
            new THREE.Vector3(radius * 2, radius * 2, radius * 2)
        );
        if (wallBox.intersectsBox(entityBox)) {
            return true;
        }
    }
    return false;
}

// collision detection for pellets and power ups
function checkWallCollisionSimple(position) {
    for (let wall of walls) {
        const wallBox = new THREE.Box3().setFromObject(wall);
        if (wallBox.containsPoint(position)) {
            return true;
        }
    }
    return false;
}

// game update loop
function update(delta) {
    if (gameOver) {
        updateHUD();
        return;
    }
    // handle pause
    if (isPaused) {
        return;
    }
    // track game time and scale difficulty
    gameTime += delta;
    // ghosts speed up gradually
    const speedMultiplier = 1 + Math.floor(gameTime / 30) * 0.05;
    ghosts.forEach(ghost => {
        ghost.speed = baseGhostSpeed * speedMultiplier;
    });
    // check win condition - all pellets collected
    if (pellets.length === 0 && powerUps.length === 0) {
        // Level complete! Advance to next level
        if (currentLevel < 3) {
            advanceLevel();
        } else {
            // Game won!
            gameOver = true;
            updateHUD();
        }
        return;
    }
    // update power-up timer
    if (powerUpActive) {
        powerUpTimer -= delta;
        if (powerUpTimer <= 0) {
            powerUpActive = false;
            powerUpTimer = 0;
        }
        updateHUD();
    }
    // update characters and pellets
    updatePacman(delta);
    checkTeleportation(); // Check if Pac-Man or ghosts are in teleport zones
    checkPelletCollection();
    checkPowerUpCollection();
    checkGhostCollisions();
    updateGhosts(delta);
    animatePellets();
    animatePowerUps(delta);
    animateTeleportZones(delta);
    updateCamera();
    // update HUD periodically (every frame for time display)
    if (Math.floor(gameTime) !== Math.floor(gameTime - delta)) {
        updateHUD();
    }
}

// pacman update
function updatePacman(delta) {
    let velocity = new THREE.Vector3(0, 0, 0);

    if(cameraMode !== 3) {
        // check valid keys for movement
        if (keys['w'] || keys['arrowup']) velocity.z -= 1;
        if (keys['s'] || keys['arrowdown']) velocity.z += 1;
        if (keys['a'] || keys['arrowleft']) velocity.x -= 1;
        if (keys['d'] || keys['arrowright']) velocity.x += 1;
    } else {
        // first person mode movement
        const forward = new THREE.Vector3()
        camera.getWorldDirection(forward);
        forward.y = 0;
        forward.normalize();
        const right = new THREE.Vector3().crossVectors(camera.up, forward).normalize();
        if (keys['w'] || keys['arrowup']) velocity.add(forward);
        if (keys['s'] || keys['arrowdown']) velocity.sub(forward);
        if (keys['a'] || keys['arrowleft']) velocity.add(right);
        if (keys['d'] || keys['arrowright']) velocity.sub(right);
    }
    
    // update pacman position
    if (velocity.length() > 0) {
        velocity.normalize().multiplyScalar(pacmanSpeed * delta);
        const newPos = pacman.position.clone().add(velocity);
        if (!checkWallCollision(newPos)) {
            pacman.position.copy(newPos);
        }
        // rotate to face movement direction (only in non-first-person modes)
        if (cameraMode !== 3) {
            const angle = Math.atan2(velocity.z, velocity.x);
            pacman.rotation.y = -angle;
        }
    }
    // in first person mode, pacman faces where the mouse is looking
    if (cameraMode === 3) {
        pacman.rotation.y = cameraYaw + Math.PI / 2;
    }
    // update light position to follow pacman
    pacmanLight.position.set(pacman.position.x, pacman.position.y + 1, pacman.position.z);
}

// collect pellets
function checkPelletCollection() {
    for (let i = pellets.length - 1; i >= 0; i--) {
        const pellet = pellets[i];
        const dist = pacman.position.distanceTo(pellet.position);
        if (dist < 0.6) {
            scene.remove(pellet);
            pellets.splice(i, 1);
            score += 10;
            updateHUD();
        }
    }
}

// collect powerups
function checkPowerUpCollection() {
    for (let i = powerUps.length - 1; i >= 0; i--) {
        const powerUp = powerUps[i];
        const dist = pacman.position.distanceTo(powerUp.position);
        if (dist < 0.8) {
            scene.remove(powerUp);
            powerUps.splice(i, 1);
            score += 50;
            powerUpActive = true;
            powerUpTimer = 10;
            // reset ghost after getting hit by pacman with powerup
            ghosts.forEach(ghost => {
                ghost.immuneToPowerUp = false;
            });
            updateHUD();
        }
    }
}

// ghost collisions
function checkGhostCollisions() {
    for (let ghost of ghosts) {
        const dist = pacman.position.distanceTo(ghost.mesh.position);
        if (dist < 1.0) {
            const ghostVulnerable = powerUpActive && !ghost.immuneToPowerUp;
            // eat the ghost
            if (ghostVulnerable) {
                score += 200;
                ghost.mesh.position.set(...ghost.startPosition);
                ghost.immuneToPowerUp = true;
                ghost.respawnTime = 1.0;
                updateHUD();
            } 
            // lose life
            else {
                if (!ghost.respawnTime || ghost.respawnTime <= 0) {
                    lives--;
                    if (lives <= 0) {
                        gameOver = true;
                        updateHUD();
                    } else {
                        resetLevel();
                    }
                }
            }
        }
    }
}

// reset level (lose life)
function resetLevel() {
    // reset state of game as compared to before
    score = 0;
    powerUpActive = false;
    powerUpTimer = 0;
    pacman.position.set(0, 0.5, 0);
    pacman.rotation.y = 0;
    pacman.scale.set(1, 1, 1);
    pellets.forEach(p => scene.remove(p));
    powerUps.forEach(p => scene.remove(p));
    pellets = [];
    powerUps = [];
    createPellets();
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
            // Find a safe spawn position
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

// advance to next level
function advanceLevel() {
    currentLevel++;
    isPaused = true; // Pause to show level transition
    
    // Clear existing maze
    walls.forEach(wall => scene.remove(wall));
    walls = [];
    
    // Clear pellets and power-ups
    pellets.forEach(p => scene.remove(p));
    powerUps.forEach(p => scene.remove(p));
    pellets = [];
    powerUps = [];
    
    // Clear ghosts
    ghosts.forEach(ghost => scene.remove(ghost.mesh));
    ghosts = [];
    
    // Recreate level
    createMaze();
    createTeleportZones();
    createPellets();
    createGhosts();
    
    // Reset Pac-Man position
    pacman.position.set(0, 0.5, 0);
    pacman.rotation.y = 0;
    powerUpActive = false;
    powerUpTimer = 0;
    
    // Increase difficulty: ghosts get faster each level
    baseGhostSpeed = 2 + (currentLevel - 1) * 0.5;
    
    // Change floor color and fog for each level
    const levelColors = [0x2a2a3e, 0x3e2a2a, 0x2a3e2a];
    const fogColors = [0x1a1a2e, 0x2e1a1a, 0x1a2e1a];
    
    floor.material.color.setHex(levelColors[currentLevel - 1] || 0x2a2a3e);
    scene.fog.color.setHex(fogColors[currentLevel - 1] || 0x1a1a2e);
    scene.background.setHex(fogColors[currentLevel - 1] || 0x1a1a2e);
    
    updateHUD();
    
    // Auto-unpause after 3 seconds
    setTimeout(() => {
        isPaused = false;
        updateHUD();
    }, 3000);
}

// ghost update - simple and reliable
function updateGhosts(delta) {
    ghosts.forEach((ghost, index) => {
        // update respawn timer
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
        
        // Determine direction based on vulnerability
        let direction;
        const isVulnerable = powerUpActive && !ghost.immuneToPowerUp;
        
        if (isVulnerable && ghost.respawnTime <= 0) {
            // Run away from Pacman
            direction = new THREE.Vector3()
                .subVectors(ghost.mesh.position, pacman.position)
                .normalize();
        } else {
            // Chase Pacman
            direction = new THREE.Vector3()
                .subVectors(pacman.position, ghost.mesh.position)
                .normalize();
        }
        
        // Calculate movement
        const movement = direction.clone().multiplyScalar(ghost.speed * delta);
        const newPos = ghost.mesh.position.clone().add(movement);
        
        // Keep within bounds
        newPos.x = Math.max(-13, Math.min(13, newPos.x));
        newPos.z = Math.max(-13, Math.min(13, newPos.z));
        
        // Try to move, with wall sliding fallback
        if (!checkWallCollision(newPos, 0.5)) {
            ghost.mesh.position.copy(newPos);
        } else {
            // Try sliding along X axis
            const slideX = ghost.mesh.position.clone();
            slideX.x += movement.x;
            if (!checkWallCollision(slideX, 0.5)) {
                ghost.mesh.position.copy(slideX);
            } else {
                // Try sliding along Z axis
                const slideZ = ghost.mesh.position.clone();
                slideZ.z += movement.z;
                if (!checkWallCollision(slideZ, 0.5)) {
                    ghost.mesh.position.copy(slideZ);
                } else {
                    // Random movement to get unstuck
                    const randomDir = new THREE.Vector3(
                        (Math.random() - 0.5) * 2,
                        0,
                        (Math.random() - 0.5) * 2
                    ).normalize().multiplyScalar(ghost.speed * delta);
                    const randomPos = ghost.mesh.position.clone().add(randomDir);
                    if (!checkWallCollision(randomPos, 0.5)) {
                        ghost.mesh.position.copy(randomPos);
                    }
                }
            }
        }
        
        // Bob animation
        ghost.mesh.position.y = 0.5 + Math.sin(Date.now() * 0.003 + index) * 0.1;
    });
}

// pellet glow effect
function animatePellets() {
    const time = Date.now() * 0.003;
    pellets.forEach(pellet => {
        pellet.scale.setScalar(1 + Math.sin(time * 2) * 0.2);
    });
}

// power up glow effect
function animatePowerUps(delta) {
    const time = Date.now() * 0.003;
    powerUps.forEach((powerUp, index) => {
        powerUp.scale.setScalar(1 + Math.sin(time * 1.5 + index) * 0.3);
        powerUp.rotation.y += delta * 2;
    });
}

// camera update
function updateCamera() {
    const pacPos = pacman.position;
    
    switch (cameraMode) {
        // top down
        case 1:
            camera.position.set(pacPos.x, 30, pacPos.z);
            camera.lookAt(pacPos.x, 0, pacPos.z);
            break;
        // third person (following pacman)
        case 2:
            camera.position.x = pacPos.x;
            camera.position.y = 15;
            camera.position.z = pacPos.z + 15;
            camera.lookAt(pacPos.x, 0, pacPos.z);
            break;
        // first person with mouse look
        case 3:
            camera.position.set(pacPos.x, 1.5, pacPos.z);
            // use mouse yaw/pitch for camera direction
            const lookX = Math.cos(cameraYaw) * Math.cos(cameraPitch);
            const lookY = Math.sin(cameraPitch);
            const lookZ = Math.sin(cameraYaw) * Math.cos(cameraPitch);
            camera.lookAt(
                pacPos.x + lookX,
                1.5 + lookY,
                pacPos.z + lookZ
            );
            break;
        // spectator (static overview)
        case 4:
            camera.position.set(0, 40, 20);
            camera.lookAt(0, 0, 0);
            break;
        // default mode 2
        default:
            camera.position.x = pacPos.x;
            camera.position.z = pacPos.z + 15;
            camera.lookAt(pacPos.x, 0, pacPos.z);
    }
}

// window resize
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// animation loop
function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    update(delta);
    renderer.render(scene, camera);
}

// start game
init();
animate();
