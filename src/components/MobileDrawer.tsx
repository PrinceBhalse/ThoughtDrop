"use client";

import { useEffect, useState } from "react";
import { X, Menu, Hash, User, Plus, LogOut, Bell, Settings, ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import NotificationBell from "./NotificationBell";

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  user?: { id: string; email?: string } | null;
  isAdmin?: boolean;
}

export default function MobileDrawer({ isOpen, onClose, user, isAdmin }: MobileDrawerProps) {
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setMounted(true)
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!mounted || !isOpen) return null

  const navItems = [
    { href: '/', label: 'Home', icon: <ChevronRight className="w-5 h-5" /> },
    { href: '/communities', label: 'Communities', icon: <Hash className="w-5 h-5" /> },
    { href: '/create', label: 'Share Idea', icon: <Plus className="w-5 h-5" />, auth: true },
    { href: '/profile', label: 'Profile', icon: <User className="w-5 h-5" />, auth: true },
    { href: '/settings', label: 'Settings', icon: <Settings className="w-5 h-5" />, auth: true },
  ].filter(item => !item.auth || user)

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside className="fixed inset-y-0 right-0 w-full max-w-sm lg:hidden z-50 flex flex-col bg-surface border-l border-white/10 shadow-2xl animate-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <span className="font-bold text-lg">Menu</span>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/5 transition-colors"
            aria-label="Close menu"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                pathname === item.href
                  ? 'bg-primary/20 text-primary'
                  : 'text-foreground hover:bg-white/5'
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}

          {/* Admin link */}
          {isAdmin && user && (
            <Link
              href="/admin"
              onClick={onClose}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium text-primary hover:bg-primary/10 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
              Admin Panel
            </Link>
          )}

          <div className="border-t border-white/10 my-4" />

          {/* Notifications */}
          <NotificationBell />

          {/* Auth actions */}
          <div className="space-y-2 pt-4">
            {user ? (
              <form action="/auth/signout" method="post">
                <button
                  type="submit"
                  onClick={onClose}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  Sign Out
                </button>
              </form>
            ) : (
              <div className="space-y-2">
                <Link
                  href="/login"
                  onClick={onClose}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium text-foreground hover:bg-white/5 transition-colors"
                >
                  <User className="w-5 h-5" />
                  Log In
                </Link>
                <Link
                  href="/signup"
                  onClick={onClose}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  <User className="w-5 h-5" />
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </nav>
      </aside>
    </>
  )
}