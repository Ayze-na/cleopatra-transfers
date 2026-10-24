'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { logActivity } from '@/lib/admin-activity';

interface Notification {
  id: string;
  event: string;
  channel: string;
  recipient: string;
  status: string;
  error: string | null;
  related_booking_id: string | null;
  created_at: string;
}

interface Activity {
  id: string;
  admin_email: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

const inputCls = 'bg-pharaoh-bg border border-gold/30 rounded px-3 py-2 text-pharaoh-ivory';

const statusCls: Record<string, string> = {
  sent: 'bg-green-600/30 text-green-300',
  pending: 'bg-yellow-600/30 text-yellow-300',
  failed: 'bg-red-600/30 text-red-300',
};

export default function LogsManager() {
  const [tab, setTab] = useState<'notifications' | 'activity'>('notifications');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState('');

  const flash = (msg: string) => {
    setSaved(msg);
    setTimeout(() => setSaved(''), 2500);
  };

  const load = async () => {
    const [notifRes, activityRes] = await Promise.all([
      supabase
        .from('notification_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200),
      supabase
        .from('activity_log')
        .select('*, admin_users(email)')
        .order('created_at', { ascending: false })
        .limit(200),
    ]);
    setNotifications((notifRes.data as Notification[]) ?? []);
    setActivities(
      ((activityRes.data ?? []) as any[]).map((a) => ({
        ...a,
        admin_email: (a.admin_users as any)?.email ?? null,
      }))
    );
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const clearNotifications = async () => {
    if (!confirm('Clear all notification log entries?')) return;
    await supabase.from('notification_log').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await logActivity('clear_log', 'log', null, { table: 'notification_log' });
    flash('Notification log cleared');
    await load();
  };

  const clearActivities = async () => {
    if (!confirm('Clear all activity log entries?')) return;
    await supabase.from('activity_log').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await logActivity('clear_log', 'log', null, { table: 'activity_log' });
    flash('Activity log cleared');
    await load();
  };

  if (loading) return <p className="text-pharaoh-ivory/60">Loading...</p>;

  return (
    <div className="space-y-6">
      {saved && <p className="text-green-300 text-sm">{saved}</p>}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setTab('notifications')}
          className={`px-4 py-2 rounded text-sm ${tab === 'notifications' ? 'bg-gold text-black font-semibold' : 'bg-pharaoh-blue/40 text-pharaoh-ivory'}`}
        >
          Notification Log ({notifications.length})
        </button>
        <button
          onClick={() => setTab('activity')}
          className={`px-4 py-2 rounded text-sm ${tab === 'activity' ? 'bg-gold text-black font-semibold' : 'bg-pharaoh-blue/40 text-pharaoh-ivory'}`}
        >
          Activity Log ({activities.length})
        </button>
        <div className="flex-1" />
        <button
          onClick={tab === 'notifications' ? clearNotifications : clearActivities}
          className="px-4 py-2 bg-red-600/30 text-red-300 rounded text-sm hover:bg-red-600/50"
        >
          Clear log
        </button>
      </div>

      {tab === 'notifications' ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-gold border-b border-gold/30">
                <th className="py-2">When</th>
                <th className="py-2">Event</th>
                <th className="py-2">Channel</th>
                <th className="py-2">Recipient</th>
                <th className="py-2">Status</th>
                <th className="py-2">Error</th>
                <th className="py-2">Booking</th>
              </tr>
            </thead>
            <tbody>
              {notifications.map((n) => (
                <tr key={n.id} className="border-b border-gold/10 text-pharaoh-ivory">
                  <td className="py-2 whitespace-nowrap">{new Date(n.created_at).toLocaleString()}</td>
                  <td className="py-2">{n.event}</td>
                  <td className="py-2">{n.channel}</td>
                  <td className="py-2">{n.recipient}</td>
                  <td className="py-2">
                    <span className={`px-2 py-1 rounded text-xs ${statusCls[n.status] ?? 'bg-pharaoh-blue/40'}`}>
                      {n.status}
                    </span>
                  </td>
                  <td className="py-2 text-red-300 text-xs max-w-[240px] truncate" title={n.error ?? ''}>
                    {n.error ?? '-'}
                  </td>
                  <td className="py-2 text-xs text-pharaoh-ivory/60">{n.related_booking_id ?? '-'}</td>
                </tr>
              ))}
              {notifications.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-4 text-pharaoh-ivory/50">
                    No notification log entries yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-gold border-b border-gold/30">
                <th className="py-2">When</th>
                <th className="py-2">Admin</th>
                <th className="py-2">Action</th>
                <th className="py-2">Entity</th>
                <th className="py-2">Details</th>
              </tr>
            </thead>
            <tbody>
              {activities.map((a) => (
                <tr key={a.id} className="border-b border-gold/10 text-pharaoh-ivory">
                  <td className="py-2 whitespace-nowrap">{new Date(a.created_at).toLocaleString()}</td>
                  <td className="py-2">{a.admin_email ?? '(system)'}</td>
                  <td className="py-2">
                    <span className="px-2 py-1 rounded text-xs bg-blue-600/30 text-blue-300">{a.action}</span>
                  </td>
                  <td className="py-2">
                    {a.entity}
                    {a.entity_id && <span className="block text-xs text-pharaoh-ivory/50">{a.entity_id}</span>}
                  </td>
                  <td className="py-2 text-xs text-pharaoh-ivory/70 max-w-[300px]">
                    {a.details ? JSON.stringify(a.details) : '-'}
                  </td>
                </tr>
              ))}
              {activities.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-4 text-pharaoh-ivory/50">
                    No activity log entries yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
