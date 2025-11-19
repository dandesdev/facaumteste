"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "~/lib/supabaseBrowser";

const KEY_LAST_PATH = "last_path";

export function LastLocationRestorer({ fallback = "/dashboard" }: { fallback?: string }) {
  const router = useRouter();
  const executedRef = useRef(false);

  useEffect(() => {
    if (executedRef.current) return;
    executedRef.current = true;

    const run = async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          return;
        }

        const lastPath = localStorage.getItem(KEY_LAST_PATH);
        const safePath =
          lastPath && lastPath.startsWith("/") && !lastPath.startsWith("//") ? lastPath : null;

        if (safePath && safePath !== window.location.pathname) {
          router.replace(safePath);
        } else if (fallback && window.location.pathname === "/") {
          router.replace(fallback);
        }
      } catch (err) {
        console.error("LastLocationRestorer error:", err);
      }
    };

    void run();
    
  }, [router, fallback]);

  return null;
}