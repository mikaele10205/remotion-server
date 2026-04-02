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
  delayRender,
  continueRender,
} from 'remotion';
import { loadFont } from '@remotion/fonts';
import { getBehavior } from './behaviors';
import { getAnimation } from './animations';
import type { ImageMotion } from './animations';
import type { RenderProps } from '../config';
import { BRAND } from '../config';

// Load Inter font files with full latin-ext (Spanish accents)
const waitForFonts = delayRender('Loading Inter fonts');

Promise.all([
  loadFont({
    family: 'Inter',
    url: staticFile('fonts/Inter-Regular.ttf'),
    weight: '400',
  }),
  loadFont({
    family: 'Inter',
    url: staticFile('fonts/Inter-SemiBold.ttf'),
    weight: '600',
  }),
  loadFont({
    family: 'Inter',
    url: staticFile('fonts/Inter-Bold.ttf'),
    weight: '700',
  }),
]).then(() => {
  continueRender(waitForFonts);
}).catch((err) => {
  console.error('Font loading failed:', err);
  continueRender(waitForFonts);
});

const FONT_BRAND = `'Times New Roman', 'Georgia', serif`;
const FONT_BODY = `'Inter', 'Liberation Sans', 'DejaVu Sans', sans-serif`;

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

  // --- Image motion: driven by animation (not just behavior) ---
  // Behavior determines IF text shows; animation determines HOW everything moves
  const motionType = behavior.showTextOverlay ? animation.imageMotion : behavior.imageAnimation as ImageMotion;
  const imageTransform = getImageTransform(motionType, frame, durationInFrames, fps);

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

  // --- Logo fade-in ---
  const logoOpacity = interpolate(frame, [fps * 0.3, fps * 0.8], [0, 0.9], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const logoHeight = Math.round(height * 0.04);
  const logoPadding = Math.round(width * 0.03);

  const gradientStyle = getGradientForAnimation(animation.id);

  return (
    <AbsoluteFill style={{ backgroundColor: BRAND.bgDark, opacity: masterOpacity }}>
      {/* Background image with animation-driven motion */}
      {imageUrl && (
        <AbsoluteFill style={{ overflow: 'hidden' }}>
          <Img
            src={imageUrl}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: imageTransform,
            }}
          />
        </AbsoluteFill>
      )}

      {/* Gradient overlay for text readability */}
      {behavior.showTextOverlay && copy && (
        <AbsoluteFill style={{ background: gradientStyle }} />
      )}

      {/* Scene flash/separator between scenes (visible transition marker) */}
      {behavior.showTextOverlay && copy && animation.id !== 'comunicativa' && scenes.map((_, i) => {
        if (i === 0) return null;
        const flashAt = i * framesPerScene;
        return (
          <Sequence key={`flash-${i}`} from={flashAt - 2} durationInFrames={4}>
            <SceneFlash type={animation.id} fps={fps} />
          </Sequence>
        );
      })}

      {/* Text overlay - scenes */}
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

// --- Image transform per animation type ---
function getImageTransform(motion: ImageMotion | string, frame: number, total: number, fps: number): string {
  const progress = frame / total;

  switch (motion) {
    case 'slow_zoom': {
      // Educativa: very gentle zoom in, almost imperceptible
      const scale = interpolate(frame, [0, total], [1.0, 1.06], { extrapolateRight: 'clamp' });
      return `scale(${scale})`;
    }
    case 'ken_burns_left': {
      // Publicitaria: zoom + pan left — dynamic, drives eye movement
      const scale = interpolate(frame, [0, total], [1.0, 1.18], { extrapolateRight: 'clamp' });
      const tx = interpolate(frame, [0, total], [2, -3], { extrapolateRight: 'clamp' });
      const ty = interpolate(frame, [0, total], [0, -1], { extrapolateRight: 'clamp' });
      return `scale(${scale}) translate(${tx}%, ${ty}%)`;
    }
    case 'ken_burns_right': {
      // Comunicativa: zoom + pan right — balanced, professional
      const scale = interpolate(frame, [0, total], [1.05, 1.12], { extrapolateRight: 'clamp' });
      const tx = interpolate(frame, [0, total], [-1, 2], { extrapolateRight: 'clamp' });
      return `scale(${scale}) translate(${tx}%, 0%)`;
    }
    case 'zoom_pulse': {
      // Promocional: pulsing zoom that breathes with urgency
      const baseScale = interpolate(frame, [0, total], [1.0, 1.15], { extrapolateRight: 'clamp' });
      const pulse = Math.sin(progress * Math.PI * 6) * 0.03;
      return `scale(${baseScale + pulse})`;
    }
    case 'pan_horizontal': {
      // Entretenimiento: slow horizontal sweep with slight zoom
      const scale = interpolate(frame, [0, total], [1.1, 1.15], { extrapolateRight: 'clamp' });
      const tx = interpolate(frame, [0, total], [-3, 3], { extrapolateRight: 'clamp' });
      const ty = Math.sin(progress * Math.PI * 2) * 0.5;
      return `scale(${scale}) translate(${tx}%, ${ty}%)`;
    }
    case 'dramatic_zoom': {
      // Debate: starts wide, then slow intentional zoom — builds tension
      const scale = interpolate(frame, [0, total * 0.3, total], [1.0, 1.02, 1.2], { extrapolateRight: 'clamp' });
      const ty = interpolate(frame, [0, total], [0, -1.5], { extrapolateRight: 'clamp' });
      return `scale(${scale}) translate(0%, ${ty}%)`;
    }
    default: {
      // Fallback: behavior-based (Style A)
      const scale = interpolate(frame, [0, total], [1.0, 1.08], { extrapolateRight: 'clamp' });
      return `scale(${scale})`;
    }
  }
}

// --- Scene flash/separator component ---
const SceneFlash: React.FC<{ type: string; fps: number }> = ({ type, fps }) => {
  const frame = useCurrentFrame();
  let opacity = 0;
  let color = 'rgba(255,255,255,0.15)';

  switch (type) {
    case 'publicitaria':
    case 'promocional':
      // Quick white flash
      opacity = interpolate(frame, [0, 2, 4], [0, 0.2, 0], { extrapolateRight: 'clamp' });
      color = 'rgba(255,255,255,0.25)';
      break;
    case 'debate':
      // Dark flash (dramatic)
      opacity = interpolate(frame, [0, 1, 4], [0, 0.4, 0], { extrapolateRight: 'clamp' });
      color = 'rgba(0,0,0,0.6)';
      break;
    case 'entretenimiento':
      // Color flash with personality
      opacity = interpolate(frame, [0, 2, 4], [0, 0.35, 0], { extrapolateRight: 'clamp' });
      color = 'rgba(0,0,255,0.3)';
      break;
    default:
      opacity = interpolate(frame, [0, 2, 4], [0, 0.1, 0], { extrapolateRight: 'clamp' });
  }

  return <AbsoluteFill style={{ backgroundColor: color, opacity }} />;
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
      // Debate: dramatic pause then sharp appear
      const pauseFrames = Math.round(fps * 0.3);
      const afterPause = Math.max(0, frame - pauseFrames);
      const revealSpring = spring({ frame: afterPause, fps, config: { damping: 15, stiffness: 200 } });
      opacity = interpolate(revealSpring, [0, 1], [0, 1])
        * interpolate(frame, [exitStart, framesPerScene], [1, 0], { extrapolateLeft: 'clamp' });
      scale = interpolate(revealSpring, [0, 1], [1.08, 1]);
      break;
    }
  }

  // Font size responsive to aspect ratio
  const aspect = width / height;
  let fontScale: number;
  if (aspect >= 1.5) {
    // Paisaje (16:9): smaller text relative to width
    fontScale = 0.028;
  } else if (aspect >= 1.0) {
    // Cuadrado (1:1): medium
    fontScale = 0.038;
  } else if (aspect >= 0.7) {
    // Retrato (4:5): medium-large
    fontScale = 0.04;
  } else {
    // Vertical (9:16): use height-based sizing for readability
    fontScale = 0.042;
  }
  const fontSize = Math.round(width * fontScale);

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

const MAX_CHARS_PER_SCENE = 25;

function splitIntoScenes(text: string, sceneCount: number): string[] {
  if (!text || sceneCount <= 0) return [];

  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];

  if (sentences.length <= sceneCount) {
    const scenes = [...sentences];
    while (scenes.length < sceneCount) {
      scenes.push('');
    }
    return scenes.filter(s => s.trim()).map(s => truncateScene(s));
  }

  const perScene = Math.ceil(sentences.length / sceneCount);
  const scenes: string[] = [];
  for (let i = 0; i < sceneCount; i++) {
    const start = i * perScene;
    const end = Math.min(start + perScene, sentences.length);
    scenes.push(sentences.slice(start, end).join(' ').trim());
  }
  return scenes.filter(s => s.trim()).map(s => truncateScene(s));
}

function truncateScene(text: string): string {
  if (text.length <= MAX_CHARS_PER_SCENE) return text;
  // Cut at last space before limit
  const cut = text.lastIndexOf(' ', MAX_CHARS_PER_SCENE);
  if (cut > 0) return text.substring(0, cut) + '...';
  return text.substring(0, MAX_CHARS_PER_SCENE) + '...';
}
