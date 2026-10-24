'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import CarsManager from '@/components/admin/CarsManager';
import LocationsManager from '@/components/admin/LocationsManager';
import RoutesManager from '@/components/admin/RoutesManager';
import CitiesManager from '@/components/admin/CitiesManager';
import PlacesManager from '@/components/admin/PlacesManager';
import PriceMatrixManager from '@/components/admin/PriceMatrixManager';
import SettingsManager from '@/components/admin/SettingsManager';
import ContactSettingsManager from '@/components/admin/ContactSettingsManager';
import DocumentsManager from '@/components/admin/DocumentsManager';
import LogsManager from '@/components/admin/LogsManager';
import BookingsManager from '@/components/admin/BookingsManager';
import TripRequestsManager from '@/components/admin/TripRequestsManager';
import AdminsManager from '@/components/admin/AdminsManager';

const TABS = [
  { id: 'bookings', label: 'Direct Bookings' },
  { id: 'trip-requests', label: 'Trip Requests' },
  { id: 'pricing', label: 'Pricing Matrix' },
  { id: 'routes', label: 'Routes' },
  { id: 'locations', label: 'Locations' },
  { id: 'cities', label: 'Cities' },
  { id: 'places', label: 'Places' },
  { id: 'cars', label: 'Cars' },
  { id: 'contact-settings', label: 'Contact & WhatsApp' },
  { id: 'documents', label: 'Documents' },
  { id: 'admin-settings', label: 'Settings' },
  { id: 'admins', label: 'Admins' },
  { id: 'logs', label: 'Logs' },
] as const;

type TabId = (typeof TABS)[number]['id'];

export default function AdminPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [adminChecked, setAdminChecked] = useState(false);
  const [tab, setTab] = useState<TabId>('bookings');

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user?.email) {
        router.push('/admin/login');
        setAuthChecked(true);
        return;
      }

      const { data: admin } = await supabase
        .from('admin_users')
        .select('id, active')
        .eq('email', data.user.email.toLowerCase())
        .maybeSingle();

      if (!admin || !admin.active) {
        await supabase.auth.signOut();
        router.push('/admin/login');
        setAuthChecked(true);
        return;
      }

      setUser(data.user);
      setAdminChecked(true);
      setAuthChecked(true);
    });
  }, [router]);

  const logout = async () => {
    await supabase.auth.signOut();
    router.push('/admin/login');
    router.refresh();
  };

  if (!authChecked) {
    return <main className="min-h-screen bg-pharaoh-bg py-20 px-4"><p className="text-pharaoh-ivory">Loading...</p></main>;
  }
  if (!user || !adminChecked) return null;

  const renderTab = () => {
    switch (tab) {
      case 'bookings':
        return <BookingsManager />;
      case 'trip-requests':
        return <TripRequestsManager />;
      case 'pricing':
        return <PriceMatrixManager />;
      case 'routes':
        return <RoutesManager />;
      case 'locations':
        return <LocationsManager />;
      case 'cities':
        return <CitiesManager />;
      case 'places':
        return <PlacesManager />;
      case 'cars':
        return <CarsManager />;
      case 'contact-settings':
        return <ContactSettingsManager />;
      case 'documents':
        return <DocumentsManager />;
      case 'admin-settings':
        return <SettingsManager />;
      case 'admins':
        return <AdminsManager currentEmail={user.email} />;
      case 'logs':
        return <LogsManager />;
      default:
        return null;
    }
  };

  return (
    <main className="min-h-screen bg-pharaoh-bg py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-4xl font-cinzel text-gold">Admin Panel</h1>
            <p className="text-sm text-pharaoh-ivory/60 mt-1">{user.email}</p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="self-start px-5 py-2 border border-gold/40 text-gold rounded hover:bg-gold hover:text-black transition-colors"
          >
            Sign out
          </button>
        </div>

        <nav className="flex overflow-x-auto gap-2 mb-6 pb-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded text-sm whitespace-nowrap transition-colors ${
                tab === t.id
                  ? 'bg-gold text-black font-semibold'
                  : 'bg-pharaoh-blue/30 border border-gold/20 text-pharaoh-ivory hover:border-gold/50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <section className="bg-pharaoh-blue/30 border border-gold/30 rounded-lg p-6">
          {renderTab()}
        </section>
      </div>
    </main>
  );
}
