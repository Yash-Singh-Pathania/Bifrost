# Brand Brief

Design guidelines for Bifrost logo and brand identity.

## Product Overview

Bifrost is a semantic video search engine. Users import videos and search for moments by meaning rather than keywords. The name references the rainbow bridge in Norse mythology—connecting users with the exact moment they're looking for.

## Brand Context

The application uses a dark glassmorphism design inspired by visionOS. The UI features frosted glass panels, spatial floating elements, and Apple Silicon optimizations. This modern aesthetic should be reflected in the brand identity.

Current color palette:
- Background: #0A0A0A (near black)
- Text: #FFFFFF (white)
- Borders: rgba(255, 255, 255, 0.12)
- Accents: #0A84FF (blue), #FF453A (red), #32D74B (green)

## Logo Direction

### Concept Areas to Explore

1. Abstract Bridge / Arc
   - Minimal geometric path connecting two points
   - References the Bifrost bridge from mythology
   - Scalable to small sizes (favicon)

2. Prism / Light Refraction
   - Light entering and splitting into searchable moments
   - Represents how Bifrost breaks video into indexed segments
   - Rainbow gradient potential

3. Lettermark
   - Sharp, geometric "B" character
   - Works as standalone icon and app badge
   - Clear at 16x16 pixel size

4. Search + Video Hybrid
   - Abstract combination of play button or film frame with search lens
   - Minimalist line-based design
   - Subtle geometry

### Design Constraints

Scaling Requirements:
- 16x16 px (favicon)
- 32x32 px (browser tab)
- 128x128 px (app icon)
- 512x512 px (DMG icon)
- 1024x1024 px (marketing/print)
- Large format (website hero, presentation)

Technical Requirements:
- Must work as macOS app icon (rounded square / squircle mask)
- Must be recognizable in monochrome
- Must work on both light and dark backgrounds
- Should maintain clarity at small sizes
- Works at any color

Style Preferences:
- Modern, minimal aesthetic
- Geometric rather than organic
- Fits with glassmorphism UI design
- Professional (not playful)

## Color Palette

The logo can introduce a brand accent color to use throughout the UI.

### Options

1. Rainbow Gradient
   - References Bifrost name directly
   - Use subtle gradient or full spectrum
   - Modern and friendly

2. Single Accent
   - Cool blue (#0A84FF) — tech, search
   - Warm amber/gold — bridge, connection
   - Purple — AI, future-forward
   - Cyan — modern, tech-forward

3. Iridescent
   - Shimmer effect based on angle
   - Sophisticated, premium feel
   - Works in motion graphics

## Deliverables

Required assets for implementation:

- App icon (1024x1024 PNG, will be masked to squircle for macOS)
- Favicon (multiple sizes: 16x16, 32x32, 64x64)
- Logo mark (standalone symbol, SVG preferred)
- Wordmark (Bifrost text treatment, SVG)
- Brand color hex code(s)
- Icon set for UI (optional: standard icons in brand style)

## File Formats

- SVG for vector assets (scales infinitely)
- PNG for raster (1024x1024 minimum)
- Include both colored and monochrome versions

## Implementation Plan

After logo delivery:

1. Replace placeholder icon in build/icon.icns
2. Update DMG background with brand colors
3. Add favicon to docs/ site
4. Update brand colors in CSS variables
5. Incorporate into marketing materials
6. Add to GitHub repository

## Brand Personality

The brand should feel:
- Professional and trustworthy
- Modern and forward-thinking
- Precise and focused
- Accessible and open-source

Not:
- Playful or cartoonish
- Overly complicated
- Dark or intimidating
- Corporate or stiff

## Reference Style

Look for inspiration in:
- macOS app icons (minimalist, geometric)
- Technology companies (clean, modern)
- Bridge architecture (strength, connection)
- Light/prism imagery (clarity, revelation)

Avoid:
- Complex gradients (won't scale)
- Too many colors (confusing at small sizes)
- Shadows/3D effects (looks dated)
- Photography or realistic imagery

## Questions for Designer

1. Does the logo work equally well at 16x16 and 1024x1024?
2. Is it distinctive enough to stand alone?
3. Does it feel aligned with the glassmorphism UI?
4. What accent color would you recommend?
5. Should it reference the "Bifrost" name visually?

## Timeline

- Design iterations: TBD
- Feedback rounds: TBD
- Final delivery: TBD
- Implementation: After delivery
