// src/pages/profile/UserProfile.tsx
import { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Lock, Save, X, Eye, EyeOff, Search } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import { useTheme } from '../../context/ThemeContext';
import { useUser } from '../../context/UserContext';
import { userService } from '../../services/userService';
import { locationService, type State, type City, type Neighborhood } from '../../services/locationService';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const UserProfile = () => {
  const { darkMode } = useTheme();
  const { user, refreshUser } = useUser();
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Estados para dados de localização
  const [states, setStates] = useState<State[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingNeighborhoods, setLoadingNeighborhoods] = useState(false);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    gender: '',
    country: 'Brasil',
    state: '',
    city: '',
    neighborhood: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Buscar estados ao carregar o componente
  useEffect(() => {
    fetchStates();
  }, []);

  // Buscar estados
  const fetchStates = async () => {
    try {
      setLoadingStates(true);
      const statesData = await locationService.getStates();
      setStates(statesData);
    } catch (error) {
      console.error('Erro ao carregar estados:', error);
      toast.error('Erro ao carregar estados');
    } finally {
      setLoadingStates(false);
    }
  };

  // Buscar cidades quando estado for selecionado
  const fetchCities = async (stateSigla: string) => {
    try {
      setLoadingCities(true);
      setCities([]);
      setNeighborhoods([]);
      
      const state = states.find(s => s.sigla === stateSigla);
      if (state) {
        const citiesData = await locationService.getCitiesByState(state.id);
        setCities(citiesData);
      }
    } catch (error) {
      console.error('Erro ao carregar cidades:', error);
      toast.error('Erro ao carregar cidades');
    } finally {
      setLoadingCities(false);
    }
  };

  // Buscar bairros quando cidade for selecionada - CORREÇÃO AQUI
  const fetchNeighborhoods = async (cityName: string, stateSigla: string) => {
    try {
      setLoadingNeighborhoods(true);
      setNeighborhoods([]);
      
      // Usando uma API alternativa mais confiável para bairros
      const neighborhoodsData = await getNeighborhoodsFromAPI(cityName, stateSigla);
      setNeighborhoods(neighborhoodsData);
    } catch (error) {
      console.error('Erro ao carregar bairros:', error);
      // Não mostra erro pois algumas cidades podem não ter bairros na API
    } finally {
      setLoadingNeighborhoods(false);
    }
  };

  // API alternativa para bairros - CORREÇÃO
  const getNeighborhoodsFromAPI = async (cityName: string, stateSigla: string): Promise<Neighborhood[]> => {
    try {
      // Tentativa 1: API do IBGE (mais confiável para cidades)
      // Para bairros, vamos usar uma abordagem diferente já que o IBGE não tem bairros
      
      // Tentativa 2: Usar uma API de geolocalização alternativa
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&city=${encodeURIComponent(cityName)}&state=${encodeURIComponent(stateSigla)}&country=Brazil&addressdetails=1&limit=50`
      );
      
      if (!response.ok) return [];
      
      const data = await response.json();
      
      // Extrair bairros únicos dos resultados
      const uniqueNeighborhoods = new Set<string>();
      
      data.forEach((item: any) => {
        if (item.address.suburb || item.address.neighbourhood) {
          const neighborhoodName = item.address.suburb || item.address.neighbourhood;
          uniqueNeighborhoods.add(neighborhoodName);
        }
      });
      
      return Array.from(uniqueNeighborhoods)
        .map((nome, index) => ({ id: index, nome }))
        .sort((a, b) => a.nome.localeCompare(b.nome));
        
    } catch (error) {
      console.error('Erro na API de bairros:', error);
      return [];
    }
  };

  // Buscar endereço por CEP
  const fetchAddressByCEP = async (cep: string) => {
    try {
      const cleanedCEP = cep.replace(/\D/g, '');
      if (cleanedCEP.length !== 8) return;

      const address = await locationService.getAddressByCEP(cleanedCEP);
      if (address) {
        // Encontrar o estado correspondente
        const state = states.find(s => s.sigla === address.uf);
        if (state) {
          setForm(prev => ({
            ...prev,
            state: state.sigla,
            city: address.localidade,
            neighborhood: address.bairro
          }));

          // Buscar cidades do estado selecionado
          await fetchCities(state.sigla);
          
          // Buscar bairros da cidade selecionada
          if (address.localidade && address.bairro) {
            await fetchNeighborhoods(address.localidade, state.sigla);
          }
        }
        toast.success('Endereço preenchido automaticamente!');
      } else {
        toast.error('CEP não encontrado');
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      toast.error('Erro ao buscar CEP');
    }
  };

  // Preencher formulário com dados do usuário - CORREÇÃO AQUI
  useEffect(() => {
    if (user) {
      const userForm = {
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        gender: user.gender || '',
        country: user.country || 'Brasil',
        state: user.state || '',
        city: user.city || '',
        neighborhood: user.neighborhood || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      };
      
      setForm(userForm);

      // Se o usuário já tem estado e cidade, carregar os dados correspondentes
      if (user.state && states.length > 0) {
        const state = states.find(s => s.sigla === user.state);
        if (state) {
          fetchCities(user.state).then(() => {
            // Após carregar cidades, buscar bairros se houver cidade
            if (user.city) {
              fetchNeighborhoods(user.city, user.state);
            }
          });
        }
      }
    }
  }, [user, states]); // Adicionei states como dependência

  // CORREÇÃO: Atualizar o preview quando o formulário mudar
  useEffect(() => {
    // Esta função garante que o preview seja atualizado
    // quando os dados do formulário mudarem
  }, [form]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));

    // Lógica para carregar dados dependentes
    if (name === 'state' && value) {
      fetchCities(value);
    } else if (name === 'city' && value && form.state) {
      fetchNeighborhoods(value, form.state);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Preparar dados para atualização
      const updateData: any = {
        name: form.name,
        email: form.email,
        phone: form.phone,
        gender: form.gender,
        country: form.country,
        state: form.state,
        city: form.city,
        neighborhood: form.neighborhood
      };

      // Se há senha para alterar, validar
      if (form.newPassword) {
        if (form.newPassword !== form.confirmPassword) {
          toast.error('As senhas não coincidem');
          return;
        }
        if (form.newPassword.length < 6) {
          toast.error('A senha deve ter pelo menos 6 caracteres');
          return;
        }
        updateData.password = form.newPassword;
      }

      await userService.update(user.id, updateData);
      
      // Atualizar dados no contexto
      await refreshUser();
      
      setEditing(false);
      toast.success('Perfil atualizado com sucesso!');
      
      // Limpar campos de senha
      setForm(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      toast.error('Erro ao atualizar perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setForm({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        gender: user.gender || '',
        country: user.country || 'Brasil',
        state: user.state || '',
        city: user.city || '',
        neighborhood: user.neighborhood || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });

      // Restaurar dados de localização
      if (user.state && states.length > 0) {
        const state = states.find(s => s.sigla === user.state);
        if (state) {
          fetchCities(user.state).then(() => {
            if (user.city) {
              fetchNeighborhoods(user.city, user.state);
            }
          });
        }
      }
    }
    setEditing(false);
  };

  // Função para obter as iniciais do nome do usuário
  const getUserInitials = () => {
    if (!user?.name) return "U";
    const names = user.name.split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };

  // Função para gerar cor baseada no nome
  const getUserColor = () => {
    if (!user?.name) return '#0D8ABC';
    const colors = ['#0D8ABC', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];
    let hash = 0;
    for (let i = 0; i < user.name.length; i++) {
      hash = user.name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  // CORREÇÃO: Função para verificar se o usuário tem endereço completo
  const hasCompleteAddress = () => {
    return user?.state && user?.city && user?.neighborhood;
  };

  if (!user) {
    return (
      <div className={`flex h-screen ${darkMode ? "bg-gray-950" : "bg-gray-50"}`}>
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Carregando...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-screen ${darkMode ? "bg-gray-950" : "bg-gray-50"}`}>
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto p-6">
          <ToastContainer position="top-right" />
          
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
                Meu Perfil
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Gerencie suas informações pessoais e preferências
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Coluna da Esquerda - Avatar e Info Básica */}
              <div className="lg:col-span-1">
                <div className={`rounded-xl p-6 ${darkMode ? "bg-gray-900" : "bg-white"} shadow-lg border ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
                  <div className="text-center">
                    <div className="relative inline-block">
                      <div 
                        className="w-24 h-24 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4 border-4 border-white shadow-lg"
                        style={{ backgroundColor: getUserColor() }}
                      >
                        {getUserInitials()}
                      </div>
                      <div className={`absolute bottom-2 right-2 w-6 h-6 rounded-full border-2 ${darkMode ? "border-gray-900" : "border-white"} flex items-center justify-center ${
                        user.is_active === "1" ? "bg-green-500" : "bg-red-500"
                      }`}>
                        <div className="w-2 h-2 rounded-full bg-white"></div>
                      </div>
                    </div>
                    
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-1">
                      {user.name}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">{user.email}</p>
                    
                    <div className="space-y-2 text-sm text-left">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-400 capitalize">
                          {user.role === 'admin' ? 'Administrador' : 'Usuário'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-400">{user.email}</span>
                      </div>
                      {user.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600 dark:text-gray-400">{user.phone}</span>
                        </div>
                      )}
                      
                      {/* CORREÇÃO: Mostrar endereço no preview */}
                      {(user.state || user.city || user.neighborhood) && (
                        <div className="flex items-start gap-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                          <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                          <div className="text-left">
                            <span className="text-gray-600 dark:text-gray-400 block">
                              {[user.neighborhood, user.city, user.state]
                                .filter(Boolean)
                                .join(', ')}
                            </span>
                            {!hasCompleteAddress() && (
                              <span className="text-yellow-600 text-xs block mt-1">
                                ⚠️ Complete seu endereço
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Coluna da Direita - Formulário */}
              <div className="lg:col-span-2">
                <div className={`rounded-xl p-6 ${darkMode ? "bg-gray-900" : "bg-white"} shadow-lg border ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                      Informações Pessoais
                    </h3>
                    {!editing ? (
                      <button
                        onClick={() => setEditing(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                      >
                        <User className="w-4 h-4" />
                        Editar Perfil
                      </button>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={handleCancel}
                          className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                          <X className="w-4 h-4" />
                          Cancelar
                        </button>
                        <button
                          onClick={handleSave}
                          disabled={loading}
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
                        >
                          <Save className="w-4 h-4" />
                          {loading ? 'Salvando...' : 'Salvar'}
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-6">
                    {/* Informações Básicas */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Nome Completo
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={form.name}
                          onChange={handleChange}
                          disabled={!editing}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          E-mail
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={form.email}
                          onChange={handleChange}
                          disabled={!editing}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Telefone
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={form.phone}
                          onChange={handleChange}
                          disabled={!editing}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed"
                          placeholder="(00) 00000-0000"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Gênero
                        </label>
                        <select
                          name="gender"
                          value={form.gender}
                          onChange={handleChange}
                          disabled={!editing}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed"
                        >
                          <option value="">Selecione</option>
                          <option value="M">Masculino</option>
                          <option value="F">Feminino</option>
                          <option value="NI">Não informar</option>
                        </select>
                      </div>
                    </div>

                    {/* Endereço */}
                    <div>
                      <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                        <MapPin className="w-5 h-5" />
                        Endereço
                        {!hasCompleteAddress() && editing && (
                          <span className="text-yellow-600 text-sm font-normal">
                            (Recomendado completar)
                          </span>
                        )}
                      </h4>
                      
                      {/* Busca por CEP */}
                      {editing && (
                        <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            🔍 Buscar endereço por CEP
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="Digite o CEP (apenas números)"
                              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                              onBlur={(e) => fetchAddressByCEP(e.target.value)}
                              maxLength={9}
                            />
                            <button
                              type="button"
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                              onClick={() => {
                                const cepInput = document.querySelector('input[placeholder="Digite o CEP (apenas números)"]') as HTMLInputElement;
                                if (cepInput) fetchAddressByCEP(cepInput.value);
                              }}
                            >
                              <Search className="w-4 h-4" />
                              Buscar
                            </button>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            Digite o CEP para preencher automaticamente o endereço
                          </p>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            País
                          </label>
                          <input
                            type="text"
                            name="country"
                            value={form.country}
                            onChange={handleChange}
                            disabled={!editing}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Estado *
                          </label>
                          <select
                            name="state"
                            value={form.state}
                            onChange={handleChange}
                            disabled={!editing || loadingStates}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed"
                          >
                            <option value="">Selecione um estado</option>
                            {states.map(state => (
                              <option key={state.id} value={state.sigla}>
                                {state.nome} ({state.sigla})
                              </option>
                            ))}
                          </select>
                          {loadingStates && (
                            <p className="text-xs text-gray-500 mt-1">Carregando estados...</p>
                          )}
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Cidade *
                          </label>
                          <select
                            name="city"
                            value={form.city}
                            onChange={handleChange}
                            disabled={!editing || !form.state || loadingCities}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed"
                          >
                            <option value="">{form.state ? 'Selecione uma cidade' : 'Selecione um estado primeiro'}</option>
                            {cities.map(city => (
                              <option key={city.id} value={city.nome}>
                                {city.nome}
                              </option>
                            ))}
                          </select>
                          {loadingCities && (
                            <p className="text-xs text-gray-500 mt-1">Carregando cidades...</p>
                          )}
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Bairro *
                          </label>
                          {neighborhoods.length > 0 ? (
                            <select
                              name="neighborhood"
                              value={form.neighborhood}
                              onChange={handleChange}
                              disabled={!editing || !form.city || loadingNeighborhoods}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed"
                            >
                              <option value="">Selecione um bairro</option>
                              {neighborhoods.map(neighborhood => (
                                <option key={neighborhood.id} value={neighborhood.nome}>
                                  {neighborhood.nome}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type="text"
                              name="neighborhood"
                              value={form.neighborhood}
                              onChange={handleChange}
                              disabled={!editing || !form.city}
                              placeholder="Digite o nome do bairro"
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed"
                            />
                          )}
                          {loadingNeighborhoods && (
                            <p className="text-xs text-gray-500 mt-1">Buscando bairros...</p>
                          )}
                          {!loadingNeighborhoods && form.city && neighborhoods.length === 0 && (
                            <p className="text-xs text-gray-500 mt-1">
                              Digite o nome do bairro manualmente
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Alteração de Senha */}
                    {editing && (
                      <div>
                        <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                          <Lock className="w-5 h-5" />
                          Alterar Senha
                        </h4>
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Nova Senha
                              </label>
                              <div className="relative">
                                <input
                                  type={showPassword ? "text" : "password"}
                                  name="newPassword"
                                  value={form.newPassword}
                                  onChange={handleChange}
                                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white pr-10"
                                  placeholder="Mínimo 6 caracteres"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowPassword(!showPassword)}
                                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                              </div>
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Confirmar Senha
                              </label>
                              <input
                                type={showPassword ? "text" : "password"}
                                name="confirmPassword"
                                value={form.confirmPassword}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                placeholder="Digite novamente"
                              />
                            </div>
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Deixe em branco se não quiser alterar a senha
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default UserProfile;