// src/contexts/UserContext.tsx
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { userService, type User } from '../services/userService';

type UserContextType = {
  user: User | null;
  setUser: (user: User | null) => void;
  updateCampaign: (campaignId: string | null) => Promise<void>;
  refreshUser: () => Promise<void>;
  clearUser: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
};

const UserContext = createContext<UserContextType>({
  user: null,
  setUser: () => {},
  updateCampaign: async () => {},
  refreshUser: async () => {},
  clearUser: () => {},
  isLoading: true,
  isAuthenticated: false,
});

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isAuthenticated = !!user;

  // Carregar usuário do localStorage e validar com a API
  useEffect(() => {
    const loadUserFromStorage = async () => {
      setIsLoading(true);
      
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          localStorage.removeItem('user');
          return;
        }
        
        const stored = localStorage.getItem('user');
        if (stored) {
          try {
            const parsedUser = JSON.parse(stored);
            
            // Verificar se o usuário ainda é válido na API
            if (parsedUser?.id) {
              try {
                const userData = await userService.getById(parsedUser.id);
                const updatedUser = { ...parsedUser, ...userData };
                setUser(updatedUser);
                localStorage.setItem('user', JSON.stringify(updatedUser));
                console.log('✅ Usuário carregado e validado:', updatedUser.email);
              } catch (error) {
                console.error('❌ Token inválido ou usuário não encontrado:', error);
                // Token expirado ou usuário não existe mais
                clearUser();
              }
            } else {
              localStorage.removeItem('user');
            }
          } catch (parseError) {
            console.error('❌ Erro ao parsear usuário do localStorage:', parseError);
            localStorage.removeItem('user');
          }
        }
      } catch (error) {
        console.error('❌ Erro ao carregar usuário do storage:', error);
        clearUser();
      } finally {
        setIsLoading(false);
      }
    };

    loadUserFromStorage();
  }, []);

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

  const clearUser = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    console.log('✅ Usuário limpo do contexto e localStorage');
    
    // Disparar evento de logout
    window.dispatchEvent(new CustomEvent('userLoggedOut'));
  };

  const refreshUser = async () => {
    if (!user?.id) {
      console.warn('⚠️ Tentativa de refresh sem usuário logado');
      return;
    }
    
    setIsLoading(true);
    try {
      console.log('🔄 Atualizando dados do usuário...');
      const userData = await userService.getById(user.id);
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      console.log('✅ Dados do usuário atualizados:', updatedUser.email);
    } catch (err) {
      console.error('❌ Erro ao atualizar dados do usuário:', err);
      // Se falhar ao atualizar, pode ser que o token esteja inválido
      clearUser();
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateCampaign = async (campaignId: string | null) => {
    if (!user) {
      throw new Error('Usuário não autenticado');
    }
    
    setIsLoading(true);
    try {
      console.log(`🔄 Atualizando campanha do usuário para: ${campaignId}`);
      
      // Usar o método assignToCampaign ou removeFromCampaign do userService
      let updatedUser: User;
      
      if (campaignId) {
        // Atribuir à campanha
        updatedUser = await userService.assignToCampaign(user.id, campaignId);
      } else {
        // Remover da campanha
        updatedUser = await userService.removeFromCampaign(user.id);
      }
      
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      console.log(`✅ Campanha atualizada para: ${campaignId}`);
      
      // Disparar evento personalizado para notificar outros componentes
      window.dispatchEvent(new CustomEvent('campaignChanged', { 
        detail: { 
          campaignId,
          userId: user.id,
          userName: user.name
        } 
      }));
    } catch (err) {
      console.error('❌ Erro ao atualizar campanha:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Função para setar usuário que também limpa o anterior
  const setUserSafe = (newUser: User | null) => {
    if (newUser) {
      setUser(newUser);
      localStorage.setItem('user', JSON.stringify(newUser));
      console.log('✅ Usuário definido no contexto:', newUser.email);
      
      // Disparar evento de login
      window.dispatchEvent(new CustomEvent('userLoggedIn', { 
        detail: { user: newUser } 
      }));
    } else {
      clearUser();
    }
  };

  const value = {
    user, 
    setUser: setUserSafe, 
    updateCampaign, 
    refreshUser,
    clearUser,
    isLoading,
    isAuthenticated,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};