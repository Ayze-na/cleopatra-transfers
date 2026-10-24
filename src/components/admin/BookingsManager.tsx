'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

interface Booking {
  id: string;
  reference: string;
  client_name: string;
  route_id: string;
  car_id: string;
  trip_datetime: string;
  price_amount: number;
  currency: string;
  payment_method: string;
  payment_status: string;
  status: string;
  passport_file_path?: string;
  payment_screenshot_path?: string;
}

export default function BookingsManager() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('direct_bookings').select('*').order('created_at', { ascending: false });
    setBookings((data as Booking[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

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
              <th className="py-2 text-left">When</th>
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
                <td className="py-2">{new Date(b.trip_datetime).toLocaleString()}</td>
                <td className="py-2">{b.price_amount} {b.currency}</td>
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
