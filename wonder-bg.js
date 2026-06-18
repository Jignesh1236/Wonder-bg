/*!
 * Wonder Backgrounds v1.5.0
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
 *   grain              — animated film-grain texture overlaid on existing content/images
 *
 * Available presets:
 *   aurora, sunset, ocean, forest, neon, ember, mono, void, meadow, chalkboard,
 *   galaxy, candy, arctic
 *
 * Key behaviours:
 *   - Border-radius is preserved automatically (overflow:hidden applied + restored on destroy)
 *   - Existing children layout is NOT disturbed (position/z-index only set when needed)
 *   - Works on rounded cards, buttons, images — anything
 *   - Grain animates every frame (real film-grain flicker)
 *   - Pauses automatically when off-screen (IntersectionObserver)
 *   - Respects prefers-reduced-motion (renders one static frame instead of blank)
 *   - Auto-destroys when element removed from DOM
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

  // ── Colour lerp helper ──────────────────────────────────────────────────────
  function parseRgba(str) {
    const m = str.match(/[\d.]+/g);
    if (!m) return [0, 0, 0, 1];
    return [+m[0], +m[1], +m[2], m[3] !== undefined ? +m[3] : 1];
  }
  function lerpRgba(a, b, t) {
    const ca = parseRgba(a), cb = parseRgba(b);
    const r = ca[0] + (cb[0] - ca[0]) * t;
    const g = ca[1] + (cb[1] - ca[1]) * t;
    const bv = ca[2] + (cb[2] - ca[2]) * t;
    const al = ca[3] + (cb[3] - ca[3]) * t;
    return `rgba(${Math.round(r)},${Math.round(g)},${Math.round(bv)},${al.toFixed(3)})`;
  }

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
    },
    // ── NEW presets ────────────────────────────────────────────────────────────
    galaxy: {
      background: '#02010a',
      blobs: [
        { color: 'rgba(100,0,200,0.75)',  baseX: 0.30, baseY: 0.45, radius: 0.60, orbitX: 0.12, orbitY: 0.08, phase: 0,   speed: 0.40 },
        { color: 'rgba(0,80,180,0.70)',   baseX: 0.70, baseY: 0.30, radius: 0.55, orbitX: 0.08, orbitY: 0.11, phase: 2.3, speed: 0.30 },
        { color: 'rgba(180,50,255,0.50)', baseX: 0.50, baseY: 0.70, radius: 0.65, orbitX: 0.10, orbitY: 0.07, phase: 4.7, speed: 0.25 }
      ],
      grain: 0.10, blur: 78
    },
    candy: {
      background: '#0a0008',
      blobs: [
        { color: 'rgba(255,80,180,0.85)', baseX: 0.25, baseY: 0.40, radius: 0.55, orbitX: 0.11, orbitY: 0.09, phase: 0,   speed: 0.65 },
        { color: 'rgba(255,200,50,0.70)', baseX: 0.70, baseY: 0.55, radius: 0.50, orbitX: 0.09, orbitY: 0.10, phase: 1.9, speed: 0.55 },
        { color: 'rgba(80,200,255,0.60)', baseX: 0.50, baseY: 0.20, radius: 0.48, orbitX: 0.13, orbitY: 0.06, phase: 3.8, speed: 0.70 }
      ],
      grain: 0.03, blur: 50
    },
    arctic: {
      background: '#010a10',
      blobs: [
        { color: 'rgba(140,220,255,0.75)', baseX: 0.35, baseY: 0.35, radius: 0.58, orbitX: 0.09, orbitY: 0.07, phase: 0,   speed: 0.35 },
        { color: 'rgba(60,160,220,0.65)',  baseX: 0.65, baseY: 0.65, radius: 0.60, orbitX: 0.07, orbitY: 0.10, phase: 2.6, speed: 0.28 },
        { color: 'rgba(200,240,255,0.40)', baseX: 0.50, baseY: 0.20, radius: 0.45, orbitX: 0.11, orbitY: 0.05, phase: 5.0, speed: 0.42 }
      ],
      grain: 0.12, blur: 60
    }
  };

  const DEFAULTS = {
    preset:      'aurora',
    mode:        'gradient',
    speed:       1,
    interactive: false,
    grain:       null,
    blur:        null,
    colors:      null,
    opacity:     1,        // canvas overall opacity (0–1)
    background:  null,     // override preset background color (CSS color string)
    onFrame:     null      // callback(t, instance) called each rendered frame
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
      blur:        get('--wb-background-blur',        '--js-background-blur', '--grad-blur'),
      opacity:     get('--wb-background-opacity')
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
      blur:        d.wbBlur            || d.jsBlur            || d.gradBlur          || d.wonderBgBlur        || undefined,
      opacity:     d.wbOpacity                                                                                 || undefined
    };
  }

  // pick() returns the first defined value from JS config → data-attrs → CSS vars.
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

    const preset = pick('preset') || presetClass || DEFAULTS.preset;
    const mode   = pick('mode')   || DEFAULTS.mode;
    const speed  = parseNum(pick('speed'), DEFAULTS.speed);
    const interactive = parseBool(pick('interactive'), DEFAULTS.interactive);
    const opacity = parseNum(pick('opacity'), DEFAULTS.opacity);

    let grain = pick('grain');
    grain = (grain === undefined || grain === null) ? null : parseNum(grain, null);

    let blur = pick('blur');
    blur = (blur === undefined || blur === null) ? null : parseNum(blur, null);

    const colors     = (jsConfig && jsConfig.colors)     ? jsConfig.colors     : null;
    const background = (jsConfig && jsConfig.background) ? jsConfig.background : null;
    const onFrame    = (jsConfig && typeof jsConfig.onFrame === 'function') ? jsConfig.onFrame : null;

    return { preset, mode, speed, interactive, grain, blur, colors, opacity, background, onFrame };
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
      this._noiseCtx = null;
      this._wrapper = null;
      this._container = null;
      this._savedOverflow = null;
      this._savedPosition = null;
      this._savedVoidStyles = null;  // FIX: save void element original styles
      this._modifiedChildren = [];
      // Preset transition state
      this._trans = null;  // { fromColors, toColors, startTime, duration }
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
        // FIX: save original styles before modifying
        this._savedVoidStyles = {
          display: origEl.style.display,
          width:   origEl.style.width,
          height:  origEl.style.height
        };

        const wrapper = document.createElement('div');
        wrapper.setAttribute('data-wonder-bg-wrapper', '');

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
        const cs = getComputedStyle(origEl);
        if (cs.position === 'static') {
          this._savedPosition = origEl.style.position || '';
          origEl.style.position = 'relative';
        }

        this._savedOverflow = origEl.style.overflow || '';
        if (cs.overflow === 'visible' || cs.overflow === '') {
          origEl.style.overflow = 'hidden';
        }

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

      const canvas = document.createElement('canvas');
      canvas.setAttribute('data-wonder-bg-canvas', '');
      canvas.style.cssText = [
        'position:absolute;inset:0;width:100%;height:100%;',
        'display:block;pointer-events:none;border-radius:inherit;'
      ].join('');

      this._applyCanvasMode(canvas, this.config.mode);
      this._applyCanvasOpacity(canvas, this.config.opacity);

      container.insertBefore(canvas, container.firstChild);

      this.canvas = canvas;
      this.ctx    = canvas.getContext('2d');
    }

    _applyCanvasMode(canvas, mode) {
      if (mode === 'grain' || mode === 'tint') {
        canvas.style.mixBlendMode = 'soft-light';
        canvas.style.zIndex = '2';
      } else {
        canvas.style.mixBlendMode = 'normal';
        canvas.style.zIndex = '0';
      }
    }

    _applyCanvasOpacity(canvas, opacity) {
      canvas.style.opacity = (opacity === null || opacity === undefined) ? '1' : String(opacity);
    }

    _bindEvents() {
      const target = this._container;
      this._evTarget = target;

      this._onResize = () => this._resize();
      window.addEventListener('resize', this._onResize);

      if (this.config.interactive) {
        this._bindPointer(target);
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

    _bindPointer(target) {
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

    _unbindPointer() {
      if (this._onMove && this._evTarget) {
        this._evTarget.removeEventListener('mousemove', this._onMove);
        this._evTarget.removeEventListener('touchmove', this._onMove);
        this._onMove = null;
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
        this._render(t, now);
        if (this.config.onFrame) this.config.onFrame(t, this);
        this._raf = null;
        // FIX: reduced-motion now renders one static frame then stops (not blank)
        if (!this._paused && !this._reducedMotion) {
          this._raf = requestAnimationFrame(loop);
        }
      };
      this._raf = requestAnimationFrame(loop);
    }

    // ── Animated grain ──────────────────────────────────────────────────────────
    // FIX: Noise is regenerated every frame for real film-grain flicker.
    // On mobile, regeneration happens every other frame to save CPU.
    _refreshNoise() {
      const size = 128;
      if (!this._noiseCanvas) {
        this._noiseCanvas = document.createElement('canvas');
        this._noiseCanvas.width = size;
        this._noiseCanvas.height = size;
        this._noiseCtx = this._noiseCanvas.getContext('2d');
        this._noiseFrame = 0;
      }
      // Mobile: skip every other frame for perf
      this._noiseFrame = (this._noiseFrame + 1) | 0;
      if (isMobile && (this._noiseFrame & 1)) return;

      const imgData = this._noiseCtx.createImageData(size, size);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
        const v = (Math.random() * 255) | 0;
        data[i] = v; data[i + 1] = v; data[i + 2] = v; data[i + 3] = 255;
      }
      this._noiseCtx.putImageData(imgData, 0, 0);
    }

    // ── Resolve effective blob colors (with transition lerp) ─────────────────────
    _getBlobColors(preset, now) {
      if (!this._trans) {
        return preset.blobs.map((b, i) =>
          (this.config.colors && this.config.colors[i]) || b.color
        );
      }
      // Lerp transition
      const elapsed = (now - this._trans.startTime) / 1000;
      const progress = Math.min(1, elapsed / this._trans.duration);
      // ease-in-out
      const t = progress < 0.5
        ? 2 * progress * progress
        : -1 + (4 - 2 * progress) * progress;

      const colors = preset.blobs.map((b, i) => {
        const from = this._trans.fromColors[i] || b.color;
        const to   = (this.config.colors && this.config.colors[i]) || b.color;
        return lerpRgba(from, to, t);
      });
      if (progress >= 1) this._trans = null;
      return colors;
    }

    _render(t, now) {
      const ctx    = this.ctx;
      const preset = PRESETS[this.config.preset] || PRESETS.aurora;
      const w = this.width, h = this.height;
      const mode    = this.config.mode;
      const rawBlur = this.config.blur !== null ? this.config.blur : preset.blur;
      const blur    = Math.min(rawBlur, MAX_BLUR);
      const grain   = this.config.grain !== null ? this.config.grain : preset.grain;
      const nowMs   = now || performance.now();

      ctx.clearRect(0, 0, w, h);

      // ── Grain-only mode ──────────────────────────────────────────────────────
      if (mode === 'grain') {
        if (grain > 0) {
          this._refreshNoise();
          this._renderGrainOverlay(grain);
        }
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
        const blobColors = this._getBlobColors(preset, nowMs);
        preset.blobs.forEach((b, i) => {
          const color = blobColors[i];
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
        if (grain > 0) {
          this._refreshNoise();
          this._renderGrainOverlay(grain * 0.6);
        }
        return;
      }

      // ── Gradient mode (default) ───────────────────────────────────────────────
      // FIX: support background override
      ctx.fillStyle = this.config.background || preset.background;
      ctx.fillRect(0, 0, w, h);
      ctx.save();
      ctx.filter = `blur(${blur}px)`;
      const diag = Math.sqrt(w * w + h * h);
      const px = this.config.interactive ? (this.pointer.x - 0.5) * 0.30 : 0;
      const py = this.config.interactive ? (this.pointer.y - 0.5) * 0.30 : 0;
      const blobColors = this._getBlobColors(preset, nowMs);
      preset.blobs.forEach((b, i) => {
        const color = blobColors[i];
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
      if (grain > 0) {
        this._refreshNoise();
        this._applyGrain(grain);
      }
    }

    _applyGrain(amount) {
      const ctx = this.ctx;
      const w = this.width, h = this.height;
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
      ctx.fillStyle = 'rgb(128,128,128)';
      ctx.fillRect(0, 0, w, h);
      ctx.save();
      ctx.globalAlpha = Math.min(1, amount * 1.5);
      ctx.globalCompositeOperation = 'overlay';
      ctx.fillStyle = ctx.createPattern(this._noiseCanvas, 'repeat');
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    }

    // ── Public methods ────────────────────────────────────────────────────────

    /** Pause the animation loop. Frame stays visible. */
    pause() {
      this._paused = true;
    }

    /** Resume the animation loop after pause(). */
    resume() {
      if (!this._paused) return;
      this._paused = false;
      if (!this._raf && !this._destroyed && !this._reducedMotion) {
        this._resumeRaf();
      }
    }

    /** Returns true if currently paused. */
    isPaused() {
      return this._paused;
    }

    update(newConfig) {
      // Handle preset transition — capture current colors before switching
      if (newConfig && newConfig.preset && newConfig.preset !== this.config.preset) {
        const currentPreset = PRESETS[this.config.preset] || PRESETS.aurora;
        const fromColors = currentPreset.blobs.map((b, i) =>
          (this.config.colors && this.config.colors[i]) || b.color
        );
        const duration = (newConfig.transitionDuration !== undefined)
          ? newConfig.transitionDuration
          : 0.6;
        if (duration > 0) {
          this._trans = {
            fromColors,
            startTime: performance.now(),
            duration
          };
        }
      }

      this.jsConfig = Object.assign({}, this.jsConfig, newConfig);
      this.config = resolveConfig(this.el, this.jsConfig);

      // FIX: use helper to correctly set mix-blend-mode ('' doesn't work in all browsers)
      this._applyCanvasMode(this.canvas, this.config.mode);
      // Apply opacity changes
      this._applyCanvasOpacity(this.canvas, this.config.opacity);

      // FIX: handle interactive toggle cleanly
      if (newConfig && newConfig.interactive !== undefined) {
        this._unbindPointer();
        if (this.config.interactive) {
          this._bindPointer(this._evTarget);
        } else {
          // FIX: reset pointer to center when interactive is turned off
          this.pointer.targetX = 0.5;
          this.pointer.targetY = 0.5;
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
      this._unbindPointer();

      if (this.canvas && this.canvas.parentNode) this.canvas.parentNode.removeChild(this.canvas);

      this._modifiedChildren.forEach((child) => {
        child.style.zIndex = '';
      });
      this._modifiedChildren = [];

      if (!this._wrapper) {
        if (this._savedPosition !== null) {
          this.el.style.position = this._savedPosition;
        }
        if (this._savedOverflow !== null) {
          this.el.style.overflow = this._savedOverflow;
        }
      }

      // FIX: restore void element original styles
      if (this._wrapper && this._wrapper.parentNode) {
        if (this._savedVoidStyles) {
          this.el.style.display = this._savedVoidStyles.display;
          this.el.style.width   = this._savedVoidStyles.width;
          this.el.style.height  = this._savedVoidStyles.height;
        }
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
    version: '1.5.0',
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

    // FIX: removed [data-wb-background-mode] alone (without preset) from selector
    // to prevent unintended auto-init on elements that only specify a mode
    autoInit() {
      const presetClassSel = PRESET_NAMES.map((n) => '.wb-' + n).join(',');
      const sel = [
        '[data-wb-background]',
        '[data-grad-preset]',
        '[data-gradframe]',
        '[data-js-background]',
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
    },

    /** Return a copy of all active instances. */
    getAll() {
      return this._instances.slice();
    },

    /** Pause all active instances. */
    pauseAll() {
      this._instances.forEach((inst) => inst.pause());
    },

    /** Resume all active instances. */
    resumeAll() {
      this._instances.forEach((inst) => inst.resume());
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
