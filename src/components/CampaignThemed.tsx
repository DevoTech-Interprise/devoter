import { useCampaign } from '../context/CampaignContext';
import type { CSSProperties, ReactNode } from 'react';

interface CampaignThemedProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  applyBackground?: boolean;
  applyText?: boolean;
  applyBorder?: boolean;
  opacity?: number;
}

/**
 * Componente que aplica automaticamente as cores da campanha ativa
 */
export const CampaignThemed = ({
  children,
  className = '',
  style = {},
  applyBackground = false,
  applyText = false,
  applyBorder = false,
  opacity = 1
}: CampaignThemedProps) => {
  const { campaign } = useCampaign();
  const primaryColor = campaign?.color_primary || '#2563eb';

  const appliedStyle: CSSProperties = {
    ...style,
    ...(applyBackground && { backgroundColor: primaryColor }),
    ...(applyText && { color: primaryColor }),
    ...(applyBorder && { borderColor: primaryColor }),
    ...(opacity !== 1 && { opacity })
  };

  return (
    <div className={className} style={appliedStyle}>
      {children}
    </div>
  );
};

/**
 * Hook para obter a cor primária da campanha ativa
 */
export const useCampaignColor = () => {
  const { campaign } = useCampaign();
  return {
    primaryColor: campaign?.color_primary || '#2563eb',
    secondaryColor: campaign?.color_secondary || '#0833AF',
    campaign
  };
};
