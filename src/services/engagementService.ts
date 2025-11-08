// services/engagementService.ts
import api from './api';
import { userService, type User } from './userService';

export interface EngagementAction {
  id: string;
  title: string;
  description: string;
  type: 'whatsapp_group' | 'event' | 'campaign' | 'social_action';
  target_audience: 'all' | 'filtered';
  filters?: {
    campaign_id?: string;
    city?: string;
    state?: string;
    role?: string;
    status?: string;
    neighborhood?: string;
  };
  whatsapp_link?: string;
  event_date?: string;
  location?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  status: 'active' | 'inactive' | 'completed';
  participants_count?: number;
}

export interface EngagementStats {
  total_actions: number;
  active_actions: number;
  total_participants: number;
  whatsapp_groups: number;
  events: number;
  social_actions: number;
}

export const engagementService = {
  // 🔹 Buscar todas as ações de engajamento
  async getAllActions(): Promise<EngagementAction[]> {
    try {
      // Por enquanto, vamos simular - depois você integra com sua API
      const mockActions: EngagementAction[] = [
        {
          id: '1',
          title: 'Grupo de Apoiadores - Centro',
          description: 'Grupo oficial de apoiadores do bairro Centro para discussões e mobilizações',
          type: 'whatsapp_group',
          target_audience: 'filtered',
          filters: {
            city: 'Recife',
            neighborhood: 'Centro'
          },
          whatsapp_link: 'https://chat.whatsapp.com/example1',
          created_by: '1',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          status: 'active',
          participants_count: 45
        },
        {
          id: '2',
          title: 'Ação Social - Doação de Cestas',
          description: 'Distribuição de cestas básicas para famílias carentes',
          type: 'social_action',
          target_audience: 'all',
          event_date: '2024-12-15T08:00:00',
          location: 'Praça do Derby',
          created_by: '1',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          status: 'active',
          participants_count: 23
        }
      ];
      return mockActions;
    } catch (error) {
      console.error('Erro ao buscar ações:', error);
      return [];
    }
  },

  // 🔹 Criar nova ação
  async createAction(actionData: Omit<EngagementAction, 'id' | 'created_at' | 'updated_at' | 'participants_count'>): Promise<EngagementAction> {
    try {
      // Simulação - depois integre com sua API
      const newAction: EngagementAction = {
        ...actionData,
        id: Math.random().toString(36).substr(2, 9),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        participants_count: 0
      };
      return newAction;
    } catch (error) {
      console.error('Erro ao criar ação:', error);
      throw error;
    }
  },

  // 🔹 Atualizar ação
  async updateAction(id: string, actionData: Partial<EngagementAction>): Promise<EngagementAction> {
    try {
      // Simulação - depois integre com sua API
      const updatedAction: EngagementAction = {
        id,
        title: actionData.title || '',
        description: actionData.description || '',
        type: actionData.type || 'whatsapp_group',
        target_audience: actionData.target_audience || 'all',
        filters: actionData.filters,
        whatsapp_link: actionData.whatsapp_link,
        event_date: actionData.event_date,
        location: actionData.location,
        created_by: actionData.created_by || '',
        created_at: actionData.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: actionData.status || 'active',
        participants_count: actionData.participants_count || 0
      };
      return updatedAction;
    } catch (error) {
      console.error('Erro ao atualizar ação:', error);
      throw error;
    }
  },

  // 🔹 Excluir ação
  async deleteAction(id: string): Promise<void> {
    try {
      // Simulação - depois integre com sua API
      console.log(`Ação ${id} excluída`);
    } catch (error) {
      console.error('Erro ao excluir ação:', error);
      throw error;
    }
  },

  // 🔹 Buscar estatísticas
  async getStats(): Promise<EngagementStats> {
    try {
      const actions = await this.getAllActions();
      
      return {
        total_actions: actions.length,
        active_actions: actions.filter(a => a.status === 'active').length,
        total_participants: actions.reduce((sum, action) => sum + (action.participants_count || 0), 0),
        whatsapp_groups: actions.filter(a => a.type === 'whatsapp_group').length,
        events: actions.filter(a => a.type === 'event').length,
        social_actions: actions.filter(a => a.type === 'social_action').length
      };
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      return {
        total_actions: 0,
        active_actions: 0,
        total_participants: 0,
        whatsapp_groups: 0,
        events: 0,
        social_actions: 0
      };
    }
  },

  // 🔹 Buscar usuários com base nos filtros
  async getFilteredUsers(filters: EngagementAction['filters']): Promise<User[]> {
    try {
      const allUsers = await userService.getAll();
      
      return allUsers.filter(user => {
        if (filters?.campaign_id && user.campaign_id !== filters.campaign_id) return false;
        if (filters?.city && user.city !== filters.city) return false;
        if (filters?.state && user.state !== filters.state) return false;
        if (filters?.role && user.role !== filters.role) return false;
        if (filters?.status && user.is_active !== filters.status) return false;
        
        return true;
      });
    } catch (error) {
      console.error('Erro ao filtrar usuários:', error);
      return [];
    }
  },

  // 🔹 Enviar convites para ação
  async sendInvites(actionId: string, userIds: string[]): Promise<{ success: boolean; message: string }> {
    try {
      // Simulação de envio - depois integre com sua API de WhatsApp/Email/SMS
      console.log(`Enviando convites da ação ${actionId} para ${userIds.length} usuários`);
      
      // Aqui você integraria com:
      // - API do WhatsApp Business
      // - Serviço de email
      // - SMS gateway
      
      return {
        success: true,
        message: `Convites enviados para ${userIds.length} usuários com sucesso!`
      };
    } catch (error) {
      console.error('Erro ao enviar convites:', error);
      return {
        success: false,
        message: 'Erro ao enviar convites'
      };
    }
  }
};