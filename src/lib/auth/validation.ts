import { z } from "zod";

export const usernameSchema = z
  .string()
  .trim()
  .min(3, "Username must be at least 3 characters.")
  .max(32, "Username must be under 32 characters.")
  .regex(/^[a-zA-Z0-9_-]+$/, "Use letters, numbers, hyphens and underscores only.");

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Enter a valid email address.")
  .max(255, "Email must be under 255 characters.");

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .max(128, "Password must be under 128 characters.");

export const registerSchema = z.object({
  username: usernameSchema,
  email: emailSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password.").max(128),
});

export const profileSchema = z.object({
  username: usernameSchema,
  displayName: z
    .string()
    .trim()
    .max(64, "Display name must be under 64 characters.")
    .optional(),
});

export const emailChangeSchema = z.object({
  email: emailSchema,
  currentPassword: z.string().min(1, "Enter your current password.").max(128),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password.").max(128),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, "Confirm your new password."),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Those passwords do not match.",
  });

export const forgotPasswordSchema = z.object({ email: emailSchema });

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Confirm your new password."),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Those passwords do not match.",
  });

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

export type PublicUser = {
  id: string;
  username: string;
  email: string;
  emailVerified: boolean;
  displayName: string | null;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

/** First non-empty label for a user, used across profile/dashboard headers. */
export function displayNameOf(user: Pick<PublicUser, "displayName" | "username">): string {
  return user.displayName?.trim() || user.username;
}

export function initialsOf(user: Pick<PublicUser, "displayName" | "username">): string {
  const label = displayNameOf(user);
  const parts = label.split(/\s+/).filter(Boolean);
  if (parts.length > 1) return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase();
  return label.slice(0, 2).toUpperCase();
}
