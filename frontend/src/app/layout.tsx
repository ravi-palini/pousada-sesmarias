import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Pousada Sesmarias - Sistema de Gestão',
  description: 'Sistema de Gestão Hoteleira e Recepção - Pousada Sesmarias (Lavras Novas, MG)',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="h-full">
      <body className="h-full antialiased bg-[#f8faf7] text-[#1c2e24]">
        {children}
      </body>
    </html>
  );
}
