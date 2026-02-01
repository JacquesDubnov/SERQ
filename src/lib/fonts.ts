/**
 * Font Configuration
 * Top 30 Google Fonts with their available weights
 */

export interface FontConfig {
  name: string;
  family: string; // CSS font-family value
  weights: FontWeight[];
  category: 'sans-serif' | 'serif' | 'display' | 'monospace';
}

export interface FontWeight {
  value: number;
  label: string;
}

// Standard font weights with labels
export const FONT_WEIGHTS: FontWeight[] = [
  { value: 100, label: 'Thin' },
  { value: 200, label: 'Extra Light' },
  { value: 300, label: 'Light' },
  { value: 400, label: 'Regular' },
  { value: 500, label: 'Medium' },
  { value: 600, label: 'Semi Bold' },
  { value: 700, label: 'Bold' },
  { value: 800, label: 'Extra Bold' },
  { value: 900, label: 'Black' },
];

/**
 * Top 30 Google Fonts (by usage statistics)
 * Each font includes its available weights
 */
export const GOOGLE_FONTS: FontConfig[] = [
  // Sans-Serif fonts
  {
    name: 'Roboto',
    family: "'Roboto', sans-serif",
    weights: [100, 300, 400, 500, 700, 900].map(v => FONT_WEIGHTS.find(w => w.value === v)!),
    category: 'sans-serif',
  },
  {
    name: 'Open Sans',
    family: "'Open Sans', sans-serif",
    weights: [300, 400, 500, 600, 700, 800].map(v => FONT_WEIGHTS.find(w => w.value === v)!),
    category: 'sans-serif',
  },
  {
    name: 'Lato',
    family: "'Lato', sans-serif",
    weights: [100, 300, 400, 700, 900].map(v => FONT_WEIGHTS.find(w => w.value === v)!),
    category: 'sans-serif',
  },
  {
    name: 'Montserrat',
    family: "'Montserrat', sans-serif",
    weights: [100, 200, 300, 400, 500, 600, 700, 800, 900].map(v => FONT_WEIGHTS.find(w => w.value === v)!),
    category: 'sans-serif',
  },
  {
    name: 'Poppins',
    family: "'Poppins', sans-serif",
    weights: [100, 200, 300, 400, 500, 600, 700, 800, 900].map(v => FONT_WEIGHTS.find(w => w.value === v)!),
    category: 'sans-serif',
  },
  {
    name: 'Inter',
    family: "'Inter', sans-serif",
    weights: [100, 200, 300, 400, 500, 600, 700, 800, 900].map(v => FONT_WEIGHTS.find(w => w.value === v)!),
    category: 'sans-serif',
  },
  {
    name: 'Raleway',
    family: "'Raleway', sans-serif",
    weights: [100, 200, 300, 400, 500, 600, 700, 800, 900].map(v => FONT_WEIGHTS.find(w => w.value === v)!),
    category: 'sans-serif',
  },
  {
    name: 'Nunito',
    family: "'Nunito', sans-serif",
    weights: [200, 300, 400, 500, 600, 700, 800, 900].map(v => FONT_WEIGHTS.find(w => w.value === v)!),
    category: 'sans-serif',
  },
  {
    name: 'Nunito Sans',
    family: "'Nunito Sans', sans-serif",
    weights: [200, 300, 400, 500, 600, 700, 800, 900].map(v => FONT_WEIGHTS.find(w => w.value === v)!),
    category: 'sans-serif',
  },
  {
    name: 'Work Sans',
    family: "'Work Sans', sans-serif",
    weights: [100, 200, 300, 400, 500, 600, 700, 800, 900].map(v => FONT_WEIGHTS.find(w => w.value === v)!),
    category: 'sans-serif',
  },
  {
    name: 'Rubik',
    family: "'Rubik', sans-serif",
    weights: [300, 400, 500, 600, 700, 800, 900].map(v => FONT_WEIGHTS.find(w => w.value === v)!),
    category: 'sans-serif',
  },
  {
    name: 'PT Sans',
    family: "'PT Sans', sans-serif",
    weights: [400, 700].map(v => FONT_WEIGHTS.find(w => w.value === v)!),
    category: 'sans-serif',
  },
  {
    name: 'Ubuntu',
    family: "'Ubuntu', sans-serif",
    weights: [300, 400, 500, 700].map(v => FONT_WEIGHTS.find(w => w.value === v)!),
    category: 'sans-serif',
  },
  {
    name: 'Fira Sans',
    family: "'Fira Sans', sans-serif",
    weights: [100, 200, 300, 400, 500, 600, 700, 800, 900].map(v => FONT_WEIGHTS.find(w => w.value === v)!),
    category: 'sans-serif',
  },
  {
    name: 'Quicksand',
    family: "'Quicksand', sans-serif",
    weights: [300, 400, 500, 600, 700].map(v => FONT_WEIGHTS.find(w => w.value === v)!),
    category: 'sans-serif',
  },
  {
    name: 'Mulish',
    family: "'Mulish', sans-serif",
    weights: [200, 300, 400, 500, 600, 700, 800, 900].map(v => FONT_WEIGHTS.find(w => w.value === v)!),
    category: 'sans-serif',
  },
  {
    name: 'Barlow',
    family: "'Barlow', sans-serif",
    weights: [100, 200, 300, 400, 500, 600, 700, 800, 900].map(v => FONT_WEIGHTS.find(w => w.value === v)!),
    category: 'sans-serif',
  },
  {
    name: 'DM Sans',
    family: "'DM Sans', sans-serif",
    weights: [400, 500, 700].map(v => FONT_WEIGHTS.find(w => w.value === v)!),
    category: 'sans-serif',
  },
  {
    name: 'Josefin Sans',
    family: "'Josefin Sans', sans-serif",
    weights: [100, 200, 300, 400, 500, 600, 700].map(v => FONT_WEIGHTS.find(w => w.value === v)!),
    category: 'sans-serif',
  },
  {
    name: 'IBM Plex Sans',
    family: "'IBM Plex Sans', sans-serif",
    weights: [100, 200, 300, 400, 500, 600, 700].map(v => FONT_WEIGHTS.find(w => w.value === v)!),
    category: 'sans-serif',
  },
  {
    name: 'Karla',
    family: "'Karla', sans-serif",
    weights: [200, 300, 400, 500, 600, 700, 800].map(v => FONT_WEIGHTS.find(w => w.value === v)!),
    category: 'sans-serif',
  },
  {
    name: 'Manrope',
    family: "'Manrope', sans-serif",
    weights: [200, 300, 400, 500, 600, 700, 800].map(v => FONT_WEIGHTS.find(w => w.value === v)!),
    category: 'sans-serif',
  },
  {
    name: 'Plus Jakarta Sans',
    family: "'Plus Jakarta Sans', sans-serif",
    weights: [200, 300, 400, 500, 600, 700, 800].map(v => FONT_WEIGHTS.find(w => w.value === v)!),
    category: 'sans-serif',
  },
  // Serif fonts
  {
    name: 'Merriweather',
    family: "'Merriweather', serif",
    weights: [300, 400, 700, 900].map(v => FONT_WEIGHTS.find(w => w.value === v)!),
    category: 'serif',
  },
  {
    name: 'Playfair Display',
    family: "'Playfair Display', serif",
    weights: [400, 500, 600, 700, 800, 900].map(v => FONT_WEIGHTS.find(w => w.value === v)!),
    category: 'serif',
  },
  {
    name: 'Libre Baskerville',
    family: "'Libre Baskerville', serif",
    weights: [400, 700].map(v => FONT_WEIGHTS.find(w => w.value === v)!),
    category: 'serif',
  },
  {
    name: 'Lora',
    family: "'Lora', serif",
    weights: [400, 500, 600, 700].map(v => FONT_WEIGHTS.find(w => w.value === v)!),
    category: 'serif',
  },
  {
    name: 'Source Serif 4',
    family: "'Source Serif 4', serif",
    weights: [200, 300, 400, 500, 600, 700, 800, 900].map(v => FONT_WEIGHTS.find(w => w.value === v)!),
    category: 'serif',
  },
  // Display fonts
  {
    name: 'Oswald',
    family: "'Oswald', sans-serif",
    weights: [200, 300, 400, 500, 600, 700].map(v => FONT_WEIGHTS.find(w => w.value === v)!),
    category: 'display',
  },
  // Monospace
  {
    name: 'Roboto Mono',
    family: "'Roboto Mono', monospace",
    weights: [100, 200, 300, 400, 500, 600, 700].map(v => FONT_WEIGHTS.find(w => w.value === v)!),
    category: 'monospace',
  },
];

// Standard font sizes (in px)
export const FONT_SIZES = [
  8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 42, 48, 56, 64, 72, 96,
];

// Default font size
export const DEFAULT_FONT_SIZE = 16;

// System fonts (always available, no Google Fonts needed)
export const SYSTEM_FONTS: FontConfig[] = [
  {
    name: 'System UI',
    family: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
    weights: [100, 200, 300, 400, 500, 600, 700, 800, 900].map(v => FONT_WEIGHTS.find(w => w.value === v)!),
    category: 'sans-serif',
  },
  {
    name: 'Arial',
    family: 'Arial, Helvetica, sans-serif',
    weights: [400, 700].map(v => FONT_WEIGHTS.find(w => w.value === v)!),
    category: 'sans-serif',
  },
  {
    name: 'Times New Roman',
    family: "'Times New Roman', Times, serif",
    weights: [400, 700].map(v => FONT_WEIGHTS.find(w => w.value === v)!),
    category: 'serif',
  },
  {
    name: 'Georgia',
    family: 'Georgia, serif',
    weights: [400, 700].map(v => FONT_WEIGHTS.find(w => w.value === v)!),
    category: 'serif',
  },
  {
    name: 'Courier New',
    family: "'Courier New', Courier, monospace",
    weights: [400, 700].map(v => FONT_WEIGHTS.find(w => w.value === v)!),
    category: 'monospace',
  },
];

// All available fonts
export const ALL_FONTS = [...SYSTEM_FONTS, ...GOOGLE_FONTS];

/**
 * Get font config by name
 */
export function getFontByName(name: string): FontConfig | undefined {
  return ALL_FONTS.find(f => f.name === name);
}

/**
 * Get weight label for a numeric value
 */
export function getWeightLabel(weight: number): string {
  return FONT_WEIGHTS.find(w => w.value === weight)?.label || 'Regular';
}

/**
 * Generate Google Fonts URL for loading
 * Loads all configured fonts with all their weights
 */
export function getGoogleFontsUrl(): string {
  const families = GOOGLE_FONTS.map(font => {
    // Include italic weights too: ital,wght@0,400;0,700;1,400;1,700
    const italicWeights = font.weights.map(w => `1,${w.value}`).join(';');
    const normalWeights = font.weights.map(w => `0,${w.value}`).join(';');
    const familyName = font.name.replace(/ /g, '+');
    return `family=${familyName}:ital,wght@${normalWeights};${italicWeights}`;
  }).join('&');

  return `https://fonts.googleapis.com/css2?${families}&display=swap`;
}
