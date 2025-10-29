import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Link from 'next/link';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'PH Sport Dashboard',
  description: 'Dashboard para equipo de diseño',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <header className="w-full border-b bg-white">
          <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
            <Link href="/" className="text-sm font-semibold">PH Sport</Link>
            <div className="flex items-center gap-4 text-sm text-gray-700">
              <Link href="/dashboard" className="hover:text-black">Dashboard</Link>
              <Link href="/designs" className="hover:text-black">Diseños</Link>
              <Link href="/my-week" className="hover:text-black">Mi semana</Link>
              <Link href="/login" className="hover:text-black">Login</Link>
            </div>
          </nav>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}