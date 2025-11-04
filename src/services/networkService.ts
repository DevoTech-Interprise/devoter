import type { ReactNode } from 'react';
import api from './api';
import { campaignService, type Campaign } from './campaignService';

export interface NetworkUser {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'user';
  campaign_id: string | null;
  phone: string;
  invited_by: number | null;
  children: NetworkUser[];
}

export interface NetworkResponse {
  status: string;
  data: NetworkUser;
}

export interface AllNetworksResponse {
  status: string;
  data: NetworkUser[];
}

export interface NetworkWithCampaign {
  network: NetworkUser;
  campaign: Campaign | null;
  stats: {
    totalMembers: number;
    directInvites: number;
    adminCount: number;
    userCount: number;
    networkDepth: number;
  };
}

export interface FullCampaignNetwork {
  rootNetwork: NetworkUser; // Rede completa desde o criador da campanha
  userPosition: NetworkUser | null; // Posição do usuário atual na rede
  campaign: Campaign | null;
  campaignCreatorId: number | null; // ID do criador da campanha
  stats: {
    totalMembers: number;
    directInvites: number;
    adminCount: number;
    userCount: number;
    networkDepth: number;
  };
}

export const networkService = {
  /**
   * Busca a árvore de rede de um usuário específico
   * @param userId ID do usuário
   * @returns Promise com a estrutura da rede
   */
  async getNetworkTree(userId: string | number): Promise<NetworkUser> {
    const response = await api.get<NetworkResponse>(`api/network/tree/${userId}`);
    return response.data.data;
  },

  /**
   * Busca todas as redes da plataforma (apenas para admin)
   * @returns Promise com todas as redes
   */
  async getAllNetworks(): Promise<NetworkUser[]> {
    const response = await api.get<AllNetworksResponse>('api/network/tree');
    return response.data.data;
  },

  /**
   * Busca campanha específica por ID
   * @param campaignId ID da campanha
   * @returns Promise com a campanha
   */
  async getCampaignById(campaignId: string): Promise<Campaign | null> {
    try {
      return await campaignService.getById(campaignId);
    } catch (error) {
      console.error('Erro ao buscar campanha:', error);
      return null;
    }
  },

  /**
   * Busca todas as campanhas
   * @returns Promise com todas as campanhas
   */
  async getAllCampaigns(): Promise<Campaign[]> {
    try {
      return await campaignService.getAll();
    } catch (error) {
      console.error('Erro ao buscar campanhas:', error);
      return [];
    }
  },

  /**
   * Busca campanhas criadas por um usuário específico
   * @param userId ID do usuário criador
   * @returns Promise com as campanhas do usuário
   */
  async getCampaignsByUser(userId: string | number): Promise<Campaign[]> {
    try {
      const allCampaigns = await this.getAllCampaigns();
      return allCampaigns.filter(campaign => 
        campaign.created_by.toString() === userId.toString()
      );
    } catch (error) {
      console.error('Erro ao buscar campanhas do usuário:', error);
      return [];
    }
  },

  /**
   * Busca campanhas de um usuário com suas redes completas
   * @param userId ID do usuário (admin)
   * @returns Promise com campanhas e suas redes
   */
  async getUserCampaignsWithNetworks(userId: string | number): Promise<FullCampaignNetwork[]> {
    try {
      // Busca apenas as campanhas criadas pelo usuário
      const userCampaigns = await this.getCampaignsByUser(userId);
      const campaignsWithNetworks: FullCampaignNetwork[] = [];

      console.log(`🔍 Buscando campanhas do usuário ${userId}:`, userCampaigns.length, 'encontradas');

      // Para cada campanha do usuário, busca a rede completa desde o criador
      for (const campaign of userCampaigns) {
        try {
          console.log(`🔄 Processando campanha: ${campaign.name} (ID: ${campaign.id}) criada por ${campaign.created_by}`);
          
          if (!campaign.created_by) {
            console.warn(`Campanha ${campaign.name} não tem criador definido`);
            continue;
          }

          // Busca a rede a partir do criador da campanha
          const rootNetwork = await this.getNetworkTree(campaign.created_by);
          
          const stats = this.calculateNetworkStats(rootNetwork);

          const campaignNetwork: FullCampaignNetwork = {
            rootNetwork,
            userPosition: this.findUserInNetwork(rootNetwork, campaign.created_by),
            campaign,
            campaignCreatorId: campaign.created_by,
            stats
          };

          campaignsWithNetworks.push(campaignNetwork);
          console.log(`✅ Rede encontrada para campanha ${campaign.name}: ${stats.totalMembers} membros`);
          
        } catch (error) {
          console.warn(`⚠️ Erro ao processar campanha ${campaign.name}:`, error);
          
          // Fallback: cria uma rede mínima com o criador
          const minimalNetwork: NetworkUser = {
            id: campaign.created_by,
            name: 'Criador da Campanha',
            email: '',
            role: 'admin',
            campaign_id: campaign.id.toString(),
            phone: '',
            invited_by: null,
            children: []
          };

          const fallbackNetwork: FullCampaignNetwork = {
            rootNetwork: minimalNetwork,
            userPosition: minimalNetwork,
            campaign,
            campaignCreatorId: campaign.created_by,
            stats: {
              totalMembers: 1,
              directInvites: 0,
              adminCount: 1,
              userCount: 0,
              networkDepth: 1
            }
          };

          campaignsWithNetworks.push(fallbackNetwork);
        }
      }

      console.log(`🎉 Total de campanhas do usuário processadas: ${campaignsWithNetworks.length}`);
      return campaignsWithNetworks;
    } catch (error) {
      console.error('Erro ao buscar campanhas do usuário com redes:', error);
      return [];
    }
  },

  /**
   * Busca a rede completa da campanha desde o criador até o usuário atual
   * @param userId ID do usuário atual
   * @param userCampaignId ID da campanha do usuário
   * @returns Promise com a rede completa da campanha
   */
  async getFullCampaignNetwork(userId: string | number, userCampaignId: string | null): Promise<FullCampaignNetwork | null> {
    try {
      // Busca todas as campanhas para encontrar o criador da campanha do usuário
      const allCampaigns = await this.getAllCampaigns();
      
      // Encontra a campanha do usuário
      const userCampaign = allCampaigns.find(campaign => 
        campaign.id.toString() === userCampaignId?.toString()
      );

      if (!userCampaign) {
        console.warn('Campanha do usuário não encontrada, usando rede do usuário');
        return await this.getFallbackNetwork(userId, userCampaignId);
      }

      // O criador da campanha é o root da rede
      const campaignCreatorId = userCampaign.created_by;
      
      if (!campaignCreatorId) {
        console.warn('Criador da campanha não encontrado, usando rede do usuário');
        return await this.getFallbackNetwork(userId, userCampaignId);
      }

      // Busca a rede completa a partir do criador da campanha
      const rootNetwork = await this.getNetworkTree(campaignCreatorId);

      // Verifica se o usuário atual está na rede do criador
      const userPosition = this.findUserInNetwork(rootNetwork, Number(userId));

      if (!userPosition) {
        console.warn('Usuário não encontrado na rede do criador, usando rede do usuário');
        return await this.getFallbackNetwork(userId, userCampaignId);
      }

      const stats = this.calculateNetworkStats(rootNetwork);

      return {
        rootNetwork,
        userPosition,
        campaign: userCampaign,
        campaignCreatorId,
        stats
      };

    } catch (error) {
      console.error('Erro ao buscar rede completa da campanha:', error);
      return await this.getFallbackNetwork(userId, userCampaignId);
    }
  },

  /**
   * Fallback: retorna a rede do usuário quando não consegue achar a rede completa
   */
  async getFallbackNetwork(userId: string | number, userCampaignId: string | null): Promise<FullCampaignNetwork | null> {
    try {
      const userNetwork = await this.getNetworkTree(userId);
      const campaign = userCampaignId ? await this.getCampaignById(userCampaignId) : null;

      return {
        rootNetwork: userNetwork,
        userPosition: this.findUserInNetwork(userNetwork, Number(userId)),
        campaign,
        campaignCreatorId: campaign?.created_by || null,
        stats: this.calculateNetworkStats(userNetwork)
      };
    } catch {
      return null;
    }
  },

  /**
   * Busca rede de um usuário com informações da campanha (modo simples)
   * @param userId ID do usuário
   * @returns Promise com rede e informações da campanha
   */
  async getNetworkWithCampaign(userId: string | number): Promise<NetworkWithCampaign> {
    const network = await this.getNetworkTree(userId);
    let campaign: Campaign | null = null;

    if (network.campaign_id) {
      try {
        campaign = await campaignService.getById(network.campaign_id);
      } catch (error) {
        console.warn(`Campanha ${network.campaign_id} não encontrada:`, error);
      }
    }

    const stats = this.calculateNetworkStats(network);

    return {
      network,
      campaign,
      stats
    };
  },

  /**
   * Busca todas as redes com informações das campanhas (para admin)
   * @returns Promise com redes e informações das campanhas
   */
  async getAllNetworksWithCampaigns(): Promise<NetworkWithCampaign[]> {
    try {
      const allNetworks = await this.getAllNetworks();
      const networksWithCampaign: NetworkWithCampaign[] = [];

      const promises = allNetworks.map(async (network) => {
        let campaign: Campaign | null = null;

        if (network.campaign_id) {
          try {
            campaign = await campaignService.getById(network.campaign_id);
          } catch (error) {
            console.warn(`Campanha ${network.campaign_id} não encontrada:`, error);
          }
        }

        const stats = this.calculateNetworkStats(network);

        return {
          network,
          campaign,
          stats
        };
      });

      return await Promise.all(promises);
    } catch (error) {
      console.error('Erro ao buscar redes com campanhas:', error);
      throw error;
    }
  },

  /**
   * Calcula estatísticas da rede
   * @param networkUser Usuário raiz da rede
   * @returns Estatísticas da rede
   */
  calculateNetworkStats(networkUser: NetworkUser) {
    const countTotalMembers = (node: NetworkUser): number => {
      let count = 1;
      node.children.forEach(child => {
        count += countTotalMembers(child);
      });
      return count;
    };

    const countByRole = (node: NetworkUser, role: string): number => {
      let count = node.role === role ? 1 : 0;
      node.children.forEach(child => {
        count += countByRole(child, role);
      });
      return count;
    };

    const totalMembers = countTotalMembers(networkUser);
    const directInvites = networkUser.children.length;
    const adminCount = countByRole(networkUser, 'admin');
    const userCount = countByRole(networkUser, 'user');

    return {
      totalMembers,
      directInvites,
      adminCount,
      userCount,
      networkDepth: this.calculateNetworkDepth(networkUser)
    };
  },

  /**
   * Calcula a profundidade máxima da rede
   * @param node Nó raiz
   * @returns Profundidade máxima
   */
  calculateNetworkDepth(node: NetworkUser): number {
    if (node.children.length === 0) {
      return 1;
    }
    
    let maxDepth = 0;
    node.children.forEach(child => {
      const childDepth = this.calculateNetworkDepth(child);
      maxDepth = Math.max(maxDepth, childDepth);
    });
    
    return maxDepth + 1;
  },

  /**
   * Busca um usuário específico na rede
   * @param networkUser Nó raiz da rede
   * @param userId ID do usuário a ser encontrado
   * @returns Usuário encontrado ou null
   */
  findUserInNetwork(networkUser: NetworkUser, userId: number): NetworkUser | null {
    if (networkUser.id === userId) {
      return networkUser;
    }

    for (const child of networkUser.children) {
      const found = this.findUserInNetwork(child, userId);
      if (found) {
        return found;
      }
    }

    return null;
  },

  /**
   * Expande/retrai nós na árvore
   * @param expandedNodes Conjunto de IDs expandidos
   * @param nodeId ID do nó a ser toggleado
   * @returns Novo conjunto de IDs expandidos
   */
  toggleNode(expandedNodes: Set<number>, nodeId: number): Set<number> {
    const newSet = new Set(expandedNodes);
    if (newSet.has(nodeId)) {
      newSet.delete(nodeId);
    } else {
      newSet.add(nodeId);
    }
    return newSet;
  },

  /**
   * Expande o caminho desde a raiz até o usuário atual
   * @param rootNetwork Rede raiz
   * @param userId ID do usuário atual
   * @returns Conjunto com IDs expandidos no caminho
   */
  expandPathToUser(rootNetwork: NetworkUser, userId: number): Set<number> {
    const findPath = (node: NetworkUser, targetId: number): number[] => {
      if (node.id === targetId) {
        return [node.id];
      }

      for (const child of node.children) {
        const path = findPath(child, targetId);
        if (path.length > 0) {
          return [node.id, ...path];
        }
      }

      return [];
    };

    const path = findPath(rootNetwork, userId);
    return new Set(path);
  },

  /**
   * Expande todos os nós da árvore
   * @param networkUser Nó raiz da rede
   * @returns Conjunto com todos os IDs expandidos
   */
  expandAllNodes(networkUser: NetworkUser): Set<number> {
    const getAllIds = (node: NetworkUser): number[] => {
      const ids = [node.id];
      node.children.forEach(child => {
        ids.push(...getAllIds(child));
      });
      return ids;
    };

    return new Set(getAllIds(networkUser));
  },

  /**
   * Retrai todos os nós exceto o raiz
   * @param rootId ID do nó raiz
   * @returns Conjunto apenas com o ID raiz
   */
  collapseAllNodes(rootId: number): Set<number> {
    return new Set([rootId]);
  }
};

export default networkService;