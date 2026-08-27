"use client";

import { useState } from "react";
import { Share2, Check } from "lucide-react";

interface ShareButtonProps {
  title: string;
  url: string;
}

export default function ShareButton({ title, url }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // User cancelled or share unavailable — fall through to copy.
      }
    }
    // Fallback: copy link to clipboard.
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this link to share:", url);
    }
  };

  return (
    <button
      onClick={handleShare}
      className="glass-button"
      aria-label="Share this idea"
    >
      {copied ? (
        <>
          <Check className="w-4 h-4 text-primary" />
          Copied
        </>
      ) : (
        <>
          <Share2 className="w-4 h-4" />
          Share
        </>
      )}
    </button>
  );
}
