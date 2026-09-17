"use client";

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useEffect } from 'react';
import Cookies from 'js-cookie';
import { AuthResponse, ClienteAuthResponse } from '@/types';

interface AuthState {
  token: string | null;
  rol: string | null;
  sedeId: number | null;
  clienteId: number | null;
  nombre: string | null;
  email: string | null;
  telefono: string | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  setAuth: (data: AuthResponse) => void;
  setClienteAuth: (data: ClienteAuthResponse) => void;
  updateProfile: (nombre: string, telefono?: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      rol: null,
      sedeId: null,
      clienteId: null,
      nombre: null,
      email: null,
      telefono: null,
      isAuthenticated: false,
      isHydrated: false,

      setAuth: (data: AuthResponse) => {
        Cookies.set('token', data.token, {
          expires: 1,
          path: '/',
          sameSite: 'lax',
          secure: window.location.protocol === 'https:',
        });
        set({
          token: data.token,
          rol: data.rol,
          sedeId: data.sedeId,
          clienteId: null,
          nombre: null,
          email: null,
          isAuthenticated: true,
        });
      },

      setClienteAuth: (data: ClienteAuthResponse) => {
        Cookies.set('token', data.token, {
          expires: 1,
          path: '/',
          sameSite: 'lax',
          secure: window.location.protocol === 'https:',
        });
        set({
          token: data.token,
          rol: data.rol,
          sedeId: null,
          clienteId: data.clienteId,
          nombre: data.nombre,
          email: data.email,
          isAuthenticated: true,
        });
      },

      updateProfile: (nombre: string, telefono?: string) => {
        set((state) => ({
          nombre,
          ...(telefono !== undefined ? { telefono } : {}),
        }));
      },

      logout: () => {
        Cookies.remove('token', { path: '/' });
        set({
          token: null,
          rol: null,
          sedeId: null,
          clienteId: null,
          nombre: null,
          email: null,
          telefono: null,
          isAuthenticated: false,
        });
      },
    }),
    {
      name: 'floristeria-auth',
      partialize: (state) => ({
        rol: state.rol,
        sedeId: state.sedeId,
        clienteId: state.clienteId,
        nombre: state.nombre,
        email: state.email,
        telefono: state.telefono,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => () => {
        // Marcar como hidratado con setState para notificar suscriptores
        useAuthStore.setState({ isHydrated: true });
      },
      merge: (persistedState, currentState) => {
        const persisted = (persistedState ?? {}) as Partial<AuthState>;
        // No pisar una sesion iniciada mientras la rehidratacion estaba en vuelo
        // (login rapido antes de que termine rehydrate). Sin esto, el snapshot
        // viejo (isAuthenticated:false) borra el login y el guard devuelve a /tienda/auth.
        if (currentState.isAuthenticated) {
          return { ...currentState, isHydrated: true };
        }
        // La cookie es la fuente de verdad del token: sin ella no hay sesion valida
        const token = Cookies.get('token') ?? null;
        return {
          ...currentState,
          ...persisted,
          token,
          isAuthenticated: token ? !!persisted.isAuthenticated : false,
          isHydrated: true,
        };
      },
    }
  )
);

/**
 * Hook que sincroniza el store de auth con el evento
 * `auth:session-expired` disparado por el fetcher.
 *
 * Cuando el fetcher detecta un 401/403, dispara un
 * CustomEvent. Este hook lo escucha y ejecuta logout()
 * en el store Zustand para limpiar el estado.
 *
 * DEBE usarse una sola vez en un componente raíz Client
 * (ej. el layout del admin).
 */
export function useSessionExpiredSync(): void {
  useEffect(() => {
    const handler = () => {
      useAuthStore.getState().logout();
    };

    window.addEventListener('auth:session-expired', handler);

    return () => {
      window.removeEventListener('auth:session-expired', handler);
    };
  }, []);
}