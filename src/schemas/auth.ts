// src/schemas/auth.ts
import { z } from "zod";

export const loginSchema = z.object({
  login: z
    .string()
    .min(1, "Campo obrigatório")
    .refine(
      (val) =>
        /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(val) ||
        /^\+?\d{8,15}$/.test(val.replace(/\s|-/g, "")),
      "Digite um email ou telefone válido"
    ),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
});

export type LoginFormData = z.infer<typeof loginSchema>;
