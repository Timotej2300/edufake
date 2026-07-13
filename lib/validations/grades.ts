import { z } from "zod";

export const createGradeSchema = z.object({
  student_id: z.string().uuid("Vyber žiaka."),
  subject_id: z.string().uuid("Vyber predmet."),
  semester_id: z.string().uuid("Vyber semester."),
  value: z.coerce.number().min(1).max(5),
  weight: z.coerce.number().min(1).max(5).default(1),
  comment: z.string().optional(),
});
