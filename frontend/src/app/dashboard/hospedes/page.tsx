'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import { api } from '@/lib/api';
import {
  Users,
  UserPlus,
  Search,
  Phone,
  Mail,
  FileText,
  AlertCircle,
  RefreshCw,
  CalendarCheck,
  Check,
  Trash2,
} from 'lucide-react';

interface Guest {
  id: string;
  name: string;
  document: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  created_at: string;
  _count?: {
    reservations: number;
  };
}

const fetcher = (url: string) => api.get(url).then((res) => res.data.guests);

export default function HospedesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    document: '',
    phone: '',
    email: '',
    notes: '',
  });

  const queryUrl = searchTerm.trim()
    ? `/api/guests?search=${encodeURIComponent(searchTerm.trim())}`
    : '/api/guests';

  const { data: guests, error, isLoading, mutate } = useSWR<Guest[]>(queryUrl, fetcher);

  const handleDeleteGuest = async (guest: Guest) => {
    const confirmed = window.confirm(`Tem certeza que deseja excluir o cadastro do hóspede "${guest.name}"?`);
    if (!confirmed) return;

    try {
      setErrorMessage(null);
      await api.delete(`/api/guests/${guest.id}`);
      setSuccessMessage(`Hóspede "${guest.name}" excluído com sucesso.`);
      setTimeout(() => setSuccessMessage(null), 4000);
      mutate();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Erro ao excluir hóspede.');
    }
  };

  const handleCreateGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setErrorMessage(null);
      await api.post('/api/guests', formData);
      setIsModalOpen(false);
      setFormData({
        name: '',
        document: '',
        phone: '',
        email: '',
        notes: '',
      });
      setSuccessMessage('Hóspede cadastrado com sucesso!');
      setTimeout(() => setSuccessMessage(null), 4000);
      mutate();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Erro ao cadastrar hóspede.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Topo / Cabeçalho */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#dce8dc] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-[#5c7264] uppercase tracking-wider">
            Recepção & Cadastros
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1c2e24]">
            Ficha de Hóspedes
          </h1>
          <p className="text-sm text-[#52685a] mt-1">
            Consulte os cadastros, contatos e histórico de hospedagens na pousada.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2.5 px-6 py-4 bg-[#24583b] hover:bg-[#1b442d] text-white font-bold text-base rounded-2xl shadow-md transition-all cursor-pointer"
        >
          <UserPlus className="w-5 h-5" />
          <span>Cadastrar Hóspede</span>
        </button>
      </div>

      {/* Alertas */}
      {successMessage && (
        <div
          role="alert"
          className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <Check className="w-5 h-5 text-emerald-600 shrink-0" />
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

      {/* Barra de Pesquisa Rápida */}
      <div className="bg-white p-4 rounded-2xl border border-[#dce8dc] shadow-xs">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#5c7264]">
            <Search className="w-5 h-5" />
          </div>
          <input
            type="text"
            placeholder="Pesquisar por nome, documento (CPF/RG) ou telefone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 text-base rounded-xl border border-[#c4d6c4] bg-[#fafcfa] text-[#1c2e24] focus:bg-white focus:outline-none focus:border-[#24583b]"
          />
        </div>
      </div>

      {/* Tabela de Hóspedes */}
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
          <h3 className="text-lg font-bold text-red-900">Erro ao carregar lista de hóspedes</h3>
          <p className="text-sm text-red-700 mt-1">Verifique se o backend está em execução.</p>
          <button
            onClick={() => mutate()}
            className="mt-4 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-900 rounded-xl text-sm font-bold cursor-pointer inline-flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Tentar Novamente
          </button>
        </div>
      ) : !guests || guests.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-[#dce8dc] text-center shadow-xs">
          <Users className="w-14 h-14 text-[#738a7b] mx-auto mb-3" />
          <h3 className="text-xl font-bold text-[#1c2e24]">
            {searchTerm ? 'Nenhum hóspede localizado para esta busca' : 'Nenhum hóspede cadastrado'}
          </h3>
          <p className="text-sm text-[#52685a] mt-1 max-w-md mx-auto">
            {searchTerm
              ? 'Tente buscar por outro termo ou limpe o campo de busca.'
              : 'Clique no botão "Cadastrar Hóspede" para registrar o primeiro cliente da pousada.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-[#dce8dc] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f0f6f0] border-b border-[#dce8dc] text-xs font-black text-[#2e4c3a] uppercase tracking-wider">
                  <th className="py-4 px-6">Hóspede</th>
                  <th className="py-4 px-6">Documento</th>
                  <th className="py-4 px-6">Contato</th>
                  <th className="py-4 px-6">Reservas</th>
                  <th className="py-4 px-6">Observações</th>
                  <th className="py-4 px-6 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#edf2ed] text-sm">
                {guests.map((guest) => (
                  <tr key={guest.id} className="hover:bg-[#fbfdfb] transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-bold text-base text-[#1c2e24]">{guest.name}</div>
                      <div className="text-xs text-[#5c7264]">
                        Cadastrado em {new Date(guest.created_at).toLocaleDateString('pt-BR')}
                      </div>
                    </td>
                    <td className="py-4 px-6 font-mono text-sm text-[#1c2e24] font-semibold">
                      {guest.document}
                    </td>
                    <td className="py-4 px-6">
                      <div className="space-y-1">
                        {guest.phone ? (
                          <div className="flex items-center gap-1.5 text-xs text-[#1c2e24] font-medium">
                            <Phone className="w-3.5 h-3.5 text-[#24583b]" />
                            <span>{guest.phone}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">Sem telefone</span>
                        )}
                        {guest.email && (
                          <div className="flex items-center gap-1.5 text-xs text-[#52685a]">
                            <Mail className="w-3.5 h-3.5 text-[#24583b]" />
                            <span>{guest.email}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#eef6ee] text-[#24583b] text-xs font-bold rounded-full border border-[#d2e6d2]">
                        <CalendarCheck className="w-3.5 h-3.5" />
                        {guest._count?.reservations || 0} estadias
                      </span>
                    </td>
                    <td className="py-4 px-6 text-xs text-[#52685a] max-w-xs truncate">
                      {guest.notes || <span className="text-gray-400 italic">Nenhuma observação</span>}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => handleDeleteGuest(guest)}
                        title="Excluir Hóspede"
                        aria-label={`Excluir Hóspede ${guest.name}`}
                        className="p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de Cadastro de Hóspede */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-[#dce8dc] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#e2ece2]">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#eef6ee] rounded-xl text-[#24583b]">
                  <UserPlus className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-[#1c2e24]">Cadastrar Novo Hóspede</h3>
                  <p className="text-xs text-[#52685a]">Formulário simplificado da recepção</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateGuest} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-[#1c2e24] mb-1">
                  Nome Completo do Hóspede *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Maria das Graças Silva"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-[#c4d6c4] bg-[#fafcfa] text-[#1c2e24] focus:outline-none focus:border-[#24583b]"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-[#1c2e24] mb-1">
                  Documento (CPF, RG ou Passaporte) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: 123.456.789-00"
                  value={formData.document}
                  onChange={(e) => setFormData({ ...formData, document: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-[#c4d6c4] bg-[#fafcfa] text-[#1c2e24] focus:outline-none focus:border-[#24583b]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-bold text-[#1c2e24] mb-1">
                    Telefone / WhatsApp
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: (31) 98888-7777"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-[#c4d6c4] bg-[#fafcfa] text-[#1c2e24] focus:outline-none focus:border-[#24583b]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-[#1c2e24] mb-1">
                    E-mail (Opcional)
                  </label>
                  <input
                    type="email"
                    placeholder="Ex: cliente@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-[#c4d6c4] bg-[#fafcfa] text-[#1c2e24] focus:outline-none focus:border-[#24583b]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-[#1c2e24] mb-1">
                  Observações / Preferências
                </label>
                <textarea
                  rows={3}
                  placeholder="Ex: Prefere travesseiros extras, restrição alimentar, aniversariante, etc."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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
                  Salvar Cadastro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
