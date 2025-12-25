/**
 * Vision → Narrative ML Service
 * Uses Transformers.js to run ML models entirely in the browser
 * No API calls - everything runs locally
 */

// Transformers.js will be loaded dynamically from CDN
let transformersModule: any = null;

// Load Transformers.js dynamically
const loadTransformers = async () => {
  if (!transformersModule) {
    // @ts-ignore - Dynamic import from CDN
    transformersModule = await import('https://esm.sh/@xenova/transformers@2.17.2');
    // Configure to use browser cache
    transformersModule.env.allowLocalModels = false;
    transformersModule.env.useBrowserCache = true;
  }
  return transformersModule;
};

// Types for Vision Document
export interface VisionDocument {
  coreTheme: string;
  values: string[];
  focusAreas: string[];
  identityStatements: string[];
  nextSteps: {
    habit: string;
    release: string;
    protect: string;
  };
  colorMood: string;
  dominantThemes: string[];
}

// Cache for ML pipelines (lazy loaded)
let sentimentPipeline: any = null;
let featureExtractor: any = null;
let zeroShotClassifier: any = null;

// Loading state
let isLoading = false;
let loadingProgress = 0;

// Value categories for zero-shot classification
const VALUE_CATEGORIES = [
  'peace', 'success', 'creativity', 'health', 'love', 'growth',
  'freedom', 'stability', 'adventure', 'connection', 'wisdom',
  'wealth', 'beauty', 'strength', 'joy', 'purpose', 'balance',
  'ambition', 'mindfulness', 'confidence', 'authenticity', 'gratitude'
];

// Focus area templates
const FOCUS_TEMPLATES = [
  'career and professional growth',
  'relationships and connection',
  'health and wellness',
  'financial stability',
  'creative expression',
  'personal development',
  'spiritual growth',
  'travel and adventure',
  'home and environment',
  'learning and education'
];

// Color mood mapping
const COLOR_MOODS: Record<string, string> = {
  '#ffffff': 'clarity',
  '#f7f7f7': 'minimalist calm',
  '#faf5f0': 'warm grounding',
  '#fff8f3': 'gentle warmth',
  '#fffdf0': 'optimistic brightness',
  '#f5faf7': 'natural balance',
  '#f5f9ff': 'serene focus',
  '#faf5ff': 'creative intuition',
  '#fff5f8': 'soft romance',
  '#fff5f5': 'passionate energy'
};

// Affirmation templates based on values
const AFFIRMATION_TEMPLATES: Record<string, string[]> = {
  peace: [
    'I choose calm over chaos.',
    'My peace is non-negotiable.',
    'Stillness is my strength.'
  ],
  success: [
    'My progress is quiet but consistent.',
    'I am building something meaningful.',
    'Success flows to me naturally.'
  ],
  creativity: [
    'I create without rushing.',
    'My ideas matter.',
    'I trust my creative flow.'
  ],
  health: [
    'I honor my body\'s needs.',
    'Wellness is my priority.',
    'I am healing every day.'
  ],
  love: [
    'I am worthy of deep love.',
    'Love surrounds me.',
    'I open my heart freely.'
  ],
  growth: [
    'I embrace becoming.',
    'Every day I evolve.',
    'Growth is my natural state.'
  ],
  freedom: [
    'I release what no longer serves me.',
    'I am free to be myself.',
    'Liberation is my birthright.'
  ],
  stability: [
    'I am grounded and secure.',
    'I create safety within.',
    'My foundation is strong.'
  ],
  adventure: [
    'I welcome new experiences.',
    'Life is an adventure I embrace.',
    'I am open to possibilities.'
  ],
  wealth: [
    'Abundance flows to me easily.',
    'I am worthy of prosperity.',
    'Money is a tool I use wisely.'
  ],
  balance: [
    'I find harmony in all things.',
    'Balance is my anchor.',
    'I honor all parts of my life.'
  ],
  mindfulness: [
    'I am present in this moment.',
    'I observe without judgment.',
    'Awareness is my gift.'
  ],
  confidence: [
    'I trust myself completely.',
    'I am enough as I am.',
    'My voice matters.'
  ],
  gratitude: [
    'I appreciate what I have.',
    'Gratitude transforms my perspective.',
    'I celebrate small victories.'
  ]
};

// Next step templates
const HABIT_TEMPLATES = [
  'Start each morning with 5 minutes of stillness',
  'Write one thing you\'re grateful for daily',
  'Move your body for 15 minutes each day',
  'Spend time in nature weekly',
  'Create something small every day',
  'Connect with someone meaningful weekly',
  'Review your vision board each morning',
  'Practice one act of self-care daily'
];

const RELEASE_TEMPLATES = [
  'Let go of perfectionism',
  'Release the need for external validation',
  'Stop comparing your journey to others',
  'Release attachment to specific outcomes',
  'Let go of past regrets',
  'Stop rushing your own timeline',
  'Release negative self-talk',
  'Let go of relationships that drain you'
];

const PROTECT_TEMPLATES = [
  'Your morning peace',
  'Your creative time',
  'Your boundaries with others',
  'Your physical energy',
  'Your mental space',
  'Your dreams and aspirations',
  'Your self-worth',
  'Your quiet moments'
];

/**
 * Initialize ML pipelines (lazy loading)
 */
export const initializeML = async (onProgress?: (progress: number) => void): Promise<void> => {
  if (sentimentPipeline && zeroShotClassifier) return;
  if (isLoading) return;
  
  isLoading = true;
  
  try {
    // Load Transformers.js
    onProgress?.(5);
    const transformers = await loadTransformers();
    const { pipeline } = transformers;
    
    // Load sentiment analysis pipeline
    onProgress?.(10);
    sentimentPipeline = await pipeline('sentiment-analysis', 'Xenova/distilbert-base-uncased-finetuned-sst-2-english');
    
    onProgress?.(50);
    
    // Load zero-shot classification for values
    zeroShotClassifier = await pipeline('zero-shot-classification', 'Xenova/mobilebert-uncased-mnli');
    
    onProgress?.(100);
  } catch (error) {
    console.error('Error loading ML models:', error);
    throw error;
  } finally {
    isLoading = false;
  }
};

/**
 * Analyze text content for sentiment and themes
 */
const analyzeText = async (texts: string[]): Promise<{
  overallSentiment: 'positive' | 'negative' | 'neutral';
  sentimentScore: number;
}> => {
  if (!sentimentPipeline || texts.length === 0) {
    return { overallSentiment: 'positive', sentimentScore: 0.7 };
  }
  
  const combinedText = texts.join('. ').slice(0, 512); // Limit for model
  
  try {
    const result = await sentimentPipeline(combinedText);
    const sentiment = result[0];
    
    return {
      overallSentiment: sentiment.label === 'POSITIVE' ? 'positive' : 
                        sentiment.label === 'NEGATIVE' ? 'negative' : 'neutral',
      sentimentScore: sentiment.score
    };
  } catch (error) {
    console.error('Sentiment analysis error:', error);
    return { overallSentiment: 'positive', sentimentScore: 0.7 };
  }
};

/**
 * Extract values from text using zero-shot classification
 */
const extractValues = async (texts: string[]): Promise<string[]> => {
  if (!zeroShotClassifier || texts.length === 0) {
    return ['peace', 'growth', 'balance'];
  }
  
  const combinedText = texts.join('. ').slice(0, 512);
  
  try {
    const result = await zeroShotClassifier(combinedText, VALUE_CATEGORIES, { multi_label: true });
    
    // Get top 5 values with score > 0.3
    const topValues = result.labels
      .filter((_: string, i: number) => result.scores[i] > 0.3)
      .slice(0, 5);
    
    return topValues.length > 0 ? topValues : ['peace', 'growth', 'balance'];
  } catch (error) {
    console.error('Value extraction error:', error);
    return ['peace', 'growth', 'balance'];
  }
};

/**
 * Extract focus areas from text
 */
const extractFocusAreas = async (texts: string[]): Promise<string[]> => {
  if (!zeroShotClassifier || texts.length === 0) {
    return ['personal development', 'health and wellness'];
  }
  
  const combinedText = texts.join('. ').slice(0, 512);
  
  try {
    const result = await zeroShotClassifier(combinedText, FOCUS_TEMPLATES, { multi_label: true });
    
    // Get top 3 focus areas with score > 0.25
    const topFocus = result.labels
      .filter((_: string, i: number) => result.scores[i] > 0.25)
      .slice(0, 3);
    
    return topFocus.length > 0 ? topFocus : ['personal development'];
  } catch (error) {
    console.error('Focus extraction error:', error);
    return ['personal development'];
  }
};

/**
 * Analyze color palette mood
 */
const analyzeColorMood = (colors: string[]): string => {
  if (colors.length === 0) return 'serene clarity';
  
  const moods = colors.map(color => {
    const normalized = color.toLowerCase();
    return COLOR_MOODS[normalized] || 'balanced energy';
  });
  
  // Return most common mood or combine first two
  const moodCounts = moods.reduce((acc, mood) => {
    acc[mood] = (acc[mood] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const sortedMoods = Object.entries(moodCounts).sort((a, b) => b[1] - a[1]);
  
  if (sortedMoods.length >= 2) {
    return `${sortedMoods[0][0]} with ${sortedMoods[1][0]}`;
  }
  
  return sortedMoods[0]?.[0] || 'serene clarity';
};

/**
 * Generate identity statements based on extracted values
 */
const generateIdentityStatements = (values: string[]): string[] => {
  const statements: string[] = [];
  
  for (const value of values.slice(0, 4)) {
    const templates = AFFIRMATION_TEMPLATES[value] || AFFIRMATION_TEMPLATES['growth'];
    const randomTemplate = templates[Math.floor(Math.random() * templates.length)];
    statements.push(randomTemplate);
  }
  
  return statements;
};

/**
 * Generate gentle next steps based on values
 */
const generateNextSteps = (values: string[]): { habit: string; release: string; protect: string } => {
  // Pick contextually relevant suggestions based on top values
  const primaryValue = values[0] || 'balance';
  
  // Select habit based on value
  let habitIndex = Math.floor(Math.random() * HABIT_TEMPLATES.length);
  if (primaryValue === 'mindfulness' || primaryValue === 'peace') habitIndex = 0;
  if (primaryValue === 'gratitude') habitIndex = 1;
  if (primaryValue === 'health') habitIndex = 2;
  if (primaryValue === 'creativity') habitIndex = 4;
  if (primaryValue === 'connection' || primaryValue === 'love') habitIndex = 5;
  
  // Select release based on value
  let releaseIndex = Math.floor(Math.random() * RELEASE_TEMPLATES.length);
  if (primaryValue === 'confidence') releaseIndex = 1;
  if (primaryValue === 'growth') releaseIndex = 2;
  if (primaryValue === 'peace') releaseIndex = 3;
  
  // Select protect based on value
  let protectIndex = Math.floor(Math.random() * PROTECT_TEMPLATES.length);
  if (primaryValue === 'peace') protectIndex = 0;
  if (primaryValue === 'creativity') protectIndex = 1;
  if (primaryValue === 'balance') protectIndex = 2;
  
  return {
    habit: HABIT_TEMPLATES[habitIndex],
    release: RELEASE_TEMPLATES[releaseIndex],
    protect: PROTECT_TEMPLATES[protectIndex]
  };
};

/**
 * Generate core theme sentence
 */
const generateCoreTheme = (values: string[], focusAreas: string[], sentiment: string): string => {
  const primaryValue = values[0] || 'growth';
  const secondaryValue = values[1] || 'peace';
  const primaryFocus = focusAreas[0]?.replace(' and ', ', ') || 'personal development';
  
  const templates = [
    `This board reflects a desire for ${primaryValue} and ${secondaryValue}, centered around ${primaryFocus}.`,
    `A vision of ${primaryValue}, with gentle focus on ${primaryFocus} and ${secondaryValue}.`,
    `Your board speaks of ${primaryValue} — a ${sentiment} journey toward ${primaryFocus}.`,
    `This is a map toward ${primaryValue}, anchored in ${secondaryValue} and ${primaryFocus}.`
  ];
  
  return templates[Math.floor(Math.random() * templates.length)];
};

/**
 * Extract text from board items
 */
const extractBoardText = (items: any[]): string[] => {
  return items
    .filter(item => item.type === 'note' || item.type === 'text')
    .map(item => item.content)
    .filter(Boolean);
};

/**
 * Extract colors from board items
 */
const extractBoardColors = (items: any[]): string[] => {
  const colors: string[] = [];
  
  for (const item of items) {
    if (item.color) {
      // Map note colors to hex
      const colorMap: Record<string, string> = {
        'default': '#ffffff',
        'gray': '#f7f7f7',
        'brown': '#faf5f0',
        'orange': '#fff8f3',
        'yellow': '#fffdf0',
        'green': '#f5faf7',
        'blue': '#f5f9ff',
        'purple': '#faf5ff',
        'pink': '#fff5f8',
        'red': '#fff5f5'
      };
      colors.push(colorMap[item.color] || '#ffffff');
    }
    if (item.fillColor) colors.push(item.fillColor);
    if (item.textColor) colors.push(item.textColor);
  }
  
  return [...new Set(colors)];
};

/**
 * Main function: Generate Vision Document from board items
 */
export const generateVisionDocument = async (
  items: any[],
  onProgress?: (progress: number, status: string) => void
): Promise<VisionDocument> => {
  try {
    // Initialize ML models if needed
    onProgress?.(5, 'loading ml models...');
    await initializeML((p) => onProgress?.(5 + p * 0.4, 'loading ml models...'));
    
    // Extract content from board
    onProgress?.(50, 'analyzing your vision...');
    const texts = extractBoardText(items);
    const colors = extractBoardColors(items);
    
    // Analyze with ML
    onProgress?.(60, 'understanding your values...');
    const [sentimentResult, values] = await Promise.all([
      analyzeText(texts),
      extractValues(texts)
    ]);
    
    onProgress?.(75, 'discovering focus areas...');
    const focusAreas = await extractFocusAreas(texts);
    
    // Generate document sections
    onProgress?.(85, 'creating your narrative...');
    const colorMood = analyzeColorMood(colors);
    const identityStatements = generateIdentityStatements(values);
    const nextSteps = generateNextSteps(values);
    const coreTheme = generateCoreTheme(values, focusAreas, sentimentResult.overallSentiment);
    
    // Get dominant themes from text
    const words = texts.join(' ').toLowerCase().split(/\s+/);
    const wordCounts = words.reduce((acc, word) => {
      if (word.length > 4) acc[word] = (acc[word] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const dominantThemes = Object.entries(wordCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word);
    
    onProgress?.(100, 'complete');
    
    return {
      coreTheme,
      values,
      focusAreas: focusAreas.map(f => f.replace(/^\w/, c => c.toUpperCase())),
      identityStatements,
      nextSteps,
      colorMood,
      dominantThemes: dominantThemes.length > 0 ? dominantThemes : ['your vision', 'your journey']
    };
  } catch (error) {
    console.error('Error generating vision document:', error);
    
    // Return fallback document
    return {
      coreTheme: 'This board reflects your unique vision for the life you\'re creating.',
      values: ['growth', 'peace', 'balance'],
      focusAreas: ['Personal development', 'Wellness'],
      identityStatements: [
        'I am becoming who I want to be.',
        'My journey is valid and meaningful.',
        'I trust my own process.'
      ],
      nextSteps: {
        habit: 'Review your vision board each morning',
        release: 'Let go of comparing yourself to others',
        protect: 'Your creative time and energy'
      },
      colorMood: 'serene clarity',
      dominantThemes: ['vision', 'growth']
    };
  }
};

/**
 * Check if ML is ready
 */
export const isMLReady = (): boolean => {
  return sentimentPipeline !== null && zeroShotClassifier !== null;
};

/**
 * Get loading state
 */
export const getLoadingState = (): { isLoading: boolean; progress: number } => {
  return { isLoading, progress: loadingProgress };
};

