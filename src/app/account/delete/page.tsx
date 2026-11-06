import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, LogIn } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import DeleteAccountForm from "@/components/DeleteAccountForm";
import LegalLinks from "@/components/LegalLinks";
import { CONTACT_EMAIL, SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "Delete account",
  description: `Request deletion of your ${SITE_NAME} account and data.`,
};

export default async function DeleteAccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-12">
      <Link
        href={user ? "/profile/edit" : "/"}
        className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>

      <h1 className="text-3xl font-bold tracking-tight">Delete your account</h1>

      {user ? (
        <p className="mt-3 text-muted-foreground">
          This removes your {SITE_NAME} account for <strong>{user.email}</strong> and cannot be
          undone. There is no recovery window.
        </p>
      ) : (
        <p className="mt-3 text-muted-foreground">
          Sign in to delete your {SITE_NAME} account instantly, or email us from the address on the
          account and we will remove it within 30 days.
        </p>
      )}

      <section className="mt-8 rounded-xl border border-white/10 bg-white/[0.03] p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          What gets deleted
        </h2>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          <li>Your profile, username, bio and website</li>
          <li>Every idea you posted, including drafts and images you uploaded</li>
          <li>Your comments, replies, upvotes, bookmarks and follows</li>
          <li>Your notifications and device push tokens</li>
          <li>Your NDA signatures, workspace messages and reports</li>
        </ul>
        <p className="mt-4 text-sm text-muted-foreground">
          Content other people created stays on {SITE_NAME}, but it will no longer be linked to
          you. Aggregate counts may take a moment to settle.
        </p>
      </section>

      <section className="mt-8">
        {user ? (
          <DeleteAccountForm />
        ) : (
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-500"
          >
            <LogIn className="w-4 h-4" /> Sign in to delete
          </Link>
        )}
      </section>

      <p className="mt-8 text-xs text-muted-foreground">
        Can&apos;t sign in? Write to{" "}
        <a href={`mailto:${CONTACT_EMAIL}`} className="underline hover:text-foreground">
          {CONTACT_EMAIL}
        </a>{" "}
        from the address on your account and we will delete it within 30 days.
      </p>

      <LegalLinks className="mt-8 border-t border-white/10 pt-6" />
    </main>
  );
}
