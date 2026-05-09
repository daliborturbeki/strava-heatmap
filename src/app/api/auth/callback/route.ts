import { NextRequest, NextResponse } from "next/server"
import { getIronSession } from "iron-session"
import { sessionOptions, SessionData } from "@/lib/session"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code")
  const error = request.nextUrl.searchParams.get("error")

  if (error || !code) {
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}?error=access_denied`)
  }

  // Exchange code for tokens
  const response = await fetch("https://www.strava.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      code,
      grant_type: "authorization_code",
    }),
  })

  if (!response.ok) {
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}?error=token_exchange_failed`)
  }

  const data = await response.json()

  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
  session.accessToken = data.access_token
  session.refreshToken = data.refresh_token
  session.expiresAt = data.expires_at
  session.athlete = data.athlete
  await session.save()

  return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard`)
}