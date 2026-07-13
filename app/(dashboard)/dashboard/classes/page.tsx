import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  SchoolYearForm,
  ClassForm,
  SubjectForm,
  TeacherSubjectForm,
} from "@/components/classes/forms";
import { SimpleTable } from "@/components/classes/simple-table";

export default async function ClassesPage() {
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

  if (me?.role !== "administrator") {
    return (
      <div className="rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">
        Táto stránka je dostupná len pre administrátora.
      </div>
    );
  }

  const [
    { data: schoolYears },
    { data: classes },
    { data: subjects },
    { data: teachers },
    { data: teacherSubjects },
  ] = await Promise.all([
    supabase.from("school_years").select("id, label, start_date, end_date").order("start_date", { ascending: false }),
    supabase
      .from("classes")
      .select("id, name, school_years(label), profiles!classes_class_teacher_id_fkey(full_name)")
      .order("name"),
    supabase.from("subjects").select("id, name, code").order("name"),
    supabase.from("profiles").select("id, full_name").eq("role", "teacher").order("full_name"),
    supabase
      .from("teacher_subjects")
      .select("profiles(full_name), subjects(name)"),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Triedy a predmety</h1>
        <p className="text-sm text-muted-foreground">
          Nastav školské roky, triedy, predmety a priraď učiteľov.
        </p>
      </div>

      <SchoolYearForm />
      <SimpleTable
        headers={["Školský rok", "Začiatok", "Koniec"]}
        rows={(schoolYears ?? []).map((y) => [y.label, y.start_date, y.end_date])}
      />

      <ClassForm
        schoolYears={(schoolYears ?? []).map((y) => ({ id: y.id, label: y.label }))}
        teachers={teachers ?? []}
      />
      <SimpleTable
        headers={["Trieda", "Školský rok", "Triedny učiteľ"]}
        rows={(classes ?? []).map((c: any) => [
          c.name,
          c.school_years?.label ?? "—",
          c.profiles?.full_name ?? "— nepriradené —",
        ])}
      />

      <SubjectForm />
      <SimpleTable
        headers={["Predmet", "Skratka"]}
        rows={(subjects ?? []).map((s) => [s.name, s.code ?? "—"])}
      />

      <TeacherSubjectForm teachers={teachers ?? []} subjects={subjects ?? []} />
      <SimpleTable
        headers={["Učiteľ", "Predmet"]}
        rows={(teacherSubjects ?? []).map((ts: any) => [
          ts.profiles?.full_name ?? "—",
          ts.subjects?.name ?? "—",
        ])}
      />
    </div>
  );
}
