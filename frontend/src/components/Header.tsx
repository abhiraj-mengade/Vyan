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
      <Link href={homeHref} className="flex items-center gap-3">
        <img 
          src="/logo.png" 
          alt="Vyan Logo" 
          className="h-8 w-auto"
        />
        <div className="leading-tight">
          <p className="text-neutral-400 text-medium font-medium">{title}</p>
          <p className="text-neutral-500 text-xs">비얀</p>
        </div>
      </Link>
      
      {/* Prototype: no wallet */}
      <div className="text-neutral-500 text-xs">Prototype</div>
    </div>
  );
}
