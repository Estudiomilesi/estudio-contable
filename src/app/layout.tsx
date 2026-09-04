import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Sidebar from '@/components/Sidebar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Estudio Contable - Gestión',
  description: 'Sistema de gestión de abonos, tesorería y reportes',
};

import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let userRole = 'COLLABORATOR';
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (token) {
    try {
      const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'super-secret-key-for-development-only-12345');
      const { payload } = await jwtVerify(token, JWT_SECRET);
      if (payload.role) {
        userRole = payload.role as string;
      }
    } catch (e) {
      // invalid token, ignore
    }
  }

  return (
    <html lang="es">
      <body className={`${inter.className} flex h-screen bg-gray-50 text-gray-900`}>
        <Sidebar userRole={userRole} />
        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>
      </body>
    </html>
  );
}
