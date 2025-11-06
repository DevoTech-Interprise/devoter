import api from './api';
import { testAuthService } from './testAuthService';

// Cache para o token
let cachedToken: string | null = null;
let tokenExpiry: number | null = null;

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  gender: string;
  country: string;
  state: string;
  city: string;
  neighborhood: string;
  role: string;
  invited_by: string | null;
  campaign_id: string | null;
  invite_token: string | null;
  is_active: string;
  created_at: string;
  updated_at: string;
}

export const userService = {

  // 🔹 Obter token (com cache)
  async getAuthToken(): Promise<string> {
    // Verifica se tem token em cache e se não expirou (1 hora)
    if (cachedToken && tokenExpiry && Date.now() < tokenExpiry) {
      console.log('🔄 Usando token em cache');
      return cachedToken;
    }

    console.log('🔄 Obtendo novo token...');
    const token = await testAuthService.getTestToken();

    // Cache o token por 1 hora
    cachedToken = token;
    tokenExpiry = Date.now() + 60 * 60 * 1000;

    return token;
  },

  // 🔹 Busca todos os usuários
  getAll: async (): Promise<User[]> => {
    const { data } = await api.get('api/auth');
    return data;
  },

  // 🔹 Busca um usuário específico pelo ID
  getById: async (id: number | string): Promise<User> => {
    const { data } = await api.get(`api/auth/${id}`);
    return data;
  },

  // 🔹 Atualiza dados de um usuário (ex: campaign_id)
  update: async (id: number | string, payload: Record<string, any>): Promise<User> => {
    const { data } = await api.put(`api/auth/${id}`, payload);
    return data;
  },

  // 🔹 Cria novo usuário
  create: async (payload: Record<string, any>): Promise<User> => {
    const { data } = await api.post('api/auth', payload);
    return data;
  },

  // 🔹 Remove um usuário
  delete: async (id: number | string): Promise<void> => {
    const { data } = await api.delete(`api/auth/${id}`);
    return data;
  },

  // 🔹 Busca usuários por campanha
  getUsersByCampaign: async (campaignId: string): Promise<User[]> => {
    const allUsers = await userService.getAll();
    return allUsers.filter(user => user.campaign_id === campaignId);
  },

  // No userService.ts, modifique o getNetworkUsersByCampaign para ser mais robusto:
  getNetworkUsersByCampaign: async (campaignId: string): Promise<User[]> => {
    const allUsers = await userService.getAll();
    const campaignUsers = allUsers.filter(user => user.campaign_id === campaignId);

    // Se não há usuários na campanha, retorna vazio
    if (campaignUsers.length === 0) return [];

    // Encontra o criador da campanha (usuário com role admin e campaign_id)
    const campaignCreator = campaignUsers.find(user =>
      user.role === 'admin' && user.campaign_id === campaignId
    );

    if (!campaignCreator) return campaignUsers;

    // Função recursiva para buscar toda a rede
    const getNetwork = (userId: string, network: User[] = []): User[] => {
      const directInvites = allUsers.filter(user => user.invited_by === userId);

      directInvites.forEach(invitedUser => {
        if (!network.find(u => u.id === invitedUser.id)) {
          network.push(invitedUser);
          getNetwork(invitedUser.id, network);
        }
      });

      return network;
    };

    const fullNetwork = getNetwork(campaignCreator.id, [campaignCreator]);
    return fullNetwork;
  },

  // 🔹 Busca usuários por localização (cidade, estado, bairro)
  getUsersByLocation: async (filters: { city?: string; state?: string; neighborhood?: string }): Promise<User[]> => {
    const allUsers = await userService.getAll();

    return allUsers.filter(user => {
      if (filters.city && user.city !== filters.city) return false;
      if (filters.state && user.state !== filters.state) return false;
      if (filters.neighborhood && user.neighborhood !== filters.neighborhood) return false;
      return true;
    });
  },

  // 🔹 Buscar managers disponíveis (sem campaign_id)
  getAvailableManagers: async (): Promise<User[]> => {
    const allUsers = await userService.getAll();
    return allUsers.filter(user =>
      user.role === 'manager' &&
      (!user.campaign_id || user.campaign_id === null || user.campaign_id === '')
    );
  },

  // Adicione este método ao userService
  getManageableUsers: async (userId: string | number | undefined, userRole?: string): Promise<User[]> => {
    try {
      console.log('🔍 Buscando usuários gerenciáveis para:', userId, 'Role:', userRole);

      // Se o usuário é super, retorna todos os usuários
      if (userRole === 'super') {
        console.log('👑 Usuário SUPER: carregando todos os usuários');
        return await userService.getAll();
      }

      // Buscar todas as campanhas
      const response = await api.get('api/campaigns');
      const allCampaigns = response.data;

      // Filtrar campanhas que o usuário criou ou gerencia
      const myCampaigns = allCampaigns.filter((campaign: any) => {
        const isCreator = String(campaign.created_by) === String(userId);
        const isOperator = campaign.operator &&
          campaign.operator.split(',').some((operatorId: string) =>
            operatorId.trim() === String(userId)
          );
        return isCreator || isOperator;
      });

      console.log(`📋 Encontradas ${myCampaigns.length} campanhas do usuário`);

      // Buscar todos os usuários
      const allUsers = await userService.getAll();

      // Se não tem campanhas, retorna apenas o próprio usuário (se existir)
      if (myCampaigns.length === 0) {
        const currentUser = allUsers.find(user => String(user.id) === String(userId));
        return currentUser ? [currentUser] : [];
      }

      // IDs das campanhas do usuário
      const myCampaignIds = myCampaigns.map((campaign: any) => String(campaign.id));

      // Filtrar usuários que estão nas campanhas do usuário
      const manageableUsers = allUsers.filter(user =>
        user.campaign_id && myCampaignIds.includes(user.campaign_id)
      );

      console.log(`👥 Encontrados ${manageableUsers.length} usuários gerenciáveis`);
      return manageableUsers;

    } catch (error) {
      console.error('❌ Erro ao buscar usuários gerenciáveis:', error);
      throw error;
    }
  },



  // 🔹 Atualizar campaign_id de um manager
  assignToCampaign: async (userId: string, campaignId: string, invitedBy?: string): Promise<User> => {
    console.log(`=== ASSIGNING USER TO CAMPAIGN ===`);
    console.log(`User ID: ${userId}`);
    console.log(`Campaign ID: ${campaignId}`);
    console.log(`Invited By: ${invitedBy}`);

    const payload: any = {
      campaign_id: campaignId
    };

    // Adicionar invited_by se fornecido
    if (invitedBy) {
      payload.invited_by = invitedBy;
    }

    console.log('📤 Payload sendo enviado:', payload);
    console.log('🔗 URL:', `api/auth/${userId}`);

    try {
      console.log('🔄 Fazendo requisição PUT...');
      const response = await api.put(`api/auth/${userId}`, payload);

      console.log('📥 Resposta do servidor:', response);
      console.log('✅ Dados retornados:', response.data);

      // Verificar se os campos foram atualizados corretamente
      if (response.data) {
        console.log('🔍 Verificando campos atualizados:');
        console.log('   campaign_id:', response.data.campaign_id);
        console.log('   invited_by:', response.data.invited_by);
      }

      console.log(`✅ Usuário ${userId} vinculado com sucesso`);
      return response.data;
    } catch (error: any) {
      console.error(`❌ Erro ao vincular usuário ${userId}:`, error);

      // Log mais detalhado do erro
      if (error.response) {
        console.error('📥 Resposta de erro:', error.response);
        console.error('📊 Status:', error.response.status);
        console.error('📝 Dados do erro:', error.response.data);
      } else if (error.request) {
        console.error('🌐 Erro de rede:', error.request);
      } else {
        console.error('⚡ Erro geral:', error.message);
      }

      throw error;
    }
  },

  removeFromCampaign: async (userId: string): Promise<User> => {
    console.log(`=== REMOVING USER FROM CAMPAIGN ===`);
    console.log(`User ID: ${userId}`);

    const payload = {
      campaign_id: null,
      invited_by: null // Também limpa o invited_by
    };

    console.log('📤 Payload sendo enviado:', payload);
    console.log('🔗 URL:', `api/auth/${userId}`);

    try {
      console.log('🔄 Fazendo requisição PUT...');
      const response = await api.put(`api/auth/${userId}`, payload);

      console.log('📥 Resposta do servidor:', response);
      console.log('✅ Dados retornados:', response.data);

      // Verificar se os campos foram atualizados corretamente
      if (response.data) {
        console.log('🔍 Verificando campos atualizados:');
        console.log('   campaign_id:', response.data.campaign_id);
        console.log('   invited_by:', response.data.invited_by);

        // Verificar se realmente foram limpos
        if (response.data.campaign_id !== null && response.data.campaign_id !== '') {
          console.warn('⚠️ campaign_id não foi limpo corretamente!');
        }
        if (response.data.invited_by !== null && response.data.invited_by !== '') {
          console.warn('⚠️ invited_by não foi limpo corretamente!');
        }
      }

      console.log(`✅ Usuário ${userId} removido com sucesso`);
      return response.data;
    } catch (error: any) {
      console.error(`❌ Erro ao remover usuário ${userId}:`, error);

      // Log mais detalhado do erro
      if (error.response) {
        console.error('📥 Resposta de erro:', error.response);
        console.error('📊 Status:', error.response.status);
        console.error('📝 Dados do erro:', error.response.data);
      } else if (error.request) {
        console.error('🌐 Erro de rede:', error.request);
      } else {
        console.error('⚡ Erro geral:', error.message);
      }

      throw error;
    }
  },

  // 🔹 Buscar managers por campanha
  getManagersByCampaign: async (campaignId: string): Promise<User[]> => {
    const allUsers = await userService.getAll();
    return allUsers.filter(user =>
      user.role === 'manager' && user.campaign_id === campaignId
    );
  },

  // 🔹 Buscar todos os managers (independente de campanha)
  getAllManagers: async (): Promise<User[]> => {
    const allUsers = await userService.getAll();
    return allUsers.filter(user => user.role === 'manager');
  },

  updatePassword: async (userId: string, newPassword: string): Promise<User> => {
    console.log(`🔐 Atualizando senha do usuário ${userId}`);

    const { data } = await api.put(`api/auth/${userId}`, {
      password: newPassword
      // Não precisa enviar outros campos se o backend só atualiza a senha
    });

    console.log(`✅ Senha do usuário ${userId} atualizada com sucesso`);
    return data;
  },

  // 🔹 Buscar usuário por email (para encontrar o ID pelo email)
  getByEmail: async (email: string): Promise<User | null> => {
    try {
      console.log('🔍 Buscando todos os usuários...');
      const allUsers = await userService.getAll();

      console.log('📋 Total de usuários encontrados:', allUsers.length);
      console.log('🔎 Procurando email:', email);

      const user = allUsers.find(u => u.email.toLowerCase() === email.toLowerCase());

      if (user) {
        console.log('✅ Usuário encontrado:', user.id, user.email);
      } else {
        console.log('❌ Usuário não encontrado para email:', email);
        console.log('📧 Emails disponíveis:', allUsers.map(u => u.email));
      }

      return user || null;
    } catch (error: any) {
      console.error('❌ Erro ao buscar usuário por email:', error);

      // Se for erro de rede
      if (error.message?.includes('Network Error') || error.code === 'NETWORK_ERROR') {
        throw new Error("Erro de conexão ao buscar usuário. Verifique sua internet.");
      }

      throw error;
    }
  },
};