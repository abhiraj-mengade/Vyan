"use client";

import Link from "next/link";

interface HeaderProps {
  title?: string;
  homeHref?: string;
  className?: string;
}

export function Header({ 
  title = "Vyan", 
  homeHref = "/", 
  className = ""
}: HeaderProps) {
  return (
    <div className={`flex items-center justify-between pt-6 pb-12 px-6 ${className}`}>

      
      {/* Logo and Title */}
      <Link href={homeHref} className="flex items-center gap-4">
        <img 
          src="/logo.png" 
          alt="Vyan Logo" 
          className="h-10 w-auto"
        />
        <div className="leading-tight">
          <p className="text-neutral-200 text-lg font-semibold">{title}</p>
          <p className="text-neutral-400 text-sm">비얀</p>
        </div>
      </Link>
      
      {/* Prototype: no wallet */}
      <div className="text-neutral-300 text-sm">Prototype</div>
    </div>
  );
}
