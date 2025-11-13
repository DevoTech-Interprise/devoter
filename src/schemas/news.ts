// src/schemas/news.ts
import { z } from 'zod';

// Schema para validação do formulário
export const newsSchema = z.object({
  title: z.string()
    .min(1, 'Título é obrigatório')
    .max(200, 'Título deve ter no máximo 200 caracteres'),
  preview: z.string()
    .min(1, 'Preview é obrigatório')
    .max(500, 'Preview deve ter no máximo 500 caracteres'),
  content: z.string()
    .min(1, 'Conteúdo é obrigatório')
    .max(10000, 'Conteúdo muito longo'),
  image: z.instanceof(File)
    .optional()
    .refine((file) => !file || file.size <= 5 * 1024 * 1024, 'A imagem deve ter no máximo 5MB')
    .refine((file) => !file || ['image/jpeg', 'image/png', 'image/webp'].includes(file.type), 'Apenas imagens JPEG, PNG e WebP são suportadas'),
  campaign_id: z.string().optional().or(z.null()),
});

// Schema para validação de comentários
export const commentSchema = z.object({
  text: z.string()
    .min(1, 'Comentário não pode estar vazio')
    .max(500, 'Comentário muito longo')
});

export type NewsFormData = z.infer<typeof newsSchema>;
export type CommentFormData = z.infer<typeof commentSchema>;

// Schema para resposta da API (quando recebemos dados)
export const newsResponseSchema = z.object({
  id: z.string(),
  title: z.string(),
  preview: z.string(),
  content: z.string(),
  image: z.string().url().optional().or(z.literal('')),
  campaign_id: z.string().optional().or(z.null()),
  created_by: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  likes: z.number().optional().default(0),
  liked_by: z.array(z.string()).optional().default([]),
  comments: z.array(z.object({
    id: z.string(),
    user_id: z.string(),
    user_name: z.string(),
    text: z.string(),
    created_at: z.string()
  })).optional().default([])
});

export type NewsResponse = z.infer<typeof newsResponseSchema>;