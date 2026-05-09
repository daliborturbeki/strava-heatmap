import { SessionOptions } from "iron-session"

export interface SessionData {
  accessToken: string
  refreshToken: string
  expiresAt: number
  athlete: {
    id: number
    firstname: string
    lastname: string
    profile: string
  }
}

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: "strava-heatmap-session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
  },
}