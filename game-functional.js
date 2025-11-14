import * as THREE from 'three';

// this version is the demo version
// features implemented are as below
// - maze generation
// - pacman movement
// - ghost movement
// - pellet collection
// - power-up collection
// - ghost AI (advanced)
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
let powerUpActive = false
let powerUpTimer = 0;
let keys = {};
let hudElement;

// camera mode: 1 - top down, 2 - third person, 3 - first person, 4 - spectator
let cameraMode = 2;

// initialize game
function init() {
    // scene setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);
    // camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 15, 15);
    camera.lookAt(0, 0, 0); 
    // renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    document.body.appendChild(renderer.domElement);
    // lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
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
            const testPos = new THREE.Vector3(x, 0.5, z);
            if (!checkWallCollisionSimple(testPos)) {
                const pellet = new THREE.Mesh(pelletGeometry, pelletMaterial);
                pellet.position.set(x, 0.5, z);
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
            emissiveIntensity: 0.3
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
        scene.add(ghostMesh);
        ghosts.push({
            mesh: ghostMesh,
            velocity: new THREE.Vector3(),
            speed: 2,
            startPosition: positions[i].slice(),
            color: color,
            respawnTime: 0,
            immuneToPowerUp: false
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
    let totalPellets = pellets.length + powerUps.length;
    const gameOverText = gameOver && totalPellets !== 0 ? '<br><br><span style="color: #ff0000;">GAME OVER! Press R to restart</span>' : '';
    const winText = gameOver && totalPellets === 0 ? '<br><br><span style="color: #00ff00;">YOU WIN! Press R to restart</span>' : '';
    const cameraNames = ['', 'Top-Down', 'Third-Person', 'First-Person', 'Spectator'];
    const cameraText = `<br><span style="color: #888;">Camera: ${cameraNames[cameraMode]} (1-4)</span>`;
    hudElement.innerHTML = `
        Score: ${score}<br>
        Lives: ${lives}${cameraText}<br>
        Pellets: ${pellets.length}<br>
        Power Ups: ${powerUps.length}<br>
        WASD/arrow keys to move${powerUpText}${gameOverText}${winText}
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
    // check win condition - all pellets collected
    if (pellets.length === 0 && powerUps.length === 0) {
        gameOver = true;
        updateHUD();
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
    checkPelletCollection();
    checkPowerUpCollection();
    checkGhostCollisions();
    updateGhosts(delta);
    animatePellets();
    animatePowerUps(delta);
    updateCamera();
}

// pacman update
function updatePacman(delta) {
    const velocity = new THREE.Vector3(0, 0, 0);
    // check valid keys for movement
    if (keys['w'] || keys['arrowup']) velocity.z -= 1;
    if (keys['s'] || keys['arrowdown']) velocity.z += 1;
    if (keys['a'] || keys['arrowleft']) velocity.x -= 1;
    if (keys['d'] || keys['arrowright']) velocity.x += 1;
    // update pacman position
    if (velocity.length() > 0) {
        velocity.normalize().multiplyScalar(pacmanSpeed * delta);
        const newPos = pacman.position.clone().add(velocity);
        if (!checkWallCollision(newPos)) {
            pacman.position.copy(newPos);
        }
        // rotate to face movement
        const angle = Math.atan2(velocity.z, velocity.x);
        pacman.rotation.y = angle;
        // TODO: mouth animation
        // pacmanMouthAngle += delta * 8;
        // const mouthScale = 1 + Math.sin(pacmanMouthAngle) * 0.1;
        // pacman.scale.set(mouthScale, 1, 1);
    }
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

// ghost update
function updateGhosts(delta) {
    ghosts.forEach((ghost, index) => {
        // update respawn timer
        if (ghost.respawnTime) {
            ghost.respawnTime -= delta;
            if (ghost.respawnTime < 0) ghost.respawnTime = 0;
        }
        // change color
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
        // determine movement direction based on vulnerability
        let direction;
        const isVulnerable = powerUpActive && !ghost.immuneToPowerUp;
        // run from pacman
        if (isVulnerable && ghost.respawnTime <= 0) {
            direction = new THREE.Vector3()
                .subVectors(ghost.mesh.position, pacman.position)
                .normalize();
        } 
        // chase pacman
        else {
            direction = new THREE.Vector3()
                .subVectors(pacman.position, ghost.mesh.position)
                .normalize();
        }
        const movement = direction.clone().multiplyScalar(ghost.speed * delta);
        const newPos = ghost.mesh.position.clone().add(movement);
        // keep within bounds
        newPos.x = Math.max(-13, Math.min(13, newPos.x));
        newPos.z = Math.max(-13, Math.min(13, newPos.z));
        // wall sliding
        if (!checkWallCollision(newPos, 0.5)) {
            ghost.mesh.position.copy(newPos);
        } else {
            const slideX = ghost.mesh.position.clone();
            slideX.x += movement.x;
            if (!checkWallCollision(slideX, 0.5)) {
                ghost.mesh.position.copy(slideX);
            } else {
                const slideZ = ghost.mesh.position.clone();
                slideZ.z += movement.z;
                if (!checkWallCollision(slideZ, 0.5)) {
                    ghost.mesh.position.copy(slideZ);
                } else {
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
        // bob animation
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
        // first person
        case 3:
            camera.position.set(pacPos.x, 2, pacPos.z);
            const lookDir = new THREE.Vector3(
                Math.cos(pacman.rotation.y),
                0,
                Math.sin(pacman.rotation.y)
            );
            camera.lookAt(
                pacPos.x + lookDir.x * 2,
                1,
                pacPos.z + lookDir.z * 2
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
