import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { z } from "zod";

const setActiveSpaceSchema = z.object({
  kind: z.enum(["user", "organization", "group"]),
  id: z.string().uuid(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = setActiveSpaceSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const { kind, id } = result.data;
    // Removed legacy check since Zod handles it



    const cookieValue = JSON.stringify({ kind, id });

    const cookieStore = await cookies();
    
    cookieStore.set("active_space", cookieValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // 24 horas
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}