import { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Edit,
  Trash2,
  UserPlus,
  Eye,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  CheckCircle,
  XCircle,
  Key,
  Filter
} from "lucide-react";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import { useTheme } from "../../context/ThemeContext";
import { useCampaignColor } from "../../components/CampaignThemed";
import { userService, type User } from '../../services/userService';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useUser } from '../../context/UserContext';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

const UserManagement = () => {
  const { darkMode } = useTheme();
  useCampaignColor();
  const { user: currentUser } = useUser();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'user' | 'manager'>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editForm, setEditForm] = useState<Partial<User>>({});
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'user',
    gender: '',
    country: '',
    state: '',
    city: '',
    neighborhood: '',
    is_active: '1'
  });
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [estados, setEstados] = useState<any[]>([]);
  const [cidades, setCidades] = useState<any[]>([]);
  const [editPassword, setEditPassword] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (currentUser?.id) {
      loadUsers();
      loadEstados();
    }
  }, [currentUser]);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, statusFilter, roleFilter]);

  // Carregar estados do IBGE
  const loadEstados = async () => {
    try {
      const response = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados');
      const data = await response.json();
      setEstados(data.sort((a: any, b: any) => a.nome.localeCompare(b.nome)));
    } catch (error) {
      console.error('Erro ao carregar estados:', error);
    }
  };

  // Carregar cidades quando estado for selecionado
  useEffect(() => {
    const estadoSelecionado = createForm.state;
    if (estadoSelecionado) {
      fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${estadoSelecionado}/municipios`)
        .then((res) => res.json())
        .then((data) => setCidades(data.sort((a: any, b: any) => a.nome.localeCompare(b.nome))));
    }
  }, [createForm.state]);

  // Carregar cidades para edição quando estado for selecionado
  useEffect(() => {
    const estadoSelecionado = editForm.state;
    if (estadoSelecionado) {
      fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${estadoSelecionado}/municipios`)
        .then((res) => res.json())
        .then((data) => setCidades(data.sort((a: any, b: any) => a.nome.localeCompare(b.nome))));
    }
  }, [editForm.state]);

  const loadUsers = async () => {
    try {
      setLoading(true);

      // Se o usuário atual é super, carrega todos os usuários
      if (currentUser?.role === 'super') {
        console.log('👑 Usuário SUPER: carregando todos os usuários');
        const allUsers = await userService.getAll();
        setUsers(allUsers);
        return;
      }

      // Se o usuário atual é admin, verifica se ele tem campanhas
      if (currentUser?.role === 'admin') {
        // Primeiro verifica se o admin tem campanhas próprias
        const myCampaignUsers = await userService.getManageableUsers(currentUser?.id);

        if (myCampaignUsers.length > 0) {
          // Admin com campanhas: mostra apenas usuários das suas campanhas
          console.log('👑 Admin com campanhas: carregando usuários das minhas campanhas');
          setUsers(myCampaignUsers);
        } else {
          // Admin sem campanhas: mostra apenas o próprio usuário
          console.log('👑 Admin sem campanhas: carregando apenas próprio usuário');
          const allUsers = await userService.getAll();
          const currentUserOnly = allUsers.filter(user => String(user.id) === String(currentUser?.id));
          setUsers(currentUserOnly);
        }
      } else {
        // Usuário não-admin: carrega apenas usuários das suas campanhas
        const usersData = await userService.getManageableUsers(currentUser?.id);
        console.log('👤 Usuário não-admin: carregando usuários das minhas campanhas');
        setUsers(usersData);
      }

    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    // Filtro de busca
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phone.includes(searchTerm)
      );
    }

    // Filtro de status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(user =>
        statusFilter === 'active' ? user.is_active === "1" : user.is_active !== "1"
      );
    }

    // Filtro de role
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    setFilteredUsers(filtered);
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setEditForm({
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      is_active: user.is_active,
      gender: user.gender,
      country: user.country,
      state: user.state,
      city: user.city,
      neighborhood: user.neighborhood
    });
    setEditPassword({
      newPassword: '',
      confirmPassword: ''
    });
    setShowEditModal(true);
  };

  const handleView = (user: User) => {
    setSelectedUser(user);
    setShowViewModal(true);
  };

  const handleDelete = (user: User) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const handleCreate = () => {
    setCreateForm({
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      role: currentUser?.role === 'admin' ? 'manager' : 'user',
      gender: '',
      country: 'BR',
      state: currentUser?.state || '',
      city: '',
      neighborhood: '',
      is_active: '1'
    });
    setShowCreateModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedUser) return;

    try {
      setActionLoading('delete');
      await userService.delete(selectedUser.id);
      await loadUsers();
      setShowDeleteModal(false);
      setSelectedUser(null);
      toast.success('Usuário excluído com sucesso');
    } catch (error) {
      console.error('Erro ao deletar usuário:', error);
      toast.error('Erro ao excluir usuário');
    } finally {
      setActionLoading(null);
    }
  };

  const saveEdit = async () => {
    if (!selectedUser) return;

    try {
      setActionLoading('edit');
      
      // Preparar dados para atualização
      const updateData: any = {
        name: editForm.name,
        email: editForm.email,
        phone: editForm.phone,
        role: editForm.role,
        is_active: editForm.is_active,
        gender: editForm.gender,
        country: editForm.country,
        state: editForm.state,
        city: editForm.city,
        neighborhood: editForm.neighborhood
      };

      // Se há nova senha e ela foi confirmada
      if (editPassword.newPassword && editPassword.newPassword === editPassword.confirmPassword) {
        if (editPassword.newPassword.length < 6) {
          toast.error('A senha deve ter pelo menos 6 caracteres');
          return;
        }
        updateData.password = editPassword.newPassword;
      } else if (editPassword.newPassword !== editPassword.confirmPassword) {
        toast.error('As senhas não coincidem');
        return;
      }

      await userService.update(selectedUser.id, updateData);
      await loadUsers();
      setShowEditModal(false);
      setSelectedUser(null);
      setEditForm({});
      setEditPassword({ newPassword: '', confirmPassword: '' });
      toast.success('Usuário atualizado com sucesso');
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      toast.error('Erro ao atualizar usuário');
    } finally {
      setActionLoading(null);
    }
  };

  const createUser = async () => {
    // Validações
    if (!createForm.name || !createForm.email || !createForm.password) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    if (createForm.password !== createForm.confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    // Validação de senha igual ao invite
    if (createForm.password.length < 8) {
      toast.error('A senha deve ter pelo menos 8 caracteres');
      return;
    }

    if (!/[A-Z]/.test(createForm.password)) {
      toast.error('A senha deve conter pelo menos uma letra maiúscula');
      return;
    }

    if (!/[0-9]/.test(createForm.password)) {
      toast.error('A senha deve conter pelo menos um número');
      return;
    }

    if (!/[!@#$%^&*]/.test(createForm.password)) {
      toast.error('A senha deve conter pelo menos um símbolo especial (!@#$%^&*)');
      return;
    }

    try {
      setActionLoading('create');

      const userData = {
        name: createForm.name,
        email: createForm.email,
        phone: createForm.phone, // Já vem formatado sem símbolos do PhoneInput
        password: createForm.password,
        role: createForm.role,
        gender: createForm.gender || null,
        country: createForm.country || 'BR',
        state: createForm.state || null,
        city: createForm.city || null,
        neighborhood: createForm.neighborhood || null,
        is_active: createForm.is_active,
        // ✅ Associar à campanha do usuário atual
        campaign_id: currentUser?.campaign_id || null
      };

      const newUser = await userService.create(userData);
      
      // Se o usuário foi criado com sucesso e há campaign_id, vincular à campanha
      if (newUser.id && currentUser?.campaign_id) {
        await userService.assignToCampaign(newUser.id, currentUser.campaign_id, currentUser.id);
        console.log(`✅ Usuário ${newUser.name} vinculado à campanha ${currentUser.campaign_id}`);
      }
      
      await loadUsers();
      setShowCreateModal(false);
      setCreateForm({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        role: currentUser?.role === 'admin' ? 'manager' : 'user',
        gender: '',
        country: 'BR',
        state: '',
        city: '',
        neighborhood: '',
        is_active: '1'
      });
      toast.success('Usuário criado com sucesso');
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      toast.error('Erro ao criar usuário');
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (isActive: string) => {
    const isActiveBool = isActive === "1";
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isActiveBool
          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
        }`}>
        {isActiveBool ? (
          <>
            <CheckCircle className="w-3 h-3 mr-1" />
            Ativo
          </>
        ) : (
          <>
            <XCircle className="w-3 h-3 mr-1" />
            Inativo
          </>
        )}
      </span>
    );
  };

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      super: { color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300', icon: Shield, label: 'Super' },
      admin: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300', icon: Shield, label: 'Admin' },
      manager: { color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300', icon: Users, label: 'Liderança' },
      user: { color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300', icon: Users, label: 'Usuário' }
    };

    const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.user;
    const IconComponent = config.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <IconComponent className="w-3 h-3 mr-1" />
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className={`flex h-screen overflow-hidden transition-colors duration-300
        ${darkMode ? "bg-gray-950 text-gray-100" : "bg-gray-50 text-gray-900"}
      `}>
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className={`flex-1 overflow-y-auto p-6 transition-colors duration-300
            ${darkMode ? "bg-gray-950" : "bg-gray-50"}
          `}>
            <div className="max-w-7xl mx-auto flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                <p className={`mt-4 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  Carregando usuários...
                </p>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-screen overflow-hidden transition-colors duration-300
      ${darkMode ? "bg-gray-950 text-gray-100" : "bg-gray-50 text-gray-900"}
    `}>
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />

        <main className={`flex-1 overflow-y-auto p-6 transition-colors duration-300
          ${darkMode ? "bg-gray-950" : "bg-gray-50"}
        `}>
          <ToastContainer position="top-right" />
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-2xl font-bold">Gerenciamento de Usuários</h1>
                  <p className={`mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                    {currentUser?.role === 'admin'
                      ? 'Gerencie todos os usuários do sistema'
                      : 'Gerencie usuários das suas campanhas'
                    }
                  </p>
                </div>
                <button
                  onClick={handleCreate}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Novo Usuário
                </button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
              <div className={`rounded-lg p-4 ${darkMode ? "bg-gray-900" : "bg-white"} shadow`}>
                <div className="flex items-center">
                  <Users className={`w-8 h-8 ${darkMode ? "text-blue-400" : "text-blue-500"}`} />
                  <div className="ml-4">
                    <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Total</p>
                    <p className="text-2xl font-bold">{users.length}</p>
                  </div>
                </div>
              </div>
              <div className={`rounded-lg p-4 ${darkMode ? "bg-gray-900" : "bg-white"} shadow`}>
                <div className="flex items-center">
                  <CheckCircle className={`w-8 h-8 ${darkMode ? "text-green-400" : "text-green-500"}`} />
                  <div className="ml-4">
                    <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Ativos</p>
                    <p className="text-2xl font-bold">
                      {users.filter(u => u.is_active === "1").length}
                    </p>
                  </div>
                </div>
              </div>
              <div className={`rounded-lg p-4 ${darkMode ? "bg-gray-900" : "bg-white"} shadow`}>
                <div className="flex items-center">
                  <Shield className={`w-8 h-8 ${darkMode ? "text-purple-400" : "text-purple-500"}`} />
                  <div className="ml-4">
                    <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Administradores</p>
                    <p className="text-2xl font-bold">
                      {users.filter(u => u.role === 'admin').length}
                    </p>
                  </div>
                </div>
              </div>
              <div className={`rounded-lg p-4 ${darkMode ? "bg-gray-900" : "bg-white"} shadow`}>
                <div className="flex items-center">
                  <Users className={`w-8 h-8 ${darkMode ? "text-orange-400" : "text-orange-500"}`} />
                  <div className="ml-4">
                    <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Lideranças</p>
                    <p className="text-2xl font-bold">
                      {users.filter(u => u.role === 'manager').length}
                    </p>
                  </div>
                </div>
              </div>
              <div className={`rounded-lg p-4 ${darkMode ? "bg-gray-900" : "bg-white"} shadow`}>
                <div className="flex items-center">
                  <Filter className={`w-8 h-8 ${darkMode ? "text-yellow-400" : "text-yellow-500"}`} />
                  <div className="ml-4">
                    <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Visualização</p>
                    <p className="text-sm font-bold">
                      {currentUser?.role === 'admin' ? 'Todos' : 'Minhas Campanhas'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className={`rounded-lg p-6 mb-6 shadow ${darkMode ? "bg-gray-900" : "bg-white"}`}>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${darkMode ? "text-gray-400" : "text-gray-500"}`} />
                    <input
                      type="text"
                      placeholder="Buscar por nome, email ou telefone..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className={`w-full pl-10 pr-4 py-2 rounded-lg border transition-colors ${darkMode
                          ? "bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-blue-500"
                          : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500"
                        }`}
                    />
                  </div>
                </div>
                <div className="flex gap-4 flex-col md:flex-row">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className={`px-3 py-2 rounded-lg border transition-colors ${darkMode
                        ? "bg-gray-800 border-gray-700 text-white focus:border-blue-500"
                        : "bg-white border-gray-300 text-gray-900 focus:border-blue-500"
                      }`}
                  >
                    <option value="all">Todos os status</option>
                    <option value="active">Ativos</option>
                    <option value="inactive">Inativos</option>
                  </select>
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value as any)}
                    className={`px-3 py-2 rounded-lg  border transition-colors ${darkMode
                        ? "bg-gray-800 border-gray-700 text-white focus:border-blue-500"
                        : "bg-white border-gray-300 text-gray-900 focus:border-blue-500"
                      }`}
                  >
                    <option value="all">Todos os cargos</option>
                    <option value="admin">Administradores</option>
                    <option value="manager">Lideranças</option>
                    <option value="user">Usuários</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Users Table */}
            <div className={`rounded-lg shadow overflow-hidden ${darkMode ? "bg-gray-900" : "bg-white"}`}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className={darkMode ? "bg-gray-800" : "bg-gray-50"}>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                        Usuário
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                        Contato
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                        Cargo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                        Data de Criação
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className={darkMode ? "hover:bg-gray-800" : "hover:bg-gray-50"}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-medium ${user.role === 'admin'
                                ? 'bg-blue-500 text-white'
                                : user.role === 'manager'
                                  ? 'bg-purple-500 text-white'
                                  : 'bg-gray-400 text-white'
                              }`}>
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium">{user.name}</div>
                              <div className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                                ID: {user.id}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm">{user.email}</div>
                          <div className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                            {user.phone}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(user.is_active)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getRoleBadge(user.role)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {formatDate(user.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => handleView(user)}
                              className={`p-2 rounded-lg transition-colors ${darkMode
                                  ? "text-blue-400 hover:bg-gray-800"
                                  : "text-blue-600 hover:bg-gray-100"
                                }`}
                              title="Visualizar"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleEdit(user)}
                              className={`p-2 rounded-lg transition-colors ${darkMode
                                  ? "text-green-400 hover:bg-gray-800"
                                  : "text-green-600 hover:bg-gray-100"
                                }`}
                              title="Editar"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(user)}
                              className={`p-2 rounded-lg transition-colors ${darkMode
                                  ? "text-red-400 hover:bg-gray-800"
                                  : "text-red-600 hover:bg-gray-100"
                                }`}
                              title="Excluir"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredUsers.length === 0 && (
                <div className="text-center py-12">
                  <Users className={`mx-auto w-12 h-12 ${darkMode ? "text-gray-600" : "text-gray-400"}`} />
                  <p className={`mt-2 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                    Nenhum usuário encontrado
                  </p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto ${darkMode ? "bg-gray-900" : "bg-white"
            }`}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Criar Novo Usuário</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className={`p-1 rounded-lg ${darkMode ? "hover:bg-gray-800" : "hover:bg-gray-100"
                    }`}
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">
                    Nome Completo <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border transition-colors ${darkMode
                        ? "bg-gray-800 border-gray-700 text-white focus:border-blue-500"
                        : "bg-white border-gray-300 text-gray-900 focus:border-blue-500"
                      }`}
                    placeholder="Digite o nome completo"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border transition-colors ${darkMode
                        ? "bg-gray-800 border-gray-700 text-white focus:border-blue-500"
                        : "bg-white border-gray-300 text-gray-900 focus:border-blue-500"
                      }`}
                    placeholder="Digite o email"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">Telefone</label>
                  <PhoneInput
                    country={'br'}
                    value={createForm.phone}
                    onChange={(phone) => setCreateForm({ ...createForm, phone })}
                    inputClass={`w-full !p-4 !pl-16 !text-lg !border !rounded-lg transition-colors ${darkMode
                        ? "!bg-gray-800 !border-gray-700 !text-white focus:!border-blue-500"
                        : "!bg-white !border-gray-300 !text-gray-900 focus:!border-blue-500"
                      }`}
                    buttonClass={`!border ${darkMode ? "!bg-gray-700 !border-gray-600" : "!bg-white !border-gray-300"}`}
                    dropdownClass={darkMode ? "!bg-gray-800 !text-white" : ""}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Gênero</label>
                  <select
                    value={createForm.gender}
                    onChange={(e) => setCreateForm({ ...createForm, gender: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border transition-colors ${darkMode
                        ? "bg-gray-800 border-gray-700 text-white focus:border-blue-500"
                        : "bg-white border-gray-300 text-gray-900 focus:border-blue-500"
                      }`}
                  >
                    <option value="">Selecione</option>
                    <option value="male">Masculino</option>
                    <option value="female">Feminino</option>
                    <option value="other">Outro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Cargo</label>
                  <select
                    value={createForm.role}
                    onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border transition-colors ${darkMode
                        ? "bg-gray-800 border-gray-700 text-white focus:border-blue-500"
                        : "bg-white border-gray-300 text-gray-900 focus:border-blue-500"
                      }`}
                  >
                    {currentUser?.role === 'admin' ? (
                      <option value="manager">Liderança</option>
                    ) : (
                      <>
                        <option value="user">Usuário</option>
                        <option value="manager">Liderança</option>
                        <option value="admin">Administrador</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Senha <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={createForm.password}
                      onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                      className={`w-full px-3 py-2 rounded-lg border transition-colors ${darkMode
                          ? "bg-gray-800 border-gray-700 text-white focus:border-blue-500"
                          : "bg-white border-gray-300 text-gray-900 focus:border-blue-500"
                        }`}
                      placeholder="Digite a senha"
                    />
                    <Key className={`absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${darkMode ? "text-gray-400" : "text-gray-500"
                      }`} />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Confirmar Senha <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={createForm.confirmPassword}
                      onChange={(e) => setCreateForm({ ...createForm, confirmPassword: e.target.value })}
                      className={`w-full px-3 py-2 rounded-lg border transition-colors ${darkMode
                          ? "bg-gray-800 border-gray-700 text-white focus:border-blue-500"
                          : "bg-white border-gray-300 text-gray-900 focus:border-blue-500"
                        }`}
                      placeholder="Confirme a senha"
                    />
                    <Key className={`absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${darkMode ? "text-gray-400" : "text-gray-500"
                      }`} />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Status</label>
                  <select
                    value={createForm.is_active}
                    onChange={(e) => setCreateForm({ ...createForm, is_active: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border transition-colors ${darkMode
                        ? "bg-gray-800 border-gray-700 text-white focus:border-blue-500"
                        : "bg-white border-gray-300 text-gray-900 focus:border-blue-500"
                      }`}
                  >
                    <option value="1">Ativo</option>
                    <option value="0">Inativo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">País</label>
                  <input
                    type="text"
                    value={createForm.country}
                    onChange={(e) => setCreateForm({ ...createForm, country: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border transition-colors ${darkMode
                        ? "bg-gray-800 border-gray-700 text-white focus:border-blue-500"
                        : "bg-white border-gray-300 text-gray-900 focus:border-blue-500"
                      }`}
                    placeholder="Digite o país"
                    disabled
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Estado</label>
                  <select
                    value={createForm.state}
                    onChange={(e) => setCreateForm({ ...createForm, state: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border transition-colors ${darkMode
                        ? "bg-gray-800 border-gray-700 text-white focus:border-blue-500"
                        : "bg-white border-gray-300 text-gray-900 focus:border-blue-500"
                      }`}
                  >
                    <option value="">Selecione o estado</option>
                    {estados.map((estado) => (
                      <option key={estado.id} value={estado.sigla}>
                        {estado.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Cidade</label>
                  <select
                    value={createForm.city}
                    onChange={(e) => setCreateForm({ ...createForm, city: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border transition-colors ${darkMode
                        ? "bg-gray-800 border-gray-700 text-white focus:border-blue-500"
                        : "bg-white border-gray-300 text-gray-900 focus:border-blue-500"
                      }`}
                  >
                    <option value="">Selecione a cidade</option>
                    {cidades.map((cidade) => (
                      <option key={cidade.id} value={cidade.nome}>
                        {cidade.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Bairro</label>
                  <input
                    type="text"
                    value={createForm.neighborhood}
                    onChange={(e) => setCreateForm({ ...createForm, neighborhood: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border transition-colors ${darkMode
                        ? "bg-gray-800 border-gray-700 text-white focus:border-blue-500"
                        : "bg-white border-gray-300 text-gray-900 focus:border-blue-500"
                      }`}
                    placeholder="Digite o bairro"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-6 mt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className={`px-4 py-2 rounded-lg border transition-colors ${darkMode
                      ? "border-gray-600 text-gray-300 hover:bg-gray-800"
                      : "border-gray-300 text-gray-700 hover:bg-gray-100"
                    }`}
                >
                  Cancelar
                </button>
                <button
                  onClick={createUser}
                  disabled={actionLoading === 'create'}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  {actionLoading === 'create' ? 'Criando...' : 'Criar Usuário'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto ${darkMode ? "bg-gray-900" : "bg-white"
            }`}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Detalhes do Usuário</h3>
                <button
                  onClick={() => setShowViewModal(false)}
                  className={`p-1 rounded-lg ${darkMode ? "hover:bg-gray-800" : "hover:bg-gray-100"
                    }`}
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold ${selectedUser.role === 'admin'
                      ? 'bg-blue-500 text-white'
                      : selectedUser.role === 'manager'
                        ? 'bg-purple-500 text-white'
                        : 'bg-gray-400 text-white'
                    }`}>
                    {selectedUser.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-xl font-bold">{selectedUser.name}</h4>
                    <div className="flex space-x-2 mt-1">
                      {getStatusBadge(selectedUser.is_active)}
                      {getRoleBadge(selectedUser.role)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="flex items-center space-x-3">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span>{selectedUser.email}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span>{selectedUser.phone}</span>
                  </div>
                  {selectedUser.city && (
                    <div className="flex items-center space-x-3">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span>
                        {[selectedUser.city, selectedUser.state, selectedUser.country]
                          .filter(Boolean).join(', ')}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>Criado em: {formatDate(selectedUser.created_at)}</span>
                  </div>
                  {selectedUser.invited_by && (
                    <div className="flex items-center space-x-3">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span>Convidado por: {selectedUser.invited_by}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto ${darkMode ? "bg-gray-900" : "bg-white"
            }`}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Editar Usuário</h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className={`p-1 rounded-lg ${darkMode ? "hover:bg-gray-800" : "hover:bg-gray-100"
                    }`}
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Nome</label>
                  <input
                    type="text"
                    value={editForm.name || ''}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border transition-colors ${darkMode
                        ? "bg-gray-800 border-gray-700 text-white focus:border-blue-500"
                        : "bg-white border-gray-300 text-gray-900 focus:border-blue-500"
                      }`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <input
                    type="email"
                    value={editForm.email || ''}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border transition-colors ${darkMode
                        ? "bg-gray-800 border-gray-700 text-white focus:border-blue-500"
                        : "bg-white border-gray-300 text-gray-900 focus:border-blue-500"
                      }`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Telefone</label>
                  <PhoneInput
                    country={'br'}
                    value={editForm.phone || ''}
                    onChange={(phone) => setEditForm({ ...editForm, phone })}
                    inputClass={`w-full !p-4 !pl-16 !text-lg !border !rounded-lg transition-colors ${darkMode
                        ? "!bg-gray-800 !border-gray-700 !text-white focus:!border-blue-500"
                        : "!bg-white !border-gray-300 !text-gray-900 focus:!border-blue-500"
                      }`}
                    buttonClass={`!border ${darkMode ? "!bg-gray-700 !border-gray-600" : "!bg-white !border-gray-300"}`}
                    dropdownClass={darkMode ? "!bg-gray-800 !text-white" : ""}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Cargo</label>
                    <select
                      value={editForm.role || ''}
                      onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                      className={`w-full px-3 py-2 rounded-lg border transition-colors ${darkMode
                          ? "bg-gray-800 border-gray-700 text-white focus:border-blue-500"
                          : "bg-white border-gray-300 text-gray-900 focus:border-blue-500"
                        }`}
                    >
                      <option value="user">Usuário</option>
                      <option value="manager">Liderança</option>
                      <option value="admin">Administrador</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Status</label>
                    <select
                      value={editForm.is_active || ''}
                      onChange={(e) => setEditForm({ ...editForm, is_active: e.target.value })}
                      className={`w-full px-3 py-2 rounded-lg border transition-colors ${darkMode
                          ? "bg-gray-800 border-gray-700 text-white focus:border-blue-500"
                          : "bg-white border-gray-300 text-gray-900 focus:border-blue-500"
                        }`}
                    >
                      <option value="1">Ativo</option>
                      <option value="0">Inativo</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Estado</label>
                    <select
                      value={editForm.state || ''}
                      onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                      className={`w-full px-3 py-2 rounded-lg border transition-colors ${darkMode
                          ? "bg-gray-800 border-gray-700 text-white focus:border-blue-500"
                          : "bg-white border-gray-300 text-gray-900 focus:border-blue-500"
                        }`}
                    >
                      <option value="">Selecione o estado</option>
                      {estados.map((estado) => (
                        <option key={estado.id} value={estado.sigla}>
                          {estado.nome}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Cidade</label>
                    <select
                      value={editForm.city || ''}
                      onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                      className={`w-full px-3 py-2 rounded-lg border transition-colors ${darkMode
                          ? "bg-gray-800 border-gray-700 text-white focus:border-blue-500"
                          : "bg-white border-gray-300 text-gray-900 focus:border-blue-500"
                        }`}
                    >
                      <option value="">Selecione a cidade</option>
                      {cidades.map((cidade) => (
                        <option key={cidade.id} value={cidade.nome}>
                          {cidade.nome}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Bairro</label>
                  <input
                    type="text"
                    value={editForm.neighborhood || ''}
                    onChange={(e) => setEditForm({ ...editForm, neighborhood: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border transition-colors ${darkMode
                        ? "bg-gray-800 border-gray-700 text-white focus:border-blue-500"
                        : "bg-white border-gray-300 text-gray-900 focus:border-blue-500"
                      }`}
                  />
                </div>

                {/* Campo para alterar senha */}
                <div className="border-t pt-4 mt-4">
                  <h4 className="text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">
                    Alterar Senha (opcional)
                  </h4>
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <label className="block text-sm font-medium mb-2">Nova Senha</label>
                      <div className="relative">
                        <input
                          type="password"
                          value={editPassword.newPassword}
                          onChange={(e) => setEditPassword({ ...editPassword, newPassword: e.target.value })}
                          className={`w-full px-3 py-2 rounded-lg border transition-colors ${darkMode
                              ? "bg-gray-800 border-gray-700 text-white focus:border-blue-500"
                              : "bg-white border-gray-300 text-gray-900 focus:border-blue-500"
                            }`}
                          placeholder="Deixe em branco para manter a senha atual"
                        />
                        <Key className={`absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${darkMode ? "text-gray-400" : "text-gray-500"
                          }`} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Confirmar Nova Senha</label>
                      <div className="relative">
                        <input
                          type="password"
                          value={editPassword.confirmPassword}
                          onChange={(e) => setEditPassword({ ...editPassword, confirmPassword: e.target.value })}
                          className={`w-full px-3 py-2 rounded-lg border transition-colors ${darkMode
                              ? "bg-gray-800 border-gray-700 text-white focus:border-blue-500"
                              : "bg-white border-gray-300 text-gray-900 focus:border-blue-500"
                            }`}
                          placeholder="Confirme a nova senha"
                        />
                        <Key className={`absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${darkMode ? "text-gray-400" : "text-gray-500"
                          }`} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => setShowEditModal(false)}
                    className={`px-4 py-2 rounded-lg border transition-colors ${darkMode
                        ? "border-gray-600 text-gray-300 hover:bg-gray-800"
                        : "border-gray-300 text-gray-700 hover:bg-gray-100"
                      }`}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={saveEdit}
                    disabled={actionLoading === 'edit'}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {actionLoading === 'edit' ? 'Salvando...' : 'Salvar'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`rounded-lg shadow-xl max-w-md w-full ${darkMode ? "bg-gray-900" : "bg-white"
            }`}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-red-600">Confirmar Exclusão</h3>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className={`p-1 rounded-lg ${darkMode ? "hover:bg-gray-800" : "hover:bg-gray-100"
                    }`}
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <p className="mb-6">
                Tem certeza que deseja excluir o usuário <strong>{selectedUser.name}</strong>?
                Esta ação não pode ser desfeita.
              </p>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className={`px-4 py-2 rounded-lg border transition-colors ${darkMode
                      ? "border-gray-600 text-gray-300 hover:bg-gray-800"
                      : "border-gray-300 text-gray-700 hover:bg-gray-100"
                    }`}
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={actionLoading === 'delete'}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  {actionLoading === 'delete' ? 'Excluindo...' : 'Excluir'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;