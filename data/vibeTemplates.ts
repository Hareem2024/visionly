
// Mood-based vibe templates - people share vibes, not goals

export interface VibeTemplate {
  id: string;
  name: string;
  tagline: string;
  emoji: string;
  colors: string[];
  suggestedStickers: string[];
  affirmation: string;
}

export const VIBE_TEMPLATES: VibeTemplate[] = [
  {
    id: 'calm-life',
    name: 'calm life',
    tagline: 'peace is productive',
    emoji: '🌿',
    colors: ['#f5f7f5', '#e8ece8', '#d4dcd4', '#c0cec0'],
    suggestedStickers: ['p1', 'p2', 'p3'],
    affirmation: 'stillness is where clarity lives'
  },
  {
    id: 'main-character',
    name: 'main character',
    tagline: 'this is your story',
    emoji: '✨',
    colors: ['#fff8f5', '#ffe4d6', '#ffd4c4', '#ffc4b0'],
    suggestedStickers: ['c1', 'c2', 'c3'],
    affirmation: 'you are exactly where you need to be'
  },
  {
    id: 'soft-reset',
    name: 'soft reset',
    tagline: 'begin again, gently',
    emoji: '🌙',
    colors: ['#f8f5ff', '#ede5ff', '#e2d5ff', '#d7c5ff'],
    suggestedStickers: ['s1', 's2', 's3'],
    affirmation: 'every moment is a fresh start'
  },
  {
    id: 'disciplined-era',
    name: 'disciplined era',
    tagline: 'quiet consistency wins',
    emoji: '📖',
    colors: ['#f7f5f3', '#ebe5df', '#dfd5cb', '#d3c5b7'],
    suggestedStickers: ['v1', 'v2', 'v3'],
    affirmation: 'small steps lead to big changes'
  },
  {
    id: 'healing-season',
    name: 'healing season',
    tagline: 'rest is revolutionary',
    emoji: '🦋',
    colors: ['#f5f9ff', '#e5efff', '#d5e5ff', '#c5dbff'],
    suggestedStickers: ['s4', 's5', 's6'],
    affirmation: 'your healing matters'
  },
  {
    id: 'rich-in-peace',
    name: 'rich in peace',
    tagline: 'abundance without anxiety',
    emoji: '🕯️',
    colors: ['#faf8f5', '#f0ebe3', '#e6ded1', '#dcd1bf'],
    suggestedStickers: ['v4', 'v5', 'v6'],
    affirmation: 'true wealth is inner calm'
  },
  {
    id: 'quiet-luxury',
    name: 'quiet luxury',
    tagline: 'elegant simplicity',
    emoji: '🤍',
    colors: ['#fafafa', '#f0f0f0', '#e6e6e6', '#dcdcdc'],
    suggestedStickers: ['c4', 'c5', 'c6'],
    affirmation: 'less but better'
  },
  {
    id: 'glow-up',
    name: 'glow up (subtle)',
    tagline: 'becoming, not proving',
    emoji: '🌸',
    colors: ['#fff5f8', '#ffe5ec', '#ffd5e0', '#ffc5d4'],
    suggestedStickers: ['c7', 'c8', 'c9'],
    affirmation: 'you are already glowing'
  },
  {
    id: 'slow-success',
    name: 'slow success',
    tagline: 'sustainable growth',
    emoji: '🌱',
    colors: ['#f5faf5', '#e5f0e5', '#d5e6d5', '#c5dcc5'],
    suggestedStickers: ['s7', 's8', 's9'],
    affirmation: 'trust the process'
  },
  {
    id: 'soft-focus',
    name: 'soft focus',
    tagline: 'clarity without chaos',
    emoji: '🔮',
    colors: ['#f8f5fa', '#ede5f0', '#e2d5e6', '#d7c5dc'],
    suggestedStickers: ['p4', 'p5', 'p6'],
    affirmation: 'what matters will reveal itself'
  }
];

// Emotion-based color palettes with tooltips
export const EMOTION_PALETTES = [
  { 
    id: 'soft-focus', 
    name: 'soft focus', 
    feeling: 'gentle clarity', 
    colors: ['#fafafa', '#f5f5f5', '#efefef', '#e8e8e8'],
    emoji: '🌫️'
  },
  { 
    id: 'grounded', 
    name: 'grounded', 
    feeling: 'stable & secure', 
    colors: ['#f7f5f3', '#ebe5df', '#d4ccc0', '#c4b8a8'],
    emoji: '🌿'
  },
  { 
    id: 'airy', 
    name: 'airy', 
    feeling: 'light & free', 
    colors: ['#f8fbff', '#e8f4ff', '#d8edff', '#c8e6ff'],
    emoji: '☁️'
  },
  { 
    id: 'warm-ambition', 
    name: 'warm ambition', 
    feeling: 'motivated & cozy', 
    colors: ['#fff8f3', '#ffeddf', '#ffe2cb', '#ffd7b7'],
    emoji: '🔥'
  },
  { 
    id: 'calm-luxury', 
    name: 'calm luxury', 
    feeling: 'elegant peace', 
    colors: ['#f8f5f0', '#f0ebe3', '#e8e1d6', '#e0d7c9'],
    emoji: '✨'
  },
  { 
    id: 'rose-tinted', 
    name: 'rose tinted', 
    feeling: 'hopeful & soft', 
    colors: ['#fff5f7', '#ffe8ec', '#ffdbe1', '#ffced6'],
    emoji: '🌷'
  },
  { 
    id: 'midnight-calm', 
    name: 'midnight calm', 
    feeling: 'deep & restful', 
    colors: ['#f5f5f8', '#e5e5ef', '#d5d5e6', '#c5c5dd'],
    emoji: '🌙'
  },
  { 
    id: 'fresh-start', 
    name: 'fresh start', 
    feeling: 'new beginnings', 
    colors: ['#f5faf7', '#e5f2ea', '#d5eadd', '#c5e2d0'],
    emoji: '🌱'
  }
];

// AI-generated vibe names for boards
export const VIBE_NAME_STARTERS = [
  'soft', 'quiet', 'slow', 'gentle', 'rich', 'calm', 'deep', 'warm', 'wild', 'free'
];

export const VIBE_NAME_ENDINGS = [
  'discipline', 'glow', 'focus', 'rise', 'peace', 'abundance', 'clarity', 'healing', 'becoming', 'season'
];

export const generateVibeName = (): string => {
  const starter = VIBE_NAME_STARTERS[Math.floor(Math.random() * VIBE_NAME_STARTERS.length)];
  const ending = VIBE_NAME_ENDINGS[Math.floor(Math.random() * VIBE_NAME_ENDINGS.length)];
  return `${starter} ${ending}`;
};

