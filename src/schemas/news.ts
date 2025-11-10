// src/schemas/news.ts
import { z } from 'zod';

export const newsSchema = z.object({
  title: z.string()
    .min(1, 'Título é obrigatório')
    .max(200, 'Título deve ter no máximo 200 caracteres'),
  body: z.string()
    .min(1, 'Conteúdo é obrigatório')
    .max(10000, 'Conteúdo muito longo'),
  image: z.string()
    .url('URL da imagem deve ser válida')
    .optional()
    .or(z.literal('')),
  campaign_id: z.string().optional().or(z.null()), // Adicione .or(z.null())
});

export const commentSchema = z.object({
  text: z.string()
    .min(1, 'Comentário não pode estar vazio')
    .max(500, 'Comentário muito longo')
});

export type NewsFormData = z.infer<typeof newsSchema>;
export type CommentFormData = z.infer<typeof commentSchema>;