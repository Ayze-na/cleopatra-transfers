'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { logActivity } from '@/lib/admin-activity';

interface Location {
  id: string;
  name: { en?: string; ar?: string } | string;
  type: string;
  active: boolean;
  sort_order: number;
}

const TYPES = ['airport', 'city', 'hotel_area', 'site'];
const inputCls = 'bg-pharaoh-bg border border-gold/30 rounded px-3 py-2 text-pharaoh-ivory';

export default function LocationsManager() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [editing, setEditing] = useState<Location | null>(null);
  const [form, setForm] = useState({ nameEn: '', nameAr: '', type: 'city', active: true });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState('');

  const load = async () => {
    const { data } = await supabase.from('locations').select('*').order('sort_order', { ascending: true });
    setLocations((data as Location[]) ?? []);
  };

  useEffect(() => {
    load();
  }, []);

  const flash = (msg: string) => {
    setSaved(msg);
    setTimeout(() => setSaved(''), 2500);
  };

  const resetForm = () => {
    setForm({ nameEn: '', nameAr: '', type: 'city', active: true });
    setEditing(null);
  };

  const startEdit = (loc: Location) => {
    setEditing(loc);
    setForm({
      nameEn: typeof loc.name === 'string' ? loc.name : loc.name?.en ?? '',
      nameAr: typeof loc.name === 'string' ? '' : loc.name?.ar ?? '',
      type: loc.type,
      active: loc.active,
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nameEn) return;
    setLoading(true);
    let error: any = null;
    if (editing) {
      const { error: upErr } = await supabase
        .from('locations')
        .update({ name: { en: form.nameEn, ar: form.nameAr }, type: form.type, active: form.active })
        .eq('id', editing.id);
      error = upErr;
      if (!error) {
        await logActivity('update_location', 'location', editing.id, { nameEn: form.nameEn });
        flash('Location updated');
      }
    } else {
      const { error: insErr } = await supabase
        .from('locations')
        .insert({ name: { en: form.nameEn, ar: form.nameAr }, type: form.type, active: form.active, sort_order: locations.length });
      error = insErr;
      if (!error) {
        await logActivity('create_location', 'location', null, { nameEn: form.nameEn });
        flash('Location added');
      }
    }
    if (error) flash(`Error: ${error.message}`);
    resetForm();
    await load();
    setLoading(false);
  };

  const handleDelete = async (loc: Location) => {
    const inUse = ['airport', 'city', 'hotel_area', 'site'].includes(loc.type);
    if (
      !confirm(
        `Delete this location?${inUse ? ' Routes pointing to it will also be removed.' : ''} This cannot be undone.`
      )
    )
      return;
    await supabase.from('locations').delete().eq('id', loc.id);
    await logActivity('delete_location', 'location', loc.id, {
      nameEn: typeof loc.name === 'string' ? loc.name : loc.name?.en,
    });
    flash('Location deleted');
    await load();
  };

  return (
    <div className="space-y-6">
      {saved && <p className="text-green-300 text-sm">{saved}</p>}
      <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
        <input
          value={form.nameEn}
          onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
          placeholder="Name (EN)"
          className={inputCls}
          required
        />
        <input
          value={form.nameAr}
          onChange={(e) => setForm({ ...form, nameAr: e.target.value })}
          placeholder="Name (AR)"
          className={inputCls}
        />
        <select
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value })}
          className={inputCls}
        >
          {TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-pharaoh-ivory text-sm">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
            />
            Active
          </label>
          {editing && (
            <button type="button" onClick={resetForm} className="text-pharaoh-ivory/60 text-sm underline">
              Cancel
            </button>
          )}
        </div>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-gold text-black font-semibold rounded hover:bg-gold-light transition-colors disabled:opacity-50"
        >
          {loading ? 'Saving...' : editing ? 'Update Location' : 'Add Location'}
        </button>
      </form>

      <ul className="space-y-2">
        {locations.map((loc) => (
          <li key={loc.id} className="flex items-center justify-between text-pharaoh-ivory border-b border-gold/10 pb-2">
            <span>
              {typeof loc.name === 'string' ? loc.name : loc.name?.en ?? loc.id}
              <span className="ml-2 text-pharaoh-ivory/50 text-xs">({loc.type})</span>
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => startEdit(loc)}
                className="px-3 py-1 rounded text-sm bg-blue-600/30 text-blue-300"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(loc)}
                className="px-3 py-1 rounded text-sm bg-red-600/30 text-red-300"
              >
                Delete
              </button>
              <button
                onClick={async () => {
                  await supabase.from('locations').update({ active: !loc.active }).eq('id', loc.id);
                  await logActivity('toggle_location', 'location', loc.id);
                  await load();
                }}
                className={`px-3 py-1 rounded text-sm ${loc.active ? 'bg-green-600/30 text-green-300' : 'bg-red-600/30 text-red-300'}`}
              >
                {loc.active ? 'Active' : 'Inactive'}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
