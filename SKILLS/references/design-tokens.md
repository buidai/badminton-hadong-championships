# Design Tokens & CSS System – Tournament UI

## CSS Variables (Design Tokens)

Copy toàn bộ block này vào `css/variables.css` làm nền tảng design system.

```css
:root {
  /* ========================================
     COLOR PALETTE - TOURNAMENT DARK THEME
     ======================================== */

  /* Background Colors */
  --color-bg: #0a0a0f;
  --color-bg-secondary: #111827;
  --color-bg-gradient: linear-gradient(180deg, #0a0a0f 0%, #111827 100%);

  /* Surface Colors (Cards, Panels) */
  --color-surface: rgba(255, 255, 255, 0.03);
  --color-surface-hover: rgba(255, 255, 255, 0.06);
  --color-surface-elevated: rgba(255, 255, 255, 0.08);
  --color-surface-glass: rgba(255, 255, 255, 0.05);

  /* Border Colors */
  --color-border: rgba(255, 255, 255, 0.08);
  --color-border-hover: rgba(255, 255, 255, 0.15);
  --color-border-focus: var(--color-accent);

  /* Text Colors */
  --color-text: #f0f0f5;
  --color-text-secondary: #a0a0b0;
  --color-text-muted: #6b7280;
  --color-text-inverse: #0a0a0f;

  /* ========================================
     ACCENT COLORS - CUSTOMIZABLE PER TOURNAMENT
     ======================================== */

  /* Primary Accent (Cyan/Electric Blue) */
  --color-accent: #00e5ff;
  --color-accent-rgb: 0, 229, 255;
  --color-accent-hover: #00b8d4;
  --color-accent-light: #67efff;
  --color-accent-gradient: linear-gradient(135deg, #00e5ff 0%, #3b82f6 100%);

  /* Secondary Accent (Magenta/Purple) */
  --color-accent-secondary: #a855f7;
  --color-accent-secondary-rgb: 168, 85, 247;
  --color-accent-secondary-gradient: linear-gradient(135deg, #a855f7 0%, #ec4899 100%);

  /* ========================================
     SEMANTIC COLORS
     ======================================== */

  /* Status Colors */
  --color-success: #10b981;
  --color-success-rgb: 16, 185, 129;
  --color-danger: #ef4444;
  --color-danger-rgb: 239, 68, 68;
  --color-warning: #f59e0b;
  --color-warning-rgb: 245, 158, 11;
  --color-info: #3b82f6;
  --color-info-rgb: 59, 130, 246;

  /* Live indicator */
  --color-live: #ef4444;
  --color-live-rgb: 239, 68, 68;

  /* Rank Colors */
  --color-gold: #ffd700;
  --color-silver: #c0c0c0;
  --color-bronze: #cd7f32;

  /* ========================================
     TYPOGRAPHY
     ======================================== */

  /* Font Families */
  --font-display: 'Rajdhani', 'Chakra Petch', sans-serif;
  --font-body: 'Inter', 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;
  --font-brand: 'Orbitron', 'Rajdhani', sans-serif;

  /* Font Sizes - Fluid Typography */
  --text-xs: clamp(0.65rem, 0.6rem + 0.25vw, 0.75rem);
  --text-sm: clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem);
  --text-base: clamp(0.875rem, 0.8rem + 0.375vw, 1rem);
  --text-lg: clamp(1rem, 0.9rem + 0.5vw, 1.25rem);
  --text-xl: clamp(1.25rem, 1rem + 1.25vw, 1.75rem);
  --text-2xl: clamp(1.5rem, 1.2rem + 1.5vw, 2.25rem);
  --text-3xl: clamp(2rem, 1.5rem + 2.5vw, 3rem);
  --text-4xl: clamp(2.5rem, 2rem + 2.5vw, 4rem);
  --text-hero: clamp(3rem, 2rem + 5vw, 6rem);

  /* Font Weights */
  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;
  --font-extrabold: 800;

  /* Line Heights */
  --leading-tight: 1.1;
  --leading-snug: 1.25;
  --leading-normal: 1.5;
  --leading-relaxed: 1.75;

  /* Letter Spacing */
  --tracking-tight: -0.025em;
  --tracking-normal: 0;
  --tracking-wide: 0.05em;
  --tracking-wider: 0.1em;
  --tracking-widest: 0.15em;

  /* ========================================
     SPACING SCALE
     ======================================== */

  --space-1: 0.25rem;   /* 4px */
  --space-2: 0.5rem;    /* 8px */
  --space-3: 0.75rem;   /* 12px */
  --space-4: 1rem;      /* 16px */
  --space-5: 1.25rem;   /* 20px */
  --space-6: 1.5rem;    /* 24px */
  --space-8: 2rem;      /* 32px */
  --space-10: 2.5rem;   /* 40px */
  --space-12: 3rem;     /* 48px */
  --space-16: 4rem;     /* 64px */
  --space-20: 5rem;     /* 80px */
  --space-24: 6rem;     /* 96px */

  /* ========================================
     BORDERS & RADIUS
     ======================================== */

  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-2xl: 24px;
  --radius-full: 9999px;

  --border-thin: 1px solid var(--color-border);
  --border-accent: 1px solid var(--color-accent);

  /* ========================================
     SHADOWS & GLOWS
     ======================================== */

  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.4);
  --shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.5);
  --shadow-xl: 0 16px 48px rgba(0, 0, 0, 0.6);

  --glow-accent: 0 0 20px rgba(var(--color-accent-rgb), 0.3);
  --glow-accent-strong: 0 0 40px rgba(var(--color-accent-rgb), 0.4);
  --glow-live: 0 0 20px rgba(var(--color-live-rgb), 0.3);

  --text-glow-accent: 0 0 10px rgba(var(--color-accent-rgb), 0.5);

  /* ========================================
     GLASSMORPHISM
     ======================================== */

  --glass-bg: rgba(255, 255, 255, 0.05);
  --glass-border: 1px solid rgba(255, 255, 255, 0.1);
  --glass-blur: blur(12px);
  --glass-blur-heavy: blur(24px);

  /* ========================================
     TRANSITIONS & ANIMATIONS
     ======================================== */

  --transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-base: 300ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-slow: 500ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-bounce: 500ms cubic-bezier(0.34, 1.56, 0.64, 1);

  /* ========================================
     Z-INDEX SCALE
     ======================================== */

  --z-dropdown: 100;
  --z-sticky: 200;
  --z-fixed: 300;
  --z-modal-backdrop: 400;
  --z-modal: 500;
  --z-tooltip: 600;
  --z-notification: 700;

  /* ========================================
     LAYOUT
     ======================================== */

  --container-max: 1280px;
  --container-padding: clamp(1rem, 3vw, 3rem);
  --navbar-height: 64px;
  --sidebar-width: 280px;
}
```

---

## Google Fonts Import

```css
/* css/typography.css */
@import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Inter:wght@400;500;600;700;800&family=Orbitron:wght@400;700;900&family=JetBrains+Mono:wght@400;700&display=swap');

/* Fallback nếu Google Fonts bị block */
@font-face {
  font-family: 'Rajdhani-Fallback';
  src: local('Arial');
  size-adjust: 105%;
  ascent-override: 90%;
  descent-override: 30%;
  line-gap-override: 0%;
}
```

---

## CSS Reset

```css
/* css/reset.css */
*, *::before, *::after {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
  -webkit-text-size-adjust: 100%;
}

body {
  font-family: var(--font-body);
  font-size: var(--text-base);
  line-height: var(--leading-normal);
  color: var(--color-text);
  background: var(--color-bg);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  overflow-x: hidden;
}

img, video, svg {
  display: block;
  max-width: 100%;
  height: auto;
}

a {
  color: inherit;
  text-decoration: none;
}

button {
  font: inherit;
  color: inherit;
  background: none;
  border: none;
  cursor: pointer;
}

ul, ol {
  list-style: none;
}

input, textarea, select {
  font: inherit;
  color: inherit;
  background: transparent;
  border: var(--border-thin);
  border-radius: var(--radius-md);
  padding: var(--space-3) var(--space-4);
}

input:focus, textarea:focus, select:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: var(--glow-accent);
}

::selection {
  background: rgba(var(--color-accent-rgb), 0.3);
  color: white;
}

::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: var(--color-bg);
}

::-webkit-scrollbar-thumb {
  background: var(--color-border);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--color-text-muted);
}
```

---

## Common Animation Keyframes

```css
/* css/animations.css */

/* Fade In */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Slide Up */
@keyframes slideUp {
  from { 
    opacity: 0; 
    transform: translateY(20px); 
  }
  to { 
    opacity: 1; 
    transform: translateY(0); 
  }
}

/* Slide Down */
@keyframes slideDown {
  from { 
    opacity: 0; 
    transform: translateY(-20px); 
  }
  to { 
    opacity: 1; 
    transform: translateY(0); 
  }
}

/* Scale In */
@keyframes scaleIn {
  from { 
    opacity: 0; 
    transform: scale(0.95); 
  }
  to { 
    opacity: 1; 
    transform: scale(1); 
  }
}

/* Shimmer (Skeleton Loading) */
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

/* Pulse */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* Glow Pulse */
@keyframes glowPulse {
  0%, 100% { 
    box-shadow: 0 0 5px rgba(var(--color-accent-rgb), 0.2); 
  }
  50% { 
    box-shadow: 0 0 25px rgba(var(--color-accent-rgb), 0.4); 
  }
}

/* Count Up (for score animations) */
@keyframes countUp {
  from { 
    opacity: 0; 
    transform: translateY(10px); 
  }
  to { 
    opacity: 1; 
    transform: translateY(0); 
  }
}

/* Stagger utility classes */
.stagger-1 { animation-delay: 0.05s; }
.stagger-2 { animation-delay: 0.1s; }
.stagger-3 { animation-delay: 0.15s; }
.stagger-4 { animation-delay: 0.2s; }
.stagger-5 { animation-delay: 0.25s; }
.stagger-6 { animation-delay: 0.3s; }
.stagger-7 { animation-delay: 0.35s; }
.stagger-8 { animation-delay: 0.4s; }

/* Animation utility classes */
.animate-fadeIn { 
  animation: fadeIn var(--transition-base) both; 
}
.animate-slideUp { 
  animation: slideUp var(--transition-base) both; 
}
.animate-slideDown { 
  animation: slideDown var(--transition-base) both; 
}
.animate-scaleIn { 
  animation: scaleIn var(--transition-base) both; 
}

/* Skeleton Loading */
.skeleton {
  background: linear-gradient(
    90deg,
    var(--color-surface) 25%,
    var(--color-surface-elevated) 50%,
    var(--color-surface) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite linear;
  border-radius: var(--radius-md);
}
```

---

## Preset Color Themes (Cho từng giải đấu)

```css
/* Có thể override accent colors theo tournament */

/* Valorant Champions */
[data-theme="valorant"] {
  --color-accent: #ff4655;
  --color-accent-rgb: 255, 70, 85;
  --color-accent-secondary: #0f1923;
}

/* League of Legends Worlds */
[data-theme="lol-worlds"] {
  --color-accent: #c89b3c;
  --color-accent-rgb: 200, 155, 60;
  --color-accent-secondary: #0a1428;
}

/* CS2 Major */
[data-theme="cs2"] {
  --color-accent: #de9b35;
  --color-accent-rgb: 222, 155, 53;
  --color-accent-secondary: #1a1a2e;
}

/* Dota 2 The International */
[data-theme="dota2-ti"] {
  --color-accent: #a23e2b;
  --color-accent-rgb: 162, 62, 43;
  --color-accent-secondary: #1b2838;
}

/* Overwatch League */
[data-theme="owl"] {
  --color-accent: #ff9c00;
  --color-accent-rgb: 255, 156, 0;
  --color-accent-secondary: #2d2d3e;
}

/* Custom Green / Nature */
[data-theme="emerald"] {
  --color-accent: #10b981;
  --color-accent-rgb: 16, 185, 129;
  --color-accent-secondary: #065f46;
}
```

## Hướng Dẫn Sử Dụng

1. **Import thứ tự**: `variables.css` → `reset.css` → `typography.css` → `animations.css` → component CSS
2. **Không hardcode giá trị** – Luôn dùng `var(--token-name)`
3. **Theme switching** – Thêm `data-theme` attribute vào `<html>` hoặc `<body>`
4. **Responsive tokens** – Dùng `clamp()` cho font-size, `vw` cho spacing khi cần
5. **Performance** – Animation chỉ dùng `transform` và `opacity` (GPU-accelerated properties)
