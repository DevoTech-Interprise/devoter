import { useState, useEffect } from 'react';
import { Users, Loader2, ChevronDown, ChevronRight, User, Mail, Crown, Shield, Search, Filter, Palette, Star, Building2 } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import { campaignService } from '../../services/campaignService';
import { networkService, type NetworkUser } from '../../services/networkService';
import { userService } from '../../services/userService';
import { useUser } from '../../context/UserContext';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface Campaign {
    id: number;
    name: string;
    description: string;
    logo: string;
    color_primary: string;
    color_secondary: string;
    created_by: number;
    operator?: string;
}

// Adicione esta interface no campaignNetworks.tsx
interface CampaignsResponse {
    campaigns?: Campaign[];
    [key: string]: any;
}

interface NetworkWithClass extends NetworkUser {
    networkClass: number;
    children: NetworkWithClass[];
}

interface CampaignWithNetworks {
    campaign: Campaign;
    networks: NetworkWithClass[];
    stats: {
        totalMembers: number;
        totalClasses: number;
        classDistribution: { [key: number]: number };
    };
    userRole: 'creator' | 'manager' | 'none';
}

const CampaignNetworksPage = () => {
    const { user } = useUser();
    const [campaignsWithNetworks, setCampaignsWithNetworks] = useState<CampaignWithNetworks[]>([]);
    const [accessibleCampaigns, setAccessibleCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set());
    const [expandedCampaigns, setExpandedCampaigns] = useState<Set<number>>(new Set());
    const [searchTerm, setSearchTerm] = useState('');
    const [filterClass, setFilterClass] = useState<number | 'all'>('all');
    const [nodesToExpand, setNodesToExpand] = useState<Set<number>>(new Set());

    const isAdmin = user?.role === 'admin';

    // Função para buscar campanhas que o usuário pode acessar
    const fetchAccessibleCampaigns = async (): Promise<Campaign[]> => {
        if (!user?.id) return [];

        try {
            // Para admin, buscar todas as campanhas que ele criou ou gerencia
            const accessibleCampaigns = await networkService.getUserAccessibleCampaigns(user.id);
            setAccessibleCampaigns(accessibleCampaigns);
            return accessibleCampaigns;
        } catch (error) {
            console.error('Erro ao buscar campanhas acessíveis:', error);
            return [];
        }
    };

    // Função para determinar o papel do usuário na campanha
    const getUserRoleInCampaign = (campaign: Campaign): 'creator' | 'manager' | 'none' => {
        if (!user?.id) return 'none';

        if (campaign.created_by.toString() === user.id.toString()) {
            return 'creator';
        }

        if (campaign.operator && campaign.operator.split(',').map(id => id.trim()).includes(user.id)) {
            return 'manager';
        }

        return 'none';
    };

    // Função para calcular a classe de cada usuário na rede baseado na profundidade
    const calculateNetworkClasses = (network: NetworkUser, currentClass: number = 1): NetworkWithClass => {
        return {
            ...network,
            networkClass: currentClass,
            children: network.children.map(child =>
                calculateNetworkClasses(child, currentClass + 1)
            )
        };
    };

    // Função para verificar se uma rede contém uma classe específica
    const networkContainsClass = (network: NetworkWithClass, targetClass: number): boolean => {
        if (network.networkClass === targetClass) {
            return true;
        }

        return network.children.some(child =>
            networkContainsClass(child, targetClass)
        );
    };

    // Função para encontrar todos os IDs de nós que possuem a classe alvo
    const findNodesWithClass = (network: NetworkWithClass, targetClass: number): number[] => {
        const nodes: number[] = [];

        if (network.networkClass === targetClass) {
            nodes.push(network.id);
        }

        network.children.forEach(child => {
            nodes.push(...findNodesWithClass(child, targetClass));
        });

        return nodes;
    };

    // Função para expandir o caminho até um nó específico
    const expandPathToNode = (network: NetworkWithClass, targetNodeId: number, path: number[] = []): number[] => {
        const currentPath = [...path, network.id];

        if (network.id === targetNodeId) {
            return currentPath;
        }

        for (const child of network.children) {
            const result = expandPathToNode(child, targetNodeId, currentPath);
            if (result.length > 0) {
                return result;
            }
        }

        return [];
    };

    // Buscar campanhas acessíveis e suas redes
    const fetchCampaignsWithNetworks = async () => {
        try {
            setLoading(true);

            // Buscar campanhas que o usuário pode acessar
            const accessibleCampaigns = await fetchAccessibleCampaigns();

            console.log('Campanhas acessíveis:', accessibleCampaigns.length); // Para debug

            // Para cada campanha acessível, buscar as redes
            const campaignsWithNetworksData: CampaignWithNetworks[] = [];

            for (const campaign of accessibleCampaigns) {
                try {
                    // Determinar quem é o root da rede para esta campanha
                    let networkRootUserId: string | number;

                    // Se o usuário é o criador da campanha, usa ele mesmo como root
                    if (campaign.created_by.toString() === user?.id.toString()) {
                        networkRootUserId = user.id;
                    } 
                    // Se o usuário é manager (operator), usa o criador da campanha como root
                    else if (campaign.operator && campaign.operator.split(',').map(id => id.trim()).includes(user?.id || '')) {
                        networkRootUserId = campaign.created_by;
                    }
                    // Caso contrário, não deveria ter acesso (mas por segurança usa o criador)
                    else {
                        networkRootUserId = campaign.created_by;
                    }

                    console.log(`🔄 Processando campanha: ${campaign.name} (ID: ${campaign.id})`);
                    console.log(`👑 Root da rede: ${networkRootUserId}`);

                    // Buscar a rede usando a rota específica por campanha
                    const creatorNetwork = await networkService.getNetworkTreeByCampaign(
                        campaign.id.toString(), 
                        networkRootUserId
                    );

                    // Calcular classes hierárquicas
                    const networkWithClasses = calculateNetworkClasses(creatorNetwork);

                    // Calcular estatísticas da campanha
                    const stats = calculateCampaignStats(networkWithClasses);

                    // Determinar papel do usuário na campanha
                    const userRole = getUserRoleInCampaign(campaign);

                    campaignsWithNetworksData.push({
                        campaign,
                        networks: [networkWithClasses],
                        stats,
                        userRole
                    });

                    console.log(`✅ Rede carregada para campanha ${campaign.name}: ${stats.totalMembers} membros`);

                } catch (error) {
                    console.error(`Erro ao carregar rede da campanha ${campaign.name}:`, error);
                    
                    // Fallback: criar uma rede mínima
                    try {
                        const creatorData = await userService.getById(campaign.created_by.toString());
                        const minimalNetwork: NetworkWithClass = {
                            id: campaign.created_by,
                            name: creatorData.name,
                            email: creatorData.email,
                            role: creatorData.role as 'admin' | 'user',
                            campaign_id: campaign.id.toString(),
                            phone: creatorData.phone,
                            invited_by: creatorData.invited_by ? Number(creatorData.invited_by) : null,
                            children: [],
                            networkClass: 1
                        };

                        const userRole = getUserRoleInCampaign(campaign);

                        campaignsWithNetworksData.push({
                            campaign,
                            networks: [minimalNetwork],
                            stats: {
                                totalMembers: 1,
                                totalClasses: 1,
                                classDistribution: { 1: 1 }
                            },
                            userRole
                        });

                        console.log(`🔄 Fallback criado para campanha ${campaign.name}`);
                    } catch (fallbackError) {
                        console.error(`Erro no fallback para campanha ${campaign.name}:`, fallbackError);
                    }
                }
            }

            setCampaignsWithNetworks(campaignsWithNetworksData);

            // Expandir a primeira campanha por padrão
            if (campaignsWithNetworksData.length > 0) {
                setExpandedCampaigns(new Set([campaignsWithNetworksData[0].campaign.id]));
            }
        } catch (err) {
            console.error('Erro ao carregar campanhas:', err);
            toast.error('Erro ao carregar campanhas e redes');
        } finally {
            setLoading(false);
        }
    };

    // Calcular estatísticas da campanha
    const calculateCampaignStats = (network: NetworkWithClass) => {
        const classDistribution: { [key: number]: number } = {};
        let totalMembers = 0;
        const classes = new Set<number>();

        const countMembers = (node: NetworkWithClass) => {
            totalMembers++;
            classDistribution[node.networkClass] = (classDistribution[node.networkClass] || 0) + 1;
            classes.add(node.networkClass);

            node.children.forEach(child => countMembers(child));
        };

        countMembers(network);

        return {
            totalMembers,
            totalClasses: classes.size,
            classDistribution
        };
    };

    useEffect(() => {
        if (user?.id) {
            fetchCampaignsWithNetworks();
        }
    }, [user]);

    // Efeito para expandir nós quando filtrar por classe
    useEffect(() => {
        if (filterClass !== 'all') {
            const nodesToExpandSet = new Set<number>();
            const campaignsToExpand = new Set<number>();
            const allNodesWithClass: number[] = [];

            campaignsWithNetworks.forEach(campaignWithNetworks => {
                campaignWithNetworks.networks.forEach(network => {
                    if (networkContainsClass(network, filterClass)) {
                        campaignsToExpand.add(campaignWithNetworks.campaign.id);

                        // Encontrar todos os nós com a classe alvo
                        const nodesWithClass = findNodesWithClass(network, filterClass);
                        allNodesWithClass.push(...nodesWithClass);

                        // Para cada nó com a classe alvo, expandir o caminho até ele
                        nodesWithClass.forEach(nodeId => {
                            const path = expandPathToNode(network, nodeId);
                            path.forEach(nodeIdInPath => nodesToExpandSet.add(nodeIdInPath));
                        });
                    }
                });
            });

            setExpandedCampaigns(campaignsToExpand);
            setExpandedNodes(nodesToExpandSet);
            setNodesToExpand(new Set(allNodesWithClass));
        } else {
            // Se não há filtro, limpar os nós expandidos especiais
            setNodesToExpand(new Set());
        }
    }, [filterClass, campaignsWithNetworks]);

    const toggleNode = (nodeId: number) => {
        setExpandedNodes(prev => networkService.toggleNode(prev, nodeId));
    };

    const toggleCampaign = (campaignId: number) => {
        setExpandedCampaigns(prev => {
            const newSet = new Set(prev);
            if (newSet.has(campaignId)) {
                newSet.delete(campaignId);
            } else {
                newSet.add(campaignId);
            }
            return newSet;
        });
    };

    const getClassColor = (networkClass: number) => {
        switch (networkClass) {
            case 1: return 'bg-yellow-500';
            case 2: return 'bg-purple-500';
            case 3: return 'bg-blue-500';
            case 4: return 'bg-green-500';
            case 5: return 'bg-orange-500';
            default: return 'bg-gray-500';
        }
    };

    const getClassBadgeColor = (networkClass: number) => {
        switch (networkClass) {
            case 1: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 2: return 'bg-purple-100 text-purple-800 border-purple-200';
            case 3: return 'bg-blue-100 text-blue-800 border-blue-200';
            case 4: return 'bg-green-100 text-green-800 border-green-200';
            case 5: return 'bg-orange-100 text-orange-800 border-orange-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getRoleIcon = (role: string) => {
        switch (role) {
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

    const getUserRoleBadge = (userRole: 'creator' | 'manager' | 'none') => {
        switch (userRole) {
            case 'creator':
                return <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full border border-green-200">Criador</span>;
            case 'manager':
                return <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full border border-purple-200">Manager</span>;
            default:
                return null;
        }
    };

    const renderTreeNode = (node: NetworkWithClass, level: number = 0) => {
        const isExpanded = expandedNodes.has(node.id);
        const hasChildren = node.children.length > 0;
        const isTargetClass = nodesToExpand.has(node.id) && node.networkClass === filterClass;

        return (
            <div key={node.id} className="ml-6">
                {/* Linha de conexão */}
                {level > 0 && (
                    <div
                        className="absolute left-3 top-0 w-0.5 h-4 bg-gray-300"
                        style={{ marginLeft: `${(level - 1) * 24}px` }}
                    />
                )}

                <div className="flex items-start gap-3 relative">
                    {/* Linha horizontal */}
                    {level > 0 && (
                        <div
                            className="absolute left-3 top-4 w-3 h-0.5 bg-gray-300"
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
                            <div className="w-1 h-1 rounded-full bg-gray-300" />
                        </div>
                    )}

                    {/* Card do usuário */}
                    <div className={`flex-1 min-w-0 p-4 rounded-lg border-2 transition-all hover:shadow-md ${isTargetClass
                        ? 'border-2 border-red-500 bg-red-50 dark:bg-red-900/20'
                        : 'border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-600'
                        }`}>
                        <div className="flex items-start justify-between">
                            <div className="flex-1  min-w-0">
                                <div className="flex justify-center md:justify-start  items-center gap-3 mb-2 flex-wrap">
                                    <div className="flex flex-col md:flex-row items-center gap-2">
                                        {getRoleIcon(node.role)}
                                        <h3 className=" font-semibold text-wrap text-center  text-gray-900 dark:text-white">
                                            {node.name}
                                        </h3>
                                    </div>
                                    <div className="flex flex-col md:flex-row justify-center gap-2 flex-wrap">
                                        <span className={`text-xs text-center px-2 py-1 rounded-full border ${getRoleColor(node.role)}`}>
                                            {node.role === 'admin' ? 'Administrador' : 
                                             node.role === 'manager' ? 'Manager' : 'Usuário'}
                                        </span>
                                        <span className={`text-xs text-center px-2 py-1 rounded-full border ${getClassBadgeColor(node.networkClass)} ${isTargetClass ? 'ring-2 ring-red-500' : ''
                                            }`}>
                                            Classe {node.networkClass}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex flex-col md:flex-row items-center gap-2 text-sm text-gray-600 dark:text-gray-300 mb-2">
                                    <Mail className="w-4 h-4" />
                                    <span className="truncate">{node.email}</span>
                                </div>

                                {hasChildren && (
                                    <div className="flex justify-center md:justify-start items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
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
                            className="absolute left-3 top-0 w-0.5 bg-gray-300"
                            style={{
                                marginLeft: `${level * 24}px`,
                                height: '100%'
                            }}
                        />
                        <div className="space-y-4 pt-4">
                            {node.children.map(child => renderTreeNode(child, level + 1))}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    // Filtragem
    const filteredCampaigns = campaignsWithNetworks.filter(campaignWithNetworks => {
        const matchesSearch =
            campaignWithNetworks.campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            campaignWithNetworks.campaign.description.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesClass = filterClass === 'all' ||
            campaignWithNetworks.networks.some(network =>
                networkContainsClass(network, filterClass)
            );

        return matchesSearch && matchesClass;
    });

    if (loading) {
        return (
            <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
                <Sidebar />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-4" />
                        <p className="text-gray-600 dark:text-gray-400">Carregando campanhas e redes...</p>
                    </div>
                </div>
            </div>
        );
    }

    const totalStats = {
        totalCampaigns: campaignsWithNetworks.length,
        totalMembers: campaignsWithNetworks.reduce((sum, c) => sum + c.stats.totalMembers, 0),
        maxClassDepth: Math.max(...campaignsWithNetworks.map(c => c.stats.totalClasses), 0)
    };

    return (
        <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
            <Sidebar />
            <div className="flex-1 overflow-auto">
                <div className="p-8">
                    <ToastContainer position="top-right" />

                    <div className="max-w-7xl mx-auto">
                        {/* Header */}
                        <header className="mb-8">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30">
                                    <Palette className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
                                        Redes por Campanha
                                    </h1>
                                    <p className="mt-2 text-gray-600 dark:text-gray-400">
                                        Visualize as redes hierárquicas das campanhas que você {isAdmin ? 'cria ou gerencia' : 'participa'}
                                    </p>
                                </div>
                            </div>

                            {/* Informação de Acesso */}
                            {accessibleCampaigns.length === 0 && (
                                <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
                                    <p className="text-yellow-800 dark:text-yellow-200">
                                        {isAdmin 
                                            ? 'Você não criou ou não gerencia nenhuma campanha.'
                                            : 'Você não está associado a nenhuma campanha.'
                                        }
                                    </p>
                                </div>
                            )}

                            {/* Estatísticas Gerais */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                                    <div className="text-center">
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Campanhas Acessíveis</p>
                                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                            {totalStats.totalCampaigns}
                                        </p>
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                                    <div className="text-center">
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Total de Membros</p>
                                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                            {totalStats.totalMembers}
                                        </p>
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                                    <div className="text-center">
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Maior Profundidade</p>
                                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                            {totalStats.maxClassDepth} classes
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Filtros e Busca */}
                            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 mb-6">
                                <div className="flex flex-col md:flex-row gap-4">
                                    {/* Busca */}
                                    <div className="flex-1">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                            <input
                                                type="text"
                                                placeholder="Buscar por nome ou descrição da campanha..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                    </div>

                                    {/* Filtro por Classe */}
                                    <div className="flex gap-2">
                                        <Filter className="w-5 h-5 text-gray-400 mt-2" />
                                        <select
                                            value={filterClass}
                                            onChange={(e) => setFilterClass(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                                            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        >
                                            <option value="all">Todas as Classes</option>
                                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(className => (
                                                <option key={className} value={className}>
                                                    Classe {className}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                {filterClass !== 'all' && (
                                    <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                        <p className="text-sm text-blue-700 dark:text-blue-300">
                                            <strong>Filtro ativo:</strong> Mostrando campanhas que contêm usuários da Classe {filterClass}.
                                            Os nós da classe {filterClass} estão destacados em vermelho.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </header>

                        {/* Lista de Campanhas com Redes */}
                        <section className="space-y-6">
                            {filteredCampaigns.length > 0 ? (
                                filteredCampaigns.map(({ campaign, networks, stats, userRole }) => (
                                    <div key={campaign.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                                        {/* Header da Campanha */}
                                        <div
                                            className="p-6 text-white relative"
                                            style={{
                                                background: `linear-gradient(135deg, ${campaign.color_primary}, ${campaign.color_secondary})`
                                            }}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <img
                                                        src={campaign.logo}
                                                        alt={campaign.name}
                                                        className="w-16 h-16 rounded-lg object-cover border-2 border-white/20"
                                                    />
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <h3 className="text-2xl font-bold">{campaign.name}</h3>
                                                            {getUserRoleBadge(userRole)}
                                                        </div>
                                                        <p className="text-sm opacity-90 mt-1">{campaign.description}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => toggleCampaign(campaign.id)}
                                                    className="shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                                                >
                                                    {expandedCampaigns.has(campaign.id) ? (
                                                        <ChevronDown className="w-6 h-6" />
                                                    ) : (
                                                        <ChevronRight className="w-6 h-6" />
                                                    )}
                                                </button>
                                            </div>

                                            {/* Estatísticas da Campanha */}
                                            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                                <div className="text-center">
                                                    <div className="text-xl font-bold">{stats.totalMembers}</div>
                                                    <div className="opacity-90">Total de Membros</div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="text-xl font-bold">{stats.totalClasses}</div>
                                                    <div className="opacity-90">Classes na Rede</div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="text-xl font-bold">{networks[0]?.children.length || 0}</div>
                                                    <div className="opacity-90">Convites Diretos</div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="text-xl font-bold">{networks[0]?.networkClass || 1}</div>
                                                    <div className="opacity-90">Classe do Criador</div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Distribuição de Classes */}
                                        {expandedCampaigns.has(campaign.id) && (
                                            <div className="p-4 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                                                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Distribuição por Classe</h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {Object.entries(stats.classDistribution).map(([className, count]) => (
                                                        <div key={className} className={`flex items-center gap-2 px-3 py-1 rounded-full border ${Number(className) === filterClass
                                                            ? 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 ring-2 ring-red-500'
                                                            : 'bg-white dark:bg-gray-600 border-gray-200 dark:border-gray-500'
                                                            }`}>
                                                            <div className={`w-3 h-3 rounded-full ${getClassColor(Number(className))}`}></div>
                                                            <span className={`text-sm ${Number(className) === filterClass
                                                                ? 'text-red-700 dark:text-red-300 font-bold'
                                                                : 'text-gray-700 dark:text-gray-300'
                                                                }`}>
                                                                Classe {className}: <strong>{count}</strong> membros
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Árvore da Rede */}
                                        {expandedCampaigns.has(campaign.id) && (
                                            <div className="p-6">
                                                <div className="relative">
                                                    {networks.map(network => renderTreeNode(network))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                                    <Palette className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                                    <p className="text-gray-500 dark:text-gray-400">
                                        {accessibleCampaigns.length === 0
                                            ? 'Nenhuma campanha encontrada para exibir.'
                                            : 'Nenhuma campanha encontrada com os filtros aplicados.'
                                        }
                                    </p>
                                </div>
                            )}
                        </section>

                        {/* Legenda */}
                        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Legenda</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <h5 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Classes Hierárquicas</h5>
                                    <div className="grid grid-cols-2 gap-2">
                                        {[1, 2, 3, 4, 5].map(className => (
                                            <div key={className} className={`flex items-center gap-2 p-2 rounded-lg ${className === filterClass
                                                ? 'bg-red-50 dark:bg-red-900/30 border-2 border-red-500'
                                                : 'bg-gray-50 dark:bg-gray-700'
                                                }`}>
                                                <div className={`w-3 h-3 rounded-full ${getClassColor(className)}`}></div>
                                                <span className={`text-sm ${className === filterClass
                                                    ? 'text-red-700 dark:text-red-300 font-bold'
                                                    : 'text-gray-700 dark:text-gray-300'
                                                    }`}>
                                                    <strong>Classe {className}:</strong> {className === 1 ? 'Criador' : `Nível ${className}`}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <h5 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Papéis na Campanha</h5>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 p-2 rounded-lg bg-green-50 dark:bg-green-900/20">
                                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                            <span className="text-sm text-green-700 dark:text-green-300">
                                                <strong>Criador:</strong> Você criou esta campanha
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 p-2 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                                            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                                            <span className="text-sm text-purple-700 dark:text-purple-300">
                                                <strong>Manager:</strong> Você gerencia esta campanha
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CampaignNetworksPage;