"use client"

import { useState } from "react"
import SyncPanel from "./SyncPanel"
import StreamSync from "./StreamSync"
import type { ActivityStream } from "@/lib/strava"

interface Props {
  firstname: string
}

export default function DashboardClient({ firstname }: Props) {
  const [streams, setStreams] = useState<Map<number, ActivityStream>>(new Map())

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Ciao, {firstname}!</h1>
          <a
            href="/api/auth/logout"
            className="text-sm text-zinc-400 hover:text-white transition-colors"
          >
            Sign out
          </a>
        </div>

        <SyncPanel />

        <StreamSync onStreamsReady={setStreams} />

        {streams.size > 0 && (
          <div className="p-4 bg-zinc-900 rounded-xl text-sm text-zinc-400">
            {streams.size} GPS streams ready
          </div>
        )}
      </div>
    </main>
  )
}
