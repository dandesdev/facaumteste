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
    <Button 
      onClick={handleSelect} 
      disabled={loading} 
      variant="outline"
      className="w-full h-auto py-3 px-4 justify-start bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 group"
    >
      <div className="flex items-center gap-3 w-full">
        {/* Placeholder for future logo */}
        <div className="flex-none w-8 h-8 rounded bg-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-gray-200 transition-colors uppercase text-xs font-bold">
          {label.substring(0, 2)}
        </div>
        
        <div className="flex-1 text-left truncate">
          <span className="block text-sm font-medium text-gray-700 group-hover:text-gray-900">
             {loading ? "Entrando..." : label}
          </span>
        </div>
      </div>
    </Button>
  );
}