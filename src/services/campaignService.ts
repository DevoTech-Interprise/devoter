import api from './api';

export interface CampaignPayload {
  name: string;
  description: string;
  logo?: File | string; 
  color_primary: string;
  color_secondary: string;
  created_by?: string;
}

export const campaignService = {
  async getAll() {
    const response = await api.get('api/campaigns');
    return response.data;
  },

  async getById(id: string | number) {
    const response = await api.get(`api/campaigns/${id}`);
    return response.data;
  },

  async create(data: CampaignPayload) {
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('description', data.description);
    formData.append('color_primary', data.color_primary);
    formData.append('color_secondary', data.color_secondary);
    if (data.created_by) formData.append('created_by', String(data.created_by));

    if (data.logo instanceof File) {
      formData.append('logo', data.logo);
    } else if (data.logo) {
      formData.append('logo_url', data.logo);
    }

    const response = await api.post('api/campaigns', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async update(id: string | number, data: CampaignPayload) {
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('description', data.description);
    formData.append('color_primary', data.color_primary);
    formData.append('color_secondary', data.color_secondary);
    if (data.created_by) formData.append('created_by', String(data.created_by));

    if (data.logo instanceof File) {
      formData.append('logo', data.logo);
    } else if (data.logo) {
      formData.append('logo_url', data.logo);
    }

    const response = await api.post(`api/campaigns/update/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async delete(id: string | number) {
    const response = await api.delete(`api/campaigns/${id}`);
    return response.data;
  }
};
