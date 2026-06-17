/*!
 * Wonder Backgrounds v1.4.0
 * Animated organic gradient backgrounds — drop-in, zero-dependency, framework-agnostic.
 *
 * Works on ANY element including <img>, <video>, <p>, <h1>, <button>, etc.
 * Void/replaced elements are auto-wrapped in a container — no manual markup needed.
 *
 * Three syntaxes (all merge together, JS > data-* > CSS vars):
 *
 * 1. CSS class:    <div class="wb-aurora"></div>
 *                  <div class="wb-neon" style="height:200px; border-radius:16px;"></div>
 *
 * 2. Data attrs:   <div data-wb-background="forest"></div>
 *                  <img src="photo.jpg" data-wb-background="ocean" data-wb-background-mode="tint" />
 *
 * 3. CSS vars:     #el { --wb-background: sunset; --wb-background-speed: 2; }
 *
 * 4. JS API:       WonderBG.create('img.hero', { preset: 'ember', mode: 'grain', grain: 0.2 })
 *
 * Modes:
 *   gradient (default) — full animated gradient + grain on dark background
 *   tint               — semi-transparent color overlay + blobs + grain on images
 *   grain              — film-grain texture overlaid on existing content/images
 *
 * Available presets: aurora, sunset, ocean, forest, neon, ember, mono, void, meadow, chalkboard
 *
 * Key behaviours:
 *   - Border-radius is preserved automatically (overflow:hidden applied + restored on destroy)
 *   - Existing children layout is NOT disturbed (position/z-index only set when needed)
 *   - Works on rounded cards, buttons, images — anything
 *
 * MIT License
 */
(function (global) {
  'use strict';

  // ── Mobile detection ────────────────────────────────────────────────────────
  const isMobile = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(
    (global.navigator && global.navigator.userAgent) || ''
  );

  // ── Blur cap: large blurs kill mobile FPS ───────────────────────────────────
  const MAX_BLUR = isMobile ? 35 : 70;

  // ── Reduced-motion preference ───────────────────────────────────────────────
  const prefersReducedMotion =
    global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── Presets ─────────────────────────────────────────────────────────────────
  const PRESETS = {
    aurora: {
      background: '#0d1117',
      blobs: [
        { color: 'rgba(32,178,170,0.85)',  baseX: 0.20, baseY: 0.35, radius: 0.55, orbitX: 0.10, orbitY: 0.08, phase: 0,   speed: 0.60 },
        { color: 'rgba(0,128,128,0.70)',   baseX: 0.65, baseY: 0.25, radius: 0.50, orbitX: 0.08, orbitY: 0.10, phase: 2.1, speed: 0.45 },
        { color: 'rgba(22,33,62,0.90)',    baseX: 0.50, baseY: 0.75, radius: 0.65, orbitX: 0.12, orbitY: 0.06, phase: 4.2, speed: 0.35 }
      ],
      grain: 0.06, blur: 65
    },
    sunset: {
      background: '#05030a',
      blobs: [
        { color: 'rgba(220,60,30,0.90)',  baseX: 0.28, baseY: 0.55, radius: 0.58, orbitX: 0.12, orbitY: 0.07, phase: 0,   speed: 0.55 },
        { color: 'rgba(80,20,160,0.85)',  baseX: 0.75, baseY: 0.30, radius: 0.62, orbitX: 0.09, orbitY: 0.09, phase: 1.8, speed: 0.45 },
        { color: 'rgba(240,100,20,0.55)', baseX: 0.10, baseY: 0.70, radius: 0.45, orbitX: 0.10, orbitY: 0.06, phase: 3.4, speed: 0.60 }
      ],
      grain: 0.06, blur: 70
    },
    ocean: {
      background: '#021014',
      blobs: [
        { color: 'rgba(20,130,160,0.85)', baseX: 0.25, baseY: 0.40, radius: 0.55, orbitX: 0.10, orbitY: 0.08, phase: 0,   speed: 0.50 },
        { color: 'rgba(10,60,110,0.85)',  baseX: 0.75, baseY: 0.60, radius: 0.60, orbitX: 0.08, orbitY: 0.10, phase: 2.5, speed: 0.40 },
        { color: 'rgba(60,200,190,0.45)', baseX: 0.55, baseY: 0.25, radius: 0.42, orbitX: 0.12, orbitY: 0.05, phase: 4.0, speed: 0.65 }
      ],
      grain: 0.05, blur: 65
    },
    forest: {
      background: '#040d06',
      blobs: [
        { color: 'rgba(60,180,60,0.75)',  baseX: 0.70, baseY: 0.25, radius: 0.55, orbitX: 0.11, orbitY: 0.08, phase: 0,   speed: 0.50 },
        { color: 'rgba(20,90,20,0.80)',   baseX: 0.25, baseY: 0.65, radius: 0.60, orbitX: 0.08, orbitY: 0.10, phase: 2.3, speed: 0.40 },
        { color: 'rgba(100,220,80,0.40)', baseX: 0.55, baseY: 0.40, radius: 0.45, orbitX: 0.13, orbitY: 0.06, phase: 4.1, speed: 0.60 }
      ],
      grain: 0.07, blur: 68
    },
    neon: {
      background: '#070010',
      blobs: [
        { color: 'rgba(180,0,255,0.80)',  baseX: 0.20, baseY: 0.40, radius: 0.52, orbitX: 0.10, orbitY: 0.08, phase: 0,   speed: 0.65 },
        { color: 'rgba(0,220,255,0.70)',  baseX: 0.75, baseY: 0.55, radius: 0.55, orbitX: 0.08, orbitY: 0.09, phase: 2.0, speed: 0.50 },
        { color: 'rgba(255,0,150,0.55)',  baseX: 0.50, baseY: 0.20, radius: 0.48, orbitX: 0.12, orbitY: 0.07, phase: 4.0, speed: 0.70 }
      ],
      grain: 0.04, blur: 55
    },
    ember: {
      background: '#090200',
      blobs: [
        { color: 'rgba(255,80,10,0.85)',  baseX: 0.35, baseY: 0.60, radius: 0.55, orbitX: 0.09, orbitY: 0.07, phase: 0,   speed: 0.55 },
        { color: 'rgba(200,180,0,0.65)',  baseX: 0.65, baseY: 0.35, radius: 0.50, orbitX: 0.11, orbitY: 0.09, phase: 2.2, speed: 0.45 },
        { color: 'rgba(255,40,0,0.50)',   baseX: 0.15, baseY: 0.40, radius: 0.45, orbitX: 0.10, orbitY: 0.06, phase: 3.8, speed: 0.65 }
      ],
      grain: 0.07, blur: 65
    },
    mono: {
      background: '#080808',
      blobs: [
        { color: 'rgba(255,255,255,0.16)', baseX: 0.30, baseY: 0.40, radius: 0.55, orbitX: 0.10, orbitY: 0.08, phase: 0,   speed: 0.50 },
        { color: 'rgba(255,255,255,0.08)', baseX: 0.72, baseY: 0.62, radius: 0.60, orbitX: 0.08, orbitY: 0.10, phase: 2.5, speed: 0.40 },
        { color: 'rgba(255,255,255,0.06)', baseX: 0.55, baseY: 0.25, radius: 0.42, orbitX: 0.12, orbitY: 0.05, phase: 4.0, speed: 0.30 }
      ],
      grain: 0.08, blur: 72
    },
    void: {
      background: '#030303',
      blobs: [
        { color: 'rgba(50,0,80,0.70)',    baseX: 0.30, baseY: 0.50, radius: 0.60, orbitX: 0.08, orbitY: 0.07, phase: 0,   speed: 0.35 },
        { color: 'rgba(0,30,60,0.60)',    baseX: 0.70, baseY: 0.40, radius: 0.58, orbitX: 0.06, orbitY: 0.09, phase: 3.1, speed: 0.30 },
        { color: 'rgba(80,0,40,0.45)',    baseX: 0.50, baseY: 0.70, radius: 0.52, orbitX: 0.10, orbitY: 0.06, phase: 5.2, speed: 0.25 }
      ],
      grain: 0.09, blur: 75
    },
    meadow: {
      background: '#030a02',
      blobs: [
        { color: 'rgba(100,220,50,0.80)',  baseX: 0.85, baseY: 0.10, radius: 0.65, orbitX: 0.08, orbitY: 0.12, phase: 0,   speed: 0.45 },
        { color: 'rgba(60,160,30,0.70)',   baseX: 0.10, baseY: 0.20, radius: 0.55, orbitX: 0.10, orbitY: 0.08, phase: 2.0, speed: 0.35 },
        { color: 'rgba(30,80,10,0.60)',    baseX: 0.50, baseY: 0.75, radius: 0.60, orbitX: 0.12, orbitY: 0.06, phase: 4.5, speed: 0.30 }
      ],
      grain: 0.18, blur: 45
    },
    chalkboard: {
      background: '#010908',
      blobs: [
        { color: 'rgba(0,200,180,0.90)',   baseX: 0.72, baseY: 0.22, radius: 0.52, orbitX: 0.07, orbitY: 0.09, phase: 0,   speed: 0.40 },
        { color: 'rgba(0,140,130,0.75)',   baseX: 0.40, baseY: 0.30, radius: 0.48, orbitX: 0.09, orbitY: 0.07, phase: 2.4, speed: 0.30 },
        { color: 'rgba(0,60,55,0.60)',     baseX: 0.20, baseY: 0.65, radius: 0.62, orbitX: 0.06, orbitY: 0.10, phase: 4.8, speed: 0.25 }
      ],
      grain: 0.16, blur: 40
    }
  };

  const DEFAULTS = {
    preset: 'aurora',
    mode: 'gradient',
    speed: 1,
    interactive: false,
    grain: null,
    blur: null,
    colors: null
  };

  // Replaced/void elements that can't have child nodes
  const VOID_ELEMENTS = new Set([
    'img','video','audio','canvas','iframe','embed','object',
    'input','textarea','select','picture','br','hr','wbr',
    'area','base','col','link','meta','param','source','track'
  ]);

  // Preset names for wb-{name} CSS class shorthand
  const PRESET_NAMES = Object.keys(PRESETS);

  // ── Helpers ──────────────────────────────────────────────────────────────────
  function parseBool(v, fallback) {
    if (v === undefined || v === null || v === '') return fallback;
    if (typeof v === 'boolean') return v;
    const s = String(v).trim().toLowerCase();
    return s === 'true' || s === '1' || s === 'yes';
  }

  function parseNum(v, fallback) {
    if (v === undefined || v === null || v === '') return fallback;
    const n = parseFloat(v);
    return Number.isNaN(n) ? fallback : n;
  }

  // Detect wb-{preset} shorthand classes on an element
  function detectPresetClass(el) {
    for (const name of PRESET_NAMES) {
      if (el.classList && el.classList.contains('wb-' + name)) return name;
    }
    return null;
  }

  function readCssVars(el) {
    const cs = getComputedStyle(el);
    const get = (...names) => {
      for (const name of names) {
        const v = cs.getPropertyValue(name);
        if (v && v.trim()) return v.trim();
      }
      return undefined;
    };
    return {
      preset:      get('--wb-background',             '--js-background', '--grad-preset'),
      mode:        get('--wb-background-mode',        '--js-background-mode', '--grad-mode'),
      speed:       get('--wb-background-speed',       '--js-background-speed', '--grad-speed'),
      interactive: get('--wb-background-interactive', '--js-background-interactive', '--grad-interactive'),
      grain:       get('--wb-background-grain',       '--js-background-grain', '--grad-grain'),
      blur:        get('--wb-background-blur',        '--js-background-blur', '--grad-blur')
    };
  }

  function readDataAttrs(el) {
    const d = el.dataset || {};
    return {
      preset:      d.wbBackground      || d.jsBackground      || d.gradPreset        || d.wonderBgPreset      || undefined,
      mode:        d.wbBackgroundMode  || d.jsBackgroundMode  || d.gradMode          || d.wonderBgMode        || undefined,
      speed:       d.wbBackgroundSpeed || d.jsBackgroundSpeed || d.gradSpeed         || d.wonderBgSpeed       || undefined,
      interactive: d.wbInteractive     || d.jsInteractive     || d.gradInteractive   || d.wonderBgInteractive || undefined,
      grain:       d.wbGrain           || d.jsGrain           || d.gradGrain         || d.wonderBgGrain       || undefined,
      blur:        d.wbBlur            || d.jsBlur            || d.gradBlur          || d.wonderBgBlur        || undefined
    };
  }

  // pick() returns the first defined value from JS config → data-attrs → CSS vars.
  // Returns undefined if none found — callers supply their own fallback.
  function makePick(jsConfig, data, css) {
    return function pick(key) {
      if (jsConfig && jsConfig[key] !== undefined) return jsConfig[key];
      if (data[key]  !== undefined) return data[key];
      if (css[key]   !== undefined) return css[key];
      return undefined;
    };
  }

  function resolveConfig(el, jsConfig) {
    const css  = readCssVars(el);
    const data = readDataAttrs(el);
    const presetClass = detectPresetClass(el);
    const pick = makePick(jsConfig, data, css);

    // Priority: JS > data-* > CSS vars > class preset > defaults
    const preset = pick('preset') || presetClass || DEFAULTS.preset;
    const mode   = pick('mode')   || DEFAULTS.mode;
    const speed  = parseNum(pick('speed'), DEFAULTS.speed);
    const interactive = parseBool(pick('interactive'), DEFAULTS.interactive);

    let grain = pick('grain');
    grain = (grain === undefined || grain === null) ? null : parseNum(grain, null);

    let blur = pick('blur');
    blur = (blur === undefined || blur === null) ? null : parseNum(blur, null);

    const colors = (jsConfig && jsConfig.colors) ? jsConfig.colors : null;

    return { preset, mode, speed, interactive, grain, blur, colors };
  }

  // ── Instance ─────────────────────────────────────────────────────────────────
  class WonderBGInstance {
    constructor(el, jsConfig) {
      this.el = el;
      this.jsConfig = jsConfig || {};
      this.config = resolveConfig(el, this.jsConfig);
      this.pointer = { x: 0.5, y: 0.5, targetX: 0.5, targetY: 0.5 };
      this._raf = null;
      this._destroyed = false;
      this._paused = false;
      this._reducedMotion = prefersReducedMotion;
      this._noiseCanvas = null;
      this._wrapper = null;
      this._container = null;
      this._savedOverflow = null;    // restored on destroy
      this._savedPosition = null;   // restored on destroy
      this._modifiedChildren = [];  // track which children we touched
      this._buildDom();
      this._bindEvents();
      this._resize();
      this._start();
    }

    _buildDom() {
      const origEl = this.el;
      const tag = origEl.tagName.toLowerCase();
      let container;

      if (VOID_ELEMENTS.has(tag)) {
        // Wrap void element so we can insert a canvas sibling
        const wrapper = document.createElement('div');
        wrapper.setAttribute('data-wonder-bg-wrapper', '');

        // Copy border-radius from the original element if present
        const cs = getComputedStyle(origEl);
        const br = cs.borderRadius;
        let wrapperCss = 'position:relative;overflow:hidden;line-height:0;';
        if (origEl.style.display === 'block' || cs.display === 'block' || cs.display === 'flex') {
          wrapperCss += 'display:block;';
        } else {
          wrapperCss += 'display:inline-block;';
        }
        if (origEl.style.width)  wrapperCss += 'width:'  + origEl.style.width  + ';';
        if (origEl.style.height) wrapperCss += 'height:' + origEl.style.height + ';';
        if (br && br !== '0px') wrapperCss += 'border-radius:' + br + ';';

        wrapper.style.cssText = wrapperCss;
        origEl.parentNode.insertBefore(wrapper, origEl);
        wrapper.appendChild(origEl);
        origEl.style.display = 'block';
        origEl.style.width   = '100%';
        origEl.style.height  = 'auto';
        this._wrapper  = wrapper;
        container = wrapper;
      } else {
        // Non-void element: set position:relative only if needed
        const cs = getComputedStyle(origEl);
        if (cs.position === 'static') {
          this._savedPosition = origEl.style.position || '';
          origEl.style.position = 'relative';
        }

        // Ensure overflow:hidden so the canvas is clipped to border-radius
        this._savedOverflow = origEl.style.overflow || '';
        if (cs.overflow === 'visible' || cs.overflow === '') {
          origEl.style.overflow = 'hidden';
        }

        // Only lift children above the canvas (z-index:0) if they don't
        // already have a stacking context. We do NOT touch position — only
        // z-index, and only when the child has none set at all.
        Array.from(origEl.children).forEach((child) => {
          if (child.hasAttribute('data-wonder-bg-canvas')) return;
          const childCs = getComputedStyle(child);
          const hasZIndex = childCs.zIndex !== 'auto';
          if (!hasZIndex) {
            child.style.zIndex = '1';
            this._modifiedChildren.push(child);
          }
        });

        container = origEl;
      }

      this._container = container;

      // Create the canvas overlay
      const canvas = document.createElement('canvas');
      canvas.setAttribute('data-wonder-bg-canvas', '');
      canvas.style.cssText = [
        'position:absolute;inset:0;width:100%;height:100%;',
        'display:block;pointer-events:none;border-radius:inherit;'
      ].join('');

      const mode = this.config.mode;
      if (mode === 'grain' || mode === 'tint') {
        canvas.style.mixBlendMode = 'soft-light';
        canvas.style.zIndex = '2';
      } else {
        canvas.style.zIndex = '0';
      }

      // Insert canvas as first child so it renders behind content
      container.insertBefore(canvas, container.firstChild);

      this.canvas = canvas;
      this.ctx    = canvas.getContext('2d');
    }

    _bindEvents() {
      const target = this._container;
      this._evTarget = target;

      this._onResize = () => this._resize();
      window.addEventListener('resize', this._onResize);

      if (this.config.interactive) {
        this._onMove = (e) => {
          const rect = target.getBoundingClientRect();
          const cx = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
          const cy = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
          this.pointer.targetX = Math.min(1, Math.max(0, cx / rect.width));
          this.pointer.targetY = Math.min(1, Math.max(0, cy / rect.height));
        };
        target.addEventListener('mousemove', this._onMove);
        target.addEventListener('touchmove', this._onMove, { passive: true });
      }

      if (typeof ResizeObserver !== 'undefined') {
        this._ro = new ResizeObserver(() => this._resize());
        this._ro.observe(target);
      }

      // Pause RAF when offscreen
      if (typeof IntersectionObserver !== 'undefined') {
        this._io = new IntersectionObserver(
          (entries) => {
            const visible = entries[0] && entries[0].isIntersecting;
            this._paused = !visible;
            if (!this._paused && !this._raf && !this._destroyed) {
              this._resumeRaf();
            }
          },
          { threshold: 0 }
        );
        this._io.observe(target);
      }

      // Auto-destroy when element is removed from DOM
      if (typeof MutationObserver !== 'undefined') {
        const observeTarget = target.parentNode || document.body;
        this._mo = new MutationObserver(() => {
          if (!document.contains(target)) {
            this.destroy();
          }
        });
        this._mo.observe(observeTarget, { childList: true, subtree: true });
      }
    }

    _resize() {
      const target = this._container;
      const rect = target.getBoundingClientRect();
      const dpr  = Math.min(window.devicePixelRatio || 1, 2);
      this.width  = Math.max(1, Math.round(rect.width));
      this.height = Math.max(1, Math.round(rect.height));
      this.canvas.width  = this.width  * dpr;
      this.canvas.height = this.height * dpr;
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    _start() {
      this._startTime = performance.now();
      this._resumeRaf();
    }

    _resumeRaf() {
      const loop = (now) => {
        if (this._destroyed) return;
        const t = ((now - this._startTime) / 1000) * this.config.speed;
        this.pointer.x += (this.pointer.targetX - this.pointer.x) * 0.04;
        this.pointer.y += (this.pointer.targetY - this.pointer.y) * 0.04;
        this._render(t);
        this._raf = null;
        if (!this._paused && !this._reducedMotion) {
          this._raf = requestAnimationFrame(loop);
        }
      };
      this._raf = requestAnimationFrame(loop);
    }

    _render(t) {
      const ctx    = this.ctx;
      const preset = PRESETS[this.config.preset] || PRESETS.aurora;
      const w = this.width, h = this.height;
      const mode  = this.config.mode;
      const rawBlur = this.config.blur !== null ? this.config.blur : preset.blur;
      const blur    = Math.min(rawBlur, MAX_BLUR);
      const grain   = this.config.grain !== null ? this.config.grain : preset.grain;

      ctx.clearRect(0, 0, w, h);

      // ── Grain-only mode ─────────────────────────────────────────────────────
      if (mode === 'grain') {
        if (grain > 0) this._renderGrainOverlay(grain);
        return;
      }

      // ── Tint mode ────────────────────────────────────────────────────────────
      if (mode === 'tint') {
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.fillRect(0, 0, w, h);
        ctx.save();
        ctx.filter = `blur(${blur}px)`;
        const diag = Math.sqrt(w * w + h * h);
        const px = this.config.interactive ? (this.pointer.x - 0.5) * 0.30 : 0;
        const py = this.config.interactive ? (this.pointer.y - 0.5) * 0.30 : 0;
        preset.blobs.forEach((b, i) => {
          const color = (this.config.colors && this.config.colors[i]) || b.color;
          const ang = t * b.speed + b.phase;
          const x = (b.baseX + Math.cos(ang) * b.orbitX + px) * w;
          const y = (b.baseY + Math.sin(ang * 1.3) * b.orbitY + py) * h;
          const r = b.radius * diag;
          const g = ctx.createRadialGradient(x, y, 0, x, y, r);
          g.addColorStop(0, color);
          g.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = g;
          ctx.fillRect(0, 0, w, h);
        });
        ctx.restore();
        if (grain > 0) this._renderGrainOverlay(grain * 0.6);
        return;
      }

      // ── Gradient mode (default) ───────────────────────────────────────────────
      ctx.fillStyle = preset.background;
      ctx.fillRect(0, 0, w, h);
      ctx.save();
      ctx.filter = `blur(${blur}px)`;
      const diag = Math.sqrt(w * w + h * h);
      const px = this.config.interactive ? (this.pointer.x - 0.5) * 0.30 : 0;
      const py = this.config.interactive ? (this.pointer.y - 0.5) * 0.30 : 0;
      preset.blobs.forEach((b, i) => {
        const color = (this.config.colors && this.config.colors[i]) || b.color;
        const ang = t * b.speed + b.phase;
        const x = (b.baseX + Math.cos(ang) * b.orbitX + px) * w;
        const y = (b.baseY + Math.sin(ang * 1.3) * b.orbitY + py) * h;
        const r = b.radius * diag;
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, color);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
      });
      ctx.restore();
      if (grain > 0) this._applyGrain(grain);
    }

    _applyGrain(amount) {
      const ctx = this.ctx;
      const w = this.width, h = this.height;
      if (!this._noiseCanvas) this._buildNoiseCanvas();
      ctx.save();
      ctx.globalAlpha = Math.min(1, amount);
      ctx.globalCompositeOperation = 'overlay';
      ctx.fillStyle = ctx.createPattern(this._noiseCanvas, 'repeat');
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    }

    _renderGrainOverlay(amount) {
      const ctx = this.ctx;
      const w = this.width, h = this.height;
      if (!this._noiseCanvas) this._buildNoiseCanvas();
      ctx.fillStyle = 'rgb(128,128,128)';
      ctx.fillRect(0, 0, w, h);
      ctx.save();
      ctx.globalAlpha = Math.min(1, amount * 1.5);
      ctx.globalCompositeOperation = 'overlay';
      ctx.fillStyle = ctx.createPattern(this._noiseCanvas, 'repeat');
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    }

    _buildNoiseCanvas() {
      const size = 200;
      const nc = document.createElement('canvas');
      nc.width = size; nc.height = size;
      const nctx = nc.getContext('2d');
      const imgData = nctx.createImageData(size, size);
      for (let i = 0; i < imgData.data.length; i += 4) {
        const v = Math.random() * 255;
        imgData.data[i] = v; imgData.data[i+1] = v;
        imgData.data[i+2] = v; imgData.data[i+3] = 255;
      }
      nctx.putImageData(imgData, 0, 0);
      this._noiseCanvas = nc;
    }

    update(newConfig) {
      this.jsConfig = Object.assign({}, this.jsConfig, newConfig);
      this.config = resolveConfig(this.el, this.jsConfig);

      const mode = this.config.mode;
      if (mode === 'grain' || mode === 'tint') {
        this.canvas.style.mixBlendMode = 'soft-light';
        this.canvas.style.zIndex = '2';
      } else {
        this.canvas.style.mixBlendMode = '';
        this.canvas.style.zIndex = '0';
      }

      if (newConfig && newConfig.interactive !== undefined) {
        const target = this._evTarget;
        if (this._onMove) {
          target.removeEventListener('mousemove', this._onMove);
          target.removeEventListener('touchmove', this._onMove);
          this._onMove = null;
        }
        if (this.config.interactive) {
          this._onMove = (e) => {
            const rect = target.getBoundingClientRect();
            const cx = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
            const cy = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
            this.pointer.targetX = Math.min(1, Math.max(0, cx / rect.width));
            this.pointer.targetY = Math.min(1, Math.max(0, cy / rect.height));
          };
          target.addEventListener('mousemove', this._onMove);
          target.addEventListener('touchmove', this._onMove, { passive: true });
        }
      }

      if (!this._raf && !this._paused && !this._destroyed) {
        this._resumeRaf();
      }
    }

    destroy() {
      if (this._destroyed) return;
      this._destroyed = true;
      if (this._raf) { cancelAnimationFrame(this._raf); this._raf = null; }
      window.removeEventListener('resize', this._onResize);
      if (this._ro)  this._ro.disconnect();
      if (this._io)  this._io.disconnect();
      if (this._mo)  this._mo.disconnect();
      const target = this._evTarget;
      if (this._onMove && target) {
        target.removeEventListener('mousemove', this._onMove);
        target.removeEventListener('touchmove', this._onMove);
      }
      if (this.canvas && this.canvas.parentNode) this.canvas.parentNode.removeChild(this.canvas);

      // Restore modified children z-indexes
      this._modifiedChildren.forEach((child) => {
        child.style.zIndex = '';
      });
      this._modifiedChildren = [];

      // Restore container styles we added
      if (!this._wrapper) {
        if (this._savedPosition !== null) {
          this.el.style.position = this._savedPosition;
        }
        if (this._savedOverflow !== null) {
          this.el.style.overflow = this._savedOverflow;
        }
      }

      if (this._wrapper && this._wrapper.parentNode) {
        this._wrapper.parentNode.insertBefore(this.el, this._wrapper);
        this._wrapper.parentNode.removeChild(this._wrapper);
        this._wrapper = null;
      }

      const idx = global.WonderBG._instances.indexOf(this);
      if (idx > -1) global.WonderBG._instances.splice(idx, 1);
    }
  }

  // ── Public API ───────────────────────────────────────────────────────────────
  const WonderBG = {
    version: '1.4.0',
    presets: PRESETS,
    _instances: [],

    create(target, config) {
      const els = typeof target === 'string'
        ? Array.from(document.querySelectorAll(target))
        : (target instanceof Element ? [target] : Array.from(target || []));

      const instances = els.map((el) => {
        const existing = this._instances.find((inst) => inst.el === el);
        if (existing) { existing.update(config); return existing; }
        const inst = new WonderBGInstance(el, config);
        this._instances.push(inst);
        return inst;
      });

      return instances.length === 1 ? instances[0] : instances;
    },

    autoInit() {
      const presetClassSel = PRESET_NAMES.map((n) => '.wb-' + n).join(',');
      const sel = [
        '[data-wb-background]',
        '[data-wb-background-mode]',
        '[data-grad-preset]',
        '[data-gradframe]',
        '[data-js-background]',
        '[data-js-background-mode]',
        '[data-wonder-bg-preset]',
        '.grad-bg',
        presetClassSel
      ].join(',');
      document.querySelectorAll(sel).forEach((el) => {
        if (this._instances.find((inst) => inst.el === el)) return;
        this._instances.push(new WonderBGInstance(el, {}));
      });
    },

    destroyAll() {
      this._instances.slice().forEach((inst) => inst.destroy());
    },

    registerPreset(name, definition) {
      PRESETS[name] = definition;
      PRESET_NAMES.push(name);
    }
  };

  global.WonderBG = WonderBG;
  global.GradFrame = global.WonderBG;

  function boot() { global.WonderBG.autoInit(); }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})(typeof window !== 'undefined' ? window : this);
