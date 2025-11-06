import api from './api';
import type { LoginFormData } from '../schemas/auth';
import { emailService } from './emailService';
import { passwordRecoveryService } from './passwordRecoveryService';

export const authService = {
  async login(data: LoginFormData) {
    try {
      const response = await api.post('api/auth/login', data);
      return response.data;
    } catch (messages: any) {
      throw messages;
    }
  }
  ,
  async logout() {
    try {
      const response = await api.post('api/auth/logout');
      return response.data;
    } catch (err: any) {
      // Não propagar o erro para que o cliente ainda limpe a sessão localmente
      console.error('Logout API falhou', err);
      throw err;
    }
  },
  async forgotPassword(data: { email: string }) {
    try {
      console.log('🔍 [ForgotPassword] Buscando usuário por email:', data.email);
      
      // Usa a função específica para recovery
      const user = await passwordRecoveryService.getUserByEmailForRecovery(data.email);
      
      if (!user) {
        console.log('❌ [ForgotPassword] Usuário não encontrado para email:', data.email);
        throw new Error("Email não cadastrado em nossa base de dados.");
      }

      console.log('✅ [ForgotPassword] Usuário encontrado:', user.id);
      
      // Gera código usando função específica
      const verificationCode = passwordRecoveryService.generateRecoveryCode();
      
      const resetData = {
        code: verificationCode,
        email: data.email,
        userId: user.id,
        expires: Date.now() + 10 * 60 * 1000,
        attempts: 0
      };
      
      localStorage.setItem('recoveryData', JSON.stringify(resetData));
      
      console.log('📧 [ForgotPassword] Enviando email de verificação...');
      await emailService.sendVerificationCode(data.email, verificationCode);
      
      return { 
        success: true, 
        message: "Código de verificação enviado para seu email",
        userId: user.id
      };
      
    } catch (error: any) {
      console.error('❌ Erro no forgotPassword:', error);
      
      if (error.message.includes("não cadastrado")) {
        throw error;
      }
      
      if (error.message.includes("Network Error")) {
        throw new Error("Erro de conexão. Verifique sua internet e tente novamente.");
      }
      
      throw new Error(error.message || 'Erro ao enviar código de verificação');
    }
  },

   async verifyResetCode(data: { email: string; token: string }) {
    try {
      const storedData = localStorage.getItem('recoveryData');
      
      if (!storedData) {
        throw new Error("Código não encontrado ou expirado");
      }
      
      const recoveryData = JSON.parse(storedData);
      
      // Verifica expiração
      if (Date.now() > recoveryData.expires) {
        localStorage.removeItem('recoveryData');
        throw new Error("Código expirado. Solicite um novo.");
      }
      
      // Verifica tentativas
      if (recoveryData.attempts >= 5) {
        localStorage.removeItem('recoveryData');
        throw new Error("Muitas tentativas falhas. Solicite um novo código.");
      }
      
      // Verifica código e email
      if (recoveryData.code !== data.token || recoveryData.email !== data.email) {
        recoveryData.attempts += 1;
        localStorage.setItem('recoveryData', JSON.stringify(recoveryData));
        throw new Error("Código inválido");
      }
      
      // Código válido - marca como verificado
      recoveryData.verified = true;
      localStorage.setItem('recoveryData', JSON.stringify(recoveryData));
      
      return { 
        success: true, 
        message: "Código verificado com sucesso",
        userId: recoveryData.userId 
      };
      
    } catch (error: any) {
      throw error;
    }
  },
  // No authService.ts, corrija a função resetPassword:
async resetPassword(data: { 
  email: string; 
  token: string;  // ← AGORA RECEBE O TOKEN
  newPassword: string;
}) {
  try {
    console.log('🔍 [AUTH SERVICE] resetPassword chamado');
    console.log('📋 [AUTH SERVICE] Dados recebidos:', data);
    

    // 2. Busca o ID do usuário nos dados armazenados
    const storedData = localStorage.getItem('recoveryData');
    if (!storedData) {
      throw new Error("Sessão expirada. Solicite um novo código.");
    }

    const recoveryData = JSON.parse(storedData);
    const userId = recoveryData.userId;

    if (!userId) {
      throw new Error("ID do usuário não encontrado.");
    }

    // 3. Atualiza a senha usando função específica para recovery
    console.log(`🔄 [ResetPassword] Atualizando senha no backend para usuário ${userId}`);
    await passwordRecoveryService.updatePasswordForRecovery(userId, data.newPassword);

    // 4. Limpa os dados de recovery
    localStorage.removeItem('recoveryData');
    passwordRecoveryService.clearRecoveryToken();
    
    console.log('✅ [ResetPassword] Senha atualizada com sucesso no backend');
    
    return { 
      success: true, 
      message: "Senha redefinida com sucesso!" 
    };
    
  } catch (error: any) {
    console.error('❌ Erro no resetPassword:', error);
    
    if (error.message.includes("Network Error") || error.code === "NETWORK_ERROR") {
      throw new Error("Erro de conexão. Verifique sua internet e tente novamente.");
    }
    
    throw new Error(error.message || "Erro ao redefinir senha. Tente novamente.");
  }
}
};
