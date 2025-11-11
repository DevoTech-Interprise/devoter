// src/schemas/schedule.ts
import { z } from 'zod';

export const scheduleEventSchema = z.object({
  title: z.string()
    .min(1, 'Título é obrigatório')
    .max(100, 'Título deve ter no máximo 100 caracteres'),
  description: z.string()
    .min(1, 'Descrição é obrigatória')
    .max(500, 'Descrição deve ter no máximo 500 caracteres'),
  start_date: z.string()
    .min(1, 'Data de início é obrigatória'),
  end_date: z.string()
    .min(1, 'Data de término é obrigatória'),
  location: z.string()
    .min(1, 'Localização é obrigatória')
    .max(200, 'Localização deve ter no máximo 200 caracteres'),
  event_type: z.enum(['meeting', 'campaign', 'speech', 'visit', 'other']),
  campaign_id: z.string()
    .min(1, 'Campanha é obrigatória')
}).refine(
  (data) => new Date(data.end_date) > new Date(data.start_date),
  {
    message: "Data de término deve ser depois da data de início",
    path: ["end_date"]
  }
);

export const updateScheduleEventSchema = scheduleEventSchema.partial().extend({
  status: z.enum(['confirmed', 'pending', 'cancelled']).optional(),
  attendees: z.array(z.string()).optional()
});

export type ScheduleEventFormData = z.infer<typeof scheduleEventSchema>;
export type UpdateScheduleEventFormData = z.infer<typeof updateScheduleEventSchema>;