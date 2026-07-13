import { z } from "zod";

export const userRoleValues = [
  "administrator",
  "director",
  "deputy_director",
  "teacher",
  "class_teacher",
  "parent",
  "student",
  "school_psychologist",
  "economy",
  "secretary",
  "reception",
  "it_administrator",
  "guest",
] as const;

export const createUserSchema = z.object({
  full_name: z.string().min(2, "Meno musí mať aspoň 2 znaky."),
  email: z.string().email("Zadaj platný email."),
  password: z.string().min(8, "Heslo musí mať aspoň 8 znakov."),
  role: z.enum(userRoleValues),
  // Only relevant when role === "student"
  class_id: z.string().uuid().optional().or(z.literal("")),
  student_number: z.string().optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
