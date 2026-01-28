export const hexToRgb = (hex: string): string | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `${parseInt(result[1]!, 16)} ${parseInt(result[2]!, 16)} ${parseInt(result[3]!, 16)}`
    : null;
};

export const rgbToHex = (rgb?: string | null): string => {
  if (!rgb) return "#000000";
  const parts = rgb.split(" ").map(Number);
  if (parts.length < 3) return "#000000";
  const [r, g, b] = parts;
  if (r === undefined || g === undefined || b === undefined) return "#000000";
  
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
};

export const rgbToHsl = (rgb: string | null): { h: number; s: number; l: number } | null => {
  if (!rgb) return null;
  const parts = rgb.split(" ").map(Number);
  if (parts.length < 3) return null;
  
  const [r, g, b] = parts.map(v => (v ?? 0) / 255);
  if (r === undefined || g === undefined || b === undefined) return null;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  
  if (max === min) {
    return { h: 0, s: 0, l };
  }
  
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  
  let h = 0;
  if (max === r) {
    h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  } else if (max === g) {
    h = ((b - r) / d + 2) / 6;
  } else {
    h = ((r - g) / d + 4) / 6;
  }
  
  return { h: h * 360, s, l };
};

export const hslToRgb = (h: number, s: number, l: number): string => {
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };
  
  const hNorm = h / 360;
  
  if (s === 0) {
    const v = Math.round(l * 255);
    return `${v} ${v} ${v}`;
  }
  
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  
  const r = Math.round(hue2rgb(p, q, hNorm + 1/3) * 255);
  const g = Math.round(hue2rgb(p, q, hNorm) * 255);
  const b = Math.round(hue2rgb(p, q, hNorm - 1/3) * 255);
  
  return `${r} ${g} ${b}`;
};

export const getContrastingTextColor = (rgb: string | null): string => {
  if (!rgb) return "255 255 255";
  const [r, g, b] = rgb.split(" ").map(Number);
  if (r === undefined || g === undefined || b === undefined) return "255 255 255";
  
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? "0 0 0" : "255 255 255";
};

// Boost lightness for dark mode visibility while preserving hue
export const getDarkVariant = (rgb: string | null): string => {
  if (!rgb) return "255 255 255";
  
  const hsl = rgbToHsl(rgb);
  if (!hsl) return "255 255 255";
  
  // For dark mode primary/accent:
  // Ensure it's balanced - not too dark to be seen, not too bright to be jarring
  hsl.l = Math.max(0.5, Math.min(hsl.l, 0.7));
  
  // Desaturate to avoid neon effect
  hsl.s = Math.min(hsl.s, 0.7);
  
  return hslToRgb(hsl.h, hsl.s, hsl.l);
};

export const deriveShade = (rgb: string, factor: number): string => {
  const [r, g, b] = rgb.split(" ").map(Number);
  if (r === undefined || g === undefined || b === undefined) return rgb;
  
  // Positive factor: move towards white (tint)
  // Negative factor: move towards black (shade)
  const adjust = (value: number) => {
    if (factor >= 0) {
      return Math.round(value + (255 - value) * factor);
    } else {
      return Math.round(value * (1 + factor));
    }
  };
  
  return `${Math.min(255, Math.max(0, adjust(r)))} ${Math.min(255, Math.max(0, adjust(g)))} ${Math.min(255, Math.max(0, adjust(b)))}`;
};

export const deriveMuted = (rgb: string): string => {
  const [r, g, b] = rgb.split(" ").map(Number);
  if (r === undefined || g === undefined || b === undefined) return "245 245 245";
  
  const gray = Math.round((r + g + b) / 3);
  const mR = Math.round(r * 0.3 + gray * 0.5 + 128 * 0.2);
  const mG = Math.round(g * 0.3 + gray * 0.5 + 128 * 0.2);
  const mB = Math.round(b * 0.3 + gray * 0.5 + 128 * 0.2);
  
  return `${Math.min(255, mR + 80)} ${Math.min(255, mG + 80)} ${Math.min(255, mB + 80)}`;
};

// ============================================
// CONTRAST DETECTION & SAFE COLOR UTILITIES
// ============================================

/**
 * Calculate relative luminance of a color (WCAG formula)
 */
export const getLuminance = (rgb: string): number => {
  const parts = rgb.split(" ").map(Number);
  const [r, g, b] = parts.map(v => {
    const val = (v ?? 0) / 255;
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * (r ?? 0) + 0.7152 * (g ?? 0) + 0.0722 * (b ?? 0);
};

/**
 * Check if a color is considered "dark" (would need light text on it)
 */
export const isColorDark = (rgb: string | null): boolean => {
  if (!rgb) return false;
  const lum = getLuminance(rgb);
  return lum < 0.4; // Below 0.4 luminance = dark color
};

/**
 * Check if a color is considered "light" (would need dark text on it)
 */
export const isColorLight = (rgb: string | null): boolean => {
  if (!rgb) return true;
  const lum = getLuminance(rgb);
  return lum > 0.6; // Above 0.6 luminance = light color
};

/**
 * Check if foreground color has sufficient contrast against background
 * WCAG AA requires 4.5:1 for normal text, 3:1 for large text
 */
export const hasContrast = (fg: string, bg: string, minRatio = 4.5): boolean => {
  const l1 = getLuminance(fg);
  const l2 = getLuminance(bg);
  const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  return ratio >= minRatio;
};

// Standard backgrounds for reference
const DARK_BG = "10 10 10";   // Dark mode background
const LIGHT_BG = "255 255 255"; // Light mode background
const WHITE = "255 255 255";
const BLACK = "0 0 0";

/**
 * Get a safe text color that will always contrast with the background.
 * Priority: primary → accent → black/white
 * 
 * @param primary - The primary brand color (RGB triplet)
 * @param accent - The accent brand color (RGB triplet)
 * @param isDarkMode - Whether we're in dark mode
 * @returns RGB triplet for safe text color
 */
export const getSafeTextColor = (
  primary: string | null, 
  accent: string | null, 
  isDarkMode: boolean
): string => {
  const bg = isDarkMode ? DARK_BG : LIGHT_BG;
  const fallback = isDarkMode ? WHITE : BLACK;
  
  // First try: Does primary contrast with background?
  if (primary && hasContrast(primary, bg, 4.5)) {
    return primary;
  }
  
  // Second try: Does accent contrast with background?
  if (accent && hasContrast(accent, bg, 4.5)) {
    return accent;
  }
  
  // Last resort: Use black or white
  return fallback;
};

/**
 * Get safe text color for hover states on transparent/subtle backgrounds
 * Similar logic but with relaxed contrast requirements for hover feedback
 */
export const getSafeHoverTextColor = (
  primary: string | null,
  accent: string | null,
  isDarkMode: boolean
): string => {
  const bg = isDarkMode ? DARK_BG : LIGHT_BG;
  const fallback = isDarkMode ? WHITE : BLACK;
  
  // For hover states, we use a slightly relaxed ratio (3.5:1)
  // because hover states are transient and don't need full AA compliance
  if (primary && hasContrast(primary, bg, 3.5)) {
    return primary;
  }
  
  if (accent && hasContrast(accent, bg, 3.5)) {
    return accent;
  }
  
  return fallback;
};

export type ColorMode = "light" | "dark" | "system";

