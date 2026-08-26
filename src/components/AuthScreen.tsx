"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import { Hash, Loader2, Lock, MessageSquare, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { loginWithProvider } from "@/app/login/actions";

type AuthMode = "signin" | "signup";
type Provider = "github" | "google";

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

const FEATURES = [
  {
    icon: MessageSquare,
    title: "Live Workspaces",
    desc: "Every In Progress idea unlocks a real-time chat room with presence.",
  },
  {
    icon: Hash,
    title: "Micro-Communities",
    desc: "Plant your idea in focused Sub-Drops where the right people are watching.",
  },
  {
    icon: Lock,
    title: "NDA Protection",
    desc: "Keep secret mechanics sealed until collaborators digitally sign in.",
  },
];

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden>
      <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.379.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

const PROVIDERS: { id: Provider; label: string; icon: React.ReactNode }[] = [
  { id: "github", label: "Continue with GitHub", icon: <GitHubIcon /> },
  { id: "google", label: "Continue with Google", icon: <GoogleIcon /> },
];

export default function AuthScreen({ mode }: { mode: AuthMode }) {
  const [pending, setPending] = useState<Provider | null>(null);
  const isSignup = mode === "signup";

  const handleProvider = (provider: Provider) => {
    if (pending) return;
    setPending(provider);
    loginWithProvider(provider).catch(() => setPending(null));
  };

  const tabClass = (active: boolean) =>
    cn(
      "py-2.5 text-sm font-semibold rounded-lg transition-all text-center",
      active
        ? "bg-white/10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
        : "text-muted-foreground hover:text-white"
    );

  return (
    <section className="min-h-[calc(100vh-8rem)] grid lg:grid-cols-[1.1fr_1fr] gap-10 xl:gap-16 items-center">
      {/* Brand Showcase */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative hidden lg:flex flex-col gap-10 py-10"
      >
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-10 -left-16 w-80 h-80 rounded-full bg-primary/25 blur-[110px] animate-orb-a" />
          <div className="absolute bottom-0 -right-8 w-72 h-72 rounded-full bg-accent/20 blur-[100px] animate-orb-b" />
        </div>

        <motion.div variants={item} className="relative">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary">
            <Sparkles className="w-3.5 h-3.5" />
            Deep Collaboration · Live Now
          </span>
        </motion.div>

        <motion.h1
          variants={item}
          className="relative text-5xl xl:text-6xl font-extrabold tracking-tighter leading-[1.05]"
        >
          Where raw ideas
          <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-fuchsia-400 to-accent">
            ripple into reality.
          </span>
        </motion.h1>

        <motion.p variants={item} className="relative max-w-lg text-lg text-muted-foreground leading-relaxed">
          ThoughtDrop turns lonely concepts into living projects. Post an idea,
          gather collaborators in a real-time workspace, and build it in the open.
        </motion.p>

        <motion.ul variants={item} className="relative space-y-5 max-w-lg">
          {FEATURES.map((feature) => (
            <li key={feature.title} className="flex items-start gap-4">
              <div className="w-10 h-10 shrink-0 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                <feature.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold">{feature.title}</p>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
              </div>
            </li>
          ))}
        </motion.ul>
      </motion.div>

      {/* Auth Card */}
      <div className="flex justify-center w-full">
        <motion.div
          initial={{ opacity: 0, y: 28, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="glass-panel w-full max-w-md p-8 sm:p-10 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-accent" />
          <div aria-hidden className="pointer-events-none absolute -top-24 -right-24 w-64 h-64 rounded-full bg-primary/20 blur-[90px]" />

          {/* Compact brand for mobile / signup context */}
          <div className="lg:hidden mb-8 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-2xl mb-3 shadow-lg shadow-primary/20">
              T
            </div>
            <p className="text-sm text-muted-foreground">Drop your thoughts. Watch them ripple.</p>
          </div>

          {/* Tabs */}
          <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-white/5 border border-white/10 mb-8">
            <Link href="/login" className={tabClass(!isSignup)}>
              Sign In
            </Link>
            <Link href="/signup" className={tabClass(isSignup)}>
              Create Account
            </Link>
          </div>

          <div className="mb-8 relative">
            <h2 className="text-2xl font-bold tracking-tight">
              {isSignup ? "Create your account" : "Welcome back"}
            </h2>
            <p className="text-sm text-muted-foreground mt-1.5">
              {isSignup
                ? "Join builders turning ideas into reality."
                : "Sign in to continue dropping thoughts."}
            </p>
          </div>

          <div className="space-y-3 relative">
            {PROVIDERS.map((provider) => (
              <button
                key={provider.id}
                onClick={() => handleProvider(provider.id)}
                disabled={pending !== null}
                className="group w-full glass-button py-3.5 text-base font-medium hover:bg-white/10 hover:border-primary/40 disabled:opacity-60 disabled:cursor-wait transition-all hover:-translate-y-0.5 active:translate-y-0"
              >
                <span className="flex items-center justify-center gap-3">
                  {pending === provider.id ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin text-primary" />
                      <span>Connecting to {provider.id === "github" ? "GitHub" : "Google"}…</span>
                    </>
                  ) : (
                    <>
                      <span className="transition-transform group-hover:scale-110">{provider.icon}</span>
                      <span>{isSignup ? provider.label.replace("Continue with", "Sign up with") : provider.label}</span>
                    </>
                  )}
                </span>
              </button>
            ))}
          </div>

          <p className="mt-8 text-xs text-center text-muted-foreground leading-relaxed relative">
            By continuing you agree to our{" "}
            <span className="text-foreground/80 font-medium">Terms of Service</span> and{" "}
            <span className="text-foreground/80 font-medium">Privacy Policy</span>.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
