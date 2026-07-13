import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/actions/auth";
import { Button } from "@/components/ui/button";

const NAV_BY_ROLE: Record<string, { label: string; href: string }[]> = {
  administrator: [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Users", href: "/dashboard/users" },
    { label: "Classes", href: "/dashboard/classes" },
    { label: "Roles & Permissions", href: "/dashboard/roles" },
    { label: "School Settings", href: "/dashboard/settings" },
    { label: "Audit Log", href: "/dashboard/audit" },
  ],
  teacher: [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Class Register", href: "/dashboard/register" },
    { label: "Grades", href: "/dashboard/grades" },
    { label: "Homework", href: "/dashboard/homework" },
    { label: "Attendance", href: "/dashboard/attendance" },
  ],
  student: [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Grades", href: "/dashboard/grades" },
    { label: "Timetable", href: "/dashboard/timetable" },
    { label: "Homework", href: "/dashboard/homework" },
  ],
  parent: [
    { label: "Dashboard", href: "/dashboard" },
    { label: "My Children", href: "/dashboard/children" },
    { label: "Messages", href: "/dashboard/messages" },
  ],
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  const role = profile?.role ?? "guest";
  const navItems = NAV_BY_ROLE[role] ?? NAV_BY_ROLE.student;

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 shrink-0 border-r border-border bg-card p-4">
        <div className="mb-6 flex items-center gap-2 px-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
            E
          </div>
          <span className="font-semibold">EDUFAKE.SK</span>
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="block rounded-lg px-3 py-2 text-sm font-medium text-foreground/80 hover:bg-secondary hover:text-foreground"
            >
              {item.label}
            </a>
          ))}
        </nav>
      </aside>

      <div className="flex-1">
        <header className="flex items-center justify-between border-b border-border px-6 py-3">
          <div>
            <p className="text-sm font-medium">{profile?.full_name ?? user.email}</p>
            <p className="text-xs capitalize text-muted-foreground">{role.replace("_", " ")}</p>
          </div>
          <form action={logout}>
            <Button variant="secondary" type="submit">
              Sign out
            </Button>
          </form>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
