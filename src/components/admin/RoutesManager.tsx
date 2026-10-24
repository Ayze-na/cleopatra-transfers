'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { logActivity } from '@/lib/admin-activity';

interface Location {
  id: string;
  name: { en?: string } | string;
}

interface Route {
  id: string;
  from_location_id: string;
  to_location_id: string;
  active: boolean;
}

export default function RoutesManager() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [fromId, setFromId] = useState('');
  const [toId, setToId] = useState('');
  const [reverse, setReverse] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState('');

  const load = async () => {
    const [{ data: locs }, { data: rts }] = await Promise.all([
      supabase.from('locations').select('id,name').order('sort_order', { ascending: true }),
      supabase.from('routes').select('*').order('created_at', { ascending: false }),
    ]);
    setLocations((locs as Location[]) ?? []);
    setRoutes((rts as Route[]) ?? []);
  };

  useEffect(() => {
    load();
  }, []);

  const nameOf = (id: string) => {
    const loc = locations.find((l) => l.id === id);
    if (!loc) return id;
    return typeof loc.name === 'string' ? loc.name : loc.name?.en ?? id;
  };

  const flash = (msg: string) => {
    setSaved(msg);
    setTimeout(() => setSaved(''), 2500);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromId || !toId) return;
    setLoading(true);
    const { error } = await supabase
      .from('routes')
      .insert(
        reverse
          ? [
              { from_location_id: fromId, to_location_id: toId, active: true },
              { from_location_id: toId, to_location_id: fromId, active: true },
            ]
          : [{ from_location_id: fromId, to_location_id: toId, active: true }]
      );
    if (error) flash(`Error: ${error.message}`);
    else {
      await logActivity('create_route', 'route', null, { from: nameOf(fromId), to: nameOf(toId), reverse });
      flash('Route added');
    }
    setFromId('');
    setToId('');
    setReverse(false);
    await load();
    setLoading(false);
  };

  const handleDelete = async (route: Route) => {
    if (!confirm('Delete this route? Its prices will be removed too.')) return;
    await supabase.from('routes').delete().eq('id', route.id);
    await logActivity('delete_route', 'route', route.id, {
      from: nameOf(route.from_location_id),
      to: nameOf(route.to_location_id),
    });
    flash('Route deleted');
    await load();
  };

  const toggleActive = async (route: Route) => {
    await supabase.from('routes').update({ active: !route.active }).eq('id', route.id);
    await logActivity('toggle_route', 'route', route.id);
    await load();
  };

  return (
    <div className="space-y-6">
      {saved && <p className="text-green-300 text-sm">{saved}</p>}
      <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
        <select
          value={fromId}
          onChange={(e) => setFromId(e.target.value)}
          className="bg-pharaoh-bg border border-gold/30 rounded px-3 py-2 text-pharaoh-ivory"
          required
        >
          <option value="">From</option>
          {locations.map((l) => (
            <option key={l.id} value={l.id}>
              {typeof l.name === 'string' ? l.name : l.name?.en ?? l.id}
            </option>
          ))}
        </select>
        <select
          value={toId}
          onChange={(e) => setToId(e.target.value)}
          className="bg-pharaoh-bg border border-gold/30 rounded px-3 py-2 text-pharaoh-ivory"
          required
        >
          <option value="">To</option>
          {locations.map((l) => (
            <option key={l.id} value={l.id}>
              {typeof l.name === 'string' ? l.name : l.name?.en ?? l.id}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-pharaoh-ivory text-sm">
          <input type="checkbox" checked={reverse} onChange={(e) => setReverse(e.target.checked)} />
          Create reverse
        </label>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-gold text-black font-semibold rounded hover:bg-gold-light transition-colors disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Add Route'}
        </button>
      </form>
      <ul className="space-y-2">
        {routes.map((r) => (
          <li key={r.id} className="flex items-center justify-between text-pharaoh-ivory border-b border-gold/10 pb-2">
            <span>
              {nameOf(r.from_location_id)} → {nameOf(r.to_location_id)}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleDelete(r)}
                className="px-3 py-1 rounded text-sm bg-red-600/30 text-red-300"
              >
                Delete
              </button>
              <button
                onClick={() => toggleActive(r)}
                className={`px-3 py-1 rounded text-sm ${r.active ? 'bg-green-600/30 text-green-300' : 'bg-red-600/30 text-red-300'}`}
              >
                {r.active ? 'Active' : 'Inactive'}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
