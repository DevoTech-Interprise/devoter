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

    console.log('Criando campanha com FormData (sempre)');
    console.log('Dados para criação:', Object.fromEntries(formData));

    const response = await api.post('api/campaigns', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    // Após criar, vincular os usuários
    await this.linkOperatorsToCampaign(response.data.id, data.operator);
    return response.data;
  },

  async update(id: string | number, data: CampaignPayload): Promise<Campaign> {
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

    console.log('Atualizando com FormData (sempre)');
    console.log('Dados para atualização:', Object.fromEntries(formData));

    const response = await api.post(`api/campaigns/update/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    // Gerenciar vínculos de operadores
    await this.manageOperatorLinks(id, data.operator);
    return response.data;
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
    console.log('=== LINK OPERATORS TO CAMPAIGN ===');
    console.log('Vinculando operadores à campanha:', operatorIds);
    console.log('Campaign ID:', campaignId);

    if (operatorIds.length > 0) {
      // Buscar a campanha para obter o created_by
      const campaign = await this.getById(campaignId);
      const invitedBy = campaign.created_by.toString();

      console.log('Invited By (campaign creator):', invitedBy);

      try {
        await Promise.all(
          operatorIds.map(async (operatorId) => {
            console.log(`Vinculando operador ${operatorId} à campanha ${campaignId}`);
            const result = await userService.assignToCampaign(
              operatorId.trim(),
              campaignId.toString(),
              invitedBy
            );
            console.log(`Resultado do vínculo para ${operatorId}:`, result);
            return result;
          })
        );
        console.log('✅ Operadores vinculados com sucesso');
      } catch (error) {
        console.error('❌ Erro ao vincular operadores:', error);
        throw error;
      }
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
    // Encontrar operadores adicionados
    const addedOperators = newOperators.filter(op => !currentOperators.includes(op));

    console.log('=== DEBUG MANAGE OPERATOR LINKS ===');
    console.log('Campaign ID:', campaignId);
    console.log('Operadores atuais:', currentOperators);
    console.log('Novos operadores:', newOperators);
    console.log('Operadores removidos:', removedOperators);
    console.log('Operadores adicionados:', addedOperators);

    // Obter o ID do criador da campanha para usar como invited_by
    const invitedBy = currentCampaign.created_by.toString();
    console.log('Invited By (campaign creator):', invitedBy);

    // Se não há operadores novos, mas havia operadores antes, significa que estamos mantendo os mesmos
    // Neste caso, precisamos garantir que os operadores atuais tenham os dados atualizados
    const operatorsToProcess = addedOperators.length > 0 ? addedOperators : newOperators;

    console.log('Operadores a processar:', operatorsToProcess);

    // Atualizar operadores - processar todos os operadores atuais
    if (operatorsToProcess.length > 0) {
      console.log('🟢 Processando operadores da campanha:', operatorsToProcess);

      try {
        const results = await Promise.all(
          operatorsToProcess.map(async (operatorId) => {
            console.log(`Vinculando operador ${operatorId} à campanha ${campaignId}`);

            const result = await userService.assignToCampaign(
              operatorId.trim(),
              campaignId.toString(),
              invitedBy
            );
            console.log(`Resultado do vínculo para ${operatorId}:`, result);
            return result;
          })
        );
        console.log('✅ Todos os operadores processados com sucesso');
      } catch (error) {
        console.error('❌ Erro ao processar operadores:', error);
        throw error;
      }
    }

    // Remover campaign_id dos operadores que foram desvinculados
    if (removedOperators.length > 0) {
      console.log('🔴 Removendo operadores da campanha:', removedOperators);

      try {
        const results = await Promise.all(
          removedOperators.map(async (operatorId) => {
            console.log(`Removendo operador ${operatorId} da campanha`);

            // Antes de remover, verificar o estado atual do usuário
            console.log(`📋 Verificando estado atual do usuário ${operatorId}...`);
            const userBefore = await userService.getById(operatorId);
            console.log(`Estado antes da remoção - campaign_id: ${userBefore.campaign_id}, invited_by: ${userBefore.invited_by}`);

            const result = await userService.removeFromCampaign(operatorId.trim());

            // Depois de remover, verificar se realmente foi atualizado
            console.log(`📋 Verificando estado após remoção do usuário ${operatorId}...`);
            const userAfter = await userService.getById(operatorId);
            console.log(`Estado após remoção - campaign_id: ${userAfter.campaign_id}, invited_by: ${userAfter.invited_by}`);

            console.log(`Resultado da remoção para ${operatorId}:`, result);
            return result;
          })
        );
        console.log('✅ Todos os operadores removidos com sucesso');
      } catch (error) {
        console.error('❌ Erro ao remover operadores:', error);
        throw error;
      }
    } else {
      console.log('ℹ️ Nenhum operador para remover');
    }

    console.log('🎯 Vínculos de operadores atualizados com sucesso');
  },

  async getOperators(campaignId: string | number): Promise<User[]> {
    const response = await api.get(`api/campaigns/${campaignId}/operator`);
    return response.data;
  }
};