import React from 'react';
import { Composition } from 'remotion';
import { VideoComposition } from './Composition';
import { CANVAS_MAP, FPS, COMPOSITION_ID } from '../config';
import type { RenderProps } from '../config';

export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id={COMPOSITION_ID}
        component={VideoComposition}
        fps={FPS}
        width={1080}
        height={1080}
        durationInFrames={FPS * 15}
        defaultProps={{
          canvas: 'cuadrado_1x1',
          comportamiento: 'C_general',
          animacion: 'educativa',
          duracion_segundos: 15,
          imageUrl: '',
          copy: null,
          plataforma: 'instagram',
          modelo_imagen: 'nano-banana-pro',
        } satisfies RenderProps}
        calculateMetadata={({ props }) => {
          const canvasConfig = CANVAS_MAP[props.canvas] || CANVAS_MAP['cuadrado_1x1'];
          return {
            width: canvasConfig.width,
            height: canvasConfig.height,
            durationInFrames: Math.round(props.duracion_segundos * FPS),
          };
        }}
      />
    </>
  );
};
