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
import { useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { authService } from "../services/authService";
import { sessionService } from "../services/sessionService";
import { toast } from "react-toastify";
import type { ReactNode } from "react";

type SidebarItemProps = {
  icon: ReactNode;
  text: string;
  path?: string;
  isOpen: boolean;
  extraClass?: string;
  onClick?: () => void;
};

const SidebarItem = ({ 
  icon, 
  text, 
  path, 
  isOpen, 
  extraClass = "", 
  onClick 
}: SidebarItemProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const isActive = path ? location.pathname.startsWith(path) : false;

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (path) {
      navigate(path);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`flex items-center gap-3 w-full p-3 rounded-lg transition
        ${isActive 
          ? "bg-blue-600 text-white" 
          : darkMode 
            ? "hover:bg-gray-800" 
            : "hover:bg-blue-50"
        }
        ${!isOpen ? "justify-center" : ""} 
        ${extraClass}`}
    >
      <span className={isActive ? "text-white" : "text-blue-600"}>{icon}</span>
      {isOpen && <span className="text-sm font-medium">{text}</span>}
    </button>
  );
};

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { darkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();

  const toggleSidebar = () => setIsOpen(!isOpen);
  const toggleMobile = () => setMobileOpen(!mobileOpen);

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.warn("Logout API falhou, limpando sessão local", err);
      toast.error("Erro ao desconectar do servidor. Saindo localmente...");
    } finally {
      sessionService.clearSession();
      navigate("/login");
    }
  };

  // Pegando a role do usuário
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const role = user?.role || "user";

  // Itens do menu com roles permitidas
  const menuItems = [
    { icon: <Home size={20} />, text: "Dashboard", path: "/dashboard", roles: ["admin"] },
    { icon: <Award size={20} />, text: "Campanhas", path: "/campanhas", roles: ["admin"] },
    { icon: <Send size={20} />, text: "Convites", path: "/convites", roles: ["admin", "user"] },
    { icon: <Users size={20} />, text: "Apoiadores", path: "/apoiadores", roles: ["admin", "user"] },
    { icon: <Activity size={20} />, text: "Engajamento", path: "/engajamento", roles: ["admin"] },
  ];

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
          ${darkMode ? "bg-gray-900 text-gray-100" : "bg-white text-gray-800"}
          ${isOpen ? "w-64" : "w-20"}
          ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
          shadow-lg`}
      >
        {/* Cabeçalho */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
          <h1
            className={`text-xl font-bold text-blue-600 transition-all duration-300 ${
              isOpen ? "opacity-100" : "opacity-0 hidden"
            }`}
          >
            Devoter
          </h1>
          <button
            onClick={toggleSidebar}
            className={`
              hidden md:block text-gray-500 dark:text-gray-300 hover:text-blue-600
              ${!isOpen ? "p-1.5" : ""}
              `}
          >
            {isOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {/* Navegação */}
        <nav className="flex-1 flex flex-col p-4 space-y-2 overflow-y-auto">
          {menuItems
            .filter(item => item.roles.includes(role))
            .map(item => (
              <SidebarItem
                key={item.text}
                icon={item.icon}
                text={item.text}
                path={item.path}
                isOpen={isOpen}
              />
            ))}
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
            onClick={handleLogout}
          />
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
