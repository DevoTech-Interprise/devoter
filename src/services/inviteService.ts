import api from './api';

interface InviteResponse {
  status: string;
  invite_token: string;
}

interface Campaign {
  id: string;
  name: string;
  description: string;
  logo: string;
  color_primary: string;
  color_secondary: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface Inviter {
  id: string;
  name: string;
  email: string;
  phone: string;
  // ... outros campos do inviter
}

interface CampaignResponse {
  status: string;
  inviter: Inviter;
  campaign: Campaign;
}

interface AcceptInviteParams {
  name: string;
  email: string;
  password: string;
  phone: string;
  gender?: string;
  contry?: string;
  city?: string;
  neighborhood?: string;
  invite_token: string;
}

export const inviteService = {
  async generateInvite(userId: string): Promise<InviteResponse> {
    const response = await api.get(`api/invite/generate/${userId}`);
    return response.data;
  },

  async getCampaignByInviteToken(inviteToken: string): Promise<CampaignResponse> {
    const response = await api.post('api/invite/campaign', {
      invite_token: inviteToken
    });
    return response.data;
  },

  async acceptInvite(data: AcceptInviteParams): Promise<any> {
    const response = await api.post('api/invite/accept', data);
    return response.data;
  }
};