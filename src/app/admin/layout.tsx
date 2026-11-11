import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin — Skills Saloon',
  robots: { index: false, follow: false }, // keep admin pages out of Google
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-dvh bg-paper">{children}</div>;
}
