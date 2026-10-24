import type { Metadata } from "next";
import { Cinzel_Decorative, Cinzel, Inter, Cairo, Playfair_Display } from "next/font/google";
import { getLocale } from 'next-intl/server';
import { CurrencyProvider } from '@/lib/currency/CurrencyContext';
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
        <CurrencyProvider>{children}</CurrencyProvider>
      </body>
    </html>
  );
}
