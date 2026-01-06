import type { ReactNode } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useCampaignColor } from './CampaignThemed';
import Sidebar from './Sidebar';
import Header from './Header';

interface PageLayoutProps {
  children: ReactNode;
}

/**
 * Layout padrão que aplica o background da campanha
 */
export const PageLayout = ({ children }: PageLayoutProps) => {
  const { darkMode } = useTheme();
  const { primaryColor } = useCampaignColor();

  return (
    <div
      style={{
        backgroundColor: darkMode ? primaryColor : '#f9fafb',
        filter: darkMode ? 'brightness(0.12)' : 'none'
      }}
      className={`flex h-screen overflow-hidden transition-colors duration-300
        ${darkMode ? "text-gray-100" : "text-gray-900"}
      `}
    >
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main
          style={{
            backgroundColor: darkMode ? primaryColor : '#f9fafb',
            filter: darkMode ? 'brightness(0.12)' : 'none'
          }}
          className="flex-1 overflow-y-auto p-6 transition-colors duration-300"
        >
          {children}
        </main>
      </div>
    </div>
  );
};
