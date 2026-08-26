'use client';

import React from 'react';
import useSWR from 'swr';
import { api } from '@/lib/api';
import {
  CalendarCheck,
  BedDouble,
  Clock,
  PlusCircle,
  Users,
  HelpCircle,
  LogIn,
  LogOut,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';

interface Room {
  id: string;
  status: string;
}

interface Reservation {
  id: string;
  status: string;
  check_in: string;
  check_out: string;
}

const roomsFetcher = (url: string) => api.get(url).then((res) => res.data.rooms);
const reservationsFetcher = (url: string) => api.get(url).then((res) => res.data.reservations);

export default function DashboardPage() {
  const currentDate = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  const { data: rooms } = useSWR<Room[]>('/api/rooms', roomsFetcher);
  const { data: reservations } = useSWR<Reservation[]>('/api/reservations', reservationsFetcher);

  const totalRooms = rooms ? rooms.length : 0;
  const occupiedRooms = rooms ? rooms.filter((r) => r.status === 'OCCUPIED').length : 0;
  const pendingReservations = reservations
    ? reservations.filter((r) => r.status === 'PENDING').length
    : 0;

  const todayStr = new Date().toISOString().split('T')[0];
  const todayCheckins = reservations
    ? reservations.filter(
        (r) =>
          (r.status === 'CONFIRMED' || r.status === 'PENDING') &&
          r.check_in.split('T')[0] === todayStr
      ).length
    : 0;

  return (
    <div className="space-y-8">
      {/* Bloco de Boas-Vindas */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#dce8dc] shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="inline-block px-3 py-1 bg-[#eef6ee] text-[#24583b] text-xs font-bold rounded-full border border-[#d2e6d2] mb-2 capitalize">
              📅 {currentDate}
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1c2e24]">
              Bem-vindo à Pousada Sesmarias!
            </h2>
            <p className="text-[#52685a] text-sm sm:text-base mt-1">
              Painel de controle e visão geral das operações da pousada em Lavras Novas.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/reservas"
              className="flex items-center gap-2 px-5 py-3.5 bg-[#24583b] hover:bg-[#1b442d] text-white font-bold text-base rounded-2xl shadow-md transition-all cursor-pointer"
            >
              <PlusCircle className="w-5 h-5" />
              <span>Nova Reserva</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 3 Cards de Resumo Principais */}
      <section aria-label="Resumo do Dia">
        <h3 className="text-lg font-bold text-[#1c2e24] mb-4">
          Resumo Operacional de Hoje
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: Check-ins de hoje */}
          <Link
            href="/dashboard/reservas"
            className="bg-white rounded-3xl p-6 border-2 border-[#dce8dc] hover:border-[#24583b] shadow-sm flex flex-col justify-between transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-[#52685a] uppercase tracking-wide">
                Check-ins de Hoje
              </span>
              <div className="p-3 bg-[#eef6ee] rounded-2xl text-[#24583b] group-hover:bg-[#24583b] group-hover:text-white transition-colors">
                <CalendarCheck className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-4xl font-extrabold text-[#1c2e24]">{todayCheckins}</div>
              <p className="text-xs font-medium text-[#738a7b] mt-1">
                {todayCheckins === 0
                  ? 'Nenhum check-in previsto para hoje'
                  : `${todayCheckins} chegada(s) prevista(s)`}
              </p>
            </div>
          </Link>

          {/* Card 2: Quartos Ocupados */}
          <Link
            href="/dashboard/quartos"
            className="bg-white rounded-3xl p-6 border-2 border-[#dce8dc] hover:border-[#925528] shadow-sm flex flex-col justify-between transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-[#52685a] uppercase tracking-wide">
                Quartos Ocupados
              </span>
              <div className="p-3 bg-[#fdf3e7] rounded-2xl text-[#925528] group-hover:bg-[#925528] group-hover:text-white transition-colors">
                <BedDouble className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-4xl font-extrabold text-[#1c2e24]">
                {occupiedRooms} <span className="text-2xl font-normal text-gray-400">/ {totalRooms}</span>
              </div>
              <p className="text-xs font-medium text-[#738a7b] mt-1">
                {totalRooms - occupiedRooms} quarto(s) livre(s) para hospedagem
              </p>
            </div>
          </Link>

          {/* Card 3: Reservas Pendentes */}
          <Link
            href="/dashboard/reservas"
            className="bg-white rounded-3xl p-6 border-2 border-[#dce8dc] hover:border-[#9a7818] shadow-sm flex flex-col justify-between transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-[#52685a] uppercase tracking-wide">
                Reservas Pendentes
              </span>
              <div className="p-3 bg-[#fef9e7] rounded-2xl text-[#9a7818] group-hover:bg-[#9a7818] group-hover:text-white transition-colors">
                <Clock className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-4xl font-extrabold text-[#1c2e24]">{pendingReservations}</div>
              <p className="text-xs font-medium text-[#738a7b] mt-1">
                {pendingReservations === 0
                  ? 'Nenhuma reserva aguardando confirmação'
                  : 'Necessita atenção da recepção'}
              </p>
            </div>
          </Link>
        </div>
      </section>

      {/* Seção de Ações Rápidas */}
      <section aria-label="Ações Rápidas">
        <h3 className="text-lg font-bold text-[#1c2e24] mb-4">
          Ações Rápidas da Recepção
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link
            href="/dashboard/quartos"
            className="flex items-center gap-4 p-5 bg-white rounded-2xl border-2 border-[#dce8dc] hover:border-[#24583b] hover:bg-[#f3f8f3] text-left transition-all group shadow-xs cursor-pointer"
          >
            <div className="p-3.5 bg-[#eef6ee] group-hover:bg-[#24583b] group-hover:text-white rounded-xl text-[#24583b] transition-colors">
              <BedDouble className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold text-base text-[#1c2e24]">Mapa de Quartos</p>
              <p className="text-xs text-[#52685a]">Ver status dos chalés e acomodações</p>
            </div>
          </Link>

          <Link
            href="/dashboard/hospedes"
            className="flex items-center gap-4 p-5 bg-white rounded-2xl border-2 border-[#dce8dc] hover:border-[#24583b] hover:bg-[#f3f8f3] text-left transition-all group shadow-xs cursor-pointer"
          >
            <div className="p-3.5 bg-[#eef6ee] group-hover:bg-[#24583b] group-hover:text-white rounded-xl text-[#24583b] transition-colors">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold text-base text-[#1c2e24]">Ficha de Hóspedes</p>
              <p className="text-xs text-[#52685a]">Localizar cadastros e documentos</p>
            </div>
          </Link>

          <Link
            href="/dashboard/reservas"
            className="flex items-center gap-4 p-5 bg-white rounded-2xl border-2 border-[#dce8dc] hover:border-[#24583b] hover:bg-[#f3f8f3] text-left transition-all group shadow-xs cursor-pointer"
          >
            <div className="p-3.5 bg-[#eef6ee] group-hover:bg-[#24583b] group-hover:text-white rounded-xl text-[#24583b] transition-colors">
              <CalendarCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold text-base text-[#1c2e24]">Check-in / Check-out</p>
              <p className="text-xs text-[#52685a]">Registrar entrada ou saída de hóspedes</p>
            </div>
          </Link>
        </div>
      </section>

      {/* Cartão de Dica / Apoio Operacional */}
      <div className="bg-[#f0f6f0] rounded-2xl p-5 border border-[#d2e6d2] flex items-start gap-3.5">
        <HelpCircle className="w-6 h-6 text-[#24583b] shrink-0 mt-0.5" />
        <div className="text-sm text-[#2c4736]">
          <p className="font-bold">Dica da Recepção:</p>
          <p className="mt-0.5">
            Ao realizar um <strong>Check-in</strong>, o quarto correspondente é automaticamente atualizado para <strong>Ocupado</strong>. Ao registrar um <strong>Check-out</strong>, o quarto é encaminhado automaticamente para <strong>Em Limpeza</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}
