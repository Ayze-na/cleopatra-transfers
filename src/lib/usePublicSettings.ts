'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

export interface PublicSettings {
  whatsapp_number?: string;
  contact_email?: string;
  contact_phone?: string;
}

export function usePublicSettings(): PublicSettings {
  const [settings, setSettings] = useState<PublicSettings>({});

  useEffect(() => {
    let active = true;
    supabase
      .from('settings')
      .select('key, value')
      .in('key', ['whatsapp_number', 'contact_email', 'contact_phone'])
      .then(({ data }) => {
        if (!active || !data) return;
        const result: PublicSettings = {};
        for (const row of data as { key: string; value: unknown }[]) {
          const value = typeof row.value === 'string' ? row.value : String(row.value ?? '');
          if (row.key === 'whatsapp_number') result.whatsapp_number = value;
          if (row.key === 'contact_email') result.contact_email = value;
          if (row.key === 'contact_phone') result.contact_phone = value;
        }
        setSettings(result);
      });
    return () => {
      active = false;
    };
  }, []);

  return settings;
}
