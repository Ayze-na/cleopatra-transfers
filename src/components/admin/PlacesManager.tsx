'use client';

import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { uploadSiteImage, logActivity } from '@/lib/admin-activity';

interface City {
  id: string;
  name: { en?: string } | string;
}

interface Place {
  id: string;
  city_id: string;
  name: { en?: string; ar?: string } | string;
  description: { en?: string; ar?: string } | null;
  image: string | null;
  active: boolean;
  sort_order: number;
}

const inputCls = 'bg-pharaoh-bg border border-gold/30 rounded px-3 py-2 text-pharaoh-ivory';

export default function PlacesManager() {
  const [cities, setCities] = useState<City[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [imgFile, setImgFile] = useState<File | null>(null);
  const [editing, setEditing] = useState<Place | null>(null);
  const [form, setForm] = useState({
    cityId: '',
    nameEn: '',
    nameAr: '',
    descEn: '',
    active: true,
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    const [{ data: cs }, { data: ps }] = await Promise.all([
      supabase.from('cities').select('id,name').order('sort_order', { ascending: true }),
      supabase.from('places').select('*').order('sort_order', { ascending: true }),
    ]);
    setCities((cs as City[]) ?? []);
    setPlaces((ps as Place[]) ?? []);
    if (!form.cityId && cs && cs.length) setForm((f) => ({ ...f, cityId: cs[0].id }));
  };

  useEffect(() => {
    load();
  }, []);

  const nameOfCity = (id: string) => {
    const c = cities.find((x) => x.id === id);
    if (!c) return id;
    return typeof c.name === 'string' ? c.name : c.name?.en ?? id;
  };

  const flash = (msg: string) => {
    setSaved(msg);
    setTimeout(() => setSaved(''), 2500);
  };

  const resetForm = () => {
    setForm({
      cityId: cities[0]?.id ?? '',
      nameEn: '',
      nameAr: '',
      descEn: '',
      active: true,
    });
    setEditing(null);
    if (fileRef.current) fileRef.current.value = '';
    setImgFile(null);
  };

  const startEdit = (place: Place) => {
    setEditing(place);
    setForm({
      cityId: place.city_id,
      nameEn: typeof place.name === 'string' ? place.name : place.name?.en ?? '',
      nameAr: typeof place.name === 'string' ? '' : place.name?.ar ?? '',
      descEn: place.description && typeof place.description !== 'string' ? (place.description as any).en ?? '' : '',
      active: place.active,
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.cityId || !form.nameEn) return;
    setLoading(true);
    let image = editing?.image ?? null;
    if (imgFile) {
      try {
        image = await uploadSiteImage(imgFile);
        await logActivity('upload_image', 'place', editing?.id ?? null, { nameEn: form.nameEn });
      } catch (err: any) {
        flash(`Upload failed: ${err.message ?? 'unknown error'}`);
        setLoading(false);
        return;
      }
    }

    let error: any = null;
    if (editing) {
      const { error: upErr } = await supabase
        .from('places')
        .update({
          city_id: form.cityId,
          name: { en: form.nameEn, ar: form.nameAr },
          description: { en: form.descEn, ar: '' },
          image,
          active: form.active,
        })
        .eq('id', editing.id);
      error = upErr;
      if (!error) {
        await logActivity('update_place', 'place', editing.id, { nameEn: form.nameEn });
        flash('Place updated');
      }
    } else {
      const { error: insErr } = await supabase.from('places').insert({
        city_id: form.cityId,
        name: { en: form.nameEn, ar: form.nameAr },
        description: { en: form.descEn, ar: '' },
        image,
        active: form.active,
        sort_order: places.filter((p) => p.city_id === form.cityId).length,
      });
      error = insErr;
      if (!error) {
        await logActivity('create_place', 'place', null, { nameEn: form.nameEn });
        flash('Place added');
      }
    }
    if (error) flash(`Error: ${error.message}`);
    resetForm();
    await load();
    setLoading(false);
  };

  const removeImage = async (place: Place) => {
    await supabase.from('places').update({ image: null }).eq('id', place.id);
    await logActivity('update_place', 'place', place.id, { removedImage: true });
    await load();
  };

  const handleDelete = async (place: Place) => {
    if (!confirm('Delete this place? This cannot be undone.')) return;
    await supabase.from('places').delete().eq('id', place.id);
    await logActivity('delete_place', 'place', place.id, { nameEn: typeof place.name === 'string' ? place.name : place.name?.en });
    flash('Place deleted');
    await load();
  };

  return (
    <div className="space-y-6">
      {saved && <p className="text-green-300 text-sm">{saved}</p>}
      <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
        <select
          value={form.cityId}
          onChange={(e) => setForm({ ...form, cityId: e.target.value })}
          className={inputCls}
          required
        >
          {cities.map((c) => (
            <option key={c.id} value={c.id}>
              {typeof c.name === 'string' ? c.name : c.name?.en ?? c.id}
            </option>
          ))}
        </select>
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
        <input
          value={form.descEn}
          onChange={(e) => setForm({ ...form, descEn: e.target.value })}
          placeholder="Description (EN)"
          className={inputCls}
        />
        <label className={`${inputCls} cursor-pointer flex items-center gap-2 text-sm`}>
          <span className="truncate max-w-[100px]">{imgFile ? imgFile.name : 'Image (optional)'}</span>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => setImgFile(e.target.files?.[0] ?? null)}
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-gold text-black font-semibold rounded hover:bg-gold-light transition-colors disabled:opacity-50"
        >
          {loading ? 'Saving...' : editing ? 'Update Place' : 'Add Place'}
        </button>
        <div className="md:col-span-6 flex items-center gap-4">
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
              Cancel edit
            </button>
          )}
        </div>
      </form>

      <ul className="space-y-3">
        {places.map((p) => (
          <li key={p.id} className="text-pharaoh-ivory border-b border-gold/10 pb-3">
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-3 min-w-0">
                {p.image && <img src={p.image} alt="" className="w-12 h-12 object-cover rounded" />}
                <span className="truncate">
                  {typeof p.name === 'string' ? p.name : p.name?.en ?? p.id}
                  <span className="ml-2 text-pharaoh-ivory/50 text-xs">({nameOfCity(p.city_id)})</span>
                </span>
              </span>
              <div className="flex items-center gap-2 flex-shrink-0">
                {p.image && (
                  <button
                    onClick={() => removeImage(p)}
                    className="px-3 py-1 rounded text-sm bg-yellow-600/30 text-yellow-300"
                  >
                    Remove img
                  </button>
                )}
                <button
                  onClick={() => startEdit(p)}
                  className="px-3 py-1 rounded text-sm bg-blue-600/30 text-blue-300"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(p)}
                  className="px-3 py-1 rounded text-sm bg-red-600/30 text-red-300"
                >
                  Delete
                </button>
                <button
                  onClick={async () => {
                    await supabase.from('places').update({ active: !p.active }).eq('id', p.id);
                    await logActivity('toggle_place', 'place', p.id);
                    await load();
                  }}
                  className={`px-3 py-1 rounded text-sm ${p.active ? 'bg-green-600/30 text-green-300' : 'bg-red-600/30 text-red-300'}`}
                >
                  {p.active ? 'Active' : 'Inactive'}
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
