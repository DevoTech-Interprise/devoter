// src/pages/News/NewsList.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter, Grid, List, Heart, MessageCircle, Eye } from 'lucide-react';
import { useNews } from '../../pages/hooks/useNews';
import { useUser } from '../../context/UserContext';
import { NewsCard } from '../../components/newsCard';
import Sidebar from '../../components/Sidebar';
import { useTheme } from '../../context/ThemeContext';

export const NewsList: React.FC = () => {
  const { news, loading, error, deleteNews } = useNews();
  const { user } = useUser();
  const { darkMode } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // Verificar se o usuário pode criar notícias
  const canCreateNews = user && (user.role === 'super' || user.role === 'admin' || user.role === 'manager');

  // Função para lidar com a exclusão de notícia
  const handleDeleteNews = async (newsId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta notícia?')) {
      return;
    }

    setIsDeleting(newsId);
    try {
      const success = await deleteNews(newsId);
      if (!success) {
        throw new Error('Falha ao excluir notícia');
      }
    } catch (err: any) {
      console.error('Erro ao excluir notícia:', err);
      alert(err.message || 'Erro ao excluir notícia');
    } finally {
      setIsDeleting(null);
    }
  };

  // Filtrar notícias baseado no termo de busca
  const filteredNews = news.filter(newsItem =>
    newsItem.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    newsItem.preview.toLowerCase().includes(searchTerm.toLowerCase()) ||
    newsItem.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Função para formatar data
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Função para calcular tempo relativo
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

  // Calcular total de comentários (incluindo replies)
 const getTotalComments = (newsItem: any) => {
  // Se temos a propriedade commentsCount (abordagem otimizada)
  if (newsItem.commentsCount !== undefined) {
    return newsItem.commentsCount;
  }
  
  // Se temos o array de comentários (abordagem completa)
  if (newsItem.comments && newsItem.comments.length > 0) {
    return newsItem.comments.reduce((total: number, comment: any) => {
      return total + 1 + (comment.replies?.length || 0);
    }, 0);
  }
  
  return 0;
};

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-red-500 text-center">
          <p className="text-lg font-semibold">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Tentar Novamente
          </button>
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
        <div className="py-15">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-8">
              <div className="flex flex-col md:flex-row justify-center md:justify-between gap-5 items-center">
                <div className="flex items-center space-x-4">
                  <div>
                    <h1 className="text-3xl text-center md:text-start font-bold text-gray-900 dark:text-white">
                      Notícias
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">
                      Fique por dentro das últimas novidades
                    </p>
                  </div>
                </div>

                {/* Botão Nova Notícia - apenas para usuários autorizados */}
                {canCreateNews && (
                  <Link
                    to="/news/create"
                    className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Nova Notícia
                  </Link>
                )}
              </div>

              {/* Search and Filter */}
              <div className="mt-6 flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Buscar notícias por título, preview ou conteúdo..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex gap-2">
                  {/* View Mode Toggle */}
                  <div className="flex bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-1">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 rounded ${viewMode === 'grid'
                          ? 'bg-blue-500 text-white'
                          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                    >
                      <Grid className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 rounded ${viewMode === 'list'
                          ? 'bg-blue-500 text-white'
                          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>

                  <button className="flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <Filter className="w-5 h-5 mr-2" />
                    Filtrar
                  </button>
                </div>
              </div>

              {/* Stats */}
              <div className="mt-4 flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                <span>
                  {filteredNews.length} notícia{filteredNews.length !== 1 ? 's' : ''} encontrada{filteredNews.length !== 1 ? 's' : ''}
                </span>
                {searchTerm && (
                  <span>
                    para "{searchTerm}"
                  </span>
                )}
              </div>
            </div>

            {/* News Grid/List */}
            {viewMode === 'grid' ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredNews.map((newsItem) => (
                  <NewsCard
                    key={newsItem.id}
                    news={newsItem}
                    onDelete={handleDeleteNews}
                    isDeleting={isDeleting === newsItem.id}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredNews.map((newsItem) => (
                  <div key={newsItem.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                    <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                      {newsItem.image && (
                        <img
                          src={newsItem.image}
                          alt={newsItem.title}
                          className="w-full lg:w-48 h-32 object-cover rounded-lg flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-2 line-clamp-2">
                          {newsItem.title}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-2">
                          {newsItem.preview}
                        </p>

                        {/* Estatísticas de engajamento */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                            {/* Likes */}
                            <div className="flex items-center space-x-1">
                              <Heart className="w-4 h-4" />
                              <span>{newsItem.likes || 0}</span>
                            </div>

                            {/* Comentários */}
                            <div className="flex items-center space-x-1">
                              <MessageCircle className="w-4 h-4" />
                              <span>{getTotalComments(newsItem)}</span>
                            </div>

                            {/* Visualizações (simulado) */}
                            <div className="flex items-center space-x-1">
                              <Eye className="w-4 h-4" />
                              <span>{Math.floor(Math.random() * 1000) + 100}</span>
                            </div>
                          </div>

                          {/* Data */}
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {getTimeAgo(newsItem.created_at)}
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                          <div className="flex items-center space-x-4">
                            <span>{formatDate(newsItem.created_at)}</span>
                            <span>•</span>
                            <span>Campanha: {newsItem.campaign_id || 'Geral'}</span>
                          </div>
                          <Link
                            to={`/news/${newsItem.id}`}
                            className="text-blue-500 hover:text-blue-600 text-sm font-medium"
                          >
                            Ler mais →
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {filteredNews.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 dark:text-gray-500 mb-4">
                  <svg className="w-24 h-24 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9m0 0v12m0 0h6m-6 0h6" />
                  </svg>
                </div>

                {searchTerm ? (
                  <>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      Nenhuma notícia encontrada
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                      Não encontramos resultados para "{searchTerm}"
                    </p>
                    <button
                      onClick={() => setSearchTerm('')}
                      className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      Limpar busca
                    </button>
                  </>
                ) : (
                  <>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      Nenhuma notícia encontrada
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                      {canCreateNews
                        ? 'Comece criando a primeira notícia'
                        : 'Ainda não há notícias publicadas'}
                    </p>
                    {canCreateNews && (
                      <Link
                        to="/news/create"
                        className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        <Plus className="w-5 h-5 mr-2" />
                        Criar Primeira Notícia
                      </Link>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};