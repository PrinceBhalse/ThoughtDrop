import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';
import { Search, Plus, User, LogOut, Hash } from 'lucide-react';

export default async function Navbar() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-panel border-x-0 border-t-0 rounded-none bg-secondary/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-xl group-hover:scale-105 transition-transform">
            T
          </div>
          <span className="font-bold text-xl hidden sm:block tracking-tight">ThoughtDrop</span>
        </Link>

        {/* Search */}
        <div className="flex-1 max-w-md mx-4 hidden md:block">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              placeholder="Search ideas, topics, or creators..." 
              className="w-full bg-white/5 border border-white/10 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground"
            />
          </div>
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
          <Link href="/communities" className="glass-button p-2 sm:hidden rounded-full" title="Communities">
            <Hash className="w-5 h-5" />
          </Link>
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
              
              <Link href="/profile" className="glass-button p-2 rounded-full" title="Profile">
                <User className="w-5 h-5" />
              </Link>
              
              <form action="/auth/signout" method="post">
                <button type="submit" className="glass-button p-2 rounded-full text-muted-foreground hover:text-red-400" title="Sign Out">
                  <LogOut className="w-5 h-5" />
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="glass-button text-sm">
                Log in
              </Link>
              <Link href="/signup" className="primary-button text-sm hidden sm:flex">
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
