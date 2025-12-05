import * as THREE from 'three';

// aditya the goat for creating pacman meshes
export function createPacmanMesh(radius = 0.5) {
    const group = new THREE.Group();
    const bodyGeo = new THREE.SphereGeometry(radius, 16, 16);
    const bodyMat = new THREE.MeshStandardMaterial({ 
        color: 0xffff00,
        emissive: 0xffff00,
        emissiveIntensity: 0.4
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.castShadow = true;
    group.add(body);
    const eyeGeo = new THREE.SphereGeometry(0.1, 8, 8);
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0x000000 });
    const eye = new THREE.Mesh(eyeGeo, eyeMat);
    eye.position.set(0.15, 0.2, 0.35);
    eye.castShadow = true;
    group.add(eye);
    

    const highGeo = new THREE.SphereGeometry(0.03, 4, 4);
    const highMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const high = new THREE.Mesh(highGeo, highMat);
    high.position.set(0.18, 0.22, 0.38);
    group.add(high);
    
    return group;
}


// ghost mesh
// assisted by ai + online videos
export function createGhostMesh(size = 0.5, color = 0xff0000) {
    const group = new THREE.Group();
    

    const mat = new THREE.MeshStandardMaterial({ 
        color: color,
        emissive: color,
        emissiveIntensity: 0.3
    });
    

    const topGeo = new THREE.SphereGeometry(size, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    const top = new THREE.Mesh(topGeo, mat);
    top.position.y = 0.25;
    top.castShadow = true;
    group.add(top);
    

    const midGeo = new THREE.CylinderGeometry(size, size, size * 0.6, 12);
    const mid = new THREE.Mesh(midGeo, mat);
    mid.position.y = -0.05;
    mid.castShadow = true;
    group.add(mid);
    
    for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI * 2;
        const waveGeo = new THREE.SphereGeometry(size * 0.3, 6, 6);
        const wave = new THREE.Mesh(waveGeo, mat);
        wave.position.x = Math.cos(angle) * size * 0.6;
        wave.position.y = -0.4;
        wave.position.z = Math.sin(angle) * size * 0.6;
        wave.castShadow = true;
        group.add(wave);
    }
    
    const eyeGeo = new THREE.SphereGeometry(0.15, 8, 8);
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.2, 0.25, 0.3);
    leftEye.castShadow = false; 
    group.add(leftEye);
    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);

    rightEye.position.set(0.2, 0.25, 0.3);
    rightEye.castShadow = false;
    group.add(rightEye);
    
    const pupilGeo = new THREE.SphereGeometry(0.08, 6, 6);
    const pupilMat = new THREE.MeshStandardMaterial({ color: 0x000088 });
    const pupilZ = 0.12;

    const leftPupil = new THREE.Mesh(pupilGeo, pupilMat);
    leftPupil.position.set(0, 0, pupilZ);
    leftEye.add(leftPupil);
    const rightPupil = new THREE.Mesh(pupilGeo, pupilMat);
    rightPupil.position.set(0, 0, pupilZ);
    rightEye.add(rightPupil);
    
    group.userData.bodyMaterial = mat;
    group.userData.leftEye = leftEye;
    group.userData.rightEye = rightEye;
    
    return group;
}

export function updateGhostEyes(ghostMesh, targetPosition) {
    const leftEye = ghostMesh.userData.leftEye;
    const rightEye = ghostMesh.userData.rightEye;
    
    if (!leftEye || !rightEye) {
        return;
    }
    
    leftEye.lookAt(targetPosition);
    rightEye.lookAt(targetPosition);
}
