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

export const forgotPasswordSchema = z.object({
  email: z.string()
    .email("Email inválido")
    .min(1, "Email é obrigatório"),
});

export const resetPasswordSchema = z.object({
  
  newPassword: z.string()
    .min(8, "A senha deve ter pelo menos 8 caracteres")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
      "A senha deve conter pelo menos uma letra maiúscula, uma minúscula, um número e um caractere especial"),
  confirmPassword: z.string().min(1, "Confirmação de senha é obrigatória"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;
