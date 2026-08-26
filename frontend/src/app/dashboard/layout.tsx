'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/navigation';
import { usePathname, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import {
  LayoutDashboard,
  BedDouble,
  Users,
  CalendarCheck,
  LogOut,
  Hotel,
  Menu,
  X,
  UserCheck,
} from 'lucide-react';

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Busca dados da sessão do usuário autenticado via cookie HttpOnly
  useEffect(() => {
    let isMounted = true;
    api
      .get('/api/auth/me')
      .then((res) => {
        if (isMounted && res.data?.user) {
          setUser(res.data.user);
        }
      })
      .catch(() => {
        // Interceptor do axios ou redirecionamento em caso de falha
        router.push('/login');
      });

    return () => {
      isMounted = false;
    };
  }, [router]);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await api.post('/api/auth/logout');
      router.push('/login');
    } catch {
      router.push('/login');
    }
  };

  const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Quartos', href: '/dashboard/quartos', icon: BedDouble },
    { label: 'Hóspedes', href: '/dashboard/hospedes', icon: Users },
    { label: 'Reservas', href: '/dashboard/reservas', icon: CalendarCheck },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#f5f8f5]">
      {/* Mobile Top Bar */}
      <header className="md:hidden flex items-center justify-between px-4 py-3.5 bg-[#24583b] text-white shadow-md">
        <div className="flex items-center gap-3">
          <Hotel className="w-7 h-7" />
          <span className="font-extrabold text-lg tracking-wide">Pousada Sesmarias</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg bg-[#1b442d] hover:bg-[#153623] focus:outline-none"
          aria-label={mobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Sidebar de Navegação */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 bg-[#1f4a32] text-white flex flex-col justify-between transition-transform duration-300 ease-in-out md:static md:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Topo da Sidebar: Identidade Visual */}
        <div>
          <div className="p-6 border-b border-[#2b6545]">
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 bg-[#2d6c4a] rounded-xl text-white shadow-inner">
                <Hotel className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-xl font-bold leading-tight">Pousada Sesmarias</h2>
                <p className="text-xs text-[#a3c9b3] font-medium">Lavras Novas • MG</p>
              </div>
            </div>
          </div>

          {/* Links de Navegação */}
          <nav className="p-4 space-y-2" aria-label="Navegação Principal">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <button
                  key={item.label}
                  onClick={() => {
                    setMobileMenuOpen(false);
                    router.push(item.href);
                  }}
                  className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl font-bold text-base transition-all text-left cursor-pointer ${
                    isActive
                      ? 'bg-white text-[#1f4a32] shadow-md'
                      : 'text-[#d8ebd8] hover:bg-[#285e3f] hover:text-white'
                  }`}
                >
                  <Icon className={`w-6 h-6 shrink-0 ${isActive ? 'text-[#1f4a32]' : 'text-[#a3c9b3]'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Rodapé da Sidebar: Usuário Logado e Logout */}
        <div className="p-4 border-t border-[#2b6545] space-y-3 bg-[#193d29]">
          {user && (
            <div className="flex items-center gap-3 px-2 py-1.5">
              <div className="w-10 h-10 rounded-full bg-[#2d6c4a] flex items-center justify-center text-white font-bold shrink-0">
                <UserCheck className="w-5 h-5 text-[#b9ddc7]" />
              </div>
              <div className="truncate">
                <p className="text-sm font-bold text-white truncate">{user.name}</p>
                <p className="text-xs text-[#a3c9b3] truncate">{user.role} • {user.email}</p>
              </div>
            </div>
          )}

          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl font-bold text-sm bg-[#b43e3e] hover:bg-[#993232] active:bg-[#802727] text-white transition-colors shadow-sm cursor-pointer disabled:opacity-50"
          >
            <LogOut className="w-4 h-4" />
            <span>{isLoggingOut ? 'Saindo...' : 'Sair do Sistema'}</span>
          </button>
        </div>
      </aside>

      {/* Overlay para Mobile */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
        />
      )}

      {/* Conteúdo Principal */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Desktop */}
        <header className="hidden md:flex items-center justify-between px-8 py-4 bg-white border-b border-[#e2ece2] shadow-xs">
          <div>
            <span className="text-xs font-semibold text-[#5c7264] uppercase tracking-wider">
              Painel de Operações da Pousada
            </span>
            <h1 className="text-lg font-bold text-[#1c2e24]">
              Gestão Diária de Hospedagem
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#e8f5e8] text-[#24583b] border border-[#cfe6cf]">
              <span className="w-2 h-2 rounded-full bg-[#24583b] animate-pulse"></span>
              Sistema Operando
            </span>
          </div>
        </header>

        {/* Área de Visualização da Rota */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

