"use client";

/**
 * Space Context
 * Provides the active space information from server to client components
 */

import { createContext, useContext, type ReactNode } from "react";

export interface ActiveSpace {
  kind: "organization" | "user" | "group";
  id: string;
  name: string;
  theme?: {
    primary?: string;
    secondary?: string;
    accent?: string;     
    radius?: number;
  };
}

interface SpaceContextValue {
  activeSpace: ActiveSpace;
}

const SpaceContext = createContext<SpaceContextValue | null>(null);

export function SpaceProvider({
  children,
  activeSpace,
}: {
  children: ReactNode;
  activeSpace: ActiveSpace;
}) {
  return (
    <SpaceContext.Provider value={{ activeSpace }}>
      {children}
    </SpaceContext.Provider>
  );
}

export function useSpace() {
  const context = useContext(SpaceContext);
  if (!context) {
    throw new Error("useSpace must be used within a SpaceProvider");
  }
  return context;
}
