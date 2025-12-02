import { 
    keys, renderer, gameOver, isPaused, cameraMode, isPointerLocked,
    setCameraMode, setIsPaused, setCameraYaw, setCameraPitch, setIsPointerLocked,
    cameraYaw, cameraPitch
} from './state.js';
import { updateHUD } from './ui.js';

// Setup input handlers
export function setupInput() {
    window.addEventListener('keydown', (e) => {
        let pressedKey = e.key.toLowerCase();
        keys[pressedKey] = true;
        
        // Camera mode switching (1-4 keys)
        if (pressedKey >= '1' && pressedKey <= '4') {
            setCameraMode(parseInt(pressedKey));
            // Request pointer lock for first person mode
            if (parseInt(pressedKey) === 3) {
                renderer.domElement.requestPointerLock();
            } else {
                document.exitPointerLock();
            }
            updateHUD();
        }
        
        // Pause game
        if (e.key === ' ') {
            e.preventDefault();
            if (!gameOver) {
                setIsPaused(!isPaused);
                updateHUD();
            }
        }
        
        // Restart game
        if (pressedKey === 'r' && gameOver) {
            location.reload();
        }
    });
    
    window.addEventListener('keyup', (e) => {
        let releasedKey = e.key.toLowerCase();
        keys[releasedKey] = false;
    });
    
    // Mouse movement for first person camera
    document.addEventListener('mousemove', (e) => {
        if (cameraMode === 3 && document.pointerLockElement === renderer.domElement) {
            const sensitivity = 0.002;
            setCameraYaw(cameraYaw + e.movementX * sensitivity);
            let newPitch = cameraPitch - e.movementY * sensitivity;
            // Clamp pitch to avoid flipping
            newPitch = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, newPitch));
            setCameraPitch(newPitch);
        }
    });
    
    // Pointer lock change handler
    document.addEventListener('pointerlockchange', () => {
        setIsPointerLocked(document.pointerLockElement === renderer.domElement);
    });
    
    // Click to enter first person mode
    renderer.domElement.addEventListener('click', () => {
        if (cameraMode === 3 && !isPointerLocked) {
            renderer.domElement.requestPointerLock();
        }
    });
}
