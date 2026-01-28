import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Palette, Loader2, Edit2, Plus, Trash2, Users, Building2, Filter, TrendingUp } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import { campaignService } from '../../services/campaignService';
import { userService } from '../../services/userService';
import type { CampaignPayload, Campaign } from '../../services/campaignService';
import type { User } from '../../services/userService';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useUser } from '../../context/UserContext';
import { useTheme } from '../../context/ThemeContext';
import { useCampaignColor } from '../../hooks/useCampaignColor';

type FormData = {
    name: string;
    description: string;
    logo: File | string;
    color_primary: string;
    color_secondary: string;
    link_youtube: string;
};

// Interface para agrupar campanhas por criador
interface CampaignsByCreator {
    creator: User;
    campaigns: Campaign[];
}

const CampaignsPage = () => {
    const { user, updateCampaign, refreshUser } = useUser();
    const { darkMode } = useTheme();
    const { primaryColor } = useCampaignColor();
    const navigate = useNavigate();
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [campaignsByCreator, setCampaignsByCreator] = useState<CampaignsByCreator[]>([]);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [imageValid, setImageValid] = useState(true);
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<Campaign | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [deleting, setDeleting] = useState<string | number | null>(null);
    const [activeCampaignId, setActiveCampaignId] = useState<string | number | null>(user?.campaign_id || null);
    const [form, setForm] = useState<FormData>({
        name: '',
        description: '',
        logo: '',
        color_primary: '#FCAF15',
        color_secondary: '#0833AF',
        link_youtube: '',
    });
    const [logoPreview, setLogoPreview] = useState<string>('');
    const [creatorFilter, setCreatorFilter] = useState<string>('all');

    const isSuperUser = user?.role === 'super';

    // Função para verificar se o usuário pode ativar uma campanha
    const canActivateCampaign = (campaign: Campaign): boolean => {
        // SUPER USER só pode ativar campanhas que ele mesmo criou
        if (isSuperUser) {
            return campaign.created_by.toString() === user?.id;
        }
        // Usuários normais podem ativar suas próprias campanhas
        return campaign.created_by.toString() === user?.id;
    };

    // Função para verificar se o usuário pode editar uma campanha
    const canEditCampaign = (campaign: Campaign): boolean => {
        // SUPER USER pode editar qualquer campanha
        if (isSuperUser) {
            return true;
        }
        // Usuários normais só podem editar suas próprias campanhas
        return campaign.created_by.toString() === user?.id;
    };

    // Função para verificar se o usuário pode excluir uma campanha
    const canDeleteCampaign = (campaign: Campaign): boolean => {
        // SUPER USER pode excluir qualquer campanha
        if (isSuperUser) {
            return true;
        }
        // Usuários normais só podem excluir suas próprias campanhas
        return campaign.created_by.toString() === user?.id;
    };

    // Função para agrupar campanhas por criador
    const groupCampaignsByCreator = (campaignsList: Campaign[]): CampaignsByCreator[] => {
        const creatorsMap = new Map<string, CampaignsByCreator>();

        campaignsList.forEach(campaign => {
            const creatorId = campaign.created_by.toString();

            if (!creatorsMap.has(creatorId)) {
                const creator = allUsers.find(u => u.id === creatorId) || {
                    id: creatorId,
                    name: 'Usuário Desconhecido',
                    email: 'N/A',
                    role: 'user'
                } as User;

                creatorsMap.set(creatorId, {
                    creator,
                    campaigns: []
                });
            }

            creatorsMap.get(creatorId)!.campaigns.push(campaign);
        });

        return Array.from(creatorsMap.values());
    };

    const fetchCampaigns = async () => {
        try {
            setLoading(true);
            let data: Campaign[];

            // 🔹 SUPER USER: Carrega TODAS as campanhas do sistema
            if (isSuperUser) {
                console.log('👑 SUPER USER: Carregando TODAS as campanhas do sistema');
                data = await campaignService.getAll();
            } else {
                // 🔹 Usuário normal: carrega apenas suas próprias campanhas
                const userCampaigns = await campaignService.getAll();
                const userId = user?.id;
                data = userId ? userCampaigns.filter((c: Campaign) => String(c.created_by) === String(userId)) : [];
            }

            setCampaigns(data);
            setActiveCampaignId(user?.campaign_id || null);

            // Se for SUPER USER, agrupa campanhas por criador
            if (isSuperUser) {
                await userService.getAll().then(data => setAllUsers(data));
                const grouped = groupCampaignsByCreator(data);
                setCampaignsByCreator(grouped);
            }
        } catch (err) {
            console.error(err);
            toast.error('Erro ao carregar campanhas');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCampaigns();
    }, [user]);

    useEffect(() => {
        setActiveCampaignId(user?.campaign_id || null);
    }, [user?.campaign_id]);

    // Efeito para reagrupar campanhas quando allUsers for carregado (para SUPER USER)
    useEffect(() => {
        if (isSuperUser && campaigns.length > 0 && allUsers.length > 0) {
            const grouped = groupCampaignsByCreator(campaigns);
            setCampaignsByCreator(grouped);
        }
    }, [campaigns, allUsers, isSuperUser]);

    const openCreate = () => {
        setEditing(null);
        setForm({
            name: '',
            description: '',
            logo: '',
            color_primary: '#FCAF15',
            color_secondary: '#0833AF',
            link_youtube: '',
        });
        setLogoPreview('');
        setFormOpen(true);
    };

    const openEdit = async (c: Campaign) => {
        // Verificar permissão antes de abrir edição
        if (!canEditCampaign(c)) {
            toast.error('Você não tem permissão para editar esta campanha');
            return;
        }

        setEditing(c);
        setForm({
            name: c.name,
            description: c.description,
            logo: c.logo,
            color_primary: c.color_primary || '#FCAF15',
            color_secondary: c.color_secondary || '#0833AF',
            link_youtube: c.link_youtube || '',
        });
        setLogoPreview(c.logo);
        setFormOpen(true);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const img = new Image();
        img.src = URL.createObjectURL(file);
        img.onload = () => {
            const minWidth = 1000;
            const minHeight = 400;
            if (img.width < minWidth || img.height < minHeight) {
                toast.error(`Imagem inválida! Deve ter no mínimo ${minWidth}x${minHeight}px`);
                setForm(prev => ({ ...prev, logo: '' }));
                setLogoPreview('');
                setImageValid(false);
            } else {
                setForm(prev => ({ ...prev, logo: file }));
                setLogoPreview(URL.createObjectURL(file));
                setImageValid(true);
            }
        };
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!imageValid) {
            toast.error("A imagem selecionada não está nas dimensões corretas!");
            return;
        }

        try {
            setSubmitting(true);
            const userId = user?.id;

            const payload: CampaignPayload = {
                name: form.name,
                description: form.description,
                color_primary: form.color_primary,
                color_secondary: form.color_secondary,
                created_by: userId?.toString(),
                logo: form.logo instanceof File ? form.logo : form.logo || undefined,
                link_youtube: form.link_youtube
            };

            if (editing) {
                await campaignService.update(editing.id, payload);
                toast.success('Campanha atualizada com sucesso');
            } else {
                await campaignService.create(payload);
                toast.success('Campanha criada com sucesso');
            }

            setFormOpen(false);
            fetchCampaigns();
        } catch (err) {
            console.error('Erro ao salvar campanha:', err);
            toast.error('Erro ao salvar campanha');
        } finally {
            setSubmitting(false);
        }
    };

    const handleSetActive = async (campaignId: string | number, campaign: Campaign) => {
        // Verificar permissão antes de ativar
        if (!canActivateCampaign(campaign)) {
            toast.error('Você só pode ativar campanhas que você criou');
            return;
        }

        try {
            const campaignIdStr = String(campaignId);
            await updateCampaign(campaignIdStr);
            setActiveCampaignId(campaignId);
            toast.success('Campanha ativada com sucesso');
            await refreshUser();
        } catch (err) {
            console.error(err);
            toast.error('Erro ao ativar campanha');
        }
    };

    const handleDelete = async (campaignId: string | number, campaign: Campaign) => {
        // Verificar permissão antes de excluir
        if (!canDeleteCampaign(campaign)) {
            toast.error('Você não tem permissão para excluir esta campanha');
            return;
        }

        if (!confirm('Tem certeza que deseja excluir esta campanha? Esta ação não pode ser desfeita.')) {
            return;
        }

        try {
            setDeleting(campaignId);
            await campaignService.delete(campaignId);
            toast.success('Campanha excluída com sucesso');

            if (activeCampaignId === campaignId) {
                await updateCampaign(null);
                setActiveCampaignId(null);
                await refreshUser();
            }

            fetchCampaigns();
        } catch (err) {
            console.error(err);
            toast.error('Erro ao excluir campanha');
        } finally {
            setDeleting(null);
        }
    };

    // Funções auxiliares para textos dinâmicos
    const getHeaderDescription = () => {
        if (isSuperUser) {
            return 'Visualize TODAS as campanhas do sistema. Você só pode ativar campanhas que você criou.';
        } else {
            return 'Gerencie suas campanhas: criar, editar e visualizar.';
        }
    };

    // Filtrar campanhas por criador (para SUPER USER)
    const getFilteredCampaignsByCreator = () => {
        if (creatorFilter === 'all') {
            return campaignsByCreator;
        }
        return campaignsByCreator.filter(group => group.creator.id === creatorFilter);
    };

    useEffect(() => {
        const handleCampaignChange = (event: CustomEvent) => {
            setActiveCampaignId(event.detail.campaignId);
        };

        window.addEventListener('campaignChanged', handleCampaignChange as EventListener);

        return () => {
            window.removeEventListener('campaignChanged', handleCampaignChange as EventListener);
        };
    }, []);

    useEffect(() => {
        if (!formOpen && logoPreview.startsWith('blob:')) {
            URL.revokeObjectURL(logoPreview);
        }
    }, [formOpen, logoPreview]);

    // Componente para renderizar uma campanha individual
    const renderCampaignCard = (c: Campaign) => {
        const userCanActivate = canActivateCampaign(c);
        const userCanEdit = canEditCampaign(c);
        const userCanDelete = canDeleteCampaign(c);
        const isUserCreator = c.created_by.toString() === user?.id;

        return (
            <div
                key={c.id}
                className="group rounded-xl shadow-lg bg-white dark:bg-gray-800 pt-14 pb-6 px-6 transition hover:shadow-xl hover:-translate-y-1 border border-gray-100 dark:border-gray-700 relative"
            >
                <div className="absolute top-3 right-4 flex gap-2 z-10">
                    {userCanEdit && (
                        <button
                            onClick={() => openEdit(c)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-yellow-500 hover:bg-yellow-600 text-white font-semibold shadow transition"
                            title="Editar campanha"
                        >
                            <Edit2 className="w-4 h-4" />
                        </button>
                    )}
                    {userCanDelete && (
                        <button
                            onClick={() => handleDelete(c.id, c)}
                            disabled={deleting === c.id}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white font-semibold shadow transition disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Excluir campanha"
                        >
                            {deleting === c.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Trash2 className="w-4 h-4" />
                            )}
                        </button>
                    )}
                </div>
                <div className="flex flex-col sm:flex-row gap-6 h-full items-stretch">
                    <div className="relative shrink-0 w-full sm:w-[140px] h-40 sm:h-full">
                        <img
                            src={c.logo}
                            alt={c.name}
                            className="object-cover rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm w-full h-full"
                        />
                        <span className="absolute -top-1 -right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded shadow">
                            Logo
                        </span>
                    </div>
                    <div className="flex-1 flex flex-col min-w-0 h-full">
                        <h3
                            className="text-xl font-bold text-gray-900 dark:text-white mb-2 wrap-break-word truncate"
                            title={c.name}
                        >
                            {c.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3 mb-4 grow overflow-hidden">
                            {c.description}
                        </p>

                        {/* Informação do criador (apenas para SUPER USER) */}
                        {isSuperUser && (
                            <div className="mb-3 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <Users className="w-3 h-3 text-gray-500" />
                                    <span className="text-xs text-gray-600 dark:text-gray-300">
                                        Criador: {allUsers.find(u => u.id === c.created_by.toString())?.name || 'N/A'}
                                        {isUserCreator && (
                                            <span className="ml-1 text-green-600 font-medium">(Você)</span>
                                        )}
                                    </span>
                                </div>
                            </div>
                        )}

                        <div className="flex gap-3 items-center flex-wrap mb-4">
                            <div className="rounded-lg border border-gray-200 dark:border-gray-700 flex items-center">
                                <div className="w-10 h-10 rounded-l-lg" style={{ backgroundColor: c.color_primary || '#FCAF15' }} />
                                <div className="w-10 h-10 rounded-r-lg" style={{ backgroundColor: c.color_secondary || '#0833AF' }} />
                            </div>
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-300 whitespace-nowrap">
                                Cores da campanha
                            </span>
                        </div>

                        <div className="flex gap-2 flex-wrap mb-4">
                            {/* Botão para visualizar progresso das lideranças */}
                            {(userCanActivate || isUserCreator) && (
                                <button
                                    onClick={() => navigate(`/campanhas/${c.id}/lideranças`)}
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold shadow transition"
                                    title="Ver progresso das lideranças"
                                >
                                    <TrendingUp className="w-4 h-4" />
                                    Lideranças
                                </button>
                            )}
                        </div>

                        {/* Botão de ativar/desativar */}
                        {userCanActivate ? (
                            <button
                                onClick={() => handleSetActive(c.id, c)}
                                className={`mt-3 px-4 py-2 rounded-lg font-semibold shadow transition ${activeCampaignId === c.id
                                    ? 'bg-green-600 hover:bg-green-700 text-white'
                                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                                    }`}
                            >
                                {activeCampaignId === c.id ? 'Ativo' : 'Ativar'}
                            </button>
                        ) : (
                            <div className="mt-3 px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-center font-semibold cursor-not-allowed">
                                {activeCampaignId === c.id ? 'Ativo' : 'Somente o criador pode ativar'}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className={`flex h-screen ${darkMode ? "bg-gray-900" : "bg-gray-100"}`}>
            <Sidebar />
            <div className="flex-1 overflow-auto p-8">
                <ToastContainer position="top-right" />
                <div className="max-w-5xl mx-auto">
                    <header className="flex pt-7 flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
                        <div className="flex flex-col">
                            <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                <Palette className="w-7 h-7" style={{ color: primaryColor }} />
                                Campanhas
                                {isSuperUser && (
                                    <span className="ml-2 text-sm bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 px-2 py-1 rounded-full">
                                        SUPER USER
                                    </span>
                                )}
                            </h1>
                            <p className="mt-2 text-gray-600 dark:text-gray-300">
                                {getHeaderDescription()}
                            </p>
                        </div>
                        <button
                            onClick={openCreate}
                            style={{ backgroundColor: primaryColor }}
                            className="flex items-center gap-2 px-5 py-2 rounded-lg hover:opacity-90 text-white font-semibold shadow transition"
                        >
                            <Plus className="w-5 h-5" /> Nova Campanha
                        </button>
                    </header>

                    {/* Filtro por criador (apenas para SUPER USER) */}
                    {isSuperUser && campaignsByCreator.length > 0 && (
                        <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center gap-3 mb-3">
                                <Filter className="w-5 h-5" style={{ color: primaryColor }} />
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Filtrar por Criador:
                                </label>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => setCreatorFilter('all')}
                                    style={creatorFilter === 'all' ? {
                                        backgroundColor: `${primaryColor}20`,
                                        borderColor: primaryColor,
                                        color: primaryColor
                                    } : {}}
                                    className={`px-4 py-2 rounded-lg border transition-all ${
                                        creatorFilter === 'all'
                                            ? 'shadow-md font-medium'
                                            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
                                    }`}
                                >
                                    Todos os Criadores
                                </button>
                                {campaignsByCreator.map(group => (
                                    <button
                                        key={group.creator.id}
                                        onClick={() => setCreatorFilter(group.creator.id)}
                                        style={creatorFilter === group.creator.id ? {
                                            backgroundColor: `${primaryColor}20`,
                                            borderColor: primaryColor,
                                            color: primaryColor
                                        } : {}}
                                        className={`px-4 py-2 rounded-lg border transition-all ${
                                            creatorFilter === group.creator.id
                                                ? 'shadow-md font-medium'
                                                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
                                        }`}
                                    >
                                        {group.creator.name}
                                        {group.creator.id === user?.id && (
                                            <span className="ml-1 text-xs bg-green-100 text-green-800 px-1 rounded">Você</span>
                                        )}
                                        <span className="ml-2 text-xs bg-gray-200 dark:bg-gray-600 px-1 rounded">
                                            {group.campaigns.length}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <section>
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                                <span className="ml-3 text-gray-600 dark:text-gray-300">Carregando campanhas...</span>
                            </div>
                        ) : isSuperUser ? (
                            // 🔹 VISUALIZAÇÃO SUPER USER: Campanhas agrupadas por criador
                            <div className="space-y-8">
                                {getFilteredCampaignsByCreator().map(group => (
                                    <div key={group.creator.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                                        {/* Header do grupo de criador */}
                                        <div className="bg-linear-to-r from-blue-500 to-purple-600 p-6 text-white">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                                                    <Users className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <h3 className="text-xl font-bold">
                                                        {group.creator.name}
                                                        {group.creator.id === user?.id && (
                                                            <span className="ml-2 text-sm bg-green-500 text-white px-2 py-1 rounded-full">Você</span>
                                                        )}
                                                    </h3>
                                                    <p className="text-sm opacity-90">
                                                        {group.creator.email} • {group.creator.role}
                                                    </p>
                                                    <p className="text-xs opacity-80 mt-1">
                                                        {group.campaigns.length} campanha(s) criada(s)
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Campanhas do criador */}
                                        <div className="p-6">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                                {group.campaigns.map(campaign => renderCampaignCard(campaign))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            // 🔹 VISUALIZAÇÃO USUÁRIO NORMAL: Grid simples de campanhas
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                {campaigns.map(c => renderCampaignCard(c))}
                            </div>
                        )}

                        {/* Mensagem quando não há campanhas */}
                        {campaigns.length === 0 && !loading && (
                            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                                <Building2 className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                                <p className="text-gray-500 dark:text-gray-400">
                                    {isSuperUser
                                        ? 'Nenhuma campanha encontrada no sistema.'
                                        : 'Você ainda não criou nenhuma campanha.'
                                    }
                                </p>
                                {!isSuperUser && (
                                    <button
                                        onClick={openCreate}
                                        className="mt-4 flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow transition mx-auto"
                                    >
                                        <Plus className="w-5 h-5" /> Criar Primeira Campanha
                                    </button>
                                )}
                            </div>
                        )}
                    </section>

                    {/* Modal criação/edição (mantido igual) */}
                    {formOpen && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fadeIn">
                            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl p-8 relative border border-gray-200 dark:border-gray-700 max-h-[90vh] overflow-y-auto">
                                <button
                                    className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition"
                                    onClick={() => setFormOpen(false)}
                                    title="Fechar"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                                <h2
                                    className="text-2xl font-bold mb-6 flex items-center gap-2"
                                    style={{ color: editing ? '#eab308' : '#2563eb' }}
                                >
                                    {editing ? <Edit2 className="w-5 h-5 text-yellow-500" /> : <Plus className="w-5 h-5 text-blue-600" />}
                                    <span className="dark:text-white text-gray-900">{editing ? 'Editar Campanha' : 'Nova Campanha'}</span>
                                </h2>
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Nome</label>
                                            <input
                                                name="name"
                                                value={form.name}
                                                onChange={handleChange}
                                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 text-gray-900 dark:text-white"
                                                placeholder="Nome da campanha"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                                                Logo (Imagem)
                                            </label>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleFileChange}
                                                className="w-full text-sm text-gray-700 dark:text-gray-200"
                                                required={!editing}
                                            />
                                            {(logoPreview || (editing && typeof form.logo === 'string')) && (
                                                <img
                                                    src={logoPreview || (typeof form.logo === 'string' ? form.logo : '')}
                                                    alt="Preview"
                                                    className="w-12 h-12 object-cover rounded border border-gray-200 dark:border-gray-700 shadow mt-2"
                                                />
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Descrição</label>
                                        <textarea
                                            name="description"
                                            value={form.description}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 text-gray-900 dark:text-white"
                                            placeholder="Descrição da campanha"
                                            rows={3}
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Link do YouTube</label>
                                        <input
                                            name="link_youtube"
                                            value={form.link_youtube}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 text-gray-900 dark:text-white"
                                            placeholder="https://www.youtube.com/watch?v=..."
                                            type="url"
                                        />
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            Cole o link completo do vídeo do YouTube da campanha
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                                                Cor Primária
                                            </label>
                                            <input
                                                type="color"
                                                name="color_primary"
                                                value={form.color_primary}
                                                onChange={handleChange}
                                                className="w-full h-12 rounded-lg border border-gray-300 dark:border-gray-700 cursor-pointer"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                                                Cor Secundária
                                            </label>
                                            <input
                                                type="color"
                                                name="color_secondary"
                                                value={form.color_secondary}
                                                onChange={handleChange}
                                                className="w-full h-12 rounded-lg border border-gray-300 dark:border-gray-700 cursor-pointer"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex justify-end gap-3 mt-6">
                                        <button
                                            type="button"
                                            onClick={() => setFormOpen(false)}
                                            className="px-5 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 font-semibold transition"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={submitting}
                                            className={`px-6 py-2 rounded-lg font-bold shadow transition flex items-center justify-center gap-2 ${submitting
                                                ? 'bg-blue-400 cursor-not-allowed'
                                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                                                }`}
                                        >
                                            {submitting ? (
                                                <>
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                    Salvando...
                                                </>
                                            ) : (
                                                'Salvar'
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CampaignsPage;