import * as THREE from 'three';
import { scene, pacman, ghosts, teleportZones, currentLevel } from './state.js';
import { lastTeleportTime, setLastTeleportTime, clearTeleportZones, addTeleportZone } from './state.js';
import { playTeleportSound } from './audio.js';

// credit to claude for the ideas on how to do the portal meshes, looks very clean
function portalSetup() {
    const portalGeometry = new THREE.CylinderGeometry(0.8, 0.8, 2, 32);
    const portalMaterial = new THREE.MeshStandardMaterial({
        color: 0x00ffff,
        emissive: 0x00ffff,
        emissiveIntensity: 0.8,
        transparent: true,
        opacity: 0.6
    });
    
    const leftPortal = new THREE.Mesh(portalGeometry, portalMaterial);
    leftPortal.position.set(-13, 1, 0);
    leftPortal.rotation.z = Math.PI / 2;
    
    const rightPortal = new THREE.Mesh(portalGeometry, portalMaterial.clone());
    rightPortal.position.set(13, 1, 0);
    rightPortal.rotation.z = Math.PI / 2;
    const ringGeometry = new THREE.TorusGeometry(1.2, 0.1, 16, 32);
    const ringMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.8
    });
    const leftRing = new THREE.Mesh(ringGeometry, ringMaterial.clone());
    leftRing.position.set(-13, 1, 0);
    leftRing.rotation.z = Math.PI / 2;
    const rightRing = new THREE.Mesh(ringGeometry, ringMaterial.clone());
    rightRing.position.set(13, 1, 0);
    rightRing.rotation.z = Math.PI / 2;

    scene.add(leftPortal);
    scene.add(leftRing);
    scene.add(rightPortal);
    scene.add(rightRing);
    
    addTeleportZone({
        mesh: leftPortal,
        ring: leftRing,
        position: new THREE.Vector3(-13, 0.5, 0),
        exitPosition: new THREE.Vector3(12, 0.5, 0),
        radius: 1.5
    });
    
    addTeleportZone({
        mesh: rightPortal,
        ring: rightRing,
        position: new THREE.Vector3(13, 0.5, 0),
        exitPosition: new THREE.Vector3(-12, 0.5, 0),
        radius: 1.5
    });
}


export function createTeleportZones() {

    teleportZones.forEach(zone => {
        if (zone.mesh) {
            scene.remove(zone.mesh);
        }
        
        if (zone.ring) {
            scene.remove(zone.ring);
        }
    });
    clearTeleportZones();
    
    if (currentLevel === 1) {
        return;
    }
    
    portalSetup();
}


export function animateTeleportZones(delta) {
    const time = Date.now() * 0.001;
    teleportZones.forEach((zone, index) => {
        if (zone.mesh) {

            zone.mesh.rotation.y += delta * 2;
            const pulse = Math.sin(time * 3 + index * Math.PI) * 0.2 + 1;
            zone.mesh.scale.set(pulse, 1, pulse);
        }
        
        if (zone.ring) {

            zone.ring.rotation.y -= delta * 3;
            const ringPulse = Math.sin(time * 4 + index * Math.PI) * 0.15 + 1;
            zone.ring.scale.setScalar(ringPulse);
            zone.ring.material.opacity = 0.5 + Math.sin(time * 5 + index * Math.PI) * 0.3;
        }
    });
}


export function checkTeleportation() {
    const currentTime = Date.now();
    const cooldownTime = 500; 
    
    teleportZones.forEach(zone => {
        const dist = pacman.position.distanceTo(zone.position);
        if (dist < zone.radius && (currentTime - lastTeleportTime) > cooldownTime) {
            
            pacman.position.copy(zone.exitPosition);
            setLastTeleportTime(currentTime);
            playTeleportSound();  
            if (zone.mesh) {
                zone.mesh.material.emissiveIntensity = 2.0;
                setTimeout(() => {
                    if (zone.mesh) zone.mesh.material.emissiveIntensity = 0.8;
                }, 200);
            }
            
            pacman.scale.set(0.5, 0.5, 0.5);
            setTimeout(() => {
                pacman.scale.set(1, 1, 1);
            }, 100);
        }
    });
    
    // ghosts.forEach(ghost => {
    //     if (!ghost.lastTeleportTime) {
    //         ghost.lastTeleportTime = 0;
    //     }
        
    //     teleportZones.forEach(zone => {
    //         const dist = ghost.mesh.position.distanceTo(zone.position);
    //         if (dist < zone.radius && (currentTime - ghost.lastTeleportTime) > cooldownTime) {
    //             ghost.mesh.position.copy(zone.exitPosition);
    //             ghost.lastTeleportTime = currentTime;
    //         }
    //     });
    // });
}
