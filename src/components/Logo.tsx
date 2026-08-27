"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

interface LogoProps {
  showText?: boolean;
  size?: number;
}

export default function Logo({ showText = true, size = 32 }: LogoProps) {
  const [imgError, setImgError] = useState(false);

  if (imgError) {
    return (
      <Link href="/" className="flex items-center gap-2.5 shrink-0">
        <div className="text-primary font-bold text-xl">TD</div>
        {showText && (
          <span className="text-lg font-bold tracking-tight text-foreground hidden sm:block">
            ThoughtDrop
          </span>
        )}
      </Link>
    );
  }

  return (
    <Link href="/" className="flex items-center gap-2.5 shrink-0">
      <Image
        src="/favicon.svg"
        alt="ThoughtDrop"
        width={size}
        height={size}
        className="rounded-md"
        onError={() => setImgError(true)}
        priority
      />
      {showText && (
        <span className="text-lg font-bold tracking-tight text-foreground hidden sm:block">
          ThoughtDrop
        </span>
      )}
    </Link>
  );
}
