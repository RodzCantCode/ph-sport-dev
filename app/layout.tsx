import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import './globals.css';
import { LayoutWrapper } from './layout-wrapper';
import { ThemeProvider } from '@/components/providers/theme-provider';

const outfit = Outfit({ 
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
    <html lang="es" suppressHydrationWarning>
      <body className={outfit.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <LayoutWrapper>{children}</LayoutWrapper>
        </ThemeProvider>
      </body>
    </html>
  );
}