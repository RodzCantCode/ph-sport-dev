import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import './globals.css';
import { LayoutWrapper } from './layout-wrapper';

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
    <html lang="es">
      <body className={outfit.className}>
        <LayoutWrapper>{children}</LayoutWrapper>
      </body>
    </html>
  );
}