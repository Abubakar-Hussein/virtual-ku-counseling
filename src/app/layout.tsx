import type { Metadata } from 'next';
import './globals.css';
import SessionWrapper from '@/components/SessionWrapper';
import VirtualAssistant from '@/components/VirtualAssistant';

export const metadata: Metadata = {
  title: 'KU Counseling — Kenyatta University',
  description: 'Book counseling sessions with KU counselors. Academic, career, and mental health support for Kenyatta University students.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SessionWrapper>
          {children}
          <VirtualAssistant />
        </SessionWrapper>
      </body>
    </html>
  );
}
