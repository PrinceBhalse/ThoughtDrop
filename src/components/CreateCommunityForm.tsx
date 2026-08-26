"use client";

import { useState } from "react";
import { createCommunity } from "@/app/communities/actions";
import { Plus, Hash } from "lucide-react";

export default function CreateCommunityForm() {
  const [name, setName] = useState("");

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "");

  return (
    <form action={createCommunity} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2 text-muted-foreground" htmlFor="community-name">
          Name
        </label>
        <div className="flex items-center bg-secondary border border-white/10 rounded-lg px-4 focus-within:ring-2 focus-within:ring-primary transition-all">
          <Hash className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            type="text"
            id="community-name"
            name="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="SustainableArchitecture"
            className="w-full bg-transparent border-none px-2 py-3 focus:outline-none focus:ring-0 placeholder:text-muted-foreground/50"
          />
        </div>
        {slug && (
          <p className="text-xs text-muted-foreground mt-2">Will live at /d/{slug}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-2 text-muted-foreground" htmlFor="community-description">
          Description
        </label>
        <textarea
          id="community-description"
          name="description"
          rows={3}
          placeholder="What is this Sub-Drop about?"
          className="w-full bg-secondary border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary transition-all resize-none placeholder:text-muted-foreground/50"
        />
      </div>

      <button
        type="submit"
        className="primary-button w-full flex items-center justify-center gap-2"
      >
        <Plus className="w-4 h-4" />
        Create Community
      </button>
    </form>
  );
}
