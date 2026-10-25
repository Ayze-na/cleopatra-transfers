'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, ChevronRight, ChevronLeft } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { supabase } from '@/lib/supabase/client';
import { useCurrency, type Currency } from '@/lib/currency/CurrencyContext';
import CurrencySwitcher from '@/components/CurrencySwitcher';
import Turnstile from '@/components/Turnstile';

interface Location { id: string; name: Record<string, string> | string; type: string; active: boolean; }
interface Route { id: string; from_location_id: string; to_location_id: string; active: boolean; }
interface Car { id: string; name: Record<string, string> | string; max_passengers: number; max_luggage: number; description?: Record<string, string> | string; active: boolean; }
interface RoutePrice { route_id: string; car_id: string; currency: string; amount: number; }
interface SlotReservation { car_id: string; slot: string; }
interface PaymentMethod { id: string; code: string; display_name: string; details: string | null; requires_screenshot: boolean; }

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '';

export default function DirectRideWizard() {
  const locale = useLocale();
  const t = useTranslations('directRides');
  const { currency, setCurrency, mounted } = useCurrency();
  const [step, setStep] = useState(0);
  const [locations, setLocations] = useState<Location[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [cars, setCars] = useState<Car[]>([]);
  const [prices, setPrices] = useState<RoutePrice[]>([]);
  const [availability, setAvailability] = useState<SlotReservation[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [bankDetails, setBankDetails] = useState('');
  const steps = t.raw('steps') as string[];

  const [routeMode, setRouteMode] = useState<'preset' | 'custom'>('preset');
  const [pickupId, setPickupId] = useState('');
  const [dropoffId, setDropoffId] = useState('');
  const [customPickup, setCustomPickup] = useState('');
  const [customDropoff, setCustomDropoff] = useState('');
  const [tripDate, setTripDate] = useState('');
  const [tripTime, setTripTime] = useState('');
  const [meridiem, setMeridiem] = useState<'AM' | 'PM'>('PM');
  const [carId, setCarId] = useState('');
  const [passengers, setPassengers] = useState(1);
  const [luggage, setLuggage] = useState(0);

  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [nationality, setNationality] = useState('');
  const [passportFile, setPassportFile] = useState<File | null>(null);
  const [passportPath, setPassportPath] = useState('');

  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null);
  const [paymentPath, setPaymentPath] = useState('');
  const [hotelText, setHotelText] = useState('');

  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [bookingRef, setBookingRef] = useState('');
  const [error, setError] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');

  const localeRef = locale as string;
  const activeCurrency: Currency = (mounted && (['USD', 'EGP', 'EUR'] as string[]).includes(currency))
    ? (currency as Currency)
    : 'USD';

  useEffect(() => {
    const load = async () => {
      const [{ data: locs }, { data: rts }, { data: cs }, { data: prs }, { data: av }, { data: pms }, { data: bank }] =
        await Promise.all([
          supabase.from('locations').select('*').eq('active', true),
          supabase.from('routes').select('*').eq('active', true),
          supabase.from('cars').select('*').eq('active', true),
          supabase.from('route_prices').select('*'),
          supabase.from('car_booking_schedule').select('car_id,slot'),
          supabase.from('payment_methods').select('*').eq('active', true),
          supabase.from('settings').select('value').eq('key', 'bank_details').maybeSingle(),
        ]);
      setLocations((locs as Location[]) ?? []);
      setRoutes((rts as Route[]) ?? []);
      setCars((cs as Car[]) ?? []);
      setPrices((prs as RoutePrice[]) ?? []);
      setAvailability((av as SlotReservation[]) ?? []);
      setBankDetails(typeof bank?.value === 'string' ? bank.value : '');
      const methods = (pms as PaymentMethod[]) ?? [];
      setPaymentMethods(methods);
      if (methods.length > 0 && !paymentMethod) setPaymentMethod(methods[0].code);
    };
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const selectedPayment = paymentMethods.find((p) => p.code === paymentMethod) ?? null;

  const pick = (name: Record<string, string> | string, id: string) =>
    typeof name === 'string' ? name : name?.[localeRef] || name?.en || id;
  const locName = (l: Location | null) => (l ? pick(l.name, l.id) : '');
  const carName = (c: Car) => pick(c.name, c.id);

  const validDropoffs = routes
    .filter((r) => r.from_location_id === pickupId)
    .map((r) => r.to_location_id);

  const isPreset = routeMode === 'preset' && !!pickupId && !!dropoffId;
  const selectedRoute = isPreset
    ? routes.find((r) => r.from_location_id === pickupId && r.to_location_id === dropoffId)
    : undefined;
  const routeId = selectedRoute?.id;

  const pickupName = isPreset ? locName(locations.find((l) => l.id === pickupId) ?? null) : customPickup.trim();
  const dropoffName = isPreset ? locName(locations.find((l) => l.id === dropoffId) ?? null) : customDropoff.trim();

  const hour12 = parseInt(tripTime.split(':')[0] || '0', 10);
  const isBookedCar = (cid: string): boolean =>
    !!tripDate && availability.some((a) => a.car_id === cid && a.slot === `${tripDate}T${String(hour12).padStart(2, '0')}00`);

  const routeComplete = routeMode === 'custom' ? customPickup.trim().length > 1 && customDropoff.trim().length > 1 : isPreset;

  const allCars = cars;

  const selectedCar = cars.find((c) => c.id === carId);
  const priceForCar = (cid: string) =>
    prices.find((p) => p.route_id === routeId && p.car_id === cid && p.currency === activeCurrency)?.amount;

  const tripIso = (): string | null => {
    if (!tripDate || !tripTime) return null;
    const [h, m] = tripTime.split(':').map(Number);
    let hh = h % 12;
    if (meridiem === 'PM') hh += 12;
    const d = new Date(`${tripDate}T${String(hh).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`);
    if (isNaN(d.getTime())) return null;
    return d.toISOString();
  };

  const nextStep = () => {
    if (step < steps.length - 1) setStep(step + 1);
  };
  const prevStep = () => {
    if (step > 0) setStep(step - 1);
  };

  const uploadFile = async (file: File, bucket: string) => {
    const ext = file.name.split('.').pop();
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from(bucket).upload(path, file);
    if (error) throw error;
    return path;
  };

  const handleSubmit = async () => {
    setError('');
    if (!routeComplete || !carId) {
      setError(t('completeSelection'));
      return;
    }
    if (!tripIso()) {
      setError(t('completeSelection'));
      return;
    }
    if (TURNSTILE_SITE_KEY && !turnstileToken) {
      setError(t('confirmHuman'));
      return;
    }
    setSubmitting(true);
    try {
      let pp = passportPath;
      if (passportFile && !pp) {
        pp = await uploadFile(passportFile, 'passports');
        setPassportPath(pp);
      }
      if (!paymentMethod) {
        setError(t('selectPaymentMethod'));
        return;
      }
      if (selectedPayment?.requires_screenshot && !paymentScreenshot) {
        setError(t('paymentScreenshotRequired'));
        return;
      }
      let sp = paymentPath;
      if (selectedPayment?.requires_screenshot && paymentScreenshot && !sp) {
        sp = await uploadFile(paymentScreenshot, 'payment-screenshots');
        setPaymentPath(sp);
      }

      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          route_id: routeId ?? undefined,
          car_id: carId,
          pickup_name: isPreset ? undefined : customPickup.trim(),
          dropoff_name: isPreset ? undefined : customDropoff.trim(),
          trip_datetime: tripIso() as string,
          price_amount: priceForCar(carId) ?? null,
          hotel_text: hotelText,
          passengers,
          luggage,
          client_name: clientName,
          client_phone: clientPhone,
          client_email: clientEmail,
          nationality,
          passport_file_path: pp,
          payment_method: paymentMethod,
          payment_screenshot_path: sp || undefined,
          currency: activeCurrency,
          language: localeRef,
          consent: true,
          turnstile_token: turnstileToken || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to create booking');
      setBookingRef(json.booking?.reference ?? json.booking?.id ?? '');
      setStep(steps.length - 1);
    } catch (e: any) {
      setError(e.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((s, index) => (
            <div key={s} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div className="w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors border-gold text-gold">
                  {index < step ? <Check size={20} /> : index + 1}
                </div>
                <span className="text-xs mt-2 text-center hidden md:block text-pharaoh-ivory">{s}</span>
              </div>
              {index < steps.length - 1 && <div className="h-0.5 flex-1 bg-gold/30" />}
            </div>
          ))}
        </div>
      </div>

      <motion.div
        key={step}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-pharaoh-blue/30 border border-gold/30 rounded-lg p-8"
      >
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <h2 className="text-2xl font-cinzel text-gold">{steps[step]}</h2>
          <div className="flex items-center gap-2">
            <span className="text-pharaoh-ivory/60 text-sm hidden sm:inline">{t('currency')}</span>
            <CurrencySwitcher compact />
          </div>
        </div>

        {step === 0 && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setRouteMode('preset');
                  setCarId('');
                }}
                className={`px-4 py-2 rounded border text-sm transition-colors ${routeMode === 'preset' ? 'bg-gold text-black border-gold' : 'border-gold/30 text-pharaoh-ivory hover:border-gold'}`}
              >
                {t('presetRoutes')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setRouteMode('custom');
                  setCarId('');
                }}
                className={`px-4 py-2 rounded border text-sm transition-colors ${routeMode === 'custom' ? 'bg-gold text-black border-gold' : 'border-gold/30 text-pharaoh-ivory hover:border-gold'}`}
              >
                {t('customLocations')}
              </button>
            </div>
            {routeMode === 'preset' ? (
              <>
                <div>
                  <label className="block text-pharaoh-ivory mb-2">{t('pickupPoint')}</label>
                  <select
                    value={pickupId}
                    onChange={(e) => {
                      setPickupId(e.target.value);
                      setDropoffId('');
                      setCarId('');
                    }}
                    className="w-full bg-pharaoh-bg border border-gold/30 rounded px-4 py-3 text-pharaoh-ivory"
                  >
                    <option value="">{t('selectPickup')}</option>
                    {locations.map((l) => (
                      <option key={l.id} value={l.id}>{locName(l)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-pharaoh-ivory mb-2">{t('dropoffPoint')}</label>
                  <select
                    value={dropoffId}
                    onChange={(e) => {
                      setDropoffId(e.target.value);
                      setCarId('');
                    }}
                    disabled={!pickupId}
                    className="w-full bg-pharaoh-bg border border-gold/30 rounded px-4 py-3 text-pharaoh-ivory"
                  >
                    <option value="">{t('selectDropoff')}</option>
                    {locations
                      .filter((l) => validDropoffs.includes(l.id))
                      .map((l) => (
                        <option key={l.id} value={l.id}>{locName(l)}</option>
                      ))}
                  </select>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-pharaoh-ivory mb-2">{t('customPickup')}</label>
                  <input
                    value={customPickup}
                    onChange={(e) => {
                      setCustomPickup(e.target.value);
                      setCarId('');
                    }}
                    placeholder={t('customPickupPlaceholder')}
                    className="w-full bg-pharaoh-bg border border-gold/30 rounded px-4 py-3 text-pharaoh-ivory"
                  />
                </div>
                <div>
                  <label className="block text-pharaoh-ivory mb-2">{t('customDropoff')}</label>
                  <input
                    value={customDropoff}
                    onChange={(e) => {
                      setCustomDropoff(e.target.value);
                      setCarId('');
                    }}
                    placeholder={t('customDropoffPlaceholder')}
                    className="w-full bg-pharaoh-bg border border-gold/30 rounded px-4 py-3 text-pharaoh-ivory"
                  />
                </div>
              </>
            )}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-pharaoh-ivory mb-2">{t('dateCairo')}</label>
              <input
                type="date"
                value={tripDate}
                min={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setTripDate(e.target.value)}
                className="w-full bg-pharaoh-bg border border-gold/30 rounded px-4 py-3 text-pharaoh-ivory"
              />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-pharaoh-ivory mb-2">{t('time')}</label>
                <input
                  type="time"
                  value={tripTime}
                  onChange={(e) => setTripTime(e.target.value)}
                  className="w-full bg-pharaoh-bg border border-gold/30 rounded px-4 py-3 text-pharaoh-ivory"
                />
              </div>
              <div>
                <label className="block text-pharaoh-ivory mb-2">{t('meridiem')}</label>
                <div className="flex gap-2">
                  {(['AM', 'PM'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMeridiem(m)}
                      className={`px-5 py-3 rounded border font-semibold transition-colors ${meridiem === m ? 'bg-gold text-black border-gold' : 'border-gold/30 text-pharaoh-ivory hover:border-gold'}`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <p className="text-pharaoh-ivory/60 text-sm">{t('carsNote')}</p>
            {allCars.length === 0 && (
              <p className="text-pharaoh-ivory/60">{t('noCars')}</p>
            )}
            {allCars.map((c) => {
              const booked = isBookedCar(c.id);
              const price = priceForCar(c.id);
              return (
                <label
                  key={c.id}
                  className={`flex items-center gap-4 p-4 rounded border cursor-pointer transition-colors ${carId === c.id ? 'border-gold bg-gold/10' : 'border-gold/30'}`}
                >
                  <input
                    type="radio"
                    name="car"
                    checked={carId === c.id}
                    disabled={booked}
                    onChange={() => setCarId(c.id)}
                    className="accent-gold"
                  />
                  <div className="flex-1">
                    <div className="text-pharaoh-ivory font-semibold flex items-center gap-2">
                      {carName(c)}
                      {booked && (
                        <span className="px-2 py-0.5 rounded bg-danger/20 text-danger text-xs font-semibold">{t('booked')}</span>
                      )}
                    </div>
                    <div className="text-pharaoh-ivory/60 text-sm">
                      {c.max_passengers} {t('passengersLabel')} · {c.max_luggage} {t('luggageLabel')}
                    </div>
                  </div>
                  <div className={`font-bold ${price != null ? 'text-gold' : 'text-pharaoh-ivory/50 text-sm'}`}>
                    {price != null ? `${price} ${activeCurrency}` : t('priceOnApproval')}
                  </div>
                </label>
              );
            })}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div>
              <label className="block text-pharaoh-ivory mb-2">{t('passengers')}</label>
              <input
                type="number"
                min={1}
                max={selectedCar?.max_passengers ?? 50}
                value={passengers}
                onChange={(e) => setPassengers(Number(e.target.value))}
                className="w-full bg-pharaoh-bg border border-gold/30 rounded px-4 py-3 text-pharaoh-ivory"
              />
            </div>
            <div>
              <label className="block text-pharaoh-ivory mb-2">{t('luggage')}</label>
              <input
                type="number"
                min={0}
                max={selectedCar?.max_luggage ?? 50}
                value={luggage}
                onChange={(e) => setLuggage(Number(e.target.value))}
                className="w-full bg-pharaoh-bg border border-gold/30 rounded px-4 py-3 text-pharaoh-ivory"
              />
            </div>
            {selectedCar && (passengers > selectedCar.max_passengers || luggage > selectedCar.max_luggage) && (
              <p className="text-red-400 text-sm">{t('exceeds')}</p>
            )}
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <input
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder={t('fullName')}
              className="w-full bg-pharaoh-bg border border-gold/30 rounded px-4 py-3 text-pharaoh-ivory"
            />
            <input
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
              placeholder={t('phoneWhatsApp')}
              className="w-full bg-pharaoh-bg border border-gold/30 rounded px-4 py-3 text-pharaoh-ivory"
            />
            <input
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              placeholder={t('email')}
              type="email"
              className="w-full bg-pharaoh-bg border border-gold/30 rounded px-4 py-3 text-pharaoh-ivory"
            />
            <input
              value={nationality}
              onChange={(e) => setNationality(e.target.value)}
              placeholder={t('nationality')}
              className="w-full bg-pharaoh-bg border border-gold/30 rounded px-4 py-3 text-pharaoh-ivory"
            />
            <input
              value={hotelText}
              onChange={(e) => setHotelText(e.target.value)}
              placeholder={t('hotelText')}
              className="w-full bg-pharaoh-bg border border-gold/30 rounded px-4 py-3 text-pharaoh-ivory"
            />
            <div>
              <label className="block text-pharaoh-ivory mb-2">{t('passportPhoto')}</label>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => setPassportFile(e.target.files?.[0] ?? null)}
                className="w-full text-pharaoh-ivory"
              />
            </div>
            <label className="flex items-center gap-2 text-pharaoh-ivory text-sm">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
              {t('iAgree')}
            </label>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4">
            {paymentMethods.length === 0 && (
              <p className="text-pharaoh-ivory/60">{t('noPaymentMethods')}</p>
            )}
            {paymentMethods.map((pm) => (
              <label
                key={pm.id}
                className={`flex items-start gap-3 p-4 rounded border cursor-pointer transition-colors ${pm.code === paymentMethod ? 'border-gold bg-gold/10' : 'border-gold/30'}`}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === pm.code}
                  onChange={() => setPaymentMethod(pm.code)}
                  className="accent-gold mt-1"
                />
                <span className="flex-1 text-pharaoh-ivory">
                  {pm.display_name}
                  {pm.details && <span className="block text-pharaoh-ivory/60 text-sm mt-1">{pm.details}</span>}
                </span>
              </label>
            ))}
            {selectedPayment?.requires_screenshot && (
              <div className="space-y-4">
                {bankDetails && (
                  <div className="border border-gold/30 rounded p-4 text-pharaoh-ivory/80 text-sm whitespace-pre-wrap">
                    {t('bankDetails')}:
                    <p className="mt-1 font-mono">{bankDetails}</p>
                  </div>
                )}
                <div>
                  <label className="block text-pharaoh-ivory mb-2">
                    {t('paymentScreenshot')}
                    <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => setPaymentScreenshot(e.target.files?.[0] ?? null)}
                    className="w-full text-pharaoh-ivory"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {step === 6 && (
          <div className="space-y-3 text-pharaoh-ivory">
            <p><strong className="text-gold">{t('review.route')}:</strong> {pickupName || '—'} → {dropoffName || '—'}</p>
            <p><strong className="text-gold">{t('review.datetime')}:</strong> {tripDate} {tripTime} {meridiem} (Cairo)</p>
            <p><strong className="text-gold">{t('review.car')}:</strong> {selectedCar ? carName(selectedCar) : ''}</p>
            <p><strong className="text-gold">{t('review.passengers')}:</strong> {passengers} / <strong>{t('review.luggage')}:</strong> {luggage}</p>
            <p><strong className="text-gold">{t('review.price')}:</strong> {priceForCar(carId) != null ? `${priceForCar(carId)} ${activeCurrency}` : t('priceOnApproval')}</p>
            <p><strong className="text-gold">{t('review.payment')}:</strong> {selectedPayment?.display_name ?? paymentMethod}</p>
            <p><strong className="text-gold">{t('review.client')}:</strong> {clientName} ({clientEmail})</p>
            {error && <p className="text-red-400 text-sm">{error}</p>}
          </div>
        )}

        {step === 6 && TURNSTILE_SITE_KEY && (
          <div className="mt-6">
            <Turnstile siteKey={TURNSTILE_SITE_KEY} onToken={setTurnstileToken} />
          </div>
        )}

        {step === 7 && (
          <div className="text-center space-y-4">
            <h3 className="text-2xl font-cinzel text-gold">{t('submitted')}</h3>
            <p className="text-pharaoh-ivory">{t('referenceNumber')}</p>
            <p className="text-3xl font-bold text-gold">{bookingRef}</p>
            <p className="text-pharaoh-ivory/70 text-sm">{t('waitingApproval')}</p>
          </div>
        )}
      </motion.div>

      {step < 7 && (
        <div className="flex justify-between mt-8">
          <button
            onClick={prevStep}
            disabled={step === 0}
            className="flex items-center gap-2 px-6 py-3 border border-gold text-gold rounded hover:bg-gold hover:text-black transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={20} /> {t('previous')}
          </button>
          {step < 6 ? (
            <button
              onClick={nextStep}
              className="flex items-center gap-2 px-6 py-3 bg-gold text-black rounded hover:bg-gold-light transition-colors"
            >
              {t('next')} <ChevronRight size={20} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting || !consent}
              className="flex items-center gap-2 px-6 py-3 bg-gold text-black rounded hover:bg-gold-light transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {submitting ? t('submitting') : t('submitBooking')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
