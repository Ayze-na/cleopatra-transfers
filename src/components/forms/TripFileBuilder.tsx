'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronDown } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { supabase } from '@/lib/supabase/client';
import { usePublicSettings } from '@/lib/usePublicSettings';
import { whatsappLink } from '@/lib/whatsapp';
import Turnstile from '@/components/Turnstile';

interface Place {
  id: string;
  name: Record<string, string> | string;
  description: Record<string, string> | string;
  image?: string;
}

interface City {
  id: string;
  name: Record<string, string> | string;
  description: Record<string, string> | string;
  coverImage?: string;
  places: Place[];
}

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '';

export default function TripFileBuilder() {
  const locale = useLocale();
  const t = useTranslations('tripFiles');
  const td = useTranslations('directRides');
  const { whatsapp_number } = usePublicSettings();
  const [step, setStep] = useState(0);
  const [turnstileToken, setTurnstileToken] = useState('');
  const [cities, setCities] = useState<City[]>([]);
  const [expandedCity, setExpandedCity] = useState<string | null>(null);
  const [selectedPlaces, setSelectedPlaces] = useState<Set<string>>(new Set());

  const [startDate, setStartDate] = useState('');
  const [days, setDays] = useState(1);

  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [nationality, setNationality] = useState('');
  const [passportFile, setPassportFile] = useState<File | null>(null);
  const [passportPath, setPassportPath] = useState('');
  const [consent, setConsent] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [reference, setReference] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      const [{ data: cs }, { data: ps }] = await Promise.all([
        supabase.from('cities').select('*').eq('active', true).order('sort_order', { ascending: true }),
        supabase.from('places').select('*').eq('active', true).order('sort_order', { ascending: true }),
      ]);
      const cityList = (cs ?? []).map((c: any) => ({
        id: c.id,
        name: c.name,
        description: c.description,
        coverImage: c.cover_image,
        places: [] as Place[],
      }));
      (ps ?? []).forEach((p: any) => {
        const city = cityList.find((c) => c.id === p.city_id);
        if (city) {
          city.places.push({
            id: p.id,
            name: p.name,
            description: p.description,
            image: p.image,
          });
        }
      });
      setCities(cityList);
    };
    load();
  }, []);

  const togglePlace = (placeId: string) => {
    const newSet = new Set(selectedPlaces);
    if (newSet.has(placeId)) newSet.delete(placeId);
    else newSet.add(placeId);
    setSelectedPlaces(newSet);
  };

  const toggleCity = (cityId: string) => {
    setExpandedCity(expandedCity === cityId ? null : cityId);
  };

  const getSelectedByCity = () => {
    const result: Record<string, Place[]> = {};
    cities.forEach((city) => {
      const cityPlaces = city.places.filter((p) => selectedPlaces.has(p.id));
      if (cityPlaces.length > 0) {
        const cname = typeof city.name === 'string' ? city.name : city.name?.[locale as string] || city.name?.en || city.id;
        result[cname] = cityPlaces;
      }
    });
    return result;
  };

  const selectedByCity = getSelectedByCity();

  const nameOf = (v: Record<string, string> | string) =>
    typeof v === 'string' ? v : v?.[locale as string] || v?.en || '';

  const endDate = startDate
    ? new Date(new Date(startDate).getTime() + (days - 1) * 86400000).toISOString().slice(0, 10)
    : '';

  const uploadFile = async (file: File) => {
    const ext = file.name.split('.').pop();
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from('passports').upload(path, file);
    if (error) throw error;
    return path;
  };

  const handleSubmit = async () => {
    setError('');
    if (selectedPlaces.size === 0) {
      setError(t('selectAtLeastOne'));
      return;
    }
    if (!startDate) {
      setError(t('chooseStartDate'));
      return;
    }
    if (!consent) {
      setError(t('consentRequired'));
      return;
    }
    if (TURNSTILE_SITE_KEY && !turnstileToken) {
      setError(td('confirmHuman'));
      return;
    }
    setSubmitting(true);
    try {
      let pp = passportPath;
      if (passportFile && !pp) {
        pp = await uploadFile(passportFile);
        setPassportPath(pp);
      }

      const res = await fetch('/api/trip-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          start_date: startDate,
          days,
          passengers: 1,
          luggage: 0,
          client_name: clientName,
          client_phone: clientPhone,
          client_email: clientEmail,
          nationality,
          passport_file_path: pp,
          place_ids: Array.from(selectedPlaces),
          language: locale as string,
          consent: true,
          turnstile_token: turnstileToken || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to create trip request');

      const ref = json.tripRequest?.reference ?? json.tripRequest?.id ?? '';
      setReference(ref);

      // Build WhatsApp redirect
      const selectedList = Array.from(selectedPlaces)
        .map((pid) => {
          for (const c of cities) {
            const p = c.places.find((x) => x.id === pid);
            if (p) return `${nameOf(c.name)}: ${nameOf(p.name)}`;
          }
          return pid;
        })
        .join(', ');

      const message = encodeURIComponent(
        `Trip File Request\nRef: ${ref}\nName: ${clientName}\nStart: ${startDate}\nDays: ${days}\nPlaces: ${selectedList}`
      );
      window.open(whatsappLink(whatsapp_number, message), '_blank');

      setStep(3);
    } catch (e: any) {
      setError(e.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        {step === 0 && (
          <div className="space-y-4">
            {cities.map((city) => (
              <div key={city.id} className="bg-pharaoh-blue/30 border border-gold/30 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleCity(city.id)}
                  className="w-full flex items-center justify-between p-6 text-left hover:bg-gold/5 transition-colors"
                >
                  <div>
                    <h3 className="text-xl font-cinzel text-gold">{nameOf(city.name)}</h3>
                    <p className="text-pharaoh-ivory/70 text-sm">{nameOf(city.description)}</p>
                  </div>
                  <ChevronDown className="text-gold transition-transform" />
                </button>
                <AnimatePresence>
                  {expandedCity === city.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-6 pt-0 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {city.places.map((place) => (
                          <label
                            key={place.id}
                            className="flex items-start gap-3 p-4 rounded border cursor-pointer transition-colors border-gold/30"
                          >
                            <input
                              type="checkbox"
                              checked={selectedPlaces.has(place.id)}
                              onChange={() => togglePlace(place.id)}
                              className="mt-1 accent-gold"
                            />
                            <div>
                              <div className="text-pharaoh-ivory font-semibold">{nameOf(place.name)}</div>
                              <div className="text-pharaoh-ivory/60 text-sm">{nameOf(place.description)}</div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4 bg-pharaoh-blue/30 border border-gold/30 rounded-lg p-8">
            <div>
              <label className="block text-pharaoh-ivory mb-2">{t('startDate')}</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-pharaoh-bg border border-gold/30 rounded px-4 py-3 text-pharaoh-ivory"
              />
            </div>
            <div>
              <label className="block text-pharaoh-ivory mb-2">{t('numberOfDays')}</label>
              <input
                type="number"
                min={1}
                max={30}
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="w-full bg-pharaoh-bg border border-gold/30 rounded px-4 py-3 text-pharaoh-ivory"
              />
            </div>
            {endDate && (
              <p className="text-pharaoh-ivory/70 text-sm">{t('endDate')}: {endDate}</p>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 bg-pharaoh-blue/30 border border-gold/30 rounded-lg p-8">
            <input
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder={td('fullName')}
              className="w-full bg-pharaoh-bg border border-gold/30 rounded px-4 py-3 text-pharaoh-ivory"
            />
            <input
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
              placeholder={td('phoneWhatsApp')}
              className="w-full bg-pharaoh-bg border border-gold/30 rounded px-4 py-3 text-pharaoh-ivory"
            />
            <input
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              placeholder={td('email')}
              type="email"
              className="w-full bg-pharaoh-bg border border-gold/30 rounded px-4 py-3 text-pharaoh-ivory"
            />
            <input
              value={nationality}
              onChange={(e) => setNationality(e.target.value)}
              placeholder={td('nationality')}
              className="w-full bg-pharaoh-bg border border-gold/30 rounded px-4 py-3 text-pharaoh-ivory"
            />
            <div>
              <label className="block text-pharaoh-ivory mb-2">{td('passportPhoto')}</label>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => setPassportFile(e.target.files?.[0] ?? null)}
                className="w-full text-pharaoh-ivory"
              />
            </div>
            <label className="flex items-center gap-2 text-pharaoh-ivory text-sm">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
              {td('iAgree')}
            </label>
            {TURNSTILE_SITE_KEY && (
              <Turnstile siteKey={TURNSTILE_SITE_KEY} onToken={setTurnstileToken} />
            )}
            {error && <p className="text-red-400 text-sm">{error}</p>}
          </div>
        )}

        {step === 3 && (
          <div className="bg-pharaoh-blue/30 border border-gold/30 rounded-lg p-8 text-center space-y-4">
            <h3 className="text-2xl font-cinzel text-gold">{t('requestSubmitted')}</h3>
            <p className="text-pharaoh-ivory">{t('yourReference')} <span className="text-gold font-bold">{reference}</span></p>
            <p className="text-pharaoh-ivory/70 text-sm">{t('redirectNote')}</p>
            <a
              href={whatsappLink(whatsapp_number)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-6 py-3 bg-gold text-black font-semibold rounded hover:bg-gold-light transition-colors"
            >
              {t('openWhatsapp')}
            </a>
          </div>
        )}
      </div>

      <div className="lg:col-span-1">
        <div className="sticky top-24 bg-pharaoh-blue/30 border border-gold/30 rounded-lg p-6">
          <h3 className="text-xl font-cinzel text-gold mb-4">{t('myTripFile')}</h3>
          {Object.keys(selectedByCity).length === 0 ? (
            <p className="text-pharaoh-ivory/60 text-sm">{t('selectPlacesHelp')}</p>
          ) : (
            <div className="space-y-4">
              {Object.entries(selectedByCity).map(([cityName, places]) => (
                <div key={cityName}>
                  <div className="text-gold font-semibold mb-2">{cityName}</div>
                  <div className="space-y-2">
                    {places.map((place) => (
                      <div key={place.id} className="flex items-center justify-between text-sm">
                        <span className="text-pharaoh-ivory">{nameOf(place.name)}</span>
                        <button onClick={() => togglePlace(place.id)} className="text-gold/60 hover:text-gold">
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-6 pt-6 border-t border-gold/30">
            <div className="text-pharaoh-ivory/80 text-sm mb-4">
              {selectedPlaces.size} {t('placesSelected')}
            </div>
            {step < 3 && (
              <div className="flex gap-2">
                {step > 0 && (
                  <button
                    onClick={() => setStep(step - 1)}
                    className="flex-1 px-4 py-2 border border-gold text-gold rounded hover:bg-gold hover:text-black transition-colors"
                  >
                    Back
                  </button>
                )}
                {step === 0 && (
                  <button
                    onClick={() => setStep(1)}
                    disabled={selectedPlaces.size === 0}
                    className="flex-1 px-4 py-2 bg-gold text-black rounded font-semibold hover:bg-gold-light transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Continue
                  </button>
                )}
                {step === 1 && (
                  <button
                    onClick={() => setStep(2)}
                    disabled={!startDate}
                    className="flex-1 px-4 py-2 bg-gold text-black rounded font-semibold hover:bg-gold-light transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Continue
                  </button>
                )}
                {step === 2 && (
                  <button
                    onClick={handleSubmit}
                    disabled={submitting || !consent || !clientName || !clientEmail}
                    className="flex-1 px-4 py-2 bg-gold text-black rounded font-semibold hover:bg-gold-light transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Submitting...' : 'Submit'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
