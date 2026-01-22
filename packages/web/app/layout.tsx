// RootLayout.tsx
import './globals.css';
import './introjs-custom.css';
import 'intro.js/introjs.css';
import { Inter } from 'next/font/google';
import Navbar from './lib/components/navbar';
import { NextAppDirEmotionCacheProvider } from 'tss-react/next/appDir';
import { Toaster } from '@/components/ui/sonner';
import { GoogleMapsProvider } from './lib/utils/GoogleMapsContext';
import QueryProvider from './lib/providers/QueryProvider';
import { AuthProvider } from './lib/components/AuthProvider';

const inter = Inter({ subsets: ['latin'] });

import { ReactNode } from 'react';

type RootLayoutProps = {
  children: ReactNode;
};

const RootLayout: React.FC<RootLayoutProps> = ({ children }) => {
  return (
    <html lang='en'>
      <head />
      <body className='flex h-screen flex-col'>
        <QueryProvider>
          <AuthProvider>
            <GoogleMapsProvider>
              <Navbar />
              <div className='flex-grow overflow-y-auto scroll-smooth'>
                <NextAppDirEmotionCacheProvider options={{ key: 'css' }}>
                  {children}
                </NextAppDirEmotionCacheProvider>
              </div>
              <Toaster />
            </GoogleMapsProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
};

export default RootLayout;
