"use client";

import { useEffect, useState } from "react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { getContrastingTextColor, getSafeHoverTextColor } from "~/lib/colors";

interface ThemePreviewProps {
  primary: string;    // RGB triplet
  accent: string;     // RGB triplet - CTAs and interactions
  secondary: string;  // RGB triplet
  radius: number;     // rem
}

export function ThemePreview({ primary, accent, secondary, radius }: ThemePreviewProps) {
  const radiusRem = `${radius}rem`;
  
  // Detect current color mode for correct brand-text calculation
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  useEffect(() => {
    // Check if dark class is present on document
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    };
    
    checkDarkMode();
    
    // Listen for class changes (when user toggles theme)
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    
    return () => observer.disconnect();
  }, []);
  
  // Calculate brand-text based on current mode
  const brandText = getSafeHoverTextColor(primary, accent, isDarkMode);
  
  // Create a scoped style block to override CSS variables for this preview
  // This ensures shadcn components use the preview colors instead of actual theme colors
  const cssVariableOverrides = {
    // Core color overrides (RGB triplets)
    "--primary": primary,
    "--primary-foreground": getContrastingTextColor(primary),
    "--accent": accent,
    "--accent-foreground": getContrastingTextColor(accent),
    "--secondary": secondary,
    "--secondary-foreground": getContrastingTextColor(secondary),
    // Brand text for Link buttons and other components
    "--brand-text": brandText,
    // Radius override
    "--radius": radiusRem,
  } as React.CSSProperties;
  
  return (
    <div 
      className="border rounded-xl p-6 space-y-6 overflow-hidden bg-background"
      style={cssVariableOverrides}
    >
      {/* Header with Primary color (navigation/branding) */}
      <div 
        className="px-4 py-3 -mx-6 -mt-6 mb-4 bg-primary"
        style={{ 
          borderTopLeftRadius: radiusRem,
          borderTopRightRadius: radiusRem,
        }}
      >
        <span className="text-sm font-medium text-primary-foreground">
          Navegação / Branding (Primary)
        </span>
      </div>

      {/* Buttons Row - demonstrating color roles with shadcn Button */}
      <div className="flex flex-wrap gap-2">
        {/* Default button uses Primary (main CTA) */}
        <Button variant="default" size="sm">
          Ação Principal
        </Button>
        {/* Secondary button */}
        <Button variant="secondary" size="sm">
          Secundário
        </Button>
        {/* Outline button */}
        <Button variant="outline" size="sm">
          Outline
        </Button>
        {/* Ghost button */}
        <Button variant="ghost" size="sm">
          Ghost
        </Button>
        {/* Link button */}
        <Button variant="link" size="sm">
          Link
        </Button>
      </div>

      {/* Badges/Tags - demonstrating theme colors */}
      <div className="flex flex-wrap gap-2">
        <Badge variant="default">Default</Badge>
        <Badge variant="secondary">Secondary</Badge>
        <Badge variant="outline">Outline</Badge>
      </div>

      {/* Semantic Status Badges */}
      <div className="flex flex-wrap gap-2">
        <Badge variant="success">Success</Badge>
        <Badge variant="warning">Warning</Badge>
        <Badge variant="info">Info</Badge>
        <Badge variant="error">Error</Badge>
      </div>

      {/* Card Example using shadcn Card */}
      <Card>
        <CardContent className="pt-4 space-y-2">
          <div className="font-medium">Card de Exemplo</div>
          <p className="text-sm text-muted-foreground">
            Border-radius: {radius.toFixed(2)} rem
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
