# Flows Canvas

An infinite whiteboarding canvas built with React and the HTML canvas API. Create, move, resize, and edit cards on an endlessly pannable and zoomable surface that feels at home on modern design tools.

## Getting started

```bash
npm install
npm run dev
```

The development server starts on [http://localhost:5173](http://localhost:5173). The project is scaffolded with Vite, so hot-module reloading is enabled by default.

## Available scripts

```bash
npm run dev      # start the local dev server
npm run build    # bundle the production build
npm run preview  # preview the production build locally
```

## Keyboard & pointer shortcuts

| Shortcut | Action |
| --- | --- |
| `C` | Add a new card at the viewport center |
| `Backspace` | Delete the active card |
| `Space` + drag | Pan the canvas |
| Mouse wheel / trackpad scroll | Zoom in or out (zoom focuses on the pointer) |
| Double-click a card | Edit its contents |

## Features

- Infinite pan & zoom with pointer-centric zooming for precise navigation.
- Smooth card dragging with automatic layering so the active card comes to the front.
- Resizable cards with smart text wrapping and auto-growing height while typing.
- Canvas grid that scales with zoom for spatial orientation.
- Floating action button for quick card creation and keyboard-friendly controls.
