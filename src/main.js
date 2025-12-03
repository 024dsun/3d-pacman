import * as THREE from 'three';
import { 
    setScene, setCamera, setRenderer, setClock, setFloor,
    scene, camera, renderer, clock
} from './state.js';
import { createMaze } from './maze.js';
import { createTeleportZones } from './teleport.js';
import { createPacman } from './pacman.js';
import { createPellets } from './pellets.js';
import { createGhosts } from './ghosts.js';
import { setupInput } from './input.js';
import { createHUD, createStartScreen, showStartScreen, createMinimap } from './ui.js';
import { update } from './game.js';

// Initialize game
function init() {
    // Scene setup
    const newScene = new THREE.Scene();
    newScene.background = new THREE.Color(0x1a1a2e);
    // Fog for horror atmosphere
    newScene.fog = new THREE.Fog(0x1a1a2e, 1, 25);
    setScene(newScene);
    
    // Camera
    const newCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    newCamera.position.set(0, 15, 15);
    newCamera.lookAt(0, 0, 0);
    setCamera(newCamera);
    
    // Renderer
    const newRenderer = new THREE.WebGLRenderer({ antialias: true });
    newRenderer.setSize(window.innerWidth, window.innerHeight);
    newRenderer.shadowMap.enabled = true;
    document.body.appendChild(newRenderer.domElement);
    setRenderer(newRenderer);
    
    // Lights
    const ambientLight = new THREE.AmbientLight(0x6060a0, 0.5);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = true;
    scene.add(dirLight);
    
    // Floor
    const floorGeometry = new THREE.PlaneGeometry(30, 30);
    const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x2a2a3e });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);
    setFloor(floor);
    
    // Create game objects
    createMaze();
    createTeleportZones();
    createPacman();
    createPellets();
    createGhosts();
    setupInput();
    createHUD();
    createMinimap();
    createStartScreen();
    showStartScreen();
    
    // Window resize handler
    window.addEventListener('resize', onWindowResize);
    
    // Clock
    setClock(new THREE.Clock());
}

// Window resize handler
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    update(delta);
    renderer.render(scene, camera);
}

// Start game
init();
animate();
