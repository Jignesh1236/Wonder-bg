/*!
 * Wonder Backgrounds v1.3.0 — TypeScript declarations
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
  | string;

export interface WonderBGConfig {
  preset?: WonderBGPresetName;
  mode?: WonderBGMode;
  speed?: number;
  interactive?: boolean;
  grain?: number | null;
  blur?: number | null;
  colors?: string[] | null;
}

export interface WonderBGInstance {
  readonly el: Element;
  readonly canvas: HTMLCanvasElement;
  readonly config: Required<WonderBGConfig>;

  update(newConfig: Partial<WonderBGConfig>): void;
  destroy(): void;
}

export interface WonderBGStatic {
  readonly version: string;
  readonly presets: Record<string, WonderBGPreset>;
  readonly _instances: WonderBGInstance[];

  create(target: string | Element | NodeList | Element[], config?: WonderBGConfig): WonderBGInstance | WonderBGInstance[];
  autoInit(): void;
  destroyAll(): void;
  registerPreset(name: string, definition: WonderBGPreset): void;
}

declare global {
  interface Window {
    WonderBG: WonderBGStatic;
    GradFrame: WonderBGStatic;
  }
  const WonderBG: WonderBGStatic;
  const GradFrame: WonderBGStatic;
}

export {};
