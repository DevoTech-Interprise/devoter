import { Moon, Sun } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

const Header = () => {
  const { darkMode, toggleDarkMode } = useTheme();

  return (
    <header
      className={`flex items-center justify-between p-4 border-b shadow-sm transition-colors duration-300
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

        {/* Avatar do usuário */}
        <img
          src="https://ui-avatars.com/api/?name=Admin&background=0D8ABC&color=fff"
          alt="Usuário"
          className="w-8 h-8 rounded-full border border-gray-300 dark:border-gray-600"
        />
      </div>
    </header>
  );
};

export default Header;
