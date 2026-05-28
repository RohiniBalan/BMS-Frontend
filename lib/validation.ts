import { z } from "zod";

const passwordRules = z
  .string()
  .min(6, "Minimum 6 characters")
  .max(16, "Maximum 16 characters")
  .regex(/^[A-Z]/, "Must start with a capital letter")
  .regex(/[a-z]/, "At least 1 lowercase letter required")
  .regex(/[0-9]/, "At least 1 number required")
  .regex(/[@$!%*?&]/, "At least 1 special character required");


export const signupSchema = z
  .object({
    fullName: z
      .string()
      .min(1, "Name is required")
      .regex(/^[A-Za-z.\s]+$/, "Enter valid name"),

    email: z
      .string()
      .trim()
      .toLowerCase()
      .email("Enter a valid email address"),

    password: passwordRules,

    confirmPassword: z.string(),

    phone: z
      .string()
      .regex(/^\d{10}$/, "Invalid phone number"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

  
export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Enter a valid email address"),

  password: passwordRules,
});

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Enter a valid email address"),
});

export const resetPasswordSchema = z
  .object({
    password: passwordRules,
    confirmPassword: z.string().min(6, "Minimum 6 characters"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
