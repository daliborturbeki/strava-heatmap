export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-zinc-950">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold text-white">Strava Heatmap</h1>
        <p className="text-zinc-400">Visualize your runs</p>
        <a
          href="/api/auth/login"
          className="inline-block px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-colors"
        >
          Connect with Strava
        </a>
      </div>
    </main>
  )
}