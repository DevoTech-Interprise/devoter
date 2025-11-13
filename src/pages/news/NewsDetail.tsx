// src/pages/News/NewsDetail.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'react-toastify';
import {
    ArrowLeft,
    Calendar,
    Heart,
    MessageCircle,
    Edit3,
    Trash2,
    Share2,
    Eye,
    Clock,
    Building
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useNews } from '../../pages/hooks/useNews';
import { useUser } from '../../context/UserContext';
import { commentSchema, type CommentFormData } from '../../schemas/news';
import { campaignService, type Campaign } from '../../services/campaignService';
import Sidebar from '../../components/Sidebar';

export const NewsDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { darkMode, colors } = useTheme();
    const { user } = useUser();
    const {
        getNewsById,
        deleteNews,
        canEdit,
        canDelete,
        loading,
        error,
        clearError
    } = useNews();

    const [news, setNews] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isLiking, setIsLiking] = useState(false);
    const [isAddingComment, setIsAddingComment] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [campaign, setCampaign] = useState<Campaign | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        watch
    } = useForm<CommentFormData>({
        resolver: zodResolver(commentSchema)
    });

    const commentText = watch('text');

    // Carregar notícia
    useEffect(() => {
        const loadNews = async () => {
            if (!id) return;

            setIsLoading(true);
            clearError();

            try {
                const newsData = await getNewsById(id);
                
                // Verificar se newsData não é null
                if (!newsData) {
                    toast.error('Notícia não encontrada');
                    navigate('/news');
                    return;
                }

                // Adicionar dados mockados para likes e comentários
                const newsWithMockData = {
                    ...newsData,
                    likes: newsData.likes || Math.floor(Math.random() * 50),
                    liked_by: newsData.liked_by || [],
                    comments: newsData.comments || [
                        {
                            id: '1',
                            user_id: '2',
                            user_name: 'Maria Silva',
                            text: 'Excelente notícia! Muito informativa.',
                            created_at: new Date(Date.now() - 3600000).toISOString()
                        },
                        {
                            id: '2',
                            user_id: '3',
                            user_name: 'João Santos',
                            text: 'Parabéns pela iniciativa!',
                            created_at: new Date(Date.now() - 7200000).toISOString()
                        }
                    ]
                };
                setNews(newsWithMockData);

                // Carregar informações da campanha se existir
                if (newsData.campaign_id) {
                    loadCampaignInfo(String(newsData.campaign_id)); // Convertendo para string
                }
            } catch (err: any) {
                console.error('Erro ao carregar notícia:', err);
                toast.error(err.message || 'Erro ao carregar notícia');
                navigate('/news');
            } finally {
                setIsLoading(false);
            }
        };

        const loadCampaignInfo = async (campaignId: string) => {
            try {
                const campaignData = await campaignService.getById(campaignId);
                setCampaign(campaignData);
            } catch (error) {
                console.error('Erro ao carregar campanha:', error);
            }
        };

        loadNews();
    }, [id, navigate]);

    // Limpar erro quando o componente desmontar
    useEffect(() => {
        return () => {
            clearError();
        };
    }, [clearError]);

    // Mock da função de like
    const handleLike = async () => {
        if (!user) {
            toast.error('Faça login para curtir notícias');
            return;
        }

        if (!news) return;

        setIsLiking(true);
        try {
            // Simular delay de API
            await new Promise(resolve => setTimeout(resolve, 300));
            
            const isCurrentlyLiked = news.liked_by?.includes(user.id);
            let newLikes = news.likes || 0;
            let newLikedBy = [...(news.liked_by || [])];

            if (isCurrentlyLiked) {
                // Remover like
                newLikes = Math.max(0, newLikes - 1);
                newLikedBy = newLikedBy.filter((id: string) => id !== user.id);
                toast.info('Like removido');
            } else {
                // Adicionar like
                newLikes += 1;
                newLikedBy.push(user.id);
                toast.success('Notícia curtida!');
            }

            setNews({
                ...news,
                likes: newLikes,
                liked_by: newLikedBy
            });
        } catch (err) {
            console.error('Erro ao curtir notícia:', err);
            toast.error('Erro ao curtir notícia');
        } finally {
            setIsLiking(false);
        }
    };

    // Mock da função de adicionar comentário
    const handleAddComment = async (data: CommentFormData) => {
        if (!user) {
            toast.error('Faça login para comentar');
            return;
        }

        if (!news) return;

        setIsAddingComment(true);
        try {
            // Simular delay de API
            await new Promise(resolve => setTimeout(resolve, 500));

            const newComment = {
                id: Math.random().toString(36).substr(2, 9),
                user_id: user.id,
                user_name: user.name,
                text: data.text,
                created_at: new Date().toISOString()
            };

            const updatedComments = [newComment, ...(news.comments || [])];

            setNews({
                ...news,
                comments: updatedComments
            });

            reset();
            toast.success('Comentário adicionado!');
        } catch (err: any) {
            console.error('Erro ao adicionar comentário:', err);
            toast.error('Erro ao adicionar comentário');
        } finally {
            setIsAddingComment(false);
        }
    };

    const handleDelete = async () => {
        if (!news) return;

        try {
            const success = await deleteNews(news.id);
            if (success) {
                toast.success('Notícia excluída com sucesso!');
                navigate('/news');
            } else {
                throw new Error('Falha ao excluir notícia');
            }
        } catch (err: any) {
            console.error('Erro ao excluir notícia:', err);
            toast.error(err.message || 'Erro ao excluir notícia');
        } finally {
            setShowDeleteConfirm(false);
        }
    };

    const handleShare = async () => {
        if (!news) return;

        const shareData = {
            title: news.title,
            text: news.preview || news.title,
            url: window.location.href,
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                // Fallback: copiar para área de transferência
                await navigator.clipboard.writeText(window.location.href);
                toast.success('Link copiado para a área de transferência!');
            }
        } catch (err) {
            console.error('Erro ao compartilhar:', err);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 60) return 'agora';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min atrás`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} h atrás`;
        if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} dias atrás`;

        return formatDate(dateString);
    };

    const userCanEdit = news && canEdit(news);
    const userCanDelete = news && canDelete(news);
    const isLiked = user && news?.liked_by?.includes(user.id);

    if (isLoading) {
        return (
            <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900">
                <Sidebar />
                <div className="flex-1 flex items-center justify-center p-4">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                        <p className={`text-lg ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Carregando notícia...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!news) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
                <Sidebar />
                <div className="flex-1 flex items-center justify-center p-4">
                    <div className="text-center">
                        <p className="text-red-500 text-lg mb-4">Notícia não encontrada</p>
                        <Link
                            to="/news"
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                        >
                            Voltar para Notícias
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
            {/* Sidebar */}
            <Sidebar />
            
            {/* Main Content */}
            <div className="flex-1">
                <div className="py-15 lg:py-8">
                    <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-8">
                        {/* Header */}
                        <div className="mb-4 lg:mb-8">
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                                <div className="flex items-center space-x-3">
                                    <button
                                        onClick={() => navigate('/news')}
                                        className={`p-2 rounded-lg transition-colors flex-shrink-0 ${darkMode ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-200 text-gray-600'
                                            }`}
                                    >
                                        <ArrowLeft className="w-5 h-5" />
                                    </button>

                                    <div className="min-w-0 flex-1">
                                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white truncate">
                                            Detalhes da Notícia
                                        </h1>
                                        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1 truncate">
                                            Visualizando notícia publicada
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-start sm:justify-end space-x-2 overflow-x-auto pb-2 sm:pb-0">
                                    {/* Botão Compartilhar */}
                                    <button
                                        onClick={handleShare}
                                        className={`flex items-center px-2 sm:px-3 py-2 rounded-lg transition-colors flex-shrink-0 ${darkMode
                                                ? 'hover:bg-gray-800 text-gray-300'
                                                : 'hover:bg-gray-200 text-gray-600'
                                            }`}
                                    >
                                        <Share2 className="w-4 h-4 sm:mr-2" />
                                        <span className="hidden sm:inline">Compartilhar</span>
                                    </button>

                                    {/* Botão Editar */}
                                    {userCanEdit && (
                                        <Link
                                            to={`/news/edit/${news.id}`}
                                            className={`flex items-center px-2 sm:px-3 py-2 rounded-lg transition-colors flex-shrink-0 ${darkMode
                                                    ? 'hover:bg-gray-800 text-gray-300'
                                                    : 'hover:bg-gray-200 text-gray-600'
                                                }`}
                                        >
                                            <Edit3 className="w-4 h-4 sm:mr-2" />
                                            <span className="hidden sm:inline">Editar</span>
                                        </Link>
                                    )}

                                    {/* Botão Excluir */}
                                    {userCanDelete && (
                                        <button
                                            onClick={() => setShowDeleteConfirm(true)}
                                            className="flex items-center px-2 sm:px-3 py-2 text-red-500 rounded-lg transition-colors hover:bg-red-50 dark:hover:bg-red-900/20 flex-shrink-0"
                                        >
                                            <Trash2 className="w-4 h-4 sm:mr-2" />
                                            <span className="hidden sm:inline">Excluir</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="mb-4 lg:mb-6 p-3 sm:p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                <p className="text-red-600 dark:text-red-400 text-sm sm:text-base">{error}</p>
                            </div>
                        )}

                        {/* Conteúdo da Notícia */}
                        <div className={`rounded-xl sm:rounded-2xl overflow-hidden shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                            {/* Imagem de Capa */}
                            {news.image && (
                                <div className="relative">
                                    <img
                                        src={news.image}
                                        alt={news.title}
                                        className="w-full h-48 sm:h-64 lg:h-96 object-cover"
                                    />
                                    
                                    {/* Overlay da Campanha */}
                                    {campaign && (
                                        <div className="absolute top-3 left-3">
                                            <div className="flex items-center space-x-2 bg-black bg-opacity-70 rounded-full px-3 py-2 backdrop-blur-sm border border-white border-opacity-20">
                                                {campaign.logo && (
                                                    <img 
                                                        src={campaign.logo} 
                                                        alt={campaign.name}
                                                        className="w-5 h-5 rounded-full object-cover"
                                                    />
                                                )}
                                                <span className="text-white text-sm font-medium">
                                                    {campaign.name}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Conteúdo */}
                            <div className="p-4 sm:p-6 lg:p-8">
                                {/* Título */}
                                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4 leading-tight">
                                    {news.title}
                                </h1>

                                {/* Preview */}
                                {news.preview && (
                                    <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-4 sm:mb-6 leading-relaxed">
                                        {news.preview}
                                    </p>
                                )}

                                {/* Meta Informações */}
                                <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-4 sm:mb-6 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                                    <div className="flex items-center">
                                        <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                        <span>{formatDate(news.created_at)}</span>
                                    </div>

                                    <div className="flex items-center">
                                        <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                        <span>{getTimeAgo(news.created_at)}</span>
                                    </div>

                                    {/* Campanha - versão badge */}
                                    {campaign && (
                                        <div className="flex items-center">
                                            <div className="flex items-center space-x-1 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full">
                                                <Building className="w-3 h-3 sm:w-4 sm:h-4" />
                                                <span className="text-xs sm:text-sm">{campaign.name}</span>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex items-center">
                                        <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                        <span>Visualizações: {Math.floor(Math.random() * 1000) + 100}</span>
                                    </div>
                                </div>

                                {/* Corpo da Notícia */}
                                <div
                                    className="prose prose-sm sm:prose-base lg:prose-lg max-w-none dark:prose-invert mb-6 sm:mb-8 text-gray-700 dark:text-gray-300"
                                    dangerouslySetInnerHTML={{ __html: news.content }}
                                />

                                {/* Ações */}
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-4 sm:pt-6 border-t border-gray-200 dark:border-gray-700 gap-4">
                                    <div className="flex items-center justify-between sm:justify-start space-x-4 sm:space-x-6">
                                        {/* Like */}
                                        <button
                                            onClick={handleLike}
                                            disabled={isLiking || !user}
                                            className={`flex items-center space-x-2 transition-colors ${isLiked
                                                    ? 'text-red-500'
                                                    : 'text-gray-500 dark:text-gray-400 hover:text-red-500'
                                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                                        >
                                            <Heart className={`w-4 h-4 sm:w-5 sm:h-5 ${isLiked ? 'fill-current' : ''}`} />
                                            <span className="font-medium text-sm sm:text-base">{news.likes || 0}</span>
                                            <span className="text-xs sm:text-sm hidden xs:inline">Curtidas</span>
                                        </button>

                                        {/* Comentários */}
                                        <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
                                            <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                                            <span className="font-medium text-sm sm:text-base">{news.comments?.length || 0}</span>
                                            <span className="text-xs sm:text-sm hidden xs:inline">Comentários</span>
                                        </div>
                                    </div>

                                    <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 text-center sm:text-right">
                                        Atualizado em {formatDate(news.updated_at)}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Seção de Comentários */}
                        <div className={`mt-4 sm:mt-8 rounded-xl sm:rounded-2xl shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} p-4 sm:p-6 lg:p-8`}>
                            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">
                                Comentários ({news.comments?.length || 0})
                            </h2>

                            {/* Formulário de Comentário */}
                            {user ? (
                                <form onSubmit={handleSubmit(handleAddComment)} className="mb-6 sm:mb-8">
                                    <div className="flex space-x-3 sm:space-x-4">
                                        <div className="flex-shrink-0">
                                            <div
                                                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm sm:text-base"
                                                style={{ backgroundColor: colors.primary }}
                                            >
                                                {user.name?.charAt(0).toUpperCase()}
                                            </div>
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <textarea
                                                {...register('text')}
                                                placeholder="Escreva seu comentário..."
                                                rows={3}
                                                className={`w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg border focus:outline-none focus:ring-2 focus:border-transparent resize-none text-sm sm:text-base ${darkMode
                                                        ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-500'
                                                        : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500'
                                                    } ${errors.text ? 'border-red-500' : ''}`}
                                            />
                                            {errors.text && (
                                                <p className="mt-1 text-xs sm:text-sm text-red-500">{errors.text.message}</p>
                                            )}

                                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mt-2 sm:mt-3 gap-2">
                                                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 order-2 sm:order-1">
                                                    {commentText?.length || 0}/500 caracteres
                                                </p>

                                                <button
                                                    type="submit"
                                                    disabled={isAddingComment || !commentText?.trim()}
                                                    className="px-3 sm:px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base order-1 sm:order-2 w-full sm:w-auto"
                                                    style={{ backgroundColor: colors.primary }}
                                                >
                                                    {isAddingComment ? 'Enviando...' : 'Comentar'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </form>
                            ) : (
                                <div className="text-center py-4 sm:py-6 border border-gray-200 dark:border-gray-700 rounded-lg mb-6 sm:mb-8">
                                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-3">
                                        Faça login para comentar nesta notícia
                                    </p>
                                    <Link
                                        to="/login"
                                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm sm:text-base inline-block"
                                        style={{ backgroundColor: colors.primary }}
                                    >
                                        Fazer Login
                                    </Link>
                                </div>
                            )}

                            {/* Lista de Comentários */}
                            <div className="space-y-4 sm:space-y-6">
                                {!news.comments || news.comments.length === 0 ? (
                                    <div className="text-center py-6 sm:py-8">
                                        <MessageCircle className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-2 sm:mb-3" />
                                        <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">
                                            Nenhum comentário ainda. Seja o primeiro a comentar!
                                        </p>
                                    </div>
                                ) : (
                                    news.comments.map((comment: any) => (
                                        <div key={comment.id} className="flex space-x-3 sm:space-x-4">
                                            <div className="flex-shrink-0">
                                                <div
                                                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm sm:text-base"
                                                    style={{ backgroundColor: colors.secondary }}
                                                >
                                                    {comment.user_name?.charAt(0).toUpperCase()}
                                                </div>
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 sm:p-4">
                                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 gap-1">
                                                        <h4 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base truncate">
                                                            {comment.user_name}
                                                        </h4>
                                                        <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                                                            {getTimeAgo(comment.created_at)}
                                                        </span>
                                                    </div>

                                                    <p className="text-gray-700 dark:text-gray-300 text-sm sm:text-base break-words">
                                                        {comment.text}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal de Confirmação de Exclusão */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className={`rounded-xl sm:rounded-2xl p-4 sm:p-6 max-w-md w-full mx-4 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                        <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
                            Confirmar Exclusão
                        </h3>

                        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4 sm:mb-6">
                            Tem certeza que deseja excluir a notícia "{news.title}"? Esta ação não pode ser desfeita.
                        </p>

                        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className={`flex-1 px-4 py-2 rounded-lg border transition-colors text-sm sm:text-base ${darkMode
                                        ? 'border-gray-600 hover:bg-gray-700 text-gray-300'
                                        : 'border-gray-300 hover:bg-gray-100 text-gray-700'
                                    }`}
                            >
                                Cancelar
                            </button>

                            <button
                                onClick={handleDelete}
                                disabled={loading}
                                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors text-sm sm:text-base"
                            >
                                {loading ? 'Excluindo...' : 'Excluir'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};