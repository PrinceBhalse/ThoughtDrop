"use client";

import { useState } from "react";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { toggleBookmark } from "@/app/bookmarks/actions";

interface BookmarkButtonProps {
  ideaId: string;
  initialBookmarked?: boolean;
  className?: string;
}

export default function BookmarkButton({ ideaId, initialBookmarked = false, className = "" }: BookmarkButtonProps) {
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleClick = async () => {
    if (loading) return;
    setLoading(true);
    const result = await toggleBookmark(ideaId);
    setLoading(false);
    if (typeof result === "string") {
      toast(result.replace(/^error:/, "") || "Failed", "error");
    } else {
      setBookmarked(result.bookmarked);
      toast(result.bookmarked ? "Saved to bookmarks" : "Removed from bookmarks", "success");
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`flex items-center gap-1.5 transition-colors ${bookmarked ? "text-primary" : "text-muted-foreground hover:text-primary"} ${className}`}
      aria-label={bookmarked ? "Remove bookmark" : "Bookmark"}
    >
      {bookmarked ? (
        <BookmarkCheck className="w-4 h-4 fill-current" />
      ) : (
        <Bookmark className="w-4 h-4" />
      )}
      <span className="text-sm font-medium hidden sm:inline">{bookmarked ? "Saved" : "Save"}</span>
    </button>
  );
}