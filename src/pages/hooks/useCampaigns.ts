// src/pages/hooks/useCampaigns.ts
import { useState, useEffect, useCallback } from 'react';
import { campaignService, type Campaign } from '../../services/campaignService';
import { useUser } from '../../context/UserContext';

export const useCampaigns = () => {
  const { user } = useUser();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCampaigns = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      let campaignsData: Campaign[] = [];

      if (user.role === 'super') {
        // Super usuário vê todas as campanhas
        campaignsData = await campaignService.getAll();
      } else {
        // Outros usuários veem apenas suas campanhas
        campaignsData = await campaignService.getMyCampaigns(user.id, user.role);
      }

      setCampaigns(campaignsData);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar campanhas');
      console.error('Erro ao carregar campanhas:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadCampaigns();
  }, [loadCampaigns]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    campaigns,
    loading,
    error,
    loadCampaigns,
    clearError,
  };
};