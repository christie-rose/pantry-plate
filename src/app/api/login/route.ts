import { NextRequest, NextResponse } from "next/server";
import { createSessionToken, sessionMaxAgeSeconds, SESSION_COOKIE } from "@/lib/session";

export async function POST(request: NextRequest) {
  const { password } = await request.json();

  const appPassword = process.env.APP_PASSWORD;
  if (!appPassword) {
    return NextResponse.json(
      { error: "Server is not configured" },
      { status: 500 },
    );
  }

  if (typeof password !== "string" || password !== appPassword) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  const token = await createSessionToken();
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: sessionMaxAgeSeconds,
  });
  return response;
}
