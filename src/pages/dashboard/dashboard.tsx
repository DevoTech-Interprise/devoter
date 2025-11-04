import { useState, useEffect } from 'react';
import { Users, Award, Send, Activity, UserPlus, ChevronDown, ChevronRight } from "lucide-react";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import { useTheme } from "../../context/ThemeContext";
import { userService, type User } from '../../services/userService';
import { campaignService } from '../../services/campaignService';
import { networkService, type NetworkUser } from '../../services/networkService';

const Dashboard = () => {
  const { darkMode } = useTheme();
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
      userCount: 0
    },
    growthStats: {
      supportersGrowth: '',
      campaignsGrowth: '',
      invitationsGrowth: '',
      engagementGrowth: ''
    }
  });
  const [networkTree, setNetworkTree] = useState<NetworkUser[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Buscar dados em paralelo
      const [usersResponse, campaignsResponse, networksResponse] = await Promise.all([
        userService.getAll(),
        campaignService.getAll(),
        networkService.getAllNetworks()
      ]);

      const users = usersResponse;
      const campaigns = campaignsResponse;
      const networks = networksResponse;

      // Calcular estatísticas dos usuários
      const activeUsers = users.filter(user => user.is_active === "1");
      const totalSupporters = activeUsers.length;
      const totalCampaigns = campaigns.length;
      
      // Calcular convites enviados (usuários com invited_by preenchido)
      const invitationsSent = users.filter(user => user.invited_by !== null).length;
      
      // Calcular taxa de engajamento (usuários ativos / total de usuários * 100)
      const engagementRate = users.length > 0 ? (activeUsers.length / users.length) * 100 : 0;

      // Calcular métricas de crescimento
      const growthStats = calculateGrowthMetrics(users, campaigns);

      // Buscar atividade recente (últimos 5 usuários criados)
      const recentUsers = users
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
      const recentCampaigns = campaigns
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
          // Ordenar pelas datas reais dos usuários/campanhas
          return new Date(getActivityDate(b)).getTime() - new Date(getActivityDate(a)).getTime();
        })
        .slice(0, 5);

      // Calcular estatísticas da rede a partir da estrutura real
      let networkStats = {
        totalMembers: 0,
        directInvites: 0,
        adminCount: 0,
        userCount: 0
      };

      if (networks && networks.length > 0) {
        // Usar a primeira rede (renanarruda) como principal para estatísticas
        const mainNetwork = networks[0];
        networkStats = calculateRealNetworkStats(mainNetwork);
        setNetworkTree(networks);
        // Expandir o nó raiz por padrão
        setExpandedNodes(new Set([networks[0].id]));
      }

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
      userCount
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

  // Funções para manipular a árvore de rede
  const toggleNode = (nodeId: number) => {
    const newExpandedNodes = new Set(expandedNodes);
    if (newExpandedNodes.has(nodeId)) {
      newExpandedNodes.delete(nodeId);
    } else {
      newExpandedNodes.add(nodeId);
    }
    setExpandedNodes(newExpandedNodes);
  };

  const renderNetworkTree = (nodes: NetworkUser[], level = 0) => {
    return nodes.map((node) => (
      <div key={node.id} className="ml-4">
        <div 
          className={`flex items-center py-2 px-3 rounded-lg cursor-pointer transition-colors ${
            darkMode 
              ? 'hover:bg-gray-700' 
              : 'hover:bg-gray-100'
          } ${level === 0 ? 'border-l-4 border-blue-500' : ''}`}
          onClick={() => toggleNode(node.id)}
        >
          <div className="flex items-center flex-1 min-w-0">
            {node.children.length > 0 ? (
              expandedNodes.has(node.id) ? (
                <ChevronDown className="w-4 h-4 mr-2 flex-shrink-0" />
              ) : (
                <ChevronRight className="w-4 h-4 mr-2 flex-shrink-0" />
              )
            ) : (
              <div className="w-4 h-4 mr-2 flex-shrink-0" />
            )}
            
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mr-3 ${
              node.role === 'admin' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-400 text-white'
            }`}>
              {node.name.charAt(0).toUpperCase()}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <span className={`font-medium truncate ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  {node.name}
                </span>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  node.role === 'admin'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {node.role}
                </span>
              </div>
              <p className={`text-sm truncate ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {node.email}
              </p>
            </div>
            
            {node.children.length > 0 && (
              <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${
                darkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-700'
              }`}>
                {node.children.length} convite(s)
              </span>
            )}
          </div>
        </div>
        
        {expandedNodes.has(node.id) && node.children.length > 0 && (
          <div className="border-l-2 border-gray-300 dark:border-gray-600 ml-2">
            {renderNetworkTree(node.children, level + 1)}
          </div>
        )}
      </div>
    ));
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
            {/* Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card
                title="Total de Apoiadores"
                value={dashboardData.totalSupporters.toLocaleString()}
                icon={<Users className="text-blue-500 w-8 h-8" />}
                color="blue"
                change={dashboardData.growthStats.supportersGrowth}
                note="desde último mês"
                isNegative={dashboardData.growthStats.supportersGrowth.includes('-')}
              />
              <Card
                title="Campanhas Ativas"
                value={dashboardData.campaigns.toString()}
                icon={<Award className="text-purple-500 w-8 h-8" />}
                color="purple"
                change={dashboardData.growthStats.campaignsGrowth}
                note="criadas esta semana"
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
                    Nenhuma atividade recente
                  </p>
                )}
              </div>
            </section>

            {/* Rede de Apoio */}
            <section
              className={`rounded-lg shadow p-6 transition-colors duration-300
                ${darkMode ? "bg-gray-900" : "bg-white"}
              `}
            >
              <div className="flex justify-between items-center mb-6">
                <h2
                  className={`text-xl font-bold ${
                    darkMode ? "text-gray-100" : "text-gray-800"
                  }`}
                >
                  Rede de Apoio - {dashboardData.networkStats.totalMembers} Membros
                </h2>
                <div className="flex space-x-2">
                  <button
                    className={`px-3 py-1 border rounded text-sm font-medium transition-colors
                      ${
                        darkMode
                          ? "border-blue-500 bg-blue-950 text-blue-300"
                          : "border-blue-500 bg-blue-50 text-blue-600"
                      }
                    `}
                  >
                    Visão Geral
                  </button>
                  <button
                    className={`px-3 py-1 border rounded text-sm font-medium transition-colors
                      ${
                        darkMode
                          ? "border-gray-700 text-gray-200 hover:bg-gray-800"
                          : "border-gray-300 text-gray-700 hover:bg-gray-100"
                      }
                    `}
                  >
                    Hierarquia
                  </button>
                </div>
              </div>
              
              {/* Estatísticas da Rede */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <StatCard
                  title="Total na Rede"
                  value={dashboardData.networkStats.totalMembers}
                  subtitle="membros"
                  darkMode={darkMode}
                />
                <StatCard
                  title="Convites Diretos"
                  value={dashboardData.networkStats.directInvites}
                  subtitle="primeiro nível"
                  darkMode={darkMode}
                />
                <StatCard
                  title="Administradores"
                  value={dashboardData.networkStats.adminCount}
                  subtitle="na rede"
                  darkMode={darkMode}
                />
                <StatCard
                  title="Apoiadores"
                  value={dashboardData.networkStats.userCount}
                  subtitle="usuários"
                  darkMode={darkMode}
                />
              </div>

              <div
                className={`h-96 rounded-lg transition-colors overflow-y-auto
                  ${darkMode ? "bg-gray-800" : "bg-gray-100"}
                `}
              >
                {networkTree.length > 0 ? (
                  <div className="p-4">
                    <h3 className={`text-lg font-semibold mb-4 ${
                      darkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      Estrutura da Rede
                    </h3>
                    {renderNetworkTree(networkTree)}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <Users className={`mx-auto w-12 h-12 ${darkMode ? "text-gray-600" : "text-gray-400"}`} />
                      <p className={`mt-2 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                        Nenhuma rede encontrada
                      </p>
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

const StatCard = ({ title, value, subtitle, darkMode }: { title: string; value: number; subtitle: string; darkMode: boolean }) => {
  return (
    <div
      className={`rounded-lg p-4 text-center transition-colors duration-300
        ${darkMode ? "bg-gray-800" : "bg-gray-50"}
      `}
    >
      <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"} mb-1`}>
        {title}
      </p>
      <p className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
        {value}
      </p>
      <p className={`text-xs ${darkMode ? "text-gray-500" : "text-gray-400"} mt-1`}>
        {subtitle}
      </p>
    </div>
  );
};

export default Dashboard;