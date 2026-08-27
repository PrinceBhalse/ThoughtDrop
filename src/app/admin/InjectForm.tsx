"use client";

import { useState, useTransition } from "react";
import { injectIdea } from "./actions";

interface CommunityOption {
  id: string;
  name: string;
}

export default function InjectForm({
  communities,
}: {
  communities: CommunityOption[];
}) {
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null);

  const handleSubmit = (formData: FormData) => {
    setStatus(null);
    startTransition(async () => {
      const result = await injectIdea(formData);
      setStatus(
        result.ok
          ? { ok: true, message: "Idea injected into the pool." }
          : { ok: false, message: result.error }
      );
    });
  };

  return (
    <form action={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1.5 text-muted-foreground" htmlFor="title">Title</label>
        <input
          type="text" id="title" name="title" required placeholder="e.g. A solar-powered desalination mesh for coastal villages"
          className="w-full bg-secondary border border-white/10 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1.5 text-muted-foreground" htmlFor="content">Description</label>
        <textarea
          id="content" name="content" required rows={4}
          placeholder="What's the concept? A few sentences that pitch it well."
          className="w-full bg-secondary border border-white/10 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1.5 text-muted-foreground" htmlFor="category">Category</label>
          <select id="category" name="category" defaultValue="Tech" className="w-full bg-secondary border border-white/10 rounded-lg px-4 py-2.5">
            <option>Tech</option><option>Business</option><option>Creative</option><option>Social Impact</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5 text-muted-foreground" htmlFor="status">Status</label>
          <select id="status" name="status" defaultValue="Concept" className="w-full bg-secondary border border-white/10 rounded-lg px-4 py-2.5">
            <option>Concept</option><option>In Progress</option><option>Seeking Collaborators</option><option>Launched</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5 text-muted-foreground" htmlFor="communityId">Community (optional)</label>
          <select id="communityId" name="communityId" className="w-full bg-secondary border border-white/10 rounded-lg px-4 py-2.5">
            <option value="">None</option>
            {communities.map((c) => (
              <option key={c.id} value={c.id}>/d/{c.name}</option>
            ))}
          </select>
        </div>
      </div>
      {status && (
        <p className={status.ok ? "text-sm text-green-400" : "text-sm text-red-400"}>
          {status.message}
        </p>
      )}
      <button type="submit" disabled={pending} className="primary-button disabled:opacity-60">
        {pending ? "Injecting…" : "Inject idea"}
      </button>
    </form>
  );
}
