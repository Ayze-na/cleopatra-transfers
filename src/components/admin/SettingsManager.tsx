'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

interface Setting {
  key: string;
  value: any;
}

export default function SettingsManager() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [key, setKey] = useState('');
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const { data } = await supabase.from('settings').select('*');
    setSettings((data as Setting[]) ?? []);
  };

  useEffect(() => {
    load();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!key) return;
    setLoading(true);
    let parsed: any = value;
    try {
      parsed = JSON.parse(value);
    } catch {
      // keep as string
    }
    await supabase.from('settings').upsert({ key, value: parsed }, { onConflict: 'key' });
    setKey('');
    setValue('');
    await load();
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSave} className="space-y-3">
        <input
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="Setting key (e.g. admin_whatsapp)"
          className="w-full bg-pharaoh-bg border border-gold/30 rounded px-3 py-2 text-pharaoh-ivory"
          required
        />
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder='Value (string or JSON)'
          className="w-full bg-pharaoh-bg border border-gold/30 rounded px-3 py-2 text-pharaoh-ivory min-h-[100px]"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-gold text-black font-semibold rounded hover:bg-gold-light transition-colors disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Setting'}
        </button>
      </form>
      <ul className="space-y-2">
        {settings.map((s) => (
          <li key={s.key} className="text-pharaoh-ivory border-b border-gold/10 pb-2">
            <div className="font-semibold text-gold">{s.key}</div>
            <pre className="text-xs text-pharaoh-ivory/70 whitespace-pre-wrap">
              {typeof s.value === 'string' ? s.value : JSON.stringify(s.value, null, 2)}
            </pre>
          </li>
        ))}
      </ul>
    </div>
  );
}
