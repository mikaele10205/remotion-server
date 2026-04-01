export type BehaviorId = 'A_texto_horneado' | 'B_fotorrealista' | 'C_general';

export type BehaviorConfig = {
  id: BehaviorId;
  showTextOverlay: boolean;
  imageAnimation: 'zoom_slow' | 'ken_burns' | 'zoom_medium';
  description: string;
};

const BEHAVIORS: Record<BehaviorId, BehaviorConfig> = {
  A_texto_horneado: {
    id: 'A_texto_horneado',
    showTextOverlay: false,
    imageAnimation: 'zoom_slow',
    description: 'Image has baked text. No overlay, subtle motion only.',
  },
  B_fotorrealista: {
    id: 'B_fotorrealista',
    showTextOverlay: true,
    imageAnimation: 'ken_burns',
    description: 'Photorealistic image. Full text overlay with Ken Burns.',
  },
  C_general: {
    id: 'C_general',
    showTextOverlay: true,
    imageAnimation: 'zoom_medium',
    description: 'General/illustration. Text overlay with moderate animation.',
  },
};

export function getBehavior(id: string): BehaviorConfig {
  const behavior = BEHAVIORS[id as BehaviorId];
  if (!behavior) {
    throw new Error(`Unknown behavior: ${id}. Valid: ${Object.keys(BEHAVIORS).join(', ')}`);
  }
  return behavior;
}
