/*!
 * Wonder Backgrounds v1.5.0 — TypeScript declarations
 */

export interface WonderBGBlobConfig {
  color: string;
  baseX: number;
  baseY: number;
  radius: number;
  orbitX: number;
  orbitY: number;
  phase: number;
  speed: number;
}

export interface WonderBGPreset {
  background: string;
  blobs: WonderBGBlobConfig[];
  grain: number;
  blur: number;
}

export type WonderBGMode = 'gradient' | 'grain' | 'tint';

export type WonderBGPresetName =
  | 'aurora'
  | 'sunset'
  | 'ocean'
  | 'forest'
  | 'neon'
  | 'ember'
  | 'mono'
  | 'void'
  | 'meadow'
  | 'chalkboard'
  | 'galaxy'
  | 'candy'
  | 'arctic'
  | string;

export interface WonderBGConfig {
  preset?:             WonderBGPresetName;
  mode?:               WonderBGMode;
  speed?:              number;
  interactive?:        boolean;
  grain?:              number | null;
  blur?:               number | null;
  colors?:             string[] | null;
  /** Overall canvas opacity (0–1). Default: 1. */
  opacity?:            number;
  /** Override the preset's dark background colour (any CSS colour string). */
  background?:         string | null;
  /** Grain flicker rate: 0 = static texture, 1 = refresh every frame (max flicker). Default: 1. */
  grainSpeed?:         number;
  /** Smooth preset-switch transition duration in seconds. Default: 0.6. Pass 0 to disable. */
  transitionDuration?: number;
  /** Callback fired after each rendered frame: (t: number, instance: WonderBGInstance) => void */
  onFrame?:            ((t: number, instance: WonderBGInstance) => void) | null;
}

export interface WonderBGInstance {
  readonly el:     Element;
  readonly canvas: HTMLCanvasElement;
  readonly config: Required<WonderBGConfig>;

  /** Live-update any config property. Preset changes animate smoothly. */
  update(newConfig: Partial<WonderBGConfig>): void;

  /** Pause the animation loop. The last rendered frame stays visible. */
  pause(): void;

  /** Resume a paused animation loop. */
  resume(): void;

  /** Returns true if the instance is currently paused. */
  isPaused(): boolean;

  /** Stop animation and remove all injected DOM elements. */
  destroy(): void;
}

export interface WonderBGStatic {
  readonly version:    string;
  readonly presets:    Record<string, WonderBGPreset>;
  readonly _instances: WonderBGInstance[];

  /** Create one or more animated backgrounds. Returns a single instance or an array. */
  create(target: string | Element | NodeList | Element[], config?: WonderBGConfig): WonderBGInstance | WonderBGInstance[];

  /** Auto-initialise all elements with wb-* classes or data-wb-background attributes. */
  autoInit(): void;

  /** Destroy all active instances. */
  destroyAll(): void;

  /** Register a custom preset by name. */
  registerPreset(name: string, definition: WonderBGPreset): void;

  /** Return a shallow copy of all active instances. */
  getAll(): WonderBGInstance[];

  /** Pause all active instances. */
  pauseAll(): void;

  /** Resume all active instances. */
  resumeAll(): void;
}

declare global {
  interface Window {
    WonderBG:  WonderBGStatic;
    GradFrame: WonderBGStatic;
  }
  const WonderBG:  WonderBGStatic;
  const GradFrame: WonderBGStatic;
}

export {};
