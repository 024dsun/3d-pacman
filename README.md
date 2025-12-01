# 3D Horror Pacman

A 3D horror-themed Pacman game built with Three.js for CS174A.

## Quick Start

```bash
npm install
npm run dev
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

- 3D maze with fog atmosphere
- 4 ghosts with chase/flee AI
- Power-ups (ghosts turn blue, can eat them)
- Difficulty scaling (ghosts speed up over time)
- Multiple camera views
- Score, lives, win/lose conditions

## Files

- `game-functional.js` - All game logic
- `index.html` - Entry point
- `style-minimal.css` - Basic styles

## CS174A Topics

- Collision detection
- Lighting (ambient, directional, point)
- Shadow mapping
- Matrix transformations
- User input handling
- Basic AI
