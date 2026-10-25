'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { logActivity } from '@/lib/admin-activity';

interface PaymentMethod {
  id: string;
  code: string;
  display_name: string;
  details: string | null;
  requires_screenshot: boolean;
  active: boolean;
  sort_order: number;
}

const inputCls = 'bg-pharaoh-bg border border-gold/30 rounded px-3 py-2 text-pharaoh-ivory';
const CODE_RE = /^[a-z0-9_]{2,40}$/;

export default function PaymentMethodsManager() {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [editing, setEditing] = useState<PaymentMethod | null>(null);
  const [form, setForm] = useState({
    code: '',
    displayName: '',
    details: '',
    requiresScreenshot: false,
    active: true,
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState('');
  const [bankDetails, setBankDetails] = useState('');
  const [savingBank, setSavingBank] = useState(false);

  const load = async () => {
    const { data } = await supabase
      .from('payment_methods')
      .select('*')
      .order('sort_order', { ascending: true });
    setMethods((data as PaymentMethod[]) ?? []);
  };

  const loadBankDetails = async () => {
    const { data } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'bank_details')
      .maybeSingle();
    const v = (data as { value: unknown } | null)?.value;
    setBankDetails(typeof v === 'string' ? v : '');
  };

  useEffect(() => {
    load();
    loadBankDetails();
  }, []);

  const flash = (msg: string) => {
    setSaved(msg);
    setTimeout(() => setSaved(''), 2500);
  };

  const resetForm = () => {
    setForm({ code: '', displayName: '', details: '', requiresScreenshot: false, active: true });
    setEditing(null);
  };

  const startEdit = (m: PaymentMethod) => {
    setEditing(m);
    setForm({
      code: m.code,
      displayName: m.display_name,
      details: m.details ?? '',
      requiresScreenshot: m.requires_screenshot,
      active: m.active,
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = form.code.trim().toLowerCase();
    const displayName = form.displayName.trim();
    if (!code || !displayName) return;
    if (!CODE_RE.test(code)) {
      flash('Code must be 2-40 lowercase letters, numbers or underscores.');
      return;
    }
    const clash = methods.find((m) => m.code === code && m.id !== editing?.id);
    if (clash) {
      flash(`Code "${code}" is already used by ${clash.display_name}.`);
      return;
    }
    setLoading(true);
    let error: any = null;
    if (editing) {
      const { error: upErr } = await supabase
        .from('payment_methods')
        .update({
          code,
          display_name: displayName,
          details: form.details.trim() || null,
          requires_screenshot: form.requiresScreenshot,
          active: form.active,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editing.id);
      error = upErr;
      if (!error) {
        await logActivity('update_payment_method', 'payment_method', editing.id, { code });
        flash('Payment method updated');
      }
    } else {
      const { error: insErr } = await supabase
        .from('payment_methods')
        .insert({
          code,
          display_name: displayName,
          details: form.details.trim() || null,
          requires_screenshot: form.requiresScreenshot,
          active: form.active,
          sort_order: methods.length + 1,
        });
      error = insErr;
      if (!error) {
        await logActivity('create_payment_method', 'payment_method', null, { code });
        flash('Payment method added');
      }
    }
    if (error) flash(`Error: ${error.message}`);
    resetForm();
    await load();
    setLoading(false);
  };

  const handleDelete = async (m: PaymentMethod) => {
    if (
      !confirm(
        `Delete "${m.display_name}"? Clients will no longer see it. Existing bookings keep their records.`
      )
    )
      return;
    const { error } = await supabase.from('payment_methods').delete().eq('id', m.id);
    if (error) {
      flash(`Error: ${error.message}`);
      return;
    }
    await logActivity('delete_payment_method', 'payment_method', m.id, { code: m.code });
    flash('Payment method deleted');
    await load();
  };

  const handleSaveBankDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingBank(true);
    const { error } = await supabase
      .from('settings')
      .upsert({ key: 'bank_details', value: bankDetails }, { onConflict: 'key' });
    if (error) {
      flash(`Error: ${error.message}`);
    } else {
      await logActivity('update_bank_details', 'settings', null);
      flash('Bank account details saved');
    }
    setSavingBank(false);
    await loadBankDetails();
  };

  const move = async (m: PaymentMethod, dir: -1 | 1) => {
    const idx = methods.indexOf(m);
    const swap = methods[idx + dir];
    if (!swap) return;
    const ordered = [...methods];
    [ordered[idx], ordered[idx + dir]] = [ordered[idx + dir], ordered[idx]];
    for (const [i, row] of ordered.entries()) {
      await supabase.from('payment_methods').update({ sort_order: i + 1 }).eq('id', row.id);
    }
    await logActivity('reorder_payment_method', 'payment_method', m.id);
    await load();
  };

  return (
    <div className="space-y-6">
      <p className="text-pharaoh-ivory/60 text-sm">
        These options appear in the booking wizard&apos;s payment step. Only active methods are
        shown to clients.
      </p>

      {saved && <p className="text-green-300 text-sm">{saved}</p>}

      <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
        <input
          value={form.code}
          onChange={(e) => setForm({ ...form, code: e.target.value })}
          placeholder="Code (e.g. cash)"
          className={`${inputCls} md:col-span-1`}
          required
          disabled={!!editing}
        />
        <input
          value={form.displayName}
          onChange={(e) => setForm({ ...form, displayName: e.target.value })}
          placeholder="Name shown to client (e.g. Cash)"
          className={`${inputCls} md:col-span-2`}
          required
        />
        <input
          value={form.details}
          onChange={(e) => setForm({ ...form, details: e.target.value })}
          placeholder="Optional note shown to client"
          className={inputCls}
        />
        <label className="flex items-center gap-2 text-pharaoh-ivory text-sm">
          <input
            type="checkbox"
            checked={form.requiresScreenshot}
            onChange={(e) => setForm({ ...form, requiresScreenshot: e.target.checked })}
          />
          Requires proof
        </label>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-gold text-black font-semibold rounded hover:bg-gold-light transition-colors disabled:opacity-50"
        >
          {loading ? 'Saving...' : editing ? 'Update Method' : 'Add Method'}
        </button>

        {editing && (
          <div className="md:col-span-6">
            <button type="button" onClick={resetForm} className="text-pharaoh-ivory/60 text-sm underline">
              Cancel editing
            </button>
          </div>
        )}
      </form>

      <form onSubmit={handleSaveBankDetails} className="space-y-2 max-w-2xl">
        <label className="block text-pharaoh-ivory/80 text-sm">
          Bank account details (account number, bank name, IBAN...)
        </label>
        <textarea
          value={bankDetails}
          onChange={(e) => setBankDetails(e.target.value)}
          placeholder={'Bank name / owner\nAccount number\nIBAN'}
          className={`${inputCls} w-full min-h-[110px] font-mono text-sm`}
        />
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={savingBank}
            className="px-6 py-2 bg-gold text-black font-semibold rounded hover:bg-gold-light transition-colors disabled:opacity-50"
          >
            {savingBank ? 'Saving...' : 'Save Bank Details'}
          </button>
          <p className="text-pharaoh-ivory/50 text-xs">
            Shown to clients in the booking wizard when they pick a method that requires proof of
            payment (bank transfer).
          </p>
        </div>
      </form>

      <ul className="space-y-2">
        {methods.length === 0 && (
          <li className="text-pharaoh-ivory/60 text-sm">No payment methods yet — add one above.</li>
        )}
        {methods.map((m) => (
          <li
            key={m.id}
            className="flex items-center justify-between gap-3 text-pharaoh-ivory border-b border-gold/10 pb-2"
          >
            <div className="min-w-0">
              <div>
                <span className="font-semibold text-gold">{m.display_name}</span>
                <span className="ml-2 text-pharaoh-ivory/50 text-xs font-mono">({m.code})</span>
                <span
                  className={`ml-2 px-2 py-0.5 rounded text-xs font-semibold ${m.active ? 'bg-green-600/20 text-green-300' : 'bg-red-600/20 text-red-300'}`}
                >
                  {m.active ? 'Active' : 'Hidden'}
                </span>
                {m.requires_screenshot && (
                  <span className="ml-2 px-2 py-0.5 rounded text-xs bg-blue-600/20 text-blue-300">
                    Requires screenshot
                  </span>
                )}
              </div>
              {m.details && <p className="text-pharaoh-ivory/60 text-xs mt-1">{m.details}</p>}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={() => move(m, -1)} className="px-2 py-1 rounded text-sm bg-pharaoh-blue/40 text-pharaoh-ivory hover:border-gold/50" title="Move up">
                ↑
              </button>
              <button onClick={() => move(m, 1)} className="px-2 py-1 rounded text-sm bg-pharaoh-blue/40 text-pharaoh-ivory hover:border-gold/50" title="Move down">
                ↓
              </button>
              <button
                onClick={() => startEdit(m)}
                className="px-3 py-1 rounded text-sm bg-blue-600/30 text-blue-300"
              >
                Edit
              </button>
              <button
                onClick={async () => {
                  await supabase.from('payment_methods').update({ active: !m.active }).eq('id', m.id);
                  await logActivity('toggle_payment_method', 'payment_method', m.id, { code: m.code });
                  await load();
                }}
                className={`px-3 py-1 rounded text-sm ${m.active ? 'bg-green-600/30 text-green-300' : 'bg-red-600/30 text-red-300'}`}
              >
                {m.active ? 'Active' : 'Inactive'}
              </button>
              <button
                onClick={() => handleDelete(m)}
                className="px-3 py-1 rounded text-sm bg-red-600/30 text-red-300"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
