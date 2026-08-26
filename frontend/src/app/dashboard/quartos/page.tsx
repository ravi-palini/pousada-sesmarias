'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import { api } from '@/lib/api';
import {
  BedDouble,
  Plus,
  Users,
  DollarSign,
  Sparkles,
  Wrench,
  Ban,
  CheckCircle2,
  XCircle,
  RefreshCw,
  AlertCircle,
  Trash2,
} from 'lucide-react';

interface Room {
  id: string;
  number: string;
  name: string | null;
  category: string | null;
  capacity: number;
  daily_rate: string | number;
  status: 'AVAILABLE' | 'OCCUPIED' | 'CLEANING' | 'MAINTENANCE' | 'BLOCKED';
  description: string | null;
}

const fetcher = (url: string) => api.get(url).then((res) => res.data.rooms);

const statusConfig: Record<
  Room['status'],
  { label: string; bg: string; text: string; border: string; icon: React.ComponentType<{ className?: string }> }
> = {
  AVAILABLE: {
    label: 'Disponível',
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-300',
    icon: CheckCircle2,
  },
  OCCUPIED: {
    label: 'Ocupado',
    bg: 'bg-rose-50',
    text: 'text-rose-800',
    border: 'border-rose-300',
    icon: XCircle,
  },
  CLEANING: {
    label: 'Em Limpeza',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-300',
    icon: Sparkles,
  },
  MAINTENANCE: {
    label: 'Manutenção',
    bg: 'bg-orange-50',
    text: 'text-orange-800',
    border: 'border-orange-300',
    icon: Wrench,
  },
  BLOCKED: {
    label: 'Bloqueado',
    bg: 'bg-gray-100',
    text: 'text-gray-800',
    border: 'border-gray-300',
    icon: Ban,
  },
};

export default function QuartosPage() {
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [isNewRoomModalOpen, setIsNewRoomModalOpen] = useState(false);
  const [statusChangingRoomId, setStatusChangingRoomId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Formulário de Novo Quarto
  const [newRoomData, setNewRoomData] = useState({
    number: '',
    name: '',
    category: 'Chalé Master',
    capacity: 2,
    daily_rate: '',
    description: '',
  });

  const { data: rooms, error, isLoading, mutate } = useSWR<Room[]>('/api/rooms', fetcher);

  const filteredRooms = rooms
    ? selectedStatusFilter === 'ALL'
      ? rooms
      : rooms.filter((r) => r.status === selectedStatusFilter)
    : [];

  const handleStatusChange = async (roomId: string, newStatus: Room['status']) => {
    try {
      setStatusChangingRoomId(roomId);
      setErrorMessage(null);
      await api.patch(`/api/rooms/${roomId}/status`, { status: newStatus });
      mutate();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Erro ao alterar status do quarto.');
    } finally {
      setStatusChangingRoomId(null);
    }
  };

  const handleDeleteRoom = async (room: Room) => {
    const confirmed = window.confirm(`Tem certeza que deseja excluir o Quarto "${room.number}"?`);
    if (!confirmed) return;

    try {
      setErrorMessage(null);
      await api.delete(`/api/rooms/${room.id}`);
      setSuccessMessage(`Quarto "${room.number}" excluído com sucesso.`);
      setTimeout(() => setSuccessMessage(null), 4000);
      mutate();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Erro ao excluir quarto.');
    }
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setErrorMessage(null);
      await api.post('/api/rooms', {
        ...newRoomData,
        daily_rate: Number(newRoomData.daily_rate),
        capacity: Number(newRoomData.capacity),
      });
      setIsNewRoomModalOpen(false);
      setNewRoomData({
        number: '',
        name: '',
        category: 'Chalé Master',
        capacity: 2,
        daily_rate: '',
        description: '',
      });
      setSuccessMessage('Quarto cadastrado com sucesso!');
      setTimeout(() => setSuccessMessage(null), 4000);
      mutate();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Erro ao cadastrar novo quarto.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Topo / Título e Ação */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#dce8dc] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-[#5c7264] uppercase tracking-wider">
            Acomodações & Chalés
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1c2e24]">
            Mapa de Quartos
          </h1>
          <p className="text-sm text-[#52685a] mt-1">
            Visualize a ocupação, organize a limpeza e altere o status das acomodações com facilidade.
          </p>
        </div>

        <button
          onClick={() => setIsNewRoomModalOpen(true)}
          className="flex items-center justify-center gap-2.5 px-6 py-4 bg-[#24583b] hover:bg-[#1b442d] text-white font-bold text-base rounded-2xl shadow-md transition-all cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          <span>Cadastrar Quarto</span>
        </button>
      </div>

      {/* Alertas */}
      {successMessage && (
        <div
          role="alert"
          className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="text-sm font-medium">{successMessage}</span>
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
          className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <span className="text-sm font-medium">{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-xs font-bold underline cursor-pointer text-red-800"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Filtros de Status (Botões Grandes) */}
      <div className="flex flex-wrap gap-2.5 bg-white p-3 rounded-2xl border border-[#dce8dc]">
        {[
          { id: 'ALL', label: 'Todos os Quartos' },
          { id: 'AVAILABLE', label: 'Disponíveis' },
          { id: 'OCCUPIED', label: 'Ocupados' },
          { id: 'CLEANING', label: 'Em Limpeza' },
          { id: 'MAINTENANCE', label: 'Manutenção' },
          { id: 'BLOCKED', label: 'Bloqueados' },
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

      {/* Grade de Quartos */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="bg-white rounded-3xl p-6 border border-[#dce8dc] animate-pulse h-64"
            />
          ))}
        </div>
      ) : error ? (
        <div className="bg-white rounded-3xl p-8 border border-red-200 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-red-900">Erro ao carregar quartos</h3>
          <p className="text-sm text-red-700 mt-1">Verifique se o backend está em execução.</p>
          <button
            onClick={() => mutate()}
            className="mt-4 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-900 rounded-xl text-sm font-bold cursor-pointer inline-flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Tentar Novamente
          </button>
        </div>
      ) : filteredRooms.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-[#dce8dc] text-center shadow-xs">
          <BedDouble className="w-14 h-14 text-[#738a7b] mx-auto mb-3" />
          <h3 className="text-xl font-bold text-[#1c2e24]">Nenhum quarto encontrado</h3>
          <p className="text-sm text-[#52685a] mt-1 max-w-md mx-auto">
            {selectedStatusFilter === 'ALL'
              ? 'Nenhum quarto cadastrado. Clique no botão acima para adicionar o primeiro quarto da pousada.'
              : 'Não há quartos com este status no momento.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRooms.map((room) => {
            const statusInfo = statusConfig[room.status] || statusConfig.AVAILABLE;
            const StatusIcon = statusInfo.icon;
            const isChanging = statusChangingRoomId === room.id;

            return (
              <div
                key={room.id}
                className="bg-white rounded-3xl p-6 border-2 border-[#dce8dc] hover:border-[#b4d2b4] shadow-sm flex flex-col justify-between transition-all relative group"
              >
                <div>
                  {/* Topo do Card: Número, Status e Botão Excluir */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                      <span className="text-xs font-extrabold text-[#5c7264] uppercase tracking-wider">
                        Acomodação
                      </span>
                      <h3 className="text-2xl font-black text-[#1c2e24]">
                        Quarto {room.number}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold border ${statusInfo.bg} ${statusInfo.text} ${statusInfo.border}`}
                      >
                        <StatusIcon className="w-4 h-4" />
                        {statusInfo.label}
                      </span>

                      <button
                        onClick={() => handleDeleteRoom(room)}
                        title="Excluir Quarto"
                        aria-label={`Excluir Quarto ${room.number}`}
                        className="p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Nome e Categoria */}
                  <div className="space-y-1 mb-4">
                    <p className="text-lg font-bold text-[#24583b]">
                      {room.name || `Chalé ${room.number}`}
                    </p>
                    <p className="text-xs font-semibold text-[#5c7264] inline-block px-2 py-0.5 bg-[#f0f6f0] rounded-md border border-[#d8e6d8]">
                      {room.category || 'Standard'}
                    </p>
                  </div>

                  {/* Detalhes de Capacidade e Diária */}
                  <div className="grid grid-cols-2 gap-3 py-3 border-y border-[#edf2ed] my-4 text-sm">
                    <div className="flex items-center gap-2 text-[#445b4c]">
                      <Users className="w-4 h-4 text-[#24583b]" />
                      <span>Até {room.capacity} pessoas</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[#1c2e24] font-bold">
                      <DollarSign className="w-4 h-4 text-[#24583b]" />
                      <span>
                        R${' '}
                        {Number(room.daily_rate).toLocaleString('pt-BR', {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  </div>

                  {room.description && (
                    <p className="text-xs text-[#52685a] line-clamp-2 mb-4">
                      {room.description}
                    </p>
                  )}
                </div>

                {/* Alteração Rápida de Status para Recepção */}
                <div className="pt-3 border-t border-[#edf2ed]">
                  <label className="block text-xs font-bold text-[#5c7264] mb-1.5">
                    Alterar Status Rápido:
                  </label>
                  <select
                    value={room.status}
                    disabled={isChanging}
                    onChange={(e) =>
                      handleStatusChange(room.id, e.target.value as Room['status'])
                    }
                    className="w-full px-3 py-2 text-sm font-semibold rounded-xl border border-[#c4d6c4] bg-[#fafcfa] text-[#1c2e24] focus:outline-none focus:border-[#24583b] cursor-pointer"
                  >
                    <option value="AVAILABLE">🟢 Disponível</option>
                    <option value="OCCUPIED">🔴 Ocupado</option>
                    <option value="CLEANING">🟡 Em Limpeza</option>
                    <option value="MAINTENANCE">🟠 Manutenção</option>
                    <option value="BLOCKED">⚪ Bloqueado</option>
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Cadastro de Novo Quarto */}
      {isNewRoomModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-[#dce8dc] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#e2ece2]">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#eef6ee] rounded-xl text-[#24583b]">
                  <BedDouble className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-[#1c2e24]">Cadastrar Novo Quarto</h3>
                  <p className="text-xs text-[#52685a]">Adicionar acomodação ao mapa da pousada</p>
                </div>
              </div>
              <button
                onClick={() => setIsNewRoomModalOpen(false)}
                className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRoom} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-[#1c2e24] mb-1">
                  Número / Identificador do Quarto *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: 102, Chalé 04"
                  value={newRoomData.number}
                  onChange={(e) => setNewRoomData({ ...newRoomData, number: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-[#c4d6c4] bg-[#fafcfa] text-[#1c2e24] focus:outline-none focus:border-[#24583b]"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-[#1c2e24] mb-1">
                  Nome do Quarto / Chalé (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Chalé Tiradentes"
                  value={newRoomData.name}
                  onChange={(e) => setNewRoomData({ ...newRoomData, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-[#c4d6c4] bg-[#fafcfa] text-[#1c2e24] focus:outline-none focus:border-[#24583b]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-bold text-[#1c2e24] mb-1">
                    Categoria
                  </label>
                  <select
                    value={newRoomData.category}
                    onChange={(e) => setNewRoomData({ ...newRoomData, category: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-[#c4d6c4] bg-[#fafcfa] text-[#1c2e24] focus:outline-none focus:border-[#24583b]"
                  >
                    <option value="Chalé Master">Chalé Master</option>
                    <option value="Chalé Luxo">Chalé Luxo</option>
                    <option value="Suíte Standard">Suíte Standard</option>
                    <option value="Chalé Família">Chalé Família</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-[#1c2e24] mb-1">
                    Capacidade (Pessoas) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newRoomData.capacity}
                    onChange={(e) => setNewRoomData({ ...newRoomData, capacity: Number(e.target.value) })}
                    className="w-full px-4 py-3 rounded-xl border border-[#c4d6c4] bg-[#fafcfa] text-[#1c2e24] focus:outline-none focus:border-[#24583b]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-[#1c2e24] mb-1">
                  Valor da Diária (R$) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  required
                  placeholder="Ex: 450.00"
                  value={newRoomData.daily_rate}
                  onChange={(e) => setNewRoomData({ ...newRoomData, daily_rate: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-[#c4d6c4] bg-[#fafcfa] text-[#1c2e24] focus:outline-none focus:border-[#24583b]"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-[#1c2e24] mb-1">
                  Descrição / Comodidades
                </label>
                <textarea
                  rows={3}
                  placeholder="Ex: Cama king, lareira ecológica, hidromassagem e vista para a serra."
                  value={newRoomData.description}
                  onChange={(e) => setNewRoomData({ ...newRoomData, description: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-[#c4d6c4] bg-[#fafcfa] text-[#1c2e24] focus:outline-none focus:border-[#24583b]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#e2ece2]">
                <button
                  type="button"
                  onClick={() => setIsNewRoomModalOpen(false)}
                  className="px-5 py-3 rounded-xl font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl font-bold text-white bg-[#24583b] hover:bg-[#1b442d] shadow-md cursor-pointer"
                >
                  Salvar Quarto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
