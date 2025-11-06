import { useState, useEffect } from 'react';
import { Users, Award, Send, Activity, UserPlus, GitBranch, Building2, Target } from "lucide-react";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import { useTheme } from "../../context/ThemeContext";
import { useUser } from '../../context/UserContext';
import { userService, type User } from '../../services/userService';
import { networkService, type NetworkUser } from '../../services/networkService';

const Dashboard = () => {
  const { darkMode } = useTheme();
  const { user } = useUser();
  const [dashboardData, setDashboardData] = useState({
    totalSupporters: 0,
    campaigns: 0,
    invitationsSent: 0,
    engagementRate: 0,
    recentActivity: [] as any[],
    networkStats: {
      totalMembers: 0,
      directInvites: 0,
      adminCount: 0,
      userCount: 0,
      networkDepth: 0,
      averageInvites: 0,
      totalCampaigns: 0
    },
    growthStats: {
      supportersGrowth: '',
      campaignsGrowth: '',
      invitationsGrowth: '',
      engagementGrowth: ''
    }
  });
  const [accessibleCampaigns, setAccessibleCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedView, setSelectedView] = useState<'overview' | 'hierarchy'>('overview');

  useEffect(() => {
    if (user?.id) {
      loadDashboardData();
    }
  }, [user]);

  // Buscar campanhas que o usuário pode acessar
  const fetchAccessibleCampaigns = async (): Promise<any[]> => {
    if (!user?.id) return [];

    try {
      const campaigns = await networkService.getUserAccessibleCampaigns(user.id);
      setAccessibleCampaigns(campaigns);
      return campaigns;
    } catch (error) {
      console.error('Erro ao buscar campanhas acessíveis:', error);
      return [];
    }
  };

  // Buscar redes das campanhas acessíveis
  const fetchAccessibleNetworks = async (campaigns: any[]): Promise<NetworkUser[]> => {
    if (!user?.id || campaigns.length === 0) return [];

    const networks: NetworkUser[] = [];

    for (const campaign of campaigns) {
      try {
        // Determinar quem é o root da rede para esta campanha
        let networkRootUserId: string | number;

        if (campaign.created_by.toString() === user.id.toString()) {
          networkRootUserId = user.id;
        } else if (campaign.operator && campaign.operator.split(',').map((id: string) => id.trim()).includes(user.id)) {
          networkRootUserId = campaign.created_by;
        } else {
          networkRootUserId = campaign.created_by;
        }

        // Buscar a rede usando a rota específica por campanha
        const campaignNetwork = await networkService.getNetworkTreeByCampaign(
          campaign.id.toString(), 
          networkRootUserId
        );
        networks.push(campaignNetwork);
      } catch (error) {
        console.error(`Erro ao buscar rede da campanha ${campaign.name}:`, error);
      }
    }

    return networks;
  };

  // Calcular estatísticas consolidadas de todas as redes acessíveis
  const calculateConsolidatedNetworkStats = (networks: NetworkUser[]) => {
    if (networks.length === 0) {
      return {
        totalMembers: 0,
        directInvites: 0,
        adminCount: 0,
        userCount: 0,
        networkDepth: 0,
        averageInvites: 0,
        totalCampaigns: networks.length
      };
    }

    let totalMembers = 0;
    let totalDirectInvites = 0;
    let totalAdminCount = 0;
    let totalUserCount = 0;
    let maxNetworkDepth = 0;
    let totalNodes = 0;
    let totalInvites = 0;

    networks.forEach(network => {
      const stats = calculateRealNetworkStats(network);
      totalMembers += stats.totalMembers;
      totalDirectInvites += stats.directInvites;
      totalAdminCount += stats.adminCount;
      totalUserCount += stats.userCount;
      maxNetworkDepth = Math.max(maxNetworkDepth, stats.networkDepth);
      totalNodes += stats.totalMembers;
      totalInvites += stats.directInvites;
    });

    const averageInvites = totalNodes > 0 ? Math.round((totalInvites / totalNodes) * 10) / 10 : 0;

    return {
      totalMembers,
      directInvites: totalDirectInvites,
      adminCount: totalAdminCount,
      userCount: totalUserCount,
      networkDepth: maxNetworkDepth,
      averageInvites,
      totalCampaigns: networks.length
    };
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      if (!user?.id) return;

      // Buscar campanhas acessíveis primeiro
      const accessibleCampaigns = await fetchAccessibleCampaigns();
      
      // Buscar dados em paralelo para as campanhas acessíveis
      const [usersResponse, networksResponse] = await Promise.all([
        userService.getAll(),
        fetchAccessibleNetworks(accessibleCampaigns)
      ]);

      const users = usersResponse;
      const networks = networksResponse;

      // Filtrar usuários apenas das campanhas acessíveis
      const accessibleCampaignIds = accessibleCampaigns.map(campaign => campaign.id.toString());
      const accessibleUsers = users.filter(user => 
        user.campaign_id && accessibleCampaignIds.includes(user.campaign_id)
      );

      // Calcular estatísticas dos usuários acessíveis
      const activeUsers = accessibleUsers.filter(user => user.is_active === "1");
      const totalSupporters = activeUsers.length;
      const totalCampaigns = accessibleCampaigns.length;
      
      // Calcular convites enviados (usuários com invited_by preenchido)
      const invitationsSent = accessibleUsers.filter(user => user.invited_by !== null).length;
      
      // Calcular taxa de engajamento (usuários ativos / total de usuários * 100)
      const engagementRate = accessibleUsers.length > 0 ? (activeUsers.length / accessibleUsers.length) * 100 : 0;

      // Calcular métricas de crescimento
      const growthStats = calculateGrowthMetrics(accessibleUsers, accessibleCampaigns);

      // Buscar atividade recente (últimos 5 usuários criados das campanhas acessíveis)
      const recentUsers = accessibleUsers
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5);

      const recentActivity = recentUsers.map(user => ({
        type: 'new_supporter',
        icon: <UserPlus className="text-blue-500 w-4 h-4" />,
        bg: darkMode ? "bg-blue-900" : "bg-blue-100",
        text: `Novo apoiador: ${user.name}`,
        time: formatTimeAgo(user.created_at)
      }));

      // Adicionar atividades de campanhas recentes
      const recentCampaigns = accessibleCampaigns
        .sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime())
        .slice(0, 2);

      recentCampaigns.forEach(campaign => {
        recentActivity.push({
          type: 'new_campaign',
          icon: <Award className="text-purple-500 w-4 h-4" />,
          bg: darkMode ? "bg-purple-900" : "bg-purple-100",
          text: `Nova campanha: ${campaign.name}`,
          time: formatTimeAgo(campaign.created_at!)
        });
      });

      // Ordenar atividades por data e pegar as 5 mais recentes
      const sortedActivities = recentActivity
        .sort((a, b) => {
          return new Date(getActivityDate(b)).getTime() - new Date(getActivityDate(a)).getTime();
        })
        .slice(0, 5);

      // Calcular estatísticas da rede a partir das redes acessíveis
      const networkStats = calculateConsolidatedNetworkStats(networks);

      setDashboardData({
        totalSupporters,
        campaigns: totalCampaigns,
        invitationsSent,
        engagementRate: Math.round(engagementRate),
        recentActivity: sortedActivities,
        networkStats,
        growthStats
      });

    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  // Função auxiliar para obter data da atividade
  const getActivityDate = (activity: any) => {
    return activity.time.includes('min') ? new Date().toISOString() : activity.time;
  };

  // Calcular métricas de crescimento reais
  const calculateGrowthMetrics = (users: User[], campaigns: any[]) => {
    const now = new Date();
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Crescimento de apoiadores (último mês)
    const lastMonthUsers = users.filter(user => 
      new Date(user.created_at) >= oneMonthAgo
    ).length;
    const previousMonthUsers = users.filter(user => {
      const userDate = new Date(user.created_at);
      return userDate >= new Date(oneMonthAgo.getFullYear(), oneMonthAgo.getMonth() - 1, oneMonthAgo.getDate()) &&
             userDate < oneMonthAgo;
    }).length;
    
    const supportersGrowth = previousMonthUsers > 0 
      ? `${((lastMonthUsers - previousMonthUsers) / previousMonthUsers * 100).toFixed(1)}%`
      : lastMonthUsers > 0 ? '+100%' : '0%';

    // Crescimento de campanhas (última semana)
    const lastWeekCampaigns = campaigns.filter(campaign => 
      new Date(campaign.created_at!) >= lastWeek
    ).length;
    const campaignsGrowth = lastWeekCampaigns > 0 ? `+${lastWeekCampaigns}` : '0';

    // Taxa de aceitação de convites (usuários que aceitaram convites vs total de convites)
    const acceptedInvites = users.filter(user => user.invited_by !== null && user.is_active === "1").length;
    const totalInvitesSent = users.filter(user => user.invited_by !== null).length;
    const acceptanceRate = totalInvitesSent > 0 
      ? `${Math.round((acceptedInvites / totalInvitesSent) * 100)}%`
      : '0%';

    // Crescimento de engajamento (usuários ativos este mês vs mês passado)
    const activeThisMonth = users.filter(user => 
      user.is_active === "1" && new Date(user.updated_at) >= oneMonthAgo
    ).length;
    const activePreviousMonth = users.filter(user => {
      const updateDate = new Date(user.updated_at);
      return user.is_active === "1" && 
             updateDate >= new Date(oneMonthAgo.getFullYear(), oneMonthAgo.getMonth() - 1, oneMonthAgo.getDate()) &&
             updateDate < oneMonthAgo;
    }).length;
    
    const engagementGrowth = activePreviousMonth > 0
      ? `${((activeThisMonth - activePreviousMonth) / activePreviousMonth * 100).toFixed(1)}%`
      : activeThisMonth > 0 ? '+100%' : '0%';

    return {
      supportersGrowth,
      campaignsGrowth,
      invitationsGrowth: acceptanceRate,
      engagementGrowth
    };
  };

  // Calcular estatísticas reais da rede baseada na estrutura do seu JSON
  const calculateRealNetworkStats = (networkUser: NetworkUser) => {
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

    const calculateDepth = (node: NetworkUser): number => {
      if (node.children.length === 0) return 1;
      let maxDepth = 0;
      node.children.forEach(child => {
        maxDepth = Math.max(maxDepth, calculateDepth(child));
      });
      return maxDepth + 1;
    };

    const calculateAverageInvites = (node: NetworkUser): number => {
      let totalNodes = 0;
      let totalInvites = 0;

      const traverse = (currentNode: NetworkUser) => {
        totalNodes++;
        totalInvites += currentNode.children.length;
        currentNode.children.forEach(child => traverse(child));
      };

      traverse(node);
      return totalNodes > 0 ? Math.round((totalInvites / totalNodes) * 10) / 10 : 0;
    };

    const totalMembers = countTotalMembers(networkUser);
    const directInvites = networkUser.children.length;
    const adminCount = countByRole(networkUser, 'admin');
    const userCount = countByRole(networkUser, 'user');
    const networkDepth = calculateDepth(networkUser);
    const averageInvites = calculateAverageInvites(networkUser);

    return {
      totalMembers,
      directInvites,
      adminCount,
      userCount,
      networkDepth,
      averageInvites
    };
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
      if (diffInMinutes < 1) return 'Agora mesmo';
      return `${diffInMinutes} min atrás`;
    } else if (diffInHours < 24) {
      return `${diffInHours} horas atrás`;
    } else if (diffInDays === 1) {
      return 'Ontem';
    } else if (diffInDays < 7) {
      return `${diffInDays} dias atrás`;
    } else if (diffInDays < 30) {
      const weeks = Math.floor(diffInDays / 7);
      return `${weeks} semana${weeks > 1 ? 's' : ''} atrás`;
    } else {
      const months = Math.floor(diffInDays / 30);
      return `${months} mês${months > 1 ? 'es' : ''} atrás`;
    }
  };

  // === FUNÇÕES PARA VISUALIZAÇÃO VISUAL ===

  // Renderizar gráfico de rede circular
  const renderNetworkRadialChart = () => {
    const { totalMembers, directInvites, totalCampaigns } = dashboardData.networkStats;
    
    return (
      <div className="flex flex-col items-center justify-center p-6">
        {/* Gráfico Radial Principal */}
        <div className="relative w-48 h-48 mb-6">
          {/* Círculo de fundo */}
          <div className="absolute inset-0 rounded-full border-8 border-gray-200 dark:border-gray-700"></div>
          
          {/* Círculo de membros (azul) */}
          <div 
            className="absolute inset-0 rounded-full border-8 border-blue-500"
            style={{
              clipPath: `conic-gradient(transparent 0%, blue ${Math.min(100, (totalMembers / 200) * 100)}%, transparent 0%)`
            }}
          ></div>
          
          {/* Círculo de campanhas (roxo) */}
          <div 
            className="absolute inset-2 rounded-full border-8 border-purple-500"
            style={{
              clipPath: `conic-gradient(transparent 0%, purple ${Math.min(100, (totalCampaigns / 10) * 100)}%, transparent 0%)`
            }}
          ></div>
          
          {/* Círculo de convites (verde) */}
          <div 
            className="absolute inset-4 rounded-full border-8 border-green-500"
            style={{
              clipPath: `conic-gradient(transparent 0%, green ${Math.min(100, (directInvites / 100) * 100)}%, transparent 0%)`
            }}
          ></div>
          
          {/* Centro do gráfico */}
          <div className="absolute inset-8 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center shadow-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{totalMembers}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Membros</div>
            </div>
          </div>
        </div>

        {/* Legenda */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-gray-600 dark:text-gray-300">Membros</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
            <span className="text-gray-600 dark:text-gray-300">Campanhas</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-gray-600 dark:text-gray-300">Convites</span>
          </div>
        </div>
      </div>
    );
  };

  // Renderizar gráfico de distribuição hierárquica
  const renderHierarchyChart = () => {
    const { totalMembers, directInvites, networkDepth, averageInvites } = dashboardData.networkStats;
    
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Distribuição por Nível</h3>
          <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
            <Target className="w-4 h-4" />
            <span>Profundidade: {networkDepth} níveis</span>
          </div>
        </div>

        {/* Barras de nível */}
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(level => (
            <div key={level} className="flex items-center space-x-3">
              <div className="w-16 text-sm text-gray-600 dark:text-gray-400 font-medium">
                Nível {level}
              </div>
              <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.max(10, 100 - (level * 15))}%`
                  }}
                ></div>
              </div>
              <div className="w-12 text-right text-sm text-gray-600 dark:text-gray-400">
                {Math.round(totalMembers * (0.3 - (level * 0.05)))}
              </div>
            </div>
          ))}
        </div>

        {/* Estatísticas rápidas */}
        <div className="grid grid-cols-2 gap-4 mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{directInvites}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Convites Diretos</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{averageInvites}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Média por Pessoa</div>
          </div>
        </div>
      </div>
    );
  };

  // Renderizar visualização de rede em forma de árvore
  const renderNetworkTreeVisual = () => {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Minhas Redes</h3>
          <div className="flex items-center space-x-2 text-sm text-blue-600 dark:text-blue-400">
            <Building2 className="w-4 h-4" />
            <span>{dashboardData.networkStats.totalCampaigns} campanhas</span>
          </div>
        </div>

        {/* Representação visual da rede */}
        <div className="relative h-48 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 rounded-lg p-4 overflow-hidden">
          {/* Nó central (usuário principal) */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white dark:border-gray-800">
              <Users className="w-6 h-6 text-white" />
            </div>
          </div>

          {/* Nós conectados - representando campanhas */}
          {accessibleCampaigns.slice(0, 6).map((campaign, i) => {
            const angle = (i / Math.min(6, accessibleCampaigns.length)) * 2 * Math.PI;
            const radius = 70;
            const x = 50 + radius * Math.cos(angle);
            const y = 50 + radius * Math.sin(angle);
            
            return (
              <div
                key={campaign.id}
                className="absolute w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg border-2 border-white dark:border-gray-800 animate-pulse"
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  animationDelay: `${i * 0.2}s`
                }}
                title={campaign.name}
              >
                {campaign.name.charAt(0).toUpperCase()}
              </div>
            );
          })}

          {/* Linhas de conexão */}
          <svg className="absolute inset-0 w-full h-full">
            {accessibleCampaigns.slice(0, 6).map((_, i) => {
              const angle = (i / Math.min(6, accessibleCampaigns.length)) * 2 * Math.PI;
              const radius = 70;
              const x1 = 50;
              const y1 = 50;
              const x2 = 50 + radius * Math.cos(angle);
              const y2 = 50 + radius * Math.sin(angle);
              
              return (
                <line
                  key={i}
                  x1={`${x1}%`}
                  y1={`${y1}%`}
                  x2={`${x2}%`}
                  y2={`${y2}%`}
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-blue-300 dark:text-blue-700"
                  strokeDasharray="4,4"
                />
              );
            })}
          </svg>
        </div>

        {/* Indicadores de crescimento */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="text-green-600 dark:text-green-400 font-bold">+{dashboardData.networkStats.directInvites}</div>
            <div className="text-xs text-green-700 dark:text-green-300">Diretos</div>
          </div>
          <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="text-blue-600 dark:text-blue-400 font-bold">{dashboardData.networkStats.totalCampaigns}</div>
            <div className="text-xs text-blue-700 dark:text-blue-300">Campanhas</div>
          </div>
          <div className="text-center p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <div className="text-purple-600 dark:text-purple-400 font-bold">{dashboardData.networkStats.averageInvites}</div>
            <div className="text-xs text-purple-700 dark:text-purple-300">Média</div>
          </div>
        </div>
      </div>
    );
  };

  // Renderizar métricas de performance da rede
  const renderNetworkMetrics = () => {
    const { totalMembers, directInvites, totalCampaigns } = dashboardData.networkStats;
    
    const metrics = [
      {
        icon: <GitBranch className="w-5 h-5" />,
        label: "Expansão da Rede",
        value: `${totalMembers} pessoas`,
        progress: Math.min(100, (totalMembers / 500) * 100),
        color: "blue"
      },
      {
        icon: <Target className="w-5 h-5" />,
        label: "Taxa de Conversão",
        value: `${Math.round((directInvites / Math.max(1, totalMembers)) * 100)}%`,
        progress: Math.min(100, (directInvites / Math.max(1, totalMembers)) * 100),
        color: "green"
      },
      {
        icon: <Building2 className="w-5 h-5" />,
        label: "Campanhas Ativas",
        value: `${totalCampaigns}`,
        progress: Math.min(100, (totalCampaigns / 10) * 100),
        color: "purple"
      }
    ];

    return (
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Métricas de Performance</h3>
        <div className="space-y-4">
          {metrics.map((metric, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className={`text-${metric.color}-500`}>{metric.icon}</div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {metric.label}
                  </span>
                </div>
                <span className="text-sm font-bold text-gray-900 dark:text-white">
                  {metric.value}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className={`bg-${metric.color}-500 h-2 rounded-full transition-all duration-500`}
                  style={{ width: `${metric.progress}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className={`flex h-screen overflow-hidden transition-colors duration-300
        ${darkMode ? "bg-gray-950 text-gray-100" : "bg-gray-50 text-gray-900"}
      `}>
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className={`flex-1 overflow-y-auto p-6 transition-colors duration-300
            ${darkMode ? "bg-gray-950" : "bg-gray-50"}
          `}>
            <div className="max-w-7xl mx-auto flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                <p className={`mt-4 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  Carregando dados...
                </p>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex h-screen overflow-hidden transition-colors duration-300
        ${darkMode ? "bg-gray-950 text-gray-100" : "bg-gray-50 text-gray-900"}
      `}
    >
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />

        <main
          className={`flex-1 overflow-y-auto p-6 transition-colors duration-300
            ${darkMode ? "bg-gray-950" : "bg-gray-50"}
          `}
        >
          <div className="max-w-7xl mx-auto">
            {/* Cards Principais */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card
                title="Total de Apoiadores"
                value={dashboardData.totalSupporters.toLocaleString()}
                icon={<Users className="text-blue-500 w-8 h-8" />}
                color="blue"
                change={dashboardData.growthStats.supportersGrowth}
                note="nas minhas campanhas"
                isNegative={dashboardData.growthStats.supportersGrowth.includes('-')}
              />
              <Card
                title="Minhas Campanhas"
                value={dashboardData.campaigns.toString()}
                icon={<Award className="text-purple-500 w-8 h-8" />}
                color="purple"
                change={dashboardData.growthStats.campaignsGrowth}
                note="que crio ou gerencio"
              />
              <Card
                title="Convites Enviados"
                value={dashboardData.invitationsSent.toLocaleString()}
                icon={<Send className="text-green-500 w-8 h-8" />}
                color="green"
                change={dashboardData.growthStats.invitationsGrowth}
                note="taxa de aceitação"
              />
              <Card
                title="Usuários Ativos"
                value={`${dashboardData.engagementRate}%`}
                icon={<Activity className="text-yellow-500 w-8 h-8" />}
                color="yellow"
                change={dashboardData.growthStats.engagementGrowth}
                note="em relação ao mês passado"
                isNegative={dashboardData.growthStats.engagementGrowth.includes('-')}
              />
            </div>

            {/* Atividade Recente */}
            <section
              className={`rounded-lg shadow p-6 mb-8 transition-colors duration-300
                ${darkMode ? "bg-gray-900" : "bg-white"}
              `}
            >
              <div className="flex justify-between items-center mb-6">
                <h2
                  className={`text-xl font-bold ${
                    darkMode ? "text-gray-100" : "text-gray-800"
                  }`}
                >
                  Atividade Recente
                </h2>
                <a
                  href="#"
                  className={`text-sm font-medium ${
                    darkMode
                      ? "text-blue-400 hover:text-blue-300"
                      : "text-blue-500 hover:text-blue-700"
                  }`}
                >
                  Ver tudo
                </a>
              </div>
              <div className="space-y-4">
                {dashboardData.recentActivity.length > 0 ? (
                  dashboardData.recentActivity.map((activity, index) => (
                    <ActivityItem
                      key={index}
                      icon={activity.icon}
                      bg={activity.bg}
                      text={activity.text}
                      time={activity.time}
                    />
                  ))
                ) : (
                  <p className={`text-center py-4 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                    Nenhuma atividade recente nas suas campanhas
                  </p>
                )}
              </div>
            </section>

            {/* Rede de Apoio - VISUALIZAÇÃO ATUALIZADA */}
            <section
              className={`rounded-lg shadow transition-colors duration-300
                ${darkMode ? "bg-gray-900" : "bg-white"}
              `}
            >
              <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
                <h2
                  className={`text-xl font-bold ${
                    darkMode ? "text-gray-100" : "text-gray-800"
                  }`}
                >
                  Minhas Redes - {dashboardData.networkStats.totalMembers} Membros
                </h2>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setSelectedView('overview')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedView === 'overview'
                        ? darkMode
                          ? "bg-blue-600 text-white"
                          : "bg-blue-500 text-white"
                        : darkMode
                        ? "bg-gray-800 text-gray-200 hover:bg-gray-700"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    Visão Geral
                  </button>
                  <button
                    onClick={() => setSelectedView('hierarchy')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedView === 'hierarchy'
                        ? darkMode
                          ? "bg-blue-600 text-white"
                          : "bg-blue-500 text-white"
                        : darkMode
                        ? "bg-gray-800 text-gray-200 hover:bg-gray-700"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    Hierarquia
                  </button>
                </div>
              </div>
              
              {/* Conteúdo da Visualização */}
              <div className="p-6">
                {selectedView === 'overview' ? (
                  // VISÃO GERAL - Layout com múltiplos gráficos
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Gráfico Radial */}
                    <div className={`rounded-lg p-4 ${
                      darkMode ? 'bg-gray-800' : 'bg-gray-50'
                    }`}>
                      {renderNetworkRadialChart()}
                    </div>
                    
                    {/* Métricas de Performance */}
                    <div className={`rounded-lg ${
                      darkMode ? 'bg-gray-800' : 'bg-gray-50'
                    }`}>
                      {renderNetworkMetrics()}
                    </div>
                    
                    {/* Visualização da Rede */}
                    <div className="lg:col-span-2">
                      {renderNetworkTreeVisual()}
                    </div>
                  </div>
                ) : (
                  // VISÃO DE HIERARQUIA
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Gráfico de Distribuição */}
                    <div className={`rounded-lg ${
                      darkMode ? 'bg-gray-800' : 'bg-gray-50'
                    }`}>
                      {renderHierarchyChart()}
                    </div>
                    
                    {/* Estatísticas Detalhadas */}
                    <div className={`rounded-lg p-6 ${
                      darkMode ? 'bg-gray-800' : 'bg-gray-50'
                    }`}>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Estatísticas da Rede
                      </h3>
                      <div className="space-y-4">
                        <StatItem
                          label="Total de Membros"
                          value={dashboardData.networkStats.totalMembers}
                          icon={<Users className="w-4 h-4" />}
                          color="blue"
                          darkMode={darkMode}
                        />
                        <StatItem
                          label="Convites Diretos"
                          value={dashboardData.networkStats.directInvites}
                          icon={<Send className="w-4 h-4" />}
                          color="green"
                          darkMode={darkMode}
                        />
                        <StatItem
                          label="Profundidade da Rede"
                          value={dashboardData.networkStats.networkDepth}
                          icon={<GitBranch className="w-4 h-4" />}
                          color="purple"
                          darkMode={darkMode}
                        />
                        <StatItem
                          label="Média de Convites"
                          value={dashboardData.networkStats.averageInvites}
                          icon={<Target className="w-4 h-4" />}
                          color="yellow"
                          darkMode={darkMode}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};

// === Subcomponentes ===
const Card = ({ title, value, icon, color, change, note, isNegative = false }: any) => {
  const { darkMode } = useTheme();

  return (
    <div
      className={`rounded-lg shadow p-6 border-l-4 transition-colors duration-300 border-${color}-500
        ${darkMode ? "bg-gray-900 text-gray-100" : "bg-white text-gray-900"}
      `}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className={darkMode ? "text-gray-400" : "text-gray-500"}>{title}</p>
          <h3 className="text-2xl font-bold">{value}</h3>
        </div>
        {icon}
      </div>
      <div className="mt-4">
        <span
          className={`${
            isNegative ? "text-red-500" : "text-green-500"
          } text-sm font-medium`}
        >
          {change}
        </span>
        <span className={`ml-2 text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
          {note}
        </span>
      </div>
    </div>
  );
};

const ActivityItem = ({ icon, bg, text, time }: any) => {
  const { darkMode } = useTheme();

  return (
    <div className="flex items-start">
      <div className={`${bg} p-2 rounded-full mr-4`}>{icon}</div>
      <div>
        <p className={darkMode ? "text-gray-100" : "text-gray-800"}>{text}</p>
        <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{time}</p>
      </div>
    </div>
  );
};

const StatItem = ({ label, value, icon, color }: any) => {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-gray-700 shadow-sm">
      <div className="flex items-center space-x-3">
        <div className={`text-${color}-500`}>{icon}</div>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </span>
      </div>
      <span className="text-lg font-bold text-gray-900 dark:text-white">
        {value}
      </span>
    </div>
  );
};

export default Dashboard;