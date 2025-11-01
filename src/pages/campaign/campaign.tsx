import { useEffect, useState } from 'react';
import { X, Palette, Loader2, Edit2, Plus } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import { campaignService } from '../../services/campaignService';
import type { CampaignPayload } from '../../services/campaignService';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

type Campaign = {
    id: number | string;
    name: string;
    description: string;
    logo: string;
    color_primary: string;
    color_secondary: string;
    created_by?: number;
};

const CampaignsPage = () => {
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(false);
    const [imageValid, setImageValid] = useState(true);
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<Campaign | null>(null);
    const [form, setForm] = useState<CampaignPayload>({
        name: '',
        description: '',
        logo: '',
        color_primary: '#000000',
        color_secondary: '#ffffff',
    });

    const fetchCampaigns = async () => {
        try {
            setLoading(true);
            const data = await campaignService.getAll();
            // assume API returns array directly or under data.campaigns
            const list = Array.isArray(data) ? data : data.campaigns || [];
            // filter to campaigns created by current user
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const userId = user?.id ?? user?.ID ?? user?.ID_USER ?? undefined;
            const filtered = userId ? list.filter((c: any) => String(c.created_by) === String(userId)) : list;
            setCampaigns(filtered);
        } catch (err) {
            console.error(err);
            toast.error('Erro ao carregar campanhas');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCampaigns();
    }, []);

    const openCreate = () => {
        setEditing(null);
        setForm({ name: '', description: '', logo: '', color_primary: '#FCAF15', color_secondary: '#0833AF' });
        setFormOpen(true);
    };

    const openEdit = (c: Campaign) => {
        setEditing(c);
        setForm({
            name: c.name,
            description: c.description,
            logo: c.logo,
            color_primary: c.color_primary || '#FCAF15',
            color_secondary: c.color_secondary || '#0833AF',
        });
        setFormOpen(true);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!imageValid) {
            toast.error("A imagem selecionada não está nas dimensões ou proporções corretas!");
            return;
        }

        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const created_by = user?.id || user?.ID || undefined;

            const payload: CampaignPayload = { ...form, created_by };

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
            console.error(err);
            toast.error('Erro ao salvar campanha');
        }
    };


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
                                {campaigns.map(c => (
                                    <div
                                        key={c.id}
                                        className="group rounded-xl shadow-lg bg-white dark:bg-gray-800 pt-14 pb-6 px-6 transition hover:shadow-xl hover:-translate-y-1 border border-gray-100 dark:border-gray-700 relative"
                                    >
                                        <button
                                            onClick={() => openEdit(c)}
                                            className="absolute top-3 right-4 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-yellow-500 hover:bg-yellow-600 text-white font-semibold shadow transition z-10"
                                            title="Editar campanha"
                                        >
                                            <Edit2 className="w-4 h-4" /> Editar
                                        </button>
                                        <div className="flex flex-col sm:flex-row gap-6 h-full items-stretch">
                                            <div className="relative flex-shrink-0 w-full sm:w-[140px] h-40 sm:h-full">
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
                                                    className="text-xl font-bold text-gray-900 dark:text-white mb-2 break-words truncate"
                                                    title={c.name}
                                                >
                                                    {c.name}
                                                </h3>
                                                <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3 mb-4 flex-grow overflow-hidden">
                                                    {c.description}
                                                </p>
                                                <div className="flex gap-3 items-center flex-wrap">
                                                    <div className="rounded-lg border border-gray-200 dark:border-gray-700 flex items-center">
                                                        <div className="w-10 h-10 rounded-l-lg" style={{ backgroundColor: c.color_primary || '#FCAF15' }} />
                                                        <div className="w-10 h-10 rounded-r-lg" style={{ backgroundColor: c.color_secondary || '#0833AF' }} />
                                                    </div>
                                                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300 whitespace-nowrap">
                                                        Cores da campanha
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                ))}
                            </div>
                        )}
                    </section>

                    {/* Modal de criação/edição profissional */}
                    {formOpen && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fadeIn">
                            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-xl p-8 relative border border-gray-200 dark:border-gray-700">
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
                                            <div className="flex gap-2 items-center">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (!file) return;

                                                        const img = new Image();
                                                        img.src = URL.createObjectURL(file);

                                                        img.onload = () => {
                                                            const minWidth = 1200;  // largura mínima
                                                            const minHeight = 400;  // altura mínima
                                                            const ratio = 3 / 1;    // proporção desejada (3:1)

                                                            const actualRatio = img.width / img.height;

                                                            if (
                                                                img.width < minWidth ||
                                                                img.height < minHeight ||
                                                                Math.abs(actualRatio - ratio) > 0.01 // tolerância de proporção
                                                            ) {
                                                                toast.error(
                                                                    `Imagem inválida! Deve ter no mínimo ${minWidth}x${minHeight}px e proporção 3:1`
                                                                );
                                                                setForm(prev => ({ ...prev, logo: '' }));
                                                                setImageValid(false);
                                                            } else {
                                                                setForm(prev => ({ ...prev, logo: file }));
                                                                setImageValid(true);
                                                            }
                                                        };
                                                    }}
                                                    className="w-full text-sm text-gray-700 dark:text-gray-200"
                                                    required={!editing}
                                                />



                                                {form.logo && (
                                                    <img
                                                        src={form.logo instanceof File ? URL.createObjectURL(form.logo) : form.logo}
                                                        alt="Preview"
                                                        className="w-12 h-12 object-cover rounded border border-gray-200 dark:border-gray-700 shadow"
                                                    />
                                                )}
                                            </div>
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
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Cores da campanha</label>
                                            <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                                                <div className="space-y-2">
                                                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">Primária</label>
                                                    <input
                                                        name="color_primary"
                                                        type="color"
                                                        value={form.color_primary}
                                                        onChange={handleChange}
                                                        className="w-16 h-16 rounded-lg border border-gray-300 dark:border-gray-700 cursor-pointer"
                                                    />
                                                    <div className="text-xs font-medium text-gray-600 dark:text-gray-400 text-center mt-1">
                                                        {form.color_primary.toUpperCase()}
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">Secundária</label>
                                                    <input
                                                        name="color_secondary"
                                                        type="color"
                                                        value={form.color_secondary}
                                                        onChange={handleChange}
                                                        className="w-16 h-16 rounded-lg border border-gray-300 dark:border-gray-700 cursor-pointer"
                                                    />
                                                    <div className="text-xs font-medium text-gray-600 dark:text-gray-400 text-center mt-1">
                                                        {form.color_secondary.toUpperCase()}
                                                    </div>
                                                </div>
                                                <div className="flex-1 flex items-center justify-center">
                                                    <div className="rounded-lg border border-gray-200 dark:border-gray-700 flex items-center overflow-hidden">
                                                        <div className="w-20 h-20" style={{ backgroundColor: form.color_primary }} />
                                                        <div className="w-20 h-20" style={{ backgroundColor: form.color_secondary }} />
                                                    </div>
                                                </div>
                                            </div>
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
                                            className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold shadow transition"
                                        >
                                            Salvar
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
