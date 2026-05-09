import { NextResponse } from "next/server"
import { getIronSession } from "iron-session"
import { sessionOptions, SessionData } from "@/lib/session"
import { cookies } from "next/headers"

export async function GET() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
  session.destroy()
  return NextResponse.redirect(`${process.env.NEXTAUTH_URL}`)
}