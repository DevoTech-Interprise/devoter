// src/services/newsService.ts
import api from './api';

export interface Comment {
  id: string;
  user_id: string;
  user_name: string;
  text: string;
  created_at: string;
  user_avatar?: string;
  is_reply?: boolean;
  likes?: number;
  replies?: Comment[];
  parent_id?: string | null;
  is_loading?: boolean;
}

export interface News {
  id: string;
  title: string;
  preview: string;
  image: string;
  content: string;
  campaign_id: string | number | null | undefined;
  created_by: string;
  created_at: string;
  updated_at: string;
  likes?: number;
  liked_by?: string[];
  comments?: Comment[];
}

export interface CreateNewsData {
  title: string;
  preview: string;
  image?: File;
  content: string;
  campaign_id: string | number | null | undefined;
  created_by: string;
}

export interface UpdateNewsData {
  title?: string;
  preview?: string;
  image?: File;
  content?: string;
  campaign_id?: string | number | null | undefined;
}

class NewsService {
  getAll() {
    throw new Error('Method not implemented.');
  }
  
  // Buscar todas as notícias
  async getAllNews(): Promise<News[]> {
    try {
      const response = await api.get('/api/notices');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar notícias:', error);
      throw error;
    }
  }

  // Buscar notícia por ID
  async getNewsById(id: string): Promise<News> {
    try {
      const response = await api.get(`/api/notices/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Erro ao buscar notícia ${id}:`, error);
      throw error;
    }
  }

  // Criar nova notícia
  async createNews(newsData: CreateNewsData): Promise<News> {
    try {
      const formData = new FormData();
      
      // Adiciona campos textuais
      formData.append('title', newsData.title);
      formData.append('preview', newsData.preview);
      formData.append('content', newsData.content);
      formData.append('campaign_id', newsData.campaign_id?.toString() || '');
      formData.append('created_by', newsData.created_by);
      
      // Adiciona imagem se existir
      if (newsData.image) {
        formData.append('image', newsData.image);
      }

      const response = await api.post('/api/notices', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data;
    } catch (error) {
      console.error('Erro ao criar notícia:', error);
      throw error;
    }
  }

  // Atualizar notícia
  async updateNews(id: string, newsData: UpdateNewsData): Promise<News> {
    try {
      const formData = new FormData();
      
      // Adiciona campos textuais se existirem
      if (newsData.title) formData.append('title', newsData.title);
      if (newsData.preview) formData.append('preview', newsData.preview);
      if (newsData.content) formData.append('content', newsData.content);
      if (newsData.campaign_id) formData.append('campaign_id', newsData.campaign_id.toString());
      
      // Adiciona imagem se existir
      if (newsData.image) {
        formData.append('image', newsData.image);
      }

      const response = await api.post(`/api/notices/update/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data;
    } catch (error) {
      console.error(`Erro ao atualizar notícia ${id}:`, error);
      throw error;
    }
  }

  // Excluir notícia
  async deleteNews(id: string): Promise<{ message: string }> {
    try {
      const response = await api.delete(`/api/notices/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Erro ao excluir notícia ${id}:`, error);
      throw error;
    }
  }

  // Buscar notícias por campanha
  async getNewsByCampaign(campaignId: string): Promise<News[]> {
    try {
      const allNews = await this.getAllNews();
      return allNews.filter(item => item.campaign_id?.toString() === campaignId);
    } catch (error) {
      console.error(`Erro ao buscar notícias da campanha ${campaignId}:`, error);
      throw error;
    }
  }

  // Métodos opcionais - se sua API tiver endpoints para likes e comentários
  // Adicionar like (se a API suportar)
  async likeNews(newsId: string, _userId: string): Promise<News> {
    try {
      // Se sua API tiver endpoint para likes, implemente aqui
      // Por enquanto, vamos apenas buscar a notícia atualizada
      return await this.getNewsById(newsId);
    } catch (error) {
      console.error(`Erro ao dar like na notícia ${newsId}:`, error);
      throw error;
    }
  }

  // Adicionar comentário (se a API suportar)
  async addComment(newsId: string, _comment: Omit<Comment, 'id' | 'created_at'>): Promise<News> {
    try {
      // Se sua API tiver endpoint para comentários, implemente aqui
      // Por enquanto, vamos apenas buscar a notícia atualizada
      return await this.getNewsById(newsId);
    } catch (error) {
      console.error(`Erro ao adicionar comentário na notícia ${newsId}:`, error);
      throw error;
    }
  }

  // Upload de imagem separado (se necessário)
  async uploadImage(imageFile: File): Promise<{ imageUrl: string }> {
    try {
      const formData = new FormData();
      formData.append('image', imageFile);

      const response = await api.post('/api/upload/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data;
    } catch (error) {
      console.error('Erro ao fazer upload de imagem:', error);
      throw error;
    }
  }


  
}

export const newsService = new NewsService();