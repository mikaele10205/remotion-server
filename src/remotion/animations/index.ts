export type AnimationId =
  | 'educativa'
  | 'publicitaria'
  | 'comunicativa'
  | 'promocional'
  | 'entretenimiento'
  | 'debate';

export type ImageMotion = 'slow_zoom' | 'ken_burns_left' | 'ken_burns_right' | 'zoom_pulse' | 'pan_horizontal' | 'dramatic_zoom';

export type AnimationConfig = {
  id: AnimationId;
  rhythm: 'slow' | 'medium' | 'medium_high' | 'high' | 'dynamic' | 'dramatic';
  transitionType: 'fade' | 'slide' | 'clean' | 'bounce' | 'character' | 'contrast';
  imageMotion: ImageMotion;
  sceneCount: number;
  description: string;
};

const ANIMATIONS: Record<AnimationId, AnimationConfig> = {
  educativa: {
    id: 'educativa',
    rhythm: 'slow',
    transitionType: 'fade',
    imageMotion: 'slow_zoom',
    sceneCount: 3,
    description: 'Slow rhythm, soft transitions, long scenes.',
  },
  publicitaria: {
    id: 'publicitaria',
    rhythm: 'medium_high',
    transitionType: 'slide',
    imageMotion: 'ken_burns_left',
    sceneCount: 4,
    description: 'Medium-high rhythm, movement transitions, strong CTA close.',
  },
  comunicativa: {
    id: 'comunicativa',
    rhythm: 'medium',
    transitionType: 'clean',
    imageMotion: 'ken_burns_right',
    sceneCount: 3,
    description: 'Medium rhythm, clean neutral transitions.',
  },
  promocional: {
    id: 'promocional',
    rhythm: 'high',
    transitionType: 'bounce',
    imageMotion: 'zoom_pulse',
    sceneCount: 5,
    description: 'High rhythm, quick cuts, urgency feel.',
  },
  entretenimiento: {
    id: 'entretenimiento',
    rhythm: 'dynamic',
    transitionType: 'character',
    imageMotion: 'pan_horizontal',
    sceneCount: 4,
    description: 'Dynamic with personality, character transitions.',
  },
  debate: {
    id: 'debate',
    rhythm: 'dramatic',
    transitionType: 'contrast',
    imageMotion: 'dramatic_zoom',
    sceneCount: 3,
    description: 'Dramatic rhythm, deliberate pauses, contrasting transitions.',
  },
};

export function getAnimation(id: string): AnimationConfig {
  const animation = ANIMATIONS[id as AnimationId];
  if (!animation) {
    throw new Error(`Unknown animation: ${id}. Valid: ${Object.keys(ANIMATIONS).join(', ')}`);
  }
  return animation;
}
