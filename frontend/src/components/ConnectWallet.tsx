"use client";

import { ConnectButton } from "thirdweb/react";
import { createThirdwebClient } from "thirdweb";
import { mainnet } from "thirdweb/chains";
import { TbUser } from "react-icons/tb";

const client = createThirdwebClient({
  clientId: "5bf6a603d32597c76b2e972e715a2423",
});

interface ConnectWalletProps {
  className?: string;
}

export function ConnectWallet({ className = "" }: ConnectWalletProps) {
  return (
    <div className={`relative ${className}`}>
      {/* Styled black user profile icon (visible) */}
      <div className="w-12 h-12 rounded-2xl bg-custom-bg-light shadow-neuro-dark-outset flex items-center justify-center">
        <TbUser className="w-6 h-6 text-neutral-400" />
      </div>

      {/* Invisible ConnectButton overlay to trigger Thirdweb modal */}
      <div className="absolute inset-0">
        <div className="w-full h-full opacity-0 cursor-pointer">
          <ConnectButton client={client} chain={mainnet} />
        </div>
      </div>
    </div>
  );
}
