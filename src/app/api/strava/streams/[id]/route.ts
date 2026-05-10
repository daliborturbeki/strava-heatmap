import { NextRequest, NextResponse } from "next/server"
import { getIronSession } from "iron-session"
import { cookies } from "next/headers"
import { sessionOptions, SessionData } from "@/lib/session"
import { fetchActivityStream } from "@/lib/strava"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)

  if (!session.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const activityId = Number(id)

  if (isNaN(activityId)) {
    return NextResponse.json({ error: "Invalid activity ID" }, { status: 400 })
  }

  try {
    const stream = await fetchActivityStream(session.accessToken, activityId)
    return NextResponse.json(stream)
  } catch (e) {
    const msg = String(e)
    const status = msg.includes("429") ? 429 : msg.includes("404") ? 404 : 500
    return NextResponse.json({ error: msg }, { status })
  }
}
