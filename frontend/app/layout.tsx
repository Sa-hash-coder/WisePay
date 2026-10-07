import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';

export const metadata: Metadata = {
  title: 'WisePay — AP Risk Intelligence & Exception Engine',
  description: 'Autonomous Accounts Payable Risk Intelligence, exception triage, and immutable cryptographic audit ledger.',
  icons: {
    icon: '/icon.png',
    shortcut: '/icon.png',
    apple: '/icon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#F3F8F4] text-[#0F172A] antialiased selection:bg-[#E8F8EE] selection:text-[#16A34A]">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
