"use client";

import { ConnectButton } from "thirdweb/react";
import { createThirdwebClient } from "thirdweb";
import { mainnet } from "thirdweb/chains";

const client = createThirdwebClient({
  clientId: "5bf6a603d32597c76b2e972e715a2423",
});

interface ConnectWalletProps {
  className?: string;
}

export function ConnectWallet({ className = "" }: ConnectWalletProps) {
  return (
    <div className={`relative ${className}`}>
      <div className="w-32 h-10 rounded-xl bg-custom-bg-light shadow-neuro-dark-outset flex items-center justify-center overflow-hidden">
        <ConnectButton 
          client={client}
          chain={mainnet}
        />
      </div>
    </div>
  );
}
