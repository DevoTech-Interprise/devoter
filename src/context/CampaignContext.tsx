import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { campaignService, type Campaign } from '../services/campaignService';
import { useUser } from './UserContext';

type CampaignContextType = {
  campaign: Campaign | null;
  loading: boolean;
  refreshCampaign: () => Promise<void>;
};

const CampaignContext = createContext<CampaignContextType>({
  campaign: null,
  loading: true,
  refreshCampaign: async () => {},
});

export const useCampaign = () => {
  const context = useContext(CampaignContext);
  if (!context) {
    throw new Error('useCampaign must be used within a CampaignProvider');
  }
  return context;
};

export const CampaignProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useUser();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshCampaign = async () => {
    if (!user?.campaign_id) {
      setCampaign(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const campaignData = await campaignService.getById(user.campaign_id);
      setCampaign(campaignData);
    } catch (error) {
      console.error('Erro ao carregar campanha:', error);
      setCampaign(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshCampaign();
  }, [user?.campaign_id]);

  // Escutar mudanças de campanha
  useEffect(() => {
    const handleCampaignChange = () => {
      refreshCampaign();
    };

    window.addEventListener('campaignChanged', handleCampaignChange);

    return () => {
      window.removeEventListener('campaignChanged', handleCampaignChange);
    };
  }, [user?.campaign_id]);

  return (
    <CampaignContext.Provider value={{ campaign, loading, refreshCampaign }}>
      {children}
    </CampaignContext.Provider>
  );
};
