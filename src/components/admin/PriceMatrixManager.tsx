'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { logActivity } from '@/lib/admin-activity';

interface Route {
  id: string;
  from_location_id: string;
  to_location_id: string;
}

interface Car {
  id: string;
  name: { en?: string } | string;
}

interface Location {
  id: string;
  name: { en?: string } | string;
}

const CURRENCIES = ['USD', 'EGP', 'EUR'];

export default function PriceMatrixManager() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [cars, setCars] = useState<Car[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [routeId, setRouteId] = useState('');
  const [prices, setPrices] = useState<Record<string, Record<string, string>>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState('');

  const flash = (msg: string) => {
    setSaved(msg);
    setTimeout(() => setSaved(''), 2500);
  };

  const load = async () => {
    setLoading(true);
    const [{ data: rts }, { data: cs }, { data: locs }, { data: prs }] = await Promise.all([
      supabase.from('routes').select('id,from_location_id,to_location_id').eq('active', true),
      supabase.from('cars').select('id,name').eq('active', true),
      supabase.from('locations').select('id,name'),
      supabase.from('route_prices').select('*'),
    ]);
    setRoutes((rts as Route[]) ?? []);
    setCars((cs as Car[]) ?? []);
    setLocations((locs as Location[]) ?? []);
    const map: Record<string, Record<string, string>> = {};
    (prs ?? []).forEach((p: any) => {
      if (!map[p.route_id]) map[p.route_id] = {};
      map[p.route_id][`${p.car_id}_${p.currency}`] = String(p.amount ?? '');
    });
    setPrices(map);
    if (!routeId && rts && rts.length) setRouteId(rts[0].id);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const locName = (id: string) => {
    const l = locations.find((x) => x.id === id);
    if (!l) return id;
    return typeof l.name === 'string' ? l.name : l.name?.en ?? id;
  };

  const routeLabel = (r: Route) => `${locName(r.from_location_id)} → ${locName(r.to_location_id)}`;

  const carName = (c: Car) => (typeof c.name === 'string' ? c.name : c.name?.en ?? c.id);

  const getPrice = (carId: string, currency: string) =>
    prices[routeId]?.[`${carId}_${currency}`] ?? '';

  const setPrice = (carId: string, currency: string, value: string) => {
    setPrices((prev) => {
      const next = { ...prev };
      if (!next[routeId]) next[routeId] = {};
      next[routeId][`${carId}_${currency}`] = value;
      return next;
    });
  };

  const handleSave = async () => {
    if (!routeId) return;
    setSaving(true);

    // Rows the admin typed/cleared for this route.
    const existing = (prices[routeId] ?? {}) as Record<string, string>;
    const toInsert: any[] = [];
    const toDelete: string[] = [];

    cars.forEach((car) => {
      CURRENCIES.forEach((cur) => {
        const val = getPrice(car.id, cur);
        if (val !== '' && !isNaN(Number(val))) {
          toInsert.push({ route_id: routeId, car_id: car.id, currency: cur, amount: Number(val) });
        }
      });
    });

    // Prices that existed in DB previously but are now blank → delete.
    const { data: previous } = await supabase
      .from('route_prices')
      .select('id,car_id,currency')
      .eq('route_id', routeId);
    (previous ?? []).forEach((row: any) => {
      const val = prices[routeId]?.[`${row.car_id}_${row.currency}`];
      if (val === '' || val === undefined) toDelete.push(row.id);
    });

    let error: any = null;
    if (toInsert.length) {
      const { error: upErr } = await supabase
        .from('route_prices')
        .upsert(toInsert, { onConflict: 'route_id,car_id,currency' });
      error = upErr;
    }
    if (!error && toDelete.length) {
      const { error: delErr } = await supabase.from('route_prices').delete().in('id', toDelete);
      error = delErr;
    }

    if (error) flash(`Error: ${error.message}`);
    else {
      await logActivity('update_prices', 'route', routeId, {
        route: routeLabel(routes.find((r) => r.id === routeId)!),
        inserted: toInsert.length,
        deleted: toDelete.length,
      });
      flash('Prices saved');
    }
    await load();
    setSaving(false);
  };

  const handleClearRoute = async () => {
    if (!routeId) return;
    if (!confirm('Remove all prices for this route?')) return;
    const { error } = await supabase.from('route_prices').delete().eq('route_id', routeId);
    if (error) flash(`Error: ${error.message}`);
    else {
      await logActivity('clear_prices', 'route', routeId);
      flash('Route prices cleared');
    }
    await load();
  };

  if (loading) return <p className="text-pharaoh-ivory/60">Loading...</p>;

  return (
    <div className="space-y-6">
      {saved && <p className="text-green-300 text-sm">{saved}</p>}
      <div className="flex items-center gap-3">
        <select
          value={routeId}
          onChange={(e) => setRouteId(e.target.value)}
          className="bg-pharaoh-bg border border-gold/30 rounded px-3 py-2 text-pharaoh-ivory flex-1"
        >
          {routes.map((r) => (
            <option key={r.id} value={r.id}>
              {routeLabel(r)}
            </option>
          ))}
        </select>
        <button
          onClick={handleClearRoute}
          disabled={saving || !routeId}
          className="px-6 py-2 bg-red-600/30 text-red-300 rounded hover:bg-red-600/50 transition-colors disabled:opacity-50"
        >
          Clear prices
        </button>
        <button
          onClick={handleSave}
          disabled={saving || !routeId}
          className="px-6 py-2 bg-gold text-black font-semibold rounded hover:bg-gold-light transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Prices'}
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-gold border-b border-gold/30">
              <th className="py-2">Car</th>
              {CURRENCIES.map((c) => (
                <th key={c} className="py-2">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cars.map((car) => (
              <tr key={car.id} className="border-b border-gold/10">
                <td className="py-2 text-pharaoh-ivory">{carName(car)}</td>
                {CURRENCIES.map((cur) => (
                  <td key={cur} className="py-2">
                    <input
                      type="number"
                      step="0.01"
                      value={getPrice(car.id, cur)}
                      onChange={(e) => setPrice(car.id, cur, e.target.value)}
                      className="w-24 bg-pharaoh-bg border border-gold/30 rounded px-2 py-1 text-pharaoh-ivory"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
