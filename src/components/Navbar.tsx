import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';
import { Plus, User, LogOut, Hash, ShieldCheck } from 'lucide-react';
import { isAdminEmail } from '@/lib/admin';
import SearchMenu from './SearchMenu';
import Logo from './Logo';
import NotificationBell from './NotificationBell';
import MobileMenu from './MobileMenu';
import ThemeToggle from './ThemeToggle';

export default async function Navbar() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isAdmin = isAdminEmail(user?.email);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-panel border-x-0 border-t-0 rounded-none bg-secondary/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Logo */}
        <Logo size={32} />

        {/* Search */}
        <div className="flex-1 max-w-md mx-4 hidden md:block">
          <SearchMenu />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Link href="/communities" className="glass-button text-sm hidden sm:flex items-center gap-1.5">
            <Hash className="w-4 h-4" />
            Communities
          </Link>
          <Link href="/communities" className="glass-button p-2 sm:hidden rounded-full" title="Communities">
            <Hash className="w-5 h-5" />
          </Link>
          {isAdmin && (
            <Link href="/admin" className="glass-button text-sm hidden sm:flex items-center gap-1.5 text-primary-foreground/80">
              <ShieldCheck className="w-4 h-4" />
              Admin
            </Link>
          )}
          {user ? (
            <>
              <Link href="/create" className="primary-button text-sm py-1.5 hidden sm:flex">
                <Plus className="w-4 h-4" />
                <span>Share Idea</span>
              </Link>
              <Link href="/create" className="primary-button p-2 sm:hidden rounded-full">
                <Plus className="w-5 h-5" />
              </Link>
              
              <div className="h-8 w-px bg-white/10 mx-1 hidden sm:block"></div>
              
              <NotificationBell />
              
              <div className="h-8 w-px bg-white/10 mx-1 hidden sm:block"></div>
              
              <Link href="/profile" className="glass-button p-2 rounded-full" title="Profile">
                <User className="w-5 h-5" />
              </Link>
              
              <form action="/auth/signout" method="post">
                <button type="submit" className="glass-button p-2 rounded-full text-muted-foreground hover:text-red-400" title="Sign Out">
                  <LogOut className="w-5 h-5" />
                </button>
              </form>
              
              <MobileMenu user={user} isAdmin={isAdmin} />
            </>
          ) : (
            <>
              <Link href="/login" className="glass-button text-sm hidden sm:block">
                Log in
              </Link>
              <Link href="/signup" className="primary-button text-sm hidden sm:flex">
                Sign up
              </Link>
              <MobileMenu user={user} isAdmin={isAdmin} />
            </>
          )}
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
