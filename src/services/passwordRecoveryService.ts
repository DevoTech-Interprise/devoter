// src/services/passwordRecoveryService.ts
import api from './api';

// Cache específico para o recovery
let recoveryToken: string | null = null;
let recoveryTokenExpiry: number | null = null;

// Credenciais específicas para recovery
const RECOVERY_CREDENTIALS = {
  email: 'token@example.com',
  password: 'mudar@123'
};

export const passwordRecoveryService = {
  // 🔹 Obter token específico para recovery
  async getRecoveryToken(): Promise<string> {
    // Verifica se tem token em cache e se não expirou (30 minutos)
    if (recoveryToken && recoveryTokenExpiry && Date.now() < recoveryTokenExpiry) {
      console.log('🔄 Usando token de recovery em cache');
      return recoveryToken;
    }

    console.log('🔄 Obtendo novo token de recovery...');
    
    try {
      const response = await api.post('api/auth/login', {
        email: RECOVERY_CREDENTIALS.email,
        password: RECOVERY_CREDENTIALS.password
      });

      if (!response.data.access_token) {
        throw new Error('Token não encontrado na resposta');
      }

      const token = response.data.access_token;
      
      // Cache o token por 30 minutos (apenas para recovery)
      recoveryToken = token;
      recoveryTokenExpiry = Date.now() + 30 * 60 * 1000;
      
      console.log('✅ Token de recovery obtido com sucesso');
      return token;
    } catch (error: any) {
      console.error('❌ Erro ao obter token de recovery:', error);
      
      if (error.response?.status === 401) {
        throw new Error('Credenciais do usuário recovery inválidas.');
      }
      
      throw new Error('Erro ao conectar com o servidor para recovery');
    }
  },

  // 🔹 Buscar TODOS os usuários (apenas para recovery)
  async getAllUsersForRecovery(): Promise<any[]> {
    try {
      const token = await passwordRecoveryService.getRecoveryToken();
      
      const { data } = await api.get('api/auth', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      console.log('✅ Usuários carregados para recovery:', data.length);
      return data;
    } catch (error: any) {
      console.error('❌ Erro ao buscar usuários para recovery:', error);
      
      // Se for erro de autenticação, limpa o cache
      if (error.response?.status === 401) {
        recoveryToken = null;
        recoveryTokenExpiry = null;
        throw new Error('Token de recovery expirado');
      }
      
      throw new Error('Erro ao carregar lista de usuários para recovery');
    }
  },

  // 🔹 Buscar usuário por email (apenas para recovery)
  async getUserByEmailForRecovery(email: string): Promise<any | null> {
    try {
      console.log('🔍 [Recovery] Buscando usuário por email:', email);
      
      const allUsers = await passwordRecoveryService.getAllUsersForRecovery();
      
      console.log('📋 [Recovery] Total de usuários encontrados:', allUsers.length);
      
      const user = allUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
      
      if (user) {
        console.log('✅ [Recovery] Usuário encontrado:', user.id, user.email);
      } else {
        console.log('❌ [Recovery] Usuário não encontrado para email:', email);
      }
      
      return user || null;
    } catch (error: any) {
      console.error('❌ Erro ao buscar usuário por email para recovery:', error);
      throw error;
    }
  },

  // 🔹 Atualizar senha do usuário (apenas para recovery)
  async updatePasswordForRecovery(userId: string, newPassword: string): Promise<any> {
    console.log(`🔐 [Recovery] Atualizando senha do usuário ${userId}`);
    
    const token = await passwordRecoveryService.getRecoveryToken();
    
    const { data } = await api.put(`api/auth/${userId}`, {
      password: newPassword
    }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    console.log(`✅ [Recovery] Senha do usuário ${userId} atualizada com sucesso`);
    return data;
  },

  // 🔹 Gerar código de verificação (apenas para recovery)
  generateRecoveryCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  },

  // 🔹 Limpar cache do recovery token
  clearRecoveryToken(): void {
    recoveryToken = null;
    recoveryTokenExpiry = null;
    console.log('🧹 Cache do token de recovery limpo');
  }
};