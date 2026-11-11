import type { Metadata, Viewport } from 'next';
import '@fontsource/playfair-display/400.css';
import '@fontsource/playfair-display/500.css';
import '@fontsource/playfair-display/600.css';
import '@fontsource/playfair-display/700.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import './globals.css';

/* Self-hosted fonts (installed via npm — no build-time network needed).
   The CSS variables map to the Tailwind font-serif / font-sans utilities. */

export const metadata: Metadata = {
  title: 'Skills Saloon — Cut · Style · Repeat',
  description:
    'The digital menu of Skills Saloon, a premium unisex salon. Browse services, prices and live offers.',
};

export const viewport: Viewport = {
  themeColor: '#111111',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh font-sans">{children}</body>
    </html>
  );
}
