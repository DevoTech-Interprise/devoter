import { useState } from "react";
import {
  Menu,
  X,
  Home,
  Users,
  Award,
  Send,
  Activity,
  LogOut,
  Moon,
  Sun,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { darkMode, toggleDarkMode } = useTheme();

  const toggleSidebar = () => setIsOpen(!isOpen);
  const toggleMobile = () => setMobileOpen(!mobileOpen);

  return (
    <>
      {/* Botão mobile */}
      <button
        onClick={toggleMobile}
        className="md:hidden fixed top-4 left-4 z-50 bg-blue-600 text-white p-2 rounded-lg shadow"
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Overlay no mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:static z-50 h-full transition-all duration-300 flex flex-col
          ${darkMode ? "bg-gray-900  text-gray-100" : "bg-white  text-gray-800"}
          ${isOpen ? "w-64" : "w-20"}
          ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
           shadow-lg`}
      >
        {/* Cabeçalho */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h1
            className={`text-xl font-bold text-blue-600 transition-all duration-300 ${
              isOpen ? "opacity-100" : "opacity-0 hidden"
            }`}
          >
            Devoter
          </h1>
          <button
            onClick={toggleSidebar}
            className="hidden md:block text-gray-500 dark:text-gray-300 hover:text-blue-600"
          >
            {isOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {/* Navegação */}
        <nav className="flex-1 flex flex-col p-4 space-y-2 overflow-y-auto">
          <SidebarItem icon={<Home size={20} />} text="Dashboard" isOpen={isOpen} />
          <SidebarItem icon={<Users size={20} />} text="Apoiadores" isOpen={isOpen} />
          <SidebarItem icon={<Award size={20} />} text="Candidaturas" isOpen={isOpen} />
          <SidebarItem icon={<Send size={20} />} text="Convites" isOpen={isOpen} />
          <SidebarItem icon={<Activity size={20} />} text="Engajamento" isOpen={isOpen} />
        </nav>

        {/* Rodapé: Switch de Tema + Sair */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 mt-auto">
          <button
            onClick={toggleDarkMode}
            className={`flex items-center gap-3 w-full p-3 rounded-lg transition
              ${darkMode ? "hover:bg-gray-800" : "hover:bg-blue-50"}
              ${!isOpen ? "justify-center" : ""}`}
          >
            {darkMode ? (
              <Sun size={20} className="text-yellow-400" />
            ) : (
              <Moon size={20} className="text-gray-600" />
            )}
            {isOpen && (
              <span className="text-sm font-medium">
                Modo {darkMode ? "claro" : "escuro"}
              </span>
            )}
          </button>

          <SidebarItem
            icon={<LogOut size={20} />}
            text="Sair"
            isOpen={isOpen}
            extraClass="mt-2"
          />
        </div>
      </aside>
    </>
  );
};

const SidebarItem = ({
  icon,
  text,
  isOpen,
  extraClass = "",
}: {
  icon: React.ReactNode;
  text: string;
  isOpen: boolean;
  extraClass?: string;
}) => (
  <button
    className={`flex items-center gap-3 w-full p-3 rounded-lg transition
      ${isOpen ? "justify-start" : "justify-center"}
      hover:bg-blue-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 ${extraClass}`}
  >
    {icon}
    {isOpen && <span className="text-sm font-medium">{text}</span>}
  </button>
);

export default Sidebar;
