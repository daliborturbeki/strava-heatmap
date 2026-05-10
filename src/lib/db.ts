import { openDB, DBSchema, IDBPDatabase } from "idb"
import type { StravaActivity, ActivityStream } from "./strava"

interface HeatmapDB extends DBSchema {
  activities: {
    key: number
    value: StravaActivity
    indexes: { by_date: string }
  }
  streams: {
    key: number
    value: ActivityStream & { id: number }
  }
  meta: {
    key: string
    value: string | number
  }
}

let dbPromise: Promise<IDBPDatabase<HeatmapDB>> | null = null

export function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<HeatmapDB>("strava-heatmap", 1, {
      upgrade(db) {
        const activityStore = db.createObjectStore("activities", { keyPath: "id" })
        activityStore.createIndex("by_date", "start_date")
        db.createObjectStore("streams", { keyPath: "id" })
        db.createObjectStore("meta")
      },
    })
  }
  return dbPromise
}

export async function saveActivities(activities: StravaActivity[]) {
  const db = await getDB()
  const tx = db.transaction("activities", "readwrite")
  await Promise.all(activities.map(a => tx.store.put(a)))
  await tx.done
}

export async function getAllActivities(): Promise<StravaActivity[]> {
  const db = await getDB()
  return db.getAllFromIndex("activities", "by_date")
}

export async function saveStream(id: number, stream: ActivityStream) {
  const db = await getDB()
  await db.put("streams", { ...stream, id })
}

export async function getStream(id: number): Promise<(ActivityStream & { id: number }) | undefined> {
  const db = await getDB()
  return db.get("streams", id)
}

export async function getLastSyncedAt(): Promise<number> {
  const db = await getDB()
  return (await db.get("meta", "lastSyncedAt") as number) ?? 0
}

export async function setLastSyncedAt(ts: number) {
  const db = await getDB()
  await db.put("meta", ts, "lastSyncedAt")
}