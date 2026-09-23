"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import MobileDrawer from "./MobileDrawer";

interface MobileMenuProps {
  user?: { id: string; email?: string } | null;
  isAdmin?: boolean;
}

export default function MobileMenu({ user, isAdmin }: MobileMenuProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden p-2 rounded-lg hover:bg-white/5 transition-colors"
        aria-label="Open menu"
      >
        <Menu className="w-6 h-6" />
      </button>

      <MobileDrawer
        isOpen={open}
        onClose={() => setOpen(false)}
        user={user}
        isAdmin={isAdmin}
      />
    </>
  )
}