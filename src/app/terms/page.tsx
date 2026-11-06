import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CONTACT_EMAIL, LEGAL_UPDATED, SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of use",
  description: `The rules for using ${SITE_NAME}.`,
};

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="mt-10 text-xl font-semibold tracking-tight">{children}</h2>;
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{children}</p>;
}

export default function TermsPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12">
      <Link
        href="/"
        className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4" /> Back to {SITE_NAME}
      </Link>

      <h1 className="text-3xl font-bold tracking-tight">Terms of use</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: {LEGAL_UPDATED}</p>

      <P>
        By using {SITE_NAME} — the website or the Android app — you agree to these terms. If you do
        not agree, do not use the service.
      </P>

      <H2>Your account</H2>
      <P>
        You must be at least 13 years old and provide accurate registration details. You are
        responsible for activity under your account and for keeping your password and OAuth
        accounts secure. One person should not operate multiple accounts to evade moderation or
        manipulate votes.
      </P>

      <H2>What you publish</H2>
      <P>
        You keep ownership of the ideas, comments and images you post. You grant {SITE_NAME} a
        non-exclusive, worldwide, royalty-free licence to host, store, reproduce, display and
        distribute that content for the purpose of operating and promoting the service. This
        licence ends when you delete the content or your account, except for copies already shared
        or cached by others.
      </P>
      <P>
        You confirm you have the right to post what you upload and that it does not infringe
        someone else&apos;s intellectual property, privacy or other rights.
      </P>

      <H2>Acceptable use</H2>
      <P>
        Do not post unlawful, harassing, hateful, sexually explicit, deceptive or infringing
        content; do not impersonate others; do not spam, scrape, or attempt to break the service or
        its security; do not upload malware; do not use automated means to inflate votes or
        follows. Ideas are not a place to share credentials, private documents or other
        people&apos;s personal data.
      </P>

      <H2>Moderation</H2>
      <P>
        You can report content. Reported ideas are hidden automatically once a threshold of reports
        is reached, and moderators may hide, restore or remove content and suspend accounts that
        break these terms. We may remove content without prior notice where required by law or to
        protect users.
      </P>

      <H2>Other people&apos;s ideas</H2>
      <P>
        {SITE_NAME} is a public forum. Ideas posted here are not confidential, may be seen by
        anyone, and may be used or built upon by others — forking an idea is an explicit feature.
        Do not post trade secrets you need to keep confidential. NDA or workspace features, where
        offered, are informal acknowledgements between users, not legal advice or a substitute for
        a contract.
      </P>

      <H2>Our content</H2>
      <P>
        The {SITE_NAME} name, logo and interface are ours. You may not copy or redistribute them
        without permission, except for normal sharing of links to the service.
      </P>

      <H2>Availability and changes</H2>
      <P>
        The service is provided as is. Features may change, break or be withdrawn, and we do not
        guarantee uninterrupted availability. We may update these terms; material changes will be
        reflected in the date above.
      </P>

      <H2>Ending use</H2>
      <P>
        You can delete your account at any time from{" "}
        <Link href="/account/delete" className="text-foreground underline hover:text-primary">
          account deletion
        </Link>
        . We may suspend or terminate accounts that violate these terms.
      </P>

      <H2>Liability</H2>
      <P>
        To the extent permitted by law, {SITE_NAME} is not liable for indirect or consequential
        loss, or for content posted by users. Nothing in these terms limits rights you have under
        mandatory consumer law.
      </P>

      <H2>Governing law</H2>
      <P>
        These terms are governed by the laws of India. Disputes will be handled by the competent
        courts there, without affecting any mandatory local consumer protections.
      </P>

      <H2>Contact</H2>
      <P>
        Questions about these terms:{" "}
        <a href={`mailto:${CONTACT_EMAIL}`} className="text-foreground underline hover:text-primary">
          {CONTACT_EMAIL}
        </a>
        .
      </P>

      <p className="mt-12 border-t border-white/10 pt-6 text-xs text-muted-foreground">
        <Link href="/privacy" className="underline hover:text-foreground">
          Privacy policy
        </Link>
      </p>
    </main>
  );
}
