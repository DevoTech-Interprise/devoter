// src/components/NewsCard.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle, Eye, Calendar, MoreVertical, Building, Trash2, Edit3 } from 'lucide-react';
import type { News } from '../services/newsService';
import { useNews } from '../pages/hooks/useNews';
import { useUser } from '../context/UserContext';
import { campaignService, type Campaign } from '../services/campaignService';

interface NewsCardProps {
  news: News & { commentsCount?: number }; // ⬅️ Adicione esta tipagem
  onDelete?: (newsId: string) => void;
  isDeleting?: boolean;
}

export const NewsCard: React.FC<NewsCardProps> = ({ 
  news, 
  onDelete,
  isDeleting = false 
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const { likeNews, canEdit, canDelete } = useNews();
  const { user } = useUser();

  // Carregar informações da campanha
  useEffect(() => {
    const loadCampaign = async () => {
      if (!news.campaign_id) return;
      
      try {
        const campaignData = await campaignService.getById(news.campaign_id);
        setCampaign(campaignData);
      } catch (error) {
        console.error('Erro ao carregar campanha:', error);
      }
    };

    loadCampaign();
  }, [news.campaign_id]);

  const handleLike = async () => {
    await likeNews(news.id);
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(news.id);
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

  // Calcular total de comentários (incluindo replies)
  const getTotalComments = () => {
    // Se temos a propriedade commentsCount (abordagem otimizada)
    if (news.commentsCount !== undefined) {
      return news.commentsCount;
    }
    
    // Se temos o array de comentários (abordagem completa)
    if (news.comments && news.comments.length > 0) {
      return news.comments.reduce((total: number, comment: any) => {
        return total + 1 + (comment.replies?.length || 0);
      }, 0);
    }
    
    return 0;
  };

  // Verificar se o usuário atual curtiu a notícia
  const isLiked = user && news.liked_by?.includes(user.id);

  // Debug para verificar os dados
  console.log('🔍 NewsCard dados:', {
    id: news.id,
    title: news.title,
    likes: news.likes,
    commentsCount: news.commentsCount,
    commentsArrayLength: news.comments?.length || 0,
    getTotalComments: getTotalComments()
  });

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow relative">
      {/* Loading Overlay */}
      {isDeleting && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      )}
      
      {/* Image */}
      <div className="relative">
        {news.image && (
          <img
            src={news.image}
            alt={news.title}
            className="w-full h-48 object-cover"
          />
        )}
        
        {/* Campanha Overlay */}
        {campaign && (
          <div className="absolute top-2 left-2">
            <div className="flex items-center space-x-2 bg-black bg-opacity-60 rounded-full px-3 py-1 backdrop-blur-sm">
              {campaign.logo && (
                <img 
                  src={campaign.logo} 
                  alt={campaign.name}
                  className="w-4 h-4 rounded-full object-cover"
                />
              )}
              <span className="text-white text-xs font-medium">
                {campaign.name}
              </span>
            </div>
          </div>
        )}
        
        {/* Menu Overlay - apenas para usuários com permissão */}
        {(canEdit(news) || canDelete(news)) && (
          <div className="absolute top-2 right-2">
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                disabled={isDeleting}
                className="p-1 bg-black bg-opacity-50 rounded text-white hover:bg-opacity-70 disabled:opacity-50"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
              
              {showMenu && (
                <div className="absolute right-0 mt-1 w-32 bg-white dark:bg-gray-700 rounded-md shadow-lg py-1 z-10">
                  {canEdit(news) && (
                    <Link
                      to={`/news/edit/${news.id}`}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
                      onClick={() => setShowMenu(false)}
                    >
                      <Edit3 className="w-4 h-4 mr-2" />
                      Editar
                    </Link>
                  )}
                  {canDelete(news) && (
                    <button
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="flex items-center w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      {isDeleting ? 'Excluindo...' : 'Excluir'}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-2 line-clamp-2">
          {news.title}
        </h3>
        
        {/* Preview da notícia */}
        <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-3">
          {news.preview}
        </p>

        {/* Meta Information */}
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-3">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <Calendar className="w-3 h-3 mr-1" />
              <span>{formatDate(news.created_at)}</span>
            </div>
            
            {/* Badge da campanha - versão mobile/compacta */}
            {/* {campaign && (
              <div className="flex items-center">
                <div className="flex items-center space-x-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full">
                  <Building className="w-3 h-3" />
                  <span className="text-xs">{campaign.name}</span>
                </div>
              </div>
            )} */}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-600">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleLike}
              disabled={!user || isDeleting}
              className={`flex items-center space-x-1 transition-colors ${
                isLiked 
                  ? 'text-red-500' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-red-500'
              } ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}
              title={!user ? 'Faça login para curtir' : isLiked ? 'Descurtir' : 'Curtir'}
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
              <span>{news.likes || 0}</span>
            </button>
            
            {/* CORREÇÃO: Usar getTotalComments() em vez de news.comments.length */}
            <div className="flex items-center space-x-1 text-gray-500 dark:text-gray-400">
              <MessageCircle className="w-4 h-4" />
              <span>{getTotalComments()}</span>
            </div>
          </div>

          <Link
            to={`/news/${news.id}`}
            className="flex items-center text-blue-500 hover:text-blue-600 text-sm font-medium"
          >
            <Eye className="w-4 h-4 mr-1" />
            Ler Mais
          </Link>
        </div>
      </div>
    </div>
  );
};