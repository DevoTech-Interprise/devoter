// src/hooks/useSchedule.ts
import { useState, useEffect } from 'react';
import { type ScheduleEvent, scheduleService } from '../../services/scheduleService';
import type { ScheduleEventFormData, UpdateScheduleEventFormData } from '../../schemas/schedule';
import { useUser } from '../../context/UserContext';

export const useSchedule = () => {
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useUser();

  const loadEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      let eventsData: ScheduleEvent[];

      if (user?.role === 'super') {
        // Super vê todos os eventos
        eventsData = await scheduleService.getAllEvents();
      } else if (user?.campaign_id) {
        // Usuários normais veem apenas eventos da sua campanha
        eventsData = await scheduleService.getEventsByCampaign(user.campaign_id);
      } else {
        eventsData = [];
      }

      setEvents(eventsData);
    } catch (err) {
      setError('Erro ao carregar agenda');
      console.error('Error loading events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, [user?.campaign_id]);

  const createEvent = async (eventData: ScheduleEventFormData): Promise<boolean> => {
    if (!user) {
      setError('Usuário não autenticado');
      return false;
    }

    setLoading(true);
    setError(null);
    try {
      await scheduleService.createEvent(eventData, user.id);
      await loadEvents();
      return true;
    } catch (err) {
      setError('Erro ao criar evento');
      console.error('Error creating event:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateEvent = async (id: string, eventData: UpdateScheduleEventFormData): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const updated = await scheduleService.updateEvent(id, eventData);
      if (!updated) {
        setError('Evento não encontrado');
        return false;
      }
      
      await loadEvents();
      return true;
    } catch (err) {
      setError('Erro ao atualizar evento');
      console.error('Error updating event:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteEvent = async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const success = await scheduleService.deleteEvent(id);
      if (!success) {
        setError('Evento não encontrado');
        return false;
      }
      
      await loadEvents();
      return true;
    } catch (err) {
      setError('Erro ao excluir evento');
      console.error('Error deleting event:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getEventsByDate = async (year: number, month: number): Promise<ScheduleEvent[]> => {
    try {
      let eventsData: ScheduleEvent[];

      if (user?.role === 'super') {
        eventsData = await scheduleService.getEventsByDate(year, month);
      } else if (user?.campaign_id) {
        const allEvents = await scheduleService.getEventsByDate(year, month);
        eventsData = allEvents.filter((event: { campaign_id: any; }) => event.campaign_id === user.campaign_id);
      } else {
        eventsData = [];
      }

      return eventsData;
    } catch (err) {
      console.error('Error getting events by date:', err);
      throw err;
    }
  };

  const getUpcomingEvents = async (days: number = 7): Promise<ScheduleEvent[]> => {
    try {
      let eventsData: ScheduleEvent[];

      if (user?.role === 'super') {
        eventsData = await scheduleService.getUpcomingEvents(days);
      } else if (user?.campaign_id) {
        const allEvents = await scheduleService.getUpcomingEvents(days);
        eventsData = allEvents.filter((event: { campaign_id: any; }) => event.campaign_id === user.campaign_id);
      } else {
        eventsData = [];
      }

      return eventsData;
    } catch (err) {
      console.error('Error getting upcoming events:', err);
      throw err;
    }
  };

  const addAttendee = async (eventId: string, userId: string): Promise<void> => {
    try {
      await scheduleService.addAttendee(eventId, userId);
      await loadEvents();
    } catch (err) {
      console.error('Error adding attendee:', err);
      throw err;
    }
  };

  const removeAttendee = async (eventId: string, userId: string): Promise<void> => {
    try {
      await scheduleService.removeAttendee(eventId, userId);
      await loadEvents();
    } catch (err) {
      console.error('Error removing attendee:', err);
      throw err;
    }
  };

  // Limpar erros
  const clearError = () => {
    setError(null);
  };

  return {
    // Estado
    events,
    loading,
    error,
    
    // Ações CRUD
    createEvent,
    updateEvent,
    deleteEvent,
    
    // Buscas
    getEventsByDate,
    getUpcomingEvents,
    
    // Participantes
    addAttendee,
    removeAttendee,
    
    // Utilitários
    refetch: loadEvents,
    clearError,
    
    // Permissões baseadas no usuário
    canCreate: !!user && (user.role === 'super' || user.role === 'admin' || user.role === 'manager'),
    canEdit: (event: ScheduleEvent) => {
      if (!user) return false;
      return user.role === 'super' || event.created_by === user.id;
    },
    canDelete: (event: ScheduleEvent) => {
      if (!user) return false;
      return user.role === 'super' || event.created_by === user.id;
    },
    canManageAll: user?.role === 'super',
    
    // Informações do usuário
    currentUser: user
  };
};