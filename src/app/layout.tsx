import type { Metadata } from "next";
import { Cinzel_Decorative, Cinzel, Inter, Cairo, Playfair_Display } from "next/font/google";
import { getLocale } from 'next-intl/server';
import { CurrencyProvider } from '@/lib/currency/CurrencyContext';
import PwaRegistrar from '@/components/PwaRegistrar';
import "./globals.css";

const cinzelDecorative = Cinzel_Decorative({
  weight: ["400", "700", "900"],
  subsets: ["latin"],
  variable: "--font-cinzel-decorative",
});

const cinzel = Cinzel({
  weight: ["400", "600", "700"],
  subsets: ["latin"],
  variable: "--font-cinzel",
});

const playfair = Playfair_Display({
  weight: ["700"],
  subsets: ["latin", "cyrillic"],
  variable: "--font-playfair",
});

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
});

const cairo = Cairo({
  subsets: ["latin", "arabic"],
  variable: "--font-cairo",
});

export const metadata: Metadata = {
  title: "Cleopatra Transfers | Luxury Transfers in Egypt",
  description: "Private car transfers in Hurghada, Aswan, Luxor & Marsa Alam. Direct rides & custom trip files.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Cleopatra Transfers",
  },
  icons: {
    icon: [
      { url: "/icons/favicon-64.png", sizes: "64x64", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/icons/apple-touch-icon.png",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const dir = locale === 'ar' ? 'rtl' : 'ltr';
  return (
    <html lang={locale} dir={dir}>
      <body className={`${cinzelDecorative.variable} ${cinzel.variable} ${playfair.variable} ${inter.variable} ${cairo.variable} font-inter antialiased`}>
        <CurrencyProvider>
          <PwaRegistrar />
          {children}
        </CurrencyProvider>
      </body>
    </html>
  );
}
