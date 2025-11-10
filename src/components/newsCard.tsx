// src/components/NewsCard.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle, Eye, Calendar, User, MoreVertical } from 'lucide-react';
import type { News } from '../services/newsService';
import { useNews } from '../pages/hooks/useNews';

interface NewsCardProps {
  news: News;
}

export const NewsCard: React.FC<NewsCardProps> = ({ news }) => {
  const [showMenu, setShowMenu] = useState(false);
  const { likeNews, deleteNews } = useNews();

  const handleLike = async () => {
    await likeNews(news.id);
  };

  const handleDelete = async () => {
    if (window.confirm('Tem certeza que deseja excluir esta notícia?')) {
      await deleteNews(news.id);
    }
    setShowMenu(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const isLiked = news.liked_by.includes('1'); // Simulando usuário logado

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      {/* Image */}
      <div className="relative">
        <img
          src={news.image}
          alt={news.title}
          className="w-full h-48 object-cover"
        />
        
        {/* Menu Overlay */}
        <div className="absolute top-2 right-2">
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 bg-black bg-opacity-50 rounded text-white hover:bg-opacity-70"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            
            {showMenu && (
              <div className="absolute right-0 mt-1 w-32 bg-white dark:bg-gray-700 rounded-md shadow-lg py-1 z-10">
                <Link
                  to={`/news/edit/${news.id}`}
                  className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
                >
                  Editar
                </Link>
                <button
                  onClick={handleDelete}
                  className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-600"
                >
                  Excluir
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-2 line-clamp-2">
          {news.title}
        </h3>
        
        <div 
          className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-3 prose prose-sm dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: news.body }}
        />

        {/* Meta Information */}
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-3">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <User className="w-3 h-3 mr-1" />
              <span>Por {news.created_by}</span>
            </div>
            <div className="flex items-center">
              <Calendar className="w-3 h-3 mr-1" />
              <span>{formatDate(news.created_at)}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-600">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleLike}
              className={`flex items-center space-x-1 transition-colors ${
                isLiked 
                  ? 'text-red-500' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-red-500'
              }`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
              <span>{news.likes}</span>
            </button>
            
            <div className="flex items-center space-x-1 text-gray-500 dark:text-gray-400">
              <MessageCircle className="w-4 h-4" />
              <span>{news.comments.length}</span>
            </div>
          </div>

          <Link
            to={`/news/${news.id}`}
            className="flex items-center text-blue-500 hover:text-blue-600 text-sm font-medium"
          >
            <Eye className="w-4 h-4 mr-1" />
            Ver Mais
          </Link>
        </div>
      </div>
    </div>
  );
};