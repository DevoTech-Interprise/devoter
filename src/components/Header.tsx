import { Moon, Sun } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useUser } from "../context/UserContext";
import { useCampaign } from "../context/CampaignContext";

const Header = () => {
  const { darkMode, toggleDarkMode } = useTheme();
  const { user } = useUser();
  const { campaign } = useCampaign();
  
  const primaryColor = campaign?.color_primary || '#0D8ABC';

  // Função para obter as iniciais do nome do usuário
  const getUserInitials = () => {
    if (!user?.name) return "U"; // Fallback para "U" de Usuário
    
    const names = user.name.split(' ');
    if (names.length === 1) {
      return names[0].charAt(0).toUpperCase();
    }
    
    // Pega a primeira letra do primeiro nome e a primeira letra do último nome
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };

  return (
    <header
      className={`flex pl-15 md:pl-5 items-center justify-between p-4 border-b shadow-sm transition-colors duration-300
        ${darkMode ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"}
      `}
    >
      {/* Título */}
      <h2
        className={`text-lg font-semibold transition-colors duration-300
          ${darkMode ? "text-gray-100" : "text-gray-800"}
        `}
      >
        Painel de Controle
      </h2>

      {/* Ações */}
      <div className="flex items-center gap-4">
        {/* Botão de alternância de tema */}
        <button
          onClick={toggleDarkMode}
          className={`p-2 rounded-full transition-colors duration-300 focus:outline-none 
            ${darkMode ? "bg-gray-800 hover:bg-gray-700" : "bg-gray-100 hover:bg-gray-200"}
          `}
          title={`Alternar para modo ${darkMode ? "claro" : "escuro"}`}
        >
          {darkMode ? (
            <Sun className="text-yellow-400 w-5 h-5" />
          ) : (
            <Moon className="text-gray-600 w-5 h-5" />
          )}
        </button>

        {/* Avatar do usuário com iniciais */}
        <div
          className="w-8 h-8 rounded-full border border-gray-300 dark:border-gray-600 flex items-center justify-center text-white font-medium text-sm"
          style={{ backgroundColor: primaryColor }}
          title={user?.name || 'Usuário'}
        >
          {getUserInitials()}
        </div>
      </div>
    </header>
  );
};

export default Header;