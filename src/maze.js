import * as THREE from 'three';
import { scene, walls, currentLevel, addWall, clearWalls } from './state.js';

// Get maze layout based on level
export function getMazeLayout(level) {
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
            
            // horizontal walls
            [-8 , 0, -10, 5, wallHeight, 1],
            [2, 0, -6, 4, wallHeight, 1],
            [-12, 0, -2, 5, wallHeight, 1],
            [4, 0, -2, 8, wallHeight, 1],
            [-6, 0, 2, 6, wallHeight, 1],
            [4, 0, 2, 6, wallHeight, 1],
            [-10, 0, 6, 4, wallHeight, 1],
            [8, 0, 6, 5, wallHeight, 1],
            [-8, 0, 10, 9, wallHeight, 1],
            [4, 0, 10, 5, wallHeight, 1],
            
            // vertical walls
            [-10, 0, -4, 1, wallHeight, 8],
            [-6, 0, -8, 1, wallHeight, 10],
            [-2, 0, -12, 1, wallHeight, 4],
            [-2, 0, 4, 1, wallHeight, 8],
            [2, 0, -8, 1, wallHeight, 6],
            [2, 0, 4, 1, wallHeight, 12],
            [6, 0, -11, 1, wallHeight, 4],
            [6, 0, 8, 1, wallHeight, 4],
            [10, 0, -4, 1, wallHeight, 8],
            [10, 0, 8, 1, wallHeight, 4]
        ];
    } else if (level === 3) {
        // Level 3: Complex winding maze (with teleport gaps)
        return [
            // Outer walls with teleport gaps
            // [0, 0, -14, 30, wallHeight, 1],
            // [0, 0, 14, 30, wallHeight, 1],
            // [-14, 0, -8, 1, wallHeight, 12],
            // [-14, 0, 8, 1, wallHeight, 12],
            // [14, 0, -8, 1, wallHeight, 12],
            // [14, 0, 8, 1, wallHeight, 12],
            
            // // Create winding S-shaped corridors
            // // Top section
            // [-10, 0, -10, 8, wallHeight, 1],
            // [6, 0, -10, 12, wallHeight, 1],
            // [-8, 0, -8, 1, wallHeight, 4],
            // [4, 0, -8, 1, wallHeight, 4],
            // [10, 0, -6, 1, wallHeight, 8],
            
            // // Upper middle
            // [-12, 0, -6, 4, wallHeight, 1],
            // [-4, 0, -6, 1, wallHeight, 6],
            // [2, 0, -6, 10, wallHeight, 1],
            // [-10, 0, -2, 1, wallHeight, 8],
            // [6, 0, -4, 1, wallHeight, 4],
            
            // // Lower middle
            // [-12, 0, 2, 6, wallHeight, 1],
            // [0, 0, 2, 8, wallHeight, 1],
            // [-8, 0, 4, 1, wallHeight, 4],
            // [2, 0, 4, 1, wallHeight, 8],
            // [10, 0, 2, 1, wallHeight, 4],
            
            // // Bottom section
            // [-10, 0, 6, 1, wallHeight, 8],
            // [-4, 0, 6, 8, wallHeight, 1],
            // [8, 0, 6, 8, wallHeight, 1],
            // [-6, 0, 8, 1, wallHeight, 4],
            // [4, 0, 8, 1, wallHeight, 4],
            // [-10, 0, 10, 8, wallHeight, 1],
            // [6, 0, 10, 12, wallHeight, 1],
        ];
    }
    
    return [];
}

// Create maze walls
export function createMaze() {
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
    // Create wall meshes
    positions.forEach(([x, y, z, w, h, d]) => {
        const geometry = new THREE.BoxGeometry(w, h, d);
        const wall = new THREE.Mesh(geometry, wallMaterial);
        wall.position.set(x, h/2, z);
        wall.castShadow = true;
        wall.receiveShadow = true;
        // Edge glow
        const edges = new THREE.EdgesGeometry(geometry);
        const lineMaterial = new THREE.LineBasicMaterial({
            color: edgeColor,
            transparent: true,
            opacity: 0.4
        });
        const wireframe = new THREE.LineSegments(edges, lineMaterial);
        wall.add(wireframe);
        // Add to scene
        scene.add(wall);
        addWall(wall);
    });
}

// Clear existing maze
export function clearMaze() {
    walls.forEach(wall => scene.remove(wall));
    clearWalls();
}
