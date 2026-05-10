const STRAVA_API = "https://www.strava.com/api/v3"

export interface StravaActivity {
  id: number
  name: string
  sport_type: string
  start_date: string
  distance: number          // meters
  moving_time: number       // seconds
  total_elevation_gain: number
  map: { summary_polyline: string }
  average_heartrate?: number
  has_heartrate: boolean
}

export interface ActivityStream {
  latlng: { data: [number, number][] }
  altitude: { data: number[] }
  heartrate?: { data: number[] }
  distance: { data: number[] }
}

export async function fetchActivities(
  accessToken: string,
  page = 1,
  perPage = 200
): Promise<StravaActivity[]> {
  const res = await fetch(
    `${STRAVA_API}/athlete/activities?page=${page}&per_page=${perPage}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )
  if (!res.ok) throw new Error(`Strava API error: ${res.status}`)
  return res.json()
}

export async function fetchActivityStream(
  accessToken: string,
  activityId: number
): Promise<ActivityStream> {
  const keys = "latlng,altitude,heartrate,distance"
  const res = await fetch(
    `${STRAVA_API}/activities/${activityId}/streams?keys=${keys}&key_by_type=true`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )
  if (!res.ok) throw new Error(`Strava API error: ${res.status}`)
  return res.json()
}