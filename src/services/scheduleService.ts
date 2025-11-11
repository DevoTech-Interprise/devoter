// src/services/scheduleService.ts
export interface ScheduleEvent {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  location: string;
  event_type: 'meeting' | 'campaign' | 'speech' | 'visit' | 'other';
  status: 'confirmed' | 'pending' | 'cancelled';
  campaign_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  attendees?: string[]; // IDs dos usuários confirmados
  color?: string; // Cor do evento no calendário
}

export interface CreateScheduleEvent {
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  location: string;
  event_type: 'meeting' | 'campaign' | 'speech' | 'visit' | 'other';
  campaign_id: string;
}

export interface UpdateScheduleEvent extends Partial<CreateScheduleEvent> {
  status?: 'confirmed' | 'pending' | 'cancelled';
  attendees?: string[];
}

class ScheduleService {
  private events: ScheduleEvent[] = [];
  private currentId = 1;

  constructor() {
    this.initializeMockData();
  }

  private initializeMockData() {
    const baseDate = new Date();
    
    this.events = [
      {
        id: '1',
        title: 'Reunião com Lideranças Locais',
        description: 'Reunião importante com lideranças comunitárias para discutir projetos regionais.',
        start_date: new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() + 2, 14, 0).toISOString(),
        end_date: new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() + 2, 16, 0).toISOString(),
        location: 'Centro Comunitário - Centro',
        event_type: 'meeting',
        status: 'confirmed',
        campaign_id: 'campaign-1',
        created_by: '1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        attendees: ['1', '2', '3'],
        color: '#3B82F6'
      },
      {
        id: '2',
        title: 'Campanha no Bairro Jardim',
        description: 'Visita ao bairro para campanha eleitoral e contato com eleitores.',
        start_date: new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() + 5, 9, 0).toISOString(),
        end_date: new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() + 5, 17, 0).toISOString(),
        location: 'Praça Central - Bairro Jardim',
        event_type: 'campaign',
        status: 'confirmed',
        campaign_id: 'campaign-1',
        created_by: '1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        attendees: ['1', '4'],
        color: '#10B981'
      },
      {
        id: '3',
        title: 'Discurso na Câmara Municipal',
        description: 'Pronunciamento oficial na sessão da câmara municipal.',
        start_date: new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() + 7, 10, 0).toISOString(),
        end_date: new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() + 7, 12, 0).toISOString(),
        location: 'Câmara Municipal',
        event_type: 'speech',
        status: 'pending',
        campaign_id: 'campaign-1',
        created_by: '2',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        attendees: ['1'],
        color: '#F59E0B'
      },
      {
        id: '4',
        title: 'Visita a Escola Municipal',
        description: 'Visita à escola para inauguração de reforma e conversa com alunos.',
        start_date: new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() + 10, 8, 30).toISOString(),
        end_date: new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() + 10, 11, 0).toISOString(),
        location: 'Escola Municipal Professora Maria',
        event_type: 'visit',
        status: 'confirmed',
        campaign_id: 'campaign-2',
        created_by: '3',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        attendees: ['1', '3', '5'],
        color: '#8B5CF6'
      }
    ];
    this.currentId = 5;
  }

  private async delay(ms: number = 500): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Buscar todos os eventos
  async getAllEvents(): Promise<ScheduleEvent[]> {
    await this.delay(300);
    return [...this.events].sort((a, b) => 
      new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
    );
  }

  // Buscar evento por ID
  async getEventById(id: string): Promise<ScheduleEvent | null> {
    await this.delay(200);
    const event = this.events.find(item => item.id === id);
    return event || null;
  }

  // Buscar eventos por campanha
  async getEventsByCampaign(campaignId: string): Promise<ScheduleEvent[]> {
    await this.delay(300);
    return this.events.filter(event => event.campaign_id === campaignId);
  }

  // Buscar eventos por data (mês/ano)
  async getEventsByDate(year: number, month: number): Promise<ScheduleEvent[]> {
    await this.delay(300);
    return this.events.filter(event => {
      const eventDate = new Date(event.start_date);
      return eventDate.getFullYear() === year && eventDate.getMonth() === month;
    });
  }

  // Buscar eventos por período
  async getEventsByDateRange(startDate: string, endDate: string): Promise<ScheduleEvent[]> {
    await this.delay(300);
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    return this.events.filter(event => {
      const eventDate = new Date(event.start_date);
      return eventDate >= start && eventDate <= end;
    });
  }

  // Criar novo evento
  async createEvent(eventData: CreateScheduleEvent, userId: string): Promise<ScheduleEvent> {
    await this.delay(400);
    
    const colors = {
      meeting: '#3B82F6',
      campaign: '#10B981',
      speech: '#F59E0B',
      visit: '#8B5CF6',
      other: '#6B7280'
    };

    const newEvent: ScheduleEvent = {
      ...eventData,
      id: this.currentId.toString(),
      status: 'pending',
      created_by: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      attendees: [],
      color: colors[eventData.event_type]
    };

    this.events.push(newEvent);
    this.currentId++;
    
    return newEvent;
  }

  // Atualizar evento
  async updateEvent(id: string, eventData: UpdateScheduleEvent): Promise<ScheduleEvent | null> {
    await this.delay(400);
    
    const index = this.events.findIndex(item => item.id === id);
    if (index === -1) return null;

    this.events[index] = {
      ...this.events[index],
      ...eventData,
      updated_at: new Date().toISOString()
    };

    return this.events[index];
  }

  // Excluir evento
  async deleteEvent(id: string): Promise<boolean> {
    await this.delay(300);
    
    const index = this.events.findIndex(item => item.id === id);
    if (index === -1) return false;

    this.events.splice(index, 1);
    return true;
  }

  // Adicionar participante ao evento
  async addAttendee(eventId: string, userId: string): Promise<ScheduleEvent | null> {
    await this.delay(200);
    
    const event = this.events.find(item => item.id === eventId);
    if (!event) return null;

    if (!event.attendees?.includes(userId)) {
      event.attendees = [...(event.attendees || []), userId];
      event.updated_at = new Date().toISOString();
    }

    return event;
  }

  // Remover participante do evento
  async removeAttendee(eventId: string, userId: string): Promise<ScheduleEvent | null> {
    await this.delay(200);
    
    const event = this.events.find(item => item.id === eventId);
    if (!event) return null;

    event.attendees = event.attendees?.filter(id => id !== userId) || [];
    event.updated_at = new Date().toISOString();

    return event;
  }

  // Buscar eventos do usuário
  async getUserEvents(userId: string): Promise<ScheduleEvent[]> {
    await this.delay(300);
    return this.events.filter(event => 
      event.attendees?.includes(userId) || event.created_by === userId
    );
  }

  // Buscar próximos eventos (próximos 7 dias)
  async getUpcomingEvents(days: number = 7): Promise<ScheduleEvent[]> {
    await this.delay(300);
    const now = new Date();
    const future = new Date();
    future.setDate(now.getDate() + days);

    return this.events.filter(event => {
      const eventDate = new Date(event.start_date);
      return eventDate >= now && eventDate <= future && event.status === 'confirmed';
    });
  }
}

export const scheduleService = new ScheduleService();