import * as THREE from 'three';
import { setScene } from './state.js';
import { setCamera } from './state.js';
import { setRenderer } from './state.js';
import { setClock } from './state.js';
import { setFloor } from './state.js';
import { setAmbientLight } from './state.js';
import { setDirectionalLight } from './state.js';
import { scene } from './state.js';
import { camera } from './state.js';
import { renderer } from './state.js';
import { clock } from './state.js';
import { createMaze } from './maze.js';
import { createTeleportZones } from './teleport.js';
import { createPacman } from './pacman.js';
import { createPellets } from './pellets.js';
import { createGhosts } from './ghosts.js';
import { setupInput } from './input.js';
import { createHUD, createStartScreen, showStartScreen, createMinimap } from './ui.js';
import { update } from './game.js';

function initSetup() {
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
}

function lightSetup() {
    const dirLight = new THREE.DirectionalLight(0x4a4a8a, 0.2);
    dirLight.position.set(20, 50, 20);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 100;
    dirLight.shadow.camera.left = -50;
    dirLight.shadow.camera.right = 50;
    dirLight.shadow.camera.top = 50;
    dirLight.shadow.camera.bottom = -50;
    scene.add(dirLight);
    setDirectionalLight(dirLight);    
}


function init() {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);
    scene.fog = new THREE.Fog(0x1a1a2e, 1, 25);
    // setScene(scene);
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 15, 15);
    camera.lookAt(0, 0, 0);


    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;


    document.body.appendChild(renderer.domElement);
    const ambientLight = new THREE.AmbientLight(0x1a1a3a, 0.1);
    scene.add(ambientLight);

    // audioSetup();
    setAmbientLight(ambientLight);
    setScene(scene);
    setCamera(camera);
    setRenderer(renderer);
    lightSetup();    
    const floorGeometry = new THREE.PlaneGeometry(30, 30);
    const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x2a2a3e });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);
    setFloor(floor);    
    initSetup();
    window.addEventListener('resize', onWindowResize);
    setClock(new THREE.Clock());
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}


function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    update(delta);
    renderer.render(scene, camera);
}


init();
animate();
