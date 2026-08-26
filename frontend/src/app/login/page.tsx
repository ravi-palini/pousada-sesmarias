'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '@/lib/api';
import { Hotel, Lock, Mail, Eye, EyeOff, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Por favor, digite seu e-mail.')
    .email('Formato de e-mail inválido.'),
  password: z
    .string()
    .min(1, 'Por favor, digite sua senha.'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setServerError(null);
      // Chamada à API de autenticação do backend (cookies HttpOnly gerenciados pelo navegador)
      await api.post('/api/auth/login', data);
      setIsSuccess(true);
      router.push('/dashboard');
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        'Não foi possível conectar ao servidor. Verifique sua conexão ou tente novamente.';
      setServerError(message);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#eef4ee] to-[#e4ede4] px-4 py-8">
      <div className="w-full max-w-md">
        {/* Cartão Principal */}
        <div className="bg-white rounded-3xl shadow-xl border border-[#d6e2d6] p-8 sm:p-10">
          {/* Cabeçalho / Identidade Visual */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-[#24583b] text-white rounded-2xl shadow-md mb-4">
              <Hotel className="w-10 h-10" />
            </div>
            <h1 className="text-3xl font-extrabold text-[#1c2e24] tracking-tight">
              Pousada Sesmarias
            </h1>
            <p className="text-sm font-medium text-[#5c7264] mt-1">
              Lavras Novas • Minas Gerais
            </p>
            <div className="inline-block mt-3 px-3 py-1 bg-[#f0f6f0] text-[#24583b] text-xs font-semibold rounded-full border border-[#d8e6d8]">
              Sistema de Gestão & Recepção
            </div>
          </div>

          {/* Alerta de Erro do Servidor */}
          {serverError && (
            <div
              role="alert"
              className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-800"
            >
              <AlertCircle className="w-5 h-5 mt-0.5 shrink-0 text-red-600" />
              <div className="text-sm font-medium">{serverError}</div>
            </div>
          )}

          {/* Alerta de Sucesso */}
          {isSuccess && (
            <div
              role="alert"
              className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-800"
            >
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
              <div className="text-sm font-medium">Login aprovado! Entrando no sistema...</div>
            </div>
          )}

          {/* Formulário de Login */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
            {/* Campo E-mail */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-bold text-[#1c2e24] mb-2"
              >
                E-mail do Usuário
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#5c7264]">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="exemplo@pousadasesmarias.com.br"
                  {...register('email')}
                  className={`w-full pl-11 pr-4 py-3.5 text-base rounded-xl border bg-[#fafcfa] text-[#1c2e24] placeholder:text-gray-400 focus:bg-white focus:outline-none transition-all ${
                    errors.email
                      ? 'border-red-400 focus:ring-2 focus:ring-red-400'
                      : 'border-[#c4d6c4] focus:border-[#24583b] focus:ring-2 focus:ring-[#24583b]/20'
                  }`}
                  aria-invalid={errors.email ? 'true' : 'false'}
                />
              </div>
              {errors.email && (
                <p className="mt-1.5 text-sm font-medium text-red-600">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Campo Senha */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-bold text-[#1c2e24] mb-2"
              >
                Senha de Acesso
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#5c7264]">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Digite sua senha"
                  {...register('password')}
                  className={`w-full pl-11 pr-12 py-3.5 text-base rounded-xl border bg-[#fafcfa] text-[#1c2e24] placeholder:text-gray-400 focus:bg-white focus:outline-none transition-all ${
                    errors.password
                      ? 'border-red-400 focus:ring-2 focus:ring-red-400'
                      : 'border-[#c4d6c4] focus:border-[#24583b] focus:ring-2 focus:ring-[#24583b]/20'
                  }`}
                  aria-invalid={errors.password ? 'true' : 'false'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#5c7264] hover:text-[#1c2e24] focus:outline-none"
                  aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-sm font-medium text-red-600">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Botão Entrar (Grande, claro e direto) */}
            <button
              type="submit"
              disabled={isSubmitting || isSuccess}
              className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-xl text-white font-bold text-lg bg-[#24583b] hover:bg-[#1b442d] active:scale-[0.99] transition-all shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting || isSuccess ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Acessando...</span>
                </>
              ) : (
                <span>Entrar no Sistema</span>
              )}
            </button>
          </form>

          {/* Rodapé do Cartão */}
          <div className="mt-8 pt-6 border-t border-[#e2ece2] text-center text-xs text-[#6e8576]">
            Dúvidas ou problemas de acesso? Contate o gerente da pousada.
          </div>
        </div>
      </div>
    </main>
  );
}

