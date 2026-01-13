"use client";

import { useRouter } from "next/navigation";
import { Button } from "~/components/ui/button";
import { useState } from "react";
import { addRecentSpace } from "~/lib/recentSpaces";

interface SpaceButtonProps {
  label: string;
  kind: "user" | "organization" | "group";
  id: string;
}

export function SelectSpaceButton({ label, kind, id }: SpaceButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSelect = async () => {
    setLoading(true);
    try {
      // Track as recent space
      addRecentSpace({ kind, id, name: label });

      const res = await fetch("/api/set-active-space", {
        method: "POST",
        body: JSON.stringify({ kind, id }),
        headers: { "Content-Type": "application/json" },
      });

      if (res.ok) {
        router.replace("/dashboard");
        // Força um refresh para garantir que o servidor leia o novo cookie
        router.refresh();
      } else {
        console.error("Erro ao selecionar espaço");
        setLoading(false);
      }
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  return (
    <Button onClick={handleSelect} disabled={loading} className="w-full max-w-sm">
      {loading ? "Entrando..." : label}
    </Button>
  );
}