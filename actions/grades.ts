"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createGradeSchema } from "@/lib/validations/grades";

export type ActionState = { error?: string; success?: string };

async function requireTeacherOrAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated.");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const allowed = ["teacher", "class_teacher", "administrator", "director"];
  if (!profile || !allowed.includes(profile.role)) {
    throw new Error("Nemáš oprávnenie zadávať známky.");
  }
  return user;
}

export async function createGrade(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  let user;
  try {
    user = await requireTeacherOrAdmin();
  } catch (e) {
    return { error: (e as Error).message };
  }

  const parsed = createGradeSchema.safeParse({
    student_id: formData.get("student_id"),
    subject_id: formData.get("subject_id"),
    semester_id: formData.get("semester_id"),
    value: formData.get("value"),
    weight: formData.get("weight") || 1,
    comment: formData.get("comment") ?? "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Neplatné údaje." };
  }

  const supabase = await createClient();

  // teacher_id in `grades` must reference a row in `teachers`; for admins/
  // directors without a teachers row this insert will correctly fail RLS/FK
  // rather than silently mis-attributing the grade.
  const { error } = await supabase.from("grades").insert({
    ...parsed.data,
    comment: parsed.data.comment || null,
    teacher_id: user.id,
  });

  if (error) {
    return {
      error: error.message.includes("foreign key")
        ? "Tento používateľ nemá záznam učiteľa (teachers), preto nemôže zadávať známky."
        : error.message,
    };
  }

  revalidatePath("/dashboard/grades");
  return { success: "Známka bola zapísaná." };
}
