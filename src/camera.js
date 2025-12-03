import { 
    scene, camera, pacman, cameraMode, cameraYaw, cameraPitch 
} from './state.js';

// Update camera based on mode
export function updateCamera() {
    const pacPos = pacman.position;
    
    switch (cameraMode) {
        // Top down
        case 1:
            camera.position.set(pacPos.x, 30, pacPos.z);
            camera.lookAt(pacPos.x, 0, pacPos.z);
            scene.fog.near = 10;
            scene.fog.far = 45;
            break;
        // Third person (following pacman)
        case 2:
            camera.position.x = pacPos.x;
            camera.position.y = 15;
            camera.position.z = pacPos.z + 15;
            camera.lookAt(pacPos.x, 0, pacPos.z);
            scene.fog.near = 3;
            scene.fog.far = 30;
            break;
        // First person with mouse look
        case 3:
            camera.position.set(pacPos.x, 1.5, pacPos.z);
            // Use mouse yaw/pitch for camera direction
            const lookX = Math.cos(cameraYaw) * Math.cos(cameraPitch);
            const lookY = Math.sin(cameraPitch);
            const lookZ = Math.sin(cameraYaw) * Math.cos(cameraPitch);
            camera.lookAt(
                pacPos.x + lookX,
                1.5 + lookY,
                pacPos.z + lookZ
            );
            scene.fog.near = 1;
            scene.fog.far = 25;
            break;
        // Spectator (static overview)
        case 4:
            camera.position.set(0, 40, 20);
            camera.lookAt(0, 0, 0);
            scene.fog.near = 15;
            scene.fog.far = 55;
            break;
        // Default mode 2
        default:
            camera.position.x = pacPos.x;
            camera.position.z = pacPos.z + 15;
            camera.lookAt(pacPos.x, 0, pacPos.z);
            scene.fog.near = 3;
            scene.fog.far = 30;
    }
}
