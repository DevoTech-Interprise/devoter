// src/hooks/useUserActions.ts
import { useUser } from '../../context/UserContext';
import { userService, type User } from '../../services/userService';

export const useUserActions = () => {
  const { user, updateCampaign, refreshUser, clearUser, isLoading } = useUser();

  const switchCampaign = async (campaignId: string | null) => {
    if (!user) throw new Error('Usuário não autenticado');
    return await updateCampaign(campaignId);
  };

  const logout = () => {
    console.log('🚪 Efetuando logout...');
    clearUser();
    // Opcional: redirecionar para login
    window.location.href = '/login';
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (!user) throw new Error('Usuário não autenticado');
    
    try {
      console.log('🔄 Atualizando perfil do usuário...');
      const updatedUser = await userService.update(user.id, updates);
      await refreshUser(); // Atualiza o contexto com os novos dados
      return updatedUser;
    } catch (error) {
      console.error('❌ Erro ao atualizar perfil:', error);
      throw error;
    }
  };

  const updatePassword = async (newPassword: string) => {
    if (!user) throw new Error('Usuário não autenticado');
    
    try {
      console.log('🔐 Atualizando senha...');
      const updatedUser = await userService.updatePassword(user.id, newPassword);
      return updatedUser;
    } catch (error) {
      console.error('❌ Erro ao atualizar senha:', error);
      throw error;
    }
  };

  const getManageableUsers = async () => {
    if (!user) throw new Error('Usuário não autenticado');
    
    try {
      console.log('👥 Buscando usuários gerenciáveis...');
      return await userService.getManageableUsers(user.id, user.role);
    } catch (error) {
      console.error('❌ Erro ao buscar usuários gerenciáveis:', error);
      throw error;
    }
  };

  const getNetworkUsers = async (campaignId: string) => {
    if (!user) throw new Error('Usuário não autenticado');
    
    try {
      console.log('🌐 Buscando rede de usuários...');
      return await userService.getNetworkUsersByCampaign(campaignId);
    } catch (error) {
      console.error('❌ Erro ao buscar rede de usuários:', error);
      throw error;
    }
  };

  return {
    // Estado
    user,
    isLoading,
    isAuthenticated: !!user,
    
    // Ações
    switchCampaign,
    logout,
    updateProfile,
    updatePassword,
    getManageableUsers,
    getNetworkUsers,
    refreshUser,
    
    // Permissões e verificações
    canSwitchCampaign: !!user,
    isSuper: user?.role === 'super',
    isManager: user?.role === 'manager',
    isAdmin: user?.role === 'admin',
    hasCampaign: !!user?.campaign_id,
  };
};