// tetrachain/packages/nextjs/app/page.tsx
import Link from "next/link";
import Header from "../components/Header";

// Adjust path based on your setup

export default function HomePage() {
  return (
    <>
      <Header />
      <main className="min-h-screen flex flex-col justify-center items-center text-center p-4">
        <h1 className="text-6xl md:text-8xl font-arcade text-neonBlue mb-4 drop-shadow-neon">Onchain Tetris</h1>
        <p className="text-xl md:text-2xl text-neonPink mb-8">Play Tetris, compete globally, earn rewards</p>
        <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-8">
          {/* Use regular a tags or next/link for navigation */}
          <Link href="/game" passHref>
            <button className="btn btn-primary bg-neonBlue text-darkBg hover:bg-neonBlue/80 font-bold py-3 px-8 rounded-lg text-lg uppercase transition-all duration-200">
              Play Game
            </button>
          </Link>
          <Link href="/leaderboard" passHref>
            <button className="btn btn-secondary border-2 border-neonPink text-neonPink hover:bg-neonPink hover:text-darkBg font-bold py-3 px-8 rounded-lg text-lg uppercase transition-all duration-200">
              View Leaderboard
            </button>
          </Link>
        </div>
      </main>
    </>
  );
}
