"use client";

import { useSpace } from "~/contexts/SpaceContext";
import { ThemeProvider } from "./ThemeProvider";

export function SpaceThemeProvider({ children }: { children: React.ReactNode }) {
  const { activeSpace } = useSpace();
  return <ThemeProvider theme={activeSpace.theme}>{children}</ThemeProvider>;
}
