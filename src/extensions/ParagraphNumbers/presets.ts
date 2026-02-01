/**
 * Paragraph Numbering Presets
 * All available numbering styles for document paragraphs
 */

export interface NumberingPreset {
  id: string
  name: string
  category: 'sequential' | 'hierarchical' | 'legal'
  preview: string
  formatNumber: (index: number, level?: number, parentNumbers?: number[]) => string
}

/**
 * Convert number to Roman numerals
 */
function toRoman(num: number, lowercase = false): string {
  const romanNumerals: [number, string][] = [
    [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
    [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
    [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
  ]
  let result = ''
  for (const [value, symbol] of romanNumerals) {
    while (num >= value) {
      result += symbol
      num -= value
    }
  }
  return lowercase ? result.toLowerCase() : result
}

/**
 * Convert number to alphabetic (a, b, c... aa, ab...)
 */
function toAlpha(num: number, uppercase = false): string {
  let result = ''
  while (num > 0) {
    num--
    result = String.fromCharCode(97 + (num % 26)) + result
    num = Math.floor(num / 26)
  }
  return uppercase ? result.toUpperCase() : result
}

export const PARAGRAPH_NUMBER_PRESETS: NumberingPreset[] = [
  // === SEQUENTIAL STYLES ===
  {
    id: 'seq-numeric',
    name: 'Numbers (1, 2, 3)',
    category: 'sequential',
    preview: '1.\n2.\n3.',
    formatNumber: (index) => `${index}.`,
  },
  {
    id: 'seq-roman',
    name: 'Roman (I, II, III)',
    category: 'sequential',
    preview: 'I.\nII.\nIII.',
    formatNumber: (index) => `${toRoman(index)}.`,
  },
  {
    id: 'seq-roman-lower',
    name: 'Roman lowercase (i, ii, iii)',
    category: 'sequential',
    preview: 'i.\nii.\niii.',
    formatNumber: (index) => `${toRoman(index, true)}.`,
  },
  {
    id: 'seq-alpha',
    name: 'Letters (a, b, c)',
    category: 'sequential',
    preview: 'a.\nb.\nc.',
    formatNumber: (index) => `${toAlpha(index)}.`,
  },
  {
    id: 'seq-alpha-upper',
    name: 'Letters uppercase (A, B, C)',
    category: 'sequential',
    preview: 'A.\nB.\nC.',
    formatNumber: (index) => `${toAlpha(index, true)}.`,
  },
  {
    id: 'seq-hex',
    name: 'Hexadecimal (0x1, 0x2)',
    category: 'sequential',
    preview: '0x1\n0x2\n0x3',
    formatNumber: (index) => `0x${index.toString(16).toUpperCase()}`,
  },

  // === HIERARCHICAL STYLES ===
  {
    id: 'hier-numeric',
    name: 'Hierarchical (1, 1.1, 1.2)',
    category: 'hierarchical',
    preview: '1.\n  1.1\n  1.2\n2.',
    formatNumber: (index, level = 0, parents = []) => {
      const numbers = [...parents, index]
      return numbers.join('.') + (level === 0 ? '.' : '')
    },
  },
  {
    id: 'hier-roman',
    name: 'Hierarchical Roman (I, I.i)',
    category: 'hierarchical',
    preview: 'I.\n  I.i\n  I.ii\nII.',
    formatNumber: (index, level = 0, parents = []) => {
      const formatted = [...parents, index].map((n, i) =>
        i === 0 ? toRoman(n) : toRoman(n, true)
      )
      return formatted.join('.') + (level === 0 ? '.' : '')
    },
  },
  {
    id: 'hier-alpha',
    name: 'Hierarchical Letters (A, A.a)',
    category: 'hierarchical',
    preview: 'A.\n  A.a\n  A.b\nB.',
    formatNumber: (index, level = 0, parents = []) => {
      const formatted = [...parents, index].map((n, i) =>
        i === 0 ? toAlpha(n, true) : toAlpha(n)
      )
      return formatted.join('.') + (level === 0 ? '.' : '')
    },
  },

  // === LEGAL MULTI-LEVEL ===
  {
    id: 'legal-standard',
    name: 'Legal Standard',
    category: 'legal',
    preview: 'Article 1\n  Section 1.1\n    Clause 1.1.1',
    formatNumber: (index, level = 0, parents = []) => {
      const numbers = [...parents, index].join('.')
      const prefixes = ['Article', 'Section', 'Clause', 'Subclause']
      const prefix = prefixes[level] || 'Para'
      return `${prefix} ${numbers}`
    },
  },
  {
    id: 'legal-outline',
    name: 'Legal Outline',
    category: 'legal',
    preview: 'I.\n  A.\n    1.\n      a)',
    formatNumber: (index, level = 0) => {
      const formats = [
        () => `${toRoman(index)}.`,
        () => `${toAlpha(index, true)}.`,
        () => `${index}.`,
        () => `${toAlpha(index)})`,
        () => `(${index})`,
        () => `(${toAlpha(index)})`,
      ]
      return (formats[level] || formats[formats.length - 1])()
    },
  },
  {
    id: 'legal-contract',
    name: 'Contract Style',
    category: 'legal',
    preview: '1.\n  1.1\n    1.1.1\n      (a)',
    formatNumber: (index, level = 0, parents = []) => {
      if (level < 3) {
        const numbers = [...parents, index].join('.')
        return level === 0 ? `${numbers}.` : numbers
      }
      return `(${toAlpha(index)})`
    },
  },
]

export function getPresetById(id: string): NumberingPreset | undefined {
  return PARAGRAPH_NUMBER_PRESETS.find((p) => p.id === id)
}

export function getPresetsByCategory(category: string): NumberingPreset[] {
  return PARAGRAPH_NUMBER_PRESETS.filter((p) => p.category === category)
}
