import './globals.css';
import { Playfair_Display, Inter } from 'next/font/google';
import { themeInitScript } from '@/lib/theme';
import Nav from './components/Nav';
import TricolorStripe from './components/TricolorStripe';

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
        <Nav />
        <TricolorStripe />
        <main>{children}</main>
      </body>
    </html>
  );
}
