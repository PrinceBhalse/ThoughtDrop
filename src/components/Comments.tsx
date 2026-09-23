"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useToast } from "@/components/ui/Toast";
import { MessageSquare, ChevronRight, Loader2, Edit2, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Comment {
  id: string;
  idea_id: string;
  author_id: string;
  content: string;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
  profiles: { username: string | null } | null;
  replies?: Comment[];
  replyCount?: number;
}

interface CommentsProps {
  ideaId: string;
  initialComments?: Comment[];
}

function CommentThread({ comments, ideaId, level = 0 }: { comments: Comment[]; ideaId: string; level?: number }) {
  return (
    <div className={`ml-${level * 4} space-y-3`}>
      {comments.map((comment) => (
        <CommentItem key={comment.id} comment={comment} ideaId={ideaId} level={level} />
      ))}
    </div>
  );
}

function CommentItem({ comment, ideaId, level }: { comment: Comment; ideaId: string; level: number }) {
  const [showReplies, setShowReplies] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [replying, setReplying] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const isOwner = true; // TODO: check actual ownership

  const handleEdit = async () => {
    setSubmitting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("comments")
        .update({ content: editContent })
        .eq("id", comment.id);
      if (error) throw error;
      toast("Comment updated", "success");
      setEditing(false);
      // Refresh would need parent callback - simplified
    } catch {
      toast("Failed to update", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this comment?")) return;
    try {
      const supabase = createClient();
      const { error } = await supabase.from("comments").delete().eq("id", comment.id);
      if (error) throw error;
      toast("Comment deleted", "success");
      // Refresh needed
    } catch {
      toast("Failed to delete", "error");
    }
  };

  const handleReply = async () => {
    if (!replyContent.trim()) return;
    setSubmitting(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast("Please log in to reply", "error"); return; }

      const { error } = await supabase
        .from("comments")
        .insert({ idea_id: ideaId, author_id: user.id, content: replyContent, parent_id: comment.id });
      if (error) throw error;
      toast("Reply posted", "success");
      setReplying(false);
      setReplyContent("");
      // Refresh needed
    } catch {
      toast("Failed to reply", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (date: string) => {
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true });
    } catch {
      return date;
    }
  };

  return (
    <div className="flex gap-3 group">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-sm font-bold shrink-0">
        {comment.profiles?.username?.[0]?.toUpperCase() || "?"}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{comment.profiles?.username || "Anonymous"}</span>
          <span className="text-xs text-muted-foreground">{formatDate(comment.created_at)}</span>
          {comment.updated_at !== comment.created_at && (
            <span className="text-xs text-muted-foreground">(edited)</span>
          )}
        </div>
        {editing ? (
          <div className="space-y-2 mt-1">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={3}
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
            <div className="flex gap-2">
              <button onClick={handleEdit} disabled={submitting} className="primary-button text-xs py-1.5 px-3">
                {submitting ? "Saving…" : "Save"}
              </button>
              <button onClick={() => setEditing(false)} className="glass-button text-xs py-1.5 px-3">Cancel</button>
            </div>
          </div>
        ) : (
          <p className="mt-1 text-sm text-foreground whitespace-pre-wrap">{comment.content}</p>
        )}

        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
          {isOwner && (
            <>
              <button onClick={() => setEditing(true)} className="hover:text-foreground transition-colors flex items-center gap-1">
                <Edit2 className="w-3.5 h-3.5" /> Edit
              </button>
              <button onClick={handleDelete} className="hover:text-red-400 transition-colors flex items-center gap-1">
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </>
          )}
          {(comment.replyCount && comment.replyCount > 0) || comment.replies?.length ? (
            <button
              onClick={() => setShowReplies(!showReplies)}
              className="hover:text-foreground transition-colors flex items-center gap-1"
            >
              <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showReplies ? "rotate-90" : ""}`} />
              {showReplies ? "Hide" : "Show"} replies ({comment.replyCount || comment.replies?.length || 0})
            </button>
          ) : (
            <button onClick={() => setReplying(true)} className="hover:text-foreground transition-colors flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5" /> Reply
            </button>
          )}
        </div>

        {replying && (
          <div className="mt-2 flex gap-2">
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Write a reply..."
              rows={2}
              className="flex-1 bg-secondary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
            <button onClick={handleReply} disabled={submitting || !replyContent.trim()} className="primary-button px-3 py-2 self-start">
              {submitting ? "Posting…" : "Reply"}
            </button>
          </div>
        )}

        {showReplies && comment.replies && comment.replies.length > 0 && (
          <CommentThread comments={comment.replies} ideaId={ideaId} level={level + 1} />
        )}
      </div>
    </div>
  );
}

export default function Comments({ ideaId, initialComments = [] }: CommentsProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const loadComments = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("comments")
        .select(`
          *,
          profiles:users(username)
        `)
        .eq("idea_id", ideaId)
        .is("parent_id", null)
        .order("created_at", { ascending: true });
      if (error) throw error;
      // Fetch replies for each top-level comment
      const commentsWithReplies = await Promise.all(
        (data || []).map(async (comment) => {
          const { data: replies } = await supabase
            .from("comments")
            .select(`*, profiles:users(username)`)
            .eq("parent_id", comment.id)
            .order("created_at", { ascending: true });
          return { ...comment, replies: replies || [], replyCount: replies?.length || 0 };
        })
      );
      setComments(commentsWithReplies);
    } catch {
      console.error("Failed to load comments");
    } finally {
      setLoading(false);
    }
  }, [ideaId]);

  // Fetch comments on mount - use useCallback for loadComments to avoid re-fetching
  useEffect(() => {
    if (initialComments.length > 0) {
      // Defer to next tick to satisfy lint rules
      const id = setTimeout(() => {
        setComments(initialComments);
      }, 0);
      return () => clearTimeout(id);
    }
    // Defer loadComments to avoid synchronous setState in effect
    const id = setTimeout(() => {
      loadComments();
    }, 0);
    return () => clearTimeout(id);
  }, [ideaId, initialComments, loadComments]);

  const handleSubmit = async () => {
    if (!newComment.trim() || submitting) return;
    setSubmitting(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast("Please log in to comment", "error"); return; }

      const { data, error } = await supabase
        .from("comments")
        .insert({ idea_id: ideaId, author_id: user.id, content: newComment })
        .select(`
          *,
          profiles:users(username)
        `)
        .single();
      if (error) throw error;

      setComments((prev) => [...prev, { ...data, replies: [], replyCount: 0 }]);
      setNewComment("");
      toast("Comment posted", "success");
    } catch {
      toast("Failed to post comment", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-8 pt-8 border-t border-white/10">
      <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
        <MessageSquare className="w-5 h-5" />
        Discussion ({comments.length})
      </h2>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Add comment form */}
          <div className="flex gap-3 mb-8">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-sm font-bold shrink-0">?</div>
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Join the discussion..."
                rows={3}
                className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
              <div className="flex justify-end gap-2 mt-2">
                <button onClick={handleSubmit} disabled={submitting || !newComment.trim()} className="primary-button px-4 py-2">
                  {submitting ? "Posting…" : "Post Comment"}
                </button>
              </div>
            </div>
          </div>

          {/* Comments list */}
          <CommentThread comments={comments} ideaId={ideaId} />
        </>
      )}
    </div>
  );
}