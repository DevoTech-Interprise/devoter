// src/services/scheduleService.ts
import api from './api';

export interface ScheduleEvent {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  location: string;
  event_type: 'meeting' | 'campaign' | 'speech' | 'visit' | 'other';
  status: 'confirmed' | 'pending' | 'cancelled';
  campaign_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  color?: string;
}

export interface CreateScheduleEvent {
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  location: string;
  event_type: 'meeting' | 'campaign' | 'speech' | 'visit' | 'other';
  campaign_id: string | null;
  created_by: string;
  color?: string;
}

export interface UpdateScheduleEvent {
  title?: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  location?: string;
  event_type?: 'meeting' | 'campaign' | 'speech' | 'visit' | 'other';
  status?: 'confirmed' | 'pending' | 'cancelled';
  campaign_id?: string | null;
  color?: string;
}

class ScheduleService {
  // GET /events - Listar todos os eventos
  async getAllEvents(): Promise<ScheduleEvent[]> {
    const response = await api.get<ScheduleEvent[]>('/api/events');
    return response.data;
  }

  // GET /events/:id - Buscar evento por ID
  async getEventById(id: string): Promise<ScheduleEvent> {
    const response = await api.get<ScheduleEvent>(`/api/events/${id}`);
    return response.data;
  }

  // POST /events - Criar novo evento
  async createEvent(eventData: CreateScheduleEvent): Promise<ScheduleEvent> {
    const response = await api.post<ScheduleEvent>('/api/events', eventData);
    return response.data;
  }

  // PUT /events/:id - Atualizar evento
  async updateEvent(id: string, eventData: UpdateScheduleEvent): Promise<ScheduleEvent> {
    const response = await api.put<ScheduleEvent>(`/api/events/${id}`, eventData);
    return response.data;
  }

  // DELETE /events/:id - Excluir evento
  async deleteEvent(id: string): Promise<{ message: string }> {
    const response = await api.delete<{ message: string }>(`/api/events/${id}`);
    return response.data;
  }

  // Buscar eventos por campanha
  async getEventsByCampaign(campaignId: string): Promise<ScheduleEvent[]> {
    const allEvents = await this.getAllEvents();
    return allEvents.filter(event => event.campaign_id === campaignId);
  }

  // Buscar eventos por data (mês/ano)
  async getEventsByDate(year: number, month: number): Promise<ScheduleEvent[]> {
    const allEvents = await this.getAllEvents();
    return allEvents.filter(event => {
      const eventDate = new Date(event.start_date);
      return eventDate.getFullYear() === year && eventDate.getMonth() === month;
    });
  }

  // Buscar eventos por período
  async getEventsByDateRange(startDate: string, endDate: string): Promise<ScheduleEvent[]> {
    const allEvents = await this.getAllEvents();
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    return allEvents.filter(event => {
      const eventDate = new Date(event.start_date);
      return eventDate >= start && eventDate <= end;
    });
  }

  // Adicionar participante ao evento
  // async addAttendee(eventId: string, userId: string): Promise<ScheduleEvent> {
  //   const event = await this.getEventById(eventId);
  //   const attendees = event.attendees || [];
    
  //   if (!attendees.includes(userId)) {
  //     const updatedAttendees = [...attendees, userId];
  //     return this.updateEvent(eventId, { 
  //       ...event,
  //       attendees: updatedAttendees 
  //     });
  //   }
    
  //   return event;
  // }

  // Remover participante do evento
  // async removeAttendee(eventId: string, userId: string): Promise<ScheduleEvent> {
  //   const event = await this.getEventById(eventId);
  //   const attendees = event.attendees || [];
    
  //   const updatedAttendees = attendees.filter(id => id !== userId);
  //   return this.updateEvent(eventId, { 
  //     ...event,
  //     attendees: updatedAttendees 
  //   });
  // }

  // Buscar eventos do usuário
  // async getUserEvents(userId: string): Promise<ScheduleEvent[]> {
  //   const allEvents = await this.getAllEvents();
  //   return allEvents.filter(event => 
  //     event.attendees?.includes(userId) || event.created_by === userId
  //   );
  // }

  // Buscar próximos eventos (próximos 7 dias)
  async getUpcomingEvents(days: number = 7): Promise<ScheduleEvent[]> {
    const allEvents = await this.getAllEvents();
    const now = new Date();
    const future = new Date();
    future.setDate(now.getDate() + days);

    return allEvents.filter(event => {
      const eventDate = new Date(event.start_date);
      return eventDate >= now && eventDate <= future && event.status === 'confirmed';
    });
  }
}

export const scheduleService = new ScheduleService();