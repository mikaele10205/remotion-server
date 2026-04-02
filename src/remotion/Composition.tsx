import React from 'react';
import {
  AbsoluteFill,
  Img,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  spring,
  Sequence,
  staticFile,
} from 'remotion';
import { getBehavior } from './behaviors';
import { getAnimation } from './animations';
import type { RenderProps } from '../config';
import { BRAND } from '../config';
import { loadFont as loadInter } from '@remotion/google-fonts/Inter';

const { fontFamily: interFont } = loadInter();

const FONT_BRAND = `'Times New Roman', 'Georgia', serif`;
const FONT_BODY = `${interFont}, system-ui, sans-serif`;

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

  // --- Logo fade-in (appears after 0.3s, fades in over 0.5s) ---
  const logoOpacity = interpolate(frame, [fps * 0.3, fps * 0.8], [0, 0.9], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Logo size responsive to canvas
  const logoHeight = Math.round(height * 0.04);
  const logoPadding = Math.round(width * 0.03);

  // Gradient style per animation type
  const gradientStyle = getGradientForAnimation(animation.id);

  return (
    <AbsoluteFill style={{ backgroundColor: BRAND.bgDark, opacity: masterOpacity }}>
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
        <AbsoluteFill style={{ background: gradientStyle }} />
      )}

      {/* Text overlay - scenes (only for Style B/C with copy) */}
      {behavior.showTextOverlay && copy && scenes.map((sceneText, i) => {
        const sceneStart = i * framesPerScene;

        return (
          <Sequence key={i} from={sceneStart} durationInFrames={framesPerScene}>
            <SceneText
              text={sceneText}
              animationId={animation.id}
              transitionType={animation.transitionType}
              fps={fps}
              framesPerScene={framesPerScene}
              width={width}
              height={height}
              isLastScene={i === scenes.length - 1}
              sceneIndex={i}
            />
          </Sequence>
        );
      })}

      {/* Logo (bottom-left) */}
      <AbsoluteFill
        style={{
          justifyContent: 'flex-end',
          alignItems: 'flex-start',
          padding: logoPadding,
          paddingBottom: logoPadding * 1.5,
        }}
      >
        <Img
          src={staticFile('logos/logo-fondo-oscuro.png')}
          style={{
            height: logoHeight,
            opacity: logoOpacity,
            objectFit: 'contain',
          }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// --- Gradient per animation type ---
function getGradientForAnimation(animationId: string): string {
  switch (animationId) {
    case 'educativa':
      return 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.25) 35%, transparent 65%)';
    case 'publicitaria':
      return 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.3) 40%, transparent 70%)';
    case 'comunicativa':
      return 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.15) 35%, transparent 60%)';
    case 'promocional':
      return 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.35) 45%, transparent 75%)';
    case 'entretenimiento':
      return 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.2) 40%, transparent 70%)';
    case 'debate':
      return 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.1) 80%)';
    default:
      return 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.2) 40%, transparent 70%)';
  }
}

// --- Scene text component with enriched transitions ---
const SceneText: React.FC<{
  text: string;
  animationId: string;
  transitionType: string;
  fps: number;
  framesPerScene: number;
  width: number;
  height: number;
  isLastScene: boolean;
  sceneIndex: number;
}> = ({ text, animationId, transitionType, fps, framesPerScene, width, height, isLastScene, sceneIndex }) => {
  const frame = useCurrentFrame();

  const enterDuration = Math.min(fps * 0.4, framesPerScene * 0.2);
  const exitStart = framesPerScene - enterDuration;

  let opacity = 1;
  let translateY = 0;
  let translateX = 0;
  let scale = 1;
  let rotate = 0;

  switch (transitionType) {
    case 'fade': {
      // Educativa: soft, deliberate fade — longer enter for calm feel
      const enterT = enterDuration * 1.5;
      opacity = interpolate(frame, [0, enterT], [0, 1], { extrapolateRight: 'clamp' })
        * interpolate(frame, [exitStart, framesPerScene], [1, 0], { extrapolateLeft: 'clamp' });
      // Subtle float up
      translateY = interpolate(frame, [0, enterT], [8, 0], { extrapolateRight: 'clamp' });
      break;
    }
    case 'slide': {
      // Publicitaria: aggressive slide up + scale
      const slideSpring = spring({ frame, fps, config: { damping: 12, stiffness: 100 } });
      translateY = interpolate(slideSpring, [0, 1], [50, 0]);
      scale = interpolate(slideSpring, [0, 1], [0.9, 1]);
      opacity = interpolate(frame, [0, enterDuration * 0.3], [0, 1], { extrapolateRight: 'clamp' })
        * interpolate(frame, [exitStart, framesPerScene], [1, 0], { extrapolateLeft: 'clamp' });
      // CTA bounce on last scene
      if (isLastScene) {
        const ctaBounce = spring({ frame: Math.max(0, frame - enterDuration), fps, config: { damping: 8, stiffness: 150 } });
        scale = scale * interpolate(ctaBounce, [0, 1], [0.95, 1.02]);
      }
      break;
    }
    case 'clean': {
      // Comunicativa: crisp, no-nonsense appearance
      opacity = interpolate(frame, [0, enterDuration * 0.25], [0, 1], { extrapolateRight: 'clamp' })
        * interpolate(frame, [exitStart, framesPerScene], [1, 0], { extrapolateLeft: 'clamp' });
      break;
    }
    case 'bounce': {
      // Promocional: energetic spring bounce
      const bounceSpring = spring({ frame, fps, config: { damping: 6, stiffness: 200 } });
      scale = interpolate(bounceSpring, [0, 1], [0.6, 1]);
      translateY = interpolate(bounceSpring, [0, 1], [40, 0]);
      opacity = interpolate(frame, [0, enterDuration * 0.2], [0, 1], { extrapolateRight: 'clamp' })
        * interpolate(frame, [exitStart, framesPerScene], [1, 0], { extrapolateLeft: 'clamp' });
      break;
    }
    case 'character': {
      // Entretenimiento: playful entrance with personality
      const charSpring = spring({ frame, fps, config: { damping: 10, stiffness: 120 } });
      const direction = sceneIndex % 2 === 0 ? -1 : 1;
      translateX = interpolate(charSpring, [0, 1], [30 * direction, 0]);
      rotate = interpolate(charSpring, [0, 1], [2 * direction, 0]);
      opacity = interpolate(frame, [0, enterDuration * 0.4], [0, 1], { extrapolateRight: 'clamp' })
        * interpolate(frame, [exitStart, framesPerScene], [1, 0], { extrapolateLeft: 'clamp' });
      break;
    }
    case 'contrast': {
      // Debate: dramatic pause then sharp appear, deliberate hold
      const pauseFrames = Math.round(fps * 0.3);
      const afterPause = Math.max(0, frame - pauseFrames);
      const revealSpring = spring({ frame: afterPause, fps, config: { damping: 15, stiffness: 200 } });
      opacity = interpolate(revealSpring, [0, 1], [0, 1])
        * interpolate(frame, [exitStart, framesPerScene], [1, 0], { extrapolateLeft: 'clamp' });
      scale = interpolate(revealSpring, [0, 1], [1.08, 1]);
      break;
    }
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
          color: BRAND.white,
          fontSize,
          fontFamily: FONT_BODY,
          fontWeight: 600,
          textAlign: 'center',
          lineHeight: 1.4,
          textShadow: '0 2px 10px rgba(0,0,0,0.7), 0 0 30px rgba(0,0,0,0.3)',
          opacity,
          transform: `translateY(${translateY}px) translateX(${translateX}px) scale(${scale}) rotate(${rotate}deg)`,
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
