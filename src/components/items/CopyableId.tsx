"use client";

/**
 * Copyable ID Component
 * Shows a truncated ID with a copy button
 */

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface CopyableIdProps {
  id: string;
  className?: string;
}

export function CopyableId({ id, className = "" }: CopyableIdProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Don't trigger row click
    try {
      await navigator.clipboard.writeText(id);
      setCopied(true);
      toast.success("ID copiado!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Falha ao copiar");
    }
  };

  return (
    <div className={`flex items-center gap-1 group/id ${className}`}>
      <code
        className="text-xs text-muted-foreground font-mono truncate"
        title={id}
      >
        {id.slice(0, 8)}...
      </code>
      <button
        onClick={handleCopy}
        className="opacity-0 group-hover/id:opacity-100 transition-opacity p-0.5 hover:bg-muted rounded"
        title="Copiar ID"
      >
        {copied ? (
          <Check className="h-3 w-3 text-green-500" />
        ) : (
          <Copy className="h-3 w-3 text-muted-foreground" />
        )}
      </button>
    </div>
  );
}
