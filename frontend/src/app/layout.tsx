import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { AuthGuard } from '@/src/components/auth';
import { AuthProvider } from '@/src/contexts/AuthContext';
import { CurrencyProvider } from '@/src/contexts/CurrencyContext';
import { NotificationProvider } from '@/src/contexts/NotificationContext';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'BizTrack - Project Management System',
  description:
    'Professional project management and team collaboration platform',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <AuthProvider>
          <CurrencyProvider>
            <NotificationProvider>
              <AuthGuard>{children}</AuthGuard>
            </NotificationProvider>
          </CurrencyProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
