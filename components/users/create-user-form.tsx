"use client";

import { useActionState, useState } from "react";
import { createUser, type ActionState } from "@/actions/users";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

const ROLE_LABELS: Record<string, string> = {
  administrator: "Administrátor",
  director: "Riaditeľ",
  deputy_director: "Zástupca riaditeľa",
  teacher: "Učiteľ",
  class_teacher: "Triedny učiteľ",
  parent: "Rodič",
  student: "Žiak",
  school_psychologist: "Školský psychológ",
  economy: "Ekonómka",
  secretary: "Sekretárka",
  reception: "Recepcia",
  it_administrator: "IT administrátor",
  guest: "Hosť",
};

const initialState: ActionState = {};

export function CreateUserForm({
  classes,
}: {
  classes: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState(
    createUser,
    initialState
  );
  const [role, setRole] = useState("teacher");

  return (
    <Card className="p-5">
      <h2 className="mb-4 font-semibold">Nový používateľ</h2>
      <form action={formAction} className="space-y-4" key={state.success}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Meno a priezvisko</label>
            <Input name="full_name" required placeholder="Jana Nováková" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Email</label>
            <Input name="email" type="email" required placeholder="jana@edufake.sk" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Heslo</label>
            <Input name="password" type="password" required minLength={8} placeholder="min. 8 znakov" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Rola</label>
            <select
              name="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              {Object.entries(ROLE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {role === "student" && (
            <>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Trieda</label>
                <select
                  name="class_id"
                  className="w-full rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">— vyber triedu —</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Číslo žiaka</label>
                <Input name="student_number" placeholder="S2026001" />
              </div>
            </>
          )}
        </div>

        {state.error && (
          <p role="alert" className="text-sm text-destructive">
            {state.error}
          </p>
        )}
        {state.success && (
          <p className="text-sm text-primary">{state.success}</p>
        )}

        <Button type="submit" disabled={pending}>
          {pending ? "Vytváram…" : "Vytvoriť používateľa"}
        </Button>
      </form>
    </Card>
  );
}
