import { useEffect, useState } from 'react';
import { X, Palette, Loader2, Edit2, Plus, Trash2, Users } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import { campaignService } from '../../services/campaignService';
import { userService } from '../../services/userService';
import type { CampaignPayload, Campaign } from '../../services/campaignService';
import type { User } from '../../services/userService';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useUser } from '../../context/UserContext';

type FormData = {
    name: string;
    description: string;
    logo: File | string;
    color_primary: string;
    color_secondary: string;
    operator: string; // String única com IDs separados por vírgula
};

const CampaignsPage = () => {
    const { user, updateCampaign, refreshUser } = useUser();
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [availableManagers, setAvailableManagers] = useState<User[]>([]);
    const [allManagers, setAllManagers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingManagers, setLoadingManagers] = useState(false);
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
        operator: '', // String vazia inicialmente
    });
    const [logoPreview, setLogoPreview] = useState<string>('');

    // Função para obter operadores atualmente vinculados à campanha sendo editada
    const getCurrentCampaignOperators = (): User[] => {
        if (!editing || !editing.operator) return [];

        const operatorIds = editing.operator.split(',').filter(id => id.trim() !== '');
        return allManagers.filter(manager =>
            operatorIds.includes(manager.id) &&
            manager.campaign_id === editing.id?.toString()
        );
    };

    // Função para obter operadores vinculados a outras campanhas
    const getOtherCampaignOperators = (): User[] => {
        return allManagers.filter(manager =>
            manager.campaign_id !== null &&
            manager.campaign_id !== editing?.id?.toString()
        );
    };

    // Buscar managers disponíveis (sem campaign_id)
    const fetchAvailableManagers = async () => {
        try {
            setLoadingManagers(true);
            const available = await userService.getAvailableManagers();
            setAvailableManagers(available);

            // Buscar todos os managers para exibir nomes
            const allUsers = await userService.getAll();
            const allManagerUsers = allUsers.filter(user => user.role === 'manager');
            setAllManagers(allManagerUsers);

            // Se estiver editando, carregar operadores atuais da campanha
            if (editing) {
                const currentOperators = await campaignService.getOperators(editing.id);
                console.log('Operadores atuais da campanha:', currentOperators);
            }
        } catch (err) {
            console.error('Erro ao carregar managers:', err);
            toast.error('Erro ao carregar lista de operadores');
        } finally {
            setLoadingManagers(false);
        }
    };

    const fetchCampaigns = async () => {
        try {
            setLoading(true);
            const data = await campaignService.getAll();
            const list = Array.isArray(data) ? data : [];
            const userId = user?.id;
            const filtered = userId ? list.filter((c: Campaign) => String(c.created_by) === String(userId)) : list;
            setCampaigns(filtered);
            setActiveCampaignId(user?.campaign_id || null);
        } catch (err) {
            console.error(err);
            toast.error('Erro ao carregar campanhas');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCampaigns();
        fetchAvailableManagers();
    }, [user]);

    useEffect(() => {
        setActiveCampaignId(user?.campaign_id || null);
    }, [user?.campaign_id]);

    const openCreate = () => {
        setEditing(null);
        setForm({
            name: '',
            description: '',
            logo: '',
            color_primary: '#FCAF15',
            color_secondary: '#0833AF',
            operator: '' // String vazia
        });
        setLogoPreview('');
        setFormOpen(true);
    };

    const openEdit = async (c: Campaign) => {
        setEditing(c);
        setForm({
            name: c.name,
            description: c.description,
            logo: c.logo,
            color_primary: c.color_primary || '#FCAF15',
            color_secondary: c.color_secondary || '#0833AF',
            operator: c.operator || '' // String com IDs separados por vírgula
        });
        setLogoPreview(c.logo);
        setFormOpen(true);

        // Recarregar managers disponíveis ao editar
        await fetchAvailableManagers();
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleOperatorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);

        // Se estiver editando, manter os operadores atuais que não foram desmarcados
        if (editing) {
            const currentOperatorIds = editing.operator ?
                editing.operator.split(',').filter(id => id.trim() !== '') : [];

            // Combinar arrays e remover duplicatas
            const allSelected = [...new Set([...currentOperatorIds, ...selectedOptions])];

            // Filtrar apenas os que ainda estão selecionados
            const finalSelected = allSelected.filter(id =>
                selectedOptions.includes(id) ||
                (currentOperatorIds.includes(id) && selectedOptions.includes(id))
            );

            setForm(prev => ({ ...prev, operator: finalSelected.join(',') }));
        } else {
            // Para criação, usar apenas os selecionados
            setForm(prev => ({ ...prev, operator: selectedOptions.join(',') }));
        }
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

            console.log('=== DEBUG OPERADORES ===');
            console.log('Operadores selecionados:', form.operator);
            console.log('IDs dos operadores:', getSelectedOperatorIds());

            if (editing) {
                console.log('Operadores anteriores:', editing.operator);
                console.log('Mudanças:', {
                    removidos: editing.operator ?
                        editing.operator.split(',').filter(id => !getSelectedOperatorIds().includes(id)) : [],
                    adicionados: getSelectedOperatorIds().filter(id =>
                        !editing.operator?.split(',').includes(id)
                    )
                });
            }

            const payload: CampaignPayload = {
                name: form.name,
                description: form.description,
                color_primary: form.color_primary,
                color_secondary: form.color_secondary,
                created_by: userId?.toString(),
                logo: form.logo instanceof File ? form.logo : form.logo || undefined,
                operator: form.operator
            };

            console.log('Payload enviado:', payload);

            if (editing) {
                await campaignService.update(editing.id, payload);
                toast.success('Campanha atualizada com sucesso');
            } else {
                await campaignService.create(payload);
                toast.success('Campanha criada com sucesso');
            }

            setFormOpen(false);
            fetchCampaigns();
            fetchAvailableManagers();
        } catch (err) {
            console.error('Erro ao salvar campanha:', err);
            toast.error('Erro ao salvar campanha');
        } finally {
            setSubmitting(false);
        }
    };

    const handleSetActive = async (campaignId: string | number) => {
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

    const handleDelete = async (campaignId: string | number) => {
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
            fetchAvailableManagers();
        } catch (err) {
            console.error(err);
            toast.error('Erro ao excluir campanha');
        } finally {
            setDeleting(null);
        }
    };

    // Função para obter nomes dos operadores
    const getOperatorNames = (operatorString: string = '') => {
        if (!operatorString) return [];

        const operatorIds = operatorString.split(',').filter(id => id.trim() !== '');
        return operatorIds.map(operatorId => {
            const manager = allManagers.find(m => m.id === operatorId);
            return manager ? manager.name : 'Operador não encontrado';
        });
    };

    // Função para obter IDs selecionados do form como array
    const getSelectedOperatorIds = () => {
        return form.operator ? form.operator.split(',').filter(id => id.trim() !== '') : [];
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

    return (
        <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
            <Sidebar />
            <div className="flex-1 overflow-auto p-8">
                <ToastContainer position="top-right" />
                <div className="max-w-5xl mx-auto">
                    <header className="flex pt-7 flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
                        <div className="flex flex-col">
                            <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                <Palette className="w-7 h-7 text-blue-600" /> Campanhas
                            </h1>
                            <p className="mt-2 text-gray-600 dark:text-gray-300">
                                Gerencie suas campanhas: criar, editar e visualizar.
                            </p>
                        </div>
                        <button
                            onClick={openCreate}
                            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow transition"
                        >
                            <Plus className="w-5 h-5" /> Nova Campanha
                        </button>
                    </header>

                    <section>
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                                <span className="ml-3 text-gray-600 dark:text-gray-300">Carregando campanhas...</span>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                {campaigns.map(c => {
                                    const operatorNames = getOperatorNames(c.operator);
                                    return (
                                        <div
                                            key={c.id}
                                            className="group rounded-xl shadow-lg bg-white dark:bg-gray-800 pt-14 pb-6 px-6 transition hover:shadow-xl hover:-translate-y-1 border border-gray-100 dark:border-gray-700 relative"
                                        >
                                            <div className="absolute top-3 right-4 flex gap-2 z-10">
                                                <button
                                                    onClick={() => openEdit(c)}
                                                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-yellow-500 hover:bg-yellow-600 text-white font-semibold shadow transition"
                                                    title="Editar campanha"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(c.id)}
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

                                                    {/* Operadores da campanha */}
                                                    <div className="mb-4">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <Users className="w-4 h-4 text-gray-500" />
                                                            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                                                Operadores:
                                                            </span>
                                                        </div>
                                                        {operatorNames.length > 0 ? (
                                                            <div className="flex flex-wrap gap-1">
                                                                {operatorNames.map((operatorName, index) => (
                                                                    <span
                                                                        key={index}
                                                                        className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full"
                                                                    >
                                                                        {operatorName}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                                                Nenhum operador atribuído
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="flex gap-3 items-center flex-wrap mb-4">
                                                        <div className="rounded-lg border border-gray-200 dark:border-gray-700 flex items-center">
                                                            <div className="w-10 h-10 rounded-l-lg" style={{ backgroundColor: c.color_primary || '#FCAF15' }} />
                                                            <div className="w-10 h-10 rounded-r-lg" style={{ backgroundColor: c.color_secondary || '#0833AF' }} />
                                                        </div>
                                                        <span className="text-sm font-medium text-gray-600 dark:text-gray-300 whitespace-nowrap">
                                                            Cores da campanha
                                                        </span>
                                                    </div>
                                                    <button
                                                        onClick={() => handleSetActive(c.id)}
                                                        className={`mt-3 px-4 py-2 rounded-lg font-semibold shadow transition ${activeCampaignId === c.id
                                                            ? 'bg-green-600 hover:bg-green-700 text-white'
                                                            : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200'
                                                            }`}
                                                    >
                                                        {activeCampaignId === c.id ? 'Ativo' : 'Ativar'}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </section>

                    {/* Modal criação/edição */}
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

                                    {/* Seletor de Operadores - Inclui disponíveis e já vinculados */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                                            <Users className="w-4 h-4 inline mr-2" />
                                            Operadores
                                        </label>
                                        {loadingManagers ? (
                                            <div className="flex items-center gap-2 text-gray-500">
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Carregando operadores...
                                            </div>
                                        ) : (
                                            <>
                                                <select
                                                    multiple
                                                    value={getSelectedOperatorIds()}
                                                    onChange={handleOperatorChange}
                                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 text-gray-900 dark:text-white min-h-[120px]"
                                                    size={5}
                                                >
                                                    {/* Operadores disponíveis (sem campanha) */}
                                                    <optgroup label="Operadores Disponíveis">
                                                        {availableManagers.map(manager => (
                                                            <option key={manager.id} value={manager.id}>
                                                                {manager.name} - {manager.email} (Disponível)
                                                            </option>
                                                        ))}
                                                    </optgroup>

                                                    {/* Operadores já vinculados a esta campanha (quando editando) */}
                                                    {editing && (
                                                        <optgroup label="Operadores Vinculados a Esta Campanha">
                                                            {getCurrentCampaignOperators().map(manager => (
                                                                <option key={manager.id} value={manager.id}>
                                                                    {manager.name} - {manager.email} (Vinculado)
                                                                </option>
                                                            ))}
                                                        </optgroup>
                                                    )}

                                                    {/* Operadores vinculados a outras campanhas */}
                                                    <optgroup label="Operadores em Outras Campanhas">
                                                        {getOtherCampaignOperators().map(manager => (
                                                            <option
                                                                key={manager.id}
                                                                value={manager.id}
                                                                disabled={manager.campaign_id !== null && manager.campaign_id !== editing?.id?.toString()}
                                                            >
                                                                {manager.name} - {manager.email}
                                                                {manager.campaign_id && manager.campaign_id !== editing?.id?.toString()
                                                                    ? ` (Em outra campanha)`
                                                                    : ''}
                                                            </option>
                                                        ))}
                                                    </optgroup>
                                                </select>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                    • Mantenha Ctrl (ou Cmd) para selecionar múltiplos<br />
                                                    • Para remover um operador, desmarque-o da lista<br />
                                                    • Operadores em outras campanhas não podem ser selecionados
                                                </p>
                                            </>
                                        )}

                                        {/* Operadores selecionados */}
                                        {getSelectedOperatorIds().length > 0 && (
                                            <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    Operadores selecionados ({getSelectedOperatorIds().length}):
                                                </p>
                                                <div className="flex flex-wrap gap-2">
                                                    {getSelectedOperatorIds().map(operatorId => {
                                                        const manager = allManagers.find(m => m.id === operatorId);
                                                        const isCurrentlyInThisCampaign = editing &&
                                                            getCurrentCampaignOperators().some(m => m.id === operatorId);
                                                        const isAvailable = availableManagers.some(m => m.id === operatorId);

                                                        return manager ? (
                                                            <div
                                                                key={operatorId}
                                                                className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${isCurrentlyInThisCampaign
                                                                    ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 border border-yellow-300'
                                                                    : isAvailable
                                                                        ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border border-green-300'
                                                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-300'
                                                                    }`}
                                                            >
                                                                {manager.name}
                                                                {isCurrentlyInThisCampaign && (
                                                                    <span className="text-xs">(atual)</span>
                                                                )}
                                                                {!isAvailable && !isCurrentlyInThisCampaign && (
                                                                    <span className="text-xs">(outra campanha)</span>
                                                                )}
                                                            </div>
                                                        ) : null;
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        {/* Resumo das ações */}
                                        {editing && (
                                            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 space-y-1">
                                                <p>• <strong>Para adicionar:</strong> Selecione operadores disponíveis</p>
                                                <p>• <strong>Para remover:</strong> Desmarque operadores vinculados</p>
                                                <p>• Operadores removidos ficarão disponíveis para outras campanhas</p>
                                            </div>
                                        )}
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