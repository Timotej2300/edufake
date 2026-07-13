"use client";

import { useActionState } from "react";
import { linkParentToStudent, type ActionState } from "@/actions/users";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const initialState: ActionState = {};

export function LinkParentForm({
  parents,
  students,
}: {
  parents: { id: string; full_name: string }[];
  students: { id: string; full_name: string }[];
}) {
  const [state, formAction, pending] = useActionState(
    linkParentToStudent,
    initialState
  );

  return (
    <Card className="p-5">
      <h2 className="mb-4 font-semibold">Prepojiť rodiča so žiakom</h2>
      <form action={formAction} className="flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1.5 block text-sm font-medium">Rodič</label>
          <select
            name="parent_id"
            required
            className="min-w-48 rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            <option value="">— vyber rodiča —</option>
            {parents.map((p) => (
              <option key={p.id} value={p.id}>
                {p.full_name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Žiak</label>
          <select
            name="student_id"
            required
            className="min-w-48 rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            <option value="">— vyber žiaka —</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.full_name}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit" disabled={pending}>
          {pending ? "Prepájam…" : "Prepojiť"}
        </Button>
      </form>
      {state.error && <p className="mt-2 text-sm text-destructive">{state.error}</p>}
      {state.success && <p className="mt-2 text-sm text-primary">{state.success}</p>}
    </Card>
  );
}
