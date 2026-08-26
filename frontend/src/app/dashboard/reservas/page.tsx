'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import { api } from '@/lib/api';
import {
  CalendarCheck,
  Plus,
  BedDouble,
  Users,
  DollarSign,
  LogIn,
  LogOut,
  Ban,
  Trash2,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Clock,
  Calendar,
  Sparkles,
  Receipt,
  RotateCcw,
} from 'lucide-react';

interface Room {
  id: string;
  number: string;
  name: string | null;
  category: string | null;
  capacity: number;
  daily_rate: number | string;
  status: string;
}

interface Guest {
  id: string;
  name: string;
  document: string;
  phone: string | null;
  email: string | null;
}

interface Reservation {
  id: string;
  check_in: string;
  check_out: string;
  number_of_guests: number;
  total_price: number | string;
  status: 'PENDING' | 'CONFIRMED' | 'CHECKED_IN' | 'CHECKED_OUT' | 'CANCELLED';
  notes: string | null;
  room_id: string;
  guest_id: string;
  room: Room;
  guest: Guest;
  created_at: string;
}

const fetcher = (url: string) => api.get(url).then((res) => res.data.reservations);
const roomsFetcher = (url: string) => api.get(url).then((res) => res.data.rooms);
const guestsFetcher = (url: string) => api.get(url).then((res) => res.data.guests);

const statusConfig: Record<
  Reservation['status'],
  { label: string; bg: string; text: string; border: string; icon: React.ComponentType<{ className?: string }> }
> = {
  CONFIRMED: {
    label: 'Confirmada',
    bg: 'bg-blue-50',
    text: 'text-blue-800',
    border: 'border-blue-300',
    icon: CalendarCheck,
  },
  PENDING: {
    label: 'Pendente',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-300',
    icon: Clock,
  },
  CHECKED_IN: {
    label: 'Hospedado (Check-in)',
    bg: 'bg-emerald-100',
    text: 'text-emerald-900',
    border: 'border-emerald-400',
    icon: LogIn,
  },
  CHECKED_OUT: {
    label: 'Finalizada (Check-out)',
    bg: 'bg-gray-100',
    text: 'text-gray-800',
    border: 'border-gray-300',
    icon: LogOut,
  },
  CANCELLED: {
    label: 'Cancelada',
    bg: 'bg-rose-50',
    text: 'text-rose-800',
    border: 'border-rose-300',
    icon: Ban,
  },
};

export default function ReservasPage() {
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form State
  const [formState, setFormState] = useState({
    guest_id: '',
    guest_name: '',
    guest_document: '',
    guest_phone: '',
    guest_email: '',
    room_id: '',
    check_in: '',
    check_out: '',
    number_of_guests: 2,
    total_price: '',
    notes: '',
  });

  // User auth state
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; role: string } | null>(null);

  // Payments Modal state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPaymentReserva, setSelectedPaymentReserva] = useState<Reservation | null>(null);
  const [paymentsList, setPaymentsList] = useState<any[]>([]);
  const [financialSummary, setFinancialSummary] = useState<any>(null);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [paymentsError, setPaymentsError] = useState<string | null>(null);

  // Register payment form state
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    payment_method: 'PIX',
    reference: '',
    notes: '',
  });
  const [submittingPayment, setSubmittingPayment] = useState(false);

  // Canceling payment state
  const [cancelingPaymentId, setCancelingPaymentId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelRefund, setCancelRefund] = useState(false);
  const [cancelingPaymentLoading, setCancelingPaymentLoading] = useState(false);

  // Load current user on mount
  React.useEffect(() => {
    api.get('/api/auth/me')
      .then((res) => {
        if (res.data?.user) {
          setCurrentUser(res.data.user);
        }
      })
      .catch(() => {});
  }, []);

  const { data: reservations, error, isLoading, mutate } = useSWR<Reservation[]>(
    '/api/reservations',
    fetcher
  );

  // Payment functions
  const fetchPaymentsForReservation = async (reservationId: string) => {
    try {
      setLoadingPayments(true);
      setPaymentsError(null);
      const res = await api.get(`/api/payments/reservation/${reservationId}`);
      setPaymentsList(res.data.payments || []);
      setFinancialSummary(res.data.financial_summary || null);
      
      const balanceValue = res.data.financial_summary?.balance ?? 0;
      setPaymentForm((prev) => ({
        ...prev,
        amount: balanceValue > 0 ? balanceValue.toFixed(2) : '',
      }));
    } catch (err: any) {
      setPaymentsError(err.response?.data?.message || 'Erro ao carregar pagamentos.');
    } finally {
      setLoadingPayments(false);
    }
  };

  const openPaymentsModal = (reserva: Reservation) => {
    setSelectedPaymentReserva(reserva);
    setIsPaymentModalOpen(true);
    fetchPaymentsForReservation(reserva.id);
  };

  const handleRegisterPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPaymentReserva) return;

    try {
      setSubmittingPayment(true);
      setPaymentsError(null);
      await api.post('/api/payments', {
        reservation_id: selectedPaymentReserva.id,
        amount: Number(paymentForm.amount),
        payment_method: paymentForm.payment_method,
        reference: paymentForm.reference || null,
        notes: paymentForm.notes || null,
      });

      setPaymentForm({
        amount: '',
        payment_method: 'PIX',
        reference: '',
        notes: '',
      });

      await fetchPaymentsForReservation(selectedPaymentReserva.id);
      mutate();
    } catch (err: any) {
      setPaymentsError(err.response?.data?.message || 'Erro ao registrar pagamento.');
    } finally {
      setSubmittingPayment(false);
    }
  };

  const handleCancelPayment = async (paymentId: string) => {
    if (!selectedPaymentReserva) return;

    try {
      setCancelingPaymentLoading(true);
      setPaymentsError(null);
      await api.post(`/api/payments/${paymentId}/cancel`, {
        reason: cancelReason || 'Cancelamento solicitado pelo usuário.',
        refund: cancelRefund,
      });

      setCancelingPaymentId(null);
      setCancelReason('');
      setCancelRefund(false);

      await fetchPaymentsForReservation(selectedPaymentReserva.id);
      mutate();
    } catch (err: any) {
      setPaymentsError(err.response?.data?.message || 'Erro ao estornar/cancelar pagamento.');
    } finally {
      setCancelingPaymentLoading(false);
    }
  };

  const { data: rooms } = useSWR<Room[]>('/api/rooms', roomsFetcher);
  const { data: guests } = useSWR<Guest[]>('/api/guests', guestsFetcher);

  const filteredReservas = reservations
    ? selectedStatusFilter === 'ALL'
      ? reservations
      : reservations.filter((r) => r.status === selectedStatusFilter)
    : [];

  // Atualiza automaticamente o valor total quando quarto ou datas mudam
  const handleRoomOrDateChange = (updates: Partial<typeof formState>) => {
    const updated = { ...formState, ...updates };
    setFormState(updated);

    if (updated.room_id && updated.check_in && updated.check_out && rooms) {
      const selectedRoom = rooms.find((r) => r.id === updated.room_id);
      if (selectedRoom) {
        const inDate = new Date(updated.check_in);
        const outDate = new Date(updated.check_out);
        const diffTime = outDate.getTime() - inDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays > 0) {
          const calculatedTotal = diffDays * Number(selectedRoom.daily_rate);
          setFormState((prev) => ({ ...prev, total_price: calculatedTotal.toFixed(2) }));
        }
      }
    }
  };

  const handleSelectExistingGuest = (guestId: string) => {
    if (!guestId) {
      setFormState((prev) => ({
        ...prev,
        guest_id: '',
        guest_name: '',
        guest_document: '',
        guest_phone: '',
        guest_email: '',
      }));
      return;
    }

    const selected = guests?.find((g) => g.id === guestId);
    if (selected) {
      setFormState((prev) => ({
        ...prev,
        guest_id: selected.id,
        guest_name: selected.name,
        guest_document: selected.document,
        guest_phone: selected.phone || '',
        guest_email: selected.email || '',
      }));
    }
  };

  const handleCheckIn = async (reserva: Reservation) => {
    const confirmed = window.confirm(
      `Confirmar Check-in para o hóspede "${reserva.guest?.name}" no Quarto ${reserva.room.number}?`
    );
    if (!confirmed) return;

    try {
      setActionLoadingId(reserva.id);
      setErrorMessage(null);
      const res = await api.post(`/api/reservations/${reserva.id}/check-in`);
      setSuccessMessage(res.data.message || 'Check-in realizado com sucesso!');
      setTimeout(() => setSuccessMessage(null), 5000);
      mutate();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Erro ao realizar check-in.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCheckOut = async (reserva: Reservation) => {
    const confirmed = window.confirm(
      `Confirmar Check-out para o hóspede "${reserva.guest?.name}"? O Quarto ${reserva.room.number} será encaminhado para limpeza.`
    );
    if (!confirmed) return;

    try {
      setActionLoadingId(reserva.id);
      setErrorMessage(null);
      const res = await api.post(`/api/reservations/${reserva.id}/check-out`);
      setSuccessMessage(res.data.message || 'Check-out realizado com sucesso!');
      setTimeout(() => setSuccessMessage(null), 5000);
      mutate();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Erro ao realizar check-out.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCancelReservation = async (reserva: Reservation) => {
    const confirmed = window.confirm(`Deseja cancelar a reserva de "${reserva.guest?.name}"?`);
    if (!confirmed) return;

    try {
      setActionLoadingId(reserva.id);
      setErrorMessage(null);
      await api.post(`/api/reservations/${reserva.id}/cancel`);
      setSuccessMessage('Reserva cancelada com sucesso.');
      setTimeout(() => setSuccessMessage(null), 4000);
      mutate();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Erro ao cancelar reserva.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteReservation = async (reserva: Reservation) => {
    const confirmed = window.confirm(
      `Excluir definitivamente o registro da reserva de "${reserva.guest?.name}"?`
    );
    if (!confirmed) return;

    try {
      setActionLoadingId(reserva.id);
      setErrorMessage(null);
      await api.delete(`/api/reservations/${reserva.id}`);
      setSuccessMessage('Registro de reserva excluído com sucesso.');
      setTimeout(() => setSuccessMessage(null), 4000);
      mutate();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Erro ao excluir reserva.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCreateReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setErrorMessage(null);
      await api.post('/api/reservations', {
        ...formState,
        total_price: Number(formState.total_price),
        number_of_guests: Number(formState.number_of_guests),
      });
      setIsModalOpen(false);
      setFormState({
        guest_id: '',
        guest_name: '',
        guest_document: '',
        guest_phone: '',
        guest_email: '',
        room_id: '',
        check_in: '',
        check_out: '',
        number_of_guests: 2,
        total_price: '',
        notes: '',
      });
      setSuccessMessage('Reserva cadastrada com sucesso!');
      setTimeout(() => setSuccessMessage(null), 5000);
      mutate();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Erro ao criar reserva.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Topo / Cabeçalho */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#dce8dc] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-[#5c7264] uppercase tracking-wider">
            Recepção & Hospedagem
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1c2e24]">
            Gestão de Reservas
          </h1>
          <p className="text-sm text-[#52685a] mt-1">
            Controle de reservas, check-ins, check-outs e histórico de ocupação em Lavras Novas.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2.5 px-6 py-4 bg-[#24583b] hover:bg-[#1b442d] text-white font-bold text-base rounded-2xl shadow-md transition-all cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          <span>Nova Reserva</span>
        </button>
      </div>

      {/* Alertas */}
      {successMessage && (
        <div
          role="alert"
          className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-between shadow-xs"
        >
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="text-sm font-semibold">{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-xs font-bold underline cursor-pointer text-emerald-800"
          >
            Fechar
          </button>
        </div>
      )}

      {errorMessage && (
        <div
          role="alert"
          className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 flex items-center justify-between shadow-xs"
        >
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <span className="text-sm font-semibold">{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-xs font-bold underline cursor-pointer text-red-800"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Filtros de Status */}
      <div className="flex flex-wrap gap-2.5 bg-white p-3 rounded-2xl border border-[#dce8dc]">
        {[
          { id: 'ALL', label: 'Todas as Reservas' },
          { id: 'CONFIRMED', label: 'Confirmadas' },
          { id: 'CHECKED_IN', label: 'Hospedados (Check-in)' },
          { id: 'CHECKED_OUT', label: 'Finalizadas' },
          { id: 'CANCELLED', label: 'Canceladas' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedStatusFilter(tab.id)}
            className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
              selectedStatusFilter === tab.id
                ? 'bg-[#24583b] text-white shadow-sm'
                : 'bg-[#f4f7f4] text-[#3d5747] hover:bg-[#e6efe6]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tabela de Reservas */}
      {isLoading ? (
        <div className="bg-white rounded-3xl p-8 border border-[#dce8dc] animate-pulse space-y-4">
          <div className="h-8 bg-gray-100 rounded-lg w-1/3"></div>
          <div className="h-12 bg-gray-50 rounded-xl"></div>
          <div className="h-12 bg-gray-50 rounded-xl"></div>
          <div className="h-12 bg-gray-50 rounded-xl"></div>
        </div>
      ) : error ? (
        <div className="bg-white rounded-3xl p-8 border border-red-200 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-red-900">Erro ao carregar reservas</h3>
          <p className="text-sm text-red-700 mt-1">Verifique se o backend está em execução.</p>
          <button
            onClick={() => mutate()}
            className="mt-4 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-900 rounded-xl text-sm font-bold cursor-pointer inline-flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Tentar Novamente
          </button>
        </div>
      ) : !filteredReservas || filteredReservas.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-[#dce8dc] text-center shadow-xs">
          <CalendarCheck className="w-14 h-14 text-[#738a7b] mx-auto mb-3" />
          <h3 className="text-xl font-bold text-[#1c2e24]">
            {selectedStatusFilter === 'ALL'
              ? 'Nenhuma reserva cadastrada'
              : 'Nenhuma reserva encontrada com este status'}
          </h3>
          <p className="text-sm text-[#52685a] mt-1 max-w-md mx-auto">
            Clique no botão &quot;Nova Reserva&quot; acima para registrar a primeira hospedagem.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-[#dce8dc] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f0f6f0] border-b border-[#dce8dc] text-xs font-black text-[#2e4c3a] uppercase tracking-wider">
                  <th className="py-4 px-6">Hóspede</th>
                  <th className="py-4 px-6">Acomodação</th>
                  <th className="py-4 px-6">Período da Estadia</th>
                  <th className="py-4 px-6">Valor Total</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Ações da Recepção</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#edf2ed] text-sm">
                {filteredReservas.map((reserva) => {
                  const statusInfo = statusConfig[reserva.status] || statusConfig.CONFIRMED;
                  const StatusIcon = statusInfo.icon;
                  const checkInFormatted = new Date(reserva.check_in).toLocaleDateString('pt-BR');
                  const checkOutFormatted = new Date(reserva.check_out).toLocaleDateString('pt-BR');
                  const isActionLoading = actionLoadingId === reserva.id;

                  return (
                    <tr key={reserva.id} className="hover:bg-[#fbfdfb] transition-colors">
                      {/* Hóspede */}
                      <td className="py-4 px-6">
                        <div className="font-bold text-base text-[#1c2e24]">
                          {reserva.guest?.name || 'Hóspede não identificado'}
                        </div>
                        <div className="text-xs text-[#5c7264]">
                          {reserva.guest?.document && `Doc: ${reserva.guest.document} • `}
                          {reserva.guest?.phone || 'Sem telefone'}
                        </div>
                      </td>

                      {/* Quarto */}
                      <td className="py-4 px-6">
                        <div className="font-bold text-[#24583b]">
                          Quarto {reserva.room.number}
                        </div>
                        <div className="text-xs text-[#5c7264]">
                          {reserva.room.name || reserva.room.category}
                        </div>
                      </td>

                      {/* Período */}
                      <td className="py-4 px-6">
                        <div className="font-semibold text-[#1c2e24]">
                          {checkInFormatted} → {checkOutFormatted}
                        </div>
                        <div className="text-xs text-[#5c7264] flex items-center gap-1 mt-0.5">
                          <Users className="w-3.5 h-3.5" />
                          <span>{reserva.number_of_guests} hóspedes</span>
                        </div>
                      </td>

                      {/* Valor */}
                      <td className="py-4 px-6 font-bold text-[#1c2e24]">
                        R${' '}
                        {Number(reserva.total_price).toLocaleString('pt-BR', {
                          minimumFractionDigits: 2,
                        })}
                      </td>

                      {/* Status Badge */}
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold border ${statusInfo.bg} ${statusInfo.text} ${statusInfo.border}`}
                        >
                          <StatusIcon className="w-3.5 h-3.5" />
                          {statusInfo.label}
                        </span>
                      </td>

                      {/* Ações da Recepção (Botões Grandes) */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Botão Financeiro */}
                          <button
                            onClick={() => openPaymentsModal(reserva)}
                            disabled={isActionLoading}
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#f0f6f0] hover:bg-[#eef6ee] text-[#24583b] border border-[#c4d6c4] shadow-xs transition-all cursor-pointer disabled:opacity-50"
                          >
                            <DollarSign className="w-4 h-4" />
                            <span>Financeiro</span>
                          </button>

                          {/* Botão de Check-in */}
                          {(reserva.status === 'CONFIRMED' || reserva.status === 'PENDING') && (
                            <button
                              onClick={() => handleCheckIn(reserva)}
                              disabled={isActionLoading}
                              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#24583b] hover:bg-[#1b442d] text-white shadow-xs transition-all cursor-pointer disabled:opacity-50"
                            >
                              <LogIn className="w-4 h-4" />
                              <span>Fazer Check-in</span>
                            </button>
                          )}

                          {/* Botão de Check-out */}
                          {reserva.status === 'CHECKED_IN' && (
                            <button
                              onClick={() => handleCheckOut(reserva)}
                              disabled={isActionLoading}
                              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#ca6422] hover:bg-[#b05216] text-white shadow-xs transition-all cursor-pointer disabled:opacity-50"
                            >
                              <LogOut className="w-4 h-4" />
                              <span>Fazer Check-out</span>
                            </button>
                          )}

                          {/* Botão de Cancelar */}
                          {(reserva.status === 'CONFIRMED' || reserva.status === 'PENDING') && (
                            <button
                              onClick={() => handleCancelReservation(reserva)}
                              disabled={isActionLoading}
                              title="Cancelar Reserva"
                              className="p-2 rounded-xl text-gray-400 hover:text-amber-700 hover:bg-amber-50 transition-colors cursor-pointer"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          )}

                          {/* Botão Excluir */}
                          <button
                            onClick={() => handleDeleteReservation(reserva)}
                            disabled={isActionLoading}
                            title="Excluir Registro de Reserva"
                            className="p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de Nova Reserva */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-[#dce8dc] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#e2ece2]">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#eef6ee] rounded-xl text-[#24583b]">
                  <CalendarCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-[#1c2e24]">Nova Reserva</h3>
                  <p className="text-xs text-[#52685a]">Bloqueio de acomodação e dados do hóspede</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateReservation} className="space-y-4">
              {/* Seleção de Hóspede Existente ou Novo */}
              <div>
                <label className="block text-sm font-bold text-[#1c2e24] mb-1">
                  Selecionar Hóspede Cadastrado (Opcional)
                </label>
                <select
                  value={formState.guest_id}
                  onChange={(e) => handleSelectExistingGuest(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-[#c4d6c4] bg-[#fafcfa] text-[#1c2e24] focus:outline-none focus:border-[#24583b]"
                >
                  <option value="">-- Digitar dados de novo hóspede abaixo --</option>
                  {guests?.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} ({g.document})
                    </option>
                  ))}
                </select>
              </div>

              {/* Dados do Hóspede */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-bold text-[#1c2e24] mb-1">
                    Nome Completo do Hóspede *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nome do cliente"
                    value={formState.guest_name}
                    onChange={(e) => setFormState({ ...formState, guest_name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-[#c4d6c4] bg-[#fafcfa] text-[#1c2e24] focus:outline-none focus:border-[#24583b]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-[#1c2e24] mb-1">
                    Documento (CPF ou RG)
                  </label>
                  <input
                    type="text"
                    placeholder="123.456.789-00"
                    value={formState.guest_document}
                    onChange={(e) => setFormState({ ...formState, guest_document: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-[#c4d6c4] bg-[#fafcfa] text-[#1c2e24] focus:outline-none focus:border-[#24583b]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-bold text-[#1c2e24] mb-1">
                    Telefone / WhatsApp
                  </label>
                  <input
                    type="text"
                    placeholder="(31) 98888-7777"
                    value={formState.guest_phone}
                    onChange={(e) => setFormState({ ...formState, guest_phone: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-[#c4d6c4] bg-[#fafcfa] text-[#1c2e24] focus:outline-none focus:border-[#24583b]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-[#1c2e24] mb-1">
                    E-mail (Opcional)
                  </label>
                  <input
                    type="email"
                    placeholder="email@exemplo.com"
                    value={formState.guest_email}
                    onChange={(e) => setFormState({ ...formState, guest_email: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-[#c4d6c4] bg-[#fafcfa] text-[#1c2e24] focus:outline-none focus:border-[#24583b]"
                  />
                </div>
              </div>

              {/* Seleção do Quarto */}
              <div>
                <label className="block text-sm font-bold text-[#1c2e24] mb-1">
                  Quarto / Acomodação *
                </label>
                <select
                  required
                  value={formState.room_id}
                  onChange={(e) => handleRoomOrDateChange({ room_id: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-[#c4d6c4] bg-[#fafcfa] text-[#1c2e24] focus:outline-none focus:border-[#24583b]"
                >
                  <option value="">-- Selecione o quarto --</option>
                  {rooms?.map((r) => (
                    <option key={r.id} value={r.id}>
                      Quarto {r.number} - {r.name || r.category} (R$ {Number(r.daily_rate).toFixed(2)}/dia)
                    </option>
                  ))}
                </select>
              </div>

              {/* Datas de Check-in e Check-out */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-bold text-[#1c2e24] mb-1">
                    Data de Entrada (Check-in) *
                  </label>
                  <input
                    type="date"
                    required
                    value={formState.check_in}
                    onChange={(e) => handleRoomOrDateChange({ check_in: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-[#c4d6c4] bg-[#fafcfa] text-[#1c2e24] focus:outline-none focus:border-[#24583b]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-[#1c2e24] mb-1">
                    Data de Saída (Check-out) *
                  </label>
                  <input
                    type="date"
                    required
                    value={formState.check_out}
                    onChange={(e) => handleRoomOrDateChange({ check_out: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-[#c4d6c4] bg-[#fafcfa] text-[#1c2e24] focus:outline-none focus:border-[#24583b]"
                  />
                </div>
              </div>

              {/* Hóspedes e Valor Total */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-bold text-[#1c2e24] mb-1">
                    Quantidade de Pessoas
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formState.number_of_guests}
                    onChange={(e) => setFormState({ ...formState, number_of_guests: Number(e.target.value) })}
                    className="w-full px-4 py-3 rounded-xl border border-[#c4d6c4] bg-[#fafcfa] text-[#1c2e24] focus:outline-none focus:border-[#24583b]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-[#1c2e24] mb-1">
                    Valor Total da Estadia (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    placeholder="Ex: 900.00"
                    value={formState.total_price}
                    onChange={(e) => setFormState({ ...formState, total_price: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-[#c4d6c4] bg-[#fafcfa] text-[#1c2e24] focus:outline-none focus:border-[#24583b]"
                  />
                </div>
              </div>

              {/* Observações */}
              <div>
                <label className="block text-sm font-bold text-[#1c2e24] mb-1">
                  Observações da Reserva
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Horário estimado de chegada às 14h, comemoração de bodas."
                  value={formState.notes}
                  onChange={(e) => setFormState({ ...formState, notes: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-[#c4d6c4] bg-[#fafcfa] text-[#1c2e24] focus:outline-none focus:border-[#24583b]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#e2ece2]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-3 rounded-xl font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl font-bold text-white bg-[#24583b] hover:bg-[#1b442d] shadow-md cursor-pointer"
                >
                  Confirmar Reserva
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Painel Financeiro e Pagamentos */}
      {isPaymentModalOpen && selectedPaymentReserva && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl border border-[#dce8dc] max-h-[90vh] overflow-y-auto">
            
            {/* Header */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#e2ece2]">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#eef6ee] rounded-xl text-[#24583b]">
                  <Receipt className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-[#1c2e24]">Painel Financeiro & Checkout</h3>
                  <p className="text-xs text-[#52685a]">
                    Hóspede: <strong className="text-[#24583b]">{selectedPaymentReserva.guest?.name}</strong> • Quarto {selectedPaymentReserva.room?.number}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Error alerts inside Modal */}
            {paymentsError && (
              <div className="p-4 mb-6 rounded-2xl bg-red-50 border border-red-200 text-red-800 flex items-center gap-3 shadow-xs">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                <span className="text-sm font-semibold">{paymentsError}</span>
              </div>
            )}

            {/* Resumo Financeiro Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-50 rounded-2xl p-4 border border-[#e2ece2]">
                <span className="text-xs font-bold text-[#5c7264] uppercase block">Valor Total do Quarto</span>
                <span className="text-xl font-extrabold text-[#1c2e24] mt-1 block">
                  R$ {Number(selectedPaymentReserva.total_price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="bg-[#eef6ee] rounded-2xl p-4 border border-[#cfe6cf]">
                <span className="text-xs font-bold text-[#2e4c3a] uppercase block">Total já Pago</span>
                <span className="text-xl font-extrabold text-[#24583b] mt-1 block">
                  R$ {Number(financialSummary?.total_paid ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className={`rounded-2xl p-4 border ${
                (financialSummary?.balance ?? Number(selectedPaymentReserva.total_price)) <= 0 
                  ? 'bg-emerald-500 border-emerald-600 text-white shadow-xs' 
                  : 'bg-amber-50 border-amber-300 text-amber-900 shadow-xs'
              }`}>
                <span className={`text-xs font-bold uppercase block ${
                  (financialSummary?.balance ?? Number(selectedPaymentReserva.total_price)) <= 0 ? 'text-emerald-100' : 'text-amber-800'
                }`}>
                  Saldo Restante
                </span>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xl font-black block">
                    R$ {Number(financialSummary?.balance ?? Number(selectedPaymentReserva.total_price)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                  {(financialSummary?.balance ?? Number(selectedPaymentReserva.total_price)) <= 0 ? (
                    <span className="inline-flex items-center gap-1 text-xs font-black bg-white text-emerald-700 px-2.5 py-1 rounded-full shadow-xs uppercase tracking-wider">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Quitado
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-black bg-amber-200 text-amber-900 px-2.5 py-1 rounded-full uppercase tracking-wider">
                      Pendente
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Layout principal em duas colunas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Form de Registrar Pagamento */}
              <div className="space-y-4">
                <h4 className="text-lg font-black text-[#1c2e24] border-b border-[#e2ece2] pb-2 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-[#24583b]" /> Registrar Novo Pagamento
                </h4>
                
                <form onSubmit={handleRegisterPayment} className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-[#1c2e24] mb-1">
                      Valor do Pagamento (R$) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      placeholder="0.00"
                      value={paymentForm.amount}
                      onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-[#c4d6c4] bg-[#fafcfa] text-[#1c2e24] focus:outline-none focus:border-[#24583b] font-bold text-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-[#1c2e24] mb-1">
                      Método de Pagamento *
                    </label>
                    <select
                      required
                      value={paymentForm.payment_method}
                      onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-[#c4d6c4] bg-[#fafcfa] text-[#1c2e24] focus:outline-none focus:border-[#24583b]"
                    >
                      <option value="PIX">Pix</option>
                      <option value="CARD">Cartão (Crédito/Débito)</option>
                      <option value="CASH">Dinheiro</option>
                      <option value="OTHER">Outros</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-[#1c2e24] mb-1">
                      Código de Referência / NSU (Opcional)
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: NSU do cartão ou ID do PIX"
                      value={paymentForm.reference}
                      onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-[#c4d6c4] bg-[#fafcfa] text-[#1c2e24] focus:outline-none focus:border-[#24583b]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-[#1c2e24] mb-1">
                      Observações / Notas (Opcional)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Ex: Pagamento da entrada ou do saldo restante no check-out"
                      value={paymentForm.notes}
                      onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-[#c4d6c4] bg-[#fafcfa] text-[#1c2e24] focus:outline-none focus:border-[#24583b]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingPayment || (financialSummary?.balance ?? 0) <= 0}
                    className="w-full py-4 px-6 bg-[#24583b] hover:bg-[#1b442d] disabled:bg-gray-300 text-white font-extrabold text-base rounded-xl shadow-md transition-all cursor-pointer text-center flex items-center justify-center gap-2"
                  >
                    {submittingPayment ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        <span>Processando...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5" />
                        <span>Confirmar Pagamento</span>
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Histórico de Pagamentos */}
              <div className="space-y-4">
                <h4 className="text-lg font-black text-[#1c2e24] border-b border-[#e2ece2] pb-2 flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-[#5c7264]" /> Histórico de Pagamentos
                </h4>

                {loadingPayments ? (
                  <div className="space-y-3 animate-pulse">
                    <div className="h-14 bg-gray-100 rounded-xl"></div>
                    <div className="h-14 bg-gray-100 rounded-xl"></div>
                  </div>
                ) : !paymentsList || paymentsList.length === 0 ? (
                  <p className="text-sm text-gray-500 italic py-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    Nenhum pagamento registrado para esta reserva.
                  </p>
                ) : (
                  <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                    {paymentsList.map((payment: any) => {
                      const isCanceling = cancelingPaymentId === payment.id;
                      const isUserPrivileged = currentUser?.role === 'ADMIN' || currentUser?.role === 'MANAGER';
                      const paymentMethodLabel: Record<string, string> = {
                        PIX: 'Pix',
                        CARD: 'Cartão',
                        CASH: 'Dinheiro',
                        OTHER: 'Outros',
                      };

                      return (
                        <div
                          key={payment.id}
                          className={`p-4 rounded-xl border flex flex-col justify-between gap-2.5 transition-all ${
                            payment.status === 'VALID'
                              ? 'bg-white border-gray-200 shadow-xs'
                              : payment.status === 'REFUNDED'
                              ? 'bg-amber-50/50 border-amber-200/60 line-through text-gray-400'
                              : 'bg-rose-50/50 border-rose-200/60 line-through text-gray-400'
                          }`}
                        >
                          {/* Top Row: Amount & Method */}
                          <div className="flex items-center justify-between">
                            <div>
                              <span className={`text-base font-black ${payment.status === 'VALID' ? 'text-gray-900' : 'text-gray-400'}`}>
                                R$ {Number(payment.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </span>
                              <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md font-bold ml-2">
                                {paymentMethodLabel[payment.payment_method] || payment.payment_method}
                              </span>
                            </div>

                            {/* Status badge */}
                            <div>
                              {payment.status === 'VALID' ? (
                                <span className="inline-flex text-[10px] font-black uppercase text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                                  Válido
                                </span>
                              ) : payment.status === 'REFUNDED' ? (
                                <span className="inline-flex text-[10px] font-black uppercase text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                                  Estornado
                                </span>
                              ) : (
                                <span className="inline-flex text-[10px] font-black uppercase text-rose-800 bg-rose-100 px-2 py-0.5 rounded-full">
                                  Cancelado
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Reference & Registered by Metadata */}
                          <div className="text-xs text-gray-500 space-y-0.5">
                            {payment.reference && (
                              <p>Ref: <strong className="font-semibold text-gray-700">{payment.reference}</strong></p>
                            )}
                            {payment.notes && (
                              <p className="italic">Obs: "{payment.notes}"</p>
                            )}
                            <p>
                              Registrado por: <strong className="font-semibold text-gray-700">{payment.user?.name || 'Operador'}</strong> em {new Date(payment.created_at).toLocaleString('pt-BR')}
                            </p>
                          </div>

                          {/* Action area: Cancel / Refund interface */}
                          {payment.status === 'VALID' && (
                            <div className="border-t border-gray-100 pt-2.5 mt-1.5">
                              {isCanceling ? (
                                <div className="space-y-2.5 bg-gray-50 p-2.5 rounded-lg border border-gray-200">
                                  <div className="flex items-center gap-1.5 text-xs text-amber-800 font-bold">
                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                    <span>Selecione a ação e preencha o motivo:</span>
                                  </div>
                                  
                                  <input
                                    type="text"
                                    required
                                    placeholder="Digite o motivo obrigatoriamente..."
                                    value={cancelReason}
                                    onChange={(e) => setCancelReason(e.target.value)}
                                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#c4d6c4] bg-white focus:outline-none"
                                  />

                                  <div className="flex flex-wrap gap-2 justify-end">
                                    <button
                                      type="button"
                                      disabled={cancelingPaymentLoading || !cancelReason.trim()}
                                      onClick={() => {
                                        setCancelRefund(true);
                                        // Chama o cancelamento com refund = true
                                        setTimeout(() => handleCancelPayment(payment.id), 50);
                                      }}
                                      className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold text-xs rounded-lg shadow-sm cursor-pointer transition-all"
                                    >
                                      Estornar (Devolver)
                                    </button>
                                    <button
                                      type="button"
                                      disabled={cancelingPaymentLoading || !cancelReason.trim()}
                                      onClick={() => {
                                        setCancelRefund(false);
                                        // Chama o cancelamento com refund = false
                                        setTimeout(() => handleCancelPayment(payment.id), 50);
                                      }}
                                      className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-xs rounded-lg shadow-sm cursor-pointer transition-all"
                                    >
                                      Apenas Cancelar
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setCancelingPaymentId(null);
                                        setCancelReason('');
                                      }}
                                      className="px-2.5 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold text-xs rounded-lg cursor-pointer transition-all"
                                    >
                                      Voltar
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                isUserPrivileged ? (
                                  <button
                                    onClick={() => setCancelingPaymentId(payment.id)}
                                    className="text-xs text-[#b43e3e] hover:text-[#993232] font-black flex items-center gap-1 cursor-pointer transition-all"
                                  >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    <span>Estornar / Cancelar Pagamento</span>
                                  </button>
                                ) : (
                                  <span className="text-[10px] text-gray-400 italic">
                                    Sem permissão para cancelar
                                  </span>
                                )
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>

            {/* Bottom Footer actions */}
            <div className="flex items-center justify-end gap-3 pt-6 mt-6 border-t border-[#e2ece2]">
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(false)}
                className="px-6 py-3 rounded-xl font-bold text-white bg-[#24583b] hover:bg-[#1b442d] shadow-md cursor-pointer transition-colors"
              >
                Fechar Painel Financeiro
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
