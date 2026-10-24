'use client';

import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { uploadSiteImage, logActivity } from '@/lib/admin-activity';

interface Car {
  id: string;
  name: { en?: string; ar?: string } | string;
  description: { en?: string; ar?: string } | null;
  images: string[] | null;
  max_passengers: number;
  max_luggage: number;
  active: boolean;
}

const inputCls = 'bg-pharaoh-bg border border-gold/30 rounded px-3 py-2 text-pharaoh-ivory';

export default function CarsManager() {
  const [cars, setCars] = useState<Car[]>([]);
  const [imgFile, setImgFile] = useState<File | null>(null);
  const [editing, setEditing] = useState<Car | null>(null);
  const [form, setForm] = useState({
    id: '',
    nameEn: '',
    nameAr: '',
    passengers: 4,
    luggage: 2,
    active: true,
    newImage: '' as string,
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    const { data } = await supabase.from('cars').select('*').order('created_at', { ascending: false });
    setCars((data as Car[]) ?? []);
  };

  useEffect(() => {
    load();
  }, []);

  const flash = (msg: string) => {
    setSaved(msg);
    setTimeout(() => setSaved(''), 2500);
  };

  const resetForm = () => {
    setForm({ id: '', nameEn: '', nameAr: '', passengers: 4, luggage: 2, active: true, newImage: '' });
    setEditing(null);
    if (fileRef.current) fileRef.current.value = '';
    setImgFile(null);
  };

  const startEdit = (car: Car) => {
    setEditing(car);
    setForm({
      id: car.id,
      nameEn: typeof car.name === 'string' ? car.name : car.name?.en ?? '',
      nameAr: typeof car.name === 'string' ? '' : car.name?.ar ?? '',
      passengers: car.max_passengers,
      luggage: car.max_luggage,
      active: car.active,
      newImage: '',
    });
  };

  const uploadImage = async (file: File): Promise<string> => {
    const url = await uploadSiteImage(file);
    await logActivity('upload_image', 'car', editing?.id ?? null, { car: editing?.name });
    return url;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nameEn) return;
    setLoading(true);
    let imageUrls = editing?.images ?? [];
    if (imgFile) {
      try {
        imageUrls = [...(imageUrls ?? []), await uploadImage(imgFile)];
      } catch (err: any) {
        flash(`Upload failed: ${err.message ?? 'unknown error'}`);
        setLoading(false);
        return;
      }
    }

    let error: any = null;
    if (editing) {
      const { error: upErr } = await supabase
        .from('cars')
        .update({
          name: { en: form.nameEn, ar: form.nameAr },
          max_passengers: form.passengers,
          max_luggage: form.luggage,
          active: form.active,
          images: imageUrls,
        })
        .eq('id', editing.id);
      error = upErr;
      if (!error) {
        await logActivity('update_car', 'car', editing.id, { nameEn: form.nameEn });
        flash('Car updated');
      }
    } else {
      const { error: insErr } = await supabase.from('cars').insert({
        name: { en: form.nameEn, ar: form.nameAr },
        max_passengers: form.passengers,
        max_luggage: form.luggage,
        active: form.active,
        images: imageUrls.length ? imageUrls : null,
      });
      error = insErr;
      if (!error) {
        await logActivity('create_car', 'car', null, { nameEn: form.nameEn });
        flash('Car added');
      }
    }
    if (error) flash(`Error: ${error.message}`);
    resetForm();
    await load();
    setLoading(false);
  };

  const removeImage = async (car: Car, url: string) => {
    await supabase.from('cars').update({ images: (car.images ?? []).filter((u) => u !== url) }).eq('id', car.id);
    await logActivity('update_car', 'car', car.id, { removedImage: url });
    await load();
  };

  const handleDelete = async (car: Car) => {
    if (!confirm('Delete this car? This cannot be undone.')) return;
    await supabase.from('cars').delete().eq('id', car.id);
    await logActivity('delete_car', 'car', car.id, { nameEn: typeof car.name === 'string' ? car.name : car.name?.en });
    flash('Car deleted');
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
          type="number"
          value={form.passengers}
          onChange={(e) => setForm({ ...form, passengers: Number(e.target.value) })}
          placeholder="Passengers"
          className={inputCls}
        />
        <input
          type="number"
          value={form.luggage}
          onChange={(e) => setForm({ ...form, luggage: Number(e.target.value) })}
          placeholder="Luggage"
          className={inputCls}
        />
        <label className={`${inputCls} cursor-pointer flex items-center gap-2 text-sm`}>
          <span className="truncate max-w-[120px]">{imgFile ? imgFile.name : 'Image (optional)'}</span>
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
          {loading ? 'Saving...' : editing ? 'Update Car' : 'Add Car'}
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
        {cars.map((car) => (
          <li key={car.id} className="text-pharaoh-ivory border-b border-gold/10 pb-3">
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-3 min-w-0">
                {car.images?.[0] && (
                  <img src={car.images[0]} alt="" className="w-12 h-12 object-cover rounded" />
                )}
                <span className="truncate">
                  {typeof car.name === 'string' ? car.name : car.name?.en ?? car.id}
                </span>
              </span>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-pharaoh-ivory/60 text-sm">
                  {car.max_passengers} pax / {car.max_luggage} bags
                </span>
                <button
                  onClick={() => startEdit(car)}
                  className="px-3 py-1 rounded text-sm bg-blue-600/30 text-blue-300"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(car)}
                  className="px-3 py-1 rounded text-sm bg-red-600/30 text-red-300"
                >
                  Delete
                </button>
                <span
                  className={`px-3 py-1 rounded text-sm ${car.active ? 'bg-green-600/30 text-green-300' : 'bg-red-600/30 text-red-300'}`}
                >
                  {car.active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
            {car.images && car.images.length > 0 && (
              <div className="flex gap-2 mt-2 flex-wrap">
                {car.images.map((url, i) => (
                  <div key={i} className="relative group">
                    <img src={url} alt="" className="w-16 h-16 object-cover rounded" />
                    <button
                      onClick={() => removeImage(car, url)}
                      className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full w-5 h-5 text-xs leading-none opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Remove image"
                    >
                      x
                    </button>
                  </div>
                ))}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
