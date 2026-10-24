'use client';

import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { logActivity } from '@/lib/admin-activity';

const LOCALES = ['en', 'ar', 'ru', 'de'] as const;
const DOCS = [
  { key: 'terms_document', title: 'Terms & Conditions' },
  { key: 'privacy_document', title: 'Privacy Policy' },
] as const;

const inputCls = 'bg-pharaoh-bg border border-gold/30 rounded px-3 py-2 text-pharaoh-ivory';

async function readDoc(key: string): Promise<Record<string, string>> {
  const { data } = await supabase.from('settings').select('value').eq('key', key).maybeSingle();
  const raw = (data?.value ?? {}) as Record<string, string>;
  const out: Record<string, string> = {};
  LOCALES.forEach((l) => {
    out[l] = typeof raw[l] === 'string' ? raw[l] : '';
  });
  return out;
}

export default function DocumentsManager() {
  const [docs, setDocs] = useState<Record<string, Record<string, string>>>({
    terms_document: { en: '', ar: '', ru: '', de: '' },
    privacy_document: { en: '', ar: '', ru: '', de: '' },
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState('');
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const flash = (msg: string) => {
    setSaved(msg);
    setTimeout(() => setSaved(''), 2500);
  };

  const load = async () => {
    const [terms, privacy] = await Promise.all([readDoc('terms_document'), readDoc('privacy_document')]);
    setDocs({ terms_document: terms, privacy_document: privacy });
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const setDoc = (docKey: string, locale: string, value: string) => {
    setDocs((prev) => ({ ...prev, [docKey]: { ...prev[docKey], [locale]: value } }));
  };

  const handleFile = async (docKey: string, locale: string, file: File | null) => {
    if (!file) return;
    const text = await file.text();
    setDoc(docKey, locale, text.trim());
  };

  const handleSave = async (docKey: string) => {
    setSaving(docKey);
    const { error } = await supabase
      .from('settings')
      .upsert({ key: docKey, value: docs[docKey] }, { onConflict: 'key' });
    if (error) flash(`Error: ${error.message}`);
    else {
      await logActivity('update_document', 'settings', null, { document: docKey });
      flash('Document saved');
    }
    setSaving(null);
  };

  if (loading) return <p className="text-pharaoh-ivory/60">Loading...</p>;

  return (
    <div className="space-y-8">
      {saved && <p className="text-green-300 text-sm">{saved}</p>}
      {DOCS.map((d) => (
        <div key={d.key} className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-cinzel text-gold">{d.title}</h3>
            <button
              onClick={() => handleSave(d.key)}
              disabled={saving === d.key}
              className="px-6 py-2 bg-gold text-black font-semibold rounded hover:bg-gold-light transition-colors disabled:opacity-50"
            >
              {saving === d.key ? 'Saving...' : `Save ${d.title}`}
            </button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {LOCALES.map((locale) => (
              <div key={locale} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gold uppercase text-sm font-semibold">{locale}</span>
                  <label className={`${inputCls} cursor-pointer text-sm py-1 px-3`}>
                    Upload .txt / .md
                    <input
                      ref={(el) => {
                        fileRefs.current[`${d.key}_${locale}`] = el;
                      }}
                      type="file"
                      accept=".txt,.md,.markdown,text/plain,text/markdown"
                      className="hidden"
                      onChange={async (e) => {
                        await handleFile(d.key, locale, e.target.files?.[0] ?? null);
                        if (e.target) e.target.value = '';
                      }}
                    />
                  </label>
                </div>
                <textarea
                  value={docs[d.key]?.[locale] ?? ''}
                  onChange={(e) => setDoc(d.key, locale, e.target.value)}
                  placeholder={`${d.title} (${locale}) — paste text or upload a file above...`}
                  className={`${inputCls} w-full min-h-[180px] font-mono text-xs whitespace-pre-wrap`}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
      <p className="text-pharaoh-ivory/50 text-xs">
        Documents are shown on /terms and /privacy pages. If a locale is empty, the English version is used as fallback.
      </p>
    </div>
  );
}
