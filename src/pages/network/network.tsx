import { useState, useEffect } from 'react';
import { Users, Loader2, ChevronDown, ChevronRight, User, Mail, Crown, Shield, Building2, MapPin, Star } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import { useUser } from '../../context/UserContext';
import { networkService, type FullCampaignNetwork, type NetworkUser } from '../../services/networkService';
import { userService, type User as UserType } from '../../services/userService';
import { campaignService } from '../../services/campaignService';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Interface extendida para incluir dados completos do usuário
interface EnhancedNetworkUser extends NetworkUser {
  userData?: UserType;
}

// Interface extendida para rede completa da campanha
interface EnhancedFullCampaignNetwork {
  rootNetwork: EnhancedNetworkUser;
  userPosition: EnhancedNetworkUser | null;
  campaign: any | null;
  campaignCreatorId: string | null | number;
  stats: {
    totalMembers: number;
    directInvites: number;
    adminCount: number;
    userCount: number;
    networkDepth: number;
  };
}

const NetworkPage = () => {
  const { user: currentUser } = useUser();
  const [fullCampaignNetwork, setFullCampaignNetwork] = useState<EnhancedFullCampaignNetwork | null>(null);
  const [adminCampaigns, setAdminCampaigns] = useState<EnhancedFullCampaignNetwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set());
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);

  const isAdmin = currentUser?.role === 'admin';

  // Função para enriquecer os dados da rede com informações completas do usuário
  const enhanceNetworkWithUserData = async (network: NetworkUser): Promise<EnhancedNetworkUser> => {
    try {
      // Busca dados completos do usuário
      const userData = await userService.getById(network.id);
      
      // Processa os filhos recursivamente
      const enhancedChildren: EnhancedNetworkUser[] = [];
      for (const child of network.children) {
        const enhancedChild = await enhanceNetworkWithUserData(child);
        enhancedChildren.push(enhancedChild);
      }

      return {
        ...network,
        userData,
        children: enhancedChildren
      };
    } catch (error) {
      console.warn(`Erro ao buscar dados do usuário ${network.id}:`, error);
      // Retorna os dados básicos se não conseguir buscar os dados completos
      const enhancedChildren: EnhancedNetworkUser[] = [];
      for (const child of network.children) {
        const enhancedChild = await enhanceNetworkWithUserData(child);
        enhancedChildren.push(enhancedChild);
      }

      return {
        ...network,
        children: enhancedChildren
      };
    }
  };

  // Função para buscar TODOS os usuários de uma campanha específica
  const getUsersByCampaign = async (campaignId: string): Promise<UserType[]> => {
    try {
      const allUsers = await userService.getAll();
      return allUsers.filter(user => user.campaign_id === campaignId);
    } catch (error) {
      console.error('Erro ao buscar usuários da campanha:', error);
      return [];
    }
  };

  // Função para construir a rede hierárquica a partir de uma lista de usuários
  const buildNetworkFromUsers = (users: UserType[], campaignId: string): NetworkUser | null => {
    if (users.length === 0) return null;

    // Encontra o criador da campanha (usuário que criou a campanha)
    const campaignCreator = users.find(user => 
      user.role === 'admin' //&& user.campaign_id === campaignId
    );

    if (!campaignCreator) {
      // Se não encontrar criador, usa o primeiro admin ou primeiro usuário
      const firstUser = users[0];
      const rootUser: NetworkUser = {
        id: Number(firstUser.id),
        name: firstUser.name,
        email: firstUser.email,
        role: firstUser.role as 'admin' | 'user',
        campaign_id: campaignId,
        phone: firstUser.phone,
        invited_by: firstUser.invited_by ? Number(firstUser.invited_by) : null,
        children: []
      };
      return rootUser;
    }

    // Função recursiva para construir a árvore
    const buildTree = (userId: string): NetworkUser => {
      const user = users.find(u => u.id === userId);
      if (!user) {
        throw new Error(`Usuário ${userId} não encontrado`);
      }

      const children = users.filter(u => u.invited_by === userId);
      
      return {
        id: Number(user.id),
        name: user.name,
        email: user.email,
        role: user.role as 'admin' | 'user',
        campaign_id: campaignId,
        phone: user.phone,
        invited_by: user.invited_by ? Number(user.invited_by) : null,
        children: children.map(child => buildTree(child.id))
      };
    };

    return buildTree(campaignCreator.id);
  };

  // Função para buscar rede específica de uma campanha com dados completos
  const getCampaignSpecificNetwork = async (campaignId: string, creatorId: string): Promise<EnhancedFullCampaignNetwork | null> => {
    try {
      console.log(`🔍 Buscando rede da campanha ${campaignId} criada por ${creatorId}`);
      
      // Busca a campanha para obter informações completas
      const campaign = await campaignService.getById(campaignId);
      console.log(`📋 Campanha encontrada:`, campaign);
      
      // Busca TODOS os usuários desta campanha
      const campaignUsers = await getUsersByCampaign(campaignId);
      console.log(`👥 Usuários da campanha ${campaignId}:`, campaignUsers.length, campaignUsers);
      
      if (campaignUsers.length === 0) {
        console.log(`❌ Nenhum usuário encontrado na campanha ${campaignId}`);
        // Se não há usuários na campanha, cria uma rede mínima com apenas o criador
        try {
          const creatorUserData = await userService.getById(creatorId);
          const minimalNetwork: EnhancedNetworkUser = {
            id: Number(creatorId),
            name: creatorUserData.name,
            email: creatorUserData.email,
            role: creatorUserData.role as 'admin' | 'user',
            campaign_id: campaignId,
            phone: creatorUserData.phone,
            invited_by: creatorUserData.invited_by ? Number(creatorUserData.invited_by) : null,
            children: [],
            userData: creatorUserData
          };

          console.log(`✅ Rede mínima criada para campanha ${campaignId}`);
          return {
            rootNetwork: minimalNetwork,
            userPosition: minimalNetwork,
            campaign,
            campaignCreatorId: creatorId,
            stats: {
              totalMembers: 1,
              directInvites: 0,
              adminCount: 1,
              userCount: 0,
              networkDepth: 1
            }
          };
        } catch (error) {
          console.log(`⚠️ Não conseguiu buscar dados do criador, criando rede vazia`);
          // Se não conseguir buscar dados do criador, cria uma rede vazia
          const emptyNetwork: EnhancedNetworkUser = {
            id: Number(creatorId),
            name: 'Criador da Campanha',
            email: '',
            role: 'admin',
            campaign_id: campaignId,
            phone: '',
            invited_by: null,
            children: []
          };

          return {
            rootNetwork: emptyNetwork,
            userPosition: emptyNetwork,
            campaign,
            campaignCreatorId: creatorId,
            stats: {
              totalMembers: 0,
              directInvites: 0,
              adminCount: 0,
              userCount: 0,
              networkDepth: 0
            }
          };
        }
      }

      // Constrói a rede a partir dos usuários da campanha
      const network = buildNetworkFromUsers(campaignUsers, campaignId);
      
      if (!network) {
        throw new Error('Não foi possível construir a rede da campanha');
      }

      console.log(`🌳 Rede construída para campanha ${campaignId}:`, network);
      
      // Enriquece a rede com dados completos dos usuários
      const enhancedNetwork = await enhanceNetworkWithUserData(network);
      const stats = networkService.calculateNetworkStats(network);

      console.log(`📊 Estatísticas da campanha ${campaignId}:`, stats);

      // Encontra a posição do criador na rede
      const userPosition = networkService.findUserInNetwork(network, Number(creatorId));
      const enhancedUserPosition = userPosition ? await enhanceNetworkWithUserData(userPosition) : null;

      return {
        rootNetwork: enhancedNetwork,
        userPosition: enhancedUserPosition,
        campaign,
        campaignCreatorId: creatorId,
        stats
      };
    } catch (error) {
      console.error(`❌ Erro ao buscar rede da campanha ${campaignId}:`, error);
      
      // Fallback: retorna uma rede básica com informações da campanha
      try {
        const campaign = await campaignService.getById(campaignId);
        const emptyNetwork: EnhancedNetworkUser = {
          id: Number(creatorId),
          name: 'Criador da Campanha',
          email: '',
          role: 'admin',
          campaign_id: campaignId,
          phone: '',
          invited_by: null,
          children: []
        };

        return {
          rootNetwork: emptyNetwork,
          userPosition: emptyNetwork,
          campaign,
          campaignCreatorId: creatorId,
          stats: {
            totalMembers: 0,
            directInvites: 0,
            adminCount: 0,
            userCount: 0,
            networkDepth: 0
          }
        };
      } catch {
        return null;
      }
    }
  };

  const fetchNetworks = async () => {
    try {
      setLoading(true);
      if (!currentUser?.id) {
        toast.error('Usuário não encontrado');
        return;
      }

      if (isAdmin) {
        // Admin: busca apenas as campanhas CRIADAS pelo usuário atual
        console.log('👑 Admin: buscando campanhas do usuário...');
        
        // USANDO O NOVO MÉTODO - busca apenas campanhas do usuário com suas redes
        const userCampaignsWithNetworks = await networkService.getUserCampaignsWithNetworks(currentUser.id);
        
        console.log('📋 Campanhas do usuário com redes:', userCampaignsWithNetworks);
        
        // Enriquece as redes com dados completos dos usuários
        const enhancedAdminNetworks: EnhancedFullCampaignNetwork[] = [];
        
        for (const campaignNetwork of userCampaignsWithNetworks) {
          try {
            const enhancedRootNetwork = await enhanceNetworkWithUserData(campaignNetwork.rootNetwork);
            const enhancedUserPosition = campaignNetwork.userPosition ? 
              await enhanceNetworkWithUserData(campaignNetwork.userPosition) : null;

            enhancedAdminNetworks.push({
              ...campaignNetwork,
              rootNetwork: enhancedRootNetwork,
              userPosition: enhancedUserPosition
            });
          } catch (error) {
            console.warn(`Erro ao enriquecer rede da campanha ${campaignNetwork.campaign?.name}:`, error);
            // Adiciona mesmo sem dados enriquecidos
            enhancedAdminNetworks.push(campaignNetwork as EnhancedFullCampaignNetwork);
          }
        }

        console.log('🎉 Redes das campanhas do usuário:', enhancedAdminNetworks);
        setAdminCampaigns(enhancedAdminNetworks);
        
        if (enhancedAdminNetworks.length > 0) {
          setSelectedCampaign(enhancedAdminNetworks[0].campaign?.id?.toString() || null);
          // Expande o criador da primeira campanha por padrão
          if (enhancedAdminNetworks[0].rootNetwork) {
            setExpandedNodes(new Set([enhancedAdminNetworks[0].rootNetwork.id]));
          }
          toast.success(`${enhancedAdminNetworks.length} campanha(s) carregada(s) com sucesso`);
        } else {
          toast.info('Você não possui campanhas ou nenhuma rede foi encontrada');
        }
      } else {
        // Usuário comum: busca rede COMPLETA da campanha desde o CRIADOR
        if (!currentUser.campaign_id) {
          toast.error('Usuário não está associado a nenhuma campanha');
          setLoading(false);
          return;
        }

        const fullNetwork = await networkService.getFullCampaignNetwork(
          currentUser.id, 
          currentUser.campaign_id
        );

        if (fullNetwork) {
          // Enriquece a rede com dados completos dos usuários
          const enhancedRootNetwork = await enhanceNetworkWithUserData(fullNetwork.rootNetwork);
          const enhancedUserPosition = fullNetwork.userPosition ? 
            await enhanceNetworkWithUserData(fullNetwork.userPosition) : null;

          const enhancedFullNetwork: EnhancedFullCampaignNetwork = {
            rootNetwork: enhancedRootNetwork,
            userPosition: enhancedUserPosition,
            campaign: fullNetwork.campaign,
            campaignCreatorId: fullNetwork.campaignCreatorId,
            stats: fullNetwork.stats
          };
          
          setFullCampaignNetwork(enhancedFullNetwork);
          
          // Expande automaticamente o caminho até o usuário atual
          if (enhancedFullNetwork) {
            const pathExpanded = networkService.expandPathToUser(
              enhancedFullNetwork.rootNetwork, 
              Number(currentUser.id)
            );
            setExpandedNodes(pathExpanded);
          }
        } else {
          setFullCampaignNetwork(null);
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
    fetchNetworks();
  }, [currentUser]);

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

  const renderTreeNode = (node: EnhancedNetworkUser, level: number = 0, highlightPath: boolean = false, campaignData?: EnhancedFullCampaignNetwork) => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children.length > 0;
    const isCurrentUser = node.id === Number(currentUser?.id);
    const isInUserPath = highlightPath && campaignData?.userPosition && 
      networkService.findUserInNetwork(node, Number(campaignData.userPosition.id));
    
    // Verifica se é o criador da campanha
    const isCampaignCreator = campaignData?.campaignCreatorId && 
      node.id.toString() === campaignData.campaignCreatorId.toString();

    // Usa os dados completos do usuário quando disponível
    const userName = node.userData?.name || node.name;
    const userEmail = node.userData?.email || node.email;
    const userPhone = node.userData?.phone || node.phone;

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
                      {isCampaignCreator && (
                        <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full flex items-center gap-1">
                          <Star className="w-3 h-3" />
                          Criador
                        </span>
                      )}
                      {!isCurrentUser && isInUserPath && !isCampaignCreator && (
                        <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                          No caminho
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

                {node.campaign_id && campaignData?.campaign && (
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-2">
                    <Building2 className="w-3 h-3" />
                    <span>Campanha: {campaignData.campaign.name}</span>
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
              {node.children.map(child => renderTreeNode(child, level + 1, highlightPath, campaignData))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderCampaignSelector = () => {
    if (!isAdmin || adminCampaigns.length === 0) return null;

    return (
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-3">
          <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <label className="block text-lg font-semibold text-gray-700 dark:text-gray-300">
            Selecionar Campanha para Visualizar:
          </label>
          <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
            {adminCampaigns.length} campanha(s) criada(s) por você
          </span>
        </div>
        
        <div className="flex flex-wrap gap-3">
          {adminCampaigns.map((campaignData) => {
            const campaignId = campaignData.campaign?.id?.toString() || campaignData.rootNetwork.id.toString();
            const isSelected = selectedCampaign === campaignId;
            
            return (
              <button
                key={campaignId}
                onClick={() => {
                  setSelectedCampaign(campaignId);
                  // Expande o criador da campanha quando selecionar
                  if (campaignData.rootNetwork) {
                    setExpandedNodes(new Set([campaignData.rootNetwork.id]));
                  }
                }}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition-all min-w-[200px] ${
                  isSelected
                    ? 'bg-blue-100 border-blue-400 text-blue-800 dark:bg-blue-900/40 dark:border-blue-500 dark:text-blue-200 shadow-md'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
                }`}
              >
                <div className={`w-3 h-3 rounded-full ${
                  isSelected ? 'bg-blue-500' : 'bg-gray-400'
                }`} />
                
                <div className="flex-1 text-left">
                  <div className="font-semibold truncate">
                    {campaignData.campaign 
                      ? campaignData.campaign.name 
                      : `Campanha ${campaignData.rootNetwork.campaign_id || 'Sem Nome'}`
                    }
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
                    <Users className="w-3 h-3" />
                    <span>{campaignData.stats.totalMembers} membros</span>
                    <span>•</span>
                    <span>{campaignData.stats.networkDepth} níveis</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
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

  // Para admin: campanha selecionada
  const currentAdminCampaign = selectedCampaign 
    ? adminCampaigns.find(campaign => campaign.campaign?.id?.toString() === selectedCampaign)
    : adminCampaigns[0];

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
                    {isAdmin ? 'Minhas Campanhas' : 'Minha Rede Completa'}
                  </h1>
                  <p className="mt-2 text-gray-600 dark:text-gray-400">
                    {isAdmin 
                      ? `Visualize as redes das ${adminCampaigns.length} campanhas que você criou`
                      : 'Visualize a rede completa da sua campanha desde o início'
                    }
                    {!isAdmin && fullCampaignNetwork?.campaign && (
                      <span className="ml-2 text-sm bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded-full">
                        Campanha: {fullCampaignNetwork.campaign.name}
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Informações da rede completa */}
              {(currentAdminCampaign || fullCampaignNetwork) && (
                <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <div>
                      <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                        {isAdmin 
                          ? `Rede da campanha: ${currentAdminCampaign?.campaign?.name || 'N/A'}`
                          : `Rede completa da campanha: ${fullCampaignNetwork?.campaign?.name || 'N/A'}`
                        }
                      </p>
                      <p className="text-xs text-blue-600 dark:text-blue-400">
                        {isAdmin && currentAdminCampaign?.campaignCreatorId && 
                          `Criador: ${currentAdminCampaign.rootNetwork.userData?.name || 'N/A'} (ID: ${currentAdminCampaign.campaignCreatorId})`
                        }
                        {!isAdmin && fullCampaignNetwork?.campaignCreatorId && 
                          `Mostrando desde o criador até sua posição atual`
                        }
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Estatísticas */}
              {(fullCampaignNetwork || currentAdminCampaign) && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                        <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Total na Rede</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {isAdmin ? currentAdminCampaign?.stats.totalMembers : fullCampaignNetwork?.stats.totalMembers}
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
                          {isAdmin ? currentAdminCampaign?.stats.directInvites : fullCampaignNetwork?.stats.directInvites}
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
                          {isAdmin ? currentAdminCampaign?.stats.adminCount : fullCampaignNetwork?.stats.adminCount}
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
                          {isAdmin ? currentAdminCampaign?.stats.networkDepth : fullCampaignNetwork?.stats.networkDepth}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </header>

            {/* Campaign Selector (apenas para admin) */}
            {renderCampaignSelector()}

            {/* Network Tree */}
            <section className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center gap-2 mb-6">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                  {isAdmin && currentAdminCampaign?.campaign 
                    ? `Estrutura da Rede - ${currentAdminCampaign.campaign.name}`
                    : isAdmin && currentAdminCampaign?.rootNetwork.campaign_id
                    ? `Estrutura da Rede - Campanha ${currentAdminCampaign.rootNetwork.campaign_id}`
                    : fullCampaignNetwork?.campaign
                    ? `Estrutura da Rede - ${fullCampaignNetwork.campaign.name}`
                    : 'Estrutura da Rede'
                  }
                </h2>
                <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
              </div>

              {isAdmin ? (
                currentAdminCampaign ? (
                  <div className="relative">
                    {currentAdminCampaign.stats.totalMembers > 0 ? (
                      renderTreeNode(currentAdminCampaign.rootNetwork, 0, false, currentAdminCampaign)
                    ) : (
                      <div className="text-center py-12">
                        <Users className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-500 dark:text-gray-400">
                          Esta campanha ainda não possui membros na rede.
                          {currentAdminCampaign.campaignCreatorId && (
                            <span> O criador ({currentAdminCampaign.rootNetwork.userData?.name || 'N/A'}) ainda não convidou outros usuários.</span>
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                ) : adminCampaigns.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">
                      Você ainda não criou nenhuma campanha. Comece criando campanhas para visualizar suas redes!
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Users className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">
                      Selecione uma campanha para visualizar sua rede.
                    </p>
                  </div>
                )
              ) : fullCampaignNetwork ? (
                <div className="relative">
                  {renderTreeNode(fullCampaignNetwork.rootNetwork, 0, true, fullCampaignNetwork)}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    Nenhuma rede encontrada para sua campanha. Comece compartilhando seus convites!
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
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span>Criador da Campanha</span>
              </div>
              {!isAdmin && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-300"></div>
                  <span>Seu caminho na rede</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-yellow-500" />
                <span>Administrador</span>
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