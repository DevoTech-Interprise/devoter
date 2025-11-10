// src/pages/News/NewsList.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter, Grid, List } from 'lucide-react';
import { useNews } from '../../pages/hooks/useNews';
import { NewsCard } from '../../components/newsCard';
import Sidebar from '../../components/Sidebar';

export const NewsList: React.FC = () => {
  const { news, loading, error } = useNews();
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Filtrar notícias baseado no termo de busca
  const filteredNews = news.filter(newsItem =>
    newsItem.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    newsItem.body.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      <Sidebar  />
      
      {/* Main Content */}
      <div className="flex-1">
        <div className="py-15">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-8">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-4">               
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                      Notícias
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">
                      Fique por dentro das últimas novidades
                    </p>
                  </div>
                </div>
                
                <Link
                  to="/news/create"
                  className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Nova Notícia
                </Link>
              </div>

              {/* Search and Filter */}
              <div className="mt-6 flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Buscar notícias por título ou conteúdo..."
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
                      className={`p-2 rounded ${
                        viewMode === 'grid' 
                          ? 'bg-blue-500 text-white' 
                          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <Grid className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 rounded ${
                        viewMode === 'list' 
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
                  <NewsCard key={newsItem.id} news={newsItem} />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredNews.map((newsItem) => (
                  <div key={newsItem.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                    <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                      {newsItem.image && (
                        <img
                          src={newsItem.image}
                          alt={newsItem.title}
                          className="w-full lg:w-48 h-32 object-cover rounded-lg flex-shrink-0"
                        />
                      )}
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">
                          {newsItem.title}
                        </h3>
                        <div 
                          className="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-2 prose prose-sm dark:prose-invert max-w-none"
                          dangerouslySetInnerHTML={{ __html: newsItem.body }}
                        />
                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                          <div className="flex items-center space-x-4">
                            <span>{new Date(newsItem.created_at).toLocaleDateString('pt-BR')}</span>
                            <span>•</span>
                            <span>{newsItem.likes} curtidas</span>
                            <span>•</span>
                            <span>{newsItem.comments.length} comentários</span>
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
                      Comece criando a primeira notícia
                    </p>
                    <Link
                      to="/news/create"
                      className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      <Plus className="w-5 h-5 mr-2" />
                      Criar Primeira Notícia
                    </Link>
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