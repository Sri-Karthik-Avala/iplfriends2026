import './globals.css';

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
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;900&family=UnifrakturMaguntia&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <nav style={{ padding: '1rem 2rem', background: 'var(--panel-bg)', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ color: 'var(--neon-blue)', margin: 0, fontSize: '1.5rem', fontFamily: 'Outfit, sans-serif' }}>
            🏆 IPL FRIENDS
          </h2>
          <div>
            <a href="/" style={{ marginRight: '1.5rem', fontWeight: 600, color: 'var(--text-main)', transition: 'color 0.3s' }}>Leaderboard</a>
            <a href="/admin" style={{ fontWeight: 600, color: 'var(--text-muted)', transition: 'color 0.3s' }}>Admin Panel</a>
          </div>
        </nav>
        <main>{children}</main>
      </body>
    </html>
  );
}
