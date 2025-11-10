// src/services/passwordRecoveryService.ts
import api from './api';

export const passwordRecoveryService = {
  // 🔹 Buscar usuário por email (sem autenticação)
  async getUserByEmailForRecovery(email: string): Promise<any | null> {
    try {
      console.log('🔍 [Recovery] Buscando usuário por email:', email);
      
      const { data } = await api.post('/api/users/searchByEmail', {
        email: email.toLowerCase()
      });
      
      if (data) {
        console.log('✅ [Recovery] Usuário encontrado:', data.id, data.email);
      } else {
        console.log('❌ [Recovery] Usuário não encontrado para email:', email);
      }
      
      return data || null;
    } catch (error: any) {
      console.error('❌ Erro ao buscar usuário por email para recovery:', error);
      
      if (error.response?.status === 404) {
        return null; // Usuário não encontrado
      }
      
      throw new Error('Erro ao buscar usuário por email');
    }
  },

  // 🔹 Atualizar senha do usuário (sem autenticação)
  async updatePasswordForRecovery(userId: string, newPassword: string): Promise<any> {
    console.log(`🔐 [Recovery] Atualizando senha do usuário ${userId}`);
    
    const { data } = await api.post(`/api/users/forgotPassword/${userId}`, {
      password: newPassword
    });
    
    console.log(`✅ [Recovery] Senha do usuário ${userId} atualizada com sucesso`);
    return data;
  },

  // 🔹 Gerar código de verificação
  generateRecoveryCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  },

  // 🔹 Processo completo de recuperação de senha
  async processPasswordRecovery(email: string, newPassword: string): Promise<boolean> {
    try {
      console.log('🔄 [Recovery] Iniciando processo de recuperação de senha para:', email);
      
      // 1. Buscar usuário por email
      const user = await this.getUserByEmailForRecovery(email);
      
      if (!user) {
        console.log('❌ [Recovery] Usuário não encontrado');
        return false;
      }
      
      // 2. Atualizar senha
      await this.updatePasswordForRecovery(user.id, newPassword);
      
      console.log('✅ [Recovery] Processo de recuperação concluído com sucesso');
      return true;
      
    } catch (error: any) {
      console.error('❌ Erro no processo de recuperação de senha:', error);
      throw new Error('Falha no processo de recuperação de senha');
    }
  }
};