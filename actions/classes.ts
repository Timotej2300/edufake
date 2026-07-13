"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  createClassSchema,
  createSubjectSchema,
  createSchoolYearSchema,
} from "@/lib/validations/classes";

export type ActionState = { error?: string; success?: string };

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated.");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, school_id")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "administrator") {
    throw new Error("Only administrators can manage classes.");
  }
  return { user, schoolId: profile.school_id };
}

export async function createSchoolYear(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  let ctx;
  try {
    ctx = await requireAdmin();
  } catch (e) {
    return { error: (e as Error).message };
  }

  const parsed = createSchoolYearSchema.safeParse({
    label: formData.get("label"),
    start_date: formData.get("start_date"),
    end_date: formData.get("end_date"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Neplatné údaje." };
  }

  const supabase = await createClient();

  let schoolId = ctx.schoolId;
  if (!schoolId) {
    const { data: school } = await supabase.from("schools").select("id").limit(1).single();
    schoolId = school?.id ?? null;
  }
  if (!schoolId) return { error: "Škola nebola nájdená." };

  const { error } = await supabase.from("school_years").insert({
    school_id: schoolId,
    ...parsed.data,
  });

  if (error) return { error: error.message };

  revalidatePath("/dashboard/classes");
  return { success: `Školský rok ${parsed.data.label} bol vytvorený.` };
}

export async function createClass(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  let ctx;
  try {
    ctx = await requireAdmin();
  } catch (e) {
    return { error: (e as Error).message };
  }

  const parsed = createClassSchema.safeParse({
    name: formData.get("name"),
    school_year_id: formData.get("school_year_id"),
    class_teacher_id: formData.get("class_teacher_id") ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Neplatné údaje." };
  }

  const supabase = await createClient();

  let schoolId = ctx.schoolId;
  if (!schoolId) {
    const { data: school } = await supabase.from("schools").select("id").limit(1).single();
    schoolId = school?.id ?? null;
  }
  if (!schoolId) return { error: "Škola nebola nájdená." };

  const { name, school_year_id, class_teacher_id } = parsed.data;

  const { error } = await supabase.from("classes").insert({
    school_id: schoolId,
    school_year_id,
    name,
    class_teacher_id: class_teacher_id || null,
  });

  if (error) {
    return {
      error: error.message.includes("duplicate")
        ? "Trieda s týmto názvom už v danom ročníku existuje."
        : error.message,
    };
  }

  revalidatePath("/dashboard/classes");
  return { success: `Trieda ${name} bola vytvorená.` };
}

export async function createSubject(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  let ctx;
  try {
    ctx = await requireAdmin();
  } catch (e) {
    return { error: (e as Error).message };
  }

  const parsed = createSubjectSchema.safeParse({
    name: formData.get("name"),
    code: formData.get("code") ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Neplatné údaje." };
  }

  const supabase = await createClient();

  let schoolId = ctx.schoolId;
  if (!schoolId) {
    const { data: school } = await supabase.from("schools").select("id").limit(1).single();
    schoolId = school?.id ?? null;
  }
  if (!schoolId) return { error: "Škola nebola nájdená." };

  const { error } = await supabase.from("subjects").insert({
    school_id: schoolId,
    name: parsed.data.name,
    code: parsed.data.code || null,
  });

  if (error) return { error: error.message };

  revalidatePath("/dashboard/classes");
  return { success: `Predmet ${parsed.data.name} bol vytvorený.` };
}

export async function assignTeacherSubject(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await requireAdmin();
  } catch (e) {
    return { error: (e as Error).message };
  }

  const teacherId = formData.get("teacher_id") as string;
  const subjectId = formData.get("subject_id") as string;
  if (!teacherId || !subjectId) return { error: "Vyber učiteľa aj predmet." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("teacher_subjects")
    .insert({ teacher_id: teacherId, subject_id: subjectId });

  if (error) {
    return {
      error: error.message.includes("duplicate")
        ? "Toto priradenie už existuje."
        : error.message,
    };
  }

  revalidatePath("/dashboard/classes");
  return { success: "Učiteľ bol priradený k predmetu." };
}
