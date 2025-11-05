import api from './api';
import { campaignService, type Campaign } from './campaignService';
import { userService } from './userService';

export interface NetworkUser {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'manager';
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
    managerCount: number;
    networkDepth: number;
  };
}

export interface FullCampaignNetwork {
  rootNetwork: NetworkUser;
  userPosition: NetworkUser | null;
  campaign: Campaign | null;
  campaignCreatorId: number | null;
  stats: {
    totalMembers: number;
    directInvites: number;
    adminCount: number;
    userCount: number;
    managerCount: number;
    networkDepth: number;
  };
}

export const networkService = {
  /**
   * Busca a árvore de rede de um usuário específico
   * @param userId ID do usuário
   * @returns Promise com a estrutura da rede
   */
  async getNetworkTree(userId: string | number | undefined): Promise<NetworkUser> {
    const response = await api.get<NetworkResponse>(`api/network/tree/${userId}`);
    return response.data.data;
  },

  /**
   * NOVO: Busca a árvore de rede filtrada por campanha
   * @param campaignId ID da campanha
   * @param invitedById ID do usuário que convidou (normalmente o criador/manager)
   * @returns Promise com a estrutura da rede filtrada por campanha
   */
  async getNetworkTreeByCampaign(campaignId: string | number , invitedById: string | number): Promise<NetworkUser> {
    try {
      const response = await api.post<NetworkResponse>('api/network/treeCampaign', {
        campaign_id: campaignId,
        invited_by: invitedById
      });
      return response.data.data;
    } catch (error) {
      console.error(`Erro ao buscar rede da campanha ${campaignId}:`, error);
      throw error;
    }
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
   * Busca campanhas que um usuário gerencia (onde ele é operator)
   * @param userId ID do usuário
   * @returns Promise com as campanhas gerenciadas pelo usuário
   */
  async getManagedCampaigns(userId: string | number): Promise<Campaign[]> {
    try {
      const allCampaigns = await this.getAllCampaigns();
      return allCampaigns.filter(campaign => {
        // Verifica se o usuário está na lista de operators da campanha
        if (campaign.operator) {
          const operatorIds = campaign.operator.split(',').map(id => id.trim());
          return operatorIds.includes(userId.toString());
        }
        return false;
      });
    } catch (error) {
      console.error('Erro ao buscar campanhas gerenciadas:', error);
      return [];
    }
  },

  /**
   * Busca todas as campanhas que um usuário pode acessar (criadas + gerenciadas)
   * @param userId ID do usuário
   * @returns Promise com campanhas acessíveis
   */
  async getUserAccessibleCampaigns(userId: string | number): Promise<Campaign[]> {
    try {
      const [createdCampaigns, managedCampaigns] = await Promise.all([
        this.getCampaignsByUser(userId),
        this.getManagedCampaigns(userId)
      ]);

      // Remove duplicatas
      const allCampaigns = [...createdCampaigns, ...managedCampaigns];
      const uniqueCampaigns = allCampaigns.filter((campaign, index, self) =>
        index === self.findIndex(c => c.id === campaign.id)
      );

      console.log(`🎯 Campanhas acessíveis para usuário ${userId}:`, {
        criadas: createdCampaigns.length,
        gerenciadas: managedCampaigns.length,
        total: uniqueCampaigns.length
      });

      return uniqueCampaigns;
    } catch (error) {
      console.error('Erro ao buscar campanhas acessíveis:', error);
      return [];
    }
  },

  /**
   * Busca campanhas de um usuário com suas redes completas usando a nova rota
   * @param userId ID do usuário
   * @returns Promise com campanhas e suas redes
   */
  async getUserCampaignsWithNetworks(userId: string | number): Promise<FullCampaignNetwork[]> {
    try {
      // Busca apenas as campanhas que o usuário pode acessar
      const accessibleCampaigns = await this.getUserAccessibleCampaigns(userId);
      const campaignsWithNetworks: FullCampaignNetwork[] = [];

      console.log(`🔍 Buscando redes para ${accessibleCampaigns.length} campanhas acessíveis`);

      // Para cada campanha acessível, busca a rede usando a nova rota
      for (const campaign of accessibleCampaigns) {
        try {
          console.log(`🔄 Processando campanha: ${campaign.name} (ID: ${campaign.id})`);

          // Determina quem é o "root" da rede para esta campanha
          let networkRootUserId: string | number;

          // Se o usuário é o criador da campanha, usa ele mesmo como root
          if (campaign.created_by.toString() === userId.toString()) {
            networkRootUserId = userId;
          } 
          // Se o usuário é manager (operator), usa o criador da campanha como root
          else if (campaign.operator && campaign.operator.split(',').map(id => id.trim()).includes(userId.toString())) {
            networkRootUserId = campaign.created_by;
          }
          // Caso contrário, não deveria ter acesso (mas por segurança usa o criador)
          else {
            networkRootUserId = campaign.created_by;
          }

          console.log(`👑 Root da rede para campanha ${campaign.name}: ${networkRootUserId}`);

          // Busca a rede FILTRADA por campanha usando a nova rota
          const rootNetwork = await this.getNetworkTreeByCampaign(
            campaign.id.toString(), 
            networkRootUserId
          );

          console.log(`✅ Rede carregada para campanha ${campaign.name}: ${this.calculateNetworkStats(rootNetwork).totalMembers} membros`);

          const stats = this.calculateNetworkStats(rootNetwork);

          const campaignNetwork: FullCampaignNetwork = {
            rootNetwork,
            userPosition: this.findUserInNetwork(rootNetwork, Number(userId)),
            campaign,
            campaignCreatorId: campaign.created_by,
            stats
          };

          campaignsWithNetworks.push(campaignNetwork);
          
        } catch (error) {
          console.warn(`⚠️ Erro ao processar campanha ${campaign.name}:`, error);
          
          // Fallback: cria uma rede mínima
          try {
            const creatorData = await userService.getById(campaign.created_by.toString());
            const minimalNetwork: NetworkUser = {
              id: campaign.created_by,
              name: creatorData.name,
              email: creatorData.email,
              role: creatorData.role as 'admin' | 'user' | 'manager',
              campaign_id: campaign.id.toString(),
              phone: creatorData.phone,
              invited_by: creatorData.invited_by ? Number(creatorData.invited_by) : null,
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
                adminCount: creatorData.role === 'admin' ? 1 : 0,
                userCount: creatorData.role === 'user' ? 1 : 0,
                managerCount: creatorData.role === 'manager' ? 1 : 0,
                networkDepth: 1
              }
            };

            campaignsWithNetworks.push(fallbackNetwork);
            console.log(`🔄 Fallback criado para campanha ${campaign.name}`);
          } catch {
            // Fallback mais básico
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
                managerCount: 0,
                networkDepth: 1
              }
            };

            campaignsWithNetworks.push(fallbackNetwork);
          }
        }
      }

      console.log(`🎉 Total de campanhas processadas: ${campaignsWithNetworks.length}`);
      return campaignsWithNetworks;
    } catch (error) {
      console.error('Erro ao buscar campanhas do usuário com redes:', error);
      return [];
    }
  },

  /**
   * Busca a rede completa da campanha usando a nova rota
   */
  async getFullCampaignNetwork(userId: string | number, userCampaignId: string | null): Promise<FullCampaignNetwork | null> {
    try {
      if (!userCampaignId) {
        return await this.getFallbackNetwork(userId, userCampaignId);
      }

      // Busca a campanha
      const userCampaign = await this.getCampaignById(userCampaignId);
      if (!userCampaign) {
        console.warn('Campanha do usuário não encontrada');
        return await this.getFallbackNetwork(userId, userCampaignId);
      }

      // Verifica se o usuário tem acesso a esta campanha
      const accessibleCampaigns = await this.getUserAccessibleCampaigns(userId);
      const hasAccess = accessibleCampaigns.some(campaign => campaign.id.toString() === userCampaignId);

      if (!hasAccess) {
        console.warn(`Usuário ${userId} não tem acesso à campanha ${userCampaignId}`);
        return null;
      }

      // Determina o root da rede
      let networkRootUserId: string | number;
      if (userCampaign.created_by.toString() === userId.toString()) {
        networkRootUserId = userId;
      } else {
        networkRootUserId = userCampaign.created_by;
      }

      // Busca a rede filtrada por campanha
      const rootNetwork = await this.getNetworkTreeByCampaign(userCampaignId, networkRootUserId);

      const userPosition = this.findUserInNetwork(rootNetwork, Number(userId));
      const stats = this.calculateNetworkStats(rootNetwork);

      return {
        rootNetwork,
        userPosition,
        campaign: userCampaign,
        campaignCreatorId: userCampaign.created_by,
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
   * Busca rede de um usuário com informações da campanha
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
   * Calcula estatísticas da rede
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
    const managerCount = countByRole(networkUser, 'manager');

    return {
      totalMembers,
      directInvites,
      adminCount,
      userCount,
      managerCount,
      networkDepth: this.calculateNetworkDepth(networkUser)
    };
  },

  /**
   * Calcula a profundidade máxima da rede
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
   */
  collapseAllNodes(rootId: number): Set<number> {
    return new Set([rootId]);
  }
};

export default networkService;