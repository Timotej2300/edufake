import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CreateGradeForm } from "@/components/grades/create-grade-form";
import { SimpleTable } from "@/components/classes/simple-table";

export default async function GradesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = me?.role;
  const canEnterGrades = ["teacher", "class_teacher", "administrator", "director"].includes(
    role ?? ""
  );

  if (!canEnterGrades) {
    // Student / parent view: read-only list of their own grades.
    const { data: grades } = await supabase
      .from("grades")
      .select("value, comment, created_at, subjects(name)")
      .order("created_at", { ascending: false })
      .limit(50);

    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Známky</h1>
        <SimpleTable
          headers={["Predmet", "Známka", "Komentár", "Dátum"]}
          rows={(grades ?? []).map((g: any) => [
            g.subjects?.name ?? "—",
            g.value,
            g.comment ?? "—",
            new Date(g.created_at).toLocaleDateString("sk-SK"),
          ])}
        />
      </div>
    );
  }

  const [{ data: students }, { data: subjects }, { data: semesters }, { data: recentGrades }] =
    await Promise.all([
      supabase.from("profiles").select("id, full_name").eq("role", "student").order("full_name"),
      supabase.from("subjects").select("id, name").order("name"),
      supabase
        .from("semesters")
        .select("id, name, school_year_id, school_years(label)")
        .order("start_date", { ascending: false }),
      supabase
        .from("grades")
        .select(
          "value, comment, created_at, students!grades_student_id_fkey(profiles(full_name)), subjects(name)"
        )
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

  const semesterOptions = (semesters ?? []).map((s: any) => ({
    id: s.id,
    name: `${s.name} (${s.school_years?.label ?? ""})`,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Známky</h1>
        <p className="text-sm text-muted-foreground">Zapisuj a prezeraj známky žiakov.</p>
      </div>

      <CreateGradeForm
        students={students ?? []}
        subjects={subjects ?? []}
        semesters={semesterOptions}
      />

      <SimpleTable
        headers={["Žiak", "Predmet", "Známka", "Komentár", "Dátum"]}
        rows={(recentGrades ?? []).map((g: any) => [
          g.students?.profiles?.full_name ?? "—",
          g.subjects?.name ?? "—",
          g.value,
          g.comment ?? "—",
          new Date(g.created_at).toLocaleDateString("sk-SK"),
        ])}
      />
    </div>
  );
}
