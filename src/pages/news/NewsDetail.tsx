// src/pages/News/NewsDetail.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'react-toastify';
import {
    ArrowLeft,
    Calendar,
    User,
    Heart,
    MessageCircle,
    Edit3,
    Trash2,
    Share2,
    Eye,
    Clock,
    Tag
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useNews } from '../../pages/hooks/useNews';
import { useUser } from '../../context/UserContext';
import { commentSchema, type CommentFormData } from '../../schemas/news';
import Sidebar from '../../components/Sidebar';

export const NewsDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { darkMode, colors } = useTheme();
    const { user } = useUser();
    const {
        getNewsById,
        likeNews,
        addComment,
        deleteNews,
        loading,
        error,
        clearError
    } = useNews();

    const [news, setNews] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isLiking, setIsLiking] = useState(false);
    const [isAddingComment, setIsAddingComment] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
                setNews(newsData);
            } catch (err: any) {
                console.error('Erro ao carregar notícia:', err);
                toast.error(err.message || 'Erro ao carregar notícia');
                navigate('/news');
            } finally {
                setIsLoading(false);
            }
        };

        loadNews();
    }, [id, getNewsById, navigate, clearError]);

    // Limpar erro quando o componente desmontar
    useEffect(() => {
        return () => {
            clearError();
        };
    }, [clearError]);

    const handleLike = async () => {
        if (!user) {
            toast.error('Faça login para curtir notícias');
            return;
        }

        if (!news) return;

        setIsLiking(true);
        try {
            await likeNews(news.id);
            // A atualização do estado é feita pelo hook useNews
        } catch (err) {
            console.error('Erro ao curtir notícia:', err);
        } finally {
            setIsLiking(false);
        }
    };

    const handleAddComment = async (data: CommentFormData) => {
        if (!user) {
            toast.error('Faça login para comentar');
            return;
        }

        if (!news) return;

        setIsAddingComment(true);
        try {
            const success = await addComment(news.id, data);
            if (success) {
                reset();
                toast.success('Comentário adicionado!');
            } else {
                throw new Error('Falha ao adicionar comentário');
            }
        } catch (err: any) {
            console.error('Erro ao adicionar comentário:', err);
            toast.error(err.message || 'Erro ao adicionar comentário');
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
            text: news.title,
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

    const canEdit = user && (user.role === 'super' || news?.created_by === user.id);
    const canDelete = user && (user.role === 'super' || news?.created_by === user.id);
    const isLiked = user && news?.liked_by.includes(user.id);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 ">
                <Sidebar />
                <div className="flex-1 items-center justify-center">
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
                <div className="flex-1 flex items-center justify-center">
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
            <div className="flex-1 ">
                <div className="py-8">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                        {/* Header */}
                        <div className="mb-8">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center space-x-4">
                                    
                                    <button
                                        onClick={() => navigate('/news')}
                                        className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-200 text-gray-600'
                                            }`}
                                    >
                                        <ArrowLeft className="w-5 h-5" />
                                    </button>

                                    <div>
                                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                            Detalhes da Notícia
                                        </h1>
                                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                                            Visualizando notícia publicada
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-2">
                                    {/* Botão Compartilhar */}
                                    <button
                                        onClick={handleShare}
                                        className={`flex items-center px-3 py-2 rounded-lg transition-colors ${darkMode
                                                ? 'hover:bg-gray-800 text-gray-300'
                                                : 'hover:bg-gray-200 text-gray-600'
                                            }`}
                                    >
                                        <Share2 className="w-4 h-4 mr-2" />
                                        Compartilhar
                                    </button>

                                    {/* Botão Editar */}
                                    {canEdit && (
                                        <Link
                                            to={`/news/edit/${news.id}`}
                                            className={`flex items-center px-3 py-2 rounded-lg transition-colors ${darkMode
                                                    ? 'hover:bg-gray-800 text-gray-300'
                                                    : 'hover:bg-gray-200 text-gray-600'
                                                }`}
                                        >
                                            <Edit3 className="w-4 h-4 mr-2" />
                                            Editar
                                        </Link>
                                    )}

                                    {/* Botão Excluir */}
                                    {canDelete && (
                                        <button
                                            onClick={() => setShowDeleteConfirm(true)}
                                            className="flex items-center px-3 py-2 text-red-500 rounded-lg transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
                                        >
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Excluir
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
                        <div className={`rounded-2xl overflow-hidden shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                            {/* Imagem de Capa */}
                            {news.image && (
                                <div className="relative">
                                    <img
                                        src={news.image}
                                        alt={news.title}
                                        className="w-full h-96 object-cover"
                                    />
                                </div>
                            )}

                            {/* Conteúdo */}
                            <div className="p-8">
                                {/* Título */}
                                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
                                    {news.title}
                                </h1>

                                {/* Meta Informações */}
                                <div className="flex flex-wrap items-center gap-4 mb-6 text-sm text-gray-500 dark:text-gray-400">
                                    <div className="flex items-center">
                                        <User className="w-4 h-4 mr-1" />
                                        <span>Por {news.created_by}</span>
                                    </div>

                                    <div className="flex items-center">
                                        <Calendar className="w-4 h-4 mr-1" />
                                        <span>{formatDate(news.created_at)}</span>
                                    </div>

                                    <div className="flex items-center">
                                        <Clock className="w-4 h-4 mr-1" />
                                        <span>{getTimeAgo(news.created_at)}</span>
                                    </div>

                                    {news.campaign_id && (
                                        <div className="flex items-center">
                                            <Tag className="w-4 h-4 mr-1" />
                                            <span>Campanha: {news.campaign_id}</span>
                                        </div>
                                    )}

                                    <div className="flex items-center">
                                        <Eye className="w-4 h-4 mr-1" />
                                        <span>Visualizações: {Math.floor(Math.random() * 1000) + 100}</span>
                                    </div>
                                </div>

                                {/* Corpo da Notícia */}
                                <div
                                    className="prose prose-lg max-w-none dark:prose-invert mb-8 text-gray-700 dark:text-gray-300"
                                    dangerouslySetInnerHTML={{ __html: news.body }}
                                />

                                {/* Ações */}
                                <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
                                    <div className="flex items-center space-x-6">
                                        {/* Like */}
                                        <button
                                            onClick={handleLike}
                                            disabled={isLiking || !user}
                                            className={`flex items-center space-x-2 transition-colors ${isLiked
                                                    ? 'text-red-500'
                                                    : 'text-gray-500 dark:text-gray-400 hover:text-red-500'
                                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                                        >
                                            <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                                            <span className="font-medium">{news.likes}</span>
                                            <span className="text-sm">Curtidas</span>
                                        </button>

                                        {/* Comentários */}
                                        <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
                                            <MessageCircle className="w-5 h-5" />
                                            <span className="font-medium">{news.comments.length}</span>
                                            <span className="text-sm">Comentários</span>
                                        </div>
                                    </div>

                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                        Atualizado em {formatDate(news.updated_at)}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Seção de Comentários */}
                        <div className={`mt-8 rounded-2xl shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} p-8`}>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                                Comentários ({news.comments.length})
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

                                        <div className="flex-1">
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
                                                <p className="mt-1 text-sm text-red-500">{errors.text.message}</p>
                                            )}

                                            <div className="flex justify-between items-center mt-3">
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    {commentText?.length || 0}/500 caracteres
                                                </p>

                                                <button
                                                    type="submit"
                                                    disabled={isAddingComment || !commentText?.trim()}
                                                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                    style={{ backgroundColor: colors.primary }}
                                                >
                                                    {isAddingComment ? 'Enviando...' : 'Comentar'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </form>
                            ) : (
                                <div className="text-center py-6 border border-gray-200 dark:border-gray-700 rounded-lg mb-8">
                                    <p className="text-gray-600 dark:text-gray-400 mb-3">
                                        Faça login para comentar nesta notícia
                                    </p>
                                    <Link
                                        to="/login"
                                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                                        style={{ backgroundColor: colors.primary }}
                                    >
                                        Fazer Login
                                    </Link>
                                </div>
                            )}

                            {/* Lista de Comentários */}
                            <div className="space-y-6">
                                {news.comments.length === 0 ? (
                                    <div className="text-center py-8">
                                        <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                        <p className="text-gray-500 dark:text-gray-400">
                                            Nenhum comentário ainda. Seja o primeiro a comentar!
                                        </p>
                                    </div>
                                ) : (
                                    news.comments.map((comment: any) => (
                                        <div key={comment.id} className="flex space-x-4">
                                            <div className="flex-shrink-0">
                                                <div
                                                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
                                                    style={{ backgroundColor: colors.secondary }}
                                                >
                                                    {comment.user_name?.charAt(0).toUpperCase()}
                                                </div>
                                            </div>

                                            <div className="flex-1">
                                                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <h4 className="font-semibold text-gray-900 dark:text-white">
                                                            {comment.user_name}
                                                        </h4>
                                                        <span className="text-sm text-gray-500 dark:text-gray-400">
                                                            {getTimeAgo(comment.created_at)}
                                                        </span>
                                                    </div>

                                                    <p className="text-gray-700 dark:text-gray-300">
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
                    <div className={`rounded-2xl p-6 max-w-md w-full ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                        <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
                            Confirmar Exclusão
                        </h3>

                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            Tem certeza que deseja excluir a notícia "{news.title}"? Esta ação não pode ser desfeita.
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