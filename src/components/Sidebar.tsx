import { useState, useEffect } from "react";
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
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { useUser } from "../context/UserContext";
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
  isSubmenu?: boolean;
};

type MenuItem = {
  type: 'item';
  icon: ReactNode;
  text: string;
  path: string;
  roles: string[];
};

type SubmenuItem = {
  type: 'submenu';
  icon: ReactNode;
  text: string;
  roles: string[];
  items: Array<{
    icon: ReactNode;
    text: string;
    path: string;
    roles?: string[];
  }>;
};

type MenuItemType = MenuItem | SubmenuItem;

const SidebarItem = ({
  icon,
  text,
  path,
  isOpen,
  extraClass = "",
  onClick,
  isSubmenu = false
}: SidebarItemProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { darkMode } = useTheme();

  // Para itens principais, verifica se o path começa com a localização atual
  // Para subitens, verifica exata correspondência
  const isActive = path ? (
    isSubmenu
      ? location.pathname === path
      : location.pathname.startsWith(path)
  ) : false;

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
            ? "hover:bg-gray-800 text-gray-100"
            : "hover:bg-blue-50 text-gray-700"
        }
        ${!isOpen ? "justify-center" : ""} 
        ${isSubmenu ? "pl-8 text-sm" : ""}
        ${extraClass}`}
    >
      <span className={isActive ? "text-white" : darkMode ? "text-gray-300" : "text-blue-600"}>
        {icon}
      </span>
      {isOpen && <span className="text-sm font-medium">{text}</span>}
    </button>
  );
};

type SubmenuProps = {
  icon: ReactNode;
  text: string;
  items: Array<{ text: string; path: string; icon: ReactNode }>;
  isOpen: boolean;
  isSubmenuOpen: boolean;
  onToggle: () => void;
};

const Submenu = ({
  icon,
  text,
  items,
  isOpen,
  isSubmenuOpen,
  onToggle
}: SubmenuProps) => {
  const location = useLocation();
  const { darkMode } = useTheme();

  // Verifica se algum item do submenu está ativo
  const isActive = items.some(item => location.pathname === item.path);

  return (
    <div>
      {/* Botão do submenu */}
      <button
        onClick={onToggle}
        className={`flex items-center justify-between w-full p-3 rounded-lg transition
          ${isActive
            ? "bg-blue-600 text-white"
            : darkMode
              ? "hover:bg-gray-800 text-gray-100"
              : "hover:bg-blue-50 text-gray-700"
          }
          ${!isOpen ? "justify-center" : ""}`}
      >
        <div className="flex items-center gap-3">
          <span className={isActive ? "text-white" : darkMode ? "text-gray-300" : "text-blue-600"}>
            {icon}
          </span>
          {isOpen && <span className="text-sm font-medium">{text}</span>}
        </div>
        {isOpen && (
          <span className={isActive ? "text-white" : darkMode ? "text-gray-400" : "text-gray-500"}>
            {isSubmenuOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </span>
        )}
      </button>

      {/* Itens do submenu */}
      {isOpen && isSubmenuOpen && (
        <div className="mt-1 space-y-1">
          {items.map(item => (
            <SidebarItem
              key={item.text}
              icon={item.icon}
              text={item.text}
              path={item.path}
              isOpen={isOpen}
              isSubmenu={true}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [networksSubmenuOpen, setNetworksSubmenuOpen] = useState(false);
  const { darkMode, toggleDarkMode } = useTheme();
  const { user, clearUser } = useUser();
  const navigate = useNavigate();
  const location = useLocation();

  const toggleSidebar = () => setIsOpen(!isOpen);
  const toggleMobile = () => setMobileOpen(!mobileOpen);
  const toggleNetworksSubmenu = () => setNetworksSubmenuOpen(!networksSubmenuOpen);

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

  const handleLogout = async () => {
    try {
      await authService.logout();
      toast.success("Logout realizado com sucesso!");
    } catch (err) {
      console.warn("Logout API falhou, limpando sessão local", err);
      toast.warn("Desconectado localmente");
    } finally {
      clearUser();
      sessionService.clearSession();
      localStorage.removeItem("token");
      navigate("/login");
    }
  };

  // Itens do menu com roles permitidas
  const menuItems: MenuItemType[] = [
    {
      type: 'item',
      icon: <Home size={20} />,
      text: "Dashboard",
      path: "/dashboard",
      roles: ["admin","manager"]
    },
    {
      type: 'item',
      icon: <Award size={20} />,
      text: "Campanhas",
      path: "/campanhas",
      roles: ["admin"]
    },
    {
      type: 'item',
      icon: <Send size={20} />,
      text: "Convites",
      path: "/convites",
      roles: ["admin", "user", "manager"]
    },
    {
      type: 'submenu',
      icon: <Users size={20} />,
      text: "Redes",
      roles: ["admin", "user", "manager"],
      items: [
        {
          icon: <Users size={16} />,
          text: "Minha rede",
          path: "/rede"
        },
        {
          icon: <Users size={16} />,
          text: "Rede de campanhas",
          path: "/redes-campanhas",
          roles: ["admin"]
        },
      ]
    },
    {
      type: 'item',
      icon: <Activity size={20} />,
      text: "Alcançe & Engajamento",
      path: "/alcance-campanhas",
      roles: ["admin"]
    },
    {
      type: 'item',
      icon: <Users size={20} />,
      text: "Usuarios",
      path: "/usuarios",
      roles: ["admin"]
    },
  ];

  // Filtrar itens baseado na role do usuário do contexto
  const filteredMenuItems = menuItems.filter(item => {
    if (item.type === 'submenu') {
      // Para submenus, filtrar os itens internos também
      const filteredSubItems = item.items.filter(subItem =>
        !subItem.roles || subItem.roles.includes(user?.role || "user")
      );
      return filteredSubItems.length > 0 && item.roles.includes(user?.role || "user");
    }
    return item.roles.includes(user?.role || "user");
  });

  // Abrir submenu automaticamente se a rota atual estiver dentro dele
  useEffect(() => {
    const networksPaths = ['/rede', '/redes', '/redes-campanhas'];
    if (networksPaths.includes(location.pathname)) {
      setNetworksSubmenuOpen(true);
    }
  }, [location.pathname]);

  return (
    <>
      {/* Botão mobile */}
      <button
        onClick={toggleMobile}
        className="md:hidden fixed top-4 left-4 z-50 bg-blue-600 text-white p-2 rounded-lg shadow-lg hover:bg-blue-700 transition-colors"
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
          ${darkMode ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"}
          ${isOpen ? "w-64" : "w-20"}
          ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
          shadow-xl border-r`}
      >
        {/* Cabeçalho */}
        <div className={`flex items-center justify-between p-5 border-b ${darkMode ? "border-gray-700" : "border-gray-200"
          }`}>
          <div className={`flex items-center gap-3 transition-all duration-300 ${isOpen ? "opacity-100" : "opacity-0 w-0"
            }`}>
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Award size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-blue-600">Devoter</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                {user?.role || "user"}
              </p>
            </div>
          </div>
          <button
            onClick={toggleSidebar}
            className={`
              hidden md:flex items-center justify-center text-gray-500 dark:text-gray-400 
              hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800
              rounded-lg p-1.5 transition-colors
              ${!isOpen ? "w-8 h-8" : ""}
            `}
          >
            {isOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {/* Navegação */}
        <nav className="flex-1 flex flex-col p-4 space-y-1 overflow-y-auto">
          {filteredMenuItems.map(item => {
            if (item.type === 'submenu') {
              return (
                <Submenu
                  key={item.text}
                  icon={item.icon}
                  text={item.text}
                  items={item.items.filter(subItem =>
                    !subItem.roles || subItem.roles.includes(user?.role || "user")
                  )}
                  isOpen={isOpen}
                  isSubmenuOpen={networksSubmenuOpen}
                  onToggle={toggleNetworksSubmenu}
                />
              );
            }

            return (
              <SidebarItem
                key={item.text}
                icon={item.icon}
                text={item.text}
                path={item.path}
                isOpen={isOpen}
              />
            );
          })}
        </nav>

        {/* Informações do usuário (apenas quando sidebar aberta) */}
        {isOpen && user && (
          <div className={`px-4 py-3 border-t ${darkMode ? "border-gray-700" : "border-gray-200"
            }`}>
            <div
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => navigate('/perfil')} // Adicione esta linha
            >
              <div
                className="w-10 h-10 rounded-full border border-gray-300 dark:border-gray-600 flex items-center justify-center text-white font-medium text-sm"
                style={{ backgroundColor: getUserColor() }}
                title={user.name || 'Usuário'}
              >
                {getUserInitials()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {user.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {user.email}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Rodapé: Switch de Tema + Sair */}
        <div className={`border-t ${darkMode ? "border-gray-700" : "border-gray-200"
          } p-4 space-y-2`}>
          <button
            onClick={toggleDarkMode}
            className={`flex items-center gap-3 w-full p-3 rounded-lg transition
              ${darkMode
                ? "hover:bg-gray-800 text-gray-100"
                : "hover:bg-blue-50 text-gray-700"
              }
              ${!isOpen ? "justify-center" : ""}`}
          >
            {darkMode ? (
              <Sun size={20} className="text-yellow-400" />
            ) : (
              <Moon size={20} className="text-gray-600" />
            )}
            {isOpen && (
              <span className="text-sm font-medium">
                {darkMode ? "Modo Claro" : "Modo Escuro"}
              </span>
            )}
          </button>

          <SidebarItem
            icon={<LogOut size={20} />}
            text="Sair"
            isOpen={isOpen}
            extraClass={`${darkMode
              ? "hover:bg-red-900/50 text-red-400"
              : "hover:bg-red-50 text-red-600"
              }`}
            onClick={handleLogout}
          />
        </div>
      </aside>
    </>
  );
};

export default Sidebar;