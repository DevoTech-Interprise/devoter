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

      console.log('🔍 Iniciando carregamento de campanhas para usuário:', {
        id: user.id,
        role: user.role,
        campaign_id: user.campaign_id
      });

      if (user.role === 'super') {
        console.log('👑 Super user - carregando todas as campanhas');
        campaignsData = await campaignService.getAll();
      } else if (user.role === 'admin') {
        console.log('👨‍💼 Admin - carregando minhas campanhas');
        campaignsData = await campaignService.getMyCampaigns(user.id, user.role);
      } else if (user.role === 'manager') {
        console.log('👨‍💼 Manager - carregando campanha vinculada:', user.campaign_id);
        
        if (user.campaign_id) {
          try {
            console.log(`🔄 Tentando buscar campanha específica: ${user.campaign_id}`);
            
            // Buscar diretamente pelo ID
            const campaign = await campaignService.getById(user.campaign_id);
            
            console.log('✅ Campanha encontrada:', campaign);
            campaignsData = [campaign];
            
          } catch (err) {
            console.error(`❌ Erro ao buscar campanha específica ${user.campaign_id}:`, err);
            
            // Fallback 1: tentar buscar todas e filtrar
            try {
              console.log('🔄 Fallback 1: Buscando todas as campanhas para filtrar');
              const allCampaigns = await campaignService.getAll();
              console.log('📋 Todas as campanhas:', allCampaigns);
              
              const fallbackCampaign = allCampaigns.find(c => {
                const match = c.id.toString() === user.campaign_id;
                console.log(`Comparando: ${c.id.toString()} === ${user.campaign_id} -> ${match}`);
                return match;
              });
              
              if (fallbackCampaign) {
                console.log('✅ Campanha encontrada via fallback 1:', fallbackCampaign);
                campaignsData = [fallbackCampaign];
              } else {
                console.warn('❌ Campanha não encontrada via fallback 1');
                
                // Fallback 2: tentar com parseInt
                const campaignIdNum = parseInt(user.campaign_id);
                if (!isNaN(campaignIdNum)) {
                  console.log('🔄 Fallback 2: Tentando com parseInt');
                  const fallbackCampaign2 = allCampaigns.find(c => c.id === campaignIdNum);
                  if (fallbackCampaign2) {
                    console.log('✅ Campanha encontrada via fallback 2:', fallbackCampaign2);
                    campaignsData = [fallbackCampaign2];
                  }
                }
              }
            } catch (fallbackError) {
              console.error('❌ Erro no fallback:', fallbackError);
            }
          }
        } else {
          console.warn('⚠️ Manager sem campaign_id definido');
        }
      } else {
        console.log('👤 Outro tipo de usuário');
        campaignsData = await campaignService.getMyCampaigns(user.id, user.role);
      }
      
      console.log(`📊 Resultado final: ${campaignsData.length} campanhas`, campaignsData);
      setCampaigns(campaignsData);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar campanhas');
      console.error('❌ Erro geral ao carregar campanhas:', err);
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