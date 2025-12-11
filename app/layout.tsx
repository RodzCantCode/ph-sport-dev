import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import './globals.css';
import { LayoutWrapper } from './layout-wrapper';
import { ThemeProvider } from '@/components/providers/theme-provider';

import { AuthProvider } from '@/lib/auth/auth-context';

const outfit = Outfit({ 
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'PH Sport',
  description: 'Plataforma de gestión para equipo de diseño',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${outfit.className} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <AuthProvider>
            <LayoutWrapper>{children}</LayoutWrapper>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}