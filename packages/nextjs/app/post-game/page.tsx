"use client";

// Important for client-side functionality in App Router
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import tetrachainAbiJson from "../../../hardhat/artifacts/contracts/tetrachain.sol/tetrachain.json";
import Header from "../../components/Header";
import { TETRACHAIN_CONTRACT_ADDRESS } from "../../constants/contracts";
// For App Router
import { useAccount, useChainId, useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { useDeployedContractInfo } from "~~/hooks/scaffold-eth";

// tetrachain/packages/nextjs/app/post-game/page.tsx

// tetrachain/packages/nextjs/app/post-game/page.tsx

// tetrachain/packages/nextjs/app/post-game/page.tsx

// tetrachain/packages/nextjs/app/post-game/page.tsx

// tetrachain/packages/nextjs/app/post-game/page.tsx

// tetrachain/packages/nextjs/app/post-game/page.tsx

// tetrachain/packages/nextjs/app/post-game/page.tsx

// tetrachain/packages/nextjs/app/post-game/page.tsx

// tetrachain/packages/nextjs/app/post-game/page.tsx

// tetrachain/packages/nextjs/app/post-game/page.tsx

// Adjust relative path to Header

const TETRACHAIN_ABI = tetrachainAbiJson.abi;

export default function PostGameScreen() {
  // Default export for App Router pages
  const router = useRouter();
  const searchParams = useSearchParams();
  const score = searchParams.get("score"); // Get score from query params
  const finalScore = score ? parseInt(score) : 0;

  const { address: connectedAddress } = useAccount();
  const chainId = useChainId();
  const [txConfirmed, setTxConfirmed] = useState(false);
  const [rewardEarned, setRewardEarned] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Get contract info using scaffold-eth hook
  const { data: contractData } = useDeployedContractInfo("tetrachain");

  // Fallback to manual contract constants if scaffold-eth data is not available
  const contractAddress =
    contractData?.address || TETRACHAIN_CONTRACT_ADDRESS[chainId as keyof typeof TETRACHAIN_CONTRACT_ADDRESS];
  const contractAbi = contractData?.abi || TETRACHAIN_ABI;

  // Debug logging
  console.log("Debug Info:", {
    chainId,
    contractData,
    contractAddress,
    connectedAddress,
    finalScore,
    usingFallback: !contractData?.address,
  });

  const { data: hash, writeContract, isPending: isWriting, error: writeError } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  // Read player's highest score from contract
  const { data: highestScore } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: contractAbi,
    functionName: "highestScores",
    args: connectedAddress ? [connectedAddress] : undefined,
    query: {
      enabled: !!connectedAddress && !!contractAddress && !!contractAbi,
    },
  });

  // Read total scores count
  const { data: totalScores } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: contractAbi,
    functionName: "getTotalScores",
    query: {
      enabled: !!contractAddress && !!contractAbi,
    },
  });

  useEffect(() => {
    if (isConfirmed) {
      setTxConfirmed(true);
      setRewardEarned(finalScore > 0 ? finalScore / 100000 : 0);
    }
  }, [isConfirmed, finalScore]);

  useEffect(() => {
    if (writeError) {
      setError(writeError.message || "Transaction failed");
    }
  }, [writeError]);

  const handleSubmitScore = async () => {
    setError(null);

    if (!connectedAddress) {
      setError("Please connect your wallet to submit score.");
      return;
    }
    if (finalScore === 0) {
      setError("Cannot submit a score of 0.");
      return;
    }
    if (!contractAddress) {
      setError("Contract not deployed on this chain or address missing.");
      return;
    }

    try {
      writeContract({
        address: contractAddress as `0x${string}`,
        abi: contractAbi,
        functionName: "submitScore",
        args: [BigInt(finalScore)],
      });
    } catch (e) {
      console.error("Error submitting score:", e);
      setError("Failed to submit score. See console for details.");
    }
  };

  const handlePlayAgain = () => {
    router.push("/game");
  };

  return (
    <>
      <Header />
      <main className="min-h-screen flex flex-col justify-center items-center text-center p-4 pt-20">
        <h2 className="text-4xl md:text-5xl font-arcade text-neonBlue mb-6">Game Over!</h2>
        <p className="text-3xl md:text-5xl font-bold text-white mb-8">
          Your Final Score: <span className="text-neonPink drop-shadow-neon">{finalScore}</span>
        </p>

        {/* Score Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 w-full max-w-2xl">
          <div className="bg-darkCard border border-neonBlue rounded-lg p-4">
            <h3 className="text-neonBlue text-lg font-bold mb-2">Your Best Score</h3>
            <p className="text-white text-xl">{highestScore ? Number(highestScore).toLocaleString() : "0"}</p>
          </div>
          <div className="bg-darkCard border border-neonPurple rounded-lg p-4">
            <h3 className="text-neonPurple text-lg font-bold mb-2">Total Games Played</h3>
            <p className="text-white text-xl">{totalScores ? Number(totalScores).toLocaleString() : "0"}</p>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-900 border-2 border-red-500 rounded-lg p-4 mb-6 max-w-md">
            <p className="text-red-200 text-lg font-bold">{error}</p>
          </div>
        )}

        {/* Submit Score Section */}
        {!txConfirmed ? (
          <div className="mb-6">
            <button
              onClick={handleSubmitScore}
              disabled={isWriting || isConfirming || !connectedAddress}
              className="btn btn-primary bg-neonPurple text-darkBg hover:bg-neonPurple/80 font-bold py-3 px-8 rounded-lg text-lg uppercase transition-all duration-200 mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isWriting || isConfirming ? "Submitting..." : "Submit Score Onchain"}
            </button>
            {!connectedAddress && <p className="text-yellow-400 text-sm">Connect your wallet to submit score</p>}
          </div>
        ) : (
          <div className="bg-darkCard border-2 border-neonBlue rounded-lg p-6 mb-6">
            <p className="text-green-500 text-xl font-bold mb-2">Transaction Confirmed!</p>
            <p className="text-white text-lg">
              You earned:{" "}
              <span className="text-neonPink font-bold">
                {rewardEarned !== null ? rewardEarned.toFixed(5) : "Calculating..."} ETH
              </span>{" "}
              + Tetris Badge!
            </p>
            {hash && (
              <p className="text-gray-400 text-sm mt-2">
                TX: {hash.substring(0, 10)}...{hash.substring(hash.length - 8)}
              </p>
            )}
          </div>
        )}

        <button
          onClick={handlePlayAgain}
          className="btn btn-secondary border-2 border-neonBlue text-neonBlue hover:bg-neonBlue hover:text-darkBg font-bold py-3 px-8 rounded-lg text-lg uppercase transition-all duration-200"
        >
          Play Again
        </button>
      </main>
    </>
  );
}
