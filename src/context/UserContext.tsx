import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { userService } from '../services/userService';

type User = {
  id: string;
  name: string;
  campaign_id?: number;
  [key: string]: any;
};

type UserContextType = {
  user: User | null;
  setUser: (user: User | null) => void;
  updateCampaign: (campaignId: number) => Promise<void>;
  refreshUser: () => Promise<void>;
  clearUser: () => void;
};

const UserContext = createContext<UserContextType>({
  user: null,
  setUser: () => {},
  updateCampaign: async () => {},
  refreshUser: async () => {},
  clearUser: () => {},
});

export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    // Verificar se há um token válido antes de carregar o usuário do localStorage
    const token = localStorage.getItem('token');
    if (!token) {
      localStorage.removeItem('user');
      return null;
    }
    
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        localStorage.removeItem('user');
        return null;
      }
    }
    return null;
  });

  // Sincronizar com mudanças no localStorage (para quando fizer logout em outra aba)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user') {
        if (e.newValue) {
          try {
            setUser(JSON.parse(e.newValue));
          } catch {
            setUser(null);
          }
        } else {
          setUser(null);
        }
      }
      
      if (e.key === 'token' && !e.newValue) {
        // Token foi removido, limpar usuário
        setUser(null);
        localStorage.removeItem('user');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Verificar token válido ao inicializar
  useEffect(() => {
    const checkTokenValidity = async () => {
      const token = localStorage.getItem('token');
      if (!token && user) {
        // Token foi removido mas usuário ainda está no estado
        setUser(null);
        localStorage.removeItem('user');
        return;
      }

      if (token && user?.id) {
        try {
          // Verificar se o usuário ainda é válido
          await userService.getById(user.id);
        } catch (error) {
          // Se falhar, limpar usuário (token pode estar expirado)
          console.error('Token inválido ou usuário não encontrado:', error);
          setUser(null);
          localStorage.removeItem('user');
          localStorage.removeItem('token');
        }
      }
    };

    checkTokenValidity();
  }, [user]);

  const clearUser = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const refreshUser = async () => {
    if (!user?.id) return;
    try {
      const userData = await userService.getById(user.id);
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    } catch (err) {
      console.error('Erro ao atualizar dados do usuário:', err);
      // Se falhar ao atualizar, pode ser que o token esteja inválido
      clearUser();
    }
  };

  const updateCampaign = async (campaignId: number) => {
    if (!user) return;
    try {
      await userService.update(user.id, { campaign_id: campaignId });
      const updatedUser = { ...user, campaign_id: campaignId };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      // Disparar evento personalizado para notificar outros componentes
      window.dispatchEvent(new CustomEvent('campaignChanged', { 
        detail: { campaignId } 
      }));
    } catch (err) {
      console.error('Erro ao atualizar campanha:', err);
      throw err;
    }
  };

  // Função para setar usuário que também limpa o anterior
  const setUserSafe = (newUser: User | null) => {
    if (newUser) {
      setUser(newUser);
      localStorage.setItem('user', JSON.stringify(newUser));
    } else {
      clearUser();
    }
  };

  return (
    <UserContext.Provider value={{ 
      user, 
      setUser: setUserSafe, 
      updateCampaign, 
      refreshUser,
      clearUser 
    }}>
      {children}
    </UserContext.Provider>
  );
};