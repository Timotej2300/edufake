import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CreateUserForm } from "@/components/users/create-user-form";
import { UserList } from "@/components/users/user-list";
import { LinkParentForm } from "@/components/users/link-parent-form";

export default async function UsersPage() {
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

  const [{ data: users }, { data: classes }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, email, role, is_active")
      .order("created_at", { ascending: false }),
    supabase.from("classes").select("id, name").order("name"),
  ]);

  const parents = (users ?? []).filter((u) => u.role === "parent");
  const students = (users ?? []).filter((u) => u.role === "student");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Používatelia</h1>
        <p className="text-sm text-muted-foreground">
          Vytváraj a spravuj učiteľov, žiakov, rodičov a ostatný personál.
        </p>
      </div>

      <CreateUserForm classes={classes ?? []} />
      <LinkParentForm parents={parents} students={students} />
      <UserList users={users ?? []} />
    </div>
  );
}
