"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Send } from "lucide-react";

interface Message {
  id: string;
  idea_id: string;
  user_id: string;
  content: string;
  created_at: string;
  users?: {
    username: string;
  };
}

interface WorkspaceChatProps {
  ideaId: string;
  currentUserId: string;
}

export default function WorkspaceChat({ ideaId, currentUserId }: WorkspaceChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const supabase = createClient();

  useEffect(() => {
    // Fetch initial messages
    const fetchMessages = async () => {
      const { data } = await supabase
        .from('workspace_messages')
        .select('*, users(username)')
        .eq('idea_id', ideaId)
        .order('created_at', { ascending: true });

      if (data) {
        setMessages(data as Message[]);
      }
    };

    fetchMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel(`workspace_${ideaId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'workspace_messages',
          filter: `idea_id=eq.${ideaId}`
        },
        async (payload) => {
          // Fetch the user details for the new message
          const { data: userData } = await supabase
            .from('users')
            .select('username')
            .eq('id', payload.new.user_id)
            .single();

          const newMessageWithUser = {
            ...payload.new,
            users: userData || { username: 'Unknown' }
          } as Message;

          setMessages((prev) => [...prev, newMessageWithUser]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ideaId, supabase]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const messageContent = newMessage.trim();
    setNewMessage(""); // Optimistic clear

    await supabase.from('workspace_messages').insert({
      idea_id: ideaId,
      user_id: currentUserId,
      content: messageContent
    });
  };

  return (
    <div className="flex flex-col h-[600px] bg-secondary/30 rounded-xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="bg-white/5 border-b border-white/10 p-4 flex items-center justify-between">
        <h3 className="font-bold flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          Live Workspace Chat
        </h3>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col">
        {messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
            No messages yet. Start the collaboration!
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.user_id === currentUserId;
            return (
              <div key={msg.id} className={`flex flex-col max-w-[80%] ${isMe ? 'self-end items-end' : 'self-start items-start'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-muted-foreground font-medium">
                    {isMe ? 'You' : `@${msg.users?.username}`}
                  </span>
                  <span className="text-[10px] text-muted-foreground/50">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className={`px-4 py-2 rounded-2xl text-sm ${isMe ? 'bg-primary text-white rounded-tr-sm' : 'bg-white/10 rounded-tl-sm'}`}>
                  {msg.content}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white/5 border-t border-white/10">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-secondary border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button 
            type="submit" 
            disabled={!newMessage.trim()}
            className="bg-primary hover:bg-primary/90 text-white p-2 rounded-lg transition-colors disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
