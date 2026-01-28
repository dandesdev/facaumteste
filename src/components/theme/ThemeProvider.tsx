"use client";


import { deriveMuted, deriveShade, getContrastingTextColor, getDarkVariant, getSafeHoverTextColor } from "~/lib/colors";

interface ThemeProviderProps {
  children: React.ReactNode;
  theme?: {
    primary?: string;
    secondary?: string;
    accent?: string;
    radius?: number;
  };
}

export function ThemeProvider({ children, theme: providedTheme }: ThemeProviderProps) {
  const theme = providedTheme || {};

  // 1. Resolve Colors
  const primary = theme.primary;
  const secondary = theme.secondary;
  const accent = theme.accent;

  // 2. Light Mode Derivations
  const lightPrimaryFg = primary ? getContrastingTextColor(primary) : "";
  const lightSecondaryFg = secondary ? getContrastingTextColor(secondary) : "";
  const lightAccentFg = accent ? getContrastingTextColor(accent) : "";
  const lightMuted = primary ? deriveMuted(primary) : "";
  const lightBorder = primary ? deriveShade(primary, 0.85) : "";
  const lightSidebarBg = primary ? deriveShade(primary, 0.8) : "";
  const lightSidebarFg = lightSidebarBg ? getContrastingTextColor(lightSidebarBg) : "";
  
  // Safe hover text color for light mode (contrasts with white background)
  const lightSafeHoverText = (primary || accent) 
    ? getSafeHoverTextColor(primary ?? null, accent ?? null, false) 
    : "";

  // 3. Dark Mode Derivations
  const darkPrimary = primary ? getDarkVariant(primary) : "";
  const darkPrimaryFg = darkPrimary ? getContrastingTextColor(darkPrimary) : "";
  const darkSecondary = secondary ? getDarkVariant(secondary) : "";
  const darkSecondaryFg = darkSecondary ? getContrastingTextColor(darkSecondary) : "";
  const darkAccent = accent ? getDarkVariant(accent) : "";
  const darkAccentFg = darkAccent ? getContrastingTextColor(darkAccent) : "";
  const darkMuted = darkPrimary ? deriveShade(darkPrimary, -0.92) : "";
  const darkBorder = darkPrimary ? deriveShade(darkPrimary, -0.85) : "";
  const darkSidebarBg = darkPrimary ? deriveShade(darkPrimary, -0.7) : "";
  const darkSidebarFg = darkSidebarBg ? getContrastingTextColor(darkSidebarBg) : "";
  
  // Safe hover text color for dark mode (contrasts with dark background)
  // IMPORTANT: Use ORIGINAL colors, not darkVariant versions!
  // If user picks light accent, we want that light color as text on dark bg
  const darkSafeHoverText = (primary || accent)
    ? getSafeHoverTextColor(primary ?? null, accent ?? null, true)
    : "";

  // 4. Variable Sets
  const lightVars = [
    primary ? `--primary: ${primary};` : "",
    lightPrimaryFg ? `--primary-foreground: ${lightPrimaryFg};` : "",
    secondary ? `--secondary: ${secondary};` : "",
    lightSecondaryFg ? `--secondary-foreground: ${lightSecondaryFg};` : "",
    accent ? `--accent: ${accent};` : "",
    lightAccentFg ? `--accent-foreground: ${lightAccentFg};` : "",
    
    lightMuted ? `--muted: ${lightMuted};` : "",
    lightMuted ? `--muted-foreground: 115 115 115;` : "",
    
    lightBorder ? `--border: ${lightBorder};` : "",
    lightBorder ? `--input: ${lightBorder};` : "",
    primary ? `--ring: ${primary};` : "",

    // Brand text - pre-calculated for contrast
    lightSafeHoverText ? `--brand-text: ${lightSafeHoverText};` : "",

    // Sidebar
    lightSidebarBg ? `--sidebar: ${lightSidebarBg};` : "",
    lightSidebarFg ? `--sidebar-foreground: ${lightSidebarFg};` : "",
    lightBorder ? `--sidebar-border: ${lightBorder};` : "",
    primary ? `--sidebar-primary: ${primary};` : "",
    lightPrimaryFg ? `--sidebar-primary-foreground: ${lightPrimaryFg};` : "",
    accent ? `--sidebar-accent: ${accent};` : "",
    lightAccentFg ? `--sidebar-accent-foreground: ${lightAccentFg};` : "",
    primary ? `--sidebar-ring: ${primary};` : "",

    theme.radius !== undefined ? `--radius: ${theme.radius}rem;` : "",
  ].filter(Boolean).join(" ");

  const darkVars = [
    darkPrimary ? `--primary: ${darkPrimary};` : "",
    darkPrimaryFg ? `--primary-foreground: ${darkPrimaryFg};` : "",
    darkSecondary ? `--secondary: ${darkSecondary};` : "",
    darkSecondaryFg ? `--secondary-foreground: ${darkSecondaryFg};` : "",
    darkAccent ? `--accent: ${darkAccent};` : "",
    darkAccentFg ? `--accent-foreground: ${darkAccentFg};` : "",
    
    darkMuted ? `--muted: ${darkMuted};` : "",
    darkMuted ? `--muted-foreground: 163 163 163;` : "",
    
    darkBorder ? `--border: ${darkBorder};` : "",
    darkBorder ? `--input: ${darkBorder};` : "",
    darkPrimary ? `--ring: ${darkPrimary};` : "",

    // Brand text - pre-calculated for contrast
    darkSafeHoverText ? `--brand-text: ${darkSafeHoverText};` : "",

    // Sidebar
    darkSidebarBg ? `--sidebar: ${darkSidebarBg};` : "",
    darkSidebarFg ? `--sidebar-foreground: ${darkSidebarFg};` : "",
    darkBorder ? `--sidebar-border: ${darkBorder};` : "",
    darkPrimary ? `--sidebar-primary: ${darkPrimary};` : "",
    darkPrimaryFg ? `--sidebar-primary-foreground: ${darkPrimaryFg};` : "",
    darkAccent ? `--sidebar-accent: ${deriveShade(darkAccent, 0.1)};` : "",
    darkAccentFg ? `--sidebar-accent-foreground: ${darkAccentFg};` : "",
    darkPrimary ? `--sidebar-ring: ${darkPrimary};` : "",

    theme.radius !== undefined ? `--radius: ${theme.radius}rem;` : "",
  ].filter(Boolean).join(" ");

  return (
    <>
      <style jsx global>{`
        :root {
          ${lightVars}
        }
        .dark {
          ${darkVars}
        }
      `}</style>
      {children}
    </>
  );
}


