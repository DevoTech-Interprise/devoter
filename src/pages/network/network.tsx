import { useState, useEffect } from 'react';
import { Users, Loader2, ChevronDown, ChevronRight, User, Mail, Crown, Shield, Filter, Building2 } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import { useUser } from '../../context/UserContext';
import { networkService, type NetworkUser } from '../../services/networkService';
import { campaignService, type Campaign } from '../../services/campaignService';
import { userService, type User as UserType } from '../../services/userService';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Interface extendida para incluir dados completos do usuário e campanha
interface EnhancedNetworkUser extends NetworkUser {
  userData?: UserType;
  campaignData?: Campaign;
}

const NetworkPage = () => {
  const { user } = useUser();
  const [network, setNetwork] = useState<EnhancedNetworkUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set());
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<string>('all');
  const [filteredNetwork, setFilteredNetwork] = useState<EnhancedNetworkUser | null>(null);
  const [allUsers, setAllUsers] = useState<UserType[]>([]);
  const [campaignCreatorId, setCampaignCreatorId] = useState<string | null>(null);

  const isAdmin = user?.role === 'admin';

  // Função para encontrar o criador da campanha do usuário
  const findCampaignCreator = (userCampaignId: string): string | null => {
    const campaign = campaigns.find(c => c.id.toString() === userCampaignId);
    return campaign?.created_by?.toString() || null;
  };

  // Função para buscar a rede completa desde o criador da campanha
  const getFullCampaignNetwork = async (): Promise<NetworkUser | null> => {
    if (!user?.campaign_id) {
      // Se não tem campanha, busca a rede do próprio usuário
      return await networkService.getNetworkTree(user?.id || '');
    }

    try {
      // Busca o criador da campanha
      const creatorId = findCampaignCreator(user.campaign_id);
      
      if (creatorId) {
        setCampaignCreatorId(creatorId);
        console.log(`🔍 Buscando rede completa desde o criador: ${creatorId}`);
        // Busca a rede completa desde o criador
        return await networkService.getNetworkTree(creatorId);
      } else {
        console.log(`⚠️ Criador não encontrado, buscando rede do usuário: ${user.id}`);
        // Se não encontrar criador, busca a rede do próprio usuário
        return await networkService.getNetworkTree(user.id);
      }
    } catch (error) {
      console.error('Erro ao buscar rede completa da campanha:', error);
      // Fallback: busca a rede do próprio usuário
      return await networkService.getNetworkTree(user.id);
    }
  };

  // Função para enriquecer os dados da rede com informações completas
  const enhanceNetworkWithFullData = async (node: NetworkUser): Promise<EnhancedNetworkUser> => {
    try {
      // Busca dados completos do usuário
      const userData = await userService.getById(node.id.toString());
      
      // Busca dados da campanha se existir - agora usando a lista local de campanhas
      let campaignData: Campaign | undefined;
      if (userData.campaign_id) {
        campaignData = campaigns.find(campaign => campaign.id.toString() === userData.campaign_id);
      }

      // Processa os filhos recursivamente
      const enhancedChildren: EnhancedNetworkUser[] = [];
      for (const child of node.children) {
        const enhancedChild = await enhanceNetworkWithFullData(child);
        enhancedChildren.push(enhancedChild);
      }

      return {
        ...node,
        userData,
        campaignData,
        children: enhancedChildren
      };
    } catch (error) {
      console.warn(`Erro ao buscar dados do usuário ${node.id}:`, error);
      // Retorna os dados básicos se não conseguir buscar os dados completos
      const enhancedChildren: EnhancedNetworkUser[] = [];
      for (const child of node.children) {
        const enhancedChild = await enhanceNetworkWithFullData(child);
        enhancedChildren.push(enhancedChild);
      }

      return {
        ...node,
        children: enhancedChildren
      };
    }
  };

  // Função para filtrar a rede por campanha - APENAS PARA ADMIN
  const filterNetworkByCampaign = (node: EnhancedNetworkUser, campaignId: string): EnhancedNetworkUser | null => {
    if (campaignId === 'all') {
      // Se for "all", retorna a rede completa
      const filteredChildren: EnhancedNetworkUser[] = [];
      node.children.forEach(child => {
        const filteredChild = filterNetworkByCampaign(child, campaignId);
        if (filteredChild) {
          filteredChildren.push(filteredChild);
        }
      });
      
      return {
        ...node,
        children: filteredChildren
      };
    }

    // VERIFICAÇÃO: Usa userData.campaign_id
    const userBelongsToCampaign = node.userData?.campaign_id === campaignId;

    // Filtra os filhos
    const filteredChildren: EnhancedNetworkUser[] = [];
    node.children.forEach(child => {
      const filteredChild = filterNetworkByCampaign(child, campaignId);
      if (filteredChild) {
        filteredChildren.push(filteredChild);
      }
    });

    // Se o usuário atual pertence à campanha OU tem filhos que pertencem, inclui na rede
    if (userBelongsToCampaign || filteredChildren.length > 0) {
      return {
        ...node,
        children: filteredChildren
      };
    }

    return null;
  };

  // Função para buscar campanha do usuário
  const getUserCampaign = (userId: string): Campaign | undefined => {
    const user = allUsers.find(u => u.id === userId.toString());
    if (!user || !user.campaign_id) return undefined;
    
    return campaigns.find(campaign => campaign.id.toString() === user.campaign_id);
  };

  // Função para obter campanhas que o usuário pode ver
  const getAvailableCampaigns = (): Campaign[] => {
    if (isAdmin) {
      // Admin vê todas as campanhas
      return campaigns;
    } else {
      // Usuário comum vê apenas a campanha dele
      const userCampaign = campaigns.find(campaign => 
        campaign.id.toString() === user?.campaign_id
      );
      return userCampaign ? [userCampaign] : [];
    }
  };

  // Função para expandir o caminho até o usuário atual
  const expandPathToUser = (node: NetworkUser, userId: number): Set<number> => {
    const findPath = (currentNode: NetworkUser, targetId: number): number[] => {
      if (currentNode.id === targetId) {
        return [currentNode.id];
      }

      for (const child of currentNode.children) {
        const path = findPath(child, targetId);
        if (path.length > 0) {
          return [currentNode.id, ...path];
        }
      }

      return [];
    };

    const path = findPath(node, userId);
    return new Set(path);
  };

  const fetchNetwork = async () => {
    try {
      setLoading(true);
      if (!user?.id) {
        toast.error('Usuário não encontrado');
        return;
      }

      console.log(`👤 Usuário: ${user.name}, Campanha: ${user.campaign_id}, Admin: ${isAdmin}`);

      // Busca todos os usuários para ter dados completos
      const usersData = await userService.getAll();
      setAllUsers(usersData);

      // Busca todas as campanhas
      const allCampaigns = await campaignService.getAll();
      setCampaigns(allCampaigns);
      console.log(`🏢 Campanhas carregadas:`, allCampaigns.length);

      // Busca a rede
      let networkData: NetworkUser | null;
      
      if (isAdmin) {
        // Admin: busca rede a partir do próprio usuário
        console.log(`👑 Admin: buscando rede do usuário ${user.id}`);
        networkData = await networkService.getNetworkTree(user.id);
      } else {
        // Usuário comum: busca rede completa desde o criador da campanha
        console.log(`👤 Usuário comum: buscando rede completa da campanha ${user.campaign_id}`);
        networkData = await getFullCampaignNetwork();
      }
      
      if (!networkData) {
        toast.error('Não foi possível carregar a rede');
        return;
      }

      console.log(`🌳 Rede carregada:`, networkData);

      // Enriquece a rede com dados completos
      const enhancedNetwork = await enhanceNetworkWithFullData(networkData);
      setNetwork(enhancedNetwork);

      // Aplica filtro inicial
      if (isAdmin) {
        // Admin: mostra rede completa com opção de filtro
        setFilteredNetwork(enhancedNetwork);
        setExpandedNodes(new Set([enhancedNetwork.id]));
        console.log(`👑 Admin: rede completa carregada`);
      } else {
        // Usuário comum: mostra rede completa SEM filtro (já que busca desde o criador)
        setFilteredNetwork(enhancedNetwork);
        
        // Expande o caminho até o usuário atual
        if (user.id) {
          const pathExpanded = expandPathToUser(enhancedNetwork, Number(user.id));
          setExpandedNodes(pathExpanded);
          console.log(`👤 Usuário comum: rede completa carregada desde o criador, caminho expandido`);
        } else {
          setExpandedNodes(new Set([enhancedNetwork.id]));
        }
      }
      
    } catch (err) {
      console.error(err);
      toast.error('Erro ao carregar rede de convites');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNetwork();
  }, [user]);

  // Aplica o filtro quando a campanha selecionada muda (apenas para admin)
  useEffect(() => {
    if (network && isAdmin) {
      console.log(`🎯 Aplicando filtro para campanha: ${selectedCampaign}`);
      
      if (selectedCampaign === 'all') {
        setFilteredNetwork(network);
        setExpandedNodes(new Set([network.id]));
      } else {
        const filtered = filterNetworkByCampaign(network, selectedCampaign);
        console.log(`📋 Resultado do filtro:`, filtered ? 'Encontrou rede' : 'Rede vazia');
        setFilteredNetwork(filtered);
        if (filtered) {
          setExpandedNodes(new Set([filtered.id]));
        }
      }
    }
  }, [selectedCampaign, network, isAdmin]);

  const toggleNode = (nodeId: number) => {
    setExpandedNodes(prev => networkService.toggleNode(prev, nodeId));
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case 'user':
        return <User className="w-4 h-4 text-blue-500" />;
      default:
        return <Shield className="w-4 h-4 text-gray-500" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'user':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const renderTreeNode = (node: EnhancedNetworkUser, level: number = 0, highlightPath: boolean = false) => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children.length > 0;
    const isCurrentUser = node.id === Number(user?.id);
    const isCampaignCreator = campaignCreatorId && node.id.toString() === campaignCreatorId;
    const isInUserPath = highlightPath && user?.id && expandPathToUser(node, Number(user.id)).has(node.id);

    // Usa os dados completos do usuário quando disponível
    const userName = node.userData?.name || node.name;
    const userEmail = node.userData?.email || node.email;
    const userPhone = node.userData?.phone || node.phone;
    const userCampaign = node.campaignData || getUserCampaign(node.id.toString());

    return (
      <div key={node.id} className="ml-6">
        {/* Linha de conexão */}
        {level > 0 && (
          <div 
            className={`absolute left-3 top-0 w-0.5 h-4 ${
              isInUserPath ? 'bg-blue-400' : 'bg-gray-300'
            }`}
            style={{ marginLeft: `${(level - 1) * 24}px` }}
          />
        )}
        
        <div className="flex items-start gap-3 relative">
          {/* Linha horizontal */}
          {level > 0 && (
            <div 
              className={`absolute left-3 top-4 w-3 h-0.5 ${
                isInUserPath ? 'bg-blue-400' : 'bg-gray-300'
              }`}
              style={{ marginLeft: `${(level - 1) * 24}px` }}
            />
          )}
          
          {/* Botão expandir/retrair */}
          {hasChildren && (
            <button
              onClick={() => toggleNode(node.id)}
              className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors mt-3"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-500" />
              )}
            </button>
          )}
          {!hasChildren && (
            <div className="w-6 h-6 flex items-center justify-center mt-3">
              <div className={`w-1 h-1 rounded-full ${
                isInUserPath ? 'bg-blue-400' : 'bg-gray-300'
              }`} />
            </div>
          )}

          {/* Card do usuário */}
          <div className={`flex-1 min-w-0 p-4 rounded-lg border-2 transition-all hover:shadow-md ${
            isCurrentUser 
              ? 'border-blue-300 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-600' 
              : isCampaignCreator
              ? 'border-green-300 bg-green-50 dark:bg-green-900/20 dark:border-green-600'
              : isInUserPath
              ? 'border-blue-200 bg-blue-25 dark:bg-blue-800/10 dark:border-blue-500'
              : 'border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-600'
          }`}>
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    {getRoleIcon(node.role)}
                    <h3 className={`font-semibold truncate ${
                      isCurrentUser 
                        ? 'text-blue-700 dark:text-blue-300' 
                        : isCampaignCreator
                        ? 'text-green-700 dark:text-green-300'
                        : isInUserPath
                        ? 'text-blue-600 dark:text-blue-300'
                        : 'text-gray-900 dark:text-white'
                    }`}>
                      {userName}
                      {isCurrentUser && (
                        <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                          Você
                        </span>
                      )}
                      {isCampaignCreator && !isCurrentUser && (
                        <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                          Criador
                        </span>
                      )}
                    </h3>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full border ${getRoleColor(node.role)}`}>
                    {node.role === 'admin' ? 'Administrador' : 'Usuário'}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 mb-2">
                  <Mail className="w-4 h-4" />
                  <span className="truncate">{userEmail}</span>
                </div>

                {userPhone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 mb-2">
                    <span className="truncate">📱 {userPhone}</span>
                  </div>
                )}

                {/* Informações da Campanha */}
                {userCampaign && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 mb-2">
                    <Building2 className="w-4 h-4" />
                    <span className="truncate">
                      Campanha: {userCampaign.name}
                    </span>
                  </div>
                )}

                {!userCampaign && node.userData?.campaign_id && (
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
                    <Building2 className="w-4 h-4" />
                    <span className="truncate">
                      Campanha ID: {node.userData.campaign_id}
                    </span>
                  </div>
                )}

                {!userCampaign && !node.userData?.campaign_id && (
                  <div className="flex items-center gap-2 text-sm text-gray-400 dark:text-gray-500 mb-2">
                    <Building2 className="w-4 h-4" />
                    <span className="truncate">
                      Sem campanha associada
                    </span>
                  </div>
                )}

                {hasChildren && (
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <Users className="w-3 h-3" />
                    <span>{node.children.length} convite(s) direto(s)</span>
                    <span>•</span>
                    <span>{networkService.calculateNetworkStats(node).totalMembers - 1} membro(s) na rede</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div className="relative">
            {/* Linha vertical conectando aos filhos */}
            <div 
              className={`absolute left-3 top-0 w-0.5 ${
                isInUserPath ? 'bg-blue-400' : 'bg-gray-300'
              }`}
              style={{ 
                marginLeft: `${level * 24}px`,
                height: '100%'
              }}
            />
            <div className="space-y-4 pt-4">
              {node.children.map(child => renderTreeNode(child, level + 1, highlightPath))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Componente do Filtro de Campanha
  const renderCampaignFilter = () => {
    const availableCampaigns = getAvailableCampaigns();
    
    if (availableCampaigns.length === 0) return null;

    // Para usuários comuns, não mostra o filtro - apenas informa qual campanha está vendo
    if (!isAdmin) {
      const userCampaign = availableCampaigns[0];
      return (
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-3">
            <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <div>
              <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                Visualizando rede completa da campanha
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400">
                {userCampaign.name} {campaignCreatorId && `(desde o criador)`}
              </p>
            </div>
          </div>
        </div>
      );
    }

    // Para admin: mostra filtro completo
    return (
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-3">
          <Filter className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Filtrar por Campanha:
          </label>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCampaign('all')}
            className={`px-4 py-2 rounded-lg border transition-all ${
              selectedCampaign === 'all'
                ? 'bg-blue-100 border-blue-400 text-blue-800 dark:bg-blue-900/40 dark:border-blue-500 dark:text-blue-200 shadow-md'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            Todas as Campanhas
          </button>
          
          {availableCampaigns.map((campaign) => (
            <button
              key={campaign.id}
              onClick={() => setSelectedCampaign(campaign.id.toString())}
              className={`px-4 py-2 rounded-lg border transition-all ${
                selectedCampaign === campaign.id.toString()
                  ? 'bg-blue-100 border-blue-400 text-blue-800 dark:bg-blue-900/40 dark:border-blue-500 dark:text-blue-200 shadow-md'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              {campaign.name}
            </button>
          ))}
        </div>

        {selectedCampaign !== 'all' && (
          <div className="mt-3 text-sm text-blue-600 dark:text-blue-400">
            <span>
              Mostrando usuários da campanha: <strong>{availableCampaigns.find(c => c.id.toString() === selectedCampaign)?.name}</strong>
            </span>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Carregando rede...</p>
          </div>
        </div>
      </div>
    );
  }

  const networkStats = filteredNetwork ? networkService.calculateNetworkStats(filteredNetwork) : null;

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <ToastContainer position="top-right" />
          
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <header className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30">
                  <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
                    Minha Rede
                  </h1>
                  <p className="mt-2 text-gray-600 dark:text-gray-400">
                    {isAdmin 
                      ? 'Visualize toda a sua rede de convites e membros' 
                      : 'Visualize a rede completa da sua campanha'
                    }
                  </p>
                </div>
              </div>

              {/* Filtro de Campanha */}
              {renderCampaignFilter()}

              {networkStats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                        <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Total na Rede</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {networkStats.totalMembers}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                        <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Convites Diretos</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {networkStats.directInvites}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                        <Crown className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Administradores</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {networkStats.adminCount}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                        <Users className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Profundidade</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {networkStats.networkDepth}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </header>

            {/* Network Tree */}
            <section className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center gap-2 mb-6">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                  Estrutura da Rede
                  {isAdmin && selectedCampaign !== 'all' && (
                    <span className="ml-2 text-sm font-normal text-blue-600 dark:text-blue-400">
                      (Filtrado por: {campaigns.find(c => c.id.toString() === selectedCampaign)?.name})
                    </span>
                  )}
                  {!isAdmin && (
                    <span className="ml-2 text-sm font-normal text-blue-600 dark:text-blue-400">
                      (Rede completa da campanha)
                    </span>
                  )}
                </h2>
                <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
              </div>

              {filteredNetwork ? (
                <div className="relative">
                  {renderTreeNode(filteredNetwork, 0, !isAdmin)}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    {isAdmin && selectedCampaign !== 'all' 
                      ? `Nenhum usuário encontrado na campanha "${campaigns.find(c => c.id.toString() === selectedCampaign)?.name}".`
                      : 'Nenhuma rede encontrada. Comece compartilhando seus convites!'
                    }
                    {!isAdmin && 'Nenhuma rede encontrada na sua campanha.'}
                  </p>
                </div>
              )}
            </section>

            {/* Legend */}
            <div className="mt-6 flex flex-wrap gap-6 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span>Você (Usuário atual)</span>
              </div>
              {!isAdmin && (
                <>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span>Criador da Campanha</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-300"></div>
                    <span>Seu caminho na rede</span>
                  </div>
                </>
              )}
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-yellow-500" />
                <span>Administrador</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-blue-500" />
                <span>Usuário</span>
              </div>
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-gray-500" />
                <span>Campanha</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NetworkPage;