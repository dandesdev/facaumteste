import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "~/server/supabaseServer";
import { db } from "~/server/db";
import { users } from "~/server/db/schema";
import { eq } from "drizzle-orm";

function sanitizeNext(next: string | null) {
  if (!next) return "/";
  if (next.startsWith("/") && !next.startsWith("//")) return next;
  return "/";
}

function getStringFromMetadata(
  metadata: Record<string, unknown>,
  key: string,
): string | null {
  const v = metadata[key];
  return typeof v === "string" ? v : null;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const nextParam = url.searchParams.get("next");
  const next = sanitizeNext(nextParam);

  if (!code) return NextResponse.redirect(new URL("/", url.origin));

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("exchangeCodeForSession failed:", error);
    return NextResponse.redirect(new URL("/auth/error", url.origin));
  }

  const { data } = await supabase.auth.getUser();
  const supaUser = data.user;

  console.log("this is supaUser:"); //debugg
  console.log(supaUser); //debugg

  if (supaUser) {
    const displayName =
      getStringFromMetadata(supaUser.user_metadata, "full_name") ??
      getStringFromMetadata(supaUser.user_metadata, "name") ??
      supaUser.email ??
      null;

    try {
      await db
        .insert(users)
        .values({
          id: supaUser.id,
          email: supaUser.email ?? "",
          name: displayName,
        })
        .onConflictDoUpdate({
          target: users.id,
          set: {
            email: supaUser.email ?? "",
            name: displayName,
            updatedAt: new Date(),
          },
        });
    } catch (dbErr) {
      console.error("Erro ao upsert user in DB:", dbErr); //test
    }
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
