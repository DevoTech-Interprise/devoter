import api from './api';

export interface CreateCommentData {
  notice_id: string;
  user_id: string;
  content: string;
  parent_id?: string | null;
}

export interface Comment {
  id: string;
  notice_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  likes_count: string;
  created_at: string;
  updated_at: string;
  user_name?: string;
  replies?: Comment[];
}

export interface CommentResponse {
  message: string;
}

export interface CommentWithReplies {
  comment: Comment;
  reply: Comment[];
}

class CommentService {
  // Criar comentário
  async createComment(data: CreateCommentData): Promise<CommentResponse> {
    try {
      const response = await api.post('/api/comments', data);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar comentário:', error);
      throw error;
    }
  }

  // Buscar comentários de uma notícia
  async getCommentsByNotice(noticeId: string): Promise<CommentWithReplies[]> {
    try {
      const response = await api.get(`/api/comments/notice/${noticeId}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar comentários:', error);
      throw error;
    }
  }

  // Adicionar comentário principal
  async addComment(noticeId: string, userId: string, content: string): Promise<CommentResponse> {
    return this.createComment({
      notice_id: noticeId,
      user_id: userId,
      content: content
    });
  }

  // Adicionar resposta a comentário
  async addReply(noticeId: string, userId: string, parentId: string, content: string): Promise<CommentResponse> {
  return this.createComment({
    notice_id: noticeId,
    user_id: userId,
    parent_id: parentId,
    content: content
  });
}
}

export const commentService = new CommentService();