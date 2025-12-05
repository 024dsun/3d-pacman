# 3D Horror Pacman

A 3D horror-themed Pacman game built with Three.js for CS174A.

**Team:** David, Aditya, Justice

## Quick Start

```bash
npm install
npx vite
```

Open http://localhost:5173

## Controls

| Key           | Action       |
| ------------- | ------------ |
| WASD / Arrows | Move         |
| 1-4           | Camera modes |
| Space         | Pause        |
| R             | Restart      |

## Features

- 3D maze with horror atmosphere
- 4 ghosts with custom chase/flee behavior
- Power-ups (ghosts turn blue, can eat them)
- Difficulty scaling (ghosts speed up over time)
- Multiple camera views
- Score, lives, win/lose conditions
- Jumpscare sound and overlay
- Heartbeat sound
- Ghost sound

## Files

```
src/
├── main.js       - main game start file
├── state.js      - game state variables and functions
├── game.js       - game loop
├── ghosts.js     - ghost AI
├── pacman.js     - player movement
├── pellets.js    - pellets/powerups
├── maze.js       - wall layouts
├── collision.js  - collision detection
├── camera.js     - camera modes
├── input.js      - keyboard/mouse
├── effects.js    - particles, shake
├── teleport.js   - portals
├── meshes.js     - 3D models
├── audio.js      - sound effects
└── ui.js         - HUD, menus
```

- `index.html` - Entry point
- `style-minimal.css` - Basic styles

## CS174A Topics

- Collision detection
- Lighting (ambient, directional, point)
- Shadow mapping
- Matrix transformations
- User input handling
- Basic AI
- Custom meshes
