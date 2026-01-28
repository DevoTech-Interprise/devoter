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
  CalendarDays,
  BookDown,
  ChevronRight,
  Newspaper as News,
  Bot,
  Flag,
  ListTodo
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { useUser } from "../context/UserContext";
import { useCampaign } from "../context/CampaignContext";
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
  const { campaign } = useCampaign();
  
  const primaryColor = campaign?.color_primary || '#2563eb';

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
      style={isActive ? { backgroundColor: primaryColor } : {}}
      className={`flex items-center gap-3 w-full p-3 rounded-lg transition
        ${isActive
          ? "text-white"
          : darkMode
            ? "hover:bg-gray-800 text-gray-100"
            : "hover:bg-blue-50 text-gray-700"
        }
        ${!isOpen ? "justify-center" : ""} 
        ${isSubmenu ? "pl-8 text-sm" : ""}
        ${extraClass}`}
    >
      <span className={isActive ? "text-white" : darkMode ? "text-gray-300" : ""} style={!isActive && !darkMode ? { color: primaryColor } : {}}>
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
  const { campaign } = useCampaign();
  
  const primaryColor = campaign?.color_primary || '#2563eb';

  // Verifica se algum item do submenu está ativo
  const isActive = items.some(item => location.pathname === item.path);

  return (
    <div>
      {/* Botão do submenu */}
      <button
        onClick={onToggle}
        style={isActive ? { backgroundColor: primaryColor } : {}}
        className={`flex items-center justify-between w-full p-3 rounded-lg transition
          ${isActive
            ? "text-white"
            : darkMode
              ? "hover:bg-gray-800 text-gray-100"
              : "hover:bg-blue-50 text-gray-700"
          }
          ${!isOpen ? "justify-center" : ""}`}
      >
        <div className="flex items-center gap-3">
          <span className={isActive ? "text-white" : darkMode ? "text-gray-300" : ""} style={!isActive && !darkMode ? { color: primaryColor } : {}}>
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
  const { campaign } = useCampaign();
  const navigate = useNavigate();
  const location = useLocation();
  
  const primaryColor = campaign?.color_primary || '#2563eb';

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
      roles: ["admin","manager", "super"]
    },
    {
      type: 'item',
      icon: <Award size={20} />,
      text: "Campanhas",
      path: "/campanhas",
      roles: ["admin", "super"]
    },
    {
      type: 'item',
      icon: <Send size={20} />,
      text: "Convites",
      path: "/convites",
      roles: ["admin", "user", "manager", "super"],
    },
    {
      type: 'submenu',
      icon: <Users size={20} />,
      text: "Redes",
      roles: ["admin", "user", "manager", "super"],
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
          roles: ["admin", "super"]
        },
      ]
    },
    {
      type: 'item',
      icon: <Activity size={20} />,
      text: "Alcançe",
      path: "/alcance-campanhas",
      roles: ["admin", "super"]
    },
    {
      type: 'item',
      icon: <Users size={20} />,
      text: "Usuarios",
      path: "/usuarios",
      roles: ["admin", "super"]
    },
    {
      type: 'item',
      icon: <News size={20} />,
      text: "Noticias",
      path: "/news",
      roles: ["super","user","admin","manager"]
    },
    {
      type: 'item',
      icon: <CalendarDays size={20} />,
      text: "Agendas",
      path: "/schedule",
      roles: ["admin", "super","manager"]
    },
    {
      type: 'item',
      icon: <Bot size={20} />,
      text: "IA",
      path: "/ia",
      roles: ["admin", "super"]
    },
    {
      type: 'item',
      icon: <Flag size={20} />,
      text: "Denúncias",
      path: "/denuncias",
      roles: ["admin", "super", "manager"]
    },
    {
      type: 'item',
      icon: <ListTodo size={20} />,
      text: "Tarefas",
      path: "/tarefas",
      roles: ["admin", "super", "manager", "user"]
    },
    {
      type: 'item',
      icon: <BookDown size={20} />,
      text: "Materiais de campanha",
      path: "/materiais-campanha",
      roles: ["admin", "super", "manager", "user"]
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
        style={{ backgroundColor: primaryColor }}
        className="md:hidden fixed top-4 left-4 z-50 text-white p-2 rounded-lg shadow-lg hover:opacity-90 transition-all"
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
        className={`fixed md:static z-50 h-full md:h-auto transition-all duration-300 flex flex-col
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
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: primaryColor }}>
              <Award size={18} className="text-white" />
            </div>
            <div>
              <h1 className="font-bold" style={{ color: primaryColor, fontSize: '1.125rem' }}>Soudabase</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                {user?.role || "user"}
              </p>
            </div>
          </div>
          <button
            onClick={toggleSidebar}
            className={`
              hidden md:flex items-center justify-center text-gray-500 dark:text-gray-400 
              hover:bg-gray-100 dark:hover:bg-gray-800
              rounded-lg p-1.5 transition-colors
              ${!isOpen ? "w-8 h-8" : ""}
            `}
            style={!darkMode ? { color: primaryColor } : {}}
            onMouseEnter={(e) => {
              if (!darkMode) e.currentTarget.style.color = primaryColor;
            }}
          >
            {isOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {/* Navegação */}
        <nav className="flex-1 flex flex-col p-4 space-y-1 overflow-y-auto sidebar-scroll">
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
                style={{ backgroundColor: primaryColor }}
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

      {/* Estilos do scroll customizado */}
      <style>{`
        .sidebar-scroll::-webkit-scrollbar {
          width: 5px;
        }

        .sidebar-scroll::-webkit-scrollbar-track {
          background: transparent;
          margin: 8px 0;
        }

        .sidebar-scroll::-webkit-scrollbar-thumb {
          background: ${primaryColor};
          border-radius: 10px;
          opacity: 0.6;
        }

        .sidebar-scroll::-webkit-scrollbar-thumb:hover {
          opacity: 1;
        }

        /* Para Firefox */
        .sidebar-scroll {
          scrollbar-width: thin;
          scrollbar-color: ${primaryColor} transparent;
        }

        /* Suavizar transição do scroll */
        .sidebar-scroll {
          scroll-behavior: smooth;
        }
      `}</style>
    </>
  );
};

export default Sidebar;