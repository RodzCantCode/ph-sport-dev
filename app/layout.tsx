import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import Link from 'next/link';
import './globals.css';

const poppins = Poppins({ 
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
});

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
      <body className={poppins.className}>
        <header className="glass-effect-strong sticky top-0 z-50 w-full border-b border-orange-200/30">
          <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
            <Link 
              href="/" 
              className="text-xl font-bold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent hover:from-orange-700 hover:to-orange-600 transition-all duration-300"
            >
              PH Sport
            </Link>
            <div className="flex items-center gap-6 text-sm font-medium">
              <Link 
                href="/dashboard" 
                className="text-gray-700 hover:text-orange-600 transition-colors duration-200 relative group"
              >
                Dashboard
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-orange-500 transition-all duration-300 group-hover:w-full"></span>
              </Link>
              <Link 
                href="/designs" 
                className="text-gray-700 hover:text-orange-600 transition-colors duration-200 relative group"
              >
                Diseños
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-orange-500 transition-all duration-300 group-hover:w-full"></span>
              </Link>
              <Link 
                href="/my-week" 
                className="text-gray-700 hover:text-orange-600 transition-colors duration-200 relative group"
              >
                Mi semana
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-orange-500 transition-all duration-300 group-hover:w-full"></span>
              </Link>
              <Link 
                href="/login" 
                className="text-gray-700 hover:text-orange-600 transition-colors duration-200 relative group"
              >
                Login
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-orange-500 transition-all duration-300 group-hover:w-full"></span>
              </Link>
            </div>
          </nav>
        </header>
        <main className="animate-page-enter">{children}</main>
      </body>
    </html>
  );
}