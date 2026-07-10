import type { Metadata } from 'next';
import { Public_Sans } from 'next/font/google';
import './globals.css';
import SessionWrapper from '@/components/SessionWrapper';
import VirtualAssistant from '@/components/VirtualAssistant';
import { ThemeProvider } from '@/components/ThemeProvider';
import { ToastProvider } from '@/components/Toast';


const publicSans = Public_Sans({ 
  subsets: ['latin'],
  variable: '--font-public-sans',
});

export const metadata: Metadata = {
  title: {
    default: 'KU Wellness | Kenyatta University Counseling',
    template: '%s | KU Wellness'
  },
  description: 'The official digital wellness platform for Kenyatta University. Access professional academic, career, and mental health support services.',
  keywords: ['Kenyatta University', 'KU', 'Counseling', 'Mental Health', 'Student Wellness', 'Kenya', 'KU Wellness'],
  authors: [{ name: 'KU Wellness Team' }],
  openGraph: {
    type: 'website',
    locale: 'en_KE',
    url: 'https://wellness.ku.ac.ke',
    siteName: 'KU Wellness',
    title: 'KU Wellness — Student Support Platform',
    description: 'Book sessions, manage appointments, and access mental health resources at Kenyatta University.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'KU Wellness',
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
    <html lang="en" suppressHydrationWarning className={`${publicSans.variable}`}>
      <body className="font-sans" suppressHydrationWarning>
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
