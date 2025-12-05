import { keys, renderer, gameOver, isPaused, cameraMode, isPointerLocked, setCameraMode, setIsPaused, setCameraYaw, setCameraPitch, setIsPointerLocked, cameraYaw, cameraPitch } from './state.js';
import { updateHUD } from './ui.js';

export function setupInput() {
    window.addEventListener('keydown', (e) => {
        let pressedKey = e.key.toLowerCase();
        keys[pressedKey] = true;


        
        // 1 is top down
        // 2 is third person
        // 3 is first person
        // 4 is spectator
        // lock to mouse pointer if first person
        if (pressedKey >= '1' && pressedKey <= '4') {
            setCameraMode(parseInt(pressedKey));
            if (parseInt(pressedKey) === 3) {
                renderer.domElement.requestPointerLock();
            } else {
                document.exitPointerLock();
            }
            updateHUD();
        }
        if (e.key === ' ') {
            e.preventDefault();
            if (!gameOver) {
                setIsPaused(!isPaused);
                updateHUD();
            }
        }
        if (pressedKey === 'r' && gameOver) {
            location.reload();
        }
    });
    
    window.addEventListener('keyup', (e) => {
        let releasedKey = e.key.toLowerCase();
        keys[releasedKey] = false;
    });

    // console.log(keys);
    
    document.addEventListener('mousemove', (e) => {
        if (cameraMode === 3 && document.pointerLockElement === renderer.domElement) {
            const sensitivity = 0.002;
            setCameraYaw(cameraYaw + e.movementX * sensitivity);
            let pitch = cameraPitch - e.movementY * sensitivity;


            pitch = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, pitch));
            setCameraPitch(pitch);
        }
    });
    
    document.addEventListener('pointerlockchange', () => {
        setIsPointerLocked(document.pointerLockElement === renderer.domElement);
    });
    
    renderer.domElement.addEventListener('click', () => {
        if (cameraMode === 3 && !isPointerLocked) {
            renderer.domElement.requestPointerLock();
        }
    });
}
