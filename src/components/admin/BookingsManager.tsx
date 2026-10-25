'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

interface Booking {
  id: string;
  reference: string;
  client_name: string;
  route_id: string | null;
  car_id: string;
  pickup_name?: string;
  dropoff_name?: string;
  trip_datetime: string;
  price_amount: number | null;
  currency: string;
  payment_method: string;
  payment_status: string;
  status: string;
  passport_file_path?: string;
  payment_screenshot_path?: string;
}

interface Loc { id: string; name: Record<string, string> | string; }
interface Rte { id: string; from_location_id: string; to_location_id: string; }

export default function BookingsManager() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [locs, setLocs] = useState<Loc[]>([]);
  const [rtes, setRtes] = useState<Rte[]>([]);

  const load = async () => {
    setLoading(true);
    const [{ data: b }, { data: l }, { data: r }] = await Promise.all([
      supabase.from('direct_bookings').select('*').order('created_at', { ascending: false }),
      supabase.from('locations').select('id,name'),
      supabase.from('routes').select('id,from_location_id,to_location_id'),
    ]);
    setBookings((b as Booking[]) ?? []);
    setLocs((l as Loc[]) ?? []);
    setRtes((r as Rte[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const locName = (id?: string) => {
    const l = locs.find((x) => x.id === id);
    if (!l) return '';
    return typeof l.name === 'string' ? l.name : (l.name?.en || l.name?.['ar'] || '');
  };

  const routeLabel = (b: Booking) => {
    if (b.route_id) {
      const r = rtes.find((x) => x.id === b.route_id);
      if (r) return `${locName(r.from_location_id)} → ${locName(r.to_location_id)}`;
    }
    return `${b.pickup_name || '—'} → ${b.dropoff_name || '—'}`;
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('direct_bookings').update({ status }).eq('id', id);
    await load();
  };

  const updatePayment = async (id: string, payment_status: string) => {
    await supabase.from('direct_bookings').update({ payment_status }).eq('id', id);
    await load();
  };

  const viewFile = async (bucket: string, path: string) => {
    const { data } = await supabase.storage.from(bucket).createSignedUrl(path, 60);
    if (data?.signedUrl) window.open(data.signedUrl, '_blank');
  };

  return (
    <div className="space-y-4">
      {loading && <p className="text-pharaoh-ivory/60">Loading...</p>}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-pharaoh-ivory">
          <thead>
            <tr className="text-gold border-b border-gold/30">
              <th className="py-2 text-left">Ref</th>
              <th className="py-2 text-left">Client</th>
              <th className="py-2 text-left">Route</th>
              <th className="py-2 text-left">When (Cairo)</th>
              <th className="py-2 text-left">Price</th>
              <th className="py-2 text-left">Payment</th>
              <th className="py-2 text-left">Status</th>
              <th className="py-2 text-left">Files</th>
              <th className="py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((b) => (
              <tr key={b.id} className="border-b border-gold/10">
                <td className="py-2">{b.reference}</td>
                <td className="py-2">{b.client_name}</td>
                <td className="py-2">{routeLabel(b)}</td>
                <td className="py-2">{new Date(b.trip_datetime).toLocaleString('en-GB', { timeZone: 'Africa/Cairo' })}</td>
                <td className="py-2">{b.price_amount != null ? `${b.price_amount} ${b.currency}` : '—'}</td>
                <td className="py-2">{b.payment_method} / {b.payment_status}</td>
                <td className="py-2">{b.status}</td>
                <td className="py-2 space-x-2">
                  {b.passport_file_path && (
                    <button onClick={() => viewFile('passports', b.passport_file_path!)} className="text-gold underline text-xs">
                      Passport
                    </button>
                  )}
                  {b.payment_screenshot_path && (
                    <button onClick={() => viewFile('payment-screenshots', b.payment_screenshot_path!)} className="text-gold underline text-xs">
                      Payment
                    </button>
                  )}
                </td>
                <td className="py-2 space-x-1">
                  {b.status === 'pending' && (
                    <>
                      <button onClick={() => updateStatus(b.id, 'approved')} className="px-2 py-1 bg-green-600/30 text-green-300 rounded text-xs">
                        Approve
                      </button>
                      <button onClick={() => updateStatus(b.id, 'rejected')} className="px-2 py-1 bg-red-600/30 text-red-300 rounded text-xs">
                        Reject
                      </button>
                    </>
                  )}
                  {b.payment_method === 'bank_transfer' && b.payment_status === 'awaiting_verification' && (
                    <>
                      <button onClick={() => updatePayment(b.id, 'verified')} className="px-2 py-1 bg-green-600/30 text-green-300 rounded text-xs">
                        Verify Pay
                      </button>
                      <button onClick={() => updatePayment(b.id, 'rejected')} className="px-2 py-1 bg-red-600/30 text-red-300 rounded text-xs">
                        Reject Pay
                      </button>
                    </>
                  )}
                  {b.status !== 'cancelled' && b.status !== 'completed' && (
                    <button onClick={() => updateStatus(b.id, 'cancelled')} className="px-2 py-1 bg-gray-600/30 text-gray-300 rounded text-xs">
                      Cancel
                    </button>
                  )}
                  {b.status === 'approved' && (
                    <button onClick={() => updateStatus(b.id, 'completed')} className="px-2 py-1 bg-blue-600/30 text-blue-300 rounded text-xs">
                      Complete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
