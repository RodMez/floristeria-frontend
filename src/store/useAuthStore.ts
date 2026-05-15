import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import Cookies from 'js-cookie';
import { AuthResponse } from '../types';

interface AuthState {
  token: string | null;
  rol: string | null;
  sedeId: number | null;
  isAuthenticated: boolean;
  setAuth: (data: AuthResponse) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      rol: null,
      sedeId: null,
      isAuthenticated: false,

      setAuth: (data: AuthResponse) => {
        Cookies.set('token', data.token, { expires: 1 });
        set({
          token: data.token,
          rol: data.rol,
          sedeId: data.sedeId,
          isAuthenticated: true,
        });
      },

      logout: () => {
        Cookies.remove('token');
        set({
          token: null,
          rol: null,
          sedeId: null,
          isAuthenticated: false,
        });
      },
    }),
    {
      name: 'floristeria-auth',
    }
  )
);
