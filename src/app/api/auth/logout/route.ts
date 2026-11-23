import { NextResponse } from "next/server";
import { SESSION_COOKIE, sessionCookieOptions } from "@/lib/session-token";
import { publicUrl } from "@/lib/url";

export async function POST(request: Request) {
  const response = NextResponse.redirect(publicUrl(request, "/"), 303);
  response.cookies.set({
    ...sessionCookieOptions(),
    name: SESSION_COOKIE,
    value: "",
    maxAge: 0,
  });
  return response;
}
