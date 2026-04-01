export const CANVAS_MAP: Record<string, { width: number; height: number }> = {
  // 9:16 vertical
  'vertical_9x16': { width: 1080, height: 1920 },
  // 4:5 retrato
  'retrato_4x5': { width: 1080, height: 1350 },
  // 16:9 paisaje (alta resolución para LinkedIn)
  'paisaje_16x9_hd': { width: 1920, height: 1080 },
  // 16:9 paisaje (resolución estándar para FB/X)
  'paisaje_16x9': { width: 1280, height: 720 },
  // 1:1 cuadrado
  'cuadrado_1x1': { width: 1080, height: 1080 },
};

export const PLATFORM_CANVAS: Record<string, string> = {
  instagram: 'retrato_4x5',
  facebook: 'paisaje_16x9',
  linkedin: 'paisaje_16x9_hd',
  x: 'paisaje_16x9',
  tiktok: 'vertical_9x16',
};

export const FPS = 30;
export const COMPOSITION_ID = 'Video';

export type RenderProps = {
  canvas: string;
  comportamiento: string;
  animacion: string;
  duracion_segundos: number;
  imageUrl: string;
  copy: string | null;
  plataforma: string;
  modelo_imagen: string;
};
