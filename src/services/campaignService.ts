import api from './api';
import { userService } from './userService';
import type { User } from './userService';

export interface Campaign {
  id: number;
  name: string;
  description: string;
  logo: string;
  color_primary: string;
  color_secondary: string;
  created_by: number;
  operator?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CampaignPayload {
  name: string;
  description: string;
  logo?: File | string;
  color_primary: string;
  color_secondary: string;
  created_by?: string;
  operator?: string;
}

export const campaignService = {
  async getAll(): Promise<Campaign[]> {
    const response = await api.get('api/campaigns');
    return response.data;
  },

  async getById(id: string | number): Promise<Campaign> {
    const response = await api.get(`api/campaigns/${id}`);
    return response.data;
  },

  async create(data: CampaignPayload): Promise<Campaign> {
    // Criar objeto data para enviar como JSON
    const requestData: any = {
      name: data.name,
      description: data.description,
      color_primary: data.color_primary,
      color_secondary: data.color_secondary,
      created_by: data.created_by,
      operator: data.operator || null
    };

    console.log('Dados a serem enviados:', requestData);

    // Se tem logo como arquivo, usar FormData
    if (data.logo instanceof File) {
      const formData = new FormData();
      
      // Adicionar todos os campos como string no FormData
      formData.append('name', data.name);
      formData.append('description', data.description);
      formData.append('color_primary', data.color_primary);
      formData.append('color_secondary', data.color_secondary);
      if (data.created_by) formData.append('created_by', data.created_by);
      if (data.operator) formData.append('operator', data.operator);
      
      // Adicionar o arquivo
      formData.append('logo', data.logo);

      console.log('Enviando com FormData (com arquivo)');
      const response = await api.post('api/campaigns', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Após criar, vincular os usuários
      await this.linkOperatorsToCampaign(response.data.id, data.operator);
      return response.data;

    } else {
      // Se não tem arquivo, enviar como JSON normal
      console.log('Enviando como JSON (sem arquivo)');
      const response = await api.post('api/campaigns', requestData);

      // Após criar, vincular os usuários
      await this.linkOperatorsToCampaign(response.data.id, data.operator);
      return response.data;
    }
  },

  async update(id: string | number, data: CampaignPayload): Promise<Campaign> {
    // Criar objeto data para enviar como JSON
    const requestData: any = {
      name: data.name,
      description: data.description,
      color_primary: data.color_primary,
      color_secondary: data.color_secondary,
      created_by: data.created_by,
      operator: data.operator || null
    };

    console.log('Dados para atualização:', requestData);

    // Se tem logo como arquivo, usar FormData
    if (data.logo instanceof File) {
      const formData = new FormData();
      
      // Adicionar todos os campos como string no FormData
      formData.append('name', data.name);
      formData.append('description', data.description);
      formData.append('color_primary', data.color_primary);
      formData.append('color_secondary', data.color_secondary);
      if (data.created_by) formData.append('created_by', data.created_by);
      if (data.operator !== undefined) formData.append('operator', data.operator || '');
      
      // Adicionar o arquivo se existir
      if (data.logo instanceof File) {
        formData.append('logo', data.logo);
      }

      console.log('Atualizando com FormData');
      const response = await api.post(`api/campaigns/update/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Gerenciar vínculos de operadores
      await this.manageOperatorLinks(id, data.operator);
      return response.data;

    } else {
      // Se não tem arquivo, enviar como JSON normal
      console.log('Atualizando como JSON');
      const response = await api.post(`api/campaigns/update/${id}`, requestData);

      // Gerenciar vínculos de operadores
      await this.manageOperatorLinks(id, data.operator);
      return response.data;
    }
  },

  async delete(id: string | number): Promise<void> {
    // Antes de deletar, remover campaign_id de todos os operadores
    const campaign = await campaignService.getById(id);
    if (campaign.operator) {
      const operatorIds = campaign.operator.split(',').filter(id => id.trim() !== '');
      if (operatorIds.length > 0) {
        await Promise.all(
          operatorIds.map(operatorId => 
            userService.removeFromCampaign(operatorId.trim())
          )
        );
      }
    }
    
    const response = await api.delete(`api/campaigns/${id}`);
    return response.data;
  },

  // Novo método para vincular operadores à campanha
 async linkOperatorsToCampaign(campaignId: string | number, operatorString?: string): Promise<void> {
    if (!operatorString) return;

    const operatorIds = operatorString.split(',').filter(id => id.trim() !== '');
    console.log('Vinculando operadores à campanha:', operatorIds);

    if (operatorIds.length > 0) {
      await Promise.all(
        operatorIds.map(operatorId => 
          userService.assignToCampaign(operatorId.trim(), campaignId.toString())
        )
      );
      console.log('Operadores vinculados com sucesso');
    }
  },

  // Novo método para gerenciar vínculos de operadores (update)
 async manageOperatorLinks(campaignId: string | number, newOperatorString?: string): Promise<void> {
    // Buscar campanha atual para verificar operadores antigos
    const currentCampaign = await campaignService.getById(campaignId);
    const currentOperators = currentCampaign.operator ? 
      currentCampaign.operator.split(',').filter(id => id.trim() !== '') : [];
    const newOperators = newOperatorString ? 
      newOperatorString.split(',').filter(id => id.trim() !== '') : [];
    
    // Encontrar operadores removidos
    const removedOperators = currentOperators.filter(op => !newOperators.includes(op));
    
    console.log('Operadores atuais:', currentOperators);
    console.log('Novos operadores:', newOperators);
    console.log('Operadores removidos:', removedOperators);

    // Atualizar operadores - adicionar novos
    if (newOperators.length > 0) {
      await Promise.all(
        newOperators.map(operatorId => 
          userService.assignToCampaign(operatorId.trim(), campaignId.toString())
        )
      );
    }
    
    // Remover campaign_id dos operadores que foram desvinculados
    if (removedOperators.length > 0) {
      await Promise.all(
        removedOperators.map(operatorId => 
          userService.removeFromCampaign(operatorId.trim())
        )
      );
    }
  },

  async getOperators(campaignId: string | number): Promise<User[]> {
    const response = await api.get(`api/campaigns/${campaignId}/operator`);
    return response.data;
  }
};