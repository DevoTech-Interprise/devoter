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
  link_youtube?: string;
}

export interface CampaignPayload {
  name: string;
  description: string;
  logo?: File | string;
  color_primary: string;
  color_secondary: string;
  created_by?: string;
  operator?: string;
  link_youtube?: string;
}

export const campaignService = {
  async getAll(): Promise<Campaign[]> {
    const response = await api.get('api/campaigns');
    return response.data;
  },

  async getById(id: string | number): Promise<Campaign> {
    console.log(`🔍 Buscando campanha por ID: ${id} (tipo: ${typeof id})`);

    // Converter para número se for string
    const campaignId = typeof id === 'string' ? parseInt(id) : id;

    if (isNaN(campaignId)) {
      throw new Error(`ID de campanha inválido: ${id}`);
    }

    const response = await api.get(`api/campaigns/${campaignId}`);
    console.log(`✅ Resposta da campanha ${campaignId}:`, response.data);
    return response.data;
  },

  async getMyCampaigns(userId: string | number, userRole?: string): Promise<Campaign[]> {
    try {
      // 🔹 SUPER USER: Retorna TODAS as campanhas
      if (userRole === 'super') {
        console.log('👑 SUPER USER: Retornando TODAS as campanhas do sistema');
        return await this.getAll();
      }

      const allCampaigns = await this.getAll();

      // Filtrar campanhas criadas pelo usuário OU onde o usuário é operador
      const myCampaigns = allCampaigns.filter(campaign => {
        // Campanhas criadas pelo usuário
        const isCreator = String(campaign.created_by) === String(userId);

        // Campanhas onde o usuário é operador
        const isOperator = campaign.operator &&
          campaign.operator.split(',').some(operatorId =>
            operatorId.trim() === String(userId)
          );

        return isCreator || isOperator;
      });

      console.log(`Encontradas ${myCampaigns.length} campanhas para o usuário ${userId}`);
      return myCampaigns;
    } catch (error) {
      console.error('Erro ao buscar campanhas do usuário:', error);
      throw error;
    }
  },

  async create(data: CampaignPayload): Promise<Campaign> {
    const formData = new FormData();

    // Adicionar todos os campos como string no FormData
    formData.append('name', data.name);
    formData.append('description', data.description);
    formData.append('color_primary', data.color_primary);
    formData.append('color_secondary', data.color_secondary);
    formData.append('link_youtube', data.link_youtube || '');

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
    formData.append('link_youtube', data.link_youtube || '');

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
  },


};