import { z } from "zod";

const optionalUrl = z
  .string()
  .trim()
  .optional()
  .transform((value) => value || undefined)
  .refine((value) => !value || /^https?:\/\//.test(value), "Use a valid URL starting with http:// or https://");

const optionalEmail = z
  .string()
  .trim()
  .optional()
  .transform((value) => value || undefined)
  .refine((value) => !value || z.email().safeParse(value).success, "Use a valid email address");

export const profileSchema = z.object({
  name: z.string().trim().min(2, "Name is required"),
  shortBio: z.string().trim().min(10, "Short bio should be at least 10 characters"),
  fullBio: z.string().trim().min(30, "Full description should be at least 30 characters"),
  category: z.string().trim().min(2, "Category is required"),
  featured: z.boolean().default(false),
  email: optionalEmail,
  instagram: optionalUrl,
  website: optionalUrl,
  tags: z.array(z.string().trim().min(1)).default([]),
  customFields: z
    .array(
      z.object({
        label: z.string().trim().min(1, "Field label is required"),
        value: z.string().trim().min(1, "Field value is required"),
      }),
    )
    .default([]),
  existingGalleryImages: z.array(z.string()).default([]),
  removedGalleryImages: z.array(z.string()).default([]),
});

export const loginSchema = z.object({
  username: z.string().trim().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export const registrationSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name").max(100),
  phone: z.string().trim().min(7, "Enter a valid phone number").max(30),
  email: z.email("Enter a valid email address").trim().toLowerCase(),
  password: z.string().min(8, "Use at least 8 characters").max(100),
});

export const userLoginSchema = z.object({
  email: z.email("Enter a valid email address").trim().toLowerCase(),
  password: z.string().min(1, "Enter your password"),
});

export const calendarItemSchema = z.object({
  title: z.string().trim().min(2, "Give this item a title").max(120),
  location: z.string().trim().max(120).optional(),
  type: z.enum(["event", "deadline", "task"]),
  dueAt: z.string().min(1, "Choose a date and time"),
  notes: z.string().trim().max(500).optional(),
  durationMinutes: z.coerce.number().int().min(5).max(1440).optional(),
});

export const aboutSchema = z.object({
  title: z.string().trim().min(2, "Title is required"),
  body: z.string().trim().min(20, "Body should be at least 20 characters"),
});

export type ProfileInput = z.infer<typeof profileSchema>;
