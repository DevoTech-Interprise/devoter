// src/hooks/useNewsItem.ts
import { useState, useEffect } from 'react';
import { newsService, type News } from '../../services/newsService';
import { likeService } from '../../services/likeService';
import { commentService, type CommentWithReplies } from '../../services/commentService';
import { userService } from '../../services/userService';
import { useUser } from '../../context/UserContext';

interface ExtendedComment {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  text: string;
  created_at: string;
  is_reply?: boolean;
  likes?: number;
  replies?: ExtendedComment[];
  parent_id?: string | null;
  is_loading?: boolean;
}

interface ExtendedNews extends News {
  comments?: ExtendedComment[];
  commentsCount?: number;
}

export const useNewsItem = (newsId: string) => {
  const [newsItem, setNewsItem] = useState<ExtendedNews | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useUser();

  const loadNewsItem = async () => {
    if (!newsId) return;

    setLoading(true);
    setError(null);

    try {
      console.log('🔄 useNewsItem: Carregando notícia', newsId);
      
      // Buscar dados básicos da notícia
      const item = await newsService.getNewsById(newsId);

      // Verificar se o usuário tem acesso a esta notícia
      if (user && user.role !== 'super' && user.campaign_id && item?.campaign_id) {
        if (item.campaign_id.toString() !== user.campaign_id.toString()) {
          throw new Error('Você não tem acesso a esta notícia');
        }
      }

      let likesData = null;
      let commentsData: ExtendedComment[] = [];

      // Carregar dados adicionais em paralelo
      try {
        const [likesResult, commentsResult] = await Promise.allSettled([
          user ? likeService.getNoticeLikes(newsId, user.id) : Promise.resolve(null),
          getNewsComments(newsId)
        ]);

        // Processar likes
        if (likesResult.status === 'fulfilled') {
          likesData = likesResult.value;
          console.log('✅ Likes carregados para notícia:', newsId, likesData);
        }

        // Processar comentários
        if (commentsResult.status === 'fulfilled') {
          commentsData = await processComments(commentsResult.value);
        }
      } catch (err) {
        console.error('❌ Erro ao carregar dados adicionais:', err);
      }

      const newsWithDetails: ExtendedNews = {
        ...item,
        likes: likesData?.notice_likes_count || 0,
        liked_by: likesData?.likes?.map((like: any) => like.user_id) || [],
        comments: commentsData
      };

      console.log('✅ useNewsItem: Notícia carregada com sucesso', {
        id: newsWithDetails.id,
        title: newsWithDetails.title,
        likes: newsWithDetails.likes,
        liked_by: newsWithDetails.liked_by,
        commentsCount: newsWithDetails.comments?.length || 0
      });

      setNewsItem(newsWithDetails);
    } catch (err: any) {
      console.error('❌ useNewsItem: Erro ao carregar notícia:', err);
      setError(err.message || 'Erro ao carregar notícia');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getNewsComments = async (newsId: string): Promise<CommentWithReplies[]> => {
    try {
      return await commentService.getCommentsByNotice(newsId);
    } catch (err: any) {
      console.error('Error getting news comments:', err);
      throw new Error(err.message || 'Erro ao buscar comentários da notícia');
    }
  };

  const processComments = async (commentsWithReplies: CommentWithReplies[]): Promise<ExtendedComment[]> => {
    // Buscar informações dos usuários
    const userIds = commentsWithReplies.flatMap(commentWithReplies => [
      commentWithReplies.comment.user_id,
      ...commentWithReplies.reply.map(reply => reply.user_id)
    ]);

    const uniqueUserIds = [...new Set(userIds)];
    let users: any[] = [];

    if (uniqueUserIds.length > 0) {
      try {
        users = await userService.getUsersByIds(uniqueUserIds);
      } catch (err) {
        console.error('Erro ao buscar usuários:', err);
      }
    }

    return commentsWithReplies.flatMap(commentWithReplies => {
      const mainCommentUser = users.find(u => String(u.id) === String(commentWithReplies.comment.user_id));

      const mainComment: ExtendedComment = {
        id: commentWithReplies.comment.id,
        user_id: commentWithReplies.comment.user_id,
        user_name: mainCommentUser?.name || 'Usuário',
        user_avatar: mainCommentUser?.name?.charAt(0).toUpperCase() || 'U',
        text: commentWithReplies.comment.content,
        created_at: commentWithReplies.comment.created_at,
        is_reply: false,
        likes: parseInt(commentWithReplies.comment.likes_count) || 0,
        replies: commentWithReplies.reply.map(reply => {
          const replyUser = users.find(u => String(u.id) === String(reply.user_id));
          return {
            id: reply.id,
            user_id: reply.user_id,
            user_name: replyUser?.name || 'Usuário',
            user_avatar: replyUser?.name?.charAt(0).toUpperCase() || 'U',
            text: reply.content,
            created_at: reply.created_at,
            is_reply: true,
            parent_id: commentWithReplies.comment.id,
            likes: parseInt(reply.likes_count) || 0
          };
        })
      };
      return mainComment;
    });
  };

  const likeNewsItem = async (): Promise<boolean> => {
    if (!user) {
      setError('Usuário não autenticado');
      return false;
    }

    if (!newsItem) return false;

    try {
      const result = await likeService.likeNotice(newsId, user.id);

      console.log('🔄 useNewsItem: Resultado do like:', {
        newsId,
        userId: user.id,
        result,
        liked: result.liked
      });

      if (result.liked !== undefined) {
        // Update otimista no estado local
        setNewsItem(prev => {
          if (!prev) return prev;

          const currentLikes = prev.likes || 0;
          const currentLikedBy = prev.liked_by || [];

          let updatedLikedBy;
          let updatedLikes;

          if (result.liked) {
            // Adicionar like
            updatedLikedBy = [...currentLikedBy, user.id];
            updatedLikes = currentLikes + 1;
          } else {
            // Remover like
            updatedLikedBy = currentLikedBy.filter(id => id !== user.id);
            updatedLikes = Math.max(0, currentLikes - 1);
          }

          console.log('📝 useNewsItem: Atualizando estado local:', {
            newsId,
            oldLikes: currentLikes,
            newLikes: updatedLikes,
            oldLikedBy: currentLikedBy,
            newLikedBy: updatedLikedBy
          });

          return {
            ...prev,
            likes: updatedLikes,
            liked_by: updatedLikedBy
          };
        });

        return true;
      }
      return false;
    } catch (err: any) {
      console.error('useNewsItem: Error liking news:', err);
      setError(err.message || 'Erro ao curtir notícia');
      return false;
    }
  };

  const addCommentToItem = async (text: string): Promise<boolean> => {
    if (!user || !newsItem) return false;

    try {
      await commentService.addComment(newsId, user.id, text);
      
      // Recarregar comentários após adicionar
      const commentsWithReplies = await getNewsComments(newsId);
      const processedComments = await processComments(commentsWithReplies);

      setNewsItem(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          comments: processedComments
        };
      });

      return true;
    } catch (err: any) {
      console.error('useNewsItem: Error adding comment:', err);
      setError(err.message || 'Erro ao adicionar comentário');
      return false;
    }
  };

  const addReplyToItem = async (parentCommentId: string, text: string): Promise<boolean> => {
    if (!user || !newsItem) return false;

    try {
      await commentService.addReply(newsId, user.id, parentCommentId, text);
      
      // Recarregar comentários após adicionar reply
      const commentsWithReplies = await getNewsComments(newsId);
      const processedComments = await processComments(commentsWithReplies);

      setNewsItem(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          comments: processedComments
        };
      });

      return true;
    } catch (err: any) {
      console.error('useNewsItem: Error adding reply:', err);
      setError(err.message || 'Erro ao adicionar resposta');
      return false;
    }
  };

  const likeCommentItem = async (commentId: string): Promise<boolean> => {
  if (!user) {
    setError('Usuário não autenticado');
    return false;
  }

  if (!newsItem) return false;

  try {
    const result = await likeService.likeComment(commentId, user.id);

    console.log('🔄 useNewsItem: Resultado do like no comentário:', {
      commentId,
      userId: user.id,
      result,
      liked: result.liked
    });

    if (result.liked !== undefined) {
      // Update otimista no estado local para o comentário
      setNewsItem(prev => {
        if (!prev) return prev;

        const updateCommentLikes = (comments: ExtendedComment[]): ExtendedComment[] => {
          return comments.map(comment => {
            // Verificar se é o comentário principal
            if (comment.id === commentId) {
              const currentLikes = comment.likes || 0;
              const updatedLikes = result.liked ? currentLikes + 1 : Math.max(0, currentLikes - 1);
              
              console.log('📝 Atualizando like do comentário principal:', {
                commentId,
                oldLikes: currentLikes,
                newLikes: updatedLikes
              });

              return {
                ...comment,
                likes: updatedLikes
              };
            }

            // Verificar nas replies
            if (comment.replies && comment.replies.length > 0) {
              const updatedReplies = comment.replies.map(reply => {
                if (reply.id === commentId) {
                  const currentLikes = reply.likes || 0;
                  const updatedLikes = result.liked ? currentLikes + 1 : Math.max(0, currentLikes - 1);
                  
                  console.log('📝 Atualizando like da reply:', {
                    commentId,
                    oldLikes: currentLikes,
                    newLikes: updatedLikes
                  });

                  return {
                    ...reply,
                    likes: updatedLikes
                  };
                }
                return reply;
              });

              return {
                ...comment,
                replies: updatedReplies
              };
            }

            return comment;
          });
        };

        return {
          ...prev,
          comments: prev.comments ? updateCommentLikes(prev.comments) : []
        };
      });

      return true;
    }
    return false;
  } catch (err: any) {
    console.error('useNewsItem: Error liking comment:', err);
    setError(err.message || 'Erro ao curtir comentário');
    return false;
  }
};

  // Função para atualizar o estado local baseado em dados externos
  const updateNewsItem = (updatedNews: ExtendedNews) => {
    if (updatedNews.id === newsId) {
      console.log('🔄 useNewsItem: Sincronizando estado com dados externos', {
        newsId,
        likes: updatedNews.likes,
        liked_by: updatedNews.liked_by
      });
      setNewsItem(updatedNews);
    }
  };

  useEffect(() => {
    loadNewsItem();
  }, [newsId, user]);

  const clearError = () => {
    setError(null);
  };

  return {
    newsItem,
    loading,
    error,
    likeNewsItem,
    likeCommentItem,
    addComment: addCommentToItem,
    addReply: addReplyToItem,
    refetch: loadNewsItem,
    updateNewsItem, // Nova função para sincronização
    clearError
  };
};