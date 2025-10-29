import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
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
            <a href="/" className="text-sm font-semibold">PH Sport</a>
            <div className="flex items-center gap-4 text-sm text-gray-700">
              <a href="/dashboard" className="hover:text-black">Dashboard</a>
              <a href="/designs" className="hover:text-black">Diseños</a>
              <a href="/my-week" className="hover:text-black">Mi semana</a>
              <a href="/login" className="hover:text-black">Login</a>
            </div>
          </nav>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}