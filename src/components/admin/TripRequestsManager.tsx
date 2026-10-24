'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

interface TripRequest {
  id: string;
  reference: string;
  client_name: string;
  start_date: string;
  days: number;
  passengers: number;
  status: string;
  agreed_price?: number | null;
  agreed_currency?: string | null;
  admin_notes?: string | null;
}

export default function TripRequestsManager() {
  const [requests, setRequests] = useState<TripRequest[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('trip_requests').select('*').order('created_at', { ascending: false });
    setRequests((data as TripRequest[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('trip_requests').update({ status }).eq('id', id);
    await load();
  };

  const saveAgreed = async (id: string, price: string, currency: string, notes: string) => {
    await supabase.from('trip_requests').update({
      agreed_price: price ? Number(price) : null,
      agreed_currency: currency || null,
      admin_notes: notes || null,
    }).eq('id', id);
    await load();
  };

  return (
    <div className="space-y-4">
      {loading && <p className="text-pharaoh-ivory/60">Loading...</p>}
      <div className="space-y-4">
        {requests.map((r) => (
          <div key={r.id} className="border border-gold/20 rounded-lg p-4 text-pharaoh-ivory">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-gold">{r.reference}</span>
              <span className="text-sm">{r.client_name}</span>
            </div>
            <div className="text-sm text-pharaoh-ivory/70 mb-3">
              Start: {r.start_date} · {r.days} days · {r.passengers} pax · Status: {r.status}
            </div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {['new', 'contacted', 'confirmed', 'completed', 'cancelled'].map((s) => (
                <button
                  key={s}
                  onClick={() => updateStatus(r.id, s)}
                  className={`px-2 py-1 rounded text-xs ${r.status === s ? 'bg-gold text-black' : 'bg-gold/10 text-gold'}`}
                >
                  {s}
                </button>
              ))}
            </div>
            <AgreedForm request={r} onSave={saveAgreed} />
          </div>
        ))}
      </div>
    </div>
  );
}

function AgreedForm({ request, onSave }: { request: TripRequest; onSave: (id: string, price: string, currency: string, notes: string) => Promise<void> }) {
  const [price, setPrice] = useState(request.agreed_price ? String(request.agreed_price) : '');
  const [currency, setCurrency] = useState(request.agreed_currency ?? 'USD');
  const [notes, setNotes] = useState(request.admin_notes ?? '');
  const [saving, setSaving] = useState(false);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setSaving(true);
        await onSave(request.id, price, currency, notes);
        setSaving(false);
      }}
      className="grid grid-cols-1 md:grid-cols-4 gap-2"
    >
      <input
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        placeholder="Agreed price"
        className="bg-pharaoh-bg border border-gold/30 rounded px-3 py-2 text-pharaoh-ivory"
      />
      <select
        value={currency}
        onChange={(e) => setCurrency(e.target.value)}
        className="bg-pharaoh-bg border border-gold/30 rounded px-3 py-2 text-pharaoh-ivory"
      >
        <option value="USD">USD</option>
        <option value="EGP">EGP</option>
        <option value="EUR">EUR</option>
      </select>
      <input
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Internal notes"
        className="bg-pharaoh-bg border border-gold/30 rounded px-3 py-2 text-pharaoh-ivory"
      />
      <button
        type="submit"
        disabled={saving}
        className="px-4 py-2 bg-gold text-black font-semibold rounded hover:bg-gold-light transition-colors disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Save'}
      </button>
    </form>
  );
}
