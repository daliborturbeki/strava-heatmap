import { getIronSession } from "iron-session"
import { cookies } from "next/headers"
import { sessionOptions, SessionData } from "@/lib/session"
import { redirect } from "next/navigation"

export default async function DashboardPage() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)

  if (!session.accessToken) {
    redirect("/")
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">
            Ciao, {session.athlete.firstname}!
          </h1>
          <a
            href="/api/auth/logout"
            className="text-sm text-zinc-400 hover:text-white transition-colors"
          >
            Sign out
          </a>
        </div>
        <p className="text-zinc-400">Your heatmap will appear here.</p>
      </div>
    </main>
  )
}