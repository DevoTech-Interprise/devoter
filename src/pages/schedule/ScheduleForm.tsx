// src/pages/Schedule/ScheduleForm.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ArrowLeft, Save, Calendar, MapPin, Users, Type, Building2 } from 'lucide-react';
import { useSchedule } from '../../pages/hooks/useSchedule';
import { useUser } from '../../context/UserContext';
import { useCampaigns } from '../../pages/hooks/useCampaigns';
import Sidebar from '../../components/Sidebar';

export const ScheduleForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { createEvent, updateEvent, getEventById, loading, events } = useSchedule();
  const { user } = useUser();
  const { campaigns, loading: campaignsLoading } = useCampaigns();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    location: '',
    event_type: 'meeting' as 'meeting' | 'campaign' | 'speech' | 'visit' | 'other',
    status: 'pending' as 'confirmed' | 'pending' | 'cancelled',
    campaign_id: ''
  });

  const isEditing = Boolean(id);

  // Determinar se o usuário pode selecionar "Sem Campanha"
  const canSelectNoCampaign = user && (user.role === 'super' || user.role === 'admin' || user.role === 'manager');

  // Definir campanha padrão baseado no usuário
  useEffect(() => {
    if (!isEditing && user?.campaign_id && campaigns.length > 0) {
      // Se o usuário tem uma campanha vinculada, usa como padrão
      const userCampaign = campaigns.find(campaign => campaign.id.toString() === user.campaign_id);
      if (userCampaign) {
        setFormData(prev => ({
          ...prev,
          campaign_id: userCampaign.id.toString()
        }));
      }
    }
  }, [user, campaigns, isEditing]);

  // Carregar dados do evento se estiver editando
  useEffect(() => {
    const loadEvent = async () => {
      if (!id) return;

      try {
        let eventData;
        
        // Primeiro tenta buscar na lista de eventos já carregada
        if (events.length > 0) {
          eventData = events.find(event => event.id === id);
        }
        
        // Se não encontrou, busca diretamente pelo ID
        if (!eventData) {
          eventData = await getEventById(id);
        }

        if (eventData) {
          // Converter datas para formato datetime-local
          const formatDateForInput = (dateString: string) => {
            const date = new Date(dateString);
            return date.toISOString().slice(0, 16);
          };

          setFormData({
            title: eventData.title,
            description: eventData.description,
            start_date: formatDateForInput(eventData.start_date),
            end_date: formatDateForInput(eventData.end_date),
            location: eventData.location,
            event_type: eventData.event_type,
            status: eventData.status,
            campaign_id: eventData.campaign_id || ''
          });
        } else {
          throw new Error('Evento não encontrado');
        }
      } catch (err: any) {
        console.error('Erro ao carregar evento:', err);
        toast.error(err.message || 'Erro ao carregar evento');
        navigate('/schedule');
      }
    };

    loadEvent();
  }, [id, events, getEventById, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação de campanha
    if (!formData.campaign_id && !canSelectNoCampaign) {
      toast.error('Selecione uma campanha para o evento');
      return;
    }

    try {
      let result;

      if (isEditing) {
        // Editar evento existente
        if (!id) {
          toast.error('ID do evento não encontrado');
          return;
        }

        const updateData = {
          title: formData.title,
          description: formData.description,
          start_date: formData.start_date,
          end_date: formData.end_date,
          location: formData.location,
          event_type: formData.event_type,
          status: formData.status,
          campaign_id: formData.campaign_id || null
        };

        result = await updateEvent(id, updateData);
        
        if (result) {
          toast.success('Evento atualizado com sucesso!');
          navigate('/schedule');
        } else {
          throw new Error('Falha ao atualizar evento');
        }
      } else {
        // Criar novo evento
        const eventData = {
          ...formData,
          created_by: user?.id || '',
          campaign_id: formData.campaign_id || null
        };

        result = await createEvent(eventData);
        
        if (result) {
          toast.success('Evento criado com sucesso!');
          navigate('/schedule');
        } else {
          throw new Error('Falha ao criar evento');
        }
      }
    } catch (err: any) {
      toast.error(err.message || `Erro ao ${isEditing ? 'atualizar' : 'criar'} evento`);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          <div className="py-15">
            <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
              {/* Header */}
              <div className="mb-8">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => navigate('/schedule')}
                    className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-400"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>

                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {isEditing ? 'Editar Evento' : 'Criar Novo Evento'}
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                      {isEditing 
                        ? 'Atualize as informações do evento' 
                        : 'Preencha as informações do novo evento'
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Formulário */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Título */}
                  <div>
                    <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <Type className="w-4 h-4 mr-2" />
                      Título do Evento
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Digite o título do evento"
                    />
                  </div>

                  {/* Descrição */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Descrição
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      required
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Descreva o evento..."
                    />
                  </div>

                  {/* Campanha */}
                  <div>
                    <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <Building2 className="w-4 h-4 mr-2" />
                      Campanha
                    </label>
                    <select
                      name="campaign_id"
                      value={formData.campaign_id}
                      onChange={handleChange}
                      required={!canSelectNoCampaign}
                      disabled={campaignsLoading}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      <option value="">{campaignsLoading ? 'Carregando campanhas...' : 'Selecione uma campanha'}</option>
                      
                      {/* Opção "Sem Campanha" apenas para usuários autorizados */}
                      {canSelectNoCampaign && (
                        <option value="">Sem Campanha</option>
                      )}
                      
                      {/* Lista de campanhas */}
                      {campaigns.map((campaign) => (
                        <option key={campaign.id} value={campaign.id}>
                          {campaign.name}
                        </option>
                      ))}
                    </select>
                    
                    {/* Ajuda contextual */}
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {user?.role === 'super' 
                        ? 'Você pode selecionar qualquer campanha ou criar evento sem campanha'
                        : user?.role === 'admin' || user?.role === 'manager'
                        ? `Você pode selecionar entre suas campanhas${canSelectNoCampaign ? ' ou criar evento sem campanha' : ''}`
                        : 'Selecione a campanha para o evento'
                      }
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Data e Hora de Início */}
                    <div>
                      <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <Calendar className="w-4 h-4 mr-2" />
                        Início
                      </label>
                      <input
                        type="datetime-local"
                        name="start_date"
                        value={formData.start_date}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Data e Hora de Término */}
                    <div>
                      <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <Calendar className="w-4 h-4 mr-2" />
                        Término
                      </label>
                      <input
                        type="datetime-local"
                        name="end_date"
                        value={formData.end_date}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Localização */}
                  <div>
                    <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <MapPin className="w-4 h-4 mr-2" />
                      Localização
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Onde o evento acontecerá?"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Tipo de Evento */}
                    <div>
                      <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <Users className="w-4 h-4 mr-2" />
                        Tipo de Evento
                      </label>
                      <select
                        name="event_type"
                        value={formData.event_type}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="meeting">Reunião</option>
                        <option value="campaign">Campanha</option>
                        <option value="speech">Discurso</option>
                        <option value="visit">Visita</option>
                        <option value="other">Outro</option>
                      </select>
                    </div>

                    {/* Status (apenas para edição) */}
                    {isEditing && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Status
                        </label>
                        <select
                          name="status"
                          value={formData.status}
                          onChange={handleChange}
                          required
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="pending">Pendente</option>
                          <option value="confirmed">Confirmado</option>
                          <option value="cancelled">Cancelado</option>
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Botões */}
                  <div className="flex space-x-3 pt-6">
                    <button
                      type="button"
                      onClick={() => navigate('/schedule')}
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={loading || campaignsLoading}
                      className="flex items-center justify-center flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {loading 
                        ? (isEditing ? 'Atualizando...' : 'Criando...') 
                        : (isEditing ? 'Atualizar Evento' : 'Criar Evento')
                      }
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};