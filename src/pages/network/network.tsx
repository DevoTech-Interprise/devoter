import { useState, useEffect } from 'react';
import { Users, Loader2, ChevronDown, ChevronRight, User, Mail, Crown, Shield } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import { useUser } from '../../context/UserContext';
import { networkService, type NetworkUser } from '../../services/networkService';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const NetworkPage = () => {
  const { user } = useUser();
  const [network, setNetwork] = useState<NetworkUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set());

  const fetchNetwork = async () => {
    try {
      setLoading(true);
      if (!user?.id) {
        toast.error('Usuário não encontrado');
        return;
      }

      const networkData = await networkService.getNetworkTree(user.id);
      setNetwork(networkData);
      
      // Expandir o nó raiz por padrão
      setExpandedNodes(new Set([networkData.id]));
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

  const renderTreeNode = (node: NetworkUser, level: number = 0) => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children.length > 0;
    // Corrigindo a comparação: converter user.id para número ou comparar como string
    const isCurrentUser = node.id === Number(user?.id);

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
          <div className={`flex-1 min-w-0 p-4 rounded-lg border-2 transition-all hover:shadow-md ${
            isCurrentUser 
              ? 'border-blue-300 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-600' 
              : 'border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-600'
          }`}>
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    {getRoleIcon(node.role)}
                    <h3 className={`font-semibold truncate ${isCurrentUser ? 'text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-white'}`}>
                      {node.name}
                      {isCurrentUser && (
                        <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                          Você
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
                  <span className="truncate">{node.email}</span>
                </div>

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

  const networkStats = network ? networkService.calculateNetworkStats(network) : null;

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
                    Visualize toda a sua rede de convites e membros
                  </p>
                </div>
              </div>

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
                </h2>
                <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
              </div>

              {network ? (
                <div className="relative">
                  {renderTreeNode(network)}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    Nenhuma rede encontrada. Comece compartilhando seus convites!
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