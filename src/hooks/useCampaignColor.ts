import { useContext } from 'react';
import { CampaignContext } from '../context/CampaignContext';

export const useCampaignColor = () => {
  const context = useContext(CampaignContext);
  
  if (!context) {
    return {
      primaryColor: '#2563eb', // Azul padrão
      secondaryColor: '#1e40af',
    };
  }

  return {
    primaryColor: context.primaryColor || '#2563eb',
    secondaryColor: context.secondaryColor || '#1e40af',
  };
};
