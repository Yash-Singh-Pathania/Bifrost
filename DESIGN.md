# Bifrost Spatial Design System (visionOS aesthetic)

This document outlines the core design language for Bifrost. The UI is heavily inspired by Apple’s visionOS and the broader "Spatial Computing" paradigm, adapted for a macOS Electron environment.

## 1. Core Philosophy
- **Immersive Content First:** The primary content (the video) stretches full-bleed across the entire display. There are no chrome toolbars or solid sidebars cutting into the media.
- **Physical "Glass" Materials:** The UI is constructed of virtual panes of glass that float in Z-space above the content.
- **Spatial Ornaments:** Controls and navigation are not constrained to fixed regions (like traditional sidebars or headers). Instead, they exist as floating "ornaments" that intelligently reveal themselves (like the auto-hiding dock) or slide in from the edges.

## 2. Technical Window Foundations
To achieve a true physical glass feeling, the app bypasses standard CSS backgrounds in favor of macOS hardware rendering:
- **Frameless Window:** Native OS titlebars and borders are removed (`frame: false`). Custom traffic lights define window controls.
- **Physical Transparency:** The Electron window is completely transparent (`transparent: true`, `#00000000`).
- **macOS Vibrancy:** The OS renders a hardware-accelerated blur of the underlying desktop wallpaper *through* the application (`vibrancy: 'fullscreen-ui'`).

## 3. Material System & Depth
The UI uses custom CSS properties to emulate frosted glass with physical depth.

### "Dark Glass" Specs
- **Background Base:** `rgba(30, 30, 30, 0.45)` — provides enough contrast for text without obscuring the vibrancy.
- **Blur & Saturation:** `backdrop-filter: blur(40px) saturate(200%)` — diffuses the background heavily while boosting color to prevent washing out.
- **Thickness Bevel:** An inner top-shadow (`inset 0 1px 0 rgba(255, 255, 255, 0.2)`) and a delicate white outline (`border: 1px solid rgba(255, 255, 255, 0.12)`) gives the glass a physical "edge" that catches the light.
- **Z-Axis Drop Shadow:** Harsh, diffused drop shadows separate the layers from the video `box-shadow: 0 24px 48px rgba(0, 0, 0, 0.3)`.

## 4. Typography & Vibrancy hierarchy
Bifrost strictly uses **white text** layered with varying optical opacities. We rely on the physical alpha channel rather than hardcoded hex grays so the text dynamically inherits the correct tint from the shifting video background beneath the glass.

- **Font:** San Francisco (`-apple-system, BlinkMacSystemFont, "SF Pro Display"`)
- **Primary:** `#FFFFFF` (100% — Titles, Active States, Values)
- **Secondary:** `rgba(255, 255, 255, 0.55)` (55% — Body text, inactive icons, labels)
- **Muted (Tertiary):** `rgba(255, 255, 255, 0.3)` (30% — Hints, placeholder text, disabled states)

## 5. Ergonomics & Geometry
Inspired by the visionOS 60pt ergonomic rules, interactive items focus on large hit-zones and pill-shapes.
- **Pill Radii:** The Search input and Ornaments use maximum border rounding (`border-radius: 9999px`) to match macOS Spotlight and visionOS toggles.
- **Container Radii:** Standard panels use `24px` (`var(--radius-xl)`).
- **Nested Radii:** Child elements perfectly calculate their radius to sit seamlessly inside their parent containers using `12px` or `18px`.

## 6. Interactive Physics
The application must feel highly responsive and tactile when touched by the mouse.
- **Hover States:** Elements glow physically with increased opacity and slightly scale upwards (`transform: scale(1.01)` or `transform: translateZ(10px)`).
- **Active States:** When clicked, items physically depress (`transform: scale(0.98)`).
- **Easing Curve:** All transitions utilize Apple's signature spring-like cubic-bezier: `transition: all 0.4s cubic-bezier(0.2, 0, 0, 1)`.

## 7. Component Layering Architecure
Because the app ditches CSS flexbox/grids at the top-level, everything must exist in an explicit Z-Layer:
- **`z-index: 0` (Base):** Immersive Video (takes 100% of the screen).
- **`z-index: 50` (Layer 1):** Sliding Glass Panels (`Left`: Library, `Right`: Search & Timeline).
- **`z-index: 100` (Layer 2):** Floating Ornaments (Bottom Toolbar Dock, Top-Left Logo).
- **`z-index: 500` (Modals):** Full-screen overlays like Settings.
