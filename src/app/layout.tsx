import type { Metadata } from 'next';
import { Newsreader, Public_Sans } from 'next/font/google';
import './globals.css';
import SessionWrapper from '@/components/SessionWrapper';
import VirtualAssistant from '@/components/VirtualAssistant';
import { ThemeProvider } from '@/components/ThemeProvider';
import { ToastProvider } from '@/components/Toast';

const newsreader = Newsreader({ 
  subsets: ['latin'],
  variable: '--font-newsreader',
});

const publicSans = Public_Sans({ 
  subsets: ['latin'],
  variable: '--font-public-sans',
});

export const metadata: Metadata = {
  title: {
    default: 'KU Wellness System | Kenyatta University Counseling',
    template: '%s | KU Wellness System'
  },
  description: 'The official digital wellness platform for Kenyatta University. Access professional academic, career, and mental health support services.',
  keywords: ['Kenyatta University', 'KU', 'Counseling', 'Mental Health', 'Student Wellness', 'Kenya', 'Wellness System'],
  authors: [{ name: 'KU Wellness Team' }],
  openGraph: {
    type: 'website',
    locale: 'en_KE',
    url: 'https://wellness.ku.ac.ke',
    siteName: 'KU Wellness System',
    title: 'KU Wellness System — Student Support Platform',
    description: 'Book sessions, manage appointments, and access mental health resources at Kenyatta University.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'KU Wellness System',
      },
    ],
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#006633' },
    { media: '(prefers-color-scheme: dark)', color: '#1a1a1a' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${newsreader.variable} ${publicSans.variable}`}>
      <body className="font-sans">
        <SessionWrapper>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <ToastProvider>
              {children}
              <VirtualAssistant />
            </ToastProvider>
          </ThemeProvider>
        </SessionWrapper>
      </body>
    </html>
  );
}
