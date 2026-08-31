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

export const updateProfileSchema = z
  .object({
    username: usernameSchema.optional(),
    displayName: z
      .string()
      .trim()
      .min(1, "Display name cannot be empty.")
      .max(64, "Display name must be under 64 characters.")
      .nullable()
      .optional(),
    avatarUrl: z
      .string()
      .trim()
      .max(500_000, "That image is too large. Please pick a smaller one.")
      .nullable()
      .optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: "Nothing to update." });

export const updateEmailSchema = z.object({
  email: emailSchema,
  currentPassword: z.string().min(1, "Enter your current password.").max(128),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password.").max(128),
    newPassword: passwordSchema,
  })
  .refine((v) => v.currentPassword !== v.newPassword, {
    path: ["newPassword"],
    message: "Choose a password different from your current one.",
  });

export const deleteAccountSchema = z.object({
  currentPassword: z.string().min(1, "Enter your password to confirm.").max(128),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdateEmailInput = z.infer<typeof updateEmailSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>;
