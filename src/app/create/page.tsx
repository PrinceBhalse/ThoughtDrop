"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createIdea } from "./actions";
import RichTextEditor from "@/components/RichTextEditor";
import { createClient } from "@/utils/supabase/client";
import { useToast } from "@/components/ui/Toast";
import { Bot, GitFork, ShieldAlert, Hash } from "lucide-react";

export default function CreateIdeaPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center py-32">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <CreateIdeaForm />
    </Suspense>
  );
}

function CreateIdeaForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const parentId = searchParams.get('parentId') || '';
  const presetCommunityId = searchParams.get('communityId') || '';

  const [contentHtml, setContentHtml] = useState("");
  const [contentText, setContentText] = useState("");
  const [communities, setCommunities] = useState<{ id: string; name: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadCommunities = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('communities')
        .select('id, name')
        .order('name', { ascending: true });
      if (data) setCommunities(data);
    };
    loadCommunities();
  }, []);

  return (
    <div className="max-w-5xl mx-auto flex flex-col lg:flex-row gap-8">
      {/* Main Editor Area */}
      <div className="flex-1">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            {parentId ? 'Fork Idea' : 'Share an Idea'}
          </h1>
          <p className="text-muted-foreground">Drop your thought into the ecosystem.</p>
        </div>

        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (submitting) return;
            setSubmitting(true);
            const fd = new FormData(e.currentTarget);
            fd.set("contentHtml", contentHtml);
            fd.set("content", contentText);
            fd.set("parentId", parentId);
            const result = await createIdea(fd);
            setSubmitting(false);
            if (result === "ok") {
              toast("Idea published", "success");
              router.push("/");
            } else {
              toast(result.replace(/^error:/, "") || "Failed to publish idea", "error");
            }
          }}
          className="space-y-6"
        >
          <input type="hidden" name="contentHtml" value={contentHtml} />
          <input type="hidden" name="content" value={contentText} />
          <input type="hidden" name="parentId" value={parentId} />

          {parentId && (
            <div className="bg-primary/10 border border-primary/20 text-primary px-4 py-2 rounded-lg flex items-center gap-2 mb-4">
              <GitFork className="w-5 h-5" />
              <span>You are forking an existing idea. Your changes will be linked to the original.</span>
            </div>
          )}

          <div className="glass-panel p-8 space-y-6">
            <div>
              <input 
                type="text" 
                id="title" 
                name="title" 
                required 
                className="w-full bg-transparent border-none px-0 focus:outline-none focus:ring-0 text-3xl font-bold placeholder:text-muted-foreground/50"
                placeholder="Title"
              />
            </div>

            <RichTextEditor 
              content="" 
              onChange={(html, text) => {
                setContentHtml(html);
                setContentText(text);
              }}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-white/10">
              <div>
                <label className="block text-sm font-medium mb-2 text-muted-foreground" htmlFor="category">Category</label>
                <select 
                  id="category" 
                  name="category" 
                  required
                  className="w-full bg-secondary border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                >
                  <option value="Tech">Tech</option>
                  <option value="Business">Business</option>
                  <option value="Creative">Creative</option>
                  <option value="Social Impact">Social Impact</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-muted-foreground" htmlFor="status">Status</label>
                <select 
                  id="status" 
                  name="status" 
                  required
                  className="w-full bg-secondary border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                >
                  <option value="Concept">Concept</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Seeking Collaborators">Seeking Collaborators</option>
                  <option value="Launched">Launched</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-white/10">
              <div>
                <label className="block text-sm font-medium mb-2 text-muted-foreground" htmlFor="communityId">Sub-Drop (Community - optional)</label>
                <div className="relative">
                  <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <select
                    id="communityId"
                    name="communityId"
                    defaultValue={presetCommunityId}
                    className="w-full bg-secondary border border-white/10 rounded-lg pl-11 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary transition-all appearance-none"
                  >
                    <option value="">None — post globally</option>
                    {communities.map((c) => (
                      <option key={c.id} value={c.id}>/d/{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-muted-foreground" htmlFor="requiredRoles">Required Roles (comma-separated)</label>
                <input 
                  type="text" 
                  id="requiredRoles" 
                  name="requiredRoles" 
                  className="w-full bg-secondary border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                  placeholder="e.g. Python Dev, Designer"
                />
              </div>
            </div>

            <div className="flex flex-col gap-4 pt-4 border-t border-white/10">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input type="checkbox" name="isAnonymous" value="true" className="w-5 h-5 rounded border-white/10 bg-white/5 text-primary focus:ring-primary/50" />
                <span className="text-sm font-medium group-hover:text-primary transition-colors">Post Anonymously</span>
              </label>
              
              <label className="flex items-center gap-3 cursor-pointer group">
                <input type="checkbox" name="isAdult" value="true" className="w-5 h-5 rounded border-white/10 bg-white/5 text-red-500 focus:ring-red-500/50" />
                <span className="text-sm font-medium text-red-400 group-hover:text-red-300 transition-colors">Mark as 18+ / Adult Content</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer group">
                <input type="checkbox" name="isNdaProtected" value="true" className="w-5 h-5 rounded border-white/10 bg-white/5 text-blue-500 focus:ring-blue-500/50" />
                <span className="text-sm font-medium text-blue-400 group-hover:text-blue-300 transition-colors flex items-center gap-1">
                  <ShieldAlert className="w-4 h-4" /> NDA Protected
                </span>
              </label>
            </div>

            <div className="pt-4 flex justify-end">
              <button type="submit" disabled={submitting} className="primary-button px-8 py-3 text-lg w-full sm:w-auto disabled:opacity-60">
                {submitting ? "Publishing…" : "Publish"}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* AI Co-Pilot Sidebar (Scaffolding for now) */}
      <div className="lg:w-80 space-y-4">
        <div className="glass-panel p-6 border-primary/30 shadow-[0_0_20px_rgba(139,92,246,0.1)]">
          <div className="flex items-center gap-2 mb-4">
            <Bot className="w-6 h-6 text-primary" />
            <h3 className="font-bold text-lg">AI Co-Pilot</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Stuck? Let the AI help you structure your pitch, fix grammar, or generate a visual thumbnail.
          </p>
          <div className="space-y-2">
            <button className="w-full text-left px-4 py-2 text-sm bg-white/5 hover:bg-primary/20 rounded-lg transition-colors border border-white/5">
              ✨ Format as Pitch Deck
            </button>
            <button className="w-full text-left px-4 py-2 text-sm bg-white/5 hover:bg-primary/20 rounded-lg transition-colors border border-white/5">
              📝 Fix Grammar & Tone
            </button>
            <button className="w-full text-left px-4 py-2 text-sm bg-white/5 hover:bg-primary/20 rounded-lg transition-colors border border-white/5">
              🎨 Generate Thumbnail
            </button>
          </div>
          <div className="mt-4 pt-4 border-t border-white/10">
            <p className="text-xs text-center text-primary/70">Requires Premium Subscription</p>
          </div>
        </div>
      </div>
    </div>
  );
}
