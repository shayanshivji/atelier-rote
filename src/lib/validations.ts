import { z } from "zod";

export const signUpSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const signInSchema = z.object({
  email: z.string().email("Valid email is required"),
  password: z.string().min(1, "Password is required"),
});

export const onboardingSchema = z.object({
  styles: z.array(z.string()).min(3, "Choose at least 3 styles").max(5, "Choose at most 5 styles"),
  colors: z.array(z.string()).min(2, "Choose at least 2 colors").max(4, "Choose at most 4 colors"),
  roomType: z.string().min(1, "Room type is required"),
  wallWidth: z.number().min(12, "Wall width must be at least 12 inches"),
  wallHeight: z.number().min(12, "Wall height must be at least 12 inches"),
  lighting: z.string().min(1, "Lighting preference is required"),
  budgetTier: z.string().min(1, "Budget tier is required"),
});

export const swapSchema = z.object({
  scheduledDate: z.string().min(1, "Date is required"),
  scheduledTime: z.string().min(1, "Time is required"),
  deliveryType: z.enum(["white-glove", "standard"]),
});

export const boardSchema = z.object({
  name: z.string().min(1, "Board name is required").max(50),
});
