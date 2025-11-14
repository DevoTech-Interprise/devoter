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
    Building,
    Reply,
    CornerDownLeft
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
        likeNews,
        addComment,
        addReply,
        getNewsLikes,
        getNewsComments,
        canEdit,
        canDelete,
        loading,
        error,
        clearError,
        currentNews
    } = useNews();

    const [isLoading, setIsLoading] = useState(true);
    const [isLiking, setIsLiking] = useState(false);
    const [isAddingComment, setIsAddingComment] = useState(false);
    const [isAddingReply, setIsAddingReply] = useState<string | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [campaign, setCampaign] = useState<Campaign | null>(null);
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyText, setReplyText] = useState('');

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

            // ⚠️ AGUARDAR o usuário estar disponível antes de carregar a notícia
            if (!user) {
                console.log('⏳ Aguardando usuário carregar...');
                return;
            }

            setIsLoading(true);
            clearError();

            try {
                console.log('🔄 NewsDetail: Iniciando carregamento da notícia', id, 'usuário:', user.id);
                await getNewsById(id);
                console.log('✅ NewsDetail: Notícia carregada', currentNews);

                // Carregar informações da campanha se existir
                if (currentNews?.campaign_id) {
                    console.log('🔄 NewsDetail: Carregando campanha', currentNews.campaign_id);
                    loadCampaignInfo(String(currentNews.campaign_id));
                }
            } catch (err: any) {
                console.error('❌ NewsDetail: Erro ao carregar notícia:', err);
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
    }, [id, user, navigate]);
    // Limpar erro quando o componente desmontar
    useEffect(() => {
        return () => {
            clearError();
        };
    }, [clearError]);

    // Função de like real
    const handleLike = async () => {
        if (!user) {
            toast.error('Faça login para curtir notícias');
            return;
        }

        if (!currentNews) return;

        setIsLiking(true);
        try {
            const success = await likeNews(currentNews.id);
            
            if (success) {
                console.log('Like atualizado com sucesso');
            }
        } catch (err) {
            console.error('Erro ao curtir notícia:', err);
            toast.error('Erro ao curtir notícia');
        } finally {
            setIsLiking(false);
        }
    };

    // Função de adicionar comentário real
    const handleAddComment = async (data: CommentFormData) => {
        if (!user) {
            toast.error('Faça login para comentar');
            return;
        }

        if (!currentNews) return;

        setIsAddingComment(true);
        try {
            const success = await addComment(currentNews.id, data);
            
            if (success) {
                reset();
                toast.success('Comentário adicionado!');
            } else {
                toast.error('Erro ao adicionar comentário');
            }
        } catch (err: any) {
            console.error('Erro ao adicionar comentário:', err);
            toast.error('Erro ao adicionar comentário');
        } finally {
            setIsAddingComment(false);
        }
    };

    // Função para adicionar reply
    const handleAddReply = async (parentCommentId: string) => {
        if (!user || !replyText.trim()) {
            toast.error('Escreva uma resposta');
            return;
        }

        if (!currentNews) return;

        setIsAddingReply(parentCommentId);
        try {
            const success = await addReply(currentNews.id, parentCommentId, { text: replyText });

            if (success) {
                setReplyingTo(null);
                setReplyText('');
                toast.success('Resposta adicionada!');
            } else {
                toast.error('Erro ao adicionar resposta');
            }
        } catch (err: any) {
            console.error('Erro ao adicionar resposta:', err);
            toast.error('Erro ao adicionar resposta');
        } finally {
            setIsAddingReply(null);
        }
    };

    const handleDelete = async () => {
        if (!currentNews) return;

        try {
            const success = await deleteNews(currentNews.id);
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
        if (!currentNews) return;

        const shareData = {
            title: currentNews.title,
            text: currentNews.preview || currentNews.title,
            url: window.location.href,
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
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

    const userCanEdit = currentNews && canEdit(currentNews);
    const userCanDelete = currentNews && canDelete(currentNews);
    const isLiked = user && currentNews?.liked_by?.includes(user.id);

    if (isLoading) {
        return (
            <div className={`flex h-screen overflow-hidden transition-colors duration-300
                ${darkMode ? "bg-gray-950 text-gray-100" : "bg-gray-50 text-gray-900"}
            `}>
                <Sidebar />
                <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="flex-1 flex items-center justify-center p-4">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                            <p className={`text-lg ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Carregando notícia...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!currentNews) {
        return (
            <div className={`flex h-screen overflow-hidden transition-colors duration-300
                ${darkMode ? "bg-gray-950 text-gray-100" : "bg-gray-50 text-gray-900"}
            `}>
                <Sidebar />
                <div className="flex-1 flex flex-col overflow-hidden">
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
            </div>
        );
    }

    return (
        <div className={`flex h-screen overflow-hidden transition-colors duration-300
            ${darkMode ? "bg-gray-950 text-gray-100" : "bg-gray-50 text-gray-900"}
        `}>
            {/* Sidebar - FIXO igual ao Dashboard */}
            <Sidebar />
            
            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Conteúdo principal com scroll */}
                <div className="flex-1 overflow-y-auto">
                    <div className="py-6">
                        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                            {/* Header */}
                            <div className="mb-6">
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

                                        {userCanEdit && (
                                            <Link
                                                to={`/news/edit/${currentNews.id}`}
                                                className={`flex items-center px-2 sm:px-3 py-2 rounded-lg transition-colors flex-shrink-0 ${darkMode
                                                    ? 'hover:bg-gray-800 text-gray-300'
                                                    : 'hover:bg-gray-200 text-gray-600'
                                                    }`}
                                            >
                                                <Edit3 className="w-4 h-4 sm:mr-2" />
                                                <span className="hidden sm:inline">Editar</span>
                                            </Link>
                                        )}

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
                                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                    <p className="text-red-600 dark:text-red-400">{error}</p>
                                </div>
                            )}

                            {/* Conteúdo da Notícia */}
                            <div className={`rounded-2xl overflow-hidden shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} mb-6`}>
                                {currentNews.image && (
                                    <div className="relative">
                                        <img
                                            src={currentNews.image}
                                            alt={currentNews.title}
                                            className="w-full h-64 lg:h-80 object-cover"
                                        />

                                        {campaign && (
                                            <div className="absolute top-4 left-4">
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

                                <div className="p-6 lg:p-8">
                                    <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
                                        {currentNews.title}
                                    </h1>

                                    {currentNews.preview && (
                                        <p className="text-xl text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                                            {currentNews.preview}
                                        </p>
                                    )}

                                    <div className="flex flex-wrap items-center gap-4 mb-6 text-sm text-gray-500 dark:text-gray-400">
                                        <div className="flex items-center">
                                            <Calendar className="w-4 h-4 mr-2" />
                                            <span>{formatDate(currentNews.created_at)}</span>
                                        </div>

                                        <div className="flex items-center">
                                            <Clock className="w-4 h-4 mr-2" />
                                            <span>{getTimeAgo(currentNews.created_at)}</span>
                                        </div>

                                        {/* {campaign && (
                                            <div className="flex items-center">
                                                <div className="flex items-center space-x-2 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full">
                                                    <Building className="w-4 h-4" />
                                                    <span className="text-sm">{campaign.name}</span>
                                                </div>
                                            </div>
                                        )} */}

                                        {/* <div className="flex items-center">
                                            <Eye className="w-4 h-4 mr-2" />
                                            <span>Visualizações: {Math.floor(Math.random() * 1000) + 100}</span>
                                        </div> */}
                                    </div>

                                    <div
                                        className="prose prose-lg max-w-none dark:prose-invert mb-6 text-gray-700 dark:text-gray-300"
                                        dangerouslySetInnerHTML={{ __html: currentNews.content }}
                                    />

                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-6 border-t border-gray-200 dark:border-gray-700 gap-4">
                                        <div className="flex items-center space-x-6">
                                            <button
                                                onClick={handleLike}
                                                disabled={isLiking || !user}
                                                className={`flex items-center space-x-2 transition-colors ${isLiked
                                                    ? 'text-red-500'
                                                    : 'text-gray-500 dark:text-gray-400 hover:text-red-500'
                                                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                                            >
                                                <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                                                <span className="font-medium">{currentNews.likes || 0}</span>
                                                <span className="text-sm">Curtidas</span>
                                            </button>

                                            <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
                                                <MessageCircle className="w-5 h-5" />
                                                <span className="font-medium">
                                                    {currentNews.comments?.reduce((total: number, comment: any) =>
                                                        total + 1 + (comment.replies?.length || 0), 0
                                                    ) || 0}
                                                </span>
                                                <span className="text-sm">Comentários</span>
                                            </div>
                                        </div>

                                        <div className="text-sm text-gray-500 dark:text-gray-400 text-center sm:text-right">
                                            Atualizado em {formatDate(currentNews.updated_at)}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Seção de Comentários */}
                            <div className={`rounded-2xl shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 lg:p-8`}>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                                    Comentários ({currentNews.comments?.reduce((total: number, comment: any) =>
                                        total + 1 + (comment.replies?.length || 0), 0
                                    ) || 0})
                                </h2>

                                {/* Formulário de Comentário */}
                                {user ? (
                                    <form onSubmit={handleSubmit(handleAddComment)} className="mb-8">
                                        <div className="flex space-x-4">
                                            <div className="flex-shrink-0">
                                                <div
                                                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
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
                                                    className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:border-transparent resize-none ${darkMode
                                                        ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-500'
                                                        : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500'
                                                        } ${errors.text ? 'border-red-500' : ''}`}
                                                />
                                                {errors.text && (
                                                    <p className="mt-2 text-sm text-red-500">{errors.text.message}</p>
                                                )}

                                                <div className="flex justify-between items-center mt-3">
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                                        {commentText?.length || 0}/500 caracteres
                                                    </p>

                                                    <button
                                                        type="submit"
                                                        disabled={isAddingComment || !commentText?.trim()}
                                                        className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                                                        style={{ backgroundColor: colors.primary }}
                                                    >
                                                        {isAddingComment ? (
                                                            <>
                                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                                <span>Enviando...</span>
                                                            </>
                                                        ) : (
                                                            <span>Comentar</span>
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </form>
                                ) : (
                                    <div className="text-center py-8 border border-gray-200 dark:border-gray-700 rounded-lg mb-8">
                                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                                            Faça login para comentar nesta notícia
                                        </p>
                                        <Link
                                            to="/login"
                                            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors inline-block"
                                            style={{ backgroundColor: colors.primary }}
                                        >
                                            Fazer Login
                                        </Link>
                                    </div>
                                )}

                                {/* Lista de Comentários */}
                                <div className="space-y-6">
                                    {!currentNews.comments || currentNews.comments.length === 0 ? (
                                        <div className="text-center py-8">
                                            <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                            <p className="text-gray-500 dark:text-gray-400">
                                                Nenhum comentário ainda. Seja o primeiro a comentar!
                                            </p>
                                        </div>
                                    ) : (
                                        currentNews.comments.map((comment: any) => (
                                            <div key={comment.id} className="space-y-4">
                                                {/* Comentário Principal */}
                                                <div className="flex space-x-4">
                                                    <div className="flex-shrink-0">
                                                        <div
                                                            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
                                                            style={{ backgroundColor: colors.primary }}
                                                        >
                                                            {comment.user_avatar}
                                                        </div>
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                                                            <div className="flex justify-between items-center mb-2">
                                                                <h4 className="font-semibold text-gray-900 dark:text-white">
                                                                    {comment.user_name}
                                                                </h4>
                                                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                                                    {getTimeAgo(comment.created_at)}
                                                                </span>
                                                            </div>

                                                            <p className="text-gray-700 dark:text-gray-300 break-words mb-3">
                                                                {comment.text}
                                                            </p>

                                                            <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                                                                <button
                                                                    onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                                                                    className="flex items-center space-x-1 hover:text-blue-500 transition-colors"
                                                                >
                                                                    <Reply className="w-4 h-4" />
                                                                    <span>Responder</span>
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {/* Formulário de Reply */}
                                                        {replyingTo === comment.id && (
                                                            <div className="mt-4 ml-4 p-4 bg-gray-100 dark:bg-gray-600 rounded-lg">
                                                                <div className="flex space-x-3">
                                                                    <div className="flex-shrink-0">
                                                                        <div
                                                                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm"
                                                                            style={{ backgroundColor: colors.secondary }}
                                                                        >
                                                                            {user?.name?.charAt(0).toUpperCase()}
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex-1">
                                                                        <textarea
                                                                            value={replyText}
                                                                            onChange={(e) => setReplyText(e.target.value)}
                                                                            placeholder="Escreva sua resposta..."
                                                                            rows={2}
                                                                            className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:border-transparent resize-none text-sm ${darkMode
                                                                                ? 'bg-gray-500 border-gray-400 text-white focus:ring-blue-500'
                                                                                : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500'
                                                                                }`}
                                                                            disabled={isAddingReply === comment.id}
                                                                        />
                                                                        <div className="flex justify-end space-x-2 mt-2">
                                                                            <button
                                                                                onClick={() => {
                                                                                    setReplyingTo(null);
                                                                                    setReplyText('');
                                                                                }}
                                                                                disabled={isAddingReply === comment.id}
                                                                                className={`px-3 py-1 rounded-lg border text-sm ${darkMode
                                                                                    ? 'border-gray-500 text-gray-300 hover:bg-gray-500'
                                                                                    : 'border-gray-300 text-gray-700 hover:bg-gray-200'
                                                                                    } disabled:opacity-50`}
                                                                            >
                                                                                Cancelar
                                                                            </button>
                                                                            <button
                                                                                onClick={() => handleAddReply(comment.id)}
                                                                                disabled={!replyText.trim() || isAddingReply === comment.id}
                                                                                className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 text-sm flex items-center space-x-2"
                                                                            >
                                                                                {isAddingReply === comment.id ? (
                                                                                    <>
                                                                                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                                                                        <span>Enviando...</span>
                                                                                    </>
                                                                                ) : (
                                                                                    <span>Responder</span>
                                                                                )}
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Replies */}
                                                {comment.replies && comment.replies.length > 0 && (
                                                    <div className="space-y-3 ml-8 pl-6 border-l-2 border-gray-200 dark:border-gray-600">
                                                        {comment.replies.map((reply: any) => (
                                                            <div key={reply.id} className="flex space-x-3">
                                                                <div className="flex-shrink-0">
                                                                    <div
                                                                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm"
                                                                        style={{ backgroundColor: colors.secondary }}
                                                                    >
                                                                        {reply.user_avatar}
                                                                        {reply.is_loading && (
                                                                            <div className="absolute -top-1 -right-1">
                                                                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500"></div>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className={`bg-gray-50 dark:bg-gray-700 rounded-lg p-3 ${reply.is_loading ? 'opacity-70' : ''}`}>
                                                                        <div className="flex justify-between items-center mb-1">
                                                                            <div className="flex items-center space-x-2">
                                                                                <h5 className="font-medium text-gray-900 dark:text-white text-sm">
                                                                                    {reply.user_name}
                                                                                </h5>
                                                                                <CornerDownLeft className="w-3 h-3 text-gray-400" />
                                                                            </div>
                                                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                                                                {reply.is_loading ? 'Enviando...' : getTimeAgo(reply.created_at)}
                                                                            </span>
                                                                        </div>
                                                                        <p className="text-gray-700 dark:text-gray-300 text-sm break-words">
                                                                            {reply.text}
                                                                        </p>
                                                                        {reply.is_loading && (
                                                                            <div className="flex items-center space-x-1 mt-1">
                                                                                <div className="animate-spin rounded-full h-2 w-2 border-b-2 border-blue-500"></div>
                                                                                <span className="text-xs text-gray-500">Enviando...</span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal de Confirmação de Exclusão */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className={`rounded-2xl p-6 max-w-md w-full mx-4 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                        <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
                            Confirmar Exclusão
                        </h3>

                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            Tem certeza que deseja excluir a notícia "{currentNews.title}"? Esta ação não pode ser desfeita.
                        </p>

                        <div className="flex space-x-3">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${darkMode
                                    ? 'border-gray-600 hover:bg-gray-700 text-gray-300'
                                    : 'border-gray-300 hover:bg-gray-100 text-gray-700'
                                    }`}
                            >
                                Cancelar
                            </button>

                            <button
                                onClick={handleDelete}
                                disabled={loading}
                                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors"
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