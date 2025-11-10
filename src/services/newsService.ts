// src/services/newsService.ts
export interface News {
  id: string;
  title: string;
  body: string;
  image: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  campaign_id?: string | number | null | undefined;
  likes: number;
  liked_by: string[]; // IDs dos usuários que curtiram
  comments: Comment[];
}

export interface Comment {
  id: string;
  user_id: string;
  user_name: string;
  text: string;
  created_at: string;
}

class NewsService {
  private news: News[] = [];
  private currentId = 1;

  constructor() {
    // Dados mockados iniciais
    this.initializeMockData();
  }

  private initializeMockData() {
    this.news = [
      {
        id: '1',
        title: 'Lançamento do Novo Sistema',
        body: '<p>Estamos felizes em anunciar o lançamento do nosso novo sistema de gerenciamento. Esta atualização traz diversas melhorias e novas funcionalidades.</p>',
        image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
        created_by: '1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        campaign_id: 'campaign-1',
        likes: 15,
        liked_by: ['1', '2', '3'],
        comments: [
          {
            id: '1',
            user_id: '2',
            user_name: 'Maria Silva',
            text: 'Excelente notícia! Estava ansioso por essa atualização.',
            created_at: new Date(Date.now() - 3600000).toISOString()
          },
          {
            id: '2',
            user_id: '3',
            user_name: 'João Santos',
            text: 'Parabéns pela iniciativa!',
            created_at: new Date(Date.now() - 1800000).toISOString()
          }
        ]
      },
      {
        id: '2',
        title: 'Campanha de Verão 2024',
        body: '<p>Participe da nossa campanha de verão com condições especiais e novidades exclusivas.</p>',
        image: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
        created_by: '2',
        created_at: new Date(Date.now() - 86400000).toISOString(),
        updated_at: new Date(Date.now() - 86400000).toISOString(),
        campaign_id: 'campaign-2',
        likes: 8,
        liked_by: ['1', '4'],
        comments: [
          {
            id: '3',
            user_id: '1',
            user_name: 'Admin',
            text: 'Não perca essa oportunidade!',
            created_at: new Date(Date.now() - 7200000).toISOString()
          }
        ]
      }
    ];
    this.currentId = 3;
  }

  // Simular delay de API
  private async delay(ms: number = 500): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Buscar todas as notícias
  async getAllNews(): Promise<News[]> {
    await this.delay(300);
    return [...this.news].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  // Buscar notícia por ID
  async getNewsById(id: string): Promise<News | null> {
    await this.delay(200);
    const news = this.news.find(item => item.id === id);
    return news || null;
  }

  // Criar nova notícia
  async createNews(newsData: Omit<News, 'id' | 'created_at' | 'updated_at' | 'likes' | 'liked_by' | 'comments'>): Promise<News> {
    await this.delay(400);
    
    const newNews: News = {
      ...newsData,
      id: this.currentId.toString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      likes: 0,
      liked_by: [],
      comments: []
    };

    this.news.push(newNews);
    this.currentId++;
    
    return newNews;
  }

  // Atualizar notícia
  async updateNews(id: string, newsData: Partial<Omit<News, 'id' | 'created_at' | 'likes' | 'liked_by' | 'comments'>>): Promise<News | null> {
    await this.delay(400);
    
    const index = this.news.findIndex(item => item.id === id);
    if (index === -1) return null;

    this.news[index] = {
      ...this.news[index],
      ...newsData,
      updated_at: new Date().toISOString()
    };

    return this.news[index];
  }

  // Excluir notícia
  async deleteNews(id: string): Promise<boolean> {
    await this.delay(300);
    
    const index = this.news.findIndex(item => item.id === id);
    if (index === -1) return false;

    this.news.splice(index, 1);
    return true;
  }

  // Adicionar like
  async likeNews(newsId: string, userId: string): Promise<News | null> {
    await this.delay(200);
    
    const news = this.news.find(item => item.id === newsId);
    if (!news) return null;

    const hasLiked = news.liked_by.includes(userId);
    
    if (hasLiked) {
      // Remove like
      news.liked_by = news.liked_by.filter(id => id !== userId);
      news.likes = Math.max(0, news.likes - 1);
    } else {
      // Adiciona like
      news.liked_by.push(userId);
      news.likes++;
    }

    return news;
  }

  // Adicionar comentário
  async addComment(newsId: string, comment: Omit<Comment, 'id' | 'created_at'>): Promise<News | null> {
    await this.delay(300);
    
    const news = this.news.find(item => item.id === newsId);
    if (!news) return null;

    const newComment: Comment = {
      ...comment,
      id: Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString()
    };

    news.comments.unshift(newComment);
    return news;
  }

  // Buscar notícias por campanha
  async getNewsByCampaign(campaignId: string): Promise<News[]> {
    await this.delay(300);
    return this.news.filter(item => item.campaign_id === campaignId);
  }
}

export const newsService = new NewsService();