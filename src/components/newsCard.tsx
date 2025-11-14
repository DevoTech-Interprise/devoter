// src/components/NewsCard.tsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, Eye, Calendar, MoreVertical, Trash2, Edit3 } from 'lucide-react';
import type { News } from '../services/newsService';
import { useUser } from '../context/UserContext';
import { campaignService, type Campaign } from '../services/campaignService';

interface NewsCardProps {
  news: News & { commentsCount?: number };
  onDelete?: (newsId: string) => void;
  onLike?: (newsId: string, e: React.MouseEvent) => void;
  onComment?: (newsId: string, e: React.MouseEvent) => void;
  isDeleting?: boolean;
  isLiking?: boolean;
  isLiked?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
}

export const NewsCard: React.FC<NewsCardProps> = ({ 
  news, 
  onDelete,
  onLike,
  onComment,
  isDeleting = false,
  isLiking = false,
  isLiked = false,
  canEdit = false,
  canDelete = false
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const { user } = useUser();
  const navigate = useNavigate();

  // Carregar informações da campanha
  useEffect(() => {
    const loadCampaign = async () => {
      if (!news.campaign_id) return;
      
      try {
        const campaignData = await campaignService.getById(String(news.campaign_id));
        setCampaign(campaignData);
      } catch (error) {
        console.error('Erro ao carregar campanha:', error);
      }
    };

    loadCampaign();
  }, [news.campaign_id]);

  // Calcular isLiked baseado nos dados da notícia (fallback se a prop não for passada)
  const calculateIsLiked = () => {
    // Se a prop isLiked foi passada, use ela
    if (isLiked !== undefined) return isLiked;
    
    // Caso contrário, calcule baseado nos dados da notícia
    if (!user || !news.liked_by) return false;
    
    const userIdStr = String(user.id);
    return Array.isArray(news.liked_by) 
      ? news.liked_by.some((id: any) => String(id) === userIdStr)
      : false;
  };

  const currentIsLiked = calculateIsLiked();

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('🎯 NewsCard: Clicou no like para notícia:', news.id, 'usuário:', user?.id);
    if (onLike && user) {
      onLike(news.id, e);
    } else if (!user) {
      console.log('❌ NewsCard: Usuário não logado, não pode curtir');
    }
  };

  const handleCommentClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onComment) {
      onComment(news.id, e);
    } else {
      navigate(`/news/${news.id}#comments`);
    }
  };

  const handleNewsClick = () => {
    navigate(`/news/${news.id}`);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(news.id);
    }
    setShowMenu(false);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/news/edit/${news.id}`);
    setShowMenu(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getTotalComments = () => {
    if (news.commentsCount !== undefined) {
      return news.commentsCount;
    }
    
    if (news.comments && news.comments.length > 0) {
      return news.comments.reduce((total: number, comment: any) => {
        return total + 1 + (comment.replies?.length || 0);
      }, 0);
    }
    
    return 0;
  };

  // Debug para verificar os dados do like
  useEffect(() => {
    console.log('🔍 NewsCard like info:', {
      id: news.id,
      title: news.title,
      likes: news.likes,
      liked_by: news.liked_by,
      user_id: user?.id,
      isLiked_prop: isLiked,
      currentIsLiked: currentIsLiked,
      user_has_like: user && news.liked_by?.includes(user.id)
    });
  }, [news, user, isLiked, currentIsLiked]);

  return (
    <div 
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow relative cursor-pointer"
      onClick={handleNewsClick}
    >
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
        
        {/* Menu Overlay */}
        {(canEdit || canDelete) && (
          <div className="absolute top-2 right-2">
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(!showMenu);
                }}
                disabled={isDeleting}
                className="p-1 bg-black bg-opacity-50 rounded text-white hover:bg-opacity-70 disabled:opacity-50"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
              
              {showMenu && (
                <div className="absolute right-0 mt-1 w-32 bg-white dark:bg-gray-700 rounded-md shadow-lg py-1 z-10">
                  {canEdit && (
                    <button
                      onClick={handleEdit}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
                    >
                      <Edit3 className="w-4 h-4 mr-2" />
                      Editar
                    </button>
                  )}
                  {canDelete && (
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
        
        <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-3">
          {news.preview}
        </p>

        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-3">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <Calendar className="w-3 h-3 mr-1" />
              <span>{formatDate(news.created_at)}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-600">
          <div className="flex items-center space-x-4">
            {/* Like Button */}
            <button
              onClick={handleLike}
              disabled={!user || isLiking || isDeleting}
              className={`flex items-center space-x-1 transition-colors ${
                currentIsLiked 
                  ? 'text-red-500 hover:text-red-600' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400'
              } ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}
              title={!user ? 'Faça login para curtir' : currentIsLiked ? 'Descurtir' : 'Curtir'}
            >
              <Heart 
                className={`w-4 h-4 ${currentIsLiked ? 'fill-current' : ''} ${isLiking ? 'animate-pulse' : ''}`} 
              />
              <span>{news.likes || 0}</span>
            </button>
            
            {/* Comment Button */}
            <button
              onClick={handleCommentClick}
              disabled={isDeleting}
              className="flex items-center space-x-1 text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
              title="Ver comentários"
            >
              <MessageCircle className="w-4 h-4" />
              <span>{getTotalComments()}</span>
            </button>
          </div>

          <div 
            className="flex items-center text-blue-500 hover:text-blue-600 text-sm font-medium"
            onClick={(e) => e.stopPropagation()}
          >
            <Link
              to={`/news/${news.id}`}
              className="flex items-center"
            >
              <Eye className="w-4 h-4 mr-1" />
              Ler Mais
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};