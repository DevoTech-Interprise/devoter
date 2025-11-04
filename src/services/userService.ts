import api from './api';

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

  // 🔹 NOVO: Busca usuários por campanha
  getUsersByCampaign: async (campaignId: string): Promise<User[]> => {
    const allUsers = await userService.getAll();
    return allUsers.filter(user => user.campaign_id === campaignId);
  },

  // 🔹 NOVO: Busca toda a rede de usuários de uma campanha
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

  // 🔹 NOVO: Busca usuários por localização (cidade, estado, bairro)
  getUsersByLocation: async (filters: { city?: string; state?: string; neighborhood?: string }): Promise<User[]> => {
    const allUsers = await userService.getAll();
    
    return allUsers.filter(user => {
      if (filters.city && user.city !== filters.city) return false;
      if (filters.state && user.state !== filters.state) return false;
      if (filters.neighborhood && user.neighborhood !== filters.neighborhood) return false;
      return true;
    });
  }
};