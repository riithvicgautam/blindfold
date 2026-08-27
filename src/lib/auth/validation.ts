import { z } from "zod";

export const registerSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters.")
    .max(32, "Username must be under 32 characters.")
    .regex(/^[a-zA-Z0-9_-]+$/, "Use letters, numbers, hyphens and underscores only."),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Enter a valid email address.")
    .max(255, "Email must be under 255 characters."),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(128, "Password must be under 128 characters."),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address.").max(255),
  password: z.string().min(1, "Enter your password.").max(128),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

export type PublicUser = {
  id: string;
  username: string;
  email: string;
  createdAt: string;
};
