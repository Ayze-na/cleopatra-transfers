'use client';

import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { uploadSiteImage, logActivity } from '@/lib/admin-activity';

interface City {
  id: string;
  name: { en?: string; ar?: string } | string;
  description: { en?: string; ar?: string } | null;
  cover_image: string | null;
  active: boolean;
  sort_order: number;
}

const inputCls = 'bg-pharaoh-bg border border-gold/30 rounded px-3 py-2 text-pharaoh-ivory';

export default function CitiesManager() {
  const [cities, setCities] = useState<City[]>([]);
  const [imgFile, setImgFile] = useState<File | null>(null);
  const [editing, setEditing] = useState<City | null>(null);
  const [form, setForm] = useState({
    id: '',
    nameEn: '',
    nameAr: '',
    descEn: '',
    active: true,
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    const { data } = await supabase.from('cities').select('*').order('sort_order', { ascending: true });
    setCities((data as City[]) ?? []);
  };

  useEffect(() => {
    load();
  }, []);

  const flash = (msg: string) => {
    setSaved(msg);
    setTimeout(() => setSaved(''), 2500);
  };

  const resetForm = () => {
    setForm({ id: '', nameEn: '', nameAr: '', descEn: '', active: true });
    setEditing(null);
    if (fileRef.current) fileRef.current.value = '';
    setImgFile(null);
  };

  const startEdit = (city: City) => {
    setEditing(city);
    setForm({
      id: city.id,
      nameEn: typeof city.name === 'string' ? city.name : city.name?.en ?? '',
      nameAr: typeof city.name === 'string' ? '' : city.name?.ar ?? '',
      descEn: city.description && typeof city.description !== 'string' ? (city.description as any).en ?? '' : '',
      active: city.active,
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nameEn) return;
    setLoading(true);
    let coverImage = editing?.cover_image ?? null;
    if (imgFile) {
      try {
        coverImage = await uploadSiteImage(imgFile);
        await logActivity('upload_image', 'city', editing?.id ?? null, { nameEn: form.nameEn });
      } catch (err: any) {
        flash(`Upload failed: ${err.message ?? 'unknown error'}`);
        setLoading(false);
        return;
      }
    }

    let error: any = null;
    if (editing) {
      const { error: upErr } = await supabase
        .from('cities')
        .update({
          name: { en: form.nameEn, ar: form.nameAr },
          description: { en: form.descEn, ar: '' },
          cover_image: coverImage,
          active: form.active,
        })
        .eq('id', editing.id);
      error = upErr;
      if (!error) {
        await logActivity('update_city', 'city', editing.id, { nameEn: form.nameEn });
        flash('City updated');
      }
    } else {
      const { error: insErr } = await supabase.from('cities').insert({
        name: { en: form.nameEn, ar: form.nameAr },
        description: { en: form.descEn, ar: '' },
        cover_image: coverImage,
        active: form.active,
        sort_order: cities.length,
      });
      error = insErr;
      if (!error) {
        await logActivity('create_city', 'city', null, { nameEn: form.nameEn });
        flash('City added');
      }
    }
    if (error) flash(`Error: ${error.message}`);
    resetForm();
    await load();
    setLoading(false);
  };

  const removeCover = async (city: City) => {
    await supabase.from('cities').update({ cover_image: null }).eq('id', city.id);
    await logActivity('update_city', 'city', city.id, { removedCover: true });
    await load();
  };

  const handleDelete = async (city: City) => {
    if (!confirm('Delete this city? Places in this city will also be removed.')) return;
    await supabase.from('cities').delete().eq('id', city.id);
    await logActivity('delete_city', 'city', city.id, { nameEn: typeof city.name === 'string' ? city.name : city.name?.en });
    flash('City deleted');
    await load();
  };

  return (
    <div className="space-y-6">
      {saved && <p className="text-green-300 text-sm">{saved}</p>}
      <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
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
          <span className="truncate max-w-[110px]">{imgFile ? imgFile.name : 'Cover image (optional)'}</span>
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
          {loading ? 'Saving...' : editing ? 'Update City' : 'Add City'}
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
        {cities.map((city) => (
          <li key={city.id} className="text-pharaoh-ivory border-b border-gold/10 pb-3">
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-3 min-w-0">
                {city.cover_image && (
                  <img src={city.cover_image} alt="" className="w-12 h-12 object-cover rounded" />
                )}
                <span className="truncate">
                  {typeof city.name === 'string' ? city.name : city.name?.en ?? city.id}
                </span>
              </span>
              <div className="flex items-center gap-2 flex-shrink-0">
                {city.cover_image && (
                  <button
                    onClick={() => removeCover(city)}
                    className="px-3 py-1 rounded text-sm bg-yellow-600/30 text-yellow-300"
                  >
                    Remove img
                  </button>
                )}
                <button
                  onClick={() => startEdit(city)}
                  className="px-3 py-1 rounded text-sm bg-blue-600/30 text-blue-300"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(city)}
                  className="px-3 py-1 rounded text-sm bg-red-600/30 text-red-300"
                >
                  Delete
                </button>
                <button
                  onClick={async () => {
                    await supabase.from('cities').update({ active: !city.active }).eq('id', city.id);
                    await logActivity('toggle_city', 'city', city.id);
                    await load();
                  }}
                  className={`px-3 py-1 rounded text-sm ${city.active ? 'bg-green-600/30 text-green-300' : 'bg-red-600/30 text-red-300'}`}
                >
                  {city.active ? 'Active' : 'Inactive'}
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
