# WonderBG

> Zero-dependency animated gradient background library. Drop one `<script>` tag, get silky-smooth blob animations, 10 hand-crafted presets, and a full JS API — no build step required.

---

## Quick start

```html
<script src="wonder-bg.js"></script>

<!-- Option A — CSS class shorthand (auto-init) -->
<div class="wb-aurora"></div>

<!-- Option B — data attribute -->
<div data-wb-background="sunset"></div>

<!-- Option C — JavaScript API -->
<div id="bg"></div>
<script>
  WonderBG.create(document.getElementById('bg'), { preset: 'ocean', speed: 1.5 });
</script>
```

---

## Installation

**CDN / self-hosted**
```html
<script src="wonder-bg.js"></script>
```

**No npm, no bundler, no build step.**  
The file is a single self-contained IIFE (~25 KB unminified).

---

## Presets

| Name | Vibe |
|---|---|
| `aurora` | Teal & dark blue — calm, northern lights |
| `sunset` | Red-orange & purple — warm and vivid |
| `ocean` | Blue & teal — deep, cool water |
| `forest` | Greens — earthy and organic |
| `neon` | Purple, cyan & pink — cyberpunk |
| `ember` | Orange-red & gold — fire and energy |
| `mono` | White-on-black — minimal, clean |
| `void` | Dark purples & maroon — mysterious |
| `meadow` | Bright green — fresh and nature |
| `chalkboard` | Dark teal — chalk on board |

---

## Usage modes

### Gradient (default)
Full-element animated gradient — works on any block element.

```html
<div class="wb-aurora"></div>

<!-- or with JS -->
<script>
  WonderBG.create(el, { preset: 'aurora', mode: 'gradient' });
</script>
```

### Tint on Photo
Gradient blobs composited over an existing image using `mix-blend-mode: soft-light`.

```html
<img src="photo.jpg" data-wb-background="sunset" data-wb-background-mode="tint" />

<!-- or JS -->
<script>
  WonderBG.create(imgEl, { preset: 'sunset', mode: 'tint', blur: 30 });
</script>
```

### Grain on Photo
Film-grain noise overlay without colour blobs.

```html
<img src="photo.jpg" data-wb-background="mono" data-wb-background-mode="grain" />
```

### Gradient Text
Use the preset's blob colors on text via CSS `background-clip: text`.

```js
const colors = WonderBG.presets.neon.blobs.map(b => b.color);
const grad = `linear-gradient(135deg, ${colors.join(', ')})`;

el.style.backgroundImage    = grad;
el.style.backgroundSize     = '200% 200%';
el.style.webkitBackgroundClip = 'text';
el.style.backgroundClip     = 'text';
el.style.color              = 'transparent';
```

---

## CSS class shortcuts (auto-init)

Any element with a `wb-{preset}` class is automatically initialized on `DOMContentLoaded`.

```html
<div class="wb-neon"></div>
<div class="wb-forest"></div>
```

No JS needed — the library boots automatically.

---

## Data attribute auto-init

```html
<!-- preset only (gradient mode) -->
<div data-wb-background="ocean"></div>

<!-- preset + mode -->
<img src="photo.jpg"
     data-wb-background="sunset"
     data-wb-background-mode="tint" />
```

---

## CSS custom properties (inline tuning)

Override any property without touching JS:

```html
<div class="wb-aurora" style="
  --wb-background-speed: 2;
  --wb-background-blur: 40;
  --wb-background-grain: 0.1;
  --wb-background-interactive: true;
"></div>
```

| Variable | Type | Default | Description |
|---|---|---|---|
| `--wb-background-speed` | number | `1` | Animation speed multiplier |
| `--wb-background-blur` | number (px) | preset | Gaussian blur amount |
| `--wb-background-grain` | number 0–1 | preset | Film-grain intensity |
| `--wb-background-interactive` | `true`/`false` | `false` | Blobs follow mouse/touch |

---

## JavaScript API

### `WonderBG.create(element, config)` → instance

Creates an animated background on `element`.

```js
const inst = WonderBG.create(document.getElementById('hero'), {
  preset: 'aurora',
  mode: 'gradient',
  speed: 1.5,
  blur: 50,
  grain: 0.05,
  interactive: true,
  colors: ['rgba(32,178,170,0.85)', 'rgba(0,128,128,0.7)', 'rgba(22,33,62,0.9)']
});
```

### `instance.update(config)`

Live-update any config property — animates smoothly.

```js
inst.update({ preset: 'neon', speed: 2 });
inst.update({ colors: ['rgba(255,0,150,0.8)', 'rgba(0,220,255,0.7)', 'rgba(180,0,255,0.6)'] });
```

### `instance.destroy()`

Stops animation and removes all injected elements. Called automatically when the element is removed from the DOM.

```js
inst.destroy();
```

### Config reference

| Key | Type | Default | Description |
|---|---|---|---|
| `preset` | string | `'aurora'` | One of the 10 built-in presets |
| `mode` | `'gradient'` \| `'tint'` \| `'grain'` | `'gradient'` | Rendering mode |
| `speed` | number | `1` | Speed multiplier (0.1 – 4+) |
| `blur` | number | preset value | Gaussian blur in px (0 – 70) |
| `grain` | number | preset value | Noise intensity (0 – 0.4) |
| `interactive` | boolean | `false` | Blobs track mouse/touch |
| `colors` | string[] | preset blobs | Override blob colors (rgba strings) |

---

## Static properties

```js
WonderBG.presets          // Object — all built-in preset definitions
WonderBG.presets.aurora   // { background, blobs, grain, blur }

WonderBG.registerPreset('candy', {
  background: '#ff007a',
  blobs: [
    { color: 'rgba(255,100,200,0.8)', baseX: 0.3, baseY: 0.4, radius: 0.5,
      orbitX: 0.1, orbitY: 0.08, phase: 0, speed: 0.6 },
    // ...
  ],
  grain: 0.05,
  blur: 60
});
```

---

## Performance notes

- Uses a single `<canvas>` per element, rendered via `requestAnimationFrame`.
- Pauses automatically when element scrolls off-screen (`IntersectionObserver`).
- Respects `prefers-reduced-motion` — pauses animation when user has requested reduced motion.
- Auto-destroys when element is removed from DOM (`MutationObserver`).
- Blur is GPU-capped: mobile ≤ 35 px, desktop ≤ 70 px.

---

## TypeScript

Types are provided via `wonder-bg.d.ts` — import the file or add it to your `tsconfig.json` includes.

```ts
import type { WonderBGConfig, WonderBGInstance } from './wonder-bg.d.ts';

const inst: WonderBGInstance = WonderBG.create(el, {
  preset: 'ocean',
  speed: 1.2
} satisfies WonderBGConfig);
```

---

## Browser support

Chrome 80+, Firefox 80+, Safari 14+, Edge 80+.  
Canvas + `mix-blend-mode` + `IntersectionObserver` are required.

---

## License

MIT
