import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";

async function AdminOverview() {
  const supabase = await createClient();

  const [{ count: studentCount }, { count: teacherCount }, { count: classCount }] =
    await Promise.all([
      supabase.from("students").select("*", { count: "exact", head: true }),
      supabase.from("teachers").select("*", { count: "exact", head: true }),
      supabase.from("classes").select("*", { count: "exact", head: true }),
    ]);

  const stats = [
    { label: "Students", value: studentCount ?? 0 },
    { label: "Teachers", value: teacherCount ?? 0 },
    { label: "Classes", value: classCount ?? 0 },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {stats.map((s) => (
        <Card key={s.label} className="p-5">
          <p className="text-sm text-muted-foreground">{s.label}</p>
          <p className="mt-1 text-3xl font-semibold">{s.value}</p>
        </Card>
      ))}
    </div>
  );
}

async function StudentOverview(userId: string) {
  const supabase = await createClient();

  const [{ data: homework }, { data: grades }] = await Promise.all([
    supabase
      .from("homework_submissions")
      .select("status, homework(title, due_date)")
      .eq("student_id", userId)
      .order("homework(due_date)", { ascending: true })
      .limit(5),
    supabase
      .from("grades")
      .select("value, subjects(name), created_at")
      .eq("student_id", userId)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <Card className="p-5">
        <h2 className="mb-3 font-semibold">Upcoming homework</h2>
        {!homework?.length && (
          <p className="text-sm text-muted-foreground">Nothing due — you&apos;re all caught up.</p>
        )}
        <ul className="space-y-2">
          {(homework as any[])?.map((h, i) => (
            <li key={i} className="text-sm">
              {h.homework?.title} — due {h.homework?.due_date}
              <span className="ml-2 text-xs capitalize text-muted-foreground">{h.status}</span>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="p-5">
        <h2 className="mb-3 font-semibold">Recent grades</h2>
        {!grades?.length && (
          <p className="text-sm text-muted-foreground">No grades recorded yet.</p>
        )}
        <ul className="space-y-2">
          {(grades as any[])?.map((g, i) => (
            <li key={i} className="flex justify-between text-sm">
              <span>{g.subjects?.name}</span>
              <span className="font-medium">{g.value}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">
          Welcome back{profile?.full_name ? `, ${profile.full_name}` : ""}
        </h1>
        <p className="text-sm text-muted-foreground">Here&apos;s what&apos;s happening today.</p>
      </div>

      {profile?.role === "administrator" && <AdminOverview />}
      {profile?.role === "student" && (await StudentOverview(user.id))}
      {!["administrator", "student"].includes(profile?.role ?? "") && (
        <Card className="p-5 text-sm text-muted-foreground">
          Role-specific widgets for <span className="font-medium">{profile?.role}</span> are
          the next module to build out.
        </Card>
      )}
    </div>
  );
}
