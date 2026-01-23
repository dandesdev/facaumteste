"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "~/lib/supabaseBrowser";
import { LogOut } from "lucide-react";
import { SidebarMenuButton } from "./ui/sidebar";
import { Button } from "./ui/button";

interface LogoutButtonProps {
  variant?: "sidebar" | "ghost" | "default";
}

export default function LogoutButton({ variant = "sidebar" }: LogoutButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signOut();

      try {
        localStorage.removeItem("last_path");
      } catch {}

      router.push("/");
    } catch (err) {
      console.error("Logout error:", err);
      setLoading(false);
    }
  };

  // For use in sidebar
  if (variant === "sidebar") {
    return (
      <SidebarMenuButton
        onClick={handleLogout}
        disabled={loading}
        tooltip="Sair"
      >
        <LogOut className="h-4 w-4" />
        <span>{loading ? "Saindo..." : "Sair"}</span>
      </SidebarMenuButton>
    );
  }

  // For use outside sidebar (e.g., select-space page)
  return (
    <Button
      onClick={handleLogout}
      disabled={loading}
      variant={variant === "ghost" ? "ghost" : "default"}
      size="sm"
    >
      <LogOut className="h-4 w-4" />
      <span className="sr-only sm:not-sr-only sm:ml-2">
        {loading ? "Saindo..." : "Sair"}
      </span>
    </Button>
  );
}
