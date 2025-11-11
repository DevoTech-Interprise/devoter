// src/pages/Schedule/ScheduleForm.tsx
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  ArrowLeft, 
  Save, 
  Calendar,
  MapPin,
  Type,
  Users,
  Clock
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useSchedule } from '../../pages/hooks/useSchedule';
import { useUser } from '../../context/UserContext';
import { scheduleEventSchema, type ScheduleEventFormData } from '../../schemas/schedule';
import Sidebar from '../../components/Sidebar';

export const ScheduleForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { darkMode, colors } = useTheme();
  const { user } = useUser();
  const { 
    createEvent, 
    updateEvent, 
    getEventById,
    loading, 
    error,
    clearError 
  } = useSchedule();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<any>(null);


  const isEditing = !!id;

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm<ScheduleEventFormData>({
    resolver: zodResolver(scheduleEventSchema),
    defaultValues: {
      title: '',
      description: '',
      start_date: '',
      end_date: '',
      location: '',
      event_type: 'meeting',
      campaign_id: user?.campaign_id || ''
    }
  });

  const watchedStartDate = watch('start_date');
  const watchedEndDate = watch('end_date');

  // Carregar evento se estiver editando
  useEffect(() => {
    if (id) {
      const loadEvent = async () => {
        try {
          const eventItem = await getEventById(id);
          if (eventItem) {
            setCurrentEvent(eventItem);
            reset({
              title: eventItem.title,
              description: eventItem.description,
              start_date: eventItem.start_date.slice(0, 16), // Formato para datetime-local
              end_date: eventItem.end_date.slice(0, 16),
              location: eventItem.location,
              event_type: eventItem.event_type,
              campaign_id: eventItem.campaign_id
            });
          }
        } catch (err) {
          toast.error('Erro ao carregar evento');
          navigate('/schedule');
        }
      };

      loadEvent();
    }
  }, [id, getEventById, reset, navigate]);

  // Limpar erro quando o componente desmontar
  useEffect(() => {
    return () => {
      clearError();
    };
  }, [clearError]);

  const onSubmit = async (data: ScheduleEventFormData) => {
    if (!user) {
      toast.error('Usuário não autenticado');
      return;
    }

    setIsSubmitting(true);
    clearError();

    try {
      let success: boolean;

      // Converter para formato ISO completo
      const formattedData = {
        ...data,
        start_date: new Date(data.start_date).toISOString(),
        end_date: new Date(data.end_date).toISOString()
      };

      if (isEditing) {
        success = await updateEvent(id!, formattedData);
        if (success) {
          toast.success('Evento atualizado com sucesso!');
        } else {
          throw new Error('Falha ao atualizar evento');
        }
      } else {
        success = await createEvent(formattedData);
        if (success) {
          toast.success('Evento criado com sucesso!');
        } else {
          throw new Error('Falha ao criar evento');
        }
      }

      if (success) {
        navigate('/schedule');
      }
    } catch (err: any) {
      console.error('Erro ao salvar evento:', err);
      toast.error(err.message || 'Erro ao salvar evento');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (window.confirm('Tem certeza que deseja cancelar? As alterações não salvas serão perdidas.')) {
      navigate('/schedule');
    }
  };

  const getEventTypeLabel = (type: string) => {
    const labels = {
      meeting: 'Reunião',
      campaign: 'Campanha',
      speech: 'Discurso',
      visit: 'Visita',
      other: 'Outro'
    };
    return labels[type as keyof typeof labels] || type;
  };

  if (isEditing && !currentEvent && !loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
        <Sidebar  />
        <div className="flex-1 lg:ml-64 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-500 text-lg">Evento não encontrado</p>
            <button 
              onClick={() => navigate('/schedule')}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Voltar para Agenda
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar  />
      
      <div className="lg:ml-64">
        <div className="py-8">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-8">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-4">
                  
                  <button
                    onClick={() => navigate('/schedule')}
                    className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-200 text-gray-600'}`}
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                      {isEditing ? 'Editar Evento' : 'Novo Evento'}
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                      {isEditing ? 'Atualize os dados do evento' : 'Adicione um novo evento à agenda'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className={`px-4 py-2 rounded-lg border transition-colors ${
                      darkMode 
                        ? 'border-gray-600 hover:bg-gray-800 text-gray-300' 
                        : 'border-gray-300 hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    Cancelar
                  </button>

                  <button
                    onClick={handleSubmit(onSubmit)}
                    disabled={isSubmitting || loading}
                    className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    style={{ backgroundColor: colors.primary }}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {isSubmitting ? 'Salvando...' : isEditing ? 'Atualizar' : 'Criar Evento'}
                  </button>
                </div>
              </div>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Formulário */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Título */}
                <div>
                  <label htmlFor="title" className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-200">
                    <Type className="w-4 h-4 inline mr-2" />
                    Título do Evento *
                  </label>
                  <input
                    id="title"
                    type="text"
                    {...register('title')}
                    placeholder="Ex: Reunião com Lideranças Locais"
                    className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:border-transparent ${
                      darkMode
                        ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-500'
                        : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500'
                    } ${errors.title ? 'border-red-500' : ''}`}
                  />
                  {errors.title && (
                    <p className="mt-1 text-sm text-red-500">{errors.title.message}</p>
                  )}
                </div>

                {/* Descrição */}
                <div>
                  <label htmlFor="description" className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-200">
                    Descrição *
                  </label>
                  <textarea
                    id="description"
                    rows={4}
                    {...register('description')}
                    placeholder="Descreva o evento, objetivos, participantes esperados..."
                    className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:border-transparent resize-none ${
                      darkMode
                        ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-500'
                        : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500'
                    } ${errors.description ? 'border-red-500' : ''}`}
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm text-red-500">{errors.description.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Data e Hora de Início */}
                  <div>
                    <label htmlFor="start_date" className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-200">
                      <Clock className="w-4 h-4 inline mr-2" />
                      Início *
                    </label>
                    <input
                      id="start_date"
                      type="datetime-local"
                      {...register('start_date')}
                      className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:border-transparent ${
                        darkMode
                          ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-500'
                          : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500'
                      } ${errors.start_date ? 'border-red-500' : ''}`}
                    />
                    {errors.start_date && (
                      <p className="mt-1 text-sm text-red-500">{errors.start_date.message}</p>
                    )}
                  </div>

                  {/* Data e Hora de Término */}
                  <div>
                    <label htmlFor="end_date" className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-200">
                      <Clock className="w-4 h-4 inline mr-2" />
                      Término *
                    </label>
                    <input
                      id="end_date"
                      type="datetime-local"
                      {...register('end_date')}
                      className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:border-transparent ${
                        darkMode
                          ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-500'
                          : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500'
                      } ${errors.end_date ? 'border-red-500' : ''}`}
                    />
                    {errors.end_date && (
                      <p className="mt-1 text-sm text-red-500">{errors.end_date.message}</p>
                    )}
                  </div>
                </div>

                {/* Localização */}
                <div>
                  <label htmlFor="location" className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-200">
                    <MapPin className="w-4 h-4 inline mr-2" />
                    Localização *
                  </label>
                  <input
                    id="location"
                    type="text"
                    {...register('location')}
                    placeholder="Ex: Centro Comunitário, Endereço completo..."
                    className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:border-transparent ${
                      darkMode
                        ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-500'
                        : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500'
                    } ${errors.location ? 'border-red-500' : ''}`}
                  />
                  {errors.location && (
                    <p className="mt-1 text-sm text-red-500">{errors.location.message}</p>
                  )}
                </div>

                {/* Tipo de Evento */}
                <div>
                  <label htmlFor="event_type" className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-200">
                    <Users className="w-4 h-4 inline mr-2" />
                    Tipo de Evento *
                  </label>
                  <select
                    id="event_type"
                    {...register('event_type')}
                    className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:border-transparent ${
                      darkMode
                        ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-500'
                        : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500'
                    } ${errors.event_type ? 'border-red-500' : ''}`}
                  >
                    <option value="meeting">Reunião</option>
                    <option value="campaign">Campanha</option>
                    <option value="speech">Discurso</option>
                    <option value="visit">Visita</option>
                    <option value="other">Outro</option>
                  </select>
                  {errors.event_type && (
                    <p className="mt-1 text-sm text-red-500">{errors.event_type.message}</p>
                  )}
                </div>

                {/* Campanha (apenas para super users) */}
                {user?.role === 'super' && (
                  <div>
                    <label htmlFor="campaign_id" className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-200">
                      Campanha *
                    </label>
                    <input
                      id="campaign_id"
                      type="text"
                      {...register('campaign_id')}
                      placeholder="ID da campanha"
                      className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:border-transparent ${
                        darkMode
                          ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-500'
                          : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500'
                      } ${errors.campaign_id ? 'border-red-500' : ''}`}
                    />
                    {errors.campaign_id && (
                      <p className="mt-1 text-sm text-red-500">{errors.campaign_id.message}</p>
                    )}
                  </div>
                )}

                {/* Informações Adicionais */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                    Informações do Criador
                  </h3>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-semibold">
                        {user?.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {user?.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {user?.role} • {user?.campaign_id || 'Campanha não definida'}
                      </p>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};