---
name: Prism Logic
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#424754'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#727785'
  outline-variant: '#c2c6d6'
  surface-tint: '#005ac2'
  primary: '#0058be'
  on-primary: '#ffffff'
  primary-container: '#2170e4'
  on-primary-container: '#fefcff'
  inverse-primary: '#adc6ff'
  secondary: '#6b38d4'
  on-secondary: '#ffffff'
  secondary-container: '#8455ef'
  on-secondary-container: '#fffbff'
  tertiary: '#994100'
  on-tertiary: '#ffffff'
  tertiary-container: '#c05400'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d8e2ff'
  primary-fixed-dim: '#adc6ff'
  on-primary-fixed: '#001a42'
  on-primary-fixed-variant: '#004395'
  secondary-fixed: '#e9ddff'
  secondary-fixed-dim: '#d0bcff'
  on-secondary-fixed: '#23005c'
  on-secondary-fixed-variant: '#5516be'
  tertiary-fixed: '#ffdbca'
  tertiary-fixed-dim: '#ffb690'
  on-tertiary-fixed: '#341100'
  on-tertiary-fixed-variant: '#783200'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '800'
    lineHeight: '1.1'
    letterSpacing: -0.04em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  data-mono:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1.5'
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.05em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '700'
    lineHeight: '1.2'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  container-gap: 24px
  section-margin: 48px
  bento-inner-padding: 32px
  grid-columns: '12'
---

## Brand & Style
The design system is engineered for DevTracker, focusing on high-energy developer productivity and visual clarity. The brand personality is "Technicolor Precision"—it merges the rigorous logic of software development with a vibrant, optimistic aesthetic. 

The design style is **Glass-Bento Modernism**. It utilizes structured, grid-based layouts (Bento-grid) populated with high-border-radius containers. The interface leans heavily into glassmorphism for secondary layers, using translucent white surfaces over soft, multi-colored background blurs to create a sense of depth and spatial awareness without sacrificing the "pure white" foundation. The emotional response should be one of focused excitement—a "flow state" amplified by color.

## Colors
This design system rejects the "single primary color" convention in favor of a **Functional Triad**. 
- **Electric Blue** is used for core actions, primary navigation, and "Active" states.
- **Vivid Purple** identifies data visualizations, secondary features, and "In-Progress" states.
- **Sunset Orange** is reserved for highlights, alerts, and "Urgent" developer tasks.

The background must remain `#FFFFFF`. Colorful gradients should never be the background of the page itself; instead, they are used as subtle, blurred "blobs" positioned behind glass containers or as thin top-border accents on cards to provide a sense of energy while maintaining high readability.

## Typography
The typography strategy leverages **Inter** for all interface elements to ensure maximum legibility and a contemporary feel. We use a "heavy-top" scale, where headlines utilize Extra Bold and Bold weights with tight letter-spacing to create impact.

**JetBrains Mono** is utilized strictly for technical data: commit hashes, file paths, code snippets, and terminal outputs. This creates a clear visual distinction between "System UI" and "Developer Data." 

For mobile, display sizes scale down aggressively to prevent awkward line breaks, while body sizes remain constant to preserve accessibility.

## Layout & Spacing
The layout follows a **Fluid Bento-Grid** philosophy. Content is organized into distinct "cells" or cards that represent different data streams. 

- **Desktop:** A 12-column grid with a 24px gutter. Cards should span variable column widths (e.g., a 4-column "Build Status" card next to an 8-column "Active PRs" card).
- **Padding:** Use a generous 32px internal padding for cards to allow the "Glass" effect to breathe.
- **Margins:** Page-level margins are 48px on desktop, scaling down to 16px on mobile.
- **Reflow:** On tablet, the 12-column grid collapses to 6 columns. On mobile, it becomes a single-column vertical stack with all cards assuming 100% width.

## Elevation & Depth
This design system uses **Layered Translucency** rather than traditional black shadows.
- **Level 1 (Base):** Pure white background.
- **Level 2 (Cards):** Use a white fill at 70% opacity with a `backdrop-filter: blur(20px)`. Add a 1px solid border using `surface-border` color.
- **Shadows:** Instead of grey, use an "Ambient Glow"—a very large, soft shadow (30px - 50px blur) with 5% opacity, tinted with the card's accent color (e.g., a blue-tinted shadow for Blue-themed cards).
- **Interactions:** Upon hover, a card should slightly lift (Y-axis -4px) and the shadow opacity should increase to 10% for a "squishy" tactile feel.

## Shapes
The shape language is **Ultra-Soft**. 
- Standard UI components (buttons, inputs) use a 12px radius (`rounded-lg`).
- Bento-grid cards use a 24px radius (`rounded-xl`) to emphasize the playful, approachable nature of the brand.
- Interactive elements like "Status Chips" should be fully pill-shaped (999px) to contrast against the rectangular grid cells.

## Components
- **Bento Cards:** The core component. Must have a 24px radius, glass background, and a 4px-thick top-border accent color (Blue, Purple, or Orange).
- **Primary Buttons:** High-contrast solid fills (Electric Blue). On hover, use a subtle gradient shift rather than a darken effect.
- **Status Chips:** Small, pill-shaped indicators with a 10% opacity background of their status color (e.g., Orange for "Pending") and 100% opacity text.
- **Input Fields:** Pure white background (not glass) to ensure zero text distortion. 1px light border that glows with the Primary Color on focus.
- **Code Blocks:** JetBrains Mono text on a dark-mode-inspired "Midnight" background (#0F172A) to provide a high-contrast focal point within the light-mode UI.
- **Micro-interactions:** Use "Spring" physics for all hover states. Avoid linear transitions; elements should have a slight "bounce" when clicked or hovered.