'use client';
import Link from 'next/link';
import { ThemeToggle } from '@/components/ThemeToggle';
import Logo from '@/components/Logo';

export default function PrivacyPolicyPage() {
  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg-main)', color: 'var(--text-primary)' }}>
      {/* Navbar */}
      <nav style={{
        height: 80,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 5vw',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-main)'
      }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
          <Logo size={40} />
          <span style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--text-primary)' }}>KU Wellness</span>
        </Link>
        <ThemeToggle />
      </nav>

      <div style={{ padding: '60px 5vw', maxWidth: '800px', margin: '0 auto' }}>
        <Link href="/" style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '8px',
          color: 'var(--text-secondary)',
          textDecoration: 'none',
          marginBottom: '40px',
          fontWeight: 500,
          transition: 'color 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
        >
          <span>&larr;</span> Back to Home
        </Link>
        
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '24px' }}>Privacy Policy</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '40px', fontSize: '0.9rem' }}>Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '36px', lineHeight: 1.7 }}>
          <section>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '12px' }}>1. Information We Collect</h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              We collect information that you provide directly to us when you register for an account, book an appointment, or communicate with our counseling services. This may include your name, student ID, email address, phone number, and any information you choose to share during your counseling sessions.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '12px' }}>2. How We Use Your Information</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '12px' }}>
              We use the information we collect to:
            </p>
            <ul style={{ color: 'var(--text-secondary)', listStyleType: 'disc', paddingLeft: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li>Provide, maintain, and improve our counseling services.</li>
              <li>Process and manage your appointments.</li>
              <li>Communicate with you regarding your sessions, including sending reminders and updates.</li>
              <li>Ensure the safety and well-being of our students.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '12px' }}>3. Data Security & Confidentiality</h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              Your privacy and confidentiality are of utmost importance to us. All counseling records and communications are strictly confidential and are maintained securely. Information will not be shared with anyone outside the Student Well-being Center without your explicit written consent, except where required by law or in situations where there is a clear and imminent danger to yourself or others.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '12px' }}>4. Data Retention</h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              We retain your personal information and counseling records for as long as necessary to fulfill the purposes for which it was collected and to comply with applicable legal and ethical standards.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '12px' }}>5. Contact Us</h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              If you have any questions about this Privacy Policy or our data practices, please contact the Student Well-being Center or your designated counselor.
            </p>
          </section>
        </div>
      </div>
      
      {/* Footer */}
      <footer style={{ padding: '40px 5vw', borderTop: '1px solid var(--border)', textAlign: 'center', marginTop: '60px' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>© {new Date().getFullYear()} Kenyatta University — Student Well-being Center</p>
      </footer>
    </main>
  );
}
