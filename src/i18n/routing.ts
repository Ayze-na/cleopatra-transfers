import {defineRouting} from 'next-intl/routing';
import {createSharedPathnamesNavigation} from 'next-intl/navigation';

export const routing = defineRouting({
  locales: ['en', 'ar', 'ru', 'de'],
  defaultLocale: 'en'
});

export const {Link, redirect, usePathname, useRouter} = createSharedPathnamesNavigation(routing);
