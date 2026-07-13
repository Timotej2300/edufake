"use server";

import { revalidatePath } from "next/cache";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { createUserSchema } from "@/lib/validations/users";

export type ActionState = { error?: string; success?: string };

async function requireAdmin() {
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

  if (profile?.role !== "administrator") {
    throw new Error("Only administrators can manage users.");
  }
  return user;
}

export async function createUser(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await requireAdmin();
  } catch (e) {
    return { error: (e as Error).message };
  }

  const parsed = createUserSchema.safeParse({
    full_name: formData.get("full_name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
    class_id: formData.get("class_id") ?? "",
    student_number: formData.get("student_number") ?? "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Neplatné údaje." };
  }

  const { full_name, email, password, role, class_id, student_number } =
    parsed.data;

  const admin = createAdminClient();

  // 1. Create the Auth user (this fires the DB trigger that inserts a
  //    `profiles` row with role='guest' by default).
  const { data: created, error: createError } =
    await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name },
    });

  if (createError || !created.user) {
    return {
      error:
        createError?.message?.includes("already been registered")
          ? "Používateľ s týmto emailom už existuje."
          : createError?.message ?? "Nepodarilo sa vytvoriť používateľa.",
    };
  }

  const userId = created.user.id;

  // 2. Set the real name + role on the profile the trigger just created.
  const { error: profileError } = await admin
    .from("profiles")
    .update({ role, full_name })
    .eq("id", userId);

  if (profileError) {
    return { error: `Používateľ vytvorený, ale zlyhalo nastavenie role: ${profileError.message}` };
  }

  // 3. Insert the role-specific row.
  if (role === "teacher" || role === "class_teacher") {
    const { error } = await admin.from("teachers").insert({ id: userId });
    if (error) return { error: `Profil vytvorený, ale zlyhal záznam učiteľa: ${error.message}` };
  } else if (role === "student") {
    const { error } = await admin.from("students").insert({
      id: userId,
      class_id: class_id || null,
      student_number: student_number || null,
    });
    if (error) return { error: `Profil vytvorený, ale zlyhal záznam žiaka: ${error.message}` };
  } else if (role === "parent") {
    const { error } = await admin.from("parents").insert({ id: userId });
    if (error) return { error: `Profil vytvorený, ale zlyhal záznam rodiča: ${error.message}` };
  }

  revalidatePath("/dashboard/users");
  return { success: `${full_name} bol vytvorený a nastavený ako ${role}.` };
}

export async function deleteUser(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await requireAdmin();
  } catch (e) {
    return { error: (e as Error).message };
  }

  const userId = formData.get("user_id") as string;
  if (!userId) return { error: "Chýba ID používateľa." };

  const admin = createAdminClient();
  // Deleting the auth user cascades to profiles (and from there to
  // teachers/students/parents) via the FK "on delete cascade" chain.
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) return { error: error.message };

  revalidatePath("/dashboard/users");
  return { success: "Používateľ bol zmazaný." };
}

export async function linkParentToStudent(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await requireAdmin();
  } catch (e) {
    return { error: (e as Error).message };
  }

  const parentId = formData.get("parent_id") as string;
  const studentId = formData.get("student_id") as string;
  if (!parentId || !studentId) return { error: "Vyber rodiča aj žiaka." };

  const admin = createAdminClient();
  const { error } = await admin
    .from("parent_student")
    .insert({ parent_id: parentId, student_id: studentId });

  if (error) {
    return {
      error: error.message.includes("duplicate")
        ? "Toto prepojenie už existuje."
        : error.message,
    };
  }

  revalidatePath("/dashboard/users");
  return { success: "Rodič bol prepojený so žiakom." };
}
