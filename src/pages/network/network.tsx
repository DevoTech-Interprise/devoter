import { useState, useEffect } from 'react';
import { Users, Loader2, ChevronDown, ChevronRight, User, Mail, Crown, Shield, Filter, Building2, Star } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import { useUser } from '../../context/UserContext';
import { networkService, type NetworkUser } from '../../services/networkService';
import { campaignService, type Campaign } from '../../services/campaignService';
import { userService, type User as UserType } from '../../services/userService';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Interface extendida
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
  const [, setAllUsers] = useState<UserType[]>([]);
  const [campaignCreatorId, setCampaignCreatorId] = useState<string | null>(null);
  const [accessibleCampaigns, setAccessibleCampaigns] = useState<Campaign[]>([]);

  const isAdmin = user?.role === 'admin';
  const isSuperUser = user?.role === 'super';

  // Busca campanhas que o usuário pode acessar - MODIFICADO para SUPER USER
  const fetchAccessibleCampaigns = async () => {
    if (!user?.id) return [];
    
    try {
      let campaigns: Campaign[] = [];

      // 🔹 SUPER USER: Pode ver TODAS as campanhas
      if (isSuperUser) {
        console.log('👑 SUPER USER: Carregando TODAS as campanhas do sistema');
        campaigns = await campaignService.getAll();
      } else {
        // 🔹 ADMIN/MANAGER/USER: Lógica normal (apenas campanhas acessíveis)
        campaigns = await networkService.getUserAccessibleCampaigns(user.id);
      }

      setAccessibleCampaigns(campaigns);
      return campaigns;
    } catch (error) {
      console.error('Erro ao buscar campanhas acessíveis:', error);
      return [];
    }
  };

  // Função para buscar a rede usando a nova rota - MODIFICADO para SUPER USER
  const getFullCampaignNetwork = async (campaignId?: string): Promise<NetworkUser | null> => {
    if (!user?.id) return null;

    try {
      const targetCampaignId = campaignId || user.campaign_id;
      
      if (!targetCampaignId) {
        // Se não tem campanha, busca a rede do próprio usuário
        return await networkService.getNetworkTree(user.id);
      }

      // 🔹 SUPER USER: Não verifica acesso, pode ver tudo
      if (!isSuperUser) {
        // Verifica se o usuário tem acesso à campanha (apenas para não-super)
        const hasAccess = accessibleCampaigns.some(campaign => 
          campaign.id.toString() === targetCampaignId
        );

        if (!hasAccess) {
          console.warn(`Usuário não tem acesso à campanha ${targetCampaignId}`);
          return await networkService.getNetworkTree(user.id);
        }
      }

      // Busca a campanha
      const campaign = await campaignService.getById(targetCampaignId);
      if (!campaign) {
        return await networkService.getNetworkTree(user.id);
      }

      // Determina o root da rede
      let networkRootUserId: string | number;
      
      // 🔹 SUPER USER: Sempre usa o criador da campanha como root
      if (isSuperUser) {
        networkRootUserId = campaign.created_by;
      } 
      // Usuário normal: usa lógica padrão
      else if (campaign.created_by.toString() === user.id.toString()) {
        networkRootUserId = user.id;
      } else {
        networkRootUserId = campaign.created_by;
      }

      setCampaignCreatorId(campaign.created_by.toString());

      // Usa a NOVA rota para buscar a rede filtrada por campanha
      console.log(`🔍 Buscando rede da campanha ${targetCampaignId} desde ${networkRootUserId}`);
      return await networkService.getNetworkTreeByCampaign(targetCampaignId, networkRootUserId);
      
    } catch (error) {
      console.error('Erro ao buscar rede completa da campanha:', error);
      // Fallback: busca a rede do próprio usuário
      return await networkService.getNetworkTree(user.id);
    }
  };

  // Função para enriquecer os dados da rede
  const enhanceNetworkWithFullData = async (node: NetworkUser): Promise<EnhancedNetworkUser> => {
    try {
      const userData = await userService.getById(node.id.toString());
      
      let campaignData: Campaign | undefined;
      if (userData.campaign_id) {
        campaignData = campaigns.find(campaign => campaign.id.toString() === userData.campaign_id);
      }

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

  // Função para filtrar a rede por campanha
  const filterNetworkByCampaign = (node: EnhancedNetworkUser, campaignId: string): EnhancedNetworkUser | null => {
    if (campaignId === 'all') {
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

    const userBelongsToCampaign = node.userData?.campaign_id === campaignId;

    const filteredChildren: EnhancedNetworkUser[] = [];
    node.children.forEach(child => {
      const filteredChild = filterNetworkByCampaign(child, campaignId);
      if (filteredChild) {
        filteredChildren.push(filteredChild);
      }
    });

    if (userBelongsToCampaign || filteredChildren.length > 0) {
      return {
        ...node,
        children: filteredChildren
      };
    }

    return null;
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

  const fetchNetwork = async (campaignId?: string) => {
    try {
      setLoading(true);
      if (!user?.id) {
        toast.error('Usuário não encontrado');
        return;
      }

      console.log(`👤 Usuário: ${user.name}, Role: ${user.role}, Campanha: ${user.campaign_id}`);

      // Busca campanhas acessíveis
      const accessibleCamps = await fetchAccessibleCampaigns();
      
      // Busca todos os usuários e campanhas
      const [usersData, allCampaigns] = await Promise.all([
        userService.getAll(),
        campaignService.getAll()
      ]);
      
      setAllUsers(usersData);
      setCampaigns(allCampaigns);

      // Busca a rede
      let networkData: NetworkUser | null;
      
      if (isSuperUser && selectedCampaign === 'all') {
        // 🔹 SUPER USER vendo todas as campanhas: busca rede do primeiro criador de campanha
        if (accessibleCamps.length > 0) {
          const firstCampaign = accessibleCamps[0];
          networkData = await getFullCampaignNetwork(firstCampaign.id.toString());
          setSelectedCampaign(firstCampaign.id.toString());
        } else {
          networkData = await networkService.getNetworkTree(user.id);
        }
      } else if ((isAdmin || isSuperUser) && selectedCampaign === 'all') {
        // Admin vendo todas as campanhas: busca rede do próprio usuário
        networkData = await networkService.getNetworkTree(user.id);
      } else {
        // Busca rede filtrada por campanha usando a nova rota
        const targetCampaignId = campaignId || selectedCampaign !== 'all' ? selectedCampaign : user.campaign_id;
        networkData = await getFullCampaignNetwork(targetCampaignId?.toString());
      }
      
      if (!networkData) {
        toast.error('Não foi possível carregar a rede');
        return;
      }

      // Enriquece a rede com dados completos
      const enhancedNetwork = await enhanceNetworkWithFullData(networkData);
      setNetwork(enhancedNetwork);

      // Aplica filtro e expande nós
      if ((isAdmin || isSuperUser) && selectedCampaign === 'all') {
        setFilteredNetwork(enhancedNetwork);
        setExpandedNodes(new Set([enhancedNetwork.id]));
      } else {
        setFilteredNetwork(enhancedNetwork);
        
        if (user.id) {
          const pathExpanded = expandPathToUser(enhancedNetwork, Number(user.id));
          setExpandedNodes(pathExpanded);
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

  // Atualiza quando a campanha selecionada muda
  useEffect(() => {
    if (selectedCampaign !== 'all') {
      fetchNetwork(selectedCampaign);
    } else if (network) {
      // Se voltou para "all", recarrega a rede completa
      fetchNetwork();
    }
  }, [selectedCampaign]);

  const toggleNode = (nodeId: number) => {
    setExpandedNodes(prev => networkService.toggleNode(prev, nodeId));
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'super':
        return <Shield className="w-4 h-4 text-red-500" />;
      case 'admin':
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case 'manager':
        return <Star className="w-4 h-4 text-purple-500" />;
      case 'user':
        return <User className="w-4 h-4 text-blue-500" />;
      default:
        return <Shield className="w-4 h-4 text-gray-500" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'admin':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'manager':
        return 'bg-purple-100 text-purple-800 border-purple-200';
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
    const isInUserPath = highlightPath && user?.id && networkService.expandPathToUser(node, Number(user.id)).has(node.id);

    const userName = node.userData?.name || node.name;
    const userEmail = node.userData?.email || node.email;
    const userPhone = node.userData?.phone || node.phone;
    const userCampaign = node.campaignData;

    return (
      <div key={node.id} className="ml-6">
        {level > 0 && (
          <div 
            className={`absolute left-3 top-0 w-0.5 h-4 ${
              isInUserPath ? 'bg-blue-400' : 'bg-gray-300'
            }`}
            style={{ marginLeft: `${(level - 1) * 24}px` }}
          />
        )}
        
        <div className="flex items-start gap-3 relative">
          {level > 0 && (
            <div 
              className={`absolute left-3 top-4 w-3 h-0.5 ${
                isInUserPath ? 'bg-blue-400' : 'bg-gray-300'
              }`}
              style={{ marginLeft: `${(level - 1) * 24}px` }}
            />
          )}
          
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

          <div className={`flex-1  min-w-0 p-4 rounded-lg border-2 transition-all hover:shadow-md ${
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
                <div className="flex flex-col md:flex-row items-center gap-3 mb-2">
                  <div className="flex flex-col justify-center md:flex-row items-center gap-2">
                    {getRoleIcon(node.role)}
                    <h3 className={`text-wrap text-center font-semibold truncate ${
                      isCurrentUser 
                        ? 'text-blue-700 dark:text-blue-300' 
                        : isCampaignCreator
                        ? 'text-green-700 dark:text-green-300'
                        : isInUserPath
                        ? 'text-blue-600 dark:text-blue-300'
                        : 'text-gray-900 dark:text-white'
                    }`}>
                      {userName}
                      
                    </h3>
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
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full border ${getRoleColor(node.role)}`}>
                    {node.role === 'super' ? 'Super User' :
                     node.role === 'admin' ? 'Administrador' : 
                     node.role === 'manager' ? 'Manager' : 'Usuário'}
                  </span>
                </div>
                
                <div className="flex flex-col md:flex-row items-center gap-2 text-sm text-gray-600 dark:text-gray-300 mb-2">
                  <Mail className="w-4 h-4" />
                  <span className="text-wrap">{userEmail}</span>
                </div>

                {userPhone && (
                  <div className="flex flex-col md:flex-row items-center gap-2 text-sm text-gray-600 dark:text-gray-300 mb-2">
                    <span className=""><div className='text-center'>📱</div> {userPhone}</span>
                  </div>
                )}

                {userCampaign && (
                  <div className="flex flex-col md:flex-row items-center gap-2 text-sm text-gray-600 dark:text-gray-300 mb-2">
                    <Building2 className="w-4 h-4" />
                    <span className="text-center">
                      Campanha: {userCampaign.name}
                    </span>
                  </div>
                )}

                {hasChildren && (
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <Users className="w-3 h-3" />
                    <span>{node.children.length} convite(s) direto(s)</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className="relative">
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

  // Componente do Filtro de Campanha - MODIFICADO para SUPER USER
  const renderCampaignFilter = () => {
    if (accessibleCampaigns.length === 0) {
      return (
        <></>
      );
    }

    if (!isAdmin && !isSuperUser) {
      const userCampaign = accessibleCampaigns[0]; // Usuário comum geralmente tem apenas uma campanha
      return (
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-3">
            <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <div>
              <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                Visualizando rede da sua campanha
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400">
                {userCampaign.name}
              </p>
            </div>
          </div>
        </div>
      );
    }

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
            className={`w-full md:w-auto px-4 py-2 rounded-lg border transition-all ${
              selectedCampaign === 'all'
                ? 'bg-blue-100 border-blue-400 text-blue-800 dark:bg-blue-900/40 dark:border-blue-500 dark:text-blue-200 shadow-md'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            {isSuperUser ? 'Todas as Campanhas' : 'Minhas Campanhas'}
          </button>
          
          {accessibleCampaigns.map((campaign) => (
            <button
              key={campaign.id}
              onClick={() => setSelectedCampaign(campaign.id.toString())}
              className={`w-full md:w-auto px-4 py-2 rounded-lg border transition-all ${
                selectedCampaign === campaign.id.toString()
                  ? 'bg-blue-100 border-blue-400 text-blue-800 dark:bg-blue-900/40 dark:border-blue-500 dark:text-blue-200 shadow-md'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              {campaign.name}
              {isSuperUser && campaign.created_by?.toString() !== user?.id && (
                <span className="ml-1 text-xs bg-gray-100 text-gray-800 px-1 rounded">
                  ID: {campaign.id}
                </span>
              )}
            </button>
          ))}
        </div>

        {selectedCampaign !== 'all' && (
          <div className="mt-3 text-sm text-blue-600 dark:text-blue-400">
            <span>
              Mostrando rede da campanha: <strong>
                {accessibleCampaigns.find(c => c.id.toString() === selectedCampaign)?.name}
              </strong>
              {isSuperUser && (
                <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                  SUPER USER
                </span>
              )}
            </span>
          </div>
        )}
      </div>
    );
  };

  // Funções auxiliares para textos dinâmicos
  const getHeaderDescription = () => {
    if (isSuperUser) {
      return 'Visualize as redes de TODAS as campanhas do sistema';
    } else if (isAdmin) {
      return 'Visualize as redes das campanhas que você cria ou gerencia';
    } else {
      return 'Visualize a rede da sua campanha';
    }
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
            <header className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30">
                  <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
                    Minha Rede
                    {isSuperUser && (
                      <span className="ml-2 text-sm bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 px-2 py-1 rounded-full">
                        SUPER USER
                      </span>
                    )}
                  </h1>
                  <p className="mt-2 text-gray-600 dark:text-gray-400">
                    {getHeaderDescription()}
                  </p>
                </div>
              </div>

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

            <section className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center gap-2 mb-6">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                  Estrutura da Rede
                  {isSuperUser && selectedCampaign !== 'all' && (
                    <span className="ml-2 text-sm font-normal text-blue-600 dark:text-blue-400">
                      ({accessibleCampaigns.find(c => c.id.toString() === selectedCampaign)?.name})
                    </span>
                  )}
                  {isAdmin && selectedCampaign !== 'all' && (
                    <span className="ml-2 text-sm font-normal text-blue-600 dark:text-blue-400">
                      ({accessibleCampaigns.find(c => c.id.toString() === selectedCampaign)?.name})
                    </span>
                  )}
                </h2>
                <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
              </div>

              {filteredNetwork ? (
                <div className="relative">
                  {renderTreeNode(filteredNetwork, 0, !isAdmin && !isSuperUser)}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    {accessibleCampaigns.length === 0
                      ? 'Nenhuma campanha encontrada para exibir a rede.'
                      : 'Nenhuma rede encontrada para esta campanha.'
                    }
                  </p>
                </div>
              )}
            </section>

            <div className="mt-6 flex flex-col md:flex-row gap-6 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex justify-center items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span>Você (Usuário atual)</span>
              </div>
              {!isAdmin && !isSuperUser && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span>Criador da Campanha</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-red-500" />
                <span>Super User</span>
              </div>
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-yellow-500" />
                <span>Administrador</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-purple-500" />
                <span>Manager</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-blue-500" />
                <span>Usuário</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NetworkPage;