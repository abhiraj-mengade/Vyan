"use client";

import { ConnectButton } from "thirdweb/react";
import { createThirdwebClient } from "thirdweb";

const client = createThirdwebClient({
  clientId: "5bf6a603d32597c76b2e972e715a2423",
});

interface ConnectWalletProps {
  className?: string;
}

export function ConnectWallet({ className = "" }: ConnectWalletProps) {
  return (
    <div className={`relative ${className}`}>
      <ConnectButton client={client} />
    </div>
  );
}
