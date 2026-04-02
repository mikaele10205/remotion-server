import React from 'react';
import {
  AbsoluteFill,
  Img,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  spring,
  Sequence,
} from 'remotion';
import { getBehavior } from './behaviors';
import { getAnimation } from './animations';
import type { RenderProps } from '../config';

export const VideoComposition: React.FC<RenderProps> = ({
  canvas,
  comportamiento,
  animacion,
  duracion_segundos,
  imageUrl,
  copy,
  plataforma,
  modelo_imagen,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames, width, height } = useVideoConfig();

  const behavior = getBehavior(comportamiento);
  const animation = getAnimation(animacion);

  // --- Layer 2: Image behavior ---
  const imageScale = getImageScale(behavior.imageAnimation, frame, durationInFrames);
  const imageTranslateX = getImageTranslateX(behavior.imageAnimation, frame, durationInFrames);
  const imageTranslateY = getImageTranslateY(behavior.imageAnimation, frame, durationInFrames);

  // --- Layer 3: Scene timing ---
  const scenes = copy ? splitIntoScenes(copy, animation.sceneCount) : [];
  const framesPerScene = Math.floor(durationInFrames / Math.max(animation.sceneCount, 1));

  // --- Fade in/out for entire video ---
  const fadeIn = interpolate(frame, [0, fps * 0.5], [0, 1], { extrapolateRight: 'clamp' });
  const fadeOut = interpolate(
    frame,
    [durationInFrames - fps * 0.5, durationInFrames],
    [1, 0],
    { extrapolateLeft: 'clamp' }
  );
  const masterOpacity = fadeIn * fadeOut;

  return (
    <AbsoluteFill style={{ backgroundColor: '#0a0a1a', opacity: masterOpacity }}>
      {/* Background image with behavior animation */}
      {imageUrl && (
        <AbsoluteFill>
          <Img
            src={imageUrl}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: `scale(${imageScale}) translate(${imageTranslateX}%, ${imageTranslateY}%)`,
            }}
          />
        </AbsoluteFill>
      )}

      {/* Gradient overlay for text readability (only if showing text) */}
      {behavior.showTextOverlay && copy && (
        <AbsoluteFill
          style={{
            background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.2) 40%, transparent 70%)',
          }}
        />
      )}

      {/* Text overlay - scenes (only for Style B/C with copy) */}
      {behavior.showTextOverlay && copy && scenes.map((sceneText, i) => {
        const sceneStart = i * framesPerScene;
        const sceneEnd = sceneStart + framesPerScene;

        return (
          <Sequence key={i} from={sceneStart} durationInFrames={framesPerScene}>
            <SceneText
              text={sceneText}
              transitionType={animation.transitionType}
              fps={fps}
              framesPerScene={framesPerScene}
              width={width}
              height={height}
              isLastScene={i === scenes.length - 1}
            />
          </Sequence>
        );
      })}

      {/* Logo placeholder (bottom-left) */}
      <AbsoluteFill
        style={{
          justifyContent: 'flex-end',
          alignItems: 'flex-start',
          padding: Math.round(width * 0.03),
        }}
      >
        <div
          style={{
            color: 'rgba(255,255,255,0.8)',
            fontSize: Math.round(width * 0.025),
            fontFamily: "'Liberation Sans', 'DejaVu Sans', 'Noto Sans', sans-serif",
            fontWeight: 700,
            letterSpacing: 1,
          }}
        >
          XPERTIA TECH
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// --- Scene text component with transitions ---
const SceneText: React.FC<{
  text: string;
  transitionType: string;
  fps: number;
  framesPerScene: number;
  width: number;
  height: number;
  isLastScene: boolean;
}> = ({ text, transitionType, fps, framesPerScene, width, height, isLastScene }) => {
  const frame = useCurrentFrame();

  const enterDuration = Math.min(fps * 0.4, framesPerScene * 0.2);
  const exitStart = framesPerScene - enterDuration;

  let opacity = 1;
  let translateY = 0;
  let translateX = 0;
  let scale = 1;

  switch (transitionType) {
    case 'fade':
      opacity = interpolate(frame, [0, enterDuration], [0, 1], { extrapolateRight: 'clamp' })
        * interpolate(frame, [exitStart, framesPerScene], [1, 0], { extrapolateLeft: 'clamp' });
      break;
    case 'slide':
      translateY = interpolate(frame, [0, enterDuration], [30, 0], { extrapolateRight: 'clamp' });
      opacity = interpolate(frame, [0, enterDuration * 0.5], [0, 1], { extrapolateRight: 'clamp' })
        * interpolate(frame, [exitStart, framesPerScene], [1, 0], { extrapolateLeft: 'clamp' });
      break;
    case 'clean':
      opacity = interpolate(frame, [0, enterDuration * 0.3], [0, 1], { extrapolateRight: 'clamp' })
        * interpolate(frame, [exitStart, framesPerScene], [1, 0], { extrapolateLeft: 'clamp' });
      break;
    case 'bounce':
      scale = interpolate(frame, [0, enterDuration], [0.8, 1], { extrapolateRight: 'clamp' });
      opacity = interpolate(frame, [0, enterDuration * 0.3], [0, 1], { extrapolateRight: 'clamp' })
        * interpolate(frame, [exitStart, framesPerScene], [1, 0], { extrapolateLeft: 'clamp' });
      break;
    case 'character':
      translateX = interpolate(frame, [0, enterDuration], [-20, 0], { extrapolateRight: 'clamp' });
      opacity = interpolate(frame, [0, enterDuration * 0.5], [0, 1], { extrapolateRight: 'clamp' })
        * interpolate(frame, [exitStart, framesPerScene], [1, 0], { extrapolateLeft: 'clamp' });
      break;
    case 'contrast':
      opacity = interpolate(frame, [0, enterDuration * 0.2], [0, 1], { extrapolateRight: 'clamp' })
        * interpolate(frame, [exitStart, framesPerScene], [1, 0], { extrapolateLeft: 'clamp' });
      scale = interpolate(frame, [0, enterDuration], [1.05, 1], { extrapolateRight: 'clamp' });
      break;
  }

  const fontSize = Math.round(width * 0.045);

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingBottom: height * 0.12,
        paddingLeft: width * 0.06,
        paddingRight: width * 0.06,
      }}
    >
      <div
        style={{
          color: 'white',
          fontSize,
          fontFamily: "'Liberation Sans', 'DejaVu Sans', 'Noto Sans', sans-serif",
          fontWeight: 600,
          textAlign: 'center',
          lineHeight: 1.4,
          textShadow: '0 2px 8px rgba(0,0,0,0.6)',
          opacity,
          transform: `translateY(${translateY}px) translateX(${translateX}px) scale(${scale})`,
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
};

// --- Helpers ---

function getImageScale(animationType: string, frame: number, total: number): number {
  switch (animationType) {
    case 'zoom_slow':
      return interpolate(frame, [0, total], [1.0, 1.08], { extrapolateRight: 'clamp' });
    case 'ken_burns':
      return interpolate(frame, [0, total], [1.0, 1.15], { extrapolateRight: 'clamp' });
    case 'zoom_medium':
      return interpolate(frame, [0, total], [1.0, 1.12], { extrapolateRight: 'clamp' });
    default:
      return 1.0;
  }
}

function getImageTranslateX(animationType: string, frame: number, total: number): number {
  switch (animationType) {
    case 'ken_burns':
      return interpolate(frame, [0, total], [0, -2], { extrapolateRight: 'clamp' });
    default:
      return 0;
  }
}

function getImageTranslateY(animationType: string, frame: number, total: number): number {
  switch (animationType) {
    case 'ken_burns':
      return interpolate(frame, [0, total], [0, -1], { extrapolateRight: 'clamp' });
    case 'zoom_slow':
      return interpolate(frame, [0, total], [0, -0.5], { extrapolateRight: 'clamp' });
    default:
      return 0;
  }
}

function splitIntoScenes(text: string, sceneCount: number): string[] {
  if (!text || sceneCount <= 0) return [];

  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];

  if (sentences.length <= sceneCount) {
    const scenes = [...sentences];
    while (scenes.length < sceneCount) {
      scenes.push('');
    }
    return scenes.filter(s => s.trim());
  }

  const perScene = Math.ceil(sentences.length / sceneCount);
  const scenes: string[] = [];
  for (let i = 0; i < sceneCount; i++) {
    const start = i * perScene;
    const end = Math.min(start + perScene, sentences.length);
    scenes.push(sentences.slice(start, end).join(' ').trim());
  }
  return scenes.filter(s => s.trim());
}
