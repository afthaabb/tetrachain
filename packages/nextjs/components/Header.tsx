import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";

// For App Router, `next/link` is standard

const Header = () => {
  return (
    <header className="absolute top-0 right-0 p-4 z-10">
      <div className="flex justify-end items-center space-x-4">
        {/* Using Link component as a wrapper around elements */}
        <Link href="/" className="text-neonBlue hover:text-white font-bold">
          Home
        </Link>
        <Link href="/leaderboard" className="text-neonBlue hover:text-white font-bold">
          Leaderboard
        </Link>
        <Link href="/rewards" className="text-neonBlue hover:text-white font-bold">
          Rewards
        </Link>
        <ConnectButton />
      </div>
    </header>
  );
};

export default Header;
