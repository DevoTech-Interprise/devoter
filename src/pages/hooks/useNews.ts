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
      const newsData = await newsService.getAllNews();

      // Filtrar notícias por campanha se o usuário não for super
      let filteredNews = newsData;

      if (user && user.role !== 'super' && user.campaign_id) {
        filteredNews = newsData.filter(item =>
          item.campaign_id?.toString() === user.campaign_id?.toString() || !item.campaign_id
        );
        console.log(`📰 Filtradas ${filteredNews.length} notícias da campanha ${user.campaign_id}`);
      }

      setNews(filteredNews as ExtendedNews[]);
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

  // ✅ ADICIONAR: Função refreshNews
  const refreshNews = async (): Promise<void> => {
    await loadNews();
  };

  // ✅ ADICIONAR: Função likeNews
  const likeNews = async (newsId: string): Promise<boolean> => {
    if (!user) {
      setError('Usuário não autenticado');
      return false;
    }

    try {
      const result = await likeService.likeNotice(newsId, user.id);

      if (result.liked !== undefined) {
        // Atualizar a notícia na lista
        setNews(prevNews =>
          prevNews.map(newsItem => {
            if (newsItem.id === newsId) {
              const currentLikes = newsItem.likes || 0;
              const currentLikedBy = newsItem.liked_by || [];

              if (result.liked) {
                // Adicionar like
                return {
                  ...newsItem,
                  likes: currentLikes + 1,
                  liked_by: [...currentLikedBy, user.id]
                };
              } else {
                // Remover like
                return {
                  ...newsItem,
                  likes: Math.max(0, currentLikes - 1),
                  liked_by: currentLikedBy.filter(id => id !== user.id)
                };
              }
            }
            return newsItem;
          })
        );

        // Atualizar também currentNews se for a notícia atual
        if (currentNews && currentNews.id === newsId) {
          setCurrentNews(prev => {
            if (!prev) return prev;
            const currentLikes = prev.likes || 0;
            const currentLikedBy = prev.liked_by || [];

            if (result.liked) {
              return {
                ...prev,
                likes: currentLikes + 1,
                liked_by: [...currentLikedBy, user.id]
              };
            } else {
              return {
                ...prev,
                likes: Math.max(0, currentLikes - 1),
                liked_by: currentLikedBy.filter(id => id !== user.id)
              };
            }
          });
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

  // Buscar notícia específica
  const getNewsById = async (id: string): Promise<News | null> => {
    try {
      const newsItem = await newsService.getNewsById(id);

      // Verificar se o usuário tem acesso a esta notícia
      if (user && user.role !== 'super' && user.campaign_id && newsItem?.campaign_id) {
        if (newsItem.campaign_id.toString() !== user.campaign_id.toString()) {
          throw new Error('Você não tem acesso a esta notícia');
        }
      }

      // Carregar dados adicionais (likes e comentários)
      let likesData = null;
      if (user) {
        try {
          likesData = await getNewsLikes(id);
        } catch (err) {
          console.error('Erro ao carregar likes:', err);
        }
      }

      let commentsData: ExtendedComment[] = [];
      try {
        const commentsWithReplies = await getNewsComments(id);
        commentsData = commentsWithReplies.flatMap(commentWithReplies => {
          const mainComment: ExtendedComment = {
            id: commentWithReplies.comment.id,
            user_id: commentWithReplies.comment.user_id,
            user_name: commentWithReplies.comment.user_name || 'Usuário',
            user_avatar: commentWithReplies.comment.user_name?.charAt(0).toUpperCase() || 'U',
            text: commentWithReplies.comment.content,
            created_at: commentWithReplies.comment.created_at,
            is_reply: false,
            likes: parseInt(commentWithReplies.comment.likes_count) || 0,
            replies: commentWithReplies.reply.map(reply => ({
              id: reply.id,
              user_id: reply.user_id,
              user_name: reply.user_name || 'Usuário',
              user_avatar: reply.user_name?.charAt(0).toUpperCase() || 'U',
              text: reply.content,
              created_at: reply.created_at,
              is_reply: true,
              parent_id: commentWithReplies.comment.id,
              likes: parseInt(reply.likes_count) || 0
            }))
          };
          return mainComment;
        });
      } catch (err) {
        console.error('Erro ao carregar comentários:', err);
      }

      const newsWithDetails: ExtendedNews = {
        ...newsItem,
        likes: likesData?.notice_likes_count || 0,
        liked_by: likesData?.likes?.map((like: any) => like.user_id) || [],
        comments: commentsData
      };


      setCurrentNews(newsWithDetails);
      return newsItem;
    } catch (err: any) {
      console.error('Error getting news by id:', err);
      throw new Error(err.message || 'Erro ao buscar notícia');
    }
  };

  // Buscar likes de uma notícia
  const getNewsLikes = async (newsId: string) => {
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    try {
      return await likeService.getNoticeLikes(newsId, user.id);
    } catch (err: any) {
      console.error('Error getting news likes:', err);
      throw new Error(err.message || 'Erro ao buscar likes da notícia');
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
    likeNews, // ✅ Agora está definida
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