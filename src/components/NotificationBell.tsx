"use client";

import { useEffect, useState, useRef } from "react";
import { Bell, BellRing, X, Check, MessageSquare, Heart, UserPlus, Users, GitFork, ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  reference_id: string | null;
  reference_type: string | null;
  read: boolean;
  created_at: string;
}

const typeIcons: Record<string, React.ReactNode> = {
  upvote: <Heart className="w-4 h-4 text-red-400" />,
  comment: <MessageSquare className="w-4 h-4 text-primary" />,
  reply: <MessageSquare className="w-4 h-4 text-blue-400" />,
  follow: <UserPlus className="w-4 h-4 text-green-400" />,
  workspace_join: <Users className="w-4 h-4 text-purple-400" />,
  mention: <MessageSquare className="w-4 h-4 text-orange-400" />,
};

const typeRoutes: Record<string, (ref: string) => string> = {
  idea: (id) => `/idea/${id}`,
  comment: (id) => `/idea/${id}`, // would need idea_id
  user: (id) => `/profile/${id}`,
  workspace: (id) => `/idea/${id}/workspace`,
};

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const bellRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications?limit=20');
      const data = await res.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (e) {
      console.error('Failed to fetch notifications:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30_000);
    return () => clearInterval(interval);
  }, []);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node) &&
          panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = async (id?: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(id ? { notificationId: id } : { readAll: true }),
      });
      if (id) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      } else {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } catch (e) {
      console.error('Failed to mark as read:', e);
    }
  };

  const getNotificationLink = (n: Notification): string | null => {
    if (!n.reference_id || !n.reference_type) return null;
    const router = typeRoutes[n.reference_type];
    return router ? router(n.reference_id) : null;
  };

  const formatDate = (date: string) => {
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true });
    } catch {
      return date;
    }
  };

  return (
    <div className="relative">
      <button
        ref={bellRef}
        onClick={() => setOpen(!open)}
        className="glass-button p-2 rounded-full relative"
        aria-label={unreadCount > 0 ? `${unreadCount} unread notifications` : "Notifications"}
      >
        {unreadCount > 0 ? (
          <BellRing className="w-5 h-5 text-primary" />
        ) : (
          <Bell className="w-5 h-5" />
        )}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          ref={panelRef}
          className="absolute right-0 top-full mt-2 w-80 md:w-96 glass-panel border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <h3 className="font-semibold">Notifications</h3>
            {unreadCount > 0 && (
              <button onClick={() => markAsRead()} className="text-xs text-primary hover:underline">
                Mark all read
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="px-4 py-8 text-center text-muted-foreground">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              {notifications.map((notification) => {
                const link = getNotificationLink(notification);
                const Icon = typeIcons[notification.type] || <Bell className="w-4 h-4" />;
                
                return (
                  <button
                    key={notification.id}
                    onClick={() => {
                      if (link) window.location.href = link;
                      if (!notification.read) markAsRead(notification.id);
                      setOpen(false);
                    }}
                    className={`w-full px-4 py-3 text-left hover:bg-white/5 transition-colors flex items-start gap-3 ${
                      !notification.read ? 'bg-primary/5' : ''
                    }`}
                  >
                    <div className="p-1.5 rounded-full bg-white/5 flex-shrink-0">
                      {Icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium text-sm ${!notification.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {notification.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(notification.created_at)}
                      </p>
                    </div>
                    {!notification.read && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(notification.id);
                        }}
                        className="p-1 hover:bg-white/10 rounded text-muted-foreground hover:text-foreground"
                        aria-label="Mark as read"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}