import { z } from "zod";

export const createClassSchema = z.object({
  name: z.string().min(1, "Zadaj názov triedy."),
  school_year_id: z.string().uuid("Vyber školský rok."),
  class_teacher_id: z.string().uuid().optional().or(z.literal("")),
});

export const createSubjectSchema = z.object({
  name: z.string().min(1, "Zadaj názov predmetu."),
  code: z.string().optional(),
});

export const createSchoolYearSchema = z.object({
  label: z.string().min(4, "Napr. 2026/2027"),
  start_date: z.string().min(1, "Vyber dátum začiatku."),
  end_date: z.string().min(1, "Vyber dátum konca."),
});
