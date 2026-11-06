import Link from "next/link";
import { CONTACT_EMAIL } from "@/lib/site";

export default function LegalLinks({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground ${className}`}>
      <Link href="/privacy" className="hover:text-foreground transition-colors">
        Privacy policy
      </Link>
      <Link href="/terms" className="hover:text-foreground transition-colors">
        Terms
      </Link>
      <Link href="/account/delete" className="hover:text-red-400 transition-colors">
        Delete account
      </Link>
      <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-foreground transition-colors">
        {CONTACT_EMAIL}
      </a>
    </div>
  );
}
