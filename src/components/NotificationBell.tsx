'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, Check, ExternalLink, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import Tooltip from './Tooltip';

dayjs.extend(relativeTime);

interface NotificationItem {
  id: string;
  recipientId: string;
  actorName: string;
  type: string;
  taskId: string;
  projectId: string;
  commentId: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Set up polling interval for real-time-like feel
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  // Mark a single notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      const res = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      }
    } catch (err) {
      console.error('Failed to mark notification as read', err);
    }
  };

  const markAllAsRead = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/notifications/read-all', {
        method: 'PATCH',
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Failed to mark all as read', err);
    } finally {
      setLoading(false);
    }
  };

  // Clear all notifications
  const clearAll = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/notifications/clear-all', {
        method: 'DELETE',
      });
      if (res.ok) {
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Failed to clear notifications', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = async (n: NotificationItem) => {
    setOpen(false);
    if (!n.read) {
      await markAsRead(n.id);
    }
    router.push(`/tasks/${n.taskId}`);
  };

  return (
    <div ref={dropdownRef} className="relative">
      {/* Trigger Bell Icon */}
      <Tooltip content="Notifications">
        <button
          onClick={() => setOpen((o) => !o)}
          aria-label="Notifications"
          className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition duration-200 outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 cursor-pointer relative"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-950 animate-pulse">
              {unreadCount}
            </span>
          )}
        </button>
      </Tooltip>

      {/* Notifications Dropdown Popover */}
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl shadow-black/10 dark:shadow-black/80 flex flex-col max-h-[480px]">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 rounded-t-xl">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Notifications</h3>
            <div className="flex items-center gap-3">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  disabled={loading}
                  className="text-[11px] text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 font-semibold transition duration-150 flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  title="Mark all as read"
                >
                  <Check className="w-3 h-3" />
                  Mark all as read
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={clearAll}
                  disabled={loading}
                  className="text-[11px] text-slate-500 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400 font-semibold transition duration-150 flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  title="Clear all notifications"
                >
                  <Trash2 className="w-3 h-3" />
                  Clear all
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto min-h-[150px] max-h-[380px]">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center h-full">
                <p className="text-sm text-slate-500">No notifications yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={`p-4 flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition duration-150 cursor-pointer ${
                      !n.read ? 'bg-blue-600/5 dark:bg-blue-600/10' : ''
                    }`}
                  >
                    {/* Read/Unread dot indicator */}
                    <span className="mt-1.5 flex-shrink-0">
                      <span
                        className={`block h-2 w-2 rounded-full ${
                          !n.read ? 'bg-blue-500 ring-2 ring-blue-500/20' : 'bg-transparent'
                        }`}
                      />
                    </span>

                    <div className="flex-1 min-w-0 flex flex-col gap-1">
                      <p className="text-xs text-slate-700 dark:text-slate-200 leading-normal">
                        {n.message}
                      </p>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">
                        {dayjs(n.createdAt).fromNow ? dayjs(n.createdAt).fromNow() : dayjs(n.createdAt).format('MM/DD/YYYY h:mm A')}
                      </span>
                    </div>

                    <span className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
