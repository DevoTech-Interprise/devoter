// src/services/emailService.ts
import emailjs from '@emailjs/browser';

// Configuração específica para Titan Email
const EMAILJS_CONFIG = {
  serviceId: 'service_cf7gvmu', // SEU SERVICE ID
  templateId: 'template_mwapyll', // VOCÊ PRECISA CRIAR
  publicKey: 'focz5w6u-RzHI0PYU', // SUA PUBLIC KEY
};

export const emailService = {
  async sendVerificationCode(email: string, code: string): Promise<boolean> {
    try {
      console.log('🚀 Iniciando envio via Titan Email...');
      console.log('📧 De: suporte.devoter@devotech.com.br');
      console.log('📧 Para:', email);
      console.log('🔑 Service ID:', EMAILJS_CONFIG.serviceId);

      const templateParams = {
        email: email,
        to_name: 'Usuário',
        from_name: 'Devoter', // Nome da sua aplicação
        from_email: 'suporte.devoter@devotech.com.br',
        reply_to: 'suporte.devoter@devotech.com.br',
        verification_code: code,
        subject: 'Código de Verificação - Devoter',
        website_name: 'Devoter',
        expiration_time: '10 minutos',
        support_email: 'suporte.devoter@devotech.com.br',
        company_name: 'Devotech'
      };

      console.log('📤 Enviando via Titan Email...');
      
      const result = await emailjs.send(
        EMAILJS_CONFIG.serviceId,
        EMAILJS_CONFIG.templateId, // VOCÊ PRECISA CRIAR ESTE TEMPLATE
        templateParams,
        EMAILJS_CONFIG.publicKey // SUA PUBLIC KEY AQUI
      );

      console.log('✅ Email enviado com sucesso via Titan!');
      console.log('Status:', result.status);
      console.log('Texto:', result.text);
      
      return true;
      
    } catch (error: any) {
      console.error('❌ ERRO NO TITAN EMAIL:');
      console.error('Status:', error?.status);
      console.error('Mensagem:', error?.text);
      console.error('Erro completo:', error);
      
      if (error?.text?.includes('535') || error?.text?.includes('authentication failed')) {
        throw new Error(`
          Erro de autenticação no Titan Email (535):

          Verifique no EmailJS:
          ✅ SMTP Server: smtp.titan.email
          ✅ Port: 587  
          ✅ Username: suporte.devoter@devotech.com.br
          ✅ Password: [sua senha correta]
          ✅ Secure Connection: STARTTLS

          Possíveis soluções:
          1. Confirme a senha da conta suporte.devoter@devotech.com.br
          2. Verifique se a conta Titan Email está ativa
          3. Tente a porta 465 com SSL
        `);
      }
      
      throw new Error(error?.text || 'Erro ao enviar email via Titan');
    }
  },

  generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
};