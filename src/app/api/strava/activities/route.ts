import { NextRequest, NextResponse } from "next/server"
import { getIronSession } from "iron-session"
import { cookies } from "next/headers"
import { sessionOptions, SessionData } from "@/lib/session"
import { fetchActivities } from "@/lib/strava"

export async function GET(request: NextRequest) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)

  if (!session.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const page = Number(request.nextUrl.searchParams.get("page") ?? "1")
  // Optional Unix timestamp (seconds) — only return activities after this point
  const after = request.nextUrl.searchParams.get("after")
  const activities = await fetchActivities(
    session.accessToken,
    page,
    200,
    after ? Number(after) : undefined
  )
  return NextResponse.json(activities)
}