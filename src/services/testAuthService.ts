// src/services/testAuthService.ts
import api from './api';

export const testAuthService = {
  // Login com usuário teste para obter token
  async getTestToken(): Promise<string> {
    try {
      console.log('🔐 Obtendo token de usuário teste...');
      
      const response = await api.post('api/auth/login', {
        email: 'token@example.com',
        password: 'mudar@123'
      });

      if (!response.data.access_token) {
        throw new Error('Token não encontrado na resposta');
      }

      const token = response.data.access_token;
      console.log('✅ Token obtido com sucesso');
      
      return token;
    } catch (error: any) {
      console.error('❌ Erro ao obter token teste:', error);
      
      if (error.response?.status === 401) {
        throw new Error('Credenciais do usuário teste inválidas. Verifique email e senha.');
      }
      
      throw new Error('Erro ao conectar com o servidor para obter token');
    }
  },

  // Verifica se o token está válido
  async validateToken(token: string): Promise<boolean> {
    try {
      // Faz uma requisição simples para verificar se o token é válido
      const response = await api.get('api/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }
};