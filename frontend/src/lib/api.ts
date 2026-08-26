import axios from 'axios';

/**
 * Instância centralizada do Axios para comunicação com o backend da Pousada Sesmarias.
 * REGRA DE SEGURANÇA CRÍTICA:
 * - baseURL: 'http://localhost:3000'
 * - withCredentials: true (Essencial para transmissão segura de cookies HttpOnly)
 */
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Interceptor de resposta para tratamento global de erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Se receber 401 e estiver no navegador, redirecionar para tela de login se não estiver lá
    if (
      error.response?.status === 401 &&
      typeof window !== 'undefined' &&
      !window.location.pathname.startsWith('/login')
    ) {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

