// src/pages/hooks/useSchedule.ts
import { useState, useEffect, useCallback } from 'react';
import { scheduleService, type ScheduleEvent, type CreateScheduleEvent, type UpdateScheduleEvent } from '../../services/scheduleService';
import { useUser } from '../../context/UserContext';

export const useSchedule = () => {
  const { user } = useUser();
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carregar todos os eventos
  const loadEvents = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);
    
    try {
      let eventsData: ScheduleEvent[] = [];

      if (user.role === 'super') {
        // Super usuário vê todos os eventos
        eventsData = await scheduleService.getAllEvents();
      } else if (user.campaign_id) {
        // Usuários normais veem apenas eventos da sua campanha
        eventsData = await scheduleService.getEventsByCampaign(user.campaign_id);
      } 
      // else {
      //   // Se não tem campanha, busca eventos onde é participante
      //   eventsData = await scheduleService.getUserEvents(user.id);
      // }

      setEvents(eventsData);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar eventos');
      console.error('Erro ao carregar eventos:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Carregar eventos na inicialização
  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // Buscar evento por ID
  const getEventById = useCallback(async (id: string): Promise<ScheduleEvent | null> => {
    try {
      const event = await scheduleService.getEventById(id);
      return event;
    } catch (err: any) {
      setError(err.message || 'Erro ao buscar evento');
      console.error('Erro ao buscar evento:', err);
      return null;
    }
  }, []);

  // Criar evento
  const createEvent = useCallback(async (eventData: CreateScheduleEvent): Promise<ScheduleEvent | null> => {
    if (!user) {
      setError('Usuário não autenticado');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      // Adiciona o usuário atual como criador
      const eventWithUser = {
        ...eventData,
        created_by: user.id,
        status: 'pending' as const, // Status padrão
      };

      const newEvent = await scheduleService.createEvent(eventWithUser);
      await loadEvents(); // Recarregar lista
      return newEvent;
    } catch (err: any) {
      setError(err.message || 'Erro ao criar evento');
      console.error('Erro ao criar evento:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, loadEvents]);

  // Atualizar evento
  const updateEvent = useCallback(async (id: string, eventData: UpdateScheduleEvent): Promise<ScheduleEvent | null> => {
    setLoading(true);
    setError(null);

    try {
      const updatedEvent = await scheduleService.updateEvent(id, eventData);
      if (updatedEvent) {
        await loadEvents(); // Recarregar lista
      }
      return updatedEvent;
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar evento');
      console.error('Erro ao atualizar evento:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [loadEvents]);

  // Excluir evento
  const deleteEvent = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      await scheduleService.deleteEvent(id);
      await loadEvents(); // Recarregar lista
      return true;
    } catch (err: any) {
      setError(err.message || 'Erro ao excluir evento');
      console.error('Erro ao excluir evento:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadEvents]);

  // Adicionar participante
  // const addAttendee = useCallback(async (eventId: string, userId: string): Promise<ScheduleEvent | null> => {
  //   try {
  //     const updatedEvent = await scheduleService.addAttendee(eventId, userId);
  //     if (updatedEvent) {
  //       await loadEvents(); // Recarregar lista
  //     }
  //     return updatedEvent;
  //   } catch (err: any) {
  //     setError(err.message || 'Erro ao adicionar participante');
  //     console.error('Erro ao adicionar participante:', err);
  //     return null;
  //   }
  // }, [loadEvents]);

  // Remover participante
  // const removeAttendee = useCallback(async (eventId: string, userId: string): Promise<ScheduleEvent | null> => {
  //   try {
  //     const updatedEvent = await scheduleService.removeAttendee(eventId, userId);
  //     if (updatedEvent) {
  //       await loadEvents(); // Recarregar lista
  //     }
  //     return updatedEvent;
  //   } catch (err: any) {
  //     setError(err.message || 'Erro ao remover participante');
  //     console.error('Erro ao remover participante:', err);
  //     return null;
  //   }
  // }, [loadEvents]);

  // Buscar próximos eventos
  const getUpcomingEvents = useCallback(async (days: number = 7): Promise<ScheduleEvent[]> => {
    try {
      return await scheduleService.getUpcomingEvents(days);
    } catch (err: any) {
      setError(err.message || 'Erro ao buscar próximos eventos');
      console.error('Erro ao buscar próximos eventos:', err);
      return [];
    }
  }, []);

  // Buscar eventos por data
  const getEventsByDate = useCallback(async (year: number, month: number): Promise<ScheduleEvent[]> => {
    try {
      return await scheduleService.getEventsByDate(year, month);
    } catch (err: any) {
      setError(err.message || 'Erro ao buscar eventos por data');
      console.error('Erro ao buscar eventos por data:', err);
      return [];
    }
  }, []);

  // Limpar erro
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Verificar se usuário pode criar eventos
  const canCreate = user && (user.role === 'super' || user.role === 'admin' || user.role === 'manager');

  return {
    // Estado
    events,
    loading,
    error,
    
    // Ações
    createEvent,
    updateEvent,
    deleteEvent,
    getEventById,
    // addAttendee,
    // removeAttendee,
    getUpcomingEvents,
    getEventsByDate,
    loadEvents,
    clearError,
    
    // Permissões
    canCreate,
    
    // Informações do usuário atual
    currentUser: user
  };
};