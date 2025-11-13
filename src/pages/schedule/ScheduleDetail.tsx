// src/pages/Schedule/ScheduleDetail.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  Edit3,
  Trash2,
  Clock,
  User,
  Clock as ClockIcon
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useSchedule } from '../../pages/hooks/useSchedule';
import { useUser } from '../../context/UserContext';
import Sidebar from '../../components/Sidebar';

export const ScheduleDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const { user } = useUser();
  const {
    events,
    getEventById,
    deleteEvent,
    loading,
    error,
    clearError
  } = useSchedule();

  const [event, setEvent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Carregar evento
  useEffect(() => {
    const loadEvent = async () => {
      if (!id) {
        toast.error('ID do evento não fornecido');
        navigate('/schedule');
        return;
      }

      setIsLoading(true);
      clearError();

      try {
        let eventData = null;

        // Primeiro tenta buscar na lista de eventos já carregada
        if (events.length > 0) {
          eventData = events.find(event => event.id === id);
        }

        // Se não encontrou na lista, busca diretamente pelo ID
        if (!eventData) {
          console.log('Buscando evento diretamente pelo ID:', id);
          eventData = await getEventById(id);
        }

        if (eventData) {
          console.log('Evento encontrado:', eventData);
          setEvent(eventData);
        } else {
          throw new Error('Evento não encontrado');
        }
      } catch (err: any) {
        console.error('Erro ao carregar evento:', err);
        toast.error(err.message || 'Erro ao carregar evento');
        navigate('/schedule');
      } finally {
        setIsLoading(false);
      }
    };

    loadEvent();
  }, [id, events, getEventById, navigate, clearError]);

  // Limpar erro quando o componente desmontar
  useEffect(() => {
    return () => {
      clearError();
    };
  }, [clearError]);

  const handleDelete = async () => {
    if (!event) return;

    try {
      const success = await deleteEvent(event.id);
      if (success) {
        toast.success('Evento excluído com sucesso!');
        navigate('/schedule');
      } else {
        throw new Error('Falha ao excluir evento');
      }
    } catch (err: any) {
      console.error('Erro ao excluir evento:', err);
      toast.error(err.message || 'Erro ao excluir evento');
    } finally {
      setShowDeleteConfirm(false);
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

  const getStatusLabel = (status: string) => {
    const labels = {
      confirmed: 'Confirmado',
      pending: 'Pendente',
      cancelled: 'Cancelado'
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      confirmed: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-700',
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-700',
      cancelled: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-200 dark:border-red-700'
    };
    return colors[status as keyof typeof colors];
  };

  const getEventTypeColor = (type: string) => {
    const colors = {
      meeting: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700',
      campaign: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-700',
      speech: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-700',
      visit: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900 dark:text-purple-200 dark:border-purple-700',
      other: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900 dark:text-gray-200 dark:border-gray-700'
    };
    return colors[type as keyof typeof colors] || colors.other;
  };

  const canEdit = user && (user.role === 'super' || user.role ==='admin'|| user.role ==='manager' || event?.created_by === user.id);
  const canDelete = user && (user.role === 'super' || user.role ==='admin'|| user.role ==='manager' || event?.created_by === user.id);

  if (isLoading) {
    return (
      <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Carregando evento...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto flex items-center justify-center">
            <div className="text-center">
              <p className="text-red-500 text-lg mb-4">Evento não encontrado</p>
              <Link
                to="/schedule"
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Voltar para Agenda
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          <div className="py-15">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              {/* Header */}
              <div className="mb-8">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => navigate('/schedule')}
                      className={`p-2 rounded-lg transition-colors ${
                        darkMode ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-200 text-gray-600'
                      }`}
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>

                    <div>
                      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Detalhes do Evento
                      </h1>
                      <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Informações completas do evento agendado
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {/* Botão Editar */}
                    {canEdit && (
                      <Link
                        to={`/schedule/edit/${event.id}`}
                        className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                          darkMode
                            ? 'hover:bg-gray-800 text-gray-300'
                            : 'hover:bg-gray-200 text-gray-600'
                        }`}
                      >
                        <Edit3 className="w-4 h-4 mr-2" />
                        Editar
                      </Link>
                    )}

                    {/* Botão Excluir */}
                    {canDelete && (
                      <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="flex items-center px-3 py-2 text-red-500 rounded-lg transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Excluir
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              {/* Conteúdo do Evento */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                {/* Header com Status */}
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h1 className="text-2xl font-bold text-white mb-2">
                        {event.title}
                      </h1>
                      <div className="flex flex-wrap gap-2">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(event.status)}`}>
                          {getStatusLabel(event.status)}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getEventTypeColor(event.event_type)}`}>
                          {getEventTypeLabel(event.event_type)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="mt-4 sm:mt-0 text-right">
                      <p className="text-blue-100 text-sm">Criado em</p>
                      <p className="text-white font-medium">
                        {new Date(event.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Detalhes */}
                <div className="p-6 space-y-6">
                  {/* Descrição */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                      Descrição
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      {event.description}
                    </p>
                  </div>

                  {/* Informações Principais */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Data e Hora */}
                    <div className="space-y-4">
                      <h4 className="font-semibold text-gray-900 dark:text-white flex items-center">
                        <Calendar className="w-5 h-5 mr-2 text-blue-500" />
                        Data e Horário
                      </h4>
                      <div className="space-y-2">
                        <div className="flex items-center text-gray-600 dark:text-gray-300">
                          <ClockIcon className="w-4 h-4 mr-2 text-green-500" />
                          <span>Início: {formatDate(event.start_date)}</span>
                        </div>
                        <div className="flex items-center text-gray-600 dark:text-gray-300">
                          <Clock className="w-4 h-4 mr-2 text-red-500" />
                          <span>Término: {formatDate(event.end_date)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Localização */}
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white flex items-center mb-3">
                        <MapPin className="w-5 h-5 mr-2 text-red-500" />
                        Localização
                      </h4>
                      <p className="text-gray-600 dark:text-gray-300">
                        {event.location}
                      </p>
                    </div>
                  </div>

                  {/* Participantes */}
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white flex items-center mb-3">
                      <Users className="w-5 h-5 mr-2 text-purple-500" />
                      Participantes
                    </h4>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      {event.attendees && event.attendees.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {event.attendees.map((attendeeId: string, index: number) => (
                            <div
                              key={attendeeId}
                              className="flex items-center px-3 py-1 bg-white dark:bg-gray-600 rounded-full border border-gray-200 dark:border-gray-500"
                            >
                              <User className="w-3 h-3 mr-1 text-gray-500" />
                              <span className="text-sm text-gray-700 dark:text-gray-300">
                                Usuário {index + 1}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                          Nenhum participante confirmado ainda.
                        </p>
                      )}
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        Total: {event.attendees?.length || 0} participantes
                      </p>
                    </div>
                  </div>

                  {/* Informações da Campanha */}
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                      Informações da Campanha
                    </h4>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <p className="text-gray-600 dark:text-gray-300">
                        <strong>Campanha:</strong> {event.campaign_id}
                      </p>
                      <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">
                        <strong>Criado por:</strong> Usuário {event.created_by}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Modal de Confirmação de Exclusão */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`rounded-2xl p-6 max-w-md w-full ${
            darkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
              Confirmar Exclusão
            </h3>

            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Tem certeza que deseja excluir o evento "{event.title}"? Esta ação não pode ser desfeita.
            </p>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${
                  darkMode
                    ? 'border-gray-600 hover:bg-gray-700 text-gray-300'
                    : 'border-gray-300 hover:bg-gray-100 text-gray-700'
                }`}
              >
                Cancelar
              </button>

              <button
                onClick={handleDelete}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};