import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { campaignService, type Campaign } from '../services/campaignService';
import { useUser } from './UserContext';

type CampaignContextType = {
  campaign: Campaign | null;
  loading: boolean;
  refreshCampaign: () => Promise<void>;
  primaryColor: string;
  secondaryColor: string;
};

export const CampaignContext = createContext<CampaignContextType>({
  campaign: null,
  loading: true,
  refreshCampaign: async () => {},
  primaryColor: '#2563eb',
  secondaryColor: '#1e40af',
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
  const [primaryColor, setPrimaryColor] = useState('#2563eb');
  const [secondaryColor, setSecondaryColor] = useState('#1e40af');

  const refreshCampaign = async () => {
    if (!user?.campaign_id) {
      setCampaign(null);
      setPrimaryColor('#2563eb');
      setSecondaryColor('#1e40af');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const campaignData = await campaignService.getById(user.campaign_id);
      setCampaign(campaignData);
      setPrimaryColor(campaignData.color_primary || '#2563eb');
      setSecondaryColor(campaignData.color_secondary || '#1e40af');
    } catch (error) {
      console.error('Erro ao carregar campanha:', error);
      setCampaign(null);
      setPrimaryColor('#2563eb');
      setSecondaryColor('#1e40af');
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
    <CampaignContext.Provider value={{ campaign, loading, refreshCampaign, primaryColor, secondaryColor }}>
      {children}
    </CampaignContext.Provider>
  );
};
