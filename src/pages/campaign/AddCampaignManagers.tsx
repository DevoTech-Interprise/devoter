import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Plus, Loader2, AlertCircle, X, RefreshCw } from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import Sidebar from '../../components/Sidebar';
import { useTheme } from '../../context/ThemeContext';
import { useCampaignColor } from '../../hooks/useCampaignColor';
import { campaignService } from '../../services/campaignService';
import type { Campaign } from '../../services/campaignService';
import { userService } from '../../services/userService';
import type { User } from '../../services/userService';
import { networkService } from '../../services/networkService';
import { useUser } from '../../context/UserContext';

interface CampaignManager {
  id: string | number;
  campaign_id: string | number;
  user_id: string | number;
  votes_promised: number;
  votes_expected: number;
  votes_achieved: number;
  created_at: string;
  name: string;
  email: string;
  phone: string;
}

const AddCampaignManagers = () => {
  const { campaignId } = useParams<{ campaignId: string }>();
  const navigate = useNavigate();
  const { user } = useUser();
  const { darkMode } = useTheme();
  const { primaryColor } = useCampaignColor();

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [managers, setManagers] = useState<CampaignManager[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [syncingVotes, setSyncingVotes] = useState<string | number | null>(null);

  const [form, setForm] = useState({
    user_id: '',
    votes_promised: 0,
    votes_expected: 0,
  });

  // Verificar permissão
  const canManageCampaign = () => {
    if (!campaign) return false;
    const isSuperUser = user?.role === 'super';
    const isCreator = String(campaign.created_by) === String(user?.id);
    return isSuperUser || isCreator;
  };

  // Função para sincronizar votos alcançados baseado na rede
  const syncManagerVotes = async (manager: CampaignManager) => {
    try {
      setSyncingVotes(manager.id);
      
      // Buscar a rede de convidados desse manager
      const networkTree = await networkService.getNetworkTree(manager.user_id);
      
      // Contar quantas pessoas foram convidadas
      const votesAchieved = networkService.countNetworkMembers(networkTree);
      
      // Atualizar os votos alcançados na API
      await campaignService.updateCampaignManagerVotes(manager.id, votesAchieved);
      
      toast.success(`Votos sincronizados! ${votesAchieved} pessoas convidadas.`);
      
      // Recarregar os dados
      await fetchData();
    } catch (err) {
      console.error('Erro ao sincronizar votos:', err);
      toast.error('Erro ao sincronizar votos');
    } finally {
      setSyncingVotes(null);
    }
  };

  const fetchData = async () => {
    if (!campaignId) return;

    try {
      setLoading(true);
      
      // Buscar campanha
      const campaignData = await campaignService.getById(campaignId);
      setCampaign(campaignData);

      // Buscar managers da campanha
      const campaignManagersData = await campaignService.getCampaignManagers(campaignId);
      const managersData = campaignManagersData.managers || [];
      setManagers(managersData);

      // Buscar todos os usuários e filtrar aqueles que são "police_leader" ou "manager" e não estão já associados
      const allUsers = await userService.getAll();
      const availableLideranças = allUsers.filter(
        (u: User) => (u.role === 'police_leader' || u.role === 'manager') && !managersData.find((m: { user_id: any; }) => String(m.user_id) === String(u.id))
      );
      setAvailableUsers(availableLideranças);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [campaignId]);

  const handleAddManager = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.user_id || form.votes_promised <= 0 || form.votes_expected <= 0) {
      toast.error('Preencha todos os campos corretamente');
      return;
    }

    try {
      setSubmitting(true);
      await campaignService.addCampaignManager(
        campaignId!,
        form.user_id,
        form.votes_promised,
        form.votes_expected
      );

      toast.success('Lideança adicionada com sucesso');
      setForm({ user_id: '', votes_promised: 0, votes_expected: 0 });
      setOpenModal(false);
      await fetchData();
    } catch (err) {
      console.error('Erro ao adicionar manager:', err);
      toast.error('Erro ao adicionar lideança');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveManager = async (managerId: string | number) => {
    if (!confirm('Tem certeza que deseja remover esta lideança?')) return;

    try {
      await campaignService.removeCampaignManager(managerId);
      toast.success('Lideança removida com sucesso');
      await fetchData();
    } catch (err) {
      console.error('Erro ao remover manager:', err);
      toast.error('Erro ao remover lideança');
    }
  };

  if (loading) {
    return (
      <div className={`flex h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-300">Carregando dados...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className={`flex h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-300 mb-4">Campanha não encontrada</p>
            <button
              onClick={() => navigate('/campanhas')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              Voltar para campanhas
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!canManageCampaign()) {
    return (
      <div className={`flex h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-300 mb-4">Você não tem permissão para gerenciar esta campanha</p>
            <button
              onClick={() => navigate('/campanhas')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              Voltar para campanhas
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
      <Sidebar />
      <div className="flex-1 overflow-auto p-8">
        <ToastContainer position="top-right" />

        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => navigate(`/campanhas/${campaignId}/lideranças`)}
              className="flex items-center gap-2 mb-6 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition"
            >
              <ArrowLeft className="w-5 h-5" />
              Voltar ao progresso
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
                  <p className="text-gray-600 dark:text-gray-300">
                    Gerenciar Lideranças
                  </p>
                </div>
              </div>
              <button
                onClick={() => setOpenModal(true)}
                style={{ backgroundColor: primaryColor }}
                className="flex items-center gap-2 px-5 py-2 rounded-lg hover:opacity-90 text-white font-semibold shadow transition"
              >
                <Plus className="w-5 h-5" /> Adicionar Lideança
              </button>
            </div>
          </div>

          {/* Lista de Managers */}
          <div className="space-y-4">
            {managers && managers.length > 0 ? (
              managers.map((manager) => (
                <div
                  key={manager.id}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        {manager.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {manager.email} • {manager.phone}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => syncManagerVotes(manager)}
                        disabled={syncingVotes === manager.id}
                        className="px-3 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-semibold shadow transition disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Sincronizar votos baseado na rede"
                      >
                        {syncingVotes === manager.id ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <RefreshCw className="w-5 h-5" />
                        )}
                      </button>
                      <button
                        onClick={() => handleRemoveManager(manager.id)}
                        className="px-3 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-semibold shadow transition"
                        title="Remover lideança"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase mb-2">
                        Votos Prometidos
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {manager.votes_promised}
                      </p>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase mb-2">
                        Votos Esperados
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {manager.votes_expected}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                <Users className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Nenhuma lideança adicionada
                </p>
                <button
                  onClick={() => setOpenModal(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold inline-flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" /> Adicionar Primeira Lideração
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Modal para adicionar manager */}
        {openModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md p-8 border border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Adicionar Lideança
                </h2>
                <button
                  onClick={() => setOpenModal(false)}
                  className="text-gray-400 hover:text-red-500 transition"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleAddManager} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Selecione a Lideança
                  </label>
                  <select
                    value={form.user_id}
                    onChange={(e) => setForm(prev => ({ ...prev, user_id: e.target.value }))}
                    className="w-full px-4 py-2 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">-- Selecione uma lideança --</option>
                    {availableUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.email})
                      </option>
                    ))}
                  </select>
                  {availableUsers.length === 0 && (
                    <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-lg">
                      <p className="text-sm text-yellow-800 dark:text-yellow-300 mb-2">
                        <strong>ℹ️ Nenhum gerente disponível</strong>
                      </p>
                      <p className="text-xs text-yellow-700 dark:text-yellow-400">
                        Para adicionar uma liderança a esta campanha, você primeiro precisa designar um usuário como "Gerente" em
                        <button 
                          onClick={() => navigate('/usuarios')}
                          className="ml-1 underline hover:no-underline font-semibold"
                        >
                          Gerenciar Usuários
                        </button>
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Votos Prometidos
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={form.votes_promised}
                    onChange={(e) =>
                      setForm(prev => ({ ...prev, votes_promised: parseInt(e.target.value) || 0 }))
                    }
                    className="w-full px-4 py-2 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="Ex: 300"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Votos Esperados
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={form.votes_expected}
                    onChange={(e) =>
                      setForm(prev => ({ ...prev, votes_expected: parseInt(e.target.value) || 0 }))
                    }
                    className="w-full px-4 py-2 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="Ex: 500"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setOpenModal(false)}
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
                    Adicionar
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

export default AddCampaignManagers;
