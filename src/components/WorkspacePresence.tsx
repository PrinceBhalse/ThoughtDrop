"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { User } from "lucide-react";

interface Collaborator {
  user_id: string;
  username: string;
}

interface WorkspacePresenceProps {
  ideaId: string;
  currentUserId: string;
  currentUsername: string;
}

export default function WorkspacePresence({ ideaId, currentUserId, currentUsername }: WorkspacePresenceProps) {
  const [collaborators, setCollaborators] = useState<Record<string, Collaborator>>({});
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase
      .channel(`workspace_presence_${ideaId}`, {
        config: { presence: { key: currentUserId } },
      })
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<Collaborator>();
        const next: Record<string, Collaborator> = {};
        Object.values(state).forEach((metas) => {
          metas.forEach((meta) => {
            next[meta.user_id] = { user_id: meta.user_id, username: meta.username };
          });
        });
        setCollaborators(next);
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          channel.track({ user_id: currentUserId, username: currentUsername });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ideaId, currentUserId, currentUsername, supabase]);

  const list = Object.values(collaborators);

  return (
    <div className="glass-panel p-6">
      <h3 className="font-bold mb-4 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        In the Workspace ({list.length})
      </h3>
      {list.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nobody here yet. Invite collaborators!</p>
      ) : (
        <ul className="space-y-3">
          {list.map((c) => (
            <li key={c.user_id} className="flex items-center gap-3 text-sm">
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-background rounded-full" />
              </div>
              <span className="font-medium">{c.user_id === currentUserId ? "You" : `@${c.username}`}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
