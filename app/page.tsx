import GachaGame from "@/components/gacha-game"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-6 lg:p-8 bg-gradient-to-b from-pink-50 to-purple-50">
      <div className="w-full max-w-[1400px] mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-pink-600">Sanrio Gacha Collection</h1>
          <p className="text-sm text-pink-400">Collect your favorite Sanrio characters!</p>
        </div>
        <GachaGame />
      </div>
    </main>
  )
}

