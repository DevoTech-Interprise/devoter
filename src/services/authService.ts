import api from './api';
import type { LoginFormData } from '../schemas/auth';

export const authService = {
  async login(data: LoginFormData) {
    try {
      const response = await api.post('api/user/login', data);
      return response.data;
    } catch (messages: any) {
      throw messages;
    }
  }
};