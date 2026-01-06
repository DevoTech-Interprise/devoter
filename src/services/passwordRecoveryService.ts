// src/services/passwordRecoveryService.ts
import api from './api';
import emailjs from '@emailjs/browser';

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

  // 🔹 Enviar email com código de recuperação via EmailJS
  async sendRecoveryEmail(email: string, code: string, userName?: string): Promise<void> {
    try {
      console.log('📧 [EmailJS] Enviando código de recuperação para:', email);
      
      const templateParams = {
        to_email: email,
        to_name: userName || 'Usuário',
        recovery_code: code,
        from_name: 'Devoter',
        message: `Seu código de recuperação de senha é: ${code}`,
      };

      // Credenciais do EmailJS - configurado com SMTP smtp.titan.email
      const SERVICE_ID = 'service_cf7gvmnu'; // Seu Service ID do EmailJS
      const TEMPLATE_ID = 'YOUR_TEMPLATE_ID'; // Substitua pelo Template ID que você criar
      const PUBLIC_KEY = 'YOUR_PUBLIC_KEY'; // Sua Public Key do EmailJS

      await emailjs.send(
        SERVICE_ID,
        TEMPLATE_ID,
        templateParams,
        PUBLIC_KEY
      );
      
      console.log('✅ [EmailJS] Email de recuperação enviado com sucesso');
    } catch (error: any) {
      console.error('❌ [EmailJS] Erro ao enviar email:', error);
      throw new Error('Falha ao enviar email de recuperação');
    }
  },

  // 🔹 Iniciar processo de recuperação com envio de email
  async startPasswordRecovery(email: string): Promise<{ success: boolean; code?: string; user?: any }> {
    try {
      console.log('🔄 [Recovery] Iniciando recuperação de senha para:', email);
      
      // 1. Buscar usuário por email
      const user = await this.getUserByEmailForRecovery(email);
      
      if (!user) {
        console.log('❌ [Recovery] Usuário não encontrado');
        return { success: false };
      }
      
      // 2. Gerar código de verificação
      const recoveryCode = this.generateRecoveryCode();
      console.log('🔑 [Recovery] Código gerado:', recoveryCode);
      
      // 3. Enviar email com o código
      await this.sendRecoveryEmail(email, recoveryCode, user.name);
      
      console.log('✅ [Recovery] Email enviado com sucesso');
      return { success: true, code: recoveryCode, user };
      
    } catch (error: any) {
      console.error('❌ Erro ao iniciar recuperação de senha:', error);
      throw error;
    }
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