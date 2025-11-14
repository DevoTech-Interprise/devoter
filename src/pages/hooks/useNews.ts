// src/hooks/useNews.ts
import { useState, useEffect } from 'react';
import { type News, newsService, type Comment } from '../../services/newsService';
import type { NewsFormData, CommentFormData } from '../../schemas/news';
import { useUser } from '../../context/UserContext';
import { likeService } from '../../services/likeService';
import { commentService, type CommentWithReplies } from '../../services/commentService';
import { userService } from '../../services/userService';

// Interface extendida para suportar as propriedades extras
interface ExtendedComment extends Comment {
  user_avatar?: string;
  is_reply?: boolean;
  likes?: number;
  replies?: ExtendedComment[];
  parent_id?: string | null;
  is_loading?: boolean;
}

interface ExtendedNews extends News {
  comments?: ExtendedComment[];
  commentsCount?: number; // ⬅️ Adicione esta linha
}

export const useNews = () => {
  const [news, setNews] = useState<ExtendedNews[]>([]);
  const [currentNews, setCurrentNews] = useState<ExtendedNews | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useUser();

  const loadNews = async () => {
    setLoading(true);
    setError(null);
    try {
      const newsWithCounters = await loadNewsWithCounters();
      setNews(newsWithCounters);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar notícias');
      console.error('Error loading news:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNews();
  }, [user?.campaign_id]);

  const refreshNews = async (): Promise<void> => {
    await loadNews();
  };

  // CORREÇÃO: Buscar likes de uma notícia - versão corrigida
  const getNewsLikes = async (newsId: string) => {
    if (!user) {
      console.warn('Usuário não autenticado, não é possível carregar likes');
      return null;
    }

    try {
      console.log('🔄 Buscando likes para notícia:', newsId, 'usuário:', user.id);
      const likesData = await likeService.getNoticeLikes(newsId, user.id);
      console.log('❤️ Likes carregados com sucesso:', {
        newsId,
        likesCount: likesData?.notice_likes_count,
        userLiked: likesData?.likes?.some((like: any) => like.user_id === user.id),
        data: likesData
      });
      return likesData;
    } catch (err: any) {
      console.error('❌ Erro detalhado ao buscar likes:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        newsId,
        userId: user.id
      });
      // Não lançar erro aqui, apenas logar e retornar null
      return null;
    }
  };

  const likeNews = async (newsId: string): Promise<boolean> => {
  if (!user) {
    setError('Usuário não autenticado');
    return false;
  }

  try {
    const result = await likeService.likeNotice(newsId, user.id);

    console.log('🔄 Resultado do like:', {
      newsId,
      userId: user.id,
      result,
      liked: result.liked
    });

    if (result.liked !== undefined) {
      // Atualizar a notícia na lista PRIMEIRO
      setNews(prevNews =>
        prevNews.map(newsItem => {
          if (newsItem.id === newsId) {
            const currentLikes = newsItem.likes || 0;
            const currentLikedBy = newsItem.liked_by || [];

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

            console.log('📝 Atualizando notícia na lista:', {
              newsId,
              oldLikes: currentLikes,
              newLikes: updatedLikes,
              oldLikedBy: currentLikedBy,
              newLikedBy: updatedLikedBy
            });

            return {
              ...newsItem,
              likes: updatedLikes,
              liked_by: updatedLikedBy
            };
          }
          return newsItem;
        })
      );

      // ⬅️ CORREÇÃO CRÍTICA: Atualizar o currentNews APENAS se for a notícia atual
      // Isso evita que o like de uma notícia afete outra
      if (currentNews && currentNews.id === newsId) {
        const currentLikes = currentNews.likes || 0;
        const currentLikedBy = currentNews.liked_by || [];

        let updatedLikedBy;
        let updatedLikes;

        if (result.liked) {
          updatedLikedBy = [...currentLikedBy, user.id];
          updatedLikes = currentLikes + 1;
        } else {
          updatedLikedBy = currentLikedBy.filter(id => id !== user.id);
          updatedLikes = Math.max(0, currentLikes - 1);
        }

        console.log('📝 Atualizando currentNews específico:', {
          newsId,
          currentNewsId: currentNews.id,
          oldLikes: currentLikes,
          newLikes: updatedLikes
        });

        setCurrentNews(prev => ({
          ...prev!,
          likes: updatedLikes,
          liked_by: updatedLikedBy
        }));
      }

      return true;
    }
    return false;
  } catch (err: any) {
    console.error('Error liking news:', err);
    setError(err.message || 'Erro ao curtir notícia');
    return false;
  }
};
  // CORREÇÃO: Função getNewsById melhorada com fallback
  const getNewsById = async (id: string): Promise<News | null> => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔄 Iniciando carregamento da notícia:', id);
      const newsItem = await newsService.getNewsById(id);

      // Verificar se o usuário tem acesso a esta notícia
      if (user && user.role !== 'super' && user.campaign_id && newsItem?.campaign_id) {
        if (newsItem.campaign_id.toString() !== user.campaign_id.toString()) {
          throw new Error('Você não tem acesso a esta notícia');
        }
      }

      // Carregar dados adicionais (likes e comentários) em paralelo
      let likesData = null;
      let commentsData: ExtendedComment[] = [];

      try {
        console.log('🔄 Carregando dados adicionais em paralelo...');

        // CORREÇÃO: Usar Promise.allSettled corretamente
        const [likesResult, commentsResult] = await Promise.allSettled([
          getNewsLikes(id),
          getNewsComments(id)
        ]);

        // Processar likes
        if (likesResult.status === 'fulfilled') {
          likesData = likesResult.value;
          console.log('✅ Likes carregados:', likesData);
        } else {
          console.warn('⚠️ Falha ao carregar likes:', likesResult.reason);
        }

        // Processar comentários
        if (commentsResult.status === 'fulfilled') {
          const commentsWithReplies = commentsResult.value;

          // Buscar informações dos usuários para os comentários
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

          commentsData = commentsWithReplies.flatMap(commentWithReplies => {
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
          console.log('✅ Comentários carregados:', commentsData.length);
        } else {
          console.warn('⚠️ Falha ao carregar comentários:', commentsResult.reason);
        }
      } catch (err) {
        console.error('❌ Erro ao carregar dados adicionais:', err);
      }

      // CORREÇÃO: Garantir que os likes não sejam undefined
      const newsWithDetails: ExtendedNews = {
        ...newsItem,
        likes: likesData?.notice_likes_count || 0,
        liked_by: likesData?.likes?.map((like: any) => like.user_id) || [],
        comments: commentsData
      };

      console.log('📰 Notícia carregada com detalhes:', {
        id: newsWithDetails.id,
        title: newsWithDetails.title,
        likes: newsWithDetails.likes,
        liked_by: newsWithDetails.liked_by,
        commentsCount: newsWithDetails.comments?.length || 0
      });

      setCurrentNews(newsWithDetails);
      return newsItem;
    } catch (err: any) {
      console.error('❌ Error getting news by id:', err);
      setError(err.message || 'Erro ao buscar notícia');
      throw new Error(err.message || 'Erro ao buscar notícia');
    } finally {
      setLoading(false);
    }
  };

  const loadNewsWithCounters = async (): Promise<ExtendedNews[]> => {
    if (!user) {
      console.log('⏳ Aguardando usuário para carregar notícias');
      return [];
    }

    try {
      const newsData = await newsService.getAllNews();

      // Filtrar notícias por campanha
      let filteredNews = newsData;
      if (user && user.role !== 'super' && user.campaign_id) {
        filteredNews = newsData.filter(item =>
          item.campaign_id?.toString() === user.campaign_id?.toString() || !item.campaign_id
        );
      }

      // Carregar apenas contadores de likes e comentários
      const newsWithCounters = await Promise.all(
        filteredNews.map(async (newsItem): Promise<ExtendedNews> => {
          let likesCount = 0;
          let commentsCount = 0;
          let likedBy: string[] = []; // ⬅️ ADICIONE ESTA LINHA

          try {
            // Carregar contador de likes E a lista de quem curtiu
            if (user) {
              try {
                const likesData = await getNewsLikes(newsItem.id);
                likesCount = likesData?.notice_likes_count || 0;

                // ⬅️ ADICIONE ESTAS LINHAS: Carregar a lista de usuários que curtiram
                if (likesData?.likes) {
                  likedBy = likesData.likes.map((like: any) => like.user_id);
                }

                console.log(`❤️ Notícia ${newsItem.id}: ${likesCount} likes, liked_by:`, likedBy);
              } catch (err) {
                console.warn(`⚠️ Erro ao carregar likes da notícia ${newsItem.id}:`, err);
              }
            }

            // Carregar contador de comentários
            try {
              const commentsWithReplies = await getNewsComments(newsItem.id);

              // Calcular total de comentários + replies corretamente
              commentsCount = commentsWithReplies.reduce((total, commentWithReplies) => {
                return total + 1 + (commentWithReplies.reply?.length || 0);
              }, 0);

              console.log(`💬 Notícia ${newsItem.id}: ${commentsWithReplies.length} comentários principais + ${commentsWithReplies.reduce((sum, c) => sum + (c.reply?.length || 0), 0)} replies = ${commentsCount} total`);

            } catch (err) {
              console.warn(`⚠️ Erro ao carregar comentários da notícia ${newsItem.id}:`, err);
            }
          } catch (err) {
            console.error(`❌ Erro ao carregar contadores da notícia ${newsItem.id}:`, err);
          }

          return {
            ...newsItem,
            likes: likesCount,
            liked_by: likedBy, // ⬅️ GARANTIR QUE liked_by ESTÁ SENDO SETADO
            comments: [], // Não carregamos os comentários completos
            commentsCount: commentsCount
          };
        })
      );

      console.log('📰 Notícias carregadas com contadores:', newsWithCounters.map(item => ({
        id: item.id,
        title: item.title,
        likes: item.likes,
        liked_by: item.liked_by, // ⬅️ VERIFICAR SE liked_by ESTÁ PRESENTE
        commentsCount: item.commentsCount
      })));

      return newsWithCounters;
    } catch (err: any) {
      console.error('❌ Erro ao carregar notícias com contadores:', err);
      throw err;
    }
  };

  const createNews = async (newsData: NewsFormData): Promise<boolean> => {
    if (!user) {
      setError('Usuário não autenticado');
      return false;
    }

    setLoading(true);
    setError(null);
    try {
      await newsService.createNews({
        title: newsData.title,
        preview: newsData.preview,
        content: newsData.content,
        image: newsData.image,
        created_by: user.id,
        campaign_id: user.campaign_id || undefined
      });

      await loadNews();
      return true;
    } catch (err: any) {
      setError(err.message || 'Erro ao criar notícia');
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

      await newsService.updateNews(id, {
        title: newsData.title,
        preview: newsData.preview,
        content: newsData.content,
        image: newsData.image,
        campaign_id: user.role === 'super' ? newsData.campaign_id : user.campaign_id
      });

      await loadNews();
      return true;
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar notícia');
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

      await newsService.deleteNews(id);
      await loadNews();
      return true;
    } catch (err: any) {
      setError(err.message || 'Erro ao excluir notícia');
      console.error('Error deleting news:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Buscar notícias por campanha (apenas para super users)
  const getNewsByCampaign = async (campaignId: string): Promise<News[]> => {
    if (!user || user.role !== 'super') {
      throw new Error('Apenas super usuários podem buscar notícias por campanha');
    }

    try {
      return await newsService.getNewsByCampaign(campaignId);
    } catch (err: any) {
      console.error('Error getting news by campaign:', err);
      throw new Error(err.message || 'Erro ao buscar notícias por campanha');
    }
  };

  // Buscar comentários de uma notícia
  const getNewsComments = async (newsId: string): Promise<CommentWithReplies[]> => {
    try {
      const commentsWithReplies = await commentService.getCommentsByNotice(newsId);

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

      // Adicionar informações de usuário aos comentários
      return commentsWithReplies.map(commentWithReplies => {
        const mainUser = users.find(u => String(u.id) === String(commentWithReplies.comment.user_id));

        return {
          comment: {
            ...commentWithReplies.comment,
            user_name: mainUser?.name || 'Usuário'
          },
          reply: commentWithReplies.reply.map(reply => {
            const replyUser = users.find(u => String(u.id) === String(reply.user_id));
            return {
              ...reply,
              user_name: replyUser?.name || 'Usuário'
            };
          })
        };
      });
    } catch (err: any) {
      console.error('Error getting news comments:', err);
      throw new Error(err.message || 'Erro ao buscar comentários da notícia');
    }
  };

  // Adicionar comentário
  const addComment = async (newsId: string, commentData: CommentFormData): Promise<boolean> => {
    if (!user) {
      setError('Usuário não autenticado');
      return false;
    }

    try {
      // Update otimista
      setNews(prevNews =>
        prevNews.map(newsItem => {
          if (newsItem.id === newsId) {
            const tempComment: ExtendedComment = {
              id: `temp-${Date.now()}`,
              user_id: user.id,
              user_name: user.name,
              user_avatar: user.name?.charAt(0).toUpperCase() || 'U',
              text: commentData.text,
              created_at: new Date().toISOString(),
              is_reply: false,
              likes: 0,
              replies: [],
              is_loading: true
            };

            return {
              ...newsItem,
              comments: [tempComment, ...(newsItem.comments || [])]
            };
          }
          return newsItem;
        })
      );

      // Atualizar também currentNews se for a notícia atual
      if (currentNews && currentNews.id === newsId) {
        setCurrentNews(prev => {
          if (!prev) return prev;
          const tempComment: ExtendedComment = {
            id: `temp-${Date.now()}`,
            user_id: user.id,
            user_name: user.name,
            user_avatar: user.name?.charAt(0).toUpperCase() || 'U',
            text: commentData.text,
            created_at: new Date().toISOString(),
            is_reply: false,
            likes: 0,
            replies: [],
            is_loading: true
          };

          return {
            ...prev,
            comments: [tempComment, ...(prev.comments || [])]
          };
        });
      }

      await commentService.addComment(newsId, user.id, commentData.text);

      // Recarregar comentários para obter dados reais
      const commentsWithReplies = await getNewsComments(newsId);

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

      const formattedComments: ExtendedComment[] = commentsWithReplies.flatMap(commentWithReplies => {
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

      // Atualizar com dados reais
      setNews(prevNews =>
        prevNews.map(newsItem => {
          if (newsItem.id === newsId) {
            return {
              ...newsItem,
              comments: formattedComments
            };
          }
          return newsItem;
        })
      );

      // Atualizar também currentNews
      if (currentNews && currentNews.id === newsId) {
        setCurrentNews(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            comments: formattedComments
          };
        });
      }

      return true;
    } catch (err: any) {
      console.error('Error adding comment:', err);
      setError(err.message || 'Erro ao adicionar comentário');

      // Reverter update otimista
      setNews(prevNews =>
        prevNews.map(newsItem => {
          if (newsItem.id === newsId) {
            return {
              ...newsItem,
              comments: newsItem.comments?.filter(comment => !comment.is_loading) || []
            };
          }
          return newsItem;
        })
      );

      // Reverter também currentNews
      if (currentNews && currentNews.id === newsId) {
        setCurrentNews(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            comments: prev.comments?.filter(comment => !comment.is_loading) || []
          };
        });
      }

      return false;
    }
  };

  // Adicionar resposta a comentário
  const addReply = async (newsId: string, parentCommentId: string, commentData: CommentFormData): Promise<boolean> => {
    if (!user) {
      setError('Usuário não autenticado');
      return false;
    }

    try {
      await commentService.addReply(newsId, user.id, parentCommentId, commentData.text);

      // Atualizar o estado local imediatamente (otimistic update)
      setNews(prevNews =>
        prevNews.map(newsItem => {
          if (newsItem.id === newsId) {
            const updatedComments = newsItem.comments?.map(comment => {
              if (comment.id === parentCommentId) {
                // Criar um reply temporário enquanto carrega os dados reais
                const tempReply: ExtendedComment = {
                  id: `temp-${Date.now()}`,
                  user_id: user.id,
                  user_name: user.name,
                  user_avatar: user.name?.charAt(0).toUpperCase() || 'U',
                  text: commentData.text,
                  created_at: new Date().toISOString(),
                  is_reply: true,
                  parent_id: parentCommentId,
                  likes: 0,
                  is_loading: true
                };

                return {
                  ...comment,
                  replies: [...(comment.replies || []), tempReply]
                };
              }
              return comment;
            });

            return {
              ...newsItem,
              comments: updatedComments
            };
          }
          return newsItem;
        })
      );

      // Atualizar também currentNews
      if (currentNews && currentNews.id === newsId) {
        setCurrentNews(prev => {
          if (!prev) return prev;
          const updatedComments = prev.comments?.map(comment => {
            if (comment.id === parentCommentId) {
              const tempReply: ExtendedComment = {
                id: `temp-${Date.now()}`,
                user_id: user.id,
                user_name: user.name,
                user_avatar: user.name?.charAt(0).toUpperCase() || 'U',
                text: commentData.text,
                created_at: new Date().toISOString(),
                is_reply: true,
                parent_id: parentCommentId,
                likes: 0,
                is_loading: true
              };

              return {
                ...comment,
                replies: [...(comment.replies || []), tempReply]
              };
            }
            return comment;
          });

          return {
            ...prev,
            comments: updatedComments
          };
        });
      }

      // Recarregar os comentários da notícia para obter os dados reais
      const commentsWithReplies = await getNewsComments(newsId);

      // Buscar informações dos usuários dos comentários
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

      // Converter a estrutura de comentários com replies para o formato esperado pelo componente
      const formattedComments: ExtendedComment[] = commentsWithReplies.flatMap(commentWithReplies => {
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

      // Atualizar com os dados reais
      setNews(prevNews =>
        prevNews.map(newsItem => {
          if (newsItem.id === newsId) {
            return {
              ...newsItem,
              comments: formattedComments
            };
          }
          return newsItem;
        })
      );

      // Atualizar também currentNews
      if (currentNews && currentNews.id === newsId) {
        setCurrentNews(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            comments: formattedComments
          };
        });
      }

      return true;
    } catch (err: any) {
      console.error('Error adding reply:', err);
      setError(err.message || 'Erro ao adicionar resposta');

      // Reverter o update otimista em caso de erro
      setNews(prevNews =>
        prevNews.map(newsItem => {
          if (newsItem.id === newsId) {
            const revertedComments = newsItem.comments?.map(comment => {
              if (comment.id === parentCommentId) {
                return {
                  ...comment,
                  replies: comment.replies?.filter(reply => !reply.is_loading) || []
                };
              }
              return comment;
            });

            return {
              ...newsItem,
              comments: revertedComments
            };
          }
          return newsItem;
        })
      );

      // Reverter também currentNews
      if (currentNews && currentNews.id === newsId) {
        setCurrentNews(prev => {
          if (!prev) return prev;
          const revertedComments = prev.comments?.map(comment => {
            if (comment.id === parentCommentId) {
              return {
                ...comment,
                replies: comment.replies?.filter(reply => !reply.is_loading) || []
              };
            }
            return comment;
          });

          return {
            ...prev,
            comments: revertedComments
          };
        });
      }

      return false;
    }
  };

  // Limpar erros
  const clearError = () => {
    setError(null);
  };

  return {
    // Estado
    news,
    currentNews,
    loading,
    error,

    // Ações CRUD
    createNews,
    updateNews,
    deleteNews,
    likeNews,
    addComment,
    addReply,
    refreshNews,

    // Buscas
    getNewsById,
    getNewsByCampaign,
    getNewsLikes,
    getNewsComments,

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