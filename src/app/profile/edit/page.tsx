"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, User } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useToast } from "@/components/ui/Toast";
import { updateProfile } from "./actions";

interface Profile {
  id: string;
  username: string | null;
  bio: string | null;
  website: string | null;
}

export default function EditProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
        .select("id, username, bio, website")
        .eq("id", user.id)
        .single();
      setProfile(data);
      setLoading(false);
    };
    load();
  }, [router]);

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
    </div>
  );
}
