import api from './api';

export interface LikeToggleData {
  user_id: string;
  notice_id?: string;
  comment_id?: string;
}

export interface LikeResponse {
  liked?: boolean;
  message?: string;
}

export interface NoticeLikesResponse {
  status: string;
  notice_likes_count: number;
  total_likes_count: number;
  comments_likes: any[];
  likes: any[];
}

class LikeService {
  // Toggle like em notícia ou comentário
  async toggleLike(data: LikeToggleData): Promise<LikeResponse> {
    try {
      const response = await api.post('/api/likes/toggle', data);
      return response.data;
    } catch (error) {
      console.error('Erro ao alternar like:', error);
      throw error;
    }
  }

  // Buscar likes de uma notícia
  async getNoticeLikes(noticeId: string, userId: string): Promise<NoticeLikesResponse> {
    try {
      const response = await api.get(`/api/likes/notice/${noticeId}`, {
        params: { user_id: userId }
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar likes da notícia:', error);
      throw error;
    }
  }

  // Like em notícia
  async likeNotice(noticeId: string, userId: string): Promise<LikeResponse> {
    return this.toggleLike({
      user_id: userId,
      notice_id: noticeId
    });
  }

  // Like em comentário
  async likeComment(commentId: string, userId: string): Promise<LikeResponse> {
    return this.toggleLike({
      user_id: userId,
      comment_id: commentId
    });
  }
}

export const likeService = new LikeService();