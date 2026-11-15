"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, User, Trash2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useToast } from "@/components/ui/Toast";
import LegalLinks from "@/components/LegalLinks";
import { cn } from "@/lib/utils";
import { updateProfile, setPersonalization } from "./actions";

interface Profile {
  id: string;
  username: string | null;
  bio: string | null;
  website: string | null;
  consent_personalization?: boolean;
}

export default function EditProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [personalize, setPersonalize] = useState(true);
  const [savingPref, setSavingPref] = useState(false);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      const { data } = await supabase
        .from("users")
        .select("id, username, bio, website, consent_personalization")
        .eq("id", user.id)
        .single();
      setProfile(data);
      if (data?.consent_personalization === false) setPersonalize(false);
      setLoading(false);
    };
    load();
  }, [router]);

  const togglePersonalization = async () => {
    if (savingPref) return;
    const next = !personalize;
    setPersonalize(next);
    setSavingPref(true);
    const result = await setPersonalization(next);
    setSavingPref(false);
    if (result === "ok") {
      toast(next ? "Personalized feed on" : "Personalized feed off", "success");
    } else {
      setPersonalize(!next);
      toast(result.replace(/^error:/, "") || "Failed to update", "error");
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto py-20 flex justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link
        href="/profile"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to profile
      </Link>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit profile</h1>
        <p className="text-muted-foreground mt-1">
          Update your public information.
        </p>
      </div>

      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (saving) return;
          setSaving(true);
          const result = await updateProfile(new FormData(e.currentTarget));
          setSaving(false);
          if (result === "ok") {
            toast("Profile updated", "success");
            router.push("/profile");
          } else {
            toast(result.replace(/^error:/, "") || "Failed to update", "error");
          }
        }}
        className="glass-panel p-6 space-y-5"
      >
        {/* Avatar preview */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary to-accent border-2 border-background flex items-center justify-center text-white text-2xl font-bold shrink-0">
            {profile?.username?.[0]?.toUpperCase() || <User size={24} />}
          </div>
          <p className="text-sm text-muted-foreground">
            Avatar is derived from your username initial.
          </p>
        </div>

        <div>
          <label
            htmlFor="username"
            className="block text-sm font-medium mb-1.5 text-muted-foreground"
          >
            Username
          </label>
          <input
            type="text"
            id="username"
            name="username"
            required
            minLength={3}
            maxLength={30}
            pattern="[a-z0-9_]+"
            defaultValue={profile?.username ?? ""}
            className="w-full bg-secondary border border-border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="e.g. alex_builds"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Lowercase letters, numbers, and underscores only.
          </p>
        </div>

        <div>
          <label
            htmlFor="bio"
            className="block text-sm font-medium mb-1.5 text-muted-foreground"
          >
            Bio
          </label>
          <textarea
            id="bio"
            name="bio"
            rows={3}
            maxLength={280}
            defaultValue={profile?.bio ?? ""}
            className="w-full bg-secondary border border-border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary resize-y"
            placeholder="A short bio that appears on your profile."
          />
          <p className="text-xs text-muted-foreground mt-1">
            Max 280 characters.
          </p>
        </div>

        <div>
          <label
            htmlFor="website"
            className="block text-sm font-medium mb-1.5 text-muted-foreground"
          >
            Website
          </label>
          <input
            type="url"
            id="website"
            name="website"
            defaultValue={profile?.website ?? ""}
            className="w-full bg-secondary border border-border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="https://yoursite.com"
          />
        </div>

        <div className="pt-2 border-t border-border flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="primary-button px-6 py-2.5 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>

      <section className="glass-panel p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="font-semibold">Personalized feed</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Use your activity — what you open, how long you read, and &ldquo;show me less&rdquo;
              choices — to rank For You. Turn it off and the feed falls back to recency and
              popularity.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={personalize}
            aria-label="Personalized feed"
            disabled={savingPref}
            onClick={togglePersonalization}
            className={cn(
              "relative mt-1 h-6 w-11 shrink-0 rounded-full border transition-colors disabled:opacity-60",
              personalize ? "bg-primary border-primary" : "bg-white/10 border-white/15"
            )}
          >
            <span
              className={cn(
                "absolute top-1/2 h-[18px] w-[18px] -translate-y-1/2 rounded-full bg-white transition-transform",
                personalize ? "translate-x-[22px]" : "translate-x-[2px]"
              )}
            />
          </button>
        </div>
      </section>

      <section className="glass-panel p-6 space-y-4">
        <div>
          <h2 className="font-semibold">Account</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Deleting your account removes your profile, ideas, images and activity. This cannot be
            undone.
          </p>
        </div>
        <Link
          href="/account/delete"
          className="inline-flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/20"
        >
          <Trash2 className="w-4 h-4" /> Delete account
        </Link>
        <LegalLinks className="pt-2 border-t border-border" />
      </section>
    </div>
  );
}
