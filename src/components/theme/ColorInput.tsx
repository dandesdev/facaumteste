"use client";

import { useState, useEffect } from "react";
import { HexColorPicker } from "react-colorful";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { hexToRgb, rgbToHex } from "~/lib/colors";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";

interface ColorInputProps {
  label: string;
  value: string; // RGB triplet "R G B"
  onChange: (rgb: string) => void;
}

export function ColorInput({ label, value, onChange }: ColorInputProps) {
  const [hexValue, setHexValue] = useState(() => rgbToHex(value));
  const [rgbValue, setRgbValue] = useState(value || "0 0 0");

  // Sync internal state with external value ONLY if it actually differs
  // This prevents infinite loops when Popover re-renders
  useEffect(() => {
    if (value && value !== rgbValue) {
      const newHex = rgbToHex(value);
      if (newHex !== hexValue) {
        setHexValue(newHex);
      }
      setRgbValue(value);
    }
  }, [value]); // intentionally exclude hexValue/rgbValue to prevent loops

  const handleHexChange = (hex: string) => {
    setHexValue(hex);
    const rgb = hexToRgb(hex);
    if (rgb && rgb !== rgbValue) {
      setRgbValue(rgb);
      onChange(rgb);
    }
  };

  const handleHexInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const hex = e.target.value;
    setHexValue(hex);
    if (/^#?[0-9A-Fa-f]{6}$/.test(hex)) {
      const rgb = hexToRgb(hex);
      if (rgb) {
        setRgbValue(rgb);
        onChange(rgb);
      }
    }
  };

  const handleRgbInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rgb = e.target.value;
    setRgbValue(rgb);
    // Validate RGB format "R G B"
    if (/^\d{1,3}\s+\d{1,3}\s+\d{1,3}$/.test(rgb.trim())) {
      setHexValue(rgbToHex(rgb));
      onChange(rgb);
    }
  };

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">{label}</Label>
      
      <Popover>
        <PopoverTrigger asChild>
          <button
            className="flex items-center gap-3 p-2 border rounded-lg hover:bg-muted/50 transition-colors w-full"
            type="button"
          >
            <div 
              className="w-10 h-10 rounded-md border shadow-sm shrink-0" 
              style={{ backgroundColor: hexValue }} 
            />
            <div className="flex flex-col items-start text-sm">
              <span className="font-mono">{hexValue.toUpperCase()}</span>
              <span className="text-muted-foreground text-xs">RGB: {rgbValue}</span>
            </div>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-4" align="start">
          <div className="space-y-4">
            <HexColorPicker color={hexValue} onChange={handleHexChange} />
            
            <div className="grid gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Hex</Label>
                <Input
                  value={hexValue}
                  onChange={handleHexInputChange}
                  placeholder="#000000"
                  className="font-mono text-sm h-8"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">RGB (R G B)</Label>
                <Input
                  value={rgbValue}
                  onChange={handleRgbInputChange}
                  placeholder="0 0 0"
                  className="font-mono text-sm h-8"
                />
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
