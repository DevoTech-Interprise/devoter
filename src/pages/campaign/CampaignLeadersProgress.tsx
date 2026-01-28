import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, TrendingUp, Target, CheckCircle, AlertCircle, Loader2, Edit2, Trash2, Plus, RefreshCw } from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import Sidebar from '../../components/Sidebar';
import { useTheme } from '../../context/ThemeContext';
import { useCampaignColor } from '../../hooks/useCampaignColor';
import { campaignService } from '../../services/campaignService';
import type { Campaign } from '../../services/campaignService';
import { networkService } from '../../services/networkService';
import { useUser } from '../../context/UserContext';

interface CampaignManager {
  id: string | number;
  campaign_id: string | number;
  user_id: string | number;
  votes_promised: number;
  votes_expected: number;
  votes_achieved: number;
  votes_progress_promised: number;
  votes_progress_expected: number;
  created_at: string;
  name: string;
  email: string;
  phone: string;
}

interface CampaignWithManagers {
  campaign: Campaign;
  managers: CampaignManager[];
}

const CampaignLeadersProgress = () => {
  const { campaignId } = useParams<{ campaignId: string }>();
  const navigate = useNavigate();
  const { user } = useUser();
  const { darkMode } = useTheme();
  const { primaryColor } = useCampaignColor();

  const [campaignData, setCampaignData] = useState<CampaignWithManagers | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingManager, setEditingManager] = useState<CampaignManager | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    votes_promised: 0,
    votes_expected: 0,
    votes_achieved: 0,
  });
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<string | number | null>(null);
  const [recalculatingManager, setRecalculatingManager] = useState<string | number | null>(null);

  // Verificar permissão
  const canManageCampaign = () => {
    if (!campaignData?.campaign) return false;
    const isSuperUser = user?.role === 'super';
    const isCreator = String(campaignData.campaign.created_by) === String(user?.id);
    return isSuperUser || isCreator;
  };

  // Função para recalcular votos automaticamente baseado na rede
  const recalculateVotesFromNetwork = async (manager: CampaignManager) => {
    try {
      setRecalculatingManager(manager.id);
      
      // Buscar a rede de convidados desse manager
      const networkTree = await networkService.getNetworkTree(manager.user_id);
      
      // Contar quantas pessoas foram convidadas
      const votesAchieved = networkService.countNetworkMembers(networkTree);
      
      // Atualizar os votos alcançados na API
      await campaignService.updateCampaignManagerVotes(manager.id, votesAchieved);
      
      toast.success(`Votos atualizados! ${votesAchieved} pessoas convidadas.`);
      
      // Recarregar os dados
      await fetchCampaignManagers();
    } catch (err) {
      console.error('Erro ao recalcular votos:', err);
      toast.error('Erro ao recalcular votos baseado na rede');
    } finally {
      setRecalculatingManager(null);
    }
  };

  const fetchCampaignManagers = async () => {
    if (!campaignId) return;

    try {
      setLoading(true);
      const response = await campaignService.getCampaignManagers(campaignId);
      setCampaignData(response);
    } catch (err) {
      console.error('Erro ao carregar managers:', err);
      toast.error('Erro ao carregar dados das lideranças');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaignManagers();
  }, [campaignId]);

  const openEditModal = (manager: CampaignManager) => {
    setEditingManager(manager);
    setEditForm({
      votes_promised: manager.votes_promised,
      votes_expected: manager.votes_expected,
      votes_achieved: manager.votes_achieved,
    });
    setEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingManager) return;

    try {
      setSubmitting(true);

      // Atualizar metas (promised e expected)
      if (editForm.votes_promised !== editingManager.votes_promised || 
          editForm.votes_expected !== editingManager.votes_expected) {
        await campaignService.updateCampaignManagerGoals(
          editingManager.id,
          editForm.votes_promised,
          editForm.votes_expected
        );
      }

      // Atualizar votos alcançados
      if (editForm.votes_achieved !== editingManager.votes_achieved) {
        await campaignService.updateCampaignManagerVotes(
          editingManager.id,
          editForm.votes_achieved
        );
      }

      toast.success('Lideança atualizada com sucesso');
      setEditModalOpen(false);
      await fetchCampaignManagers();
    } catch (err) {
      console.error('Erro ao atualizar lideança:', err);
      toast.error('Erro ao atualizar lideança');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteManager = async (managerId: string | number) => {
    if (!confirm('Tem certeza que deseja remover esta lideança?')) return;

    try {
      setDeleting(managerId);
      await campaignService.removeCampaignManager(managerId);
      toast.success('Lideança removida com sucesso');
      await fetchCampaignManagers();
    } catch (err) {
      console.error('Erro ao remover lideança:', err);
      toast.error('Erro ao remover lideança');
    } finally {
      setDeleting(null);
    }
  };

  // Cálculos para resumo geral
  const calculateSummary = () => {
    if (!campaignData?.managers || campaignData.managers.length === 0) {
      return {
        totalManagers: 0,
        totalVotesPromised: 0,
        totalVotesExpected: 0,
        totalVotesAchieved: 0,
        overallProgress: 0,
      };
    }

    const managers = campaignData.managers;
    const totalVotesPromised = managers.reduce((sum, m) => sum + (Number(m.votes_promised) || 0), 0);
    const totalVotesExpected = managers.reduce((sum, m) => sum + (Number(m.votes_expected) || 0), 0);
    const totalVotesAchieved = managers.reduce((sum, m) => sum + (Number(m.votes_achieved) || 0), 0);
    const overallProgress = totalVotesExpected > 0 
      ? Math.round((totalVotesAchieved / totalVotesExpected) * 100) 
      : 0;

    return {
      totalManagers: managers.length,
      totalVotesPromised,
      totalVotesExpected,
      totalVotesAchieved,
      overallProgress,
    };
  };

  const summary = calculateSummary();

  // Função para obter cor de progresso baseado na percentagem
  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'text-green-600';
    if (percentage >= 75) return 'text-blue-600';
    if (percentage >= 50) return 'text-yellow-600';
    if (percentage >= 25) return 'text-orange-600';
    return 'text-red-600';
  };

  const getProgressBgColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-green-100 dark:bg-green-900';
    if (percentage >= 75) return 'bg-blue-100 dark:bg-blue-900';
    if (percentage >= 50) return 'bg-yellow-100 dark:bg-yellow-900';
    if (percentage >= 25) return 'bg-orange-100 dark:bg-orange-900';
    return 'bg-red-100 dark:bg-red-900';
  };

  if (loading) {
    return (
      <div className={`flex h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-300">Carregando dados das lideranças...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!campaignData?.campaign) {
    return (
      <div className={`flex h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-300 mb-4">Campanha não encontrada</p>
            <button
              onClick={() => navigate('/campaigns')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              Voltar para campanhas
            </button>
          </div>
        </div>
      </div>
    );
  }

  const campaign = campaignData.campaign;

  return (
    <div className={`flex h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
      <Sidebar />
      <div className="flex-1 overflow-auto p-8">
        <ToastContainer position="top-right" />

        <div className="max-w-7xl mx-auto">
          {/* Header com botão voltar */}
          <div className="mb-8">
            <button
              onClick={() => navigate('/campaigns')}
              className="flex items-center gap-2 mb-6 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition"
            >
              <ArrowLeft className="w-5 h-5" />
              Voltar para campanhas
            </button>

            <div className="flex items-start justify-between gap-4 mb-8">
              <div className="flex gap-4 items-start flex-1">
                <img
                  src={campaign.logo}
                  alt={campaign.name}
                  className="w-20 h-20 object-cover rounded-lg shadow-md"
                />
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    {campaign.name}
                  </h1>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Progresso das Lideranças
                  </p>
                </div>
              </div>
              {canManageCampaign() && (
                <button
                  onClick={() => navigate(`/campanhas/${campaignId}/adicionar-lideranças`)}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold shadow transition whitespace-nowrap"
                >
                  <Plus className="w-5 h-5" /> Adicionar Lideranças
                </button>
              )}
            </div>
          </div>

          {/* Resumo Geral */}
          {summary.totalManagers > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              {/* Total de Lideranças */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                      Total de Lideranças
                    </p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                      {summary.totalManagers}
                    </p>
                  </div>
                  <Users className="w-10 h-10 text-blue-600 opacity-20" />
                </div>
              </div>

              {/* Votos Esperados */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                      Votos Esperados
                    </p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                      {summary.totalVotesExpected.toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <Target className="w-10 h-10 text-orange-600 opacity-20" />
                </div>
              </div>

              {/* Votos Prometidos */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                      Votos Prometidos
                    </p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                      {summary.totalVotesPromised.toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <CheckCircle className="w-10 h-10 text-green-600 opacity-20" />
                </div>
              </div>

              {/* Votos Alcançados */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                      Votos Alcançados
                    </p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                      {summary.totalVotesAchieved.toLocaleString('pt-BR')}
                    </p>
                    <p className={`text-sm font-semibold mt-2 ${getProgressColor(summary.overallProgress)}`}>
                      {summary.overallProgress}% da meta
                    </p>
                  </div>
                  <TrendingUp className="w-10 h-10 text-blue-600 opacity-20" />
                </div>
              </div>
            </div>
          )}

          {/* Progress Bar Geral */}
          {summary.totalManagers > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-8 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Progresso Geral
              </h3>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(summary.overallProgress, 100)}%`,
                    backgroundColor: primaryColor,
                  }}
                />
              </div>
              <div className="flex justify-between items-center mt-3">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {summary.totalVotesAchieved} de {summary.totalVotesExpected} votos
                </p>
                <p className="text-sm font-semibold" style={{ color: primaryColor }}>
                  {summary.overallProgress}%
                </p>
              </div>
            </div>
          )}

          {/* Lista de Lideranças */}
          <div className="space-y-4">
            {campaignData.managers && campaignData.managers.length > 0 ? (
              campaignData.managers.map((manager) => {
                const votesAchieved = Number(manager.votes_achieved) || 0;
                const votesPromised = Number(manager.votes_promised) || 0;
                const votesExpected = Number(manager.votes_expected) || 0;
                const progressPromised = Math.round(
                  (votesAchieved / votesPromised) * 100 || 0
                );
                const progressExpected = Math.round(
                  (votesAchieved / votesExpected) * 100 || 0
                );

                return (
                  <div
                    key={manager.id}
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition"
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                          {manager.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {manager.email} • {manager.phone}
                        </p>
                      </div>
                      {canManageCampaign() && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => recalculateVotesFromNetwork(manager)}
                            disabled={recalculatingManager === manager.id}
                            className="flex items-center gap-1 px-3 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-semibold shadow transition disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Recalcular votos baseado na rede"
                          >
                            {recalculatingManager === manager.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <RefreshCw className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => openEditModal(manager)}
                            className="flex items-center gap-1 px-3 py-2 rounded-lg bg-yellow-500 hover:bg-yellow-600 text-white font-semibold shadow transition"
                            title="Editar lideança manualmente"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteManager(manager.id)}
                            disabled={deleting === manager.id}
                            className="flex items-center gap-1 px-3 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-semibold shadow transition disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Remover lideança"
                          >
                            {deleting === manager.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Grid de Métricas */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                      {/* Votos Prometidos */}
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase mb-2">
                          Votos Prometidos
                        </p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {votesAchieved.toLocaleString('pt-BR')}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          Meta: {votesPromised.toLocaleString('pt-BR')}
                        </p>
                      </div>

                      {/* Votos Esperados */}
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase mb-2">
                          Votos Esperados
                        </p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {votesAchieved.toLocaleString('pt-BR')}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          Meta: {votesExpected.toLocaleString('pt-BR')}
                        </p>
                      </div>

                      {/* Taxa de Conversão */}
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase mb-2">
                          Taxa de Conversão
                        </p>
                        <p className={`text-2xl font-bold ${getProgressColor(progressExpected)}`}>
                          {progressExpected}%
                        </p>
                        <div className="w-full bg-gray-300 dark:bg-gray-600 rounded-full h-2 mt-2 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${Math.min(progressExpected, 100)}%`,
                              backgroundColor: progressExpected >= 100 ? '#10b981' : primaryColor,
                            }}
                          />
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                          {votesAchieved.toLocaleString('pt-BR')} de {votesExpected.toLocaleString('pt-BR')}
                        </p>
                      </div>
                    </div>

                    {/* Barra de Progresso - Votos Prometidos */}
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Progresso vs Votos Prometidos
                        </p>
                        <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                          {votesAchieved.toLocaleString('pt-BR')}/{votesPromised.toLocaleString('pt-BR')}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.min(progressPromised, 100)}%`,
                            backgroundColor: progressPromised >= 100 ? '#10b981' : primaryColor,
                          }}
                        />
                      </div>
                    </div>

                    {/* Barra de Progresso - Votos Esperados */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Progresso vs Votos Esperados
                        </p>
                        <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                          {votesAchieved.toLocaleString('pt-BR')}/{votesExpected.toLocaleString('pt-BR')}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.min(progressExpected, 100)}%`,
                            backgroundColor: getProgressBgColor(progressExpected).includes('green') ? '#10b981' : primaryColor,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                <Users className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Nenhuma lideança adicionada a esta campanha
                </p>
                {canManageCampaign() && (
                  <button
                    onClick={() => navigate(`/campaigns/${campaignId}/edit`)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold inline-flex items-center gap-2"
                  >
                    <Plus className="w-5 h-5" /> Adicionar Lideranças
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Modal de Edição */}
        {editModalOpen && editingManager && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md p-8 border border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
                Editar Lideança
              </h2>
              <form onSubmit={handleEditSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nome
                  </label>
                  <input
                    type="text"
                    value={editingManager.name}
                    disabled
                    className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Votos Prometidos
                  </label>
                  <input
                    type="number"
                    value={editForm.votes_promised}
                    onChange={(e) =>
                      setEditForm(prev => ({ ...prev, votes_promised: parseInt(e.target.value) || 0 }))
                    }
                    className="w-full px-4 py-2 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Votos Esperados
                  </label>
                  <input
                    type="number"
                    value={editForm.votes_expected}
                    onChange={(e) =>
                      setEditForm(prev => ({ ...prev, votes_expected: parseInt(e.target.value) || 0 }))
                    }
                    className="w-full px-4 py-2 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Votos Alcançados
                  </label>
                  <input
                    type="number"
                    value={editForm.votes_achieved}
                    onChange={(e) =>
                      setEditForm(prev => ({ ...prev, votes_achieved: parseInt(e.target.value) || 0 }))
                    }
                    className="w-full px-4 py-2 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setEditModalOpen(false)}
                    className="flex-1 px-4 py-2 rounded-lg bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-white font-semibold hover:bg-gray-400 dark:hover:bg-gray-600 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    Salvar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CampaignLeadersProgress;
