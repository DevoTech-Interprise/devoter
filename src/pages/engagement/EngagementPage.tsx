// src/pages/engagement/EngagementPage.tsx
import { useState, useEffect } from 'react';
import {
  Users,
  MessageCircle,
  Calendar,
  Heart,
  Megaphone,
  Plus,
  Filter,
  BarChart3,
  Send,
  Eye,
  Edit,
  Trash2,
  Copy,
  CheckCircle,
  Clock,
  XCircle,
  MapPin,
  Phone,
  Mail,
  X
} from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import { useTheme } from '../../context/ThemeContext';
import { useUser } from '../../context/UserContext';
import { engagementService, type EngagementAction, type EngagementStats } from '../../services/engagementService';
import { userService, type User } from '../../services/userService';
import { campaignService, type Campaign } from '../../services/campaignService';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Interface para o formulário de criação
interface CreateEngagementAction {
  title: string;
  description: string;
  type: 'whatsapp_group' | 'event' | 'campaign' | 'social_action';
  target_audience: 'all' | 'filtered';
  filters?: {
    campaign_id?: string;
    city?: string;
    state?: string;
    role?: string;
    status?: string;
    neighborhood?: string;
  };
  whatsapp_link?: string;
  event_date?: string;
  location?: string;
}

const EngagementPage = () => {
  const { darkMode } = useTheme();
  const { user: currentUser } = useUser();
  const [actions, setActions] = useState<EngagementAction[]>([]);
  const [stats, setStats] = useState<EngagementStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [selectedAction, setSelectedAction] = useState<EngagementAction | null>(null);
  const [eligibleUsers, setEligibleUsers] = useState<User[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  // Form states
  const [actionForm, setActionForm] = useState<CreateEngagementAction>({
    title: '',
    description: '',
    type: 'whatsapp_group',
    target_audience: 'all',
    filters: {},
    whatsapp_link: '',
    event_date: '',
    location: ''
  });

  const actionTypes = [
    { value: 'whatsapp_group', label: 'Grupo WhatsApp', icon: MessageCircle, color: 'text-green-500' },
    { value: 'event', label: 'Evento/Comício', icon: Calendar, color: 'text-blue-500' },
    { value: 'social_action', label: 'Ação Social', icon: Heart, color: 'text-red-500' },
    { value: 'campaign', label: 'Campanha', icon: Megaphone, color: 'text-yellow-500' }
  ];

  useEffect(() => {
    loadData();
  }, [currentUser]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [actionsData, statsData, campaignsData] = await Promise.all([
        engagementService.getAllActions(),
        engagementService.getStats(),
        campaignService.getAll()
      ]);
      setActions(actionsData);
      setStats(statsData);
      setCampaigns(campaignsData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar ações de engajamento');
    } finally {
      setLoading(false);
    }
  };

  const loadEligibleUsers = async (filters?: EngagementAction['filters']) => {
    try {
      const users = await engagementService.getFilteredUsers(filters);
      setEligibleUsers(users);
    } catch (error) {
      console.error('Erro ao carregar usuários elegíveis:', error);
      toast.error('Erro ao carregar usuários');
    }
  };

  const handleCreateAction = async () => {
    try {
      if (!actionForm.title.trim()) {
        toast.error('Título é obrigatório');
        return;
      }

      const actionData = {
        ...actionForm,
        created_by: currentUser?.id || '1',
        status: 'active' as const
      };

      await engagementService.createAction(actionData);
      await loadData();
      setShowCreateModal(false);
      resetForm();
      toast.success('Ação criada com sucesso!');
    } catch (error) {
      console.error('Erro ao criar ação:', error);
      toast.error('Erro ao criar ação');
    }
  };

  const handleSendInvites = async () => {
    if (!selectedAction || selectedUsers.length === 0) return;

    try {
      const result = await engagementService.sendInvites(selectedAction.id, selectedUsers);
      if (result.success) {
        setShowInviteModal(false);
        setSelectedUsers([]);
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Erro ao enviar convites:', error);
      toast.error('Erro ao enviar convites');
    }
  };

  const handleViewStats = (action: EngagementAction) => {
    setSelectedAction(action);
    setShowStatsModal(true);
  };

  const handleDeleteAction = async (action: EngagementAction) => {
    if (window.confirm(`Tem certeza que deseja excluir a ação "${action.title}"?`)) {
      try {
        await engagementService.deleteAction(action.id);
        await loadData();
        toast.success('Ação excluída com sucesso!');
      } catch (error) {
        console.error('Erro ao excluir ação:', error);
        toast.error('Erro ao excluir ação');
      }
    }
  };

  const handleCopyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    toast.success('Link copiado para a área de transferência!');
  };

  const resetForm = () => {
    setActionForm({
      title: '',
      description: '',
      type: 'whatsapp_group',
      target_audience: 'all',
      filters: {},
      whatsapp_link: '',
      event_date: '',
      location: ''
    });
  };

  const getActionIcon = (type: string) => {
    const actionType = actionTypes.find(t => t.value === type);
    return actionType ? actionType.icon : MessageCircle;
  };

  const getStatusBadge = (status: string) => {
    const config = {
      active: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Ativo' },
      inactive: { color: 'bg-gray-100 text-gray-800', icon: Clock, label: 'Inativo' },
      completed: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle, label: 'Concluído' }
    }[status];

    if (!config) return null;

    const IconComponent = config.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <IconComponent className="w-3 h-3 mr-1" />
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
                  Carregando ações de engajamento...
                </p>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

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
          <ToastContainer 
            position="top-right"
            theme={darkMode ? 'dark' : 'light'}
          />
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-2xl font-bold">Engajamento e Ações</h1>
                  <p className={`mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                    Crie grupos, eventos e ações para engajar sua rede
                  </p>
                </div>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Ação
                </button>
              </div>
            </div>

            {/* Stats Cards */}
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className={`rounded-lg p-4 ${darkMode ? "bg-gray-900" : "bg-white"} shadow`}>
                  <div className="flex items-center">
                    <Megaphone className="w-8 h-8 text-blue-500" />
                    <div className="ml-4">
                      <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                        Total de Ações
                      </p>
                      <p className="text-2xl font-bold">{stats.total_actions}</p>
                    </div>
                  </div>
                </div>
                <div className={`rounded-lg p-4 ${darkMode ? "bg-gray-900" : "bg-white"} shadow`}>
                  <div className="flex items-center">
                    <CheckCircle className="w-8 h-8 text-green-500" />
                    <div className="ml-4">
                      <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                        Ações Ativas
                      </p>
                      <p className="text-2xl font-bold">{stats.active_actions}</p>
                    </div>
                  </div>
                </div>
                <div className={`rounded-lg p-4 ${darkMode ? "bg-gray-900" : "bg-white"} shadow`}>
                  <div className="flex items-center">
                    <Users className="w-8 h-8 text-purple-500" />
                    <div className="ml-4">
                      <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                        Total de Participantes
                      </p>
                      <p className="text-2xl font-bold">{stats.total_participants}</p>
                    </div>
                  </div>
                </div>
                <div className={`rounded-lg p-4 ${darkMode ? "bg-gray-900" : "bg-white"} shadow`}>
                  <div className="flex items-center">
                    <MessageCircle className="w-8 h-8 text-green-500" />
                    <div className="ml-4">
                      <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                        Grupos WhatsApp
                      </p>
                      <p className="text-2xl font-bold">{stats.whatsapp_groups}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Actions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {actions.map((action) => {
                const ActionIcon = getActionIcon(action.type);
                
                return (
                  <div key={action.id} className={`rounded-lg p-6 shadow ${darkMode ? "bg-gray-900" : "bg-white"}`}>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center">
                        <ActionIcon className="w-6 h-6 mr-2 text-blue-500" />
                        <h3 className="font-semibold">{action.title}</h3>
                      </div>
                      {getStatusBadge(action.status)}
                    </div>
                    
                    <p className={`text-sm mb-4 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                      {action.description}
                    </p>

                    {action.type === 'whatsapp_group' && action.whatsapp_link && (
                      <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-sm text-green-700 dark:text-green-300">
                            <MessageCircle className="w-4 h-4 mr-2" />
                            Grupo WhatsApp
                          </div>
                          <button
                            onClick={() => handleCopyLink(action.whatsapp_link!)}
                            className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200"
                            title="Copiar link"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}

                    {(action.type === 'event' || action.type === 'social_action') && action.event_date && (
                      <div className="mb-4 space-y-2 text-sm">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2" />
                          {formatDate(action.event_date)}
                        </div>
                        {action.location && (
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 mr-2" />
                            {action.location}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <div>
                        {action.participants_count || 0} participantes
                      </div>
                      <div>
                        {action.target_audience === 'filtered' ? 'Público filtrado' : 'Todos os usuários'}
                      </div>
                    </div>

                    <div className="flex justify-between items-center mt-4">
                      <div className="text-xs text-gray-500">
                        Criado em {new Date(action.created_at).toLocaleDateString('pt-BR')}
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewStats(action)}
                          className="p-1 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                          title="Estatísticas"
                        >
                          <BarChart3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedAction(action);
                            setShowInviteModal(true);
                            loadEligibleUsers(action.filters);
                          }}
                          className="p-1 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"
                          title="Enviar Convites"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteAction(action)}
                          className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                          title="Excluir ação"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {actions.length === 0 && (
              <div className="text-center py-12">
                <MessageCircle className={`mx-auto w-16 h-16 ${darkMode ? "text-gray-600" : "text-gray-400"}`} />
                <h3 className={`mt-4 text-lg font-medium ${darkMode ? "text-gray-300" : "text-gray-900"}`}>
                  Nenhuma ação de engajamento criada
                </h3>
                <p className={`mt-2 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  Comece criando sua primeira ação para engajar sua rede
                </p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Criar Primeira Ação
                </button>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Create Action Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto ${darkMode ? "bg-gray-900" : "bg-white"}`}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Criar Nova Ação</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className={`p-1 rounded-lg ${darkMode ? "hover:bg-gray-800" : "hover:bg-gray-100"}`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Título da Ação *</label>
                  <input
                    type="text"
                    value={actionForm.title}
                    onChange={(e) => setActionForm({ ...actionForm, title: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                      darkMode
                        ? "bg-gray-800 border-gray-700 text-white focus:border-blue-500"
                        : "bg-white border-gray-300 text-gray-900 focus:border-blue-500"
                    }`}
                    placeholder="Ex: Grupo de Apoio - Comitê Central"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Descrição</label>
                  <textarea
                    value={actionForm.description}
                    onChange={(e) => setActionForm({ ...actionForm, description: e.target.value })}
                    rows={3}
                    className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                      darkMode
                        ? "bg-gray-800 border-gray-700 text-white focus:border-blue-500"
                        : "bg-white border-gray-300 text-gray-900 focus:border-blue-500"
                    }`}
                    placeholder="Descreva o propósito desta ação..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Tipo de Ação *</label>
                  <div className="grid grid-cols-2 gap-4">
                    {actionTypes.map((type) => {
                      const IconComponent = type.icon;
                      return (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => setActionForm({ ...actionForm, type: type.value as any })}
                          className={`p-4 rounded-lg border-2 text-left transition-colors ${
                            actionForm.type === type.value
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                              : darkMode
                              ? 'border-gray-700 hover:border-gray-600'
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          <IconComponent className={`w-6 h-6 mb-2 ${type.color}`} />
                          <div className="font-medium">{type.label}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {actionForm.type === 'whatsapp_group' && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Link do Grupo WhatsApp</label>
                    <input
                      type="url"
                      value={actionForm.whatsapp_link || ''}
                      onChange={(e) => setActionForm({ ...actionForm, whatsapp_link: e.target.value })}
                      className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                        darkMode
                          ? "bg-gray-800 border-gray-700 text-white focus:border-blue-500"
                          : "bg-white border-gray-300 text-gray-900 focus:border-blue-500"
                      }`}
                      placeholder="https://chat.whatsapp.com/..."
                    />
                  </div>
                )}

                {(actionForm.type === 'event' || actionForm.type === 'social_action') && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-2">Data e Hora</label>
                      <input
                        type="datetime-local"
                        value={actionForm.event_date || ''}
                        onChange={(e) => setActionForm({ ...actionForm, event_date: e.target.value })}
                        className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                          darkMode
                            ? "bg-gray-800 border-gray-700 text-white focus:border-blue-500"
                            : "bg-white border-gray-300 text-gray-900 focus:border-blue-500"
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Localização</label>
                      <input
                        type="text"
                        value={actionForm.location || ''}
                        onChange={(e) => setActionForm({ ...actionForm, location: e.target.value })}
                        className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                          darkMode
                            ? "bg-gray-800 border-gray-700 text-white focus:border-blue-500"
                            : "bg-white border-gray-300 text-gray-900 focus:border-blue-500"
                        }`}
                        placeholder="Ex: Praça Central, Rua Principal, 123"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium mb-2">Público Alvo</label>
                  <select
                    value={actionForm.target_audience}
                    onChange={(e) => setActionForm({ 
                      ...actionForm, 
                      target_audience: e.target.value as 'all' | 'filtered',
                      filters: e.target.value === 'all' ? {} : actionForm.filters
                    })}
                    className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                      darkMode
                        ? "bg-gray-800 border-gray-700 text-white focus:border-blue-500"
                        : "bg-white border-gray-300 text-gray-900 focus:border-blue-500"
                    }`}
                  >
                    <option value="all">Todos os usuários</option>
                    <option value="filtered">Filtro personalizado</option>
                  </select>
                </div>

                {actionForm.target_audience === 'filtered' && (
                  <div className="space-y-4 p-4 border rounded-lg">
                    <h4 className="font-medium">Filtros do Público</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Campanha</label>
                        <select
                          value={actionForm.filters?.campaign_id || ''}
                          onChange={(e) => setActionForm({ 
                            ...actionForm, 
                            filters: { ...actionForm.filters, campaign_id: e.target.value }
                          })}
                          className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                            darkMode
                              ? "bg-gray-800 border-gray-700 text-white focus:border-blue-500"
                              : "bg-white border-gray-300 text-gray-900 focus:border-blue-500"
                          }`}
                        >
                          <option value="">Todas as campanhas</option>
                          {campaigns.map((campaign) => (
                            <option key={campaign.id} value={campaign.id}>
                              {campaign.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Cidade</label>
                        <input
                          type="text"
                          value={actionForm.filters?.city || ''}
                          onChange={(e) => setActionForm({ 
                            ...actionForm, 
                            filters: { ...actionForm.filters, city: e.target.value }
                          })}
                          className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                            darkMode
                              ? "bg-gray-800 border-gray-700 text-white focus:border-blue-500"
                              : "bg-white border-gray-300 text-gray-900 focus:border-blue-500"
                          }`}
                          placeholder="Ex: Recife"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-6">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className={`px-4 py-2 rounded-lg border transition-colors ${
                      darkMode
                        ? "border-gray-600 text-gray-300 hover:bg-gray-800"
                        : "border-gray-300 text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleCreateAction}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Criar Ação
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Send Invites Modal */}
      {showInviteModal && selectedAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto ${darkMode ? "bg-gray-900" : "bg-white"}`}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Enviar Convites - {selectedAction.title}</h3>
                <button
                  onClick={() => setShowInviteModal(false)}
                  className={`p-1 rounded-lg ${darkMode ? "hover:bg-gray-800" : "hover:bg-gray-100"}`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-6">
                <div className="flex space-x-4 mb-4">
                  <button
                    onClick={() => loadEligibleUsers(selectedAction.filters)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center"
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    Carregar Usuários Elegíveis
                  </button>
                  <div className="text-sm text-gray-500 flex items-center">
                    {selectedUsers.length} usuários selecionados
                  </div>
                </div>

                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full">
                    <thead className={darkMode ? "bg-gray-800" : "bg-gray-50"}>
                      <tr>
                        <th className="px-4 py-2 text-left">
                          <input
                            type="checkbox"
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedUsers(eligibleUsers.map(u => u.id));
                              } else {
                                setSelectedUsers([]);
                              }
                            }}
                            className="rounded"
                          />
                        </th>
                        <th className="px-4 py-2 text-left">Usuário</th>
                        <th className="px-4 py-2 text-left">Telefone</th>
                        <th className="px-4 py-2 text-left">Cidade</th>
                        <th className="px-4 py-2 text-left">Campanha</th>
                      </tr>
                    </thead>
                    <tbody>
                      {eligibleUsers.map((user) => (
                        <tr key={user.id} className={darkMode ? "hover:bg-gray-800" : "hover:bg-gray-50"}>
                          <td className="px-4 py-2">
                            <input
                              type="checkbox"
                              checked={selectedUsers.includes(user.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedUsers([...selectedUsers, user.id]);
                                } else {
                                  setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                                }
                              }}
                              className="rounded"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <div className="font-medium">{user.name}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </td>
                          <td className="px-4 py-2">{user.phone || '-'}</td>
                          <td className="px-4 py-2">{user.city || '-'}</td>
                          <td className="px-4 py-2">{user.campaign_id || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {eligibleUsers.length === 0 && (
                    <div className="text-center py-8">
                      <Users className={`mx-auto w-12 h-12 ${darkMode ? "text-gray-600" : "text-gray-400"}`} />
                      <p className={`mt-2 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                        Nenhum usuário encontrado com os filtros selecionados
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowInviteModal(false)}
                  className={`px-4 py-2 rounded-lg border transition-colors ${
                    darkMode
                      ? "border-gray-600 text-gray-300 hover:bg-gray-800"
                      : "border-gray-300 text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSendInvites}
                  disabled={selectedUsers.length === 0}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Enviar {selectedUsers.length} Convite(s)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Modal */}
      {showStatsModal && selectedAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto ${darkMode ? "bg-gray-900" : "bg-white"}`}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Estatísticas - {selectedAction.title}</h3>
                <button
                  onClick={() => setShowStatsModal(false)}
                  className={`p-1 rounded-lg ${darkMode ? "hover:bg-gray-800" : "hover:bg-gray-100"}`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className={`rounded-lg p-4 text-center ${darkMode ? "bg-gray-800" : "bg-blue-50"}`}>
                  <div className="text-2xl font-bold text-blue-600">
                    {selectedAction.participants_count || 0}
                  </div>
                  <div className="text-sm text-blue-600">Participantes</div>
                </div>
                <div className={`rounded-lg p-4 text-center ${darkMode ? "bg-gray-800" : "bg-green-50"}`}>
                  <div className="text-2xl font-bold text-green-600">
                    {selectedAction.target_audience === 'all' ? 'Todos' : 'Filtrado'}
                  </div>
                  <div className="text-sm text-green-600">Público Alvo</div>
                </div>
                <div className={`rounded-lg p-4 text-center ${darkMode ? "bg-gray-800" : "bg-purple-50"}`}>
                  <div className="text-2xl font-bold text-purple-600">
                    {getStatusBadge(selectedAction.status)}
                  </div>
                  <div className="text-sm text-purple-600">Status</div>
                </div>
              </div>

              <div className={`rounded-lg p-4 ${darkMode ? "bg-gray-800" : "bg-gray-50"}`}>
                <h4 className="font-medium mb-4">Detalhes da Ação</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className={darkMode ? "text-gray-400" : "text-gray-600"}>Tipo:</span>
                    <span className="font-medium">{actionTypes.find(t => t.value === selectedAction.type)?.label}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={darkMode ? "text-gray-400" : "text-gray-600"}>Criado em:</span>
                    <span className="font-medium">{formatDate(selectedAction.created_at)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={darkMode ? "text-gray-400" : "text-gray-600"}>Atualizado em:</span>
                    <span className="font-medium">{formatDate(selectedAction.updated_at)}</span>
                  </div>
                  {selectedAction.filters && Object.keys(selectedAction.filters).length > 0 && (
                    <div>
                      <span className={darkMode ? "text-gray-400" : "text-gray-600"}>Filtros aplicados:</span>
                      <div className="mt-1 space-y-1">
                        {selectedAction.filters.campaign_id && (
                          <div className="flex justify-between">
                            <span>Campanha:</span>
                            <span className="font-medium">{selectedAction.filters.campaign_id}</span>
                          </div>
                        )}
                        {selectedAction.filters.city && (
                          <div className="flex justify-between">
                            <span>Cidade:</span>
                            <span className="font-medium">{selectedAction.filters.city}</span>
                          </div>
                        )}
                        {selectedAction.filters.state && (
                          <div className="flex justify-between">
                            <span>Estado:</span>
                            <span className="font-medium">{selectedAction.filters.state}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowStatsModal(false)}
                  className={`px-4 py-2 rounded-lg border transition-colors ${
                    darkMode
                      ? "border-gray-600 text-gray-300 hover:bg-gray-800"
                      : "border-gray-300 text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EngagementPage;