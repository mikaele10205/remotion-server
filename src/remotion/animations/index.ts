export type AnimationId =
  | 'educativa'
  | 'publicitaria'
  | 'comunicativa'
  | 'promocional'
  | 'entretenimiento'
  | 'debate';

export type AnimationConfig = {
  id: AnimationId;
  rhythm: 'slow' | 'medium' | 'medium_high' | 'high' | 'dynamic' | 'dramatic';
  transitionType: 'fade' | 'slide' | 'clean' | 'bounce' | 'character' | 'contrast';
  sceneCount: number;
  description: string;
};

const ANIMATIONS: Record<AnimationId, AnimationConfig> = {
  educativa: {
    id: 'educativa',
    rhythm: 'slow',
    transitionType: 'fade',
    sceneCount: 3,
    description: 'Slow rhythm, soft transitions, long scenes.',
  },
  publicitaria: {
    id: 'publicitaria',
    rhythm: 'medium_high',
    transitionType: 'slide',
    sceneCount: 4,
    description: 'Medium-high rhythm, movement transitions, strong CTA close.',
  },
  comunicativa: {
    id: 'comunicativa',
    rhythm: 'medium',
    transitionType: 'clean',
    sceneCount: 3,
    description: 'Medium rhythm, clean neutral transitions.',
  },
  promocional: {
    id: 'promocional',
    rhythm: 'high',
    transitionType: 'bounce',
    sceneCount: 5,
    description: 'High rhythm, quick cuts, urgency feel.',
  },
  entretenimiento: {
    id: 'entretenimiento',
    rhythm: 'dynamic',
    transitionType: 'character',
    sceneCount: 4,
    description: 'Dynamic with personality, character transitions.',
  },
  debate: {
    id: 'debate',
    rhythm: 'dramatic',
    transitionType: 'contrast',
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
