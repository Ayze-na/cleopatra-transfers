'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { logActivity } from '@/lib/admin-activity';

interface ContactSettings {
  whatsapp_number: string;
  contact_email: string;
  contact_phone: string;
}

const FIELDS: { key: keyof ContactSettings; label: string; placeholder: string }[] = [
  { key: 'whatsapp_number', label: 'WhatsApp number (with country code, digits only)', placeholder: '201000000000' },
  { key: 'contact_email', label: 'Contact email', placeholder: 'bookings@example.com' },
  { key: 'contact_phone', label: 'Contact phone (displayed)', placeholder: '+20 10 0000 0000' },
];

const inputCls = 'bg-pharaoh-bg border border-gold/30 rounded px-3 py-2 text-pharaoh-ivory';

export default function ContactSettingsManager() {
  const [form, setForm] = useState<ContactSettings>({ whatsapp_number: '', contact_email: '', contact_phone: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState('');

  const flash = (msg: string) => {
    setSaved(msg);
    setTimeout(() => setSaved(''), 2500);
  };

  const load = async () => {
    const { data } = await supabase
      .from('settings')
      .select('key,value')
      .in('key', ['whatsapp_number', 'contact_email', 'contact_phone']);
    const next: ContactSettings = { whatsapp_number: '', contact_email: '', contact_phone: '' };
    (data ?? []).forEach((s: any) => {
      const v = typeof s.value === 'string' ? s.value : (s.value as any)?.[s.key] ?? '';
      (next as any)[s.key] = typeof v === 'string' ? v : '';
    });
    setForm(next);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    let error: any = null;
    for (const f of FIELDS) {
      const { error: upErr } = await supabase
        .from('settings')
        .upsert({ key: f.key, value: form[f.key] }, { onConflict: 'key' });
      if (upErr && !error) error = upErr;
    }
    if (error) flash(`Error: ${error.message}`);
    else {
      await logActivity('update_contact_settings', 'settings', null, { ...form });
      flash('Contact settings saved');
    }
    setSaving(false);
    await load();
  };

  if (loading) return <p className="text-pharaoh-ivory/60">Loading...</p>;

  return (
    <form onSubmit={handleSave} className="space-y-4 max-w-2xl">
      {saved && <p className="text-green-300 text-sm">{saved}</p>}
      {FIELDS.map((f) => (
        <div key={f.key}>
          <label className="block text-pharaoh-ivory/80 text-sm mb-1">{f.label}</label>
          <input
            value={form[f.key]}
            onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
            placeholder={f.placeholder}
            className={`${inputCls} w-full`}
          />
        </div>
      ))}
      <button
        type="submit"
        disabled={saving}
        className="px-6 py-2 bg-gold text-black font-semibold rounded hover:bg-gold-light transition-colors disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Save Contact Settings'}
      </button>
      <p className="text-pharaoh-ivory/50 text-xs">
        The WhatsApp number is used on the floating button, header, home page and contact page.
      </p>
    </form>
  );
}
