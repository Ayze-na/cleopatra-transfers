import {NextResponse} from 'next/server';
import createMiddleware from 'next-intl/middleware';
import {routing} from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

export default async function middleware(request: Parameters<typeof intlMiddleware>[0]) {
  const response = intlMiddleware(request);

  const setCookie = response.headers.get('set-cookie');
  if (setCookie) {
    response.headers.set(
      'set-cookie',
      setCookie
        .split(/,(?=[^;]*=)/)
        .map((cookie) => {
          const parts = cookie.split(';').map((s) => s.trim());
          if (!/^NEXT_LOCALE=/i.test(parts[0])) return parts.join('; ');
          const attrs = parts.filter((p, i) => i > 0 && !/^(Secure|HttpOnly|SameSite=)/i.test(p));
          return [parts[0], ...attrs, 'Secure', 'HttpOnly', 'SameSite=Lax'].join('; ');
        })
        .join(', ')
    );
  }

  return response;
}

export const config = {
  matcher: ['/', '/(en|ar|ru|de)/:path*']
};
