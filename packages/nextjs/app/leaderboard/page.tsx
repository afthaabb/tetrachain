"use client";

// Important for client-side functionality in App Router
import { useEffect, useState } from "react";
// Relative path to ABI: From app/post-game, go up to app/, up to nextjs/, up to packages/, then down to hardhat/artifacts/
import tetrachainAbiJson from "../../../hardhat/artifacts/contracts/tetrachain.sol/tetrachain.json";
// Import the whole JSON
import Header from "../../components/Header";
// Relative path to contract addresses: From app/leaderboard, go up to app/, then to constants/
import { TETRACHAIN_CONTRACT_ADDRESS } from "../../constants/contracts";
import { useAccount, useChainId, useReadContract } from "wagmi";

// tetrachain/packages/nextjs/app/leaderboard/page.tsx

// tetrachain/packages/nextjs/app/leaderboard/page.tsx

// tetrachain/packages/nextjs/app/leaderboard/page.tsx

// tetrachain/packages/nextjs/app/leaderboard/page.tsx

// tetrachain/packages/nextjs/app/leaderboard/page.tsx

// tetrachain/packages/nextjs/app/leaderboard/page.tsx

// tetrachain/packages/nextjs/app/leaderboard/page.tsx

// tetrachain/packages/nextjs/app/leaderboard/page.tsx

// tetrachain/packages/nextjs/app/leaderboard/page.tsx

// tetrachain/packages/nextjs/app/leaderboard/page.tsx

// Adjust relative path to Header

// Extract the ABI array from the imported JSON
const ONCHAINTETRIS_ABI = tetrachainAbiJson.abi;

interface PlayerScore {
  player: string;
  score: number;
  timestamp: string;
}

export default function LeaderboardPage() {
  // Default export for App Router pages
  const { address: connectedAddress } = useAccount();
  const chainId = useChainId();

  const contractAddress = TETRACHAIN_CONTRACT_ADDRESS[chainId as keyof typeof TETRACHAIN_CONTRACT_ADDRESS];

  // Wagmi hook to read from contract
  const {
    data: leaderboardData,
    isLoading,
    error,
  } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: ONCHAINTETRIS_ABI,
    functionName: "getLeaderboard",
    // For live updates without a subgraph, you'd need to manually refetch,
    // e.g., with `refetchInterval` or by invalidating the query.
  });

  const [sortedLeaderboard, setSortedLeaderboard] = useState<PlayerScore[]>([]);

  useEffect(() => {
    if (leaderboardData && Array.isArray(leaderboardData)) {
      const formattedData: PlayerScore[] = leaderboardData
        .map(entry => ({
          player: entry.player,
          score: Number(entry.score),
          timestamp: new Date(Number(entry.timestamp) * 1000).toLocaleString(),
        }))
        .sort((a, b) => b.score - a.score);
      setSortedLeaderboard(formattedData);
    }
  }, [leaderboardData]);

  const getBadgeIcon = (score: number) => {
    if (score >= 1000) return "🏆";
    if (score >= 500) return "🥈";
    if (score >= 100) return "🥉";
    return "";
  };

  return (
    <>
      <Header />
      <main className="min-h-screen flex flex-col items-center p-4 pt-20">
        <h2 className="text-4xl md:text-5xl font-arcade text-neonPink mb-10">Global Leaderboard</h2>

        {isLoading && <p className="text-neonBlue">Loading leaderboard...</p>}
        {error && <p className="text-red-500">Error loading leaderboard: {error.message}</p>}

        {!isLoading && !error && (
          <div className="bg-darkCard border-4 border-neonPurple rounded-lg p-6 w-full max-w-4xl overflow-x-auto">
            <table className="min-w-full table-auto text-left">
              <thead>
                <tr className="border-b-2 border-neonBlue text-neonBlue uppercase text-sm font-arcade">
                  <th className="py-3 px-4">Rank</th>
                  <th className="py-3 px-4">Player Address</th>
                  <th className="py-3 px-4">Score</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Badge</th>
                </tr>
              </thead>
              <tbody>
                {sortedLeaderboard.map((entry, index) => (
                  <tr
                    key={index}
                    className={`border-b border-gray-700 ${
                      connectedAddress && entry.player.toLowerCase() === connectedAddress.toLowerCase()
                        ? "bg-neonPurple/20 text-neonBlue font-bold"
                        : "text-white"
                    } hover:bg-gray-800 transition-all duration-100`}
                  >
                    <td className="py-3 px-4">{index + 1}</td>
                    <td className="py-3 px-4 font-mono">
                      {entry.player.substring(0, 6)}...{entry.player.substring(entry.player.length - 4)}
                    </td>
                    <td className="py-3 px-4 text-neonPink">{entry.score}</td>
                    <td className="py-3 px-4 text-sm text-gray-400">{entry.timestamp}</td>
                    <td className="py-3 px-4 text-xl">{getBadgeIcon(entry.score)}</td>
                  </tr>
                ))}
                {sortedLeaderboard.length === 0 && !isLoading && (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-gray-500">
                      No scores yet. Be the first!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </>
  );
}
