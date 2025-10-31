import api from './api';
import type { LoginFormData } from '../schemas/auth';

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
  }
};