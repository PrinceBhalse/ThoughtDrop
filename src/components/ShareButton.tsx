"use client";

import { useState } from "react";
import { Share2, Check } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

interface ShareButtonProps {
  title: string;
  url: string;
}

export default function ShareButton({ title, url }: ShareButtonProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // User cancelled — fall through to clipboard.
      }
    }
    // Desktop fallback: append UTM param before copying.
    try {
      const separator = url.includes("?") ? "&" : "?";
      const tracked = `${url}${separator}ref=share_link`;
      await navigator.clipboard.writeText(tracked);
      setCopied(true);
      toast("Link copied to clipboard", "success");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast("Copy failed — select the address bar manually", "error");
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
