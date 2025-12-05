import * as THREE from 'three';
import { walls } from './state.js';

// Collision detection for walls
export function checkWallCollision(position, radius = 0.5) {
    for (let wall of walls) {
        const wallBox = new THREE.Box3().setFromObject(wall);

        const doubleRadius = radius * 2;
        const radiusVec = new THREE.Vector3(doubleRadius, doubleRadius, doubleRadius);

        if (wallBox.intersectsBox(new THREE.Box3().setFromCenterAndSize(position,radiusVec))) {
            return true;
        }
    }
    return false;
}

// collision detection for pellets
export function checkWallCollisionSimple(position) {
    for (let wall of walls) {
        const wallBox = new THREE.Box3().setFromObject(wall);
        if (wallBox.containsPoint(position)) {
            return true;
        }
    }
    return false;
}
