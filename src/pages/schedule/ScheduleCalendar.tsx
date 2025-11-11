// src/pages/Schedule/ScheduleCalendar.tsx
import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  Calendar, 
  List, 
  ChevronLeft, 
  ChevronRight,
  MapPin,
  Users,
  Clock
} from 'lucide-react';
import { useSchedule } from '../../pages/hooks/useSchedule';
import { useUser } from '../../context/UserContext';
import Sidebar from '../../components/Sidebar';

export const ScheduleCalendar: React.FC = () => {
  const { events, loading, error, canCreate } = useSchedule();
  const { user } = useUser();
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [filterStatus, setFilterStatus] = useState<'all' | 'confirmed' | 'pending' | 'cancelled'>('all');
  const [filterType, setFilterType] = useState<'all' | 'meeting' | 'campaign' | 'speech' | 'visit' | 'other'>('all');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  // Filtrar eventos
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      if (filterStatus !== 'all' && event.status !== filterStatus) return false;
      if (filterType !== 'all' && event.event_type !== filterType) return false;
      return true;
    });
  }, [events, filterStatus, filterType]);

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

  const getEventTypeDotColor = (type: string) => {
    const colors = {
      meeting: 'bg-blue-500',
      campaign: 'bg-green-500',
      speech: 'bg-yellow-500',
      visit: 'bg-purple-500',
      other: 'bg-gray-500'
    };
    return colors[type as keyof typeof colors] || colors.other;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      confirmed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    };
    return colors[status as keyof typeof colors];
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

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Funções do calendário
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getEventsForDay = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return filteredEvents.filter(event => {
      const eventDate = new Date(event.start_date);
      return eventDate.getDate() === date.getDate() &&
             eventDate.getMonth() === date.getMonth() &&
             eventDate.getFullYear() === date.getFullYear();
    });
  };

  const isToday = (day: number) => {
    const today = new Date();
    return day === today.getDate() &&
           currentDate.getMonth() === today.getMonth() &&
           currentDate.getFullYear() === today.getFullYear();
  };

  // Gerar dias do calendário
  const calendarDays = useMemo(() => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Dias do mês anterior
    const prevMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    const daysInPrevMonth = getDaysInMonth(prevMonth);
    for (let i = daysInPrevMonth - firstDay + 1; i <= daysInPrevMonth; i++) {
      days.push({ day: i, isCurrentMonth: false });
    }

    // Dias do mês atual
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ day: i, isCurrentMonth: true });
    }

    // Dias do próximo mês
    const totalCells = 42; // 6 semanas
    const nextDays = totalCells - days.length;
    for (let i = 1; i <= nextDays; i++) {
      days.push({ day: i, isCurrentMonth: false });
    }

    return days;
  }, [currentDate]);

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  if (loading) {
    return (
      <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Carregando agenda...</p>
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
          <div className="py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {/* Header */}
              <div className="mb-8">
                <div className="flex justify-between items-center">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                      Agenda do Político
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">
                      {user?.role === 'super' 
                        ? 'Visualizando todas as campanhas' 
                        : `Agenda da campanha ${user?.campaign_id || 'atual'}`}
                    </p>
                  </div>
                  
                  {canCreate && (
                    <Link
                      to="/schedule/create"
                      className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      <Plus className="w-5 h-5 mr-2" />
                      Novo Evento
                    </Link>
                  )}
                </div>

                {/* Filtros e Controles */}
                <div className="mt-6 flex flex-col sm:flex-row gap-4">
                  {/* View Mode Toggle */}
                  <div className="flex bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-1">
                    <button
                      onClick={() => setViewMode('calendar')}
                      className={`flex items-center px-3 py-2 rounded ${
                        viewMode === 'calendar' 
                          ? 'bg-blue-500 text-white' 
                          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      Calendário
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`flex items-center px-3 py-2 rounded ${
                        viewMode === 'list' 
                          ? 'bg-blue-500 text-white' 
                          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <List className="w-4 h-4 mr-2" />
                      Lista
                    </button>
                  </div>

                  {/* Filtros */}
                  <div className="flex flex-wrap gap-2">
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value as any)}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">Todos os status</option>
                      <option value="confirmed">Confirmados</option>
                      <option value="pending">Pendentes</option>
                      <option value="cancelled">Cancelados</option>
                    </select>

                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value as any)}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">Todos os tipos</option>
                      <option value="meeting">Reunião</option>
                      <option value="campaign">Campanha</option>
                      <option value="speech">Discurso</option>
                      <option value="visit">Visita</option>
                      <option value="other">Outros</option>
                    </select>
                  </div>
                </div>

                {/* Stats */}
                <div className="mt-4 flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                  <span>
                    {filteredEvents.length} evento{filteredEvents.length !== 1 ? 's' : ''} encontrado{filteredEvents.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              {/* Conteúdo */}
              {viewMode === 'list' ? (
                /* Vista de Lista */
                <div className="space-y-4">
                  {filteredEvents.map((event) => (
                    <div key={event.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                      <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              {event.title}
                            </h3>
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(event.status)}`}>
                                {event.status === 'confirmed' ? 'Confirmado' : 
                                 event.status === 'pending' ? 'Pendente' : 'Cancelado'}
                              </span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getEventTypeColor(event.event_type)}`}>
                                {event.event_type === 'meeting' ? 'Reunião' :
                                 event.event_type === 'campaign' ? 'Campanha' :
                                 event.event_type === 'speech' ? 'Discurso' :
                                 event.event_type === 'visit' ? 'Visita' : 'Outro'}
                              </span>
                            </div>
                          </div>
                          
                          <p className="text-gray-600 dark:text-gray-300 mb-3">
                            {event.description}
                          </p>
                          
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              <span>{formatDate(event.start_date)}</span>
                            </div>
                            <span>•</span>
                            <div className="flex items-center">
                              <span>📍 {event.location}</span>
                            </div>
                            <span>•</span>
                            <div className="flex items-center">
                              <span>👥 {event.attendees?.length || 0} participantes</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Link
                            to={`/schedule/${event.id}`}
                            className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm transition-colors"
                          >
                            Ver Detalhes
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}

                  {filteredEvents.length === 0 && (
                    <div className="text-center py-12">
                      <Calendar className="w-24 h-24 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        Nenhum evento encontrado
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400 mb-4">
                        {canCreate 
                          ? 'Comece criando o primeiro evento da agenda' 
                          : 'Ainda não há eventos agendados para esta campanha'}
                      </p>
                      {canCreate && (
                        <Link
                          to="/schedule/create"
                          className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                        >
                          <Plus className="w-5 h-5 mr-2" />
                          Criar Primeiro Evento
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                /* Vista de Calendário COMPLETA */
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                  {/* Cabeçalho do Calendário */}
                  <div className="flex flex-col sm:flex-row justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-4 mb-4 sm:mb-0">
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                      </h2>
                      <button
                        onClick={goToToday}
                        className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      >
                        Hoje
                      </button>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => navigateMonth('prev')}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      </button>
                      <button
                        onClick={() => navigateMonth('next')}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      </button>
                    </div>
                  </div>

                  {/* Dias da semana */}
                  <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700">
                    {dayNames.map(day => (
                      <div key={day} className="p-4 text-center text-sm font-medium text-gray-500 dark:text-gray-400 border-r border-gray-200 dark:border-gray-700 last:border-r-0">
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Grid do calendário */}
                  <div className="grid grid-cols-7">
                    {calendarDays.map(({ day, isCurrentMonth }, index) => {
                      const dayEvents = getEventsForDay(day);
                      const isTodayFlag = isCurrentMonth && isToday(day);
                      
                      return (
                        <div
                          key={index}
                          className={`min-h-[120px] p-2 border-r border-b border-gray-200 dark:border-gray-700 last:border-r-0
                            ${isCurrentMonth 
                              ? 'bg-white dark:bg-gray-800' 
                              : 'bg-gray-50 dark:bg-gray-900 text-gray-400 dark:text-gray-600'
                            }
                            ${isTodayFlag ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                          `}
                        >
                          <div className={`flex justify-between items-start mb-1 ${
                            !isCurrentMonth ? 'opacity-50' : ''
                          }`}>
                            <span className={`text-sm font-medium ${
                              isTodayFlag 
                                ? 'bg-blue-500 text-white w-6 h-6 rounded-full flex items-center justify-center'
                                : 'text-gray-900 dark:text-white'
                            }`}>
                              {day}
                            </span>
                            {isCurrentMonth && canCreate && (
                              <Link
                                to="/schedule/create"
                                className="w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-blue-600 transition-colors opacity-0 hover:opacity-100"
                                title="Adicionar evento"
                              >
                                <Plus className="w-3 h-3" />
                              </Link>
                            )}
                          </div>
                          
                          {/* Eventos do dia */}
                          <div className="space-y-1 max-h-20 overflow-y-auto">
                            {dayEvents.slice(0, 3).map((event, eventIndex) => (
                              <div
                                key={eventIndex}
                                className={`p-1 rounded text-xs cursor-pointer transition-colors ${getEventTypeColor(event.event_type)} hover:opacity-80`}
                                onClick={() => setSelectedEvent(event)}
                              >
                                <div className="flex items-center space-x-1">
                                  <div className={`w-2 h-2 rounded-full ${getEventTypeDotColor(event.event_type)}`}></div>
                                  <span className="font-medium truncate">{event.title}</span>
                                </div>
                                <div className="flex items-center space-x-1 text-gray-600 dark:text-gray-400 mt-1">
                                  <Clock className="w-3 h-3" />
                                  <span>{formatTime(event.start_date)}</span>
                                </div>
                              </div>
                            ))}
                            {dayEvents.length > 3 && (
                              <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                                +{dayEvents.length - 3} mais
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Modal de Detalhes do Evento */}
              {selectedEvent && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                          {selectedEvent.title}
                        </h3>
                        <button
                          onClick={() => setSelectedEvent(null)}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        >
                          <ChevronRight className="w-6 h-6" />
                        </button>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedEvent.status)}`}>
                            {selectedEvent.status === 'confirmed' ? 'Confirmado' : 
                             selectedEvent.status === 'pending' ? 'Pendente' : 'Cancelado'}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getEventTypeColor(selectedEvent.event_type)}`}>
                            {selectedEvent.event_type === 'meeting' ? 'Reunião' :
                             selectedEvent.event_type === 'campaign' ? 'Campanha' :
                             selectedEvent.event_type === 'speech' ? 'Discurso' :
                             selectedEvent.event_type === 'visit' ? 'Visita' : 'Outro'}
                          </span>
                        </div>

                        <p className="text-gray-600 dark:text-gray-300">
                          {selectedEvent.description}
                        </p>

                        <div className="space-y-2">
                          <div className="flex items-center space-x-3">
                            <Calendar className="w-5 h-5 text-gray-400" />
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {formatDate(selectedEvent.start_date)}
                              </p>
                              {selectedEvent.end_date && (
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  até {formatDate(selectedEvent.end_date)}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center space-x-3">
                            <MapPin className="w-5 h-5 text-gray-400" />
                            <span className="text-sm text-gray-600 dark:text-gray-300">
                              {selectedEvent.location}
                            </span>
                          </div>

                          {selectedEvent.attendees && selectedEvent.attendees.length > 0 && (
                            <div className="flex items-center space-x-3">
                              <Users className="w-5 h-5 text-gray-400" />
                              <span className="text-sm text-gray-600 dark:text-gray-300">
                                {selectedEvent.attendees.length} participante{selectedEvent.attendees.length !== 1 ? 's' : ''}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex space-x-3 pt-4">
                          <Link
                            to={`/schedule/${selectedEvent.id}`}
                            className="flex-1 bg-blue-500 text-white text-center py-2 rounded-lg hover:bg-blue-600 transition-colors"
                          >
                            Ver Detalhes
                          </Link>
                          <button
                            onClick={() => setSelectedEvent(null)}
                            className="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 py-2 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                          >
                            Fechar
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};