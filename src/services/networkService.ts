import api from './api';

export interface NetworkUser {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'user';
  invited_by: number;
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

export const networkService = {
  /**
   * Busca a árvore de rede de um usuário
   * @param userId ID do usuário
   * @returns Promise com a estrutura da rede
   */
  async getNetworkTree(userId: string | number): Promise<NetworkUser> {
    const response = await api.get<NetworkResponse>(`api/network/tree/${userId}`);
    return response.data.data;
  },

  /**
   * Busca todas as redes da plataforma
   * @returns Promise com todas as redes
   */
  async getAllNetworks(): Promise<NetworkUser[]> {
    const response = await api.get<AllNetworksResponse>('api/network/tree');
    return response.data.data;
  },

  /**
   * Busca a rede completa com estatísticas
   * @param userId ID do usuário
   * @returns Promise com a resposta completa da rede
   */
  async getFullNetwork(userId: string | number): Promise<NetworkResponse> {
    const response = await api.get<NetworkResponse>(`api/network/tree/${userId}`);
    return response.data;
  },

  /**
   * Busca apenas os convites diretos de um usuário
   * @param userId ID do usuário
   * @returns Promise com a lista de convites diretos
   */
  async getDirectInvites(userId: string | number): Promise<NetworkUser[]> {
    const response = await api.get<NetworkResponse>(`api/network/tree/${userId}`);
    return response.data.data.children;
  },

  /**
   * Calcula estatísticas da rede
   * @param networkUser Usuário raiz da rede
   * @returns Estatísticas da rede
   */
  calculateNetworkStats(networkUser: NetworkUser) {
    const countTotalMembers = (node: NetworkUser): number => {
      let count = 1; // contar o próprio nó
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