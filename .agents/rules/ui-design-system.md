# UI/UX Design System Specification: Animated Ultra-Modern Glassmorphism

This rule defines the mandatory, non-negotiable UI/UX design language and design system for all applications, spec sheets, and pages created or modified in this workspace.

## 1. Core Visual Identity & Aesthetics
- **Aesthetic**: Ultra-premium, hyper-modern, cinematic, dynamic glassmorphism with subtle glow physics and smooth micro-interactions.
- **Theme Modes**: Dark-mode-first with complete Light-mode parity.
- **Background Atmosphere**:
  - **Dark**: Deep obsidian `#0f1014` with ambient dual radial glows:
    `radial-gradient(circle at top right, rgba(139, 92, 246, 0.15) 0%, transparent 60%), radial-gradient(circle at bottom left, rgba(14, 165, 233, 0.1) 0%, transparent 50%)`
  - **Light**: Crisp slate `#f8fafc` with subtle light reflections.
  - **Background overlay**: Animated dot pattern with soft radial vignette mask (`<DotPattern glow />`).

## 2. Color Palette & Tokens
| Token | Light Mode | Dark Mode | Usage |
| :--- | :--- | :--- | :--- |
| `--bg` / `background` | `#f8fafc` | `#0f1014` | Body & canvas background |
| `--fg` / `foreground` | `#0f172a` | `#fafafa` | Primary text |
| `--card` | `#ffffff` | `#16171b` | Surfaces & cards |
| `--card-fg` | `#0f172a` | `#fafafa` | Card text |
| `--primary` | `#8b5cf6` (Electric Violet) | `#8b5cf6` (Electric Violet) | Primary accents, buttons, glows |
| `--primary-foreground` | `#ffffff` | `#ffffff` | Text on primary |
| `--muted` | `#f1f5f9` | `#272832` | Secondary backgrounds |
| `--muted-fg` | `#64748b` | `#a1a1aa` | Subtext, labels, captions |
| `--border` | `#e2e8f0` | `#272832` / `rgba(255,255,255,0.05)` | Card & divider borders |
| `--glass-bg` | `rgba(255, 255, 255, 0.7)` | `rgba(22, 23, 27, 0.6)` | Glass panels & header |
| `--glass-border` | `rgba(0, 0, 0, 0.1)` | `rgba(255, 255, 255, 0.05)` | Translucent frosted borders |

### Signature Gradients
- **Primary Text Gradient**: `linear-gradient(135deg, #a78bfa 0%, #38bdf8 100%)` (Violet to Sky Cyan).
- **Secondary Text Gradient**: `linear-gradient(135deg, var(--fg) 0%, var(--muted-fg) 100%)`.
- **Primary Glow**: `box-shadow: 0 0 20px rgba(139, 92, 246, 0.3)` / `hover: 0 0 30px rgba(139, 92, 246, 0.5)`.
- **Aurora Effect**: Fluid shimmering gradient text for hero headings (`AuroraTextEffect` / `.text-aurora`).

## 3. Typography & Hierarchy
- **Font Family**: Geist Sans, Inter, or system sans-serif with tight character tracking (`tracking-tight`).
- **Hero Headings**: `text-5xl md:text-7xl font-bold tracking-tight`, fluid typography with `clamp(3rem, 6.5vw, 5.5rem)`.
- **Section Headings**: `text-3xl md:text-5xl font-bold tracking-tight mb-4`, accented with `.text-gradient-primary`.
- **Body & Descriptions**: `text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl`.
- **Tags & Status Badges**: `text-xs font-medium uppercase tracking-wider`.

## 4. Cards, Containers & Layout Patterns
- **Radius Standard**: High curvature pill shapes and rounded squircle cards:
  - Cards: `rounded-[2rem]` or `rounded-[2.25rem]`.
  - Buttons / Badges / Search: `rounded-full`.
  - Header / Dock: `rounded-[2rem]`.
- **Glassmorphism Spec (`.glass-panel`)**:
  ```css
  background: var(--glass-bg);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid var(--glass-border);
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.05);
  border-radius: 2rem;
  ```
- **Bento Grid**:
  - 12-column responsive layout (`grid grid-cols-1 md:grid-cols-12 gap-6`).
  - Asymmetric spans (`md:col-span-7`, `md:col-span-5`, `md:col-span-4`, `md:col-span-8`).
  - Dark image overlays: `bg-gradient-to-t from-black/90 via-black/40 to-transparent`.
- **Interactive Magic Cards (`<MagicCard />`)**:
  - Interactive mouse-tracking gradient aura: `gradientSize={280}`, `gradientColor="rgba(139, 92, 246, 0.12)"`.

## 5. Navigation & Global Micro-components
- **Floating Glass Header**:
  - `fixed top-6 left-0 right-0 z-50 flex justify-center px-4`.
  - Max-width `max-w-7xl`, `.glass-panel rounded-[2rem]`.
  - Auto-hide on scroll-down, reveal on scroll-up.
  - Animated underline hover on nav links (`bg-primary/80 shadow-[0_0_8px_rgba(139,92,246,0.8)]`).
- **Interactive Bottom Dock (`<Dock />`)**:
  - Fixed at bottom: `fixed bottom-2 left-0 right-0 z-[999] hidden md:block`.
  - macOS magnification effect on hover (`panelHeight={56}, baseItemSize={44}, magnification={66}`).
  - Pops up on scrolling down past hero, vanishes at top.
- **Smooth Interactive Cursor (`<SmoothCursor />`)**:
  - Smooth inertia follower with trail and subtle violet glow (`glowEffect showTrail trailLength={4}`).
- **Smooth Inertia Scrolling**:
  - Smooth scroll integration.

## 6. Motion & Animation Standards
- **Viewport Scroll Entrance**:
  - All sections animate on enter with smooth staggered delays.
- **Buttons & Hover Effects**:
  - Subtle lift: `hover:-translate-y-1 transition-all duration-200`.
  - Pulsing status dots: Ping animation with green / violet dot for active status.
- **Page Transitions & Modals**: Spring-physics easing or ease-out curves.

## 7. Spec Sheet Implementation Directive
Whenever any specification sheet, wireframe, or feature prompt is provided:
- Never generate plain, standard or generic MVPs.
- Adopt this Dark-mode-first Obsidian & Electric Violet Glassmorphism design language.
- Use rounded `[2rem]` squircle surfaces, MagicCard subtle glows, and glass-panel backdrops.
- Implement `.text-gradient-primary` highlights on key metrics, titles, and headers.
- Provide rich micro-interactions (hover lifts, icon glows, smooth scroll transitions).
