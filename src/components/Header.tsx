import { Moon, Sun } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useUser } from "../context/UserContext";

const Header = () => {
  const { darkMode, toggleDarkMode } = useTheme();
  const { user } = useUser();

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

  // Função para gerar uma cor baseada no nome do usuário (para consistência)
  const getUserColor = () => {
    if (!user?.name) return '#0D8ABC'; // Cor padrão
    
    const colors = [
      '#0D8ABC', // Azul
      '#10B981', // Verde
      '#F59E0B', // Amarelo
      '#EF4444', // Vermelho
      '#8B5CF6', // Roxo
      '#EC4899', // Rosa
      '#06B6D4', // Ciano
      '#84CC16', // Lima
    ];
    
    // Gera um índice baseado no nome para sempre retornar a mesma cor para o mesmo usuário
    let hash = 0;
    for (let i = 0; i < user.name.length; i++) {
      hash = user.name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
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
          style={{ backgroundColor: getUserColor() }}
          title={user?.name || 'Usuário'}
        >
          {getUserInitials()}
        </div>
      </div>
    </header>
  );
};

export default Header;