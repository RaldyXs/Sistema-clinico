import * as React from 'react';
import { api } from '@/lib/api';

export interface UserProfile {
  id: string;
  email: string;
  nombre: string;
  apellido?: string | null;
  rolCodigo?: 'SUPERADMIN' | 'ADMIN' | 'MEDICO' | 'RECEPCION' | string;
  especialidad?: string | null;
  matriculaProfesional?: string | null;
  twoFactorEnabled?: boolean;
  consultorioId: string;
  consultorio?: {
    id: string;
    nombre: string;
    colorPrimario?: string;
  };
}

interface AuthContextType {
  token: string | null;
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  quickLogin: (userType: 'carlos' | 'elena' | 'superadmin') => Promise<void>;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = React.useState<string | null>(() => localStorage.getItem('token_clinico'));
  const [user, setUser] = React.useState<UserProfile | null>(() => {
    const cached = localStorage.getItem('usuario_clinico');
    return cached ? JSON.parse(cached) : null;
  });
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const logout = React.useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token_clinico');
    localStorage.removeItem('usuario_clinico');
  }, []);

  const cargarPerfil = React.useCallback(async (authToken: string) => {
    try {
      const data = await api.get('/auth/perfil', authToken);
      const perfil: UserProfile = {
        id: data.id,
        email: data.email,
        nombre: data.nombre,
        apellido: data.apellido,
        rolCodigo:
          data.rolCodigo ||
          (typeof data.rol === 'string' ? data.rol : data.rol?.codigo) ||
          'MEDICO',
        especialidad: data.especialidad,
        matriculaProfesional: data.matriculaProfesional,
        consultorioId: data.consultorioId,
        consultorio: data.consultorio,
      };
      setUser(perfil);
      localStorage.setItem('usuario_clinico', JSON.stringify(perfil));
    } catch {
      // Si el token expiró
      logout();
    }
  }, [logout]);

  React.useEffect(() => {
    if (token && !user) {
      cargarPerfil(token);
    }
  }, [token, user, cargarPerfil]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      if (!res.accessToken) throw new Error('Token no recibido');

      const authToken = res.accessToken;
      setToken(authToken);
      localStorage.setItem('token_clinico', authToken);
      await cargarPerfil(authToken);
    } finally {
      setIsLoading(false);
    }
  };

  const quickLogin = async (userType: 'carlos' | 'elena' | 'superadmin') => {
    if (userType === 'superadmin') {
      await login('superadmin@saas.com', 'SuperAdmin1234!');
    } else if (userType === 'carlos') {
      await login('dr.carlos@test.com', 'Test1234!');
    } else {
      await login('elena.rios@test2.com', 'Test1234!');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isAuthenticated: !!token,
        isLoading,
        login,
        logout,
        quickLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de un AuthProvider');
  return ctx;
}
