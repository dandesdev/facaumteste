import { NextResponse } from "next/server";
import { cookies } from "next/headers";

type ActiveSpacePayload = {
  kind: string;
  id: string;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ActiveSpacePayload;
    const { kind, id } = body;

    if (!kind || !id) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

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