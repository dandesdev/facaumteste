"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "~/lib/supabaseBrowser";
import { LogOut } from "lucide-react";
import { SidebarMenuButton } from "./ui/sidebar";

export default function LogoutButton() {
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
