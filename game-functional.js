import * as THREE from 'three';

// features implemented are as below
// - maze generation
// - pacman movement
// - ghost movement
// - pellet collection
// - power-up collection
// - ghost AI (advanced) (not working)
// - collision detection (advanced)
// - game over
// - game win
// - score tracking
// - lives tracking
// - user interaction
// - game over and win conditions

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
let gameOver = false;
let isPaused = false;
let powerUpActive = false
let powerUpTimer = 0;
let keys = {};
let hudElement;
let pacmanLight;
let gameTime = 0;
let baseGhostSpeed = 2;

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
    // scene initialization
    createMaze();
    createPacman();
    createPellets();
    createGhosts();
    setupInput();
    createHUD();
    window.addEventListener('resize', onWindowResize);
    clock = new THREE.Clock();
}

// create maze
function createMaze() {
    const wallMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x4a4a6a,
        roughness: 0.8,
        metalness: 0.2
    });
    const wallHeight = 2;
    const positions = [];
    // insert walls
    positions.push(
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
    );
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
            color: 0x6666aa,
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

let adrenalineTimer = 0;
const raycaster = new THREE.Raycaster();

function checkLineOfSight(startPos, targetPos) {
    const direction = new THREE.Vector3().subVectors(targetPos, startPos).normalize();
    const dist = startPos.distanceTo(targetPos);
    
    raycaster.set(startPos, direction);
    
    const intersects = raycaster.intersectObjects(walls);
    
    if (intersects.length > 0 && intersects[0].distance < dist) {
        return false;
    }
    return true;
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
    const positions = [
        [-12, 0.5, -8],
        [12, 0.5, -8],
        [-8, 0.5, 12],
        [8, 0.5, 12]
    ];
    // create ghosts
    colors.forEach((color, i) => {
        const geometry = new THREE.SphereGeometry(0.5, 32, 32);
        const material = new THREE.MeshStandardMaterial({ 
            color: color,
            emissive: color,
            emissiveIntensity: 0.3,
            transparent: true
        });
        const ghostMesh = new THREE.Mesh(geometry, material);
        ghostMesh.position.set(...positions[i]);
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

        const ghostLight = new THREE.PointLight(color, 1.5, 8);
        ghostLight.position.set(0, 0.5, 0);
        scene.add(ghostLight);

        scene.add(ghostMesh);
        ghosts.push({
            mesh: ghostMesh,
            light: ghostLight,
            velocity: new THREE.Vector3(),
            speed: 2,
            startPosition: positions[i].slice(),
            color: color,
            respawnTime: 0,
            immuneToPowerUp: false,
            aggroTimmer: 0 // for speedup when pacman sees it
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
    const pauseText = isPaused ? '<br><br><span style="color: #ffff00; font-weight: bold;">PAUSED - Press SPACE to resume</span>' : '';
    let totalPellets = pellets.length + powerUps.length;
    const gameOverText = gameOver && totalPellets !== 0 ? '<br><br><span style="color: #ff0000;">GAME OVER! Press R to restart</span>' : '';
    const winText = gameOver && totalPellets === 0 ? '<br><br><span style="color: #00ff00;">YOU WIN! Press R to restart</span>' : '';
    const cameraNames = ['', 'Top-Down', 'Third-Person', 'First-Person', 'Spectator'];
    const cameraText = `<br><span style="color: #888;">Camera: ${cameraNames[cameraMode]} (1-4) | SPACE to pause</span>`;
    const timeText = `<br><span style="color: #888;">Time: ${Math.floor(gameTime)}s</span>`;
    const fpText = cameraMode === 3 ? '<br><span style="color: #88ff88;">Click to enable mouse look | ESC to exit</span>' : '';
    hudElement.innerHTML = `
        Score: ${score}<br>
        Lives: ${lives}${cameraText}${timeText}<br>
        Pellets: ${pellets.length}<br>
        Power Ups: ${powerUps.length}<br>
        WASD/arrow keys to move${fpText}${powerUpText}${pauseText}${gameOverText}${winText}
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
    if (gameOver) { updateHUD(); return; }
    if (isPaused) return;

    gameTime += delta;
    
    // Decrement Global Adrenaline Timer (Pacman's timer)
    if (adrenalineTimer > 0) {
        adrenalineTimer -= delta;
    }

    const speedMultiplier = 1.2;
    ghosts.forEach(ghost => ghost.speed = baseGhostSpeed * speedMultiplier);

    if (pellets.length === 0 && powerUps.length === 0) {
        gameOver = true;
        updateHUD();
        return;
    }

    if (powerUpActive) {
        powerUpTimer -= delta;
        if (powerUpTimer <= 0) {
            powerUpActive = false;
            powerUpTimer = 0;
        }
        updateHUD();
    }

    updatePacman(delta);
    checkPelletCollection();
    checkPowerUpCollection();
    checkGhostCollisions();
    updateGhosts(delta); // This now handles setting the adrenalineTimer
    animatePellets();
    animatePowerUps(delta);
    updateCamera();

    updateHUD();
}

// pacman update
function updatePacman(delta) {
    let velocity = new THREE.Vector3(0, 0, 0);

    // --- PACMAN SPEED LOGIC ---
    // If adrenalineTimer > 0 (set by ghost seeing you), YOU run faster too
    let currentSpeed = (adrenalineTimer > 0) ? 9.0 : pacmanSpeed; 
    // --------------------------

    // Input Handling
    if (cameraMode !== 3) {
        if (keys['w'] || keys['arrowup']) velocity.z -= 1;
        if (keys['s'] || keys['arrowdown']) velocity.z += 1;
        if (keys['a'] || keys['arrowleft']) velocity.x -= 1;
        if (keys['d'] || keys['arrowright']) velocity.x += 1;
    } else {
        const forward = new THREE.Vector3();
        camera.getWorldDirection(forward);
        forward.y = 0; forward.normalize();
        const right = new THREE.Vector3();
        right.crossVectors(camera.up, forward).normalize();
        if (keys['w'] || keys['arrowup']) velocity.add(forward);
        if (keys['s'] || keys['arrowdown']) velocity.sub(forward);
        if (keys['a'] || keys['arrowleft']) velocity.sub(right);
        if (keys['d'] || keys['arrowright']) velocity.add(right);
    }
    
    // Movement Application
    if (velocity.length() > 0) {
        velocity.normalize().multiplyScalar(currentSpeed * delta);
        const newPos = pacman.position.clone().add(velocity);
        if (!checkWallCollision(newPos)) {
            pacman.position.copy(newPos);
        }
        if (cameraMode !== 3) {
            pacman.rotation.y = -Math.atan2(velocity.z, velocity.x);
        }
    }

    if (cameraMode === 3) pacman.rotation.y = cameraYaw + Math.PI; 
    
    // Visual Feedback
    if (adrenalineTimer > 0) {
        pacmanLight.color.setHex(0x00ffff); // Cyan = Adrenaline
        pacmanLight.intensity = 3;
    } else {
        pacmanLight.color.setHex(0xffff00);
        pacmanLight.intensity = 2;
    }
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
        ghost.mesh.material.color.setHex(ghost.color);
        ghost.mesh.material.emissive.setHex(ghost.color);
    });
    updateHUD();
}

function updateGhosts(delta) {
    ghosts.forEach((ghost, index) => {
        // 1. Manage Timers
        if (ghost.respawnTime > 0) ghost.respawnTime -= delta;
        if (ghost.aggroTimer > 0) ghost.aggroTimer -= delta;

        // 2. Visibility & Logic
        const distToPacman = ghost.mesh.position.distanceTo(pacman.position);
        
        // Check Line of Sight
        let canSeePacman = false;
        // Only check if alive and within reasonable range (optimization)
        if (ghost.respawnTime <= 0 && distToPacman < 20) {
            if (checkLineOfSight(ghost.mesh.position, pacman.position)) {
                canSeePacman = true;
                
                // --- THE TRIGGER ---
                // If eye contact is made:
                ghost.aggroTimer = 3.0; // 1. Ghost gets angry
                adrenalineTimer = 3.0;  // 2. Pacman gets scared (Global variable)
                // -------------------
            }
        }

        // 3. Visuals (Fading)
        const visibilityRange = 7;
        let opacity = 0;
        if (distToPacman <= visibilityRange) opacity = 1 - (distToPacman / visibilityRange) * 0.5;
        
        // Force visibility if Aggro (so you can see them chasing you from far away)
        if (ghost.aggroTimer > 0) opacity = Math.max(opacity, 1.0);

        ghost.mesh.visible = opacity > 0;
        ghost.mesh.material.opacity = opacity;
        ghost.light.intensity = opacity * 5;

        // 4. Color & State
        let currentSpeed = ghost.speed;
        let currentColor = ghost.color;

        if (ghost.respawnTime > 0) {
             const flash = Math.sin(Date.now() * 0.02) > 0;
             currentColor = flash ? 0xffffff : ghost.color;
        } 
        else if (powerUpActive && !ghost.immuneToPowerUp) {
            currentColor = 0x0000ff; // Vulnerable Blue
            currentSpeed *= 0.5; // Slow down when vulnerable
        } 
        else if (ghost.aggroTimer > 0) {
            currentColor = 0xff0000; // RED RAGE
            currentSpeed *= 2.5;     // 2.5x Speed Boost
        }

        ghost.mesh.material.color.setHex(currentColor);
        ghost.mesh.material.emissive.setHex(currentColor);
        ghost.light.color.setHex(currentColor);

        // 5. Movement Logic
        let direction;
        const isVulnerable = powerUpActive && !ghost.immuneToPowerUp;
        
        if (isVulnerable && ghost.respawnTime <= 0) {
            // Flee
            direction = new THREE.Vector3().subVectors(ghost.mesh.position, pacman.position).normalize();
        } else {
            // Chase
            direction = new THREE.Vector3().subVectors(pacman.position, ghost.mesh.position).normalize();
        }

        const movement = direction.clone().multiplyScalar(currentSpeed * delta);
        const newPos = ghost.mesh.position.clone().add(movement);

        // Bounds and Collision
        newPos.x = Math.max(-13, Math.min(13, newPos.x));
        newPos.z = Math.max(-13, Math.min(13, newPos.z));

        if (!checkWallCollision(newPos, 0.5)) {
            ghost.mesh.position.copy(newPos);
        } else {
            // Slide along X
            const slideX = ghost.mesh.position.clone(); slideX.x += movement.x;
            if (!checkWallCollision(slideX, 0.5)) {
                ghost.mesh.position.copy(slideX);
            } else {
                // Slide along Z
                const slideZ = ghost.mesh.position.clone(); slideZ.z += movement.z;
                if (!checkWallCollision(slideZ, 0.5)) {
                    ghost.mesh.position.copy(slideZ);
                } else {
                    // Random wiggle
                    const randomDir = new THREE.Vector3((Math.random()-0.5),0,(Math.random()-0.5)).normalize().multiplyScalar(ghost.speed*delta);
                    const randomPos = ghost.mesh.position.clone().add(randomDir);
                    if(!checkWallCollision(randomPos, 0.5)) ghost.mesh.position.copy(randomPos);
                }
            }
        }

        ghost.mesh.position.y = 0.5 + Math.sin(Date.now() * 0.003 + index) * 0.1;
        ghost.light.position.copy(ghost.mesh.position);
        ghost.light.position.y += 0.2;
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
