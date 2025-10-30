// src/schemas/auth.ts
import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(val),
      "Digite um email válido"
    ),
  phone: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^\+?\d{8,15}$/.test(val.replace(/\s|-/g, "")),
      "Digite um telefone válido"
    ),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
}).refine((data) => data.email || data.phone, {
  message: "Você deve fornecer um email ou telefone",
});

export type LoginFormData = z.infer<typeof loginSchema>;
