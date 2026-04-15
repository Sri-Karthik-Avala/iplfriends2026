import './globals.css';
import Link from 'next/link';
import { Playfair_Display, Inter } from 'next/font/google';
import { themeInitScript } from '@/lib/theme';

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['700', '900'],
  style: ['normal', 'italic'],
  variable: '--font-display',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata = {
  title: 'IPL Friends League',
  description: 'Fantasy sports-style leaderboard for Dream11',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <nav style={{ padding: '1rem 2rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <h2 style={{ color: 'var(--gold)', margin: 0, fontSize: '1.5rem', fontFamily: 'var(--font-display)' }}>
              🏆 IPL FRIENDS
            </h2>
          </Link>
          <div>
            <Link href="/" style={{ marginRight: '1.5rem', fontWeight: 600, color: 'var(--fg-body)' }}>Leaderboard</Link>
            <Link href="/admin" style={{ fontWeight: 600, color: 'var(--fg-muted)' }}>Admin Panel</Link>
          </div>
        </nav>
        <main>{children}</main>
      </body>
    </html>
  );
}
