"use client";

import { useEffect, useState } from "react";
import { Sun, Moon, Monitor } from "lucide-react";
import { Button } from "~/components/ui/button";
import { SidebarMenuButton } from "~/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { api } from "~/trpc/react";
import type { ColorMode } from "~/lib/colors";

interface ThemeToggleProps {
  initialMode?: ColorMode;
}

export function ThemeToggle({ initialMode = "system" }: ThemeToggleProps) {
  const [mode, setMode] = useState<ColorMode>(initialMode);
  
  const updateModeMutation = api.user.updatePreferredMode.useMutation();

  // Apply theme class to document
  useEffect(() => {
    const root = document.documentElement;
    
    const applyTheme = (isDark: boolean) => {
      if (isDark) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    };

    if (mode === "system") {
      // Follow OS preference
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      applyTheme(mediaQuery.matches);
      
      const handler = (e: MediaQueryListEvent) => applyTheme(e.matches);
      mediaQuery.addEventListener("change", handler);
      return () => mediaQuery.removeEventListener("change", handler);
    } else {
      applyTheme(mode === "dark");
    }
  }, [mode]);

  const handleModeChange = (newMode: ColorMode) => {
    // Optimistic update: change UI immediately
    setMode(newMode);
    
    // Save to DB in background
    updateModeMutation.mutate({ mode: newMode });
  };

  const icons = {
    light: Sun,
    dark: Moon,
    system: Monitor,
  };
  
  const labels = {
    light: "Claro",
    dark: "Escuro",
    system: "Sistema",
  };

  const CurrentIcon = icons[mode];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton 
          className="h-8 w-8 px-0 justify-center"
          title={`Tema: ${labels[mode]}`}
        >
          <CurrentIcon className="h-4 w-4" />
          <span className="sr-only">Alternar tema</span>
        </SidebarMenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="top">
        <DropdownMenuItem onClick={() => handleModeChange("light")}>
          <Sun className="mr-2 h-4 w-4" />
          Claro
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleModeChange("dark")}>
          <Moon className="mr-2 h-4 w-4" />
          Escuro
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleModeChange("system")}>
          <Monitor className="mr-2 h-4 w-4" />
          Sistema
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
