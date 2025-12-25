
// Curated font system for viral-worthy vision boards
// Max 2-3 fonts per pairing: primary (identity), secondary (body), accent (notes)

export interface FontPairing {
  id: string;
  name: string;
  vibe: string;
  heading: string;
  body: string;
  accent: string;
  description: string;
}

export const FONT_PAIRINGS: FontPairing[] = [
  {
    id: 'soft-girl',
    name: 'soft girl era',
    vibe: 'dreamy & shareable',
    heading: "'Playfair Display', serif",
    body: "'Inter', sans-serif",
    accent: "'Caveat', cursive",
    description: 'pinterest aesthetic'
  },
  {
    id: 'calm-luxury',
    name: 'calm luxury',
    vibe: 'timeless & premium',
    heading: "'Libre Baskerville', serif",
    body: "'DM Sans', sans-serif",
    accent: "'DM Sans', sans-serif",
    description: 'elegant simplicity'
  },
  {
    id: 'modern-glow',
    name: 'modern glow',
    vibe: 'playful & fresh',
    heading: "'Fraunces', serif",
    body: "'Plus Jakarta Sans', sans-serif",
    accent: "'Patrick Hand', cursive",
    description: 'personality without clutter'
  },
  {
    id: 'ultra-minimal',
    name: 'ultra minimal',
    vibe: 'clean & focused',
    heading: "'Inter', sans-serif",
    body: "'Inter', sans-serif",
    accent: "'Inter', sans-serif",
    description: 'surprisingly powerful'
  },
  {
    id: 'editorial-journal',
    name: 'editorial journal',
    vibe: 'personal & intimate',
    heading: "'Cormorant Garamond', serif",
    body: "'DM Sans', sans-serif",
    accent: "'Kalam', cursive",
    description: 'feels like a diary'
  }
];

// Letter spacing presets
export const LETTER_SPACING = [
  { id: 'tight', name: 'tight', value: '-0.02em' },
  { id: 'normal', name: 'normal', value: '0' },
  { id: 'airy', name: 'airy', value: '0.05em' }
];

// Font weight presets
export const FONT_WEIGHTS = [
  { id: 'light', name: 'light', value: 300 },
  { id: 'regular', name: 'regular', value: 400 },
  { id: 'medium', name: 'medium', value: 500 },
  { id: 'bold', name: 'bold', value: 700 }
];

// Text colors - curated palette
export const TEXT_COLORS = [
  { id: 'default', name: 'default', value: '#374151' },
  { id: 'black', name: 'black', value: '#000000' },
  { id: 'gray', name: 'gray', value: '#6b7280' },
  { id: 'brown', name: 'brown', value: '#92400e' },
  { id: 'orange', name: 'orange', value: '#ea580c' },
  { id: 'amber', name: 'amber', value: '#d97706' },
  { id: 'yellow', name: 'yellow', value: '#ca8a04' },
  { id: 'lime', name: 'lime', value: '#65a30d' },
  { id: 'green', name: 'green', value: '#16a34a' },
  { id: 'teal', name: 'teal', value: '#0d9488' },
  { id: 'cyan', name: 'cyan', value: '#0891b2' },
  { id: 'blue', name: 'blue', value: '#2563eb' },
  { id: 'indigo', name: 'indigo', value: '#4f46e5' },
  { id: 'violet', name: 'violet', value: '#7c3aed' },
  { id: 'purple', name: 'purple', value: '#9333ea' },
  { id: 'fuchsia', name: 'fuchsia', value: '#c026d3' },
  { id: 'pink', name: 'pink', value: '#db2777' },
  { id: 'rose', name: 'rose', value: '#e11d48' },
  { id: 'red', name: 'red', value: '#dc2626' },
];

// Handwritten fonts for notes
export const HANDWRITTEN_FONTS = [
  { id: 'caveat', name: 'caveat', family: "'Caveat', cursive" },
  { id: 'patrick', name: 'patrick hand', family: "'Patrick Hand', cursive" },
  { id: 'kalam', name: 'kalam', family: "'Kalam', cursive" },
  { id: 'reenie', name: 'reenie beanie', family: "'Reenie Beanie', cursive" }
];

// Clean fonts for notes
export const CLEAN_FONTS = [
  { id: 'inter', name: 'inter', family: "'Inter', sans-serif" },
  { id: 'dm-sans', name: 'dm sans', family: "'DM Sans', sans-serif" },
  { id: 'jakarta', name: 'jakarta', family: "'Plus Jakarta Sans', sans-serif" }
];

// All note fonts combined
export const NOTE_FONTS = [
  ...CLEAN_FONTS,
  ...HANDWRITTEN_FONTS
];

export const getDefaultPairing = () => FONT_PAIRINGS[0];

