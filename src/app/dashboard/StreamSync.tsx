"use client"

import { useState, useRef } from "react"
import { getAllActivities, getStream, saveStream } from "@/lib/db"
import type { ActivityStream } from "@/lib/strava"

// Strava rate limit: 100 requests / 15 minutes.
// We use 500ms delay and handle 429s by waiting for the window to reset.
const REQUEST_DELAY_MS = 500
const RATE_LIMIT_WAIT_MS = 15 * 60 * 1000

interface Props {
  onStreamsReady: (streams: Map<number, ActivityStream>) => void
}

export default function StreamSync({ onStreamsReady }: Props) {
  const [syncing, setSyncing] = useState(false)
  const [status, setStatus] = useState<{
    done: number
    total: number
    message: string
    rateLimited: boolean
  } | null>(null)
  const stopRef = useRef(false)

  async function loadFromCache() {
    const activities = await getAllActivities()
    const map = new Map<number, ActivityStream>()
    for (const activity of activities) {
      if (!activity.map?.summary_polyline) continue
      const cached = await getStream(activity.id)
      if (cached) map.set(activity.id, cached)
    }
    onStreamsReady(map)
    setStatus({ done: map.size, total: map.size, message: `Loaded ${map.size} streams from cache`, rateLimited: false })
  }

  async function syncStreams() {
    stopRef.current = false
    setSyncing(true)

    // Only activities that have a GPS polyline are worth fetching streams for
    const activities = await getAllActivities()
    const withGPS = activities.filter(a => a.map?.summary_polyline)

    // Find which ones are missing from cache
    const missing: number[] = []
    for (const a of withGPS) {
      const cached = await getStream(a.id)
      if (!cached) missing.push(a.id)
    }

    if (missing.length == 0) {
      await loadFromCache()
      setSyncing(false)
      return
    }

    setStatus({ done: 0, total: missing.length, message: "Starting stream sync...", rateLimited: false })

    let done = 0
    for (const id of missing) {
      if (stopRef.current) break

      setStatus(s => ({ ...s!, done, message: `Fetching stream ${done + 1} of ${missing.length}...`, rateLimited: false }))

      try {
        const res = await fetch(`/api/strava/streams/${id}`)

        if (res.status == 429) {
          // Rate limited - wait for the window to reset then retry the same id
          setStatus(s => ({ ...s!, message: "Rate limited by Strava - waiting 15 min...", rateLimited: true }))
          await new Promise(r => setTimeout(r, RATE_LIMIT_WAIT_MS))
          const retry = await fetch(`/api/strava/streams/${id}`)
          if (retry.ok) {
            const stream: ActivityStream = await retry.json()
            if (stream.latlng?.data?.length) await saveStream(id, stream)
          }
          done++
          continue
        }

        // 404 means this activity has no GPS stream (e.g. indoor run) - skip it
        if (!res.ok) {
          done++
          continue
        }

        const stream: ActivityStream = await res.json()
        if (stream.latlng?.data?.length) {
          await saveStream(id, stream)
        }
        done++
      } catch {
        done++
      }

      await new Promise(r => setTimeout(r, REQUEST_DELAY_MS))
    }

    // Load all cached streams and notify parent
    const all = await getAllActivities()
    const streamsMap = new Map<number, ActivityStream>()
    for (const a of all) {
      const cached = await getStream(a.id)
      if (cached) streamsMap.set(a.id, cached)
    }
    onStreamsReady(streamsMap)

    const finalMessage = stopRef.current ? `Stopped. ${done} streams fetched.` : `Done! ${streamsMap.size} streams cached.`
    setStatus({ done: streamsMap.size, total: missing.length, message: finalMessage, rateLimited: false })
    setSyncing(false)
  }

  const pct = status && status.total > 0 ? Math.round((status.done / status.total) * 100) : 0

  return (
    <div className="space-y-3 p-4 bg-zinc-900 rounded-xl">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-300">GPS Streams</h2>
        <div className="flex gap-2">
          {!syncing && (
            <button
              onClick={syncStreams}
              className="text-xs px-3 py-1.5 bg-orange-500 hover:bg-orange-600 rounded-md font-medium transition-colors"
            >
              Sync Streams
            </button>
          )}
          {syncing && (
            <button
              onClick={() => { stopRef.current = true }}
              className="text-xs px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 rounded-md font-medium transition-colors"
            >
              Stop
            </button>
          )}
          <button
            onClick={loadFromCache}
            disabled={syncing}
            className="text-xs px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 rounded-md font-medium transition-colors"
          >
            Load Cache
          </button>
        </div>
      </div>

      {status && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-zinc-500">
            <span className={status.rateLimited ? "text-yellow-400" : ""}>{status.message}</span>
            <span>{status.done} / {status.total}</span>
          </div>
          <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-orange-500 rounded-full transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
