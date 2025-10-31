import api from './api';

export interface CampaignPayload {
  name: string;
  description: string;
  logo?: File | string; // pode ser File ou string
  color_primary: string;
  color_secondary: string;
  created_by?: number;
}

export const campaignService = {
  async getAll() {
    const response = await api.get('api/campaigns');
    return response.data;
  },

  async create(data: CampaignPayload) {
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('description', data.description);
    formData.append('color_primary', data.color_primary);
    formData.append('color_secondary', data.color_secondary);
    if (data.created_by) formData.append('created_by', String(data.created_by));

    // 👇 se for File, envia como arquivo; se for string (URL), envia como texto
    if (data.logo instanceof File) {
      formData.append('logo', data.logo);
    } else if (data.logo) {
      formData.append('logo_url', data.logo); // opcional, caso ainda aceite URL
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

    const response = await api.post(`api/campaigns/${id}?_method=PUT`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};
