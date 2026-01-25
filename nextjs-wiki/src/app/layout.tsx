import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { MediaPlayerProvider } from '@/components/MediaPlayer/MediaPlayerProvider';
import MediaPlayer from '@/components/MediaPlayer/MediaPlayer';
import Sidebar from '@/components/Sidebar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Audio / Recording / Sounds / Technology',
  description: 'Field recording, sound design, and audio technology wiki',
  keywords: ['audio', 'recording', 'field recording', 'sound design', 'foley'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <MediaPlayerProvider>
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 p-8 lg:ml-64">
              <div className="max-w-4xl mx-auto">
                {children}
              </div>
            </main>
          </div>
          <MediaPlayer />
        </MediaPlayerProvider>
      </body>
    </html>
  );
}
