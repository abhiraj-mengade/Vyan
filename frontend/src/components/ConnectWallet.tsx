"use client";

import { TbUser } from "react-icons/tb";


interface ConnectWalletProps {
  className?: string;
}

export function ConnectWallet({ className = "" }: ConnectWalletProps) {
  const account = undefined as any;
  
  return (
    <div className={`relative ${className}`}>
      <div className="w-12 h-12 rounded-2xl bg-custom-bg-light shadow-neuro-dark-outset flex items-center justify-center">
        <TbUser className="w-6 h-6 text-neutral-400" />
      </div>
      {!account && (
        <TbUser className="absolute inset-0 w-6 h-6 text-neutral-400 pointer-events-none m-auto" />
      )}
    </div>
  );
}
