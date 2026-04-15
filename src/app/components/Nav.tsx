// src/app/components/Nav.tsx
import Link from 'next/link';
import ThemeToggle from './ThemeToggle';

export default function Nav() {
  return (
    <header className="site-nav">
      <div className="site-nav-inner">
        <Link href="/" className="site-logo">
          <span className="site-logo-dot" aria-hidden="true" />
          Friends XI
        </Link>
        <nav className="site-nav-links" aria-label="Primary">
          <Link href="/admin" className="site-nav-link">Admin</Link>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
