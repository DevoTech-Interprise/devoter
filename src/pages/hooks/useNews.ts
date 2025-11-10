// src/hooks/useNews.ts
import { useState, useEffect } from 'react';
import { type News, newsService } from '../../services/newsService';
import type { NewsFormData, CommentFormData } from '../../schemas/news';
import { useUser } from '../../context/UserContext';

export const useNews = () => {
  const [news, setNews] = useState<News[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useUser();

  const loadNews = async () => {
    setLoading(true);
    setError(null);
    try {
      const newsData = await newsService.getAllNews();
      
      // Filtrar notícias por campanha se o usuário não for super
      let filteredNews = newsData;
      
      if (user && user.role !== 'super' && user.campaign_id) {
        filteredNews = newsData.filter(item => 
          item.campaign_id === user.campaign_id || !item.campaign_id
        );
        console.log(`📰 Filtradas ${filteredNews.length} notícias da campanha ${user.campaign_id}`);
      }
      
      setNews(filteredNews);
    } catch (err) {
      setError('Erro ao carregar notícias');
      console.error('Error loading news:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNews();
  }, [user?.campaign_id]); // Recarregar quando a campanha mudar

  const createNews = async (newsData: NewsFormData): Promise<boolean> => {
    if (!user) {
      setError('Usuário não autenticado');
      return false;
    }

    setLoading(true);
    setError(null);
    try {
      await newsService.createNews({
        ...newsData,
        created_by: user.id,
        image: newsData.image || 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
        campaign_id: user.campaign_id || undefined // Usar campanha do usuário atual
      });
      
      await loadNews();
      return true;
    } catch (err) {
      setError('Erro ao criar notícia');
      console.error('Error creating news:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateNews = async (id: string, newsData: NewsFormData): Promise<boolean> => {
    if (!user) {
      setError('Usuário não autenticado');
      return false;
    }

    setLoading(true);
    setError(null);
    try {
      // Verificar se o usuário pode editar esta notícia
      const newsItem = news.find(item => item.id === id);
      if (!newsItem) {
        setError('Notícia não encontrada');
        return false;
      }

      // Verificar permissões: super pode editar tudo, outros só podem editar suas próprias notícias
      if (user.role !== 'super' && newsItem.created_by !== user.id) {
        setError('Você não tem permissão para editar esta notícia');
        return false;
      }

      const updated = await newsService.updateNews(id, {
        ...newsData,
        // Manter a campanha original para super, outros usuários mantêm sua campanha
        campaign_id: user.role === 'super' ? newsData.campaign_id : user.campaign_id
      });

      if (!updated) {
        setError('Notícia não encontrada');
        return false;
      }
      
      await loadNews();
      return true;
    } catch (err) {
      setError('Erro ao atualizar notícia');
      console.error('Error updating news:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteNews = async (id: string): Promise<boolean> => {
    if (!user) {
      setError('Usuário não autenticado');
      return false;
    }

    setLoading(true);
    setError(null);
    try {
      // Verificar se o usuário pode excluir esta notícia
      const newsItem = news.find(item => item.id === id);
      if (!newsItem) {
        setError('Notícia não encontrada');
        return false;
      }

      // Verificar permissões: super pode excluir tudo, outros só podem excluir suas próprias notícias
      if (user.role !== 'super' && newsItem.created_by !== user.id) {
        setError('Você não tem permissão para excluir esta notícia');
        return false;
      }

      const success = await newsService.deleteNews(id);
      if (!success) {
        setError('Notícia não encontrada');
        return false;
      }
      
      await loadNews();
      return true;
    } catch (err) {
      setError('Erro ao excluir notícia');
      console.error('Error deleting news:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const likeNews = async (newsId: string): Promise<void> => {
    if (!user) {
      setError('Usuário não autenticado');
      return;
    }

    try {
      const updatedNews = await newsService.likeNews(newsId, user.id);
      
      if (updatedNews) {
        setNews(prevNews => 
          prevNews.map(news => 
            news.id === newsId ? updatedNews : news
          )
        );
      }
    } catch (err) {
      console.error('Error liking news:', err);
      setError('Erro ao curtir notícia');
    }
  };

  const addComment = async (newsId: string, commentData: CommentFormData): Promise<boolean> => {
    if (!user) {
      setError('Usuário não autenticado');
      return false;
    }

    try {
      const updatedNews = await newsService.addComment(newsId, {
        user_id: user.id,
        user_name: user.name,
        text: commentData.text
      });

      if (updatedNews) {
        setNews(prevNews => 
          prevNews.map(news => 
            news.id === newsId ? updatedNews : news
          )
        );
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error adding comment:', err);
      setError('Erro ao adicionar comentário');
      return false;
    }
  };

  // Buscar notícias por campanha (apenas para super users)
  const getNewsByCampaign = async (campaignId: string): Promise<News[]> => {
    if (!user || user.role !== 'super') {
      throw new Error('Apenas super usuários podem buscar notícias por campanha');
    }

    try {
      return await newsService.getNewsByCampaign(campaignId);
    } catch (err) {
      console.error('Error getting news by campaign:', err);
      throw err;
    }
  };

  // Buscar notícia específica
  const getNewsById = async (id: string): Promise<News | null> => {
    try {
      const newsItem = await newsService.getNewsById(id);
      
      // Verificar se o usuário tem acesso a esta notícia
      if (user && user.role !== 'super' && user.campaign_id && newsItem?.campaign_id) {
        if (newsItem.campaign_id !== user.campaign_id) {
          throw new Error('Você não tem acesso a esta notícia');
        }
      }
      
      return newsItem;
    } catch (err) {
      console.error('Error getting news by id:', err);
      throw err;
    }
  };

  // Limpar erros
  const clearError = () => {
    setError(null);
  };

  return {
    // Estado
    news,
    loading,
    error,
    
    // Ações CRUD
    createNews,
    updateNews,
    deleteNews,
    likeNews,
    addComment,
    
    // Buscas
    getNewsById,
    getNewsByCampaign,
    
    // Utilitários
    refetch: loadNews,
    clearError,
    
    // Permissões baseadas no usuário
    canCreate: !!user,
    canEdit: (newsItem: News) => {
      if (!user) return false;
      return user.role === 'super' || newsItem.created_by === user.id;
    },
    canDelete: (newsItem: News) => {
      if (!user) return false;
      return user.role === 'super' || newsItem.created_by === user.id;
    },
    canManageAll: user?.role === 'super',
    
    // Informações do usuário
    currentUser: user
  };
};