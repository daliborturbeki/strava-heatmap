"use client"

import { useState } from "react"
import { saveActivities, getAllActivities, getLastSyncedAt, setLastSyncedAt } from "@/lib/db"
import type { StravaActivity } from "@/lib/strava"

export default function SyncPanel() {
  const [activities, setActivities] = useState<StravaActivity[]>([])
  const [syncing, setSyncing] = useState(false)
  const [progress, setProgress] = useState("")

  async function sync() {
    setSyncing(true)
    try {
      let page = 1
      let total = 0

      while (true) {
        setProgress(`Fetching page ${page}...`)
        const res = await fetch(`/api/strava/activities?page=${page}`)
        if (!res.ok) throw new Error("Failed to fetch")

        const batch: StravaActivity[] = await res.json()
        if (batch.length == 0) break

        await saveActivities(batch)
        total += batch.length
        setProgress(`Saved ${total} activities...`)
        page++

        // Strava returns max 200/page; if less, we're done
        if (batch.length < 200) break
      }

      await setLastSyncedAt(Date.now())
      const all = await getAllActivities()
      setActivities(all)
      setProgress(`Done! ${all.length} activities loaded.`)
    } catch (e) {
      setProgress("Error syncing. Check console.")
      console.error(e)
    } finally {
      setSyncing(false)
    }
  }

  async function loadFromCache() {
    const cached = await getAllActivities()
    const lastSync = await getLastSyncedAt()
    setActivities(cached)
    if (lastSync) {
      setProgress(`Loaded ${cached.length} activities from cache (last synced ${new Date(lastSync).toLocaleString()})`)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <button
          onClick={sync}
          disabled={syncing}
          className="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 rounded-lg font-medium transition-colors"
        >
          {syncing ? "Syncing..." : "Sync Activities"}
        </button>
        <button
          onClick={loadFromCache}
          className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg font-medium transition-colors"
        >
          Load from Cache
        </button>
      </div>

      {progress && <p className="text-sm text-zinc-400">{progress}</p>}

      {activities.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-sm text-zinc-400">{activities.length} activities total</p>
          <div className="max-h-64 overflow-y-auto space-y-1">
            {activities.slice(-10).reverse().map(a => (
              <div key={a.id} className="text-sm bg-zinc-900 rounded px-3 py-2 flex justify-between">
                <span>{a.name}</span>
                <span className="text-zinc-500">{a.sport_type} · {(a.distance / 1000).toFixed(1)}km</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}