import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { env } from "~/env";

/**
 * Image Upload API Route
 *
 * Handles file uploads to Supabase Storage.
 * - Accepts multipart form data with a single "file" field
 * - Validates file type (images only) and size (max 5MB)
 * - Max stored display dimensions (width/height) are enforced in the editor on resize (see ImageComponent MAX_IMAGE_DIMENSION)
 * - Uploads to Supabase Storage bucket "images"
 * - Returns the public URL
 *
 * Uses anon client for auth verification, service-role client for storage
 * (bypasses RLS since our route already enforces authentication).
 */

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
];

// Service-role client for storage operations (bypasses RLS)
const supabaseAdmin = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
);

export async function POST(request: NextRequest) {
  try {
    // 1. Auth check using session-based Supabase client
    const cookieStore = await cookies();
    const supabase = createServerClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll().map((c) => ({
              name: c.name,
              value: c.value,
            }));
          },
          setAll() {
            // Not needed for this route
          },
        },
      },
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse the multipart form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // 3. Validate
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          error: `Tipo de arquivo não suportado. Use: ${ALLOWED_TYPES.map((t) => t.split("/")[1]).join(", ")}`,
        },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Arquivo muito grande. Máximo: 5MB" },
        { status: 400 },
      );
    }

    // 4. Upload using admin client (bypasses RLS — safe because auth is checked above)
    const fileExt = file.name.split(".").pop() ?? "png";
    const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    const { error: uploadError } = await supabaseAdmin.storage
      .from("images")
      .upload(fileName, buffer, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("Supabase upload error:", uploadError);
      return NextResponse.json(
        {
          error:
            "Falha no upload. Verifique se o bucket 'images' existe no Supabase.",
        },
        { status: 500 },
      );
    }

    // 5. Get public URL
    const {
      data: { publicUrl },
    } = supabaseAdmin.storage.from("images").getPublicUrl(fileName);

    return NextResponse.json({
      url: publicUrl,
      fileName,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Erro interno no upload" },
      { status: 500 },
    );
  }
}
