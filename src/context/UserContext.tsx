import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { userService } from '../services/userService';

type User = {
  id: string ;
  name: string;
  campaign_id?: number;
  [key: string]: any;
};

type UserContextType = {
  user: User | null;
  setUser: (user: User) => void;
  updateCampaign: (campaignId: number) => Promise<void>;
  refreshUser: () => Promise<void>;
};

const UserContext = createContext<UserContextType>({
  user: null,
  setUser: () => {},
  updateCampaign: async () => {},
  refreshUser: async () => {},
});

export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });

  // Função para atualizar dados do usuário
  const refreshUser = async () => {
    if (!user?.id) return;
    try {
      const userData = await userService.getById(user.id);
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    } catch (err) {
      console.error('Erro ao atualizar dados do usuário:', err);
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

  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    }
  }, [user]);

  return (
    <UserContext.Provider value={{ user, setUser, updateCampaign, refreshUser }}>
      {children}
    </UserContext.Provider>
  );
};