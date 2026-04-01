import { CANVAS_MAP } from '../../config';

export type CanvasConfig = {
  width: number;
  height: number;
};

export function getCanvasConfig(canvasId: string): CanvasConfig {
  const config = CANVAS_MAP[canvasId];
  if (!config) {
    throw new Error(`Unknown canvas: ${canvasId}. Valid: ${Object.keys(CANVAS_MAP).join(', ')}`);
  }
  return config;
}
